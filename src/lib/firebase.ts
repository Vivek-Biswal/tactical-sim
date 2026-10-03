/**
 * Firebase client-side initialisation.
 *
 * All values come from NEXT_PUBLIC_ environment variables — never from
 * hardcoded secrets. Service-account credentials must never appear here.
 *
 * When environment variables are absent the file exports null values so that
 * the login page can show an honest unavailable state.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * True when the minimum required Firebase environment variables are present.
 * When false the application runs in demo mode (no Firebase).
 */
// Firebase Auth needs the API key and auth domain; projectId is used by the
// app's optional Firestore profile sync. appId is not a prerequisite for Auth.
export const missingFirebaseConfiguration = [
  !firebaseConfig.apiKey && "NEXT_PUBLIC_FIREBASE_API_KEY",
  !firebaseConfig.authDomain && "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  !firebaseConfig.projectId && "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
].filter((name): name is string => typeof name === "string");

export const isFirebaseConfigured = missingFirebaseConfiguration.length === 0;

if (!isFirebaseConfigured && typeof window !== "undefined") {
  // Report names only. Never print credential values.
  console.warn(
    "[TACTICAL-SIM] Firebase sign-in is unavailable. Missing frontend configuration:",
    missingFirebaseConfiguration.join(", "),
    "Set these variables in the Vercel Production environment and rebuild, or in root .env.local and restart locally."
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
