"use client";

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import {
  User,
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { resolveAuthError } from "@/lib/auth";

/* ── Firestore (optional – only used when Firebase is configured) ── */
// Dynamically import Firestore so it only loads when Firebase is configured
async function upsertFirestoreUser(user: User): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const { getFirestore, doc, setDoc, serverTimestamp } = await import(
      "firebase/firestore"
    );
    const { getApp } = await import("firebase/app");
    const db = getFirestore(getApp());
    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        displayName: user.displayName ?? null,
        email: user.email ?? null,
        photoURL: user.photoURL ?? null,
        lastLoginAt: serverTimestamp(),
      },
      { merge: true }
    );
    // Set createdAt only on first write (merge won't overwrite existing value)
    await setDoc(
      doc(db, "users", user.uid),
      {
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    // Firestore failure should never break the auth flow
    console.warn("[TACTICAL-SIM] Firestore user record update failed:", err);
  }
}

/* ── Auth context types ── */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  role: string | null;
  setRole: (role: string | null) => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isFirebaseConfigured,
  role: null,
  setRole: () => {},
  loginWithGoogle: async () => {},
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  resetPassword: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

function readRole(): string | null {
  try { return localStorage.getItem("tactical_sim_role"); }
  catch { return null; }
}

function subscribeRole(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("tactical-role-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("tactical-role-change", onChange);
  };
}

/* ── Provider ── */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!auth);
  const role = useSyncExternalStore(subscribeRole, readRole, () => null);

  const setRole = (newRole: string | null) => {
    try {
      if (newRole) localStorage.setItem("tactical_sim_role", newRole);
      else localStorage.removeItem("tactical_sim_role");
      window.dispatchEvent(new Event("tactical-role-change"));
    } catch {
      console.warn("[TACTICAL-SIM] Failed to persist role to localStorage.");
    }
  };

  /* ── Firebase auth state listener ── */
  useEffect(() => {
    if (!auth) {
      // Firebase not configured – skip auth check, allow demo flow
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        // Best-effort Firestore upsert on sign-in
        void upsertFirestoreUser(currentUser);
      }
    });

    return () => unsubscribe();
  }, []);

  /* ── Google sign-in ── */
  const loginWithGoogle = async (): Promise<void> => {
    if (!auth) {
      throw new Error("Firebase is not configured");
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      // Re-throw as a plain Error with a friendly message so callers can
      // display it without exposing raw Firebase SDK details
      const message = resolveAuthError(err);
      throw new Error(message);
    }
  };

  const emailAction = async (action: "login" | "register" | "reset", email: string, password = "") => {
    if (!auth) throw new Error("Firebase is not configured.");
    try {
      if (action === "login") await signInWithEmailAndPassword(auth, email.trim(), password);
      else if (action === "register") await createUserWithEmailAndPassword(auth, email.trim(), password);
      else await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      throw new Error(resolveAuthError(err));
    }
  };

  /* ── Sign-out ── */
  const logout = async (): Promise<void> => {
    if (auth) {
      await signOut(auth);
    }
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebaseConfigured,
        role,
        setRole,
        loginWithGoogle,
        loginWithEmail: (email, password) => emailAction("login", email, password),
        registerWithEmail: (email, password) => emailAction("register", email, password),
        resetPassword: (email) => emailAction("reset", email),
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
