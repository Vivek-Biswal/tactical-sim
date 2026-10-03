/**
 * Firebase authentication utilities.
 *
 * This module provides helper functions for working with Firebase Auth,
 * including human-readable error message mapping.
 */

/** Map Firebase auth error codes to user-friendly messages. */
export function getAuthErrorMessage(code: string): string {
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in was cancelled.";
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup. Please allow popups and try again.";
    case "auth/unauthorized-domain":
      return "This application domain is not authorised for Google sign-in. Contact your system administrator.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact your system administrator.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with a different sign-in method for this email.";
    case "auth/email-already-in-use":
      return "This email address is already in use.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/user-not-found":
      return "No account found with this email address.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please wait a moment before trying again.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled. Contact your system administrator.";
    case "auth/internal-error":
      return "An internal authentication error occurred. Please try again.";
    case "auth/configuration-not-found":
      return "Firebase authentication is not configured correctly. Contact your system administrator.";
    default:
      return "Unable to sign in. Please try again.";
  }
}

/** Extract a human-readable message from a Firebase AuthError or any thrown value. */
export function resolveAuthError(err: unknown): string {
  if (err && typeof err === "object") {
    const firebaseErr = err as { code?: string; message?: string };
    if (firebaseErr.code) {
      return getAuthErrorMessage(firebaseErr.code);
    }
    if (firebaseErr.message) {
      // Don't expose raw Firebase SDK internals to the user
      return "Unable to sign in. Please try again.";
    }
  }
  return "Unable to sign in. Please try again.";
}
