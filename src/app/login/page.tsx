"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LoaderCircle, Shield, LockKeyhole, Check, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { accountDestination, type AccountRole } from "@/lib/roles";
import "./login.css";

type Mode = "login" | "register" | "reset";
function takeDestination(role: AccountRole): string {
  try {
    const path = sessionStorage.getItem("tactical_sim_redirect");
    sessionStorage.removeItem("tactical_sim_redirect");
    return accountDestination(role, path);
  } catch { return accountDestination(role, null); }
}

function GoogleMark() {
  return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>;
}

function TrainingIllustration() {
  return <svg className="access-terrain" viewBox="0 0 480 330" fill="none" role="img" aria-label="Illustrated tactical training map with a route connecting simulated teams">
    <defs><pattern id="access-grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" stroke="#d8c9a7" strokeOpacity=".12" /></pattern></defs>
    <rect width="480" height="330" fill="url(#access-grid)" />
    {[0, 18, 36, 54, 72].map((offset) => <path key={offset} d={`M-45 ${190 + offset}C80 ${-10 + offset} 185 ${320 + offset} 290 ${105 + offset}S420 ${35 + offset} 540 ${140 + offset}`} stroke="#c9c6aa" strokeOpacity=".22" />)}
    <path d="M78 248L171 194L292 145L392 78" stroke="#b99b61" strokeWidth="2" strokeDasharray="6 7" />
    <path d="M68 50H412V276H68Z" stroke="#d8c9a7" strokeOpacity=".22" />
    <path d="M68 73V50H91M389 50H412V73M412 253V276H389M91 276H68V253" stroke="#b99b61" strokeWidth="2" />
    {[[78,248],[171,194],[292,145],[392,78]].map(([x,y],i) => <g key={i}>
      <circle cx={x} cy={y} r="17" fill="#293b2e" stroke="#b99b61" strokeOpacity=".6" />
      <path d={`M${x} ${y-6}L${x+6} ${y}L${x} ${y+6}L${x-6} ${y}Z`} fill={i===3?"#d8c9a7":"#a9bd8b"} />
      <text x={x+23} y={y+4} fill="#d8c9a7" fontSize="9" fontFamily="monospace">{["ALPHA","BRAVO","CHECKPOINT","OBJECTIVE"][i]}</text>
    </g>)}
    <text x="70" y="30" fill="#adbaa6" fontSize="9" letterSpacing="2" fontFamily="monospace">SIMULATED TRAINING AREA</text>
    <text x="70" y="301" fill="#adbaa6" fontSize="9" fontFamily="monospace">2D TACTICAL / 3D TERRAIN</text>
  </svg>;
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, role, roleError, isFirebaseConfigured, isLocalPracticeAvailable, loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword, refreshAccountAccess, logout } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<"google" | "email" | "account" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!loading && user && role && !roleError && !busy) {
      router.replace(takeDestination(role));
    }
  }, [loading, user, busy, role, roleError, router]);

  const changeMode = (next: Mode) => {
    setMode(next); setError(""); setNotice(""); setPassword(""); setConfirmation(""); setShowPassword(false);
  };

  const googleSignIn = async () => {
    if (busy || !isFirebaseConfigured) return;
    setBusy("google"); setError(""); setNotice("");
    try { await loginWithGoogle(); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to sign in. Please try again."); }
    finally { setBusy(null); }
  };

  const emailSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !isFirebaseConfigured) return;
    setError(""); setNotice("");
    if (mode === "register" && password !== confirmation) { setError("Your passwords do not match."); return; }
    setBusy("email");
    try {
      if (mode === "reset") {
        await resetPassword(email);
        setNotice("If an account exists for this email, you will receive a password reset link. Check your inbox and spam folder.");
      } else {
        if (mode === "register") await registerWithEmail(email, password);
        else await loginWithEmail(email, password);
        setPassword(""); setConfirmation("");
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to sign in. Please try again."); }
    finally { setBusy(null); }
  };

  const disabled = !!busy || loading || !isFirebaseConfigured || !!user;
  const title = mode === "register" ? "Create your account." : mode === "reset" ? "Forgot your password?" : "Welcome back.";
  const subtitle = mode === "register" ? "Create a Commander account and prepare for your next exercise." : mode === "reset" ? "We’ll send a link to help you get back to training." : "Sign in to your assigned training workspace.";

  return <div className="access-page">
    <header className="access-header">
      <Link href="/" className="access-brand" aria-label="CHAKRAVYUH home"><span className="access-emblem"><Shield size={23} /></span><span>CHAKRAVYUH<small>DECISION-MAKING TRAINER</small></span></Link>
      <Link href="/" className="access-home"><ArrowLeft size={15} /> Back to website</Link>
    </header>
    <main className="access-main">
      <div className="access-frame">
        <aside className="access-story">
          <div className="access-story-top"><span className="access-eyebrow">THE TRAINING ENVIRONMENT</span><span className="access-edition">01 / ACCESS</span></div>
          <h1>Clarity in purpose.<br /><span>Confidence in<br />every decision.</span></h1>
          <p>Train together when information is incomplete, communications are disrupted, and every decision matters.</p>
          <TrainingIllustration />
          <div className="access-story-footer"><span><Check size={14} /> Shared exercises</span><span><Check size={14} /> Real-world terrain</span><span><Check size={14} /> Decision review</span></div>
        </aside>
        <section className="access-form-panel" aria-labelledby="access-title">
          <div className="access-form-content">
            <span className="access-eyebrow">YOUR NEXT EXERCISE STARTS HERE</span>
            <h2 id="access-title">{title}</h2><p className="access-subtitle">{subtitle}</p>
            {mode !== "reset" ? <>
              <div className="access-tabs" role="group" aria-label="Account access">
                <button type="button" aria-pressed={mode === "login"} disabled={!!busy} onClick={() => changeMode("login")}>Sign in</button>
                <button type="button" aria-pressed={mode === "register"} disabled={!!busy} onClick={() => changeMode("register")}>Create account</button>
              </div>
              <button type="button" className="access-google" disabled={disabled} onClick={googleSignIn}>{busy === "google" ? <LoaderCircle className="access-spinner" size={19} /> : <GoogleMark />} Continue with Google</button>
              <div className="access-divider"><span />or continue with email<span /></div>
            </> : <button className="access-back" type="button" disabled={!!busy} onClick={() => changeMode("login")}><ArrowLeft size={14} /> Back to sign in</button>}
            {!isFirebaseConfigured && <div className="access-notice access-notice-warning" role="status"><AlertCircle size={17} /><span>{isLocalPracticeAvailable ? <>Account sign-in is not configured here. <Link href="/maps">Open local map practice without signing in →</Link></> : "Account sign-in is unavailable on this deployment. Please contact your exercise organizer."}</span></div>}
            {roleError && <div className="access-notice access-notice-error" role="alert"><AlertCircle size={17} /><span>{roleError}</span></div>}
            {user && roleError && <div className="access-account-actions">
              <button type="button" disabled={!!busy || loading} onClick={async () => {
                setBusy("account"); setError("");
                try { await refreshAccountAccess(); }
                catch (err) { setError(err instanceof Error ? err.message : "Could not refresh account access."); }
                finally { setBusy(null); }
              }}>Refresh account access</button>
              <button type="button" disabled={!!busy || loading} onClick={async () => {
                setBusy("account"); setError("");
                try { await logout(); }
                catch { setError("Sign-out failed. Check your connection and try again."); }
                finally { setBusy(null); }
              }}>Use another account</button>
            </div>}
            {error && <div className="access-notice access-notice-error" role="alert"><AlertCircle size={17} /><span>{error}</span></div>}
            {notice && <div className="access-notice access-notice-success" role="status"><Check size={17} /><span>{notice}</span></div>}
            <form onSubmit={emailSignIn} className="access-form">
              <div className="access-field"><label htmlFor="access-email">Email address</label><input id="access-email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" disabled={disabled} value={email} onChange={(event) => setEmail(event.target.value)} /></div>
              {mode !== "reset" && <>
                <div className="access-field"><div className="access-label-row"><label htmlFor="access-password">Password</label>{mode === "login" && <button type="button" disabled={!!busy} onClick={() => changeMode("reset")}>Forgot password?</button>}</div>
                  <div className="access-password"><input id="access-password" type={showPassword ? "text" : "password"} autoComplete={mode === "register" ? "new-password" : "current-password"} required minLength={mode === "register" ? 6 : 1} placeholder={mode === "register" ? "At least 6 characters" : "Enter your password"} disabled={disabled} value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} disabled={disabled} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
                </div>
                {mode === "register" && <div className="access-field"><label htmlFor="access-confirmation">Confirm password</label><input id="access-confirmation" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={6} placeholder="Enter your password again" disabled={disabled} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></div>}
                <p className="access-role-help">Create a room to be its Instructor, or join a room as a Trainee. One account can lead an exercise and train in another.</p>
              </>}
              <button type="submit" className="access-submit" disabled={disabled}>{busy === "email" ? <><LoaderCircle size={18} className="access-spinner" /> Please wait</> : <>{mode === "register" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}<ArrowRight size={17} /></>}</button>
            </form>
            <p className="access-privacy"><LockKeyhole size={13} /> Your account. Your team. Your training.</p>
          </div>
        </section>
      </div>
      <footer className="access-footer"><span>CHAKRAVYUH · TRAINING WITH PURPOSE</span><span>SIMULATED EXERCISES. SHARED DECISIONS.</span></footer>
    </main>
  </div>;
}
