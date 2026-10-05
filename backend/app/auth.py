"""Firebase account authorization, independent of client-selected exercise roles.

Tokens stay in HTTPS headers / the first WebSocket JOIN packet, never URLs.
Private owner and membership records live inside the existing scenario checkpoint.
"""

import asyncio
import math
import re
import threading
import time
from dataclasses import dataclass

from fastapi import HTTPException, Request
from google.auth import exceptions, jwt
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token

from app.config import settings

ACCOUNT_ROLES = {"instructor", "commander", "team"}
TEAM_ROLES = {"TEAM_ALPHA", "TEAM_BRAVO", "TEAM_CHARLIE"}


@dataclass(frozen=True)
class Identity:
    uid: str
    role: str
    name: str
    expires_at: float | None


DEMO_IDENTITY = Identity("local-demo", "demo", "Demo user", None)


class CertificateRequest:
    """Cache only Google's public certificates for their declared max-age."""

    def __init__(self):
        self.transport = GoogleRequest()
        self.lock = threading.Lock()
        self.cache = {}

    def __call__(self, url, method="GET", **kwargs):
        kwargs["timeout"] = 5
        with self.lock:
            cached = self.cache.get(url)
            if method == "GET" and cached and cached[0] > time.monotonic():
                return cached[1]
            response = self.transport(url, method=method, **kwargs)
            if method == "GET" and response.status == 200:
                directive = response.headers.get("cache-control", "")
                max_age = re.search(r"(?:^|,)\s*max-age=(\d+)", directive)
                if max_age:
                    self.cache[url] = (
                        time.monotonic() + min(int(max_age.group(1)), 86400),
                        response,
                    )
            return response


certificate_request = CertificateRequest()


def validate_auth_configuration():
    if settings.AUTH_MODE not in ("firebase", "demo"):
        raise ValueError("AUTH_MODE must be firebase or demo")
    if settings.AUTH_MODE == "demo" and settings.DEPLOYED_ENVIRONMENT:
        raise ValueError(
            "Demo authentication is only allowed for local development/tests"
        )
    if settings.AUTH_MODE == "firebase" and not settings.FIREBASE_PROJECT_ID:
        raise ValueError("FIREBASE_PROJECT_ID is required for Firebase authentication")


def is_demo():
    return settings.AUTH_MODE == "demo" and not settings.DEPLOYED_ENVIRONMENT


def unauthorized():
    return HTTPException(
        401,
        "A valid Firebase sign-in is required",
        headers={"WWW-Authenticate": "Bearer"},
    )


def verify_firebase_identity(token):
    """Verify the signature first, then Firebase-specific claims and account role.

    google-auth verifies signature, expiry, issue time and audience. It does not
    validate Firebase's issuer or check token revocation, so issuer is checked here;
    socket authorization expires when the presented ID token expires.
    """
    if not isinstance(token, str) or not 1 <= len(token) <= 12000:
        raise unauthorized()
    try:
        header = jwt.decode_header(token)
        if (
            header.get("alg") != "RS256"
            or not isinstance(header.get("kid"), str)
            or not header["kid"]
        ):
            raise ValueError("Invalid Firebase token header")
        claims = id_token.verify_firebase_token(
            token, certificate_request, audience=settings.FIREBASE_PROJECT_ID
        )
        if not isinstance(claims, dict):
            raise TypeError("Invalid Firebase token claims")
        now = time.time()
        uid = claims.get("sub")
        if (
            claims.get("aud") != settings.FIREBASE_PROJECT_ID
            or claims.get("iss")
            != f"https://securetoken.google.com/{settings.FIREBASE_PROJECT_ID}"
            or not isinstance(uid, str)
            or not 1 <= len(uid) <= 128
            or claims.get("user_id", uid) != uid
        ):
            raise ValueError("Invalid Firebase identity")
        for field in ("exp", "iat", "auth_time"):
            value = claims.get(field)
            if (
                isinstance(value, bool)
                or not isinstance(value, (int, float))
                or not math.isfinite(value)
            ):
                raise ValueError("Invalid Firebase token timestamp")
        if claims["exp"] <= now or claims["iat"] > now or claims["auth_time"] > now:
            raise ValueError("Firebase token expired or issued in the future")
        firebase = claims.get("firebase", {})
        if not isinstance(firebase, dict):
            raise TypeError("Invalid Firebase provider metadata")
        if firebase.get("sign_in_provider") == "anonymous":
            raise ValueError("Anonymous accounts cannot join training")
        # Account claims identify users; authority belongs to each room's owner.
        role = "participant"
        name = claims.get("name") or claims.get("email") or uid
        if not isinstance(name, str) or not name.strip():
            name = uid
        name = " ".join(name.split())[:80]
        return Identity(uid, role, name, float(claims["exp"]))
    except exceptions.TransportError as error:
        raise HTTPException(
            503, "Sign-in verification is temporarily unavailable"
        ) from error
    except (ValueError, TypeError, KeyError, exceptions.GoogleAuthError) as error:
        raise unauthorized() from error


async def identity_from_token(token):
    if is_demo():
        return DEMO_IDENTITY
    if settings.AUTH_MODE != "firebase":
        raise HTTPException(503, "Authentication is not configured")
    return await asyncio.to_thread(verify_firebase_identity, token)


async def identity_from_header(header):
    if is_demo():
        return DEMO_IDENTITY
    if not isinstance(header, str):
        raise unauthorized()
    parts = header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise unauthorized()
    return await identity_from_token(parts[1])


def identity_for(request: Request):
    identity = getattr(request.state, "identity", None)
    if not isinstance(identity, Identity):
        raise unauthorized()
    require_active(identity)
    return identity


def require_active(identity):
    if not isinstance(identity, Identity):
        raise unauthorized()
    if identity.role == "demo":
        if not is_demo():
            raise unauthorized()
    elif identity.expires_at is None or identity.expires_at <= time.time():
        raise unauthorized()


def require_account_role(identity, *allowed):
    require_active(identity)
    if not is_demo() and identity.role not in allowed:
        raise HTTPException(403, f"{' or '.join(allowed).title()} account required")


def room_access(session):
    access = session.scenario.get("_access")
    if (
        not isinstance(access, dict)
        or not isinstance(access.get("ownerUid"), str)
        or not access["ownerUid"]
    ):
        raise HTTPException(
            403, "This legacy room has no authenticated owner; create a new exercise"
        )
    if not isinstance(access.get("memberships"), dict):
        raise HTTPException(403, "Room membership is unavailable")
    return access


def own_room(session, identity):
    require_active(identity)
    if not is_demo() and room_access(session)["ownerUid"] != identity.uid:
        raise HTTPException(
            403, "Only the instructor who created this room can control it"
        )


def assign_owner(session, identity):
    require_active(identity)
    if not is_demo():
        session.scenario["_access"] = {
            "ownerUid": identity.uid,
            "memberships": {
                identity.uid: {"role": "INSTRUCTOR", "name": identity.name}
            },
        }


def membership(session, identity):
    require_active(identity)
    if is_demo():
        return None
    member = room_access(session)["memberships"].get(identity.uid)
    if member is not None:
        if not isinstance(member, dict) or member.get("role") not in {
            "INSTRUCTOR",
            "COMMANDER",
            *TEAM_ROLES,
        }:
            raise HTTPException(403, "Room membership is invalid")
        if (member["role"] == "INSTRUCTOR") != (room_access(session)["ownerUid"] == identity.uid):
            raise HTTPException(403, "Room ownership does not match its membership")
    return member


def bind_role(session, identity, role):
    require_active(identity)
    if is_demo():
        return
    allowed = {"INSTRUCTOR"} if room_access(session)["ownerUid"] == identity.uid else {"COMMANDER", *TEAM_ROLES}
    if role not in allowed:
        raise HTTPException(
            403, "Only the room creator can join as Instructor; other users join as trainees"
        )
    existing = membership(session, identity)
    if session.status == "completed" and existing is None:
        raise HTTPException(
            403, "This completed exercise is closed to new participants"
        )
    if existing and existing["role"] != role:
        raise HTTPException(
            403, "Your team is fixed for this room; reconnect using the same team"
        )
    members = room_access(session)["memberships"]
    if not existing and len(members) >= settings.MAX_MEMBERS_PER_ROOM:
        raise HTTPException(409, "Room account limit reached")
    members[identity.uid] = {"role": role, "name": identity.name}


def http_room_role(session, identity):
    member = membership(session, identity)
    if is_demo():
        return "COMMANDER"
    if member is None:
        raise HTTPException(409, "Join the exercise before submitting room commands")
    return member["role"]


def require_actor_value(identity, value, fields, field):
    if not is_demo() and field in fields and value not in (identity.uid, identity.name):
        raise HTTPException(
            403, "The sender/decision identity must match the signed-in account"
        )


def connection_identity(session, connection):
    identity = connection.get("identity")
    require_active(identity)
    if not is_demo():
        member = membership(session, identity)
        if not member or member["role"] != connection["role"]:
            raise HTTPException(
                403, "This connection does not match its assigned room role"
            )
    return identity
