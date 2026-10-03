"use client";

import React from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePathname, useRouter } from "next/navigation";

/**
 * AuthGuard — wrap any page/component that requires Firebase authentication.
 *
 * When Firebase is not configured this guard is a no-op (demo mode works as
 * before). When Firebase IS configured it:
 *  1. Shows a loading screen while Firebase checks the session.
 *  2. Saves the current path to sessionStorage and redirects to /login when the
 *     user is not authenticated.
 *  3. Renders children normally when the user is authenticated.
 *
 * Demo access is available only when Firebase is not configured.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isFirebaseConfigured } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!loading && isFirebaseConfigured && !user) {
      try {
        sessionStorage.setItem("tactical_sim_redirect", pathname ?? "/training");
      } catch {
        // sessionStorage unavailable – ignore
      }
      router.push("/login");
    }
  }, [user, loading, isFirebaseConfigured, router, pathname]);

  // Show loading screen while Firebase resolves auth state
  if (isFirebaseConfigured && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5EE]">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-[#556B3F] animate-pulse" />
          <span className="text-[10px] font-black tracking-widest text-[#344438] uppercase">
            Authenticating...
          </span>
        </div>
      </div>
    );
  }

  if (isFirebaseConfigured && !user) return null;

  return <>{children}</>;
}
