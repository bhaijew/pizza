"use client";

import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { superAdminLogin } from "@/lib/super-admin-actions";
import {
  Crown,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Store,
  Clock,
  Sparkles,
  Lock,
  Server,
  Zap,
  Activity,
} from "lucide-react";

export default function SuperAdminLoginPage() {
  const [mounted, setMounted] = useState(false);
  const [state, formAction, isPending] = useActionState(superAdminLogin, {
    error: null,
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [pakistanTime, setPakistanTime] = useState("");
  const [pakistanDate, setPakistanDate] = useState("");

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setPakistanTime(
        now.toLocaleTimeString("en-US", {
          timeZone: "Asia/Karachi",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setPakistanDate(
        now.toLocaleDateString("en-US", {
          timeZone: "Asia/Karachi",
          weekday: "short",
          day: "numeric",
          month: "short",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
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

  const handleQuickFill = () => {
    setPassword("superadmin123");
  };

  if (!mounted) {
    return (
      <div
        suppressHydrationWarning
        style={{
          minHeight: "100dvh",
          background: "#080b14",
        }}
      />
    );
  }

  return (
    <div
      suppressHydrationWarning
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "radial-gradient(ellipse 90% 60% at 50% -15%, rgba(239, 68, 68, 0.22), transparent 70%), radial-gradient(ellipse 70% 50% at 50% 115%, rgba(234, 88, 12, 0.15), transparent 70%), #070a12",
        color: "#f8fafc",
        fontFamily: "var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
        position: "relative",
        overflowX: "hidden",
        padding: "20px 16px",
      }}
    >
      {/* Ambient Decorative High-Tech Grid */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px)
          `,
          backgroundSize: "36px 36px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, #000 50%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, #000 50%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Ambient Top Glow Orbs */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-80px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "560px",
          height: "300px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(239, 68, 68, 0.28) 0%, rgba(234, 88, 12, 0.12) 60%, transparent 80%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      {/* ─── TOP HEADER BAR ─── */}
      <header
        style={{
          width: "100%",
          maxWidth: "1180px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          position: "relative",
          zIndex: 20,
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            color: "#f8fafc",
            transition: "opacity 0.2s ease",
          }}
          className="hover:opacity-85"
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
            }}
          >
            <Crown size={18} />
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 900, letterSpacing: "-0.01em" }}>
              Pizza Mafia Multi-Tenant HQ
            </div>
            <div style={{ fontSize: "10.5px", color: "#94a3b8", fontWeight: 600 }}>
              Executive SaaS Cloud Gateway
            </div>
          </div>
        </Link>

        {/* Live Pakistan Clock & System Telemetry Pill */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {pakistanTime && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "6px 12px",
                borderRadius: "20px",
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(12px)",
                fontSize: "11px",
                fontWeight: 700,
                color: "#e2e8f0",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 8px #10b981",
                  display: "inline-block",
                }}
              />
              <Clock size={12} className="text-emerald-400" />
              <span>{pakistanDate} • <span style={{ fontFamily: "monospace", color: "#38bdf8" }}>{pakistanTime} PKT</span></span>
            </div>
          )}

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "20px",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              fontSize: "11px",
              fontWeight: 700,
              color: "#34d399",
            }}
          >
            <Activity size={12} />
            <span>Supabase Cloud Sync: Live</span>
          </div>
        </div>
      </header>

      {/* ─── MAIN LOGIN STAGE ─── */}
      <main
        style={{
          width: "100%",
          maxWidth: "460px",
          margin: "32px auto",
          position: "relative",
          zIndex: 20,
        }}
      >
        {/* Floating Glowing Border Frame */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.35) 0%, rgba(234, 88, 12, 0.2) 50%, rgba(99, 102, 241, 0.2) 100%)",
            padding: "1px",
            borderRadius: "20px",
            boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 35px -5px rgba(239, 68, 68, 0.25)",
          }}
        >
          <div
            style={{
              background: "rgba(11, 17, 32, 0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderRadius: "19px",
              padding: "36px 32px",
              position: "relative",
            }}
          >
            {/* Header Badge & Title */}
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <div style={{ position: "relative", display: "inline-block", marginBottom: "16px" }}>
                <div
                  style={{
                    position: "absolute",
                    inset: "-6px",
                    borderRadius: "22px",
                    background: "linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(234, 88, 12, 0.4))",
                    filter: "blur(10px)",
                    opacity: 0.8,
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    width: "70px",
                    height: "70px",
                    borderRadius: "18px",
                    background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    boxShadow: "0 10px 25px rgba(239, 68, 68, 0.45), inset 0 2px 0 rgba(255, 255, 255, 0.35)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <Crown size={36} />
                </div>
              </div>

              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "#fca5a5",
                    background: "rgba(239, 68, 68, 0.16)",
                    border: "1px solid rgba(239, 68, 68, 0.35)",
                    padding: "3px 10px",
                    borderRadius: "20px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <Sparkles size={11} className="text-amber-400" />
                  Master Controller Access
                </span>
              </div>

              <h1
                style={{
                  fontSize: "26px",
                  fontWeight: 900,
                  letterSpacing: "-0.025em",
                  margin: "0 0 6px",
                  color: "#ffffff",
                }}
              >
                Super Admin Console
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  color: "#94a3b8",
                  lineHeight: "1.5",
                }}
              >
                Multi-Branch Fleet, POS Terminal Authorizations &amp; Database Matrix
              </p>
            </div>

            {/* Error Notification */}
            {state.error && (
              <div
                style={{
                  marginBottom: "20px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  color: "#fca5a5",
                  fontSize: "13px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  animation: "fadeIn 0.2s ease",
                }}
              >
                <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                <div style={{ lineHeight: "1.4" }}>{state.error}</div>
              </div>
            )}

            {/* CapsLock Warning */}
            {capsLockActive && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "rgba(245, 158, 11, 0.15)",
                  border: "1px solid rgba(245, 158, 11, 0.4)",
                  color: "#fcd34d",
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                <span>Caps Lock is ON — check your password capitalization.</span>
              </div>
            )}

            {/* Login Form */}
            <form action={formAction}>
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <label
                    htmlFor="password"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      fontWeight: 800,
                      color: "#cbd5e1",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    <KeyRound size={13} className="text-red-400" />
                    <span>Master Access Key</span>
                  </label>

                  {/* Fast Fill Demo Button */}
                  <button
                    type="button"
                    onClick={handleQuickFill}
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "6px",
                      padding: "2px 8px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#94a3b8",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      transition: "all 0.15s ease",
                    }}
                    className="hover:text-amber-300 hover:border-amber-400/40"
                    title="Click to auto-fill default master key: superadmin123"
                  >
                    <Zap size={11} className="text-amber-400" />
                    <span>Default Key</span>
                  </button>
                </div>

                <div style={{ position: "relative" }}>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    placeholder="Enter Master Super Admin Key..."
                    required
                    autoFocus
                    style={{
                      width: "100%",
                      padding: "13px 44px 13px 14px",
                      borderRadius: "10px",
                      border: "1px solid rgba(255, 255, 255, 0.18)",
                      background: "rgba(15, 23, 42, 0.75)",
                      color: "#ffffff",
                      fontSize: "15px",
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: showPassword ? "inherit" : "monospace",
                      letterSpacing: showPassword ? "normal" : "0.15em",
                      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    }}
                    className="focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                    }}
                    className="hover:text-white"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending}
                style={{
                  width: "100%",
                  padding: "13px 18px",
                  borderRadius: "10px",
                  background: isPending
                    ? "rgba(239, 68, 68, 0.5)"
                    : "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 900,
                  letterSpacing: "0.02em",
                  border: "none",
                  cursor: isPending ? "not-allowed" : "pointer",
                  boxShadow: isPending
                    ? "none"
                    : "0 6px 20px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "9px",
                  transition: "all 0.18s ease",
                }}
                className="hover:brightness-110 active:scale-[0.99]"
              >
                {isPending ? (
                  <>
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid rgba(255, 255, 255, 0.3)",
                        borderTopColor: "#ffffff",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "spin 0.6s linear infinite",
                      }}
                    />
                    <span>Verifying Master Session...</span>
                  </>
                ) : (
                  <>
                    <Lock size={15} />
                    <span>Authorize &amp; Launch Console</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Security Audit Badge Bar */}
            <div
              style={{
                marginTop: "24px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "11px", color: "#94a3b8" }}>
                <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                <span>HMAC SHA-256</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "11px", color: "#94a3b8" }}>
                <Server size={14} className="text-sky-400 shrink-0" />
                <span>Multi-Tenant Fleet</span>
              </div>
            </div>

            {/* Portal Navigation Switchers */}
            <div
              style={{
                marginTop: "24px",
                paddingTop: "20px",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <Link
                href="/admin/login"
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  textDecoration: "none",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "color 0.15s ease",
                }}
                className="hover:text-white"
              >
                <Store size={13} className="text-amber-400" />
                <span>Branch Manager Portal</span>
              </Link>

              <Link
                href="/"
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  textDecoration: "none",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "color 0.15s ease",
                }}
                className="hover:text-white"
              >
                <span>Customer Menu</span>
                <ArrowRight size={12} className="text-red-400" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* ─── FOOTER ─── */}
      <footer
        style={{
          width: "100%",
          maxWidth: "1180px",
          margin: "0 auto",
          textAlign: "center",
          fontSize: "11.5px",
          color: "#64748b",
          fontWeight: 600,
          position: "relative",
          zIndex: 20,
        }}
      >
        <span>&copy; {new Date().getFullYear()} Pizza Mafia Enterprise Architecture. Authorized personnel only.</span>
      </footer>

      {/* Global CSS for Keyframe Animations */}
      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
