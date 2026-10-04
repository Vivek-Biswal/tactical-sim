"""Admin-only signed Firebase role provisioning; a read-only preview is the default.

Uses Google Application Default Credentials or server-only service-account JSON.
Never uses browser API keys, prints credentials, creates users, or changes passwords.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from typing import Any

ROLES = ("instructor", "commander", "team")
CLAIM = "tacticalRole"
SCOPE = "https://www.googleapis.com/auth/identitytoolkit"
API = "https://identitytoolkit.googleapis.com/v1/projects"


class ProvisioningError(Exception):
    """A safe operator-facing failure, without credentials or raw API payloads."""


def read_claims(existing: Any) -> dict:
    if existing in (None, ""):
        current = {}
    elif isinstance(existing, str):
        try:
            current = json.loads(existing)
        except (ValueError, TypeError) as error:
            raise ProvisioningError("Existing custom claims are not valid JSON.") from error
    else:
        current = existing
    if not isinstance(current, dict):
        raise ProvisioningError("Existing custom claims must be a JSON object.")
    return current


def merged_claims(existing: Any, role: str) -> dict:
    if role not in ROLES:
        raise ProvisioningError("Role must be instructor, commander or team.")
    current = read_claims(existing)
    updated = {**current, CLAIM: role}
    try:
        encoded = json.dumps(updated, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    except (ValueError, TypeError) as error:
        raise ProvisioningError("Existing claims cannot be safely serialized.") from error
    if len(encoded.encode("utf-8")) > 1000:
        raise ProvisioningError("Custom claims would exceed Firebase's 1000-byte limit.")
    return updated


def request_api(client, project: str, action: str, body: dict) -> dict:
    response = client.post(
        f"{API}/{project}/accounts:{action}",
        json=body,
        timeout=(10, 20),
        max_allowed_time=40,
        allow_redirects=False,
    )
    if not response.ok:
        hint = " Check project IAM permissions." if response.status_code == 403 else ""
        raise ProvisioningError(f"Firebase admin request failed (HTTP {response.status_code}).{hint}")
    try:
        value = response.json()
    except ValueError as error:
        raise ProvisioningError("Firebase returned an invalid JSON response.") from error
    if not isinstance(value, dict):
        raise ProvisioningError("Firebase returned an unexpected response.")
    return value


def lookup_user(client, project: str, *, email: str | None = None, uid: str | None = None) -> dict:
    if bool(email) == bool(uid):
        raise ProvisioningError("Supply exactly one account email or UID.")
    body = {"email": [email]} if email else {"localId": [uid]}
    users = request_api(client, project, "lookup", body).get("users", [])
    if not isinstance(users, list) or len(users) != 1 or not isinstance(users[0], dict):
        raise ProvisioningError("Exactly one existing Firebase Auth account must match; sign up first.")
    account = users[0]
    if not isinstance(account.get("localId"), str) or not account["localId"]:
        raise ProvisioningError("Firebase account response has no valid UID.")
    if email and str(account.get("email", "")).casefold() != email.casefold():
        raise ProvisioningError("Firebase lookup returned a different email; no change made.")
    if uid and account["localId"] != uid:
        raise ProvisioningError("Firebase lookup returned a different UID; no change made.")
    return account


def provision_role(client, project: str, role: str, *, email: str | None = None, uid: str | None = None, apply: bool = False) -> dict:
    if not re.fullmatch(r"[a-z][a-z0-9-]{4,28}[a-z0-9]", project):
        raise ProvisioningError("Use a valid, explicit Firebase project ID.")
    if role not in ROLES:
        raise ProvisioningError("Role must be instructor, commander or team.")
    account = lookup_user(client, project, email=email, uid=uid)
    if account.get("disabled"):
        raise ProvisioningError("Account is disabled; this tool will not enable it.")
    if role == "instructor" and (
        account.get("emailVerified") is not True
        or not isinstance(account.get("email"), str)
        or not account["email"].strip()
    ):
        raise ProvisioningError("Verify the account's email before assigning instructor access.")
    attributes = account.get("customAttributes")
    updated = merged_claims(attributes, role)
    existing = read_claims(attributes)
    old_role = existing.get(CLAIM)
    result = {
        "project": project,
        "uid": account["localId"],
        "email": account.get("email"),
        "previousRole": old_role if old_role in ROLES else "commander" if old_role is None else "unrecognized",
        "tacticalRole": role,
        "otherClaimsPreserved": len(existing.keys() - {CLAIM}),
        "applied": False,
    }
    if not apply:
        result["note"] = "Read-only preview. Add --apply only after checking the account and project."
        return result
    # Re-read immediately before the write to detect changes since the preview.
    current = lookup_user(client, project, uid=account["localId"])
    if current.get("customAttributes") != attributes or current.get("email") != account.get("email") or current.get("disabled") or (role == "instructor" and current.get("emailVerified") is not True):
        raise ProvisioningError("Account changed during provisioning; rerun the preview before applying.")
    request_api(client, project, "update", {
        "localId": account["localId"],
        "customAttributes": json.dumps(updated, ensure_ascii=False, separators=(",", ":"), allow_nan=False),
        "returnSecureToken": False,
    })
    confirmed = lookup_user(client, project, uid=account["localId"])
    if merged_claims(confirmed.get("customAttributes"), role) != updated:
        raise ProvisioningError("Account changed after the write; inspect it before retrying.")
    confirmed_claims = read_claims(confirmed.get("customAttributes"))
    if confirmed_claims.get(CLAIM) != role:
        raise ProvisioningError("Role write was not confirmed; inspect the account before retrying.")
    result["applied"] = True
    result["note"] = "Signed role saved. Sign out/in or force-refresh the Firebase ID token."
    return result


def authenticated_client():
    import google.auth
    from google.auth.transport.requests import AuthorizedSession
    from google.oauth2 import service_account

    try:
        server_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
        if server_json:
            credentials = service_account.Credentials.from_service_account_info(json.loads(server_json), scopes=[SCOPE])
        else:
            credentials, _ = google.auth.default(scopes=[SCOPE])
    except Exception as error:
        raise ProvisioningError("Admin credentials unavailable or invalid. Configure Google ADC or a server-only service-account credential.") from error
    return AuthorizedSession(credentials, refresh_timeout=20)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True, help="Explicit Firebase project ID")
    identity = parser.add_mutually_exclusive_group(required=True)
    identity.add_argument("--email", help="Exact existing Firebase Auth account email")
    identity.add_argument("--uid", help="Exact existing Firebase Auth account UID")
    parser.add_argument("--role", required=True, choices=ROLES)
    parser.add_argument("--apply", action="store_true", help="Write the reviewed role; omitted means read-only preview")
    args = parser.parse_args(argv)
    try:
        with authenticated_client() as client:
            result = provision_role(client, args.project, args.role, email=args.email, uid=args.uid, apply=args.apply)
        print(json.dumps(result, indent=2))
        return 0
    except ProvisioningError as error:
        print(f"Role provisioning failed: {error}", file=sys.stderr)
        return 1
    except Exception:  # noqa: BLE001 -- Never render credential-bearing library exceptions.
        # Do not expose raw auth/HTTP exceptions, which can contain credential details.
        print("Role provisioning failed: authentication or network request failed. Check local credentials and project access.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
