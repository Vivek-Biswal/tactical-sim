import importlib.util
import json
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "provision_account_role.py"
spec = importlib.util.spec_from_file_location("provision_account_role", SCRIPT)
provisioning = importlib.util.module_from_spec(spec)
spec.loader.exec_module(provisioning)


class Response:
    ok = True
    status_code = 200

    def __init__(self, value):
        self.value = value

    def json(self):
        return self.value


class Client:
    def __init__(self, verified=True):
        self.user = {"localId": "test-user", "email": "teacher@example.com", "emailVerified": verified, "customAttributes": json.dumps({"featureAccess": ["maps"], "tacticalRole": "commander"})}
        self.updates = []

    def post(self, url, json, **kwargs):
        if url.endswith(":lookup"):
            return Response({"users": [dict(self.user)]})
        self.updates.append(json)
        self.user["customAttributes"] = json["customAttributes"]
        return Response({"localId": self.user["localId"]})


class AccountRoleProvisioningTests(unittest.TestCase):
    def test_preserves_unrelated_claims_and_validates_role_and_size(self):
        original = {"featureAccess": ["maps"], "tacticalRole": "team"}
        merged = provisioning.merged_claims(original, "instructor")
        self.assertEqual(merged, {"featureAccess": ["maps"], "tacticalRole": "instructor"})
        self.assertEqual(original["tacticalRole"], "team")
        for attributes, role in [(original, "admin"), ("[]", "team"), ("not-json", "team"), ({"padding": "x" * 1000}, "team")]:
            with self.subTest(attributes=type(attributes).__name__, role=role), self.assertRaises(provisioning.ProvisioningError):
                provisioning.merged_claims(attributes, role)

    def test_preview_makes_no_write_and_apply_preserves_claims_and_verifies(self):
        client = Client()
        preview = provisioning.provision_role(client, "tactical-sim-d3bf4", "instructor", email="teacher@example.com")
        self.assertFalse(preview["applied"])
        self.assertEqual(client.updates, [])
        result = provisioning.provision_role(client, "tactical-sim-d3bf4", "instructor", uid="test-user", apply=True)
        self.assertTrue(result["applied"])
        self.assertEqual(len(client.updates), 1)
        self.assertEqual(json.loads(client.updates[0]["customAttributes"]), {"featureAccess": ["maps"], "tacticalRole": "instructor"})
        self.assertFalse(client.updates[0]["returnSecureToken"])
        self.assertNotIn("featureAccess", result)

    def test_unverified_or_disabled_account_cannot_get_instructor(self):
        disabled = Client()
        disabled.user["disabled"] = True
        no_email = Client()
        no_email.user.pop("email")
        for client in [Client(verified=False), disabled, no_email]:
            with self.assertRaises(provisioning.ProvisioningError):
                provisioning.provision_role(client, "tactical-sim-d3bf4", "instructor", uid="test-user", apply=True)
            self.assertEqual(client.updates, [])

    def test_account_mismatch_is_rejected_without_write(self):
        client = Client()
        with self.assertRaises(provisioning.ProvisioningError):
            provisioning.provision_role(client, "tactical-sim-d3bf4", "team", email="different@example.com", apply=True)
        self.assertEqual(client.updates, [])

    def test_concurrent_claim_change_aborts_before_write(self):
        class ChangedClient(Client):
            reads = 0

            def post(self, url, json, **kwargs):
                if url.endswith(":lookup"):
                    self.reads += 1
                    if self.reads == 2:
                        self.user["customAttributes"] = '{"otherAdminClaim": true}'
                return super().post(url, json, **kwargs)

        client = ChangedClient()
        with self.assertRaises(provisioning.ProvisioningError):
            provisioning.provision_role(client, "tactical-sim-d3bf4", "instructor", uid="test-user", apply=True)
        self.assertEqual(client.updates, [])

    def test_write_without_persisted_role_is_not_reported_as_success(self):
        class IgnoredClient(Client):
            def post(self, url, json, **kwargs):
                if url.endswith(":update"):
                    self.updates.append(json)
                    return Response({"localId": self.user["localId"]})
                return super().post(url, json, **kwargs)

        client = IgnoredClient()
        with self.assertRaises(provisioning.ProvisioningError):
            provisioning.provision_role(client, "tactical-sim-d3bf4", "instructor", uid="test-user", apply=True)
        self.assertEqual(len(client.updates), 1)


if __name__ == "__main__":
    unittest.main()
