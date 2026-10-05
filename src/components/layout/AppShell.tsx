"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { AuthGuard } from "@/components/auth/AuthGuard";

type RoleKey = "instructor" | "commander" | "team" | "admin";

interface AppShellProps {
  children: React.ReactNode;
  pageTitle: string;
  /** Current workspace label; live permissions are independently enforced by the server. */
  role?: RoleKey;
  workspace?: boolean;
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

export function AppShell({ children, pageTitle, role, workspace = false }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(workspace);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <AuthGuard>
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
        <main className={`relative min-h-0 flex-1 ${workspace ? "overflow-hidden" : "overflow-y-auto"}`}>
          <ContentBackground />
          <div className={`relative z-10 ${workspace ? "flex h-full min-h-0 flex-col" : "p-4 md:p-8"}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
    </AuthGuard>
  );
}
