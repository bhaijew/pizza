"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bike, Search, Phone, ArrowRight, ShieldCheck, MapPin, CheckCircle2 } from "lucide-react";
import { findRecentOrdersByPhone } from "@/lib/order-actions";

export default function RiderDeliverySearchPage() {
  const router = useRouter();
  const [orderInput, setOrderInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneOrders, setPhoneOrders] = useState<any[] | null>(null);
  const [searchingPhone, setSearchingPhone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = orderInput.trim();
    if (!clean) {
      setError("Please enter the Order Number (e.g. ORD-1024 or 1024).");
      return;
    }
    setError(null);
    // If user enters only numbers, prefix with ORD- if helpful, or pass directly
    const target = clean.toUpperCase();
    router.push(`/delivery/${encodeURIComponent(target)}`);
  };

  const handleSearchPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) {
      setError("Please enter customer phone number.");
      return;
    }
    setError(null);
    setSearchingPhone(true);
    const res = await findRecentOrdersByPhone(phoneInput.trim());
    setSearchingPhone(false);
    if (res.success) {
      setPhoneOrders(res.orders || []);
      if (!res.orders || res.orders.length === 0) {
        setError("No active orders found for this customer phone number.");
      }
    } else {
      setError(res.error || "Failed to search orders.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#090d16",
        color: "#f8fafc",
        padding: "30px 16px 60px",
        fontFamily: "var(--font-poppins, system-ui, sans-serif)",
      }}
    >
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        {/* Top Header Badge */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
              color: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(16, 185, 129, 0.3)",
              marginBottom: 14,
            }}
          >
            <Bike size={30} />
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Rider Delivery Portal
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
            Enter your assigned order number to start navigation and confirm delivery.
          </p>
        </div>

        {/* Main Card */}
        <div
          style={{
            background: "#0f172a",
            borderRadius: "12px",
            border: "1px solid #1e293b",
            padding: "24px 20px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          }}
        >
          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "8px",
                color: "#f87171",
                fontSize: "12px",
                fontWeight: 600,
                marginBottom: 18,
              }}
            >
              {error}
            </div>
          )}

          {/* By Order Reference */}
          <form onSubmit={handleOpenOrder} style={{ marginBottom: 22 }}>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 800,
                color: "#cbd5e1",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 8,
              }}
            >
              Enter Order Number
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                required
                placeholder="e.g. ORD-1048"
                value={orderInput}
                onChange={(e) => setOrderInput(e.target.value)}
                style={{
                  flex: 1,
                  height: "46px",
                  padding: "0 14px",
                  borderRadius: "8px",
                  border: "1px solid #334155",
                  background: "#090d16",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 700,
                  outline: "none",
                  textTransform: "uppercase",
                }}
              />
              <button
                type="submit"
                style={{
                  height: "46px",
                  padding: "0 18px",
                  borderRadius: "8px",
                  background: "#10b981",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Go <ArrowRight size={16} />
              </button>
            </div>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>OR SEARCH BY PHONE</span>
            <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
          </div>

          {/* By Customer Phone */}
          <form onSubmit={handleSearchPhone}>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 800,
                color: "#cbd5e1",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 8,
              }}
            >
              Customer Phone Number
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="tel"
                placeholder="e.g. 0300 1234567"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                style={{
                  flex: 1,
                  height: "44px",
                  padding: "0 14px",
                  borderRadius: "8px",
                  border: "1px solid #334155",
                  background: "#090d16",
                  color: "#ffffff",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={searchingPhone}
                style={{
                  height: "44px",
                  padding: "0 16px",
                  borderRadius: "8px",
                  background: "#1e293b",
                  border: "1px solid #334155",
                  color: "#e2e8f0",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {searchingPhone ? "..." : "Find"}
              </button>
            </div>
          </form>

          {/* Results list */}
          {phoneOrders && phoneOrders.length > 0 && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #1e293b" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", display: "block", marginBottom: 10 }}>
                Orders Found:
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {phoneOrders.map((ord) => (
                  <Link
                    key={ord.id}
                    href={`/delivery/${ord.order_number}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: "#131d31",
                      border: "1px solid #1e293b",
                      textDecoration: "none",
                      color: "#ffffff",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#10b981" }}>
                        #{ord.order_number}
                      </div>
                      <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                        {ord.customer_name} &bull; Rs. {Number(ord.total).toLocaleString()}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: "4px",
                        background: ord.status === "delivered" ? "#064e3b" : "#1e3a8a",
                        color: ord.status === "delivered" ? "#34d399" : "#60a5fa",
                        textTransform: "uppercase",
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

        {/* Rider Workflow Steps Guide */}
        <div
          style={{
            marginTop: "24px",
            background: "#0c1322",
            border: "1px solid #1e293b",
            borderRadius: "10px",
            padding: "16px",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: 800, color: "#cbd5e1", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            How Rider Confirmation Works
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px", color: "#94a3b8" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#10b981", color: "#000", fontWeight: 900, fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                1
              </div>
              <div>Open the delivery link sent automatically to your WhatsApp or enter Order # above.</div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#10b981", color: "#000", fontWeight: 900, fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                2
              </div>
              <div>Tap <strong>Open in Google Maps</strong> for turn-by-turn navigation directly to the customer's address.</div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#10b981", color: "#000", fontWeight: 900, fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                3
              </div>
              <div>Collect cash amount shown on screen and tap <strong>Confirm Delivered & Cash Collected</strong>. Kitchen & Admin update instantly in real-time!</div>
            </div>
          </div>
        </div>

        {/* Bottom Back Link */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <Link
            href="/"
            style={{
              fontSize: "12px",
              color: "#64748b",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            ← Back to Restaurant Home
          </Link>
        </div>
      </div>
    </div>
  );
}
