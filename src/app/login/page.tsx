"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Terminal, Map as MapIcon, Radio, ChevronRight, Target, Activity } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/Toast";

/* ─────────────────────────────────────────────
   Subtle Topo Grid — rendered via SVG + CSS
───────────────────────────────────────────── */
const TopoLeft = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Major grid */}
    <div
      className="absolute inset-0 opacity-[0.07]"
      style={{
        backgroundImage:
          "linear-gradient(#556B3F 1px, transparent 1px), linear-gradient(90deg, #556B3F 1px, transparent 1px)",
        backgroundSize: "80px 80px",
      }}
    />
    {/* Minor grid */}
    <div
      className="absolute inset-0 opacity-[0.04]"
      style={{
        backgroundImage:
          "linear-gradient(#556B3F 1px, transparent 1px), linear-gradient(90deg, #556B3F 1px, transparent 1px)",
        backgroundSize: "16px 16px",
      }}
    />
    {/* Topo contour lines */}
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.06]"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <path d="M-100 300 Q 200 100 500 350 T 900 200 T 1300 400" fill="none" stroke="#344438" strokeWidth="2" />
      <path d="M-100 380 Q 200 180 500 430 T 900 280 T 1300 480" fill="none" stroke="#344438" strokeWidth="1.5" />
      <path d="M-100 460 Q 200 260 500 510 T 900 360 T 1300 560" fill="none" stroke="#344438" strokeWidth="1" />
      <path d="M-100 540 Q 200 340 500 590 T 900 440 T 1300 640" fill="none" stroke="#344438" strokeWidth="0.8" />
      <path d="M 0 650 Q 300 500 600 700 T 1000 550" fill="none" stroke="#344438" strokeWidth="0.5" />
    </svg>

    {/* Coordinate labels */}
    <div className="absolute top-[8%] left-[4%] text-[10px] font-mono font-bold tracking-widest text-[#71805A] opacity-60">
      34°N / 77°E
    </div>
    <div className="absolute bottom-[8%] right-[4%] text-[10px] font-mono font-bold tracking-widest text-[#71805A] opacity-60">
      GRID 24A-TANGO
    </div>
    <div className="absolute top-24 right-8 text-[10px] font-mono font-bold tracking-widest text-[#71805A] opacity-60">
      ELEV 3,240M
    </div>

    {/* Crosshair accent — top-right */}
    <div className="absolute top-8 right-8 w-16 h-16 opacity-20">
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="28" fill="none" stroke="#B69B63" strokeWidth="1" />
        <circle cx="32" cy="32" r="14" fill="none" stroke="#B69B63" strokeWidth="1" />
        <line x1="0" y1="32" x2="64" y2="32" stroke="#B69B63" strokeWidth="1" />
        <line x1="32" y1="0" x2="32" y2="64" stroke="#B69B63" strokeWidth="1" />
      </svg>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type RoleKey = "instructor" | "commander" | "team";

interface RoleConfig {
  label: string;
  sublabel: string;
  icon: React.ElementType;
  path: string;
}

const roles: Record<RoleKey, RoleConfig> = {
  instructor: {
    label: "Instructor",
    sublabel: "Manage scenarios & monitor trainees",
    icon: Terminal,
    path: "/instructor",
  },
  commander: {
    label: "Commander",
    sublabel: "C2 dashboard & tactical map",
    icon: MapIcon,
    path: "/commander",
  },
  team: {
    label: "Team Member",
    sublabel: "Field SITREP & team operations",
    icon: Radio,
    path: "/team",
  },
};

/* ─────────────────────────────────────────────
   Main Login Page
───────────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { user, loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword, isFirebaseConfigured, setRole, role: globalRole, loading } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [notice, setNotice] = useState("");
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleKey | null>(null);
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  /** Consume saved redirect destination (set by AppShell when unauthenticated user hits a protected route) */
  const consumeRedirectDestination = (): string | null => {
    try {
      const dest = sessionStorage.getItem("tactical_sim_redirect");
      if (dest) sessionStorage.removeItem("tactical_sim_redirect");
      return dest?.startsWith("/") && !dest.startsWith("//") && !dest.includes("\\") && !dest.startsWith("/login") ? dest : null;
    } catch {
      return null;
    }
  };

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!loading && user && !isLoggingIn) {
      const savedDest = consumeRedirectDestination();
      if (savedDest) {
        router.push(savedDest);
      } else if (globalRole && Object.keys(roles).includes(globalRole)) {
        router.push(roles[globalRole as RoleKey].path);
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, loading, globalRole, router, isLoggingIn]);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name for demo mode.");
      return;
    }
    if (!selectedRole) {
      setError("Please select your operational role.");
      return;
    }
    setError("");
    setRole(selectedRole);
    const savedDest = consumeRedirectDestination();
    router.push(savedDest ?? roles[selectedRole].path);
  };

  const handleGoogleLogin = async () => {
    if (!selectedRole) {
      setError("Please select your training role first.");
      return;
    }
    setError("");
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
      setRole(selectedRole);
      addToast({
        variant: "success",
        title: "Authentication Successful",
        message: "Welcome to TACTICAL-SIM.",
      });
      setIsLoggingIn(false);
      // The auth-state listener and role are ready before redirecting.
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.";
      console.error("[TACTICAL-SIM] Google sign-in error:", err);
      setError(message);
      setIsLoggingIn(false);
      addToast({
        variant: "error",
        title: "Authentication Failed",
        message,
      });
    }
  };

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode !== "reset" && !selectedRole) {
      setError("Please select your training role first.");
      return;
    }
    setError("");
    setNotice("");
    setIsLoggingIn(true);
    try {
      if (mode === "reset") {
        await resetPassword(email);
        setNotice("If an account exists for this email, you will receive a password reset link.");
      } else {
        if (mode === "register") await registerWithEmail(email, password);
        else await loginWithEmail(email, password);
        setRole(selectedRole);
        setPassword("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const changeMode = (next: "login" | "register" | "reset") => {
    setMode(next);
    setPassword("");
    setError("");
    setNotice("");
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F7F5EE]">

      {/* ══════════════════════════════════════════
          LEFT — Command Environment (55%)
      ══════════════════════════════════════════ */}
      <div className="relative lg:w-[55%] bg-[#EFE8D8] flex flex-col justify-between p-8 md:p-14 overflow-hidden order-2 lg:order-1 min-h-[50vh] lg:min-h-screen">
        <TopoLeft />

        {/* Top branding */}
        <div className="relative z-10 flex items-center gap-3">
          {/* Fictional hexagonal emblem */}
          <div className="w-12 h-12 flex-shrink-0">
            <svg viewBox="0 0 48 48" className="w-12 h-12" xmlns="http://www.w3.org/2000/svg">
              <polygon points="24,3 42,13.5 42,34.5 24,45 6,34.5 6,13.5" fill="none" stroke="#556B3F" strokeWidth="1.5" />
              <polygon points="24,10 36,17 36,31 24,38 12,31 12,17" fill="none" stroke="#B69B63" strokeWidth="1" />
              <circle cx="24" cy="24" r="4.5" fill="none" stroke="#556B3F" strokeWidth="1.5" />
              <line x1="24" y1="14" x2="24" y2="19.5" stroke="#556B3F" strokeWidth="1" />
              <line x1="24" y1="28.5" x2="24" y2="34" stroke="#556B3F" strokeWidth="1" />
              <line x1="14" y1="24" x2="19.5" y2="24" stroke="#556B3F" strokeWidth="1" />
              <line x1="28.5" y1="24" x2="34" y2="24" stroke="#556B3F" strokeWidth="1" />
            </svg>
          </div>
          <div>
            <div className="font-black text-xl tracking-widest text-[#344438]">TACTICAL-SIM</div>
            <div className="text-[10px] font-bold tracking-[0.2em] text-[#B69B63]">DEFENCE TRAINING ENVIRONMENT</div>
          </div>
        </div>

        {/* Center hero content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
          <div className="inline-flex items-center gap-2 self-start mb-6 px-3 py-1 bg-[#344438]/10 border border-[#556B3F]/30">
            <Target className="w-3 h-3 text-[#556B3F]" />
            <span className="text-[#556B3F] text-[10px] font-black tracking-[0.2em]">OPERATIONAL TRAINING PORTAL</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-[#263229] tracking-tight leading-[1.05] mb-6">
            COMMAND.<br />
            DECIDE.<br />
            <span className="text-[#556B3F]">ADAPT.</span>
          </h1>

          <p className="text-[#687066] text-base md:text-lg max-w-md leading-relaxed font-medium mb-10">
            Immersive decision-making training for degraded communication environments.
          </p>

          {/* Operation info panel */}
          <div className="bg-[#344438]/[0.06] border border-[#556B3F]/25 rounded max-w-md">
            <div className="px-5 py-3 border-b border-[#556B3F]/20 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#B69B63]" />
              <span className="text-[11px] font-black tracking-[0.2em] text-[#344438]">OPERATION SILENT LINK</span>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-4">
              {[
                { label: "EXERCISE STATUS", value: "ACTIVE", valueClass: "text-[#4A7A3A]" },
                { label: "COMMS STATUS", value: "DEGRADED", valueClass: "text-[#A94A3F]" },
                { label: "TEAM STATUS", value: "READY", valueClass: "text-[#4A7A3A]" },
                { label: "GRID", value: "24A", valueClass: "text-[#263229]" },
                { label: "SESSION", value: "TRAINING", valueClass: "text-[#263229]" },
              ].map((row) => (
                <div key={row.label} className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold tracking-[0.18em] text-[#687066]">{row.label}</span>
                  <span className={`text-xs font-black tracking-wider font-mono ${row.valueClass}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom metadata */}
        <div className="relative z-10 flex gap-6 flex-wrap text-[10px] font-mono font-bold tracking-widest text-[#71805A] opacity-70">
          <span>SYSTEM ID: TS-01</span>
          <span>ACCESS LEVEL: TRAINING</span>
          <span>ENVIRONMENT: SIMULATION</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT — Login Card (45%)
      ══════════════════════════════════════════ */}
      <div className="lg:w-[45%] flex items-center justify-center p-6 md:p-12 order-1 lg:order-2 bg-[#F7F5EE]">
        <div className="w-full max-w-md">

          {/* System metadata row */}
          <div className="flex items-center justify-between mb-8 text-[10px] font-mono font-bold tracking-widest text-[#71805A]">
            <span>TS-01 / INDIA</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4A7A3A] animate-pulse inline-block" />
              STATUS: ONLINE
            </span>
          </div>

          {/* Login card */}
          <div className="bg-[#FFFFFF] rounded-xl border border-[#D9D8CE] shadow-lg overflow-hidden">
            {/* Olive top strip */}
            <div className="h-1.5 bg-[#556B3F]" />

            <div className="px-8 pt-8 pb-10">

              {/* Card brand */}
              <div className="flex items-center gap-2 mb-7">
                <Shield className="w-5 h-5 text-[#556B3F]" />
                <span className="text-xs font-black tracking-[0.2em] text-[#344438]">TACTICAL-SIM</span>
              </div>

              <div className="text-[10px] font-bold tracking-[0.2em] text-[#B69B63] uppercase mb-1">
                Secure Training Access
              </div>
              <h2 className="text-3xl font-black text-[#263229] mb-2 tracking-tight">{mode === "register" ? "Create Your Account" : mode === "reset" ? "Reset Password" : "Welcome Back"}</h2>
              <p className="text-[#687066] text-sm font-medium mb-8 leading-relaxed">
                Enter the training environment to continue your exercise.
              </p>

              <div className="flex flex-col gap-5">

                {/* Role selector (used for both flows) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black tracking-[0.15em] text-[#344438] uppercase">
                    Training Role
                  </label>
                  <div className="flex flex-col gap-2">
                    {(Object.entries(roles) as [RoleKey, RoleConfig][]).map(([key, role]) => {
                      const Icon = role.icon;
                      const isSelected = selectedRole === key;
                      return (
                        <button
                          type="button"
                          key={key}
                          aria-pressed={isSelected}
                          disabled={isLoggingIn}
                          onClick={() => {
                            setSelectedRole(key);
                            setError("");
                          }}
                          className={`flex items-center gap-4 px-4 py-3 rounded-lg border text-left transition-all ${
                            isSelected
                              ? "border-[#556B3F] bg-[#556B3F]/[0.06] ring-1 ring-[#556B3F]/20"
                              : "border-[#D9D8CE] bg-[#F7F5EE] hover:border-[#71805A] hover:bg-[#EFE8D8]/70"
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected
                                ? "bg-[#556B3F] text-white"
                                : "bg-[#EFE8D8] text-[#556B3F]"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-sm font-black tracking-wide ${
                                isSelected ? "text-[#344438]" : "text-[#263229]"
                              }`}
                            >
                              {role.label}
                            </div>
                            <div className="text-xs text-[#687066] font-medium truncate">
                              {role.sublabel}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-[#556B3F] flex items-center justify-center flex-shrink-0">
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Validation error */}
                {error && (
                  <div role="alert" className="flex items-center gap-2 px-3 py-2.5 bg-[#A94A3F]/[0.08] border border-[#A94A3F]/30 rounded text-[#A94A3F] text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A94A3F] flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Authentication Controls */}
                <div className="mt-2 space-y-4">
                  <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isLoggingIn || loading || !isFirebaseConfigured}
                      className="w-full flex items-center justify-center gap-3 bg-white border border-[#D9D8CE] hover:bg-[#F7F5EE] active:bg-[#EFE8D8] text-[#263229] py-3.5 rounded-lg font-black text-sm tracking-widest transition-all shadow-sm disabled:opacity-60 disabled:cursor-wait"
                    >
                      {isLoggingIn ? (
                        <>
                          <span className="w-4 h-4 rounded-full border-2 border-[#556B3F] border-t-transparent animate-spin flex-shrink-0" />
                          AUTHENTICATING...
                        </>
                      ) : (
                        <>
                          {/* Official Google "G" icon */}
                          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          CONTINUE WITH GOOGLE
                        </>
                      )}
                    </button>
                  {!isFirebaseConfigured && (
                    <div className="text-center p-3 bg-[#FFF9E6] border border-[#F0D57D] rounded-lg">
                      <p className="text-[11px] font-bold text-[#8A5C2A] uppercase tracking-wider">
                        Firebase authentication is not configured. Using demo flow.
                      </p>
                    </div>
                  )}

                  <>
                      <div className="flex items-center gap-3 text-[10px] font-bold tracking-widest text-[#71805A]"><span className="h-px flex-1 bg-[#D9D8CE]" />OR USE EMAIL<span className="h-px flex-1 bg-[#D9D8CE]" /></div>
                      <form onSubmit={handleEmailSubmit} className="space-y-4">
                        <div>
                          <label htmlFor="login-email" className="block mb-2 text-[10px] font-black tracking-widest text-[#344438]">EMAIL ADDRESS</label>
                          <input id="login-email" type="email" autoComplete="email" required maxLength={254} value={email} disabled={isLoggingIn} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-4 py-3 rounded-lg border border-[#D9D8CE] bg-[#F7F5EE] text-[#263229] text-sm focus:outline-none focus:ring-2 focus:ring-[#556B3F]/30" />
                        </div>
                        {mode !== "reset" && <div>
                          <label htmlFor="login-password" className="block mb-2 text-[10px] font-black tracking-widest text-[#344438]">PASSWORD</label>
                          <input id="login-password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} required minLength={mode === "register" ? 6 : 1} value={password} disabled={isLoggingIn} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-[#D9D8CE] bg-[#F7F5EE] text-[#263229] text-sm focus:outline-none focus:ring-2 focus:ring-[#556B3F]/30" />
                          {mode === "register" && <p className="mt-2 text-xs text-[#687066]">Use at least 6 characters. Your project may require a stronger password.</p>}
                        </div>}
                        {notice && <p role="status" className="p-3 rounded-lg bg-[#556B3F]/10 text-sm text-[#344438]">{notice}</p>}
                        <button type="submit" disabled={isLoggingIn || loading || !isFirebaseConfigured} className="w-full bg-[#556B3F] hover:bg-[#344438] text-white py-3.5 rounded-lg font-black text-sm tracking-widest disabled:opacity-60 disabled:cursor-wait">{isLoggingIn ? "PLEASE WAIT…" : mode === "register" ? "CREATE ACCOUNT" : mode === "reset" ? "SEND RESET LINK" : "SIGN IN WITH EMAIL"}</button>
                      </form>
                      <div className="flex flex-wrap justify-between gap-3 text-xs font-bold text-[#556B3F]">
                        <button type="button" disabled={isLoggingIn} onClick={() => changeMode(mode === "login" ? "register" : "login")} className="hover:underline">{mode === "login" ? "New here? Create an account" : "Back to sign in"}</button>
                        {mode === "login" && <button type="button" disabled={isLoggingIn} onClick={() => changeMode("reset")} className="hover:underline">Forgot password?</button>}
                      </div>
                  </>

                  {/* Fallback Demo Flow */}
                  {!isFirebaseConfigured && <form onSubmit={handleDemoSubmit} className="flex flex-col gap-4 mt-4 pt-4 border-t border-[#D9D8CE]">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black tracking-[0.15em] text-[#344438] uppercase">
                        Demo Access Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setError("");
                        }}
                        className="w-full px-4 py-3 rounded-lg border border-[#D9D8CE] bg-[#F7F5EE] text-[#263229] placeholder-[#A0A59E] font-medium text-sm focus:outline-none focus:border-[#556B3F] focus:ring-2 focus:ring-[#556B3F]/15 transition-all"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-3 bg-[#556B3F] hover:bg-[#344438] active:scale-[0.99] text-white py-3.5 rounded-lg font-black text-sm tracking-widest transition-all shadow-md hover:shadow-lg"
                    >
                      ENTER DEMO TRAINING
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </form>}
                </div>

                {/* System status */}
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-[0.18em] text-[#71805A] mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4A7A3A]" />
                  TRAINING SYSTEM • ONLINE
                </div>
              </div>
            </div>
          </div>

          {/* Footer metadata */}
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-1 justify-center text-[10px] font-mono font-bold tracking-widest text-[#71805A] opacity-70">
            <span>ACCESS LEVEL: TRAINING</span>
            <span>ENVIRONMENT: SIMULATION</span>
          </div>
        </div>
      </div>
    </div>
  );
}
