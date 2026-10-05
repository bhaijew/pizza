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
} from "lucide-react";

export default function SuperAdminLoginPage() {
  const [mounted, setMounted] = useState(false);
  const [state, formAction, isPending] = useActionState(superAdminLogin, {
    error: null,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [pakistanTime, setPakistanTime] = useState("");

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setPakistanTime(
        now.toLocaleTimeString("en-US", {
          timeZone: "Asia/Karachi",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div
        suppressHydrationWarning
        style={{
          minHeight: "100vh",
          background: "#090d16",
        }}
      />
    );
  }

  return (
    <div
      suppressHydrationWarning
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(220, 38, 38, 0.18), transparent 70%), #0a0f1d",
        color: "#f8fafc",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background ambient decorative grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 60% 50% at 50% 50%, #000 60%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 50%, #000 60%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Top Bar with Pakistan Time & Network Status */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "24px",
          right: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 10,
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
            color: "#94a3b8",
            fontSize: "13px",
            fontWeight: 700,
            transition: "color 0.15s ease",
          }}
          className="hover:text-white"
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
            }}
          >
            <Crown size={15} />
          </div>
          <span>Pizza Multi-Tenant Network</span>
        </Link>

        {pakistanTime && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "16px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: "11px",
              fontWeight: 700,
              color: "#e2e8f0",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 6px #10b981",
              }}
            />
            <Clock size={12} className="text-emerald-400" />
            <span style={{ fontFamily: "monospace" }}>{pakistanTime} PKT</span>
          </div>
        )}
      </div>

      {/* Main Glassmorphic Security Box */}
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "rgba(15, 23, 42, 0.75)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "16px",
          padding: "40px 32px",
          boxShadow: "0 20px 50px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Crown Emblem */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 8px 24px rgba(239, 68, 68, 0.35)",
              marginBottom: "16px",
              border: "1px solid rgba(255, 255, 255, 0.25)",
            }}
          >
            <Crown size={32} />
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#f87171",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                padding: "2px 8px",
                borderRadius: "20px",
              }}
            >
              Master Access
            </span>
          </div>

          <h1
            style={{
              fontSize: "24px",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              margin: "0 0 6px",
              color: "#ffffff",
            }}
          >
            Super Admin Controller
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
            Multi-Shop Branches &amp; Global Fleet Manager
          </p>
        </div>

        {/* Error Alert */}
        {state.error && (
          <div
            style={{
              marginBottom: "20px",
              padding: "12px 14px",
              borderRadius: "8px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "#fca5a5",
              fontSize: "13px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <AlertTriangle size={18} className="text-red-400 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Form */}
        <form action={formAction}>
          <div style={{ marginBottom: "24px" }}>
            <label
              htmlFor="password"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "12px",
                fontWeight: 700,
                color: "#cbd5e1",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "8px",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <KeyRound size={13} className="text-red-400" />
                Master Access Key
              </span>
              <span style={{ fontSize: "10px", color: "#64748b", textTransform: "none", fontWeight: 600 }}>
                HMAC SHA-256 Protected
              </span>
            </label>

            <div style={{ position: "relative" }}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter master super admin key..."
                required
                autoFocus
                style={{
                  width: "100%",
                  padding: "12px 42px 12px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  background: "rgba(10, 15, 29, 0.8)",
                  color: "#ffffff",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: showPassword ? "inherit" : "monospace",
                  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                }}
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
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 800,
              border: "none",
              cursor: isPending ? "not-allowed" : "pointer",
              opacity: isPending ? 0.75 : 1,
              boxShadow: "0 4px 16px rgba(239, 68, 68, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            className="hover:opacity-95"
          >
            <Lock size={15} />
            <span>{isPending ? "Authenticating Session..." : "Authorize & Enter Console"}</span>
            <ArrowRight size={15} />
          </button>
        </form>

        {/* Security Notice */}
        <div
          style={{
            marginTop: "20px",
            padding: "10px 12px",
            borderRadius: "6px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "11px",
            color: "#64748b",
          }}
        >
          <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
          <span>Multi-tenant isolation &amp; branch data partitioning active.</span>
        </div>

        {/* External Nav Links */}
        <div
          style={{
            marginTop: "24px",
            paddingTop: "20px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/admin/login"
            style={{
              fontSize: "12px",
              color: "#94a3b8",
              textDecoration: "none",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              transition: "color 0.15s ease",
            }}
            className="hover:text-white"
          >
            <Store size={13} />
            <span>Branch Manager</span>
          </Link>

          <Link
            href="/"
            style={{
              fontSize: "12px",
              color: "#94a3b8",
              textDecoration: "none",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              transition: "color 0.15s ease",
            }}
            className="hover:text-white"
          >
            <span>Customer Menu</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
