"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DemoNav from "@/components/demo/DemoNav";

type TrackingStage = 0 | 1 | 2 | 3;

export default function DemoTrackerPage() {
  const [currentStage, setCurrentStage] = useState<TrackingStage>(2);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [elapsedMinutes, setElapsedMinutes] = useState(14);

  // Tick timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedMinutes((m) => m + 1);
    }, 45000);
    return () => clearInterval(timer);
  }, []);

  const playStatusChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  const setStage = (st: TrackingStage) => {
    setCurrentStage(st);
    playStatusChime();
  };

  const stages = [
    {
      title: "Order Confirmed",
      desc: "POS confirmed your order & dispatched ticket to kitchen",
      icon: "📝",
      time: "14 mins ago",
    },
    {
      title: "Baking in Stone Oven",
      desc: "Fresh dough hand-tossed and baking at 400°C",
      icon: "🔥",
      time: "8 mins ago",
    },
    {
      title: "Out for Delivery",
      desc: "Rider Tariq Mahmood picked up your insulated thermal bag",
      icon: "🛵",
      time: "En route (6 mins away)",
    },
    {
      title: "Delivered & Enjoyed",
      desc: "Order safely handed over at your doorstep",
      icon: "🎉",
      time: "Completed",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      {/* Universal Top Demo Bar */}
      <DemoNav currentModule="track" />

      {/* Tracker Top Bar */}
      <div
        style={{
          background: "#09090b",
          color: "#ffffff",
          borderBottom: "3px solid #ea580c",
          padding: "20px",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          <div>
            <span style={{ fontSize: 11, fontWeight: 900, color: "#ea580c", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              LIVE CUSTOMER TRACKING SCREEN
            </span>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: "2px 0 0" }}>
              Tracking Order: #PZ-8492
            </h1>
            <span style={{ fontSize: 12, color: "#a1a1aa" }}>
              Estimated Delivery: <strong>15 - 20 Mins</strong> • Placed {elapsedMinutes} mins ago
            </span>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span
              style={{
                background: currentStage === 3 ? "#22c55e" : "#ea580c",
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 900,
                padding: "6px 12px",
                borderRadius: 4,
                textTransform: "uppercase",
              }}
            >
              {stages[currentStage].title}
            </span>
          </div>
        </div>
      </div>

      {/* Main Tracker Container */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>
        {/* Interactive Demo Simulation Controller */}
        <div
          style={{
            background: "#09090b",
            color: "#ffffff",
            border: "2px solid #ea580c",
            borderRadius: 8,
            padding: "16px 20px",
            marginBottom: 24,
            boxShadow: "0 4px 15px rgba(234, 88, 12, 0.15)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 900, color: "#ea580c", textTransform: "uppercase" }}>
                🎮 Interactive Demo Simulation Controller:
              </span>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#d4d4d8" }}>
                Click any stage button to simulate live order progression with sound alerts:
              </p>
            </div>
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                playStatusChime();
              }}
              style={{
                background: soundEnabled ? "#27272a" : "#3f3f46",
                color: soundEnabled ? "#22c55e" : "#a1a1aa",
                border: "1px solid #3f3f46",
                borderRadius: 4,
                padding: "6px 10px",
                fontSize: 11,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {soundEnabled ? "🔊 Sound Chime: ON" : "🔇 Sound: OFF"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
            {stages.map((st, idx) => (
              <button
                key={idx}
                onClick={() => setStage(idx as TrackingStage)}
                style={{
                  background: currentStage === idx ? "#ea580c" : "#18181b",
                  color: "#ffffff",
                  border: currentStage === idx ? "2px solid #ffffff" : "1px solid #27272a",
                  borderRadius: 4,
                  padding: "8px 10px",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                  textAlign: "center",
                  boxShadow: currentStage === idx ? "0 2px 0 #9a3412" : "none",
                }}
              >
                {st.icon} {idx + 1}. {st.title}
              </button>
            ))}
          </div>
        </div>

        {/* 4-Stage Visual Timeline Stepper */}
        <div
          style={{
            background: "#ffffff",
            border: "2px solid #09090b",
            borderRadius: 8,
            padding: "28px 24px",
            marginBottom: 24,
            boxShadow: "0 4px 0 #09090b",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {stages.map((st, idx) => {
              const isPast = idx < currentStage;
              const isCurrent = idx === currentStage;
              const isFuture = idx > currentStage;

              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 16,
                    position: "relative",
                  }}
                >
                  {/* Step Icon Node */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: isCurrent ? "#ea580c" : isPast ? "#22c55e" : "#f1f5f9",
                      color: isFuture ? "#94a3b8" : "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      border: isCurrent ? "3px solid #09090b" : isPast ? "2px solid #16a34a" : "2px solid #cbd5e1",
                      boxShadow: isCurrent ? "0 0 12px rgba(234, 88, 12, 0.4)" : "none",
                      zIndex: 2,
                    }}
                  >
                    {isPast ? "✓" : st.icon}
                  </div>

                  {/* Step Information */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 16,
                          fontWeight: 900,
                          color: isCurrent ? "#ea580c" : isPast ? "#09090b" : "#94a3b8",
                        }}
                      >
                        {st.title} {isCurrent && "• (Active Stage)"}
                      </h3>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: isCurrent ? "#ea580c" : isPast ? "#16a34a" : "#94a3b8",
                        }}
                      >
                        {st.time}
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: isFuture ? "#94a3b8" : "#475569", lineHeight: 1.4 }}>
                      {st.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rider Live Dispatch Card (Visible if out for delivery or delivered) */}
        {currentStage >= 2 && (
          <div
            style={{
              background: "#ffffff",
              border: "2px solid #09090b",
              borderRadius: 8,
              padding: "20px",
              marginBottom: 24,
              boxShadow: "0 4px 0 #09090b",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: "#fff7ed",
                    border: "2px solid #ea580c",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                  }}
                >
                  🛵
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 900, color: "#ea580c", textTransform: "uppercase" }}>
                    Assigned Delivery Rider
                  </span>
                  <h4 style={{ fontSize: 18, fontWeight: 900, margin: "2px 0", color: "#09090b" }}>
                    Tariq Mahmood
                  </h4>
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    Honda 125 (LED-9402) • Thermal Insulated Box
                  </span>
                </div>
              </div>

              {/* Rider Action Buttons */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <a
                  href="https://wa.me/923334867615?text=Hello%20Rider,%20where%20is%20my%20pizza%20order?"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "#15803d",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 4,
                    padding: "8px 14px",
                    fontSize: 12,
                    fontWeight: 800,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>💬 WhatsApp Rider</span>
                </a>

                <a
                  href="tel:+923334867615"
                  style={{
                    background: "#09090b",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 4,
                    padding: "8px 14px",
                    fontSize: 12,
                    fontWeight: 800,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>📞 Call Rider</span>
                </a>
              </div>
            </div>

            {/* GPS Simulation Note */}
            <div
              style={{
                marginTop: 14,
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 4,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "#166534",
                fontWeight: 700,
              }}
            >
              <span>📍</span>
              <span>
                {currentStage === 3
                  ? "Rider has arrived at your gate and handed over your order!"
                  : "Live GPS Signal: Rider is approximately 1.2 km away on Main Boulevard (Est. 5-7 mins)"}
              </span>
            </div>
          </div>
        )}

        {/* Order Details & Bill Summary */}
        <div
          style={{
            background: "#ffffff",
            border: "2px solid #09090b",
            borderRadius: 8,
            padding: "20px",
            boxShadow: "0 4px 0 #09090b",
          }}
        >
          <h4 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 14px", color: "#09090b", borderBottom: "1.5px solid #e2e8f0", paddingBottom: 8 }}>
            Order Summary &amp; Bill Breakdown
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <div>
                <strong>1x Chicken Tikka Supreme (Large 13&quot;)</strong>
                <div style={{ fontSize: 11, color: "#ea580c" }}>+ Cheesy Stuffed Crust, Extra Mozzarella, Jalapenos</div>
              </div>
              <span style={{ fontWeight: 800 }}>Rs. 2,440</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <div>
                <strong>1x Cheesy Garlic Herb Bread (4 Pcs)</strong>
              </div>
              <span style={{ fontWeight: 800 }}>Rs. 390</span>
            </div>
          </div>

          <div style={{ borderTop: "1.5px dashed #cbd5e1", paddingTop: 10, display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#64748b" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Subtotal:</span>
              <span>Rs. 2,830</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#ea580c", fontWeight: 800 }}>
              <span>Promo Voucher (WELCOME20):</span>
              <span>-Rs. 566</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Delivery Fee (Model Town):</span>
              <span>+Rs. 150</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 16,
                fontWeight: 900,
                color: "#09090b",
                borderTop: "1.5px solid #09090b",
                paddingTop: 8,
                marginTop: 4,
              }}
            >
              <span>Total to Pay (Cash On Delivery):</span>
              <span style={{ color: "#ea580c" }}>Rs. 2,414</span>
            </div>
          </div>

          <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              Destination: <strong>House 42, Block B, Model Town, Lahore</strong>
            </span>
            <Link
              href="/demo/menu"
              style={{
                background: "#ea580c",
                color: "#ffffff",
                border: "none",
                borderRadius: 4,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Order Again on Menu ➔
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
