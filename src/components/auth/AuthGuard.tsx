"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Shield, LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePathname, useRouter } from "next/navigation";
import { accountHome, accountRoleLabels, canAccessPath } from "@/lib/roles";

/**
 * Protect account pages while both identity and the signed account role resolve.
 * The backend independently verifies account permissions on every live request.
 * Unconfigured local practice has no authenticated account role.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, role, roleError, isFirebaseConfigured, isLocalPracticeAvailable, logout, refreshAccountAccess } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [leaving, setLeaving] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  React.useEffect(() => {
    if (!loading && isFirebaseConfigured && !user) {
      try {
        sessionStorage.setItem("tactical_sim_redirect", pathname ?? "/training");
      } catch {
        // sessionStorage unavailable – ignore
      }
      router.replace("/login");
    }
  }, [user, loading, isFirebaseConfigured, router, pathname]);

  if (!isFirebaseConfigured && !isLocalPracticeAvailable) {
    return <main className="flex min-h-screen items-center justify-center bg-[#F7F5EE] p-5 text-[#344438]">
      <section className="w-full max-w-lg rounded-2xl border border-[#D9D8CE] bg-white p-7 shadow-sm" aria-labelledby="sign-in-unavailable-title">
        <Shield className="mb-5 text-[#556B3F]" size={30} />
        <h1 id="sign-in-unavailable-title" className="text-2xl font-black">Account sign-in is unavailable.</h1>
        <p className="mt-4 text-sm leading-relaxed text-[#687066]">This deployment needs its Firebase sign-in configuration. Please contact your exercise organizer to restore account access.</p>
        <div className="mt-6 flex flex-wrap gap-3"><Link href="/login" className="rounded-lg bg-[#556B3F] px-4 py-3 text-xs font-bold text-white">Open sign-in page</Link><Link href="/" className="rounded-lg border border-[#D9D8CE] px-4 py-3 text-xs font-bold">Back to website</Link></div>
      </section>
    </main>;
  }

  // Show loading screen while Firebase resolves auth state
  if (isFirebaseConfigured && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5EE]">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-[#556B3F] animate-pulse" />
          <span className="text-[10px] font-black tracking-widest text-[#344438] uppercase">
            Checking account access...
          </span>
        </div>
      </div>
    );
  }

  if (isFirebaseConfigured && !user) return null;
  if (isFirebaseConfigured && (roleError || !role || !canAccessPath(role, pathname ?? "/"))) {
    const home = role ? accountHome(role) : "/";
    return <main className="flex min-h-screen items-center justify-center bg-[#F7F5EE] p-5 text-[#344438]">
      <section className="w-full max-w-lg rounded-2xl border border-[#D9D8CE] bg-white p-6 shadow-sm md:p-9" aria-labelledby="account-access-title">
        <Shield className="mb-5 text-[#556B3F]" size={30} />
        <p className="text-[10px] font-black uppercase tracking-widest text-[#71805A]">Account access</p>
        <h1 id="account-access-title" className="mt-3 text-2xl font-black">{roleError ? "Your access needs attention." : "This page belongs to another role."}</h1>
        <p className="mt-4 text-sm leading-relaxed text-[#687066]">{roleError || (role ? `You are signed in as a ${accountRoleLabels[role]}. Your account can use its own workspace and shared training pages. Ask your administrator if you need a different role.` : "We could not verify your training role. Sign in again or contact your administrator.")}</p>
        {signOutError && <p role="alert" className="mt-4 text-sm text-[#A94A3F]">{signOutError}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={home} className="rounded-lg bg-[#556B3F] px-4 py-3 text-xs font-bold text-white">{role ? "Open my workspace" : "Back to website"}</Link>
          <button type="button" onClick={async () => {
            setSignOutError("");
            try { await refreshAccountAccess(); }
            catch (error) { setSignOutError(error instanceof Error ? error.message : "Could not refresh account access."); }
          }} className="rounded-lg border border-[#D9D8CE] px-4 py-3 text-xs font-bold">Refresh account access</button>
          <button type="button" disabled={leaving} onClick={async () => {
            setLeaving(true); setSignOutError("");
            try { await logout(); router.replace("/login"); }
            catch { setSignOutError("Sign-out failed. Check your connection and try again."); }
            finally { setLeaving(false); }
          }} className="flex items-center gap-2 rounded-lg border border-[#D9D8CE] px-4 py-3 text-xs font-bold disabled:opacity-50"><LogOut size={15} />{leaving ? "Signing out…" : "Use another account"}</button>
        </div>
      </section>
    </main>;
  }

  return <>{children}</>;
}
