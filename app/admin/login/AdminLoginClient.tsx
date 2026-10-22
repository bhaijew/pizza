"use client";

import { useActionState, useState, useEffect } from "react";
import { adminLogin } from "@/lib/admin-actions";
import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  UtensilsCrossed,
  Bike,
  FileText,
  KeyRound,
  Sparkles,
  Clock,
  Activity,
  AlertCircle,
} from "lucide-react";

interface AdminLoginClientProps {
  setupName?: string;
}

export default function AdminLoginClient({
  setupName = "Soule What Management",
}: AdminLoginClientProps) {
  const [mounted, setMounted] = useState(false);
  const [state, formAction, isPending] = useActionState(adminLogin, {
    error: null,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [currentDateStr, setCurrentDateStr] = useState("");

  useEffect(() => {
    setMounted(true);
    try {
      const now = new Date();
      setCurrentDateStr(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
    } catch {
      setCurrentDateStr("Shift Active");
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState("CapsLock"));
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState("CapsLock"));
    }
  };

  if (!mounted) {
    return (
      <div
        suppressHydrationWarning
        className="min-h-screen w-full bg-[#f8fafc] flex items-center justify-center"
      />
    );
  }

  const rawName = setupName?.trim() || "Soule What Management";
  const hasManagement = rawName.toLowerCase().includes("management");
  const headlineTitle = hasManagement ? rawName : `${rawName} Management`;

  return (
    <div
      suppressHydrationWarning
      className="min-h-screen w-full relative overflow-x-hidden flex flex-col justify-between"
      style={{
        backgroundColor: "#f8fafc",
        backgroundImage: `
          radial-gradient(#e2e8f0 1.2px, transparent 1.2px),
          radial-gradient(#f1f5f9 1.2px, #f8fafc 1.2px)
        `,
        backgroundSize: "28px 28px",
        backgroundPosition: "0 0, 14px 14px",
        color: "#0f172a",
        fontFamily: "var(--font-body, var(--font-sans, system-ui, sans-serif))",
      }}
    >
      {/* ─── Ambient Glow Accents (Subtle Light Theme Depth) ─── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/4 -translate-x-1/2 w-[520px] h-[360px] blur-[130px] rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(circle, rgba(254, 215, 170, 0.45) 0%, rgba(254, 243, 199, 0.25) 50%, transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-1/4 translate-x-1/3 w-[600px] h-[400px] blur-[140px] rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(circle, rgba(254, 202, 202, 0.35) 0%, rgba(254, 226, 226, 0.2) 50%, transparent 70%)",
        }}
      />

      {/* ═══════════════════════════════════════════════════════════════
          COMPONENT 1: TOP EXECUTIVE HEADER BAR
          ═══════════════════════════════════════════════════════════════ */}
      <header className="relative z-10 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-3.5 sm:px-6 lg:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Brand & Setup Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-1.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/70 shadow-xs flex-shrink-0">
              <BrandLogo size={28} showGlow={false} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm sm:text-base lg:text-lg tracking-tight text-slate-900 uppercase truncate">
                  {rawName}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-800 border border-amber-200/80 flex-shrink-0">
                  Store POS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block truncate">
                Central Operations &amp; Point of Sale Terminal
              </p>
            </div>
          </div>

          {/* System Status & Customer Menu Link */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Live Status Pill */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="hidden xs:inline">Online</span>
              <span className="text-[10px] text-emerald-600/80 hidden md:inline font-mono">
                v2.4
              </span>
            </div>

            {/* Back to Menu */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 active:bg-slate-300/80 rounded-lg transition-colors border border-slate-200 shadow-xs"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span className="hidden sm:inline">Customer Menu</span>
              <span className="sm:hidden">Menu</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN CONTENT AREA (DUAL-PANE ON DESKTOP, CENTERED ON MOBILE)
          ═══════════════════════════════════════════════════════════════ */}
      <main className="relative z-10 w-full flex-1 flex items-center justify-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ─────────────────────────────────────────────────────────────
              COMPONENT 2: DESKTOP SHOWCASE & SETUP INFO PANEL (lg:col-span-7)
              ───────────────────────────────────────────────────────────── */}
          <div className="hidden lg:flex flex-col space-y-6 lg:col-span-7 pr-2">
            
            {/* Enterprise Badge */}
            <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-red-50 to-orange-50 text-red-700 border border-red-200/70 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              <span>Smart Restaurant Operations Engine</span>
            </div>

            {/* Main Welcome & Setup Headline */}
            <div>
              <h1 className="text-3xl xl:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 bg-clip-text text-transparent">
                  {headlineTitle}
                </span>
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                Unified cloud workspace for real-time order processing, kitchen display coordination, automatic WhatsApp rider alerts, and daily financial shift reconciliation.
              </p>
            </div>

            {/* Feature Cards Grid (4 Key Components) */}
            <div className="grid grid-cols-2 gap-3.5 pt-1">
              
              {/* Feature 1: POS & Kitchen Display */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all group">
                <div className="w-9 h-9 rounded-lg bg-orange-100/80 text-orange-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">
                  Kitchen KDS &amp; POS
                </h3>
                <p className="mt-1 text-xs text-slate-500 leading-normal">
                  Live ticket sequencing with instant chimes and station routing.
                </p>
              </div>

              {/* Feature 2: WhatsApp & Rider Fleet */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all group">
                <div className="w-9 h-9 rounded-lg bg-emerald-100/80 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Bike className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">
                  Rider &amp; WhatsApp Sync
                </h3>
                <p className="mt-1 text-xs text-slate-500 leading-normal">
                  Automated customer notifications and live delivery tracking links.
                </p>
              </div>

              {/* Feature 3: Daily Shift & Cash Audits */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all group">
                <div className="w-9 h-9 rounded-lg bg-blue-100/80 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">
                  Shift Closing &amp; Cash
                </h3>
                <p className="mt-1 text-xs text-slate-500 leading-normal">
                  End-of-day reconciliation, cash drawer logs, and WhatsApp closing reports.
                </p>
              </div>

              {/* Feature 4: Role-Based Protection */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all group">
                <div className="w-9 h-9 rounded-lg bg-purple-100/80 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">
                  Role-Based Security
                </h3>
                <p className="mt-1 text-xs text-slate-500 leading-normal">
                  Independent cashier PINs, kitchen access, and admin controls.
                </p>
              </div>
            </div>

            {/* Live Terminal Telemetry Widget */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-50 via-white to-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span>
                  <strong className="text-slate-800 font-semibold">{rawName} Cloud POS</strong> • Online
                </span>
              </div>
              <div className="flex items-center gap-4 text-slate-500">
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {currentDateStr || "Today"}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                  <Lock className="w-3 h-3 text-slate-400" />
                  AES-256
                </span>
              </div>
            </div>

          </div>

          {/* ─────────────────────────────────────────────────────────────
              COMPONENT 3: THE SLEEK WHITE LOGIN CARD (lg:col-span-5)
              ───────────────────────────────────────────────────────────── */}
          <div className="w-full max-w-md mx-auto lg:max-w-none lg:col-span-5">
            
            {/* Card Container */}
            <div
              className="w-full bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 relative transition-all"
              style={{
                boxShadow:
                  "0 20px 45px -15px rgba(15, 23, 42, 0.08), 0 0 1px 1px rgba(0, 0, 0, 0.04)",
              }}
            >
              
              {/* Header Icon & Brand */}
              <div className="text-center mb-6">
                
                {/* Brand Logo Container with soft badge styling */}
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md shadow-red-500/25 mb-4 transition-transform hover:scale-105">
                  <BrandLogo size={36} showGlow={false} />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 mb-2">
                  <span>{rawName}</span>
                </div>

                <h2 className="text-2xl font-black tracking-tight text-slate-900 m-0">
                  Store Manager
                </h2>
                
                <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
                  Enter your admin password or staff access key to sign in
                </p>
              </div>

              {/* Error Alert Component */}
              {state.error && (
                <div
                  role="alert"
                  className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200/90 text-red-700 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug font-medium">{state.error}</span>
                </div>
              )}

              {/* CapsLock Warning Helper */}
              {capsLockActive && (
                <div className="mb-3 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span className="font-semibold">Caps Lock is ON</span>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────
                  THE LOGIN FORM (FIELDS KEPT UNCHANGED FOR COMPATIBILITY)
                  ───────────────────────────────────────────────────────── */}
              <form action={formAction} className="space-y-4">
                
                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="password"
                      className="block text-xs sm:text-sm font-semibold text-slate-700"
                    >
                      Admin Password
                    </label>
                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      Encrypted
                    </span>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>

                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password..."
                      required
                      autoFocus
                      onKeyDown={handleKeyDown}
                      onKeyUp={handleKeyUp}
                      className="w-full pl-10 pr-11 py-3 text-sm sm:text-base rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all box-border"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 active:from-red-800 active:to-red-700 shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Sign In to Management</span>
                    </>
                  )}
                </button>
              </form>

              {/* Keyboard tip & Quick links */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col items-center gap-2 text-center">
                <p className="text-[11px] text-slate-400 font-medium">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[10px]">Enter ↵</kbd> to sign in directly
                </p>

                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 transition-colors mt-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                  <span>Return to Customer Menu</span>
                </Link>
              </div>

            </div>

            {/* Mobile-Only Feature Highlights Pill Row (Below Card) */}
            <div className="mt-5 lg:hidden grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200 shadow-2xs flex items-center gap-2">
                <UtensilsCrossed className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                <span className="font-semibold text-slate-700 text-[11px]">Kitchen KDS</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200 shadow-2xs flex items-center gap-2">
                <Bike className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="font-semibold text-slate-700 text-[11px]">Rider WhatsApp</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200 shadow-2xs flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span className="font-semibold text-slate-700 text-[11px]">Shift Closing</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200 shadow-2xs flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                <span className="font-semibold text-slate-700 text-[11px]">Staff PIN Access</span>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════════
          COMPONENT 4: FOOTER / SECURITY & AUDIT BAR
          ═══════════════════════════════════════════════════════════════ */}
      <footer className="relative z-10 w-full border-t border-slate-200/80 bg-white/60 backdrop-blur-xs py-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">
              {rawName}
            </span>
            <span>&bull;</span>
            <span>Store Operations Cloud Suite</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Isolated Tenant Security
            </span>
            <span>&bull;</span>
            <span>All Rights Reserved &copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
