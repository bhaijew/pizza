"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { findRecentOrdersByPhone } from "@/lib/order-actions";

export default function TrackSearchPage() {
  const router = useRouter();
  const [orderInput, setOrderInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneOrders, setPhoneOrders] = useState<any[] | null>(null);
  const [searchingPhone, setSearchingPhone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearchOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderInput.trim()) {
      setError("Please enter your Order Number (e.g. ORD-1234).");
      return;
    }
    setError(null);
    router.push(`/track/${encodeURIComponent(orderInput.trim())}`);
  };

  const handleSearchByPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) {
      setError("Please enter your Phone Number.");
      return;
    }
    setError(null);
    setSearchingPhone(true);
    const res = await findRecentOrdersByPhone(phoneInput.trim());
    setSearchingPhone(false);
    if (res.success) {
      setPhoneOrders(res.orders || []);
      if (!res.orders || res.orders.length === 0) {
        setError("No orders found for this phone number.");
      }
    } else {
      setError(res.error || "Failed to search orders.");
    }
  };

  return (
    <div style={{ minHeight: "125vh", background: "#f8fafc", padding: "40px 16px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        {/* Back Link */}
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "#c2410c",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
            marginBottom: 20,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Menu
        </Link>

        {/* Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            padding: "32px 24px",
            boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "#fff7ed",
                color: "#ea580c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: 22,
                color: "#0f172a",
                margin: "0 0 6px",
              }}
            >
              Track Your Order Live
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
              Check real-time baking progress and rider dispatch status.
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 4,
                color: "#b91c1c",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 20,
              }}
            >
              {error}
            </div>
          )}

          {/* Form 1: By Order Number */}
          <form onSubmit={handleSearchOrder} style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 800,
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 6,
              }}
            >
              Order Reference Number
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                required
                placeholder="e.g. ORD-7492"
                value={orderInput}
                onChange={(e) => setOrderInput(e.target.value)}
                style={{
                  flex: 1,
                  height: 42,
                  padding: "0 12px",
                  borderRadius: 4,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0f172a",
                  outline: "none",
                  textTransform: "uppercase",
                }}
              />
              <button
                type="submit"
                className="btn-primary"
                style={{
                  padding: "0 20px",
                  height: 42,
                  borderRadius: 4,
                  background: "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
                  borderColor: "#b91c1c",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                Track Now &rarr;
              </button>
            </div>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          </div>

          {/* Form 2: By Phone Number */}
          <form onSubmit={handleSearchByPhone}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 800,
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 6,
              }}
            >
              Find by Phone Number
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="tel"
                placeholder="e.g. 0300 1234567"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                style={{
                  flex: 1,
                  height: 42,
                  padding: "0 12px",
                  borderRadius: 4,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                  color: "#0f172a",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={searchingPhone}
                style={{
                  padding: "0 16px",
                  height: 42,
                  borderRadius: 4,
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  color: "#334155",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {searchingPhone ? "Searching..." : "Lookup"}
              </button>
            </div>
          </form>

          {/* Phone Orders Result List */}
          {phoneOrders && phoneOrders.length > 0 && (
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
                Recent Orders for this Phone:
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {phoneOrders.map((ord) => (
                  <Link
                    key={ord.id}
                    href={`/track/${ord.order_number}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: 4,
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      textDecoration: "none",
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                        {ord.order_number}
                      </p>
                      <span style={{ fontSize: 11, color: "#64748b" }}>
                        Rs. {Number(ord.total).toLocaleString()} &bull; {ord.order_type || "takeaway"}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color:
                          ord.status === "completed"
                            ? "#059669"
                            : ord.status === "ready"
                            ? "#2563eb"
                            : "#ea580c",
                        textTransform: "capitalize",
                      }}
                    >
                      {ord.status} &rarr;
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
