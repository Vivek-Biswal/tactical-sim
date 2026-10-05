"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  User,
  onIdTokenChanged,
  getIdTokenResult,
  signOut,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { resolveAuthError } from "@/lib/auth";
import { accountRoleFromClaims, isLocalPracticeHost, type AccountRole } from "@/lib/roles";

/* ── Firestore (optional – only used when Firebase is configured) ── */
// Dynamically import Firestore so it only loads when Firebase is configured
async function upsertFirestoreUser(user: User): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const { getFirestore, doc, runTransaction, serverTimestamp } = await import(
      "firebase/firestore"
    );
    const { getApp } = await import("firebase/app");
    const db = getFirestore(getApp());
    const reference = doc(db, "users", user.uid);
    await runTransaction(db, async (transaction) => {
      const existing = await transaction.get(reference);
      transaction.set(reference, {
        uid: user.uid,
        displayName: user.displayName ?? null,
        email: user.email ?? null,
        photoURL: user.photoURL ?? null,
        createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
    });
  } catch (err) {
    // Firestore failure should never break the auth flow
    console.warn("[CHAKRAVYUH] Firestore user record update failed:", err);
  }
}

/* ── Auth context types ── */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  isLocalPracticeAvailable: boolean;
  role: AccountRole | null;
  roleError: string;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshAccountAccess: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isFirebaseConfigured,
  isLocalPracticeAvailable: false,
  role: null,
  roleError: "",
  loginWithGoogle: async () => {},
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  resetPassword: async () => {},
  refreshAccountAccess: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

type AuthSession = { user: User | null; role: AccountRole | null; roleError: string; loading: boolean };
const subscribePracticeHost = () => () => {};
const localPracticeSnapshot = () => !isFirebaseConfigured && isLocalPracticeHost(window.location.hostname);
const serverPracticeSnapshot = () => false;

/* ── Provider ── */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [{ user, role, roleError, loading }, setSession] = useState<AuthSession>({
    user: null, role: null, roleError: "", loading: !!auth,
  });
  const revision = useRef(0);
  const isLocalPracticeAvailable = useSyncExternalStore(subscribePracticeHost, localPracticeSnapshot, serverPracticeSnapshot);

  /* ── Firebase auth state listener ── */
  useEffect(() => {
    if (!auth) return;
    let disposed = false;
    let profileUid: string | null = null;
    const unsubscribe = onIdTokenChanged(auth, (currentUser) => {
      const requestRevision = ++revision.current;
      // A routine refresh for the same verified account must not unmount a live exercise.
      // Account switches and explicit access refreshes still wait for the new claims.
      setSession(previous => currentUser && previous.user?.uid === currentUser.uid && previous.role && !previous.roleError
        ? { ...previous, user: currentUser }
        : { user: currentUser, role: null, roleError: "", loading: !!currentUser });
      if (!currentUser) { profileUid = null; return; }
      void getIdTokenResult(currentUser).then((result) => {
        if (disposed || requestRevision !== revision.current || auth?.currentUser?.uid !== currentUser.uid) return;
        const assignedRole = accountRoleFromClaims(result.claims);
        setSession({
          user: currentUser,
          role: assignedRole,
          loading: false,
          roleError: assignedRole ? "" : "Your account has an unsupported training role. Ask your administrator to update your account access.",
        });
        if (assignedRole && profileUid !== currentUser.uid) {
          profileUid = currentUser.uid;
          void upsertFirestoreUser(currentUser);
        }
      }).catch(() => {
        if (disposed || requestRevision !== revision.current || auth?.currentUser?.uid !== currentUser.uid) return;
        setSession({ user: currentUser, role: null, loading: false, roleError: "We could not verify your account access. Sign out and sign in again, or contact your administrator." });
      });
    }, () => {
      ++revision.current;
      setSession({ user: auth?.currentUser ?? null, role: null, loading: false, roleError: "We could not verify your sign-in session. Please sign in again." });
    });
    return () => { disposed = true; unsubscribe(); };
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
  };

  const refreshAccountAccess = async (): Promise<void> => {
    const currentUser = auth?.currentUser;
    if (!currentUser) throw new Error("Sign in before refreshing account access.");
    const requestRevision = ++revision.current;
    setSession({ user: currentUser, role: null, roleError: "", loading: true });
    try {
      const result = await getIdTokenResult(currentUser, true);
      // The token listener normally handles this refresh. This also covers an unchanged token.
      if (requestRevision !== revision.current || auth?.currentUser?.uid !== currentUser.uid) return;
      const assignedRole = accountRoleFromClaims(result.claims);
      setSession({ user: currentUser, role: assignedRole, loading: false, roleError: assignedRole ? "" : "Your account has an unsupported training role. Ask your administrator to update your account access." });
    } catch {
      if (requestRevision === revision.current) {
        setSession({ user: currentUser, role: null, loading: false, roleError: "We could not refresh your account access. Check your connection and try again." });
      }
      throw new Error("We could not refresh your account access. Check your connection and try again.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebaseConfigured,
        isLocalPracticeAvailable,
        role,
        roleError,
        loginWithGoogle,
        loginWithEmail: (email, password) => emailAction("login", email, password),
        registerWithEmail: (email, password) => emailAction("register", email, password),
        resetPassword: (email) => emailAction("reset", email),
        refreshAccountAccess,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
