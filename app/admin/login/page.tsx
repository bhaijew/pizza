"use client";

import { useActionState, useState, useEffect } from "react";
import { adminLogin, getPublicShopsForLogin } from "@/lib/admin-actions";

export default function AdminLoginPage() {
  const [mounted, setMounted] = useState(false);
  const [shops, setShops] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [state, formAction, isPending] = useActionState(adminLogin, {
    error: null,
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setMounted(true);
    getPublicShopsForLogin().then((data) => {
      setShops(data);
    });
  }, []);

  if (!mounted) {
    return (
      <div
        suppressHydrationWarning
        style={{
          minHeight: "100vh",
          background: "#f1f5f9",
        }}
      />
    );
  }

  return (
    <div
      suppressHydrationWarning
      style={{
        zoom: 0.8,
        minHeight: "125vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#f1f5f9",
        color: "#0f172a",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "5px",
          padding: "36px 32px",
          boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.06)",
        }}
      >
        {/* Header Icon & Brand */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "5px",
              background: "#ef4444",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.25)",
              marginBottom: "16px",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 11h.01"></path>
              <path d="M11 15h.01"></path>
              <path d="M16 16h.01"></path>
              <path d="m2 16 20 6-6-20A20 20 0 0 0 2 16Z"></path>
            </svg>
          </div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              margin: "0 0 6px",
              color: "#0f172a",
            }}
          >
            Store Manager
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            Enter your admin password to access the panel
          </p>
        </div>

        {/* Error Alert */}
        {state.error && (
          <div
            style={{
              marginBottom: "20px",
              padding: "10px 14px",
              borderRadius: "5px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{state.error}</span>
          </div>
        )}

        {/* Form */}
        <form action={formAction}>
          {shops.length > 0 && (
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="shop_id"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                Select Store Branch
              </label>
              <select
                id="shop_id"
                name="shop_id"
                value={selectedShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "5px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                  cursor: "pointer",
                }}
              >
                <option value="">🌐 Auto-Detect / Master Platform Admin</option>
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    🏪 {s.name}
                  </option>
                ))}
              </select>
              <p style={{ margin: "5px 0 0", fontSize: "11px", color: "#64748b" }}>
                Select your branch to sign in directly to its isolated terminal.
              </p>
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "#334155",
                marginBottom: "6px",
              }}
            >
              Admin Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password..."
                required
                autoFocus
                style={{
                  width: "100%",
                  padding: "11px 40px 11px 14px",
                  borderRadius: "5px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "5px",
              background: "#ef4444",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 700,
              border: "none",
              cursor: isPending ? "not-allowed" : "pointer",
              opacity: isPending ? 0.7 : 1,
              boxShadow: "0 2px 6px rgba(239, 68, 68, 0.3)",
            }}
          >
            {isPending ? "Authenticating..." : "Sign In to Management"}
          </button>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <a
            href="/"
            style={{
              fontSize: "12px",
              color: "#64748b",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 500,
            }}
          >
            ← Customer Menu
          </a>
        </div>
      </div>
    </div>
  );
}
