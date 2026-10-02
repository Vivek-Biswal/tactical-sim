"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  role: string | null;
  setRole: (role: string | null) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isFirebaseConfigured,
  role: null,
  setRole: () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRoleState] = useState<string | null>(null);

  // Load role from localStorage on mount
  useEffect(() => {
    try {
      const storedRole = localStorage.getItem("tactical_sim_role");
      if (storedRole) setRoleState(storedRole);
    } catch (e) {
      console.warn("Failed to read role from local storage");
    }
  }, []);

  const setRole = (newRole: string | null) => {
    setRoleState(newRole);
    try {
      if (newRole) {
        localStorage.setItem("tactical_sim_role", newRole);
      } else {
        localStorage.removeItem("tactical_sim_role");
      }
    } catch (e) {
      console.warn("Failed to set role in local storage");
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    if (!auth) throw new Error("Firebase is not configured");
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    }
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isFirebaseConfigured, role, setRole, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
