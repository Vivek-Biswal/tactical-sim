"""Authorization tests use mocked trusted verification, never client-decoded roles."""

import base64
import json
import time
import unittest
from copy import deepcopy
from types import SimpleNamespace
from unittest.mock import patch

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import HTTPException
from fastapi.testclient import TestClient
from google.auth import crypt, exceptions, jwt
from starlette.websockets import WebSocketDisconnect

from app.auth import validate_auth_configuration, verify_firebase_identity
from app.config import settings
from app.main import app
from app.persistence import checkpoint, restore_checkpoint
from app.scenario_engine.engine import engine_manager
from app.websocket.manager import ws_manager


def mock_token(label):
    header = (
        base64.urlsafe_b64encode(
            json.dumps({"alg": "RS256", "kid": "test-key"}).encode()
        )
        .decode()
        .rstrip("=")
    )
    payload = (
        base64.urlsafe_b64encode(json.dumps({"fixture": label}).encode())
        .decode()
        .rstrip("=")
    )
    return f"{header}.{payload}.test-signature"


def claims(uid, role="commander", **overrides):
    now = time.time()
    result = {
        "sub": uid,
        "user_id": uid,
        "aud": settings.FIREBASE_PROJECT_ID,
        "iss": f"https://securetoken.google.com/{settings.FIREBASE_PROJECT_ID}",
        "iat": now - 5,
        "auth_time": now - 10,
        "exp": now + 3600,
        "firebase": {"sign_in_provider": "google.com"},
        "name": f"Account {uid}",
        "tacticalRole": role,
    }
    result.update(overrides)
    return result


def packet(ws, kind):
    for _ in range(100):
        data = ws.receive_json()
        if data["type"] == kind:
            return data
    raise AssertionError(f"Missing {kind}")


class FirebaseAuthorizationTests(unittest.TestCase):
    def setUp(self):
        engine_manager.exercises.clear()
        ws_manager.active_connections.clear()
        ws_manager.room_locks.clear()
        self.fixtures = {
            mock_token("owner"): claims("owner", "instructor"),
            mock_token("other-owner"): claims("other-owner", "instructor"),
            mock_token("commander"): claims("commander"),
            mock_token("team"): claims("team", "team"),
            mock_token("other-team"): claims("other-team", "team"),
        }
        self.tokens = {
            name: mock_token(name)
            for name in ("owner", "other-owner", "commander", "team", "other-team")
        }
        mode = patch.object(settings, "AUTH_MODE", "firebase")
        mode.start()
        self.addCleanup(mode.stop)

        def trusted_verifier(token, transport, audience=None):
            self.assertEqual(audience, settings.FIREBASE_PROJECT_ID)
            if token not in self.fixtures:
                raise ValueError("Invalid signature")
            return deepcopy(self.fixtures[token])

        verifier = patch(
            "app.auth.id_token.verify_firebase_token", side_effect=trusted_verifier
        )
        verifier.start()
        self.addCleanup(verifier.stop)
        self.client = TestClient(app)
        self.client.__enter__()
        self.addCleanup(self.client.__exit__, None, None, None)
        response = self.client.post(
            "/api/exercises", json={}, headers=self.headers("owner")
        )
        self.assertEqual(response.status_code, 201)
        self.room = response.json()
        self.path = "/api/exercises/" + self.room["exerciseId"]

    def headers(self, user, key=False):
        result = {"Authorization": "Bearer " + self.tokens[user]}
        if key:
            result["X-Instructor-Key"] = self.room["instructorKey"]
        return result

    def start(self):
        response = self.client.post(
            self.path + "/control",
            json={"action": "start"},
            headers=self.headers("owner", True),
        )
        self.assertEqual(response.status_code, 200)

    def join(self, ws, user, role):
        ws.send_json(
            {
                "type": "JOIN",
                "role": role,
                "name": "Client-chosen label",
                "idToken": self.tokens[user],
                **(
                    {"instructorKey": self.room["instructorKey"]}
                    if role == "INSTRUCTOR"
                    else {}
                ),
            }
        )
        return packet(ws, "JOINED")

    def test_anonymous_and_forged_requests_cannot_use_room_keys(self):
        self.assertEqual(self.client.get("/api/health").status_code, 200)
        self.assertEqual(self.client.get("/api/scenarios").status_code, 200)
        self.assertEqual(self.client.post("/api/exercises", json={}).status_code, 401)
        self.assertEqual(self.client.get(self.path).status_code, 401)
        anonymous = self.client.get(
            self.path, headers={"Origin": settings.CORS_ORIGINS[0]}
        )
        self.assertEqual(anonymous.status_code, 401)
        self.assertEqual(
            anonymous.headers["access-control-allow-origin"], settings.CORS_ORIGINS[0]
        )
        self.assertEqual(
            self.client.get(
                self.path, headers={"X-Instructor-Key": self.room["instructorKey"]}
            ).status_code,
            401,
        )
        forged = {"Authorization": "Bearer " + mock_token("forged-instructor")}
        self.assertEqual(
            self.client.post("/api/exercises", json={}, headers=forged).status_code, 401
        )
        self.assertEqual(
            self.client.post(
                "/api/exercises", json={}, headers=self.headers("commander")
            ).status_code,
            201,
        )
        self.assertEqual(
            self.client.post(
                self.path + "/control",
                json={"action": "start"},
                headers=self.headers("commander", True),
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.post(
                self.path + "/control",
                json={"action": "start"},
                headers=self.headers("other-owner", True),
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.get(
                self.path, headers=self.headers("commander", True)
            ).status_code,
            403,
        )
        self.assertNotIn(
            "trueUnits",
            self.client.get(self.path, headers=self.headers("commander")).json(),
        )
        self.assertEqual(
            self.client.get(self.path, headers=self.headers("commander")).status_code,
            403,
        )
        self.assertEqual(
            self.client.get(
                self.path + "/decisions", headers=self.headers("commander")
            ).status_code,
            403,
        )
        preflight = self.client.options(
            self.path,
            headers={
                "Origin": settings.CORS_ORIGINS[0],
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization",
            },
        )
        self.assertEqual(preflight.status_code, 200)
        self.assertIn(
            "Authorization", preflight.headers["access-control-allow-headers"]
        )

    def test_verified_claims_validate_issuer_audience_time_and_known_role(self):
        token = mock_token("claim-check")
        for override in (
            {"aud": "other-project"},
            {"iss": "https://accounts.google.com"},
            {"exp": time.time() - 1},
            {"iat": time.time() + 120},
            {"auth_time": time.time() + 120},
            {"sub": ""},
            {"firebase": "malformed"},
            {"firebase": {"sign_in_provider": "anonymous"}},
            {"exp": True},
            {"auth_time": "yesterday"},
        ):
            with self.subTest(override=override):
                self.fixtures[token] = claims("checked", **override)
                self.assertEqual(
                    self.client.get(
                        self.path, headers={"Authorization": "Bearer " + token}
                    ).status_code,
                    401,
                )
        self.fixtures[token] = claims("checked", role="admin")
        self.assertEqual(
            self.client.get(
                self.path, headers={"Authorization": "Bearer " + token}
            ).status_code,
            403,
        )
        self.fixtures[token] = claims("checked")
        self.fixtures[token].pop("tacticalRole")
        self.assertEqual(verify_firebase_identity(token).role, "participant")

    def test_certificate_verification_failure_never_falls_back_to_demo(self):
        with patch(
            "app.auth.id_token.verify_firebase_token",
            side_effect=exceptions.TransportError("Certificate service unavailable"),
        ):
            response = self.client.post(
                "/api/exercises", json={}, headers=self.headers("owner")
            )
        self.assertEqual(response.status_code, 503)
        self.assertEqual(len(engine_manager.exercises), 1)

    def test_socket_roles_come_from_account_and_team_binding_survives_reconnect(self):
        for user, role in (
            ("commander", "INSTRUCTOR"),
            ("owner", "COMMANDER"),
            ("other-owner", "INSTRUCTOR"),
        ):
            with (
                self.subTest(user=user, role=role),
                self.client.websocket_connect(
                    "/ws/exercises/" + self.room["exerciseId"]
                ) as ws,
            ):
                ws.send_json(
                    {
                        "type": "JOIN",
                        "idToken": self.tokens[user],
                        "role": role,
                        "name": "Spoof",
                        "instructorKey": self.room["instructorKey"],
                    }
                )
                error = ws.receive_json()
                self.assertEqual(error["type"], "ERROR")
                self.assertEqual(error["code"], 403)
        with self.client.websocket_connect(
            "/ws/exercises/" + self.room["exerciseId"]
        ) as ws:
            self.assertEqual(self.join(ws, "team", "TEAM_ALPHA")["role"], "TEAM_ALPHA")
            snapshot = packet(ws, "STATE_UPDATE")
            self.assertEqual(
                snapshot["state"]["connectedTrainees"][0]["name"], "Account team"
            )
        bound = self.client.get(
            self.path + "/membership", headers=self.headers("team")
        ).json()
        self.assertEqual(
            bound,
            {
                "exerciseId": self.room["exerciseId"],
                "accountRole": "trainee",
                "role": "TEAM_ALPHA",
            },
        )
        with self.client.websocket_connect(
            "/ws/exercises/" + self.room["exerciseId"]
        ) as ws:
            ws.send_json(
                {
                    "type": "JOIN",
                    "idToken": self.tokens["team"],
                    "role": "TEAM_BRAVO",
                    "name": "Team",
                }
            )
            self.assertEqual(ws.receive_json()["code"], 403)
        with self.client.websocket_connect(
            "/ws/exercises/" + self.room["exerciseId"]
        ) as ws:
            self.join(ws, "team", "TEAM_ALPHA")
            packet(ws, "STATE_UPDATE")

    def test_rest_sender_decision_and_own_team_permissions(self):
        self.start()
        self.assertEqual(
            self.client.post(
                self.path + "/messages",
                json={"content": "No membership yet"},
                headers=self.headers("team"),
            ).status_code,
            409,
        )
        with self.client.websocket_connect(
            "/ws/exercises/" + self.room["exerciseId"]
        ) as ws:
            self.join(ws, "team", "TEAM_ALPHA")
            packet(ws, "STATE_UPDATE")
        self.assertEqual(
            self.client.post(
                self.path + "/movement",
                json={"unitId": "unit-bravo", "x": 200, "y": 380},
                headers=self.headers("team"),
            ).status_code,
            403,
        )
        own = self.client.post(
            self.path + "/movement",
            json={"unitId": "unit-alpha", "x": 300, "y": 380},
            headers=self.headers("team"),
        )
        self.assertEqual(own.status_code, 200)
        with self.client.websocket_connect(
            "/ws/exercises/" + self.room["exerciseId"]
        ) as ws:
            self.join(ws, "commander", "COMMANDER")
            packet(ws, "STATE_UPDATE")
        self.assertEqual(
            self.client.post(
                self.path + "/messages",
                json={"content": "Spoof", "senderRole": "TEAM_ALPHA"},
                headers=self.headers("commander"),
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.post(
                self.path + "/messages",
                json={"content": "Spoof", "sender": "Account team"},
                headers=self.headers("commander"),
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.post(
                self.path + "/decision",
                json={
                    "decision": "Wait",
                    "rationale": "Verify",
                    "traineeId": "Account team",
                },
                headers=self.headers("commander"),
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.get(
                self.path + "/membership", headers=self.headers("commander")
            ).json()["role"],
            "COMMANDER",
        )
        self.assertEqual(
            self.client.post(
                self.path + "/decision",
                json={"decision": "Wait", "rationale": "Verify"},
                headers=self.headers("team"),
            ).status_code,
            403,
        )
        for user, role in (("commander", "COMMANDER"), ("team", "TEAM_ALPHA")):
            message = self.client.post(
                self.path + "/messages",
                json={"message": "Valid report"},
                headers=self.headers(user),
            )
            self.assertEqual(message.status_code, 200)
            self.assertEqual(message.json()["sender"], "Account " + user)
            self.assertEqual(message.json()["senderRole"], role)
            self.assertEqual(message.json()["senderUid"], user)
        decision = self.client.post(
            self.path + "/decision",
            json={"decision": "Wait", "rationale": "Verify"},
            headers=self.headers("commander"),
        )
        self.assertEqual(decision.status_code, 201)
        self.assertEqual(decision.json()["traineeUid"], "commander")
        self.assertEqual(decision.json()["traineeId"], "Account commander")

    def test_socket_commands_cannot_spoof_identity_or_claim_instructor(self):
        self.start()
        with self.client.websocket_connect(
            "/ws/exercises/" + self.room["exerciseId"]
        ) as ws:
            self.join(ws, "commander", "COMMANDER")
            packet(ws, "STATE_UPDATE")
            for index, (kind, payload) in enumerate(
                (
                    ("RADIO_MESSAGE", {"content": "Spoof", "senderRole": "TEAM_ALPHA"}),
                    ("RADIO_MESSAGE", {"content": "Spoof", "sender": "Account team"}),
                    (
                        "DECISION_SUBMIT",
                        {
                            "decision": "Wait",
                            "rationale": "Verify",
                            "traineeId": "Account team",
                        },
                    ),
                    ("INSTRUCTOR_INJECT", {"action": "drop_radio"}),
                )
            ):
                ws.send_json(
                    {"type": kind, "requestId": f"spoof-{index}", "payload": payload}
                )
                self.assertEqual(packet(ws, "ERROR")["code"], 403)
            ws.send_json(
                {
                    "type": "RADIO_MESSAGE",
                    "requestId": "valid",
                    "payload": {"content": "My verified report"},
                }
            )
            self.assertEqual(packet(ws, "ACK")["result"]["deliveryStatus"], "DELIVERED")
        self.assertEqual(
            engine_manager.get_exercise(self.room["exerciseId"]).messages[0][
                "senderUid"
            ],
            "commander",
        )

    def test_truth_and_aar_require_owner_account_and_key_and_checkpoint_preserves_access(
        self,
    ):
        owner = self.headers("owner", True)
        selected = self.client.post(
            self.path + "/control",
            json={
                "action": "set_training_area",
                "trainingArea": {"id": "auli-mountains", "forceProfile": "army"},
            },
            headers=owner,
        )
        self.assertEqual(selected.status_code, 200)
        self.assertIn("trueUnits", selected.json())
        self.start()
        with self.client.websocket_connect(
            "/ws/exercises/" + self.room["exerciseId"]
        ) as ws:
            self.join(ws, "commander", "COMMANDER")
            packet(ws, "STATE_UPDATE")
        self.client.post(
            self.path + "/inject", json={"action": "drop_radio"}, headers=owner
        )
        self.client.post(
            self.path + "/messages",
            json={"content": "HIDDEN_RADIO_BODY"},
            headers=self.headers("commander"),
        )
        self.client.post(
            self.path + "/inject", json={"action": "unavailable_map"}, headers=owner
        )
        self.client.post(
            self.path + "/inject", json={"action": "deploy_uav"}, headers=owner
        )
        self.assertEqual(
            self.client.get(
                self.path + "/aar", headers=self.headers("commander")
            ).status_code,
            409,
        )
        self.assertIn(
            "HIDDEN_RADIO_BODY", self.client.get(self.path + "/aar", headers=owner).text
        )
        self.client.post(self.path + "/end", headers=owner)
        review = self.client.get(self.path + "/aar", headers=self.headers("commander"))
        self.assertEqual(review.status_code, 200)
        self.assertEqual(review.json()["reviewScope"], "participant")
        self.assertIn("HIDDEN_RADIO_BODY", review.text)
        self.assertIn("unit-uav", review.text)
        self.assertNotIn("_access", review.text)
        self.assertEqual(
            self.client.get(
                self.path + "/aar", headers=self.headers("other-team")
            ).status_code,
            403,
        )
        exported = self.client.get(
            self.path + "/aar/export", headers=self.headers("commander")
        )
        self.assertEqual(exported.status_code, 200)
        self.assertIn("HIDDEN_RADIO_BODY", exported.text)
        self.assertEqual(
            self.client.get(
                self.path + "/aar", headers=self.headers("commander", True)
            ).status_code,
            403,
        )
        full = self.client.get(self.path + "/aar", headers=owner)
        self.assertEqual(full.json()["reviewScope"], "instructor")
        self.assertIn("HIDDEN_RADIO_BODY", full.text)
        session = engine_manager.get_exercise(self.room["exerciseId"])
        access = deepcopy(session.scenario["_access"])
        restored = restore_checkpoint(json.loads(json.dumps(checkpoint(session))))
        self.assertEqual(restored.scenario["_access"], access)
        reset = self.client.post(
            self.path + "/control", json={"action": "reset"}, headers=owner
        )
        self.assertEqual(reset.status_code, 200)
        self.assertEqual(
            engine_manager.get_exercise(self.room["exerciseId"]).scenario["_access"],
            access,
        )

    def test_expired_socket_closes_for_fresh_token_reconnect(self):
        token = mock_token("expiring")
        self.fixtures[token] = claims("expiring", exp=time.time() + 0.25)
        with self.client.websocket_connect(
            "/ws/exercises/" + self.room["exerciseId"]
        ) as ws:
            ws.send_json(
                {"type": "JOIN", "role": "COMMANDER", "name": "User", "idToken": token}
            )
            packet(ws, "JOINED")
            packet(ws, "STATE_UPDATE")
            self.assertEqual(packet(ws, "ERROR")["code"], 401)
            with self.assertRaises(WebSocketDisconnect) as error:
                ws.receive_json()
            self.assertEqual(error.exception.code, 4001)

    def test_failed_rest_commands_cannot_create_membership_or_unlock_final_aar(self):
        commands = (
            ("/movement", {"unitId": "unit-alpha", "x": 300, "y": 380}),
            ("/messages", {"content": "A report from an unjoined account"}),
            ("/decision", {"decision": "Wait", "rationale": "Verify first"}),
        )
        for status in ("pending", "completed"):
            if status == "completed":
                self.client.post(
                    self.path + "/end", headers=self.headers("owner", True)
                )
            for suffix, body in commands:
                with self.subTest(status=status, command=suffix):
                    result = self.client.post(
                        self.path + suffix, json=body, headers=self.headers("commander")
                    )
                    self.assertEqual(result.status_code, 409)
                    self.assertIsNone(
                        self.client.get(
                            self.path + "/membership", headers=self.headers("commander")
                        ).json()["role"]
                    )
            for suffix in ("", "/decisions"):
                self.assertEqual(
                    self.client.get(
                        self.path + suffix, headers=self.headers("commander")
                    ).status_code,
                    403,
                )
        for suffix in ("/aar", "/aar/export"):
            self.assertEqual(
                self.client.get(
                    self.path + suffix, headers=self.headers("commander")
                ).status_code,
                403,
            )
        session = engine_manager.get_exercise(self.room["exerciseId"])
        self.assertEqual(set(session.scenario["_access"]["memberships"]), {"owner"})
        self.assertEqual(session.messages, [])
        self.assertEqual(session.decisions, [])

    def test_completed_membership_is_frozen_and_members_reconnect_after_reset(self):
        for user, role in (("commander", "COMMANDER"), ("team", "TEAM_ALPHA")):
            with self.client.websocket_connect(
                "/ws/exercises/" + self.room["exerciseId"]
            ) as ws:
                self.join(ws, user, role)
                packet(ws, "STATE_UPDATE")
        self.start()
        self.client.post(self.path + "/end", headers=self.headers("owner", True))
        access = deepcopy(
            engine_manager.get_exercise(self.room["exerciseId"]).scenario["_access"]
        )
        self.tokens["late-commander"] = mock_token("late-commander")
        self.fixtures[self.tokens["late-commander"]] = claims("late-commander")
        for user, role in (
            ("late-commander", "COMMANDER"),
            ("other-team", "TEAM_BRAVO"),
        ):
            with self.client.websocket_connect(
                "/ws/exercises/" + self.room["exerciseId"]
            ) as ws:
                ws.send_json(
                    {
                        "type": "JOIN",
                        "role": role,
                        "name": "Late participant",
                        "idToken": self.tokens[user],
                    }
                )
                self.assertEqual(packet(ws, "ERROR")["code"], 403)
            self.assertIsNone(
                self.client.get(
                    self.path + "/membership", headers=self.headers(user)
                ).json()["role"]
            )
            self.assertEqual(
                self.client.get(
                    self.path + "/aar", headers=self.headers(user)
                ).status_code,
                403,
            )
        for user, role in (
            ("commander", "COMMANDER"),
            ("team", "TEAM_ALPHA"),
            ("owner", "INSTRUCTOR"),
        ):
            with self.client.websocket_connect(
                "/ws/exercises/" + self.room["exerciseId"]
            ) as ws:
                self.assertEqual(self.join(ws, user, role)["role"], role)
                packet(ws, "STATE_UPDATE")
            self.assertEqual(
                self.client.get(
                    self.path + "/aar", headers=self.headers(user)
                ).status_code,
                200,
            )
            self.assertEqual(
                self.client.get(self.path, headers=self.headers(user)).status_code, 200
            )
            self.assertEqual(
                self.client.get(
                    self.path + "/decisions", headers=self.headers(user)
                ).status_code,
                200,
            )
        reset = self.client.post(
            self.path + "/control",
            json={"action": "reset"},
            headers=self.headers("owner", True),
        )
        self.assertEqual(reset.status_code, 200)
        self.assertEqual(
            engine_manager.get_exercise(self.room["exerciseId"]).scenario["_access"],
            access,
        )
        with self.client.websocket_connect(
            "/ws/exercises/" + self.room["exerciseId"]
        ) as ws:
            self.join(ws, "team", "TEAM_ALPHA")
            packet(ws, "STATE_UPDATE")
        with self.client.websocket_connect(
            "/ws/exercises/" + self.room["exerciseId"]
        ) as ws:
            ws.send_json(
                {
                    "type": "JOIN",
                    "role": "TEAM_BRAVO",
                    "name": "Team",
                    "idToken": self.tokens["team"],
                }
            )
            self.assertEqual(packet(ws, "ERROR")["code"], 403)

    def test_creator_recovers_key_without_browser_storage_and_trainees_cannot(self):
        response = self.client.get(self.path + "/membership", headers=self.headers("owner"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["cache-control"], "no-store")
        recovered = response.json()["instructorKey"]
        self.assertEqual(recovered, self.room["instructorKey"])
        for user in ("commander", "team", "other-owner"):
            member = self.client.get(self.path + "/membership", headers=self.headers(user))
            self.assertEqual(member.status_code, 200)
            self.assertNotIn("instructorKey", member.json())
            forged = self.client.post(self.path + "/control", json={"action": "start"}, headers={**self.headers(user), "X-Instructor-Key": recovered})
            self.assertEqual(forged.status_code, 403)
        self.assertEqual(self.client.get(self.path + "/membership").status_code, 401)
        with self.client.websocket_connect("/ws/exercises/" + self.room["exerciseId"]) as ws:
            ws.send_json({"type": "JOIN", "role": "INSTRUCTOR", "name": "Owner", "idToken": self.tokens["owner"], "instructorKey": recovered})
            self.assertIn("trueUnits", packet(ws, "STATE_UPDATE")["state"])

    def test_same_account_creates_as_instructor_and_joins_other_room_as_trainee(self):
        created = self.client.post("/api/exercises", json={}, headers=self.headers("commander"))
        self.assertEqual(created.status_code, 201)
        own_room = created.json()
        own_path = "/api/exercises/" + own_room["exerciseId"]
        own_headers = {**self.headers("commander"), "X-Instructor-Key": own_room["instructorKey"]}
        self.assertEqual(self.client.post(own_path + "/control", json={"action": "start"}, headers=own_headers).status_code, 200)
        with self.client.websocket_connect("/ws/exercises/" + self.room["exerciseId"]) as ws:
            self.join(ws, "commander", "COMMANDER")
            packet(ws, "STATE_UPDATE")
        self.assertEqual(self.client.post(self.path + "/control", json={"action": "start"}, headers=self.headers("commander", True)).status_code, 403)
        # A legacy Instructor claim is also a trainee in someone else's room.
        with self.client.websocket_connect("/ws/exercises/" + own_room["exerciseId"]) as ws:
            self.join(ws, "owner", "COMMANDER")
            packet(ws, "STATE_UPDATE")
        self.assertEqual(self.client.post(own_path + "/control", json={"action": "pause"}, headers={**self.headers("owner"), "X-Instructor-Key": own_room["instructorKey"]}).status_code, 403)
        self.assertEqual(self.client.get(own_path + "/membership", headers=self.headers("commander")).json()["role"], "INSTRUCTOR")
        self.assertEqual(self.client.get(self.path + "/membership", headers=self.headers("commander")).json()["role"], "COMMANDER")

    def test_demo_mode_is_explicit_and_refused_for_deployed_environments(self):
        with (
            patch.object(settings, "AUTH_MODE", "demo"),
            patch.object(settings, "DEPLOYED_ENVIRONMENT", True),
            self.assertRaisesRegex(ValueError, "only allowed for local"),
        ):
            validate_auth_configuration()
        with (
            patch.object(settings, "AUTH_MODE", "unknown"),
            self.assertRaises(ValueError),
        ):
            validate_auth_configuration()


class FirebaseSignatureTests(unittest.TestCase):
    def test_real_verifier_rejects_signed_payload_tampering(self):
        """Use Google's actual verifier with a local test key, no Firebase network."""
        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        private_pem = key.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        )
        public_pem = key.public_key().public_bytes(
            serialization.Encoding.PEM,
            serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        signer = crypt.RSASigner.from_string(private_pem, key_id="test-key")
        original = jwt.encode(signer, claims("verified", "commander")).decode()
        encoded_header, encoded_payload, signature = original.split(".")
        modified_claims = json.loads(
            base64.urlsafe_b64decode(
                encoded_payload + "=" * (-len(encoded_payload) % 4)
            )
        )
        modified_claims["tacticalRole"] = "instructor"
        tampered_payload = (
            base64.urlsafe_b64encode(json.dumps(modified_claims).encode())
            .decode()
            .rstrip("=")
        )
        tampered = f"{encoded_header}.{tampered_payload}.{signature}"
        certificate = SimpleNamespace(
            status=200,
            data=json.dumps({"test-key": public_pem.decode()}).encode(),
        )
        with patch("app.auth.certificate_request", return_value=certificate):
            self.assertEqual(verify_firebase_identity(original).role, "participant")
            with self.assertRaises(HTTPException) as error:
                verify_firebase_identity(tampered)
            self.assertEqual(error.exception.status_code, 401)
