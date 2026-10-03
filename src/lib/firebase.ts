/**
 * Firebase client-side initialisation.
 *
 * All values come from NEXT_PUBLIC_ environment variables — never from
 * hardcoded secrets. Service-account credentials must never appear here.
 *
 * When environment variables are absent the file exports null values so that
 * the application can fall back to the demo (name-only) login flow gracefully.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * True when the minimum required Firebase environment variables are present.
 * When false the application runs in demo mode (no Firebase).
 */
export const isFirebaseConfigured =
  !!firebaseConfig.apiKey && !!firebaseConfig.projectId &&
  !!firebaseConfig.authDomain && !!firebaseConfig.appId;

// Log a developer-facing warning when credentials are missing so the cause is
// immediately obvious rather than surfacing as an obscure undefined error later.
if (!isFirebaseConfigured && typeof window !== "undefined") {
  console.warn(
    "[TACTICAL-SIM] Firebase environment variables are not set.\n" +
    "Copy .env.local.example to .env.local and fill in your Firebase project values.\n" +
    "The application will run in demo mode (no authentication required)."
  );
}

let app: FirebaseApp | null = null;

if (isFirebaseConfigured) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
}

export const auth: Auth | null = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();

/**
 * Get the initialised FirebaseApp instance, or null when not configured.
 * Used by lazy Firestore imports in AuthProvider.
 */
export { app };
