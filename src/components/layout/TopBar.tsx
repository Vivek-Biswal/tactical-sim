"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Menu, X, LogOut, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { accountRoleLabels } from "@/lib/roles";

type RoleKey = "instructor" | "commander" | "team" | "admin";

interface TopBarProps {
  pageTitle: string;
  /** Legacy page metadata; it never determines the displayed account role. */
  role?: RoleKey;
  /** Mobile sidebar toggle */
  onMenuToggle?: () => void;
  mobileMenuOpen?: boolean;
}

export function TopBar({ pageTitle, onMenuToggle, mobileMenuOpen }: TopBarProps) {
  const { user, role, logout, isFirebaseConfigured, refreshAccountAccess } = useAuth();
  const displayRole = !isFirebaseConfigured ? "LOCAL PRACTICE" : role ? accountRoleLabels[role].toUpperCase() : "ACCOUNT ACCESS";
  const [leaving, setLeaving] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  const handleLogout = async () => {
    if (leaving) return;
    setLeaving(true);
    try {
      await logout();
      addToast({
        variant: "info",
        title: isFirebaseConfigured ? "Signed out" : "Practice closed",
        message: isFirebaseConfigured ? "You have signed out of your account." : "You have left local practice."
      });
      router.push("/");
    } catch {
      addToast({ variant: "error", title: "Could not sign out", message: "Check your connection and try again." });
    } finally { setLeaving(false); }
  };

  return (
    <header className="h-14 bg-white border-b border-[#D9D8CE] flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-40">
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          className="md:hidden flex-shrink-0 text-[#556B3F] hover:text-[#344438] transition-colors p-1"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="min-w-0">
          <h2 className="text-sm md:text-base font-black uppercase tracking-widest text-[#263229] truncate">
            {pageTitle}
          </h2>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 md:gap-5 flex-shrink-0">
        {/* System label — hidden on small screens */}
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold tracking-widest text-[#71805A]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4A7A3A] animate-pulse" />
          {isFirebaseConfigured ? "TRAINING SYSTEM" : "LOCAL PRACTICE"}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-5 bg-[#D9D8CE]" />

        {/* Role badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F7F5EE] border border-[#D9D8CE] rounded" aria-label={isFirebaseConfigured ? `Account role: ${displayRole}` : "Local practice; no authenticated account"}>
          <div className="w-6 h-6 rounded bg-[#556B3F] flex items-center justify-center flex-shrink-0">
            {user && user.photoURL ? (
              <Image src={user.photoURL} alt="Profile" width={24} height={24} unoptimized className="w-full h-full rounded object-cover" />
            ) : (
              <span className="text-white font-black text-[10px]">
                {displayRole.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex flex-col hidden sm:flex">
            <span className="text-[10px] font-black tracking-wider text-[#344438] leading-tight">
              {displayRole}
            </span>
            {user && user.displayName && (
              <span className="text-[9px] font-medium text-[#687066] leading-tight">{user.displayName}</span>
            )}
          </div>
        </div>

        {isFirebaseConfigured && user && <button type="button" onClick={async () => {
          try { await refreshAccountAccess(); }
          catch (error) { addToast({ variant: "error", title: "Could not refresh access", message: error instanceof Error ? error.message : "Please try again." }); }
        }} className="flex h-8 w-8 items-center justify-center rounded text-[#687066] hover:bg-[#F0EEE7] hover:text-[#556B3F]" title="Refresh account access after an administrator changes your role" aria-label="Refresh account access"><RefreshCw size={16} /></button>}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={leaving}
          className="flex items-center justify-center w-8 h-8 rounded text-[#687066] hover:bg-[#F0EEE7] hover:text-[#A94A3F] transition-colors"
          title={isFirebaseConfigured ? "Sign out" : "Leave local practice"}
          aria-label={isFirebaseConfigured ? "Sign out" : "Leave local practice"}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
