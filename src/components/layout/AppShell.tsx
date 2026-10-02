"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";

type RoleKey = "instructor" | "commander" | "team" | "admin";

interface AppShellProps {
  children: React.ReactNode;
  pageTitle: string;
  role?: RoleKey;
}

/* Subtle tactical grid for the main content area */
const ContentBackground = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {/* Major grid */}
    <div
      className="absolute inset-0 opacity-[0.04]"
      style={{
        backgroundImage:
          "linear-gradient(#556B3F 1px, transparent 1px), linear-gradient(90deg, #556B3F 1px, transparent 1px)",
        backgroundSize: "100px 100px",
      }}
    />
    {/* Minor grid */}
    <div
      className="absolute inset-0 opacity-[0.025]"
      style={{
        backgroundImage:
          "linear-gradient(#556B3F 1px, transparent 1px), linear-gradient(90deg, #556B3F 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    />
    {/* Corner coordinate label */}
    <div className="absolute bottom-4 right-4 text-[9px] font-mono font-bold tracking-widest text-[#71805A] opacity-40 select-none">
      GRID: 24A-T
    </div>
  </div>
);

export function AppShell({ children, pageTitle, role }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { user, loading, isFirebaseConfigured, role: sessionRole } = useAuth();
  const router = useRouter();

  // Auth guard: redirect to login ONLY when Firebase is configured, the user is
  // not authenticated via Google/Firebase AND has no demo session role.
  // This preserves the demo flow (name + role selection) alongside real Firebase auth.
  React.useEffect(() => {
    if (!loading && isFirebaseConfigured && !user && !sessionRole) {
      router.push("/");
    }
  }, [user, loading, isFirebaseConfigured, sessionRole, router]);

  // If loading and we need auth, maybe show a blank or skeleton, but for now just render
  if (isFirebaseConfigured && loading && !sessionRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5EE]">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-[#556B3F] animate-pulse" />
          <span className="text-[10px] font-black tracking-widest text-[#344438] uppercase">Authenticating...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F5EE]">
      {/* ── Mobile overlay ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar (desktop: always visible; mobile: drawer) ── */}
      <div
        className={`
          fixed md:relative z-40 md:z-auto h-full flex-shrink-0
          transition-transform duration-300
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((p) => !p)}
        />
      </div>

      {/* ── Main panel ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          pageTitle={pageTitle}
          role={role}
          onMenuToggle={() => setMobileMenuOpen((p) => !p)}
          mobileMenuOpen={mobileMenuOpen}
        />

        {/* Content */}
        <main className="relative flex-1 overflow-y-auto">
          <ContentBackground />
          <div className="relative z-10 p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
