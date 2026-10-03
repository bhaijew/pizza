"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import type { Order } from "@/types/menu";

interface LiveOrderNotifierProps {
  shopId?: number | null;
  currencySymbol?: string;
}

interface NotificationItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string | null;
  total: number;
  orderType: string;
  tableNumber?: string | null;
  tokenNumber?: string | null;
  createdAt: string;
}

/**
 * Web Audio API synthesizer for instant, reliable ding-dong notification chime
 */
function playOrderAlertChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Tone 1: High crisp ding (880Hz - A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Tone 2: Harmonic pleasant chime (1320Hz - E6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1320, now + 0.12);
    gain2.gain.setValueAtTime(0.4, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.85);

    // Tone 3: Rich base affirmation (440Hz - A4)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "triangle";
    osc3.frequency.setValueAtTime(440, now + 0.12);
    gain3.gain.setValueAtTime(0.2, now + 0.12);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.12);
    osc3.stop(now + 0.9);
  } catch (err) {
    console.warn("[playOrderAlertChime error]", err);
  }
}

export default function LiveOrderNotifier({
  shopId,
  currencySymbol = "Rs.",
}: LiveOrderNotifierProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Load sound preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pizza_admin_sound_enabled");
      if (saved !== null) {
        setSoundEnabled(saved === "true");
      }
    } catch {}

    const unlockAudio = () => {
      setHasInteracted(true);
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };

    window.addEventListener("click", unlockAudio);
    window.addEventListener("keydown", unlockAudio);

    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem("pizza_admin_sound_enabled", String(next));
    } catch {}

    if (next) {
      playOrderAlertChime();
    }
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  useEffect(() => {
    const supabase = createClient();

    const channelName = `realtime-orders-${shopId || "master"}-${Math.random().toString(36).substring(2, 7)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const newOrder = payload.new as Order;

          // Filter by shop_id if this admin is isolated to a specific branch shop
          if (shopId && newOrder.shop_id && Number(newOrder.shop_id) !== Number(shopId)) {
            return;
          }

          // Play audio notification chime if enabled
          if (soundEnabled) {
            playOrderAlertChime();
          }

          const notifItem: NotificationItem = {
            id: `${newOrder.id}-${Date.now()}`,
            orderNumber: newOrder.order_number || `#${newOrder.id}`,
            customerName: newOrder.customer_name || "Valued Customer",
            customerPhone: newOrder.customer_phone || null,
            total: Number(newOrder.total) || 0,
            orderType: newOrder.order_type || "takeaway",
            tableNumber: newOrder.table_number || null,
            tokenNumber: newOrder.token_number || null,
            createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          };

          // Add to active toast stack
          setNotifications((prev) => [notifItem, ...prev.slice(0, 4)]);

          // Auto dismiss after 10 seconds
          setTimeout(() => {
            removeNotification(notifItem.id);
          }, 10000);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setIsConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, soundEnabled]);

  return (
    <>
      {/* ── Fixed Realtime Status & Sound Toggle Control (Top Right) ── */}
      <div
        style={{
          position: "fixed",
          top: "14px",
          right: "20px",
          zIndex: 9998,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(8px)",
          padding: "6px 12px",
          borderRadius: "30px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: isConnected ? "#10b981" : "#f59e0b",
            boxShadow: isConnected ? "0 0 8px #10b981" : "none",
            display: "inline-block",
          }}
        />
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>
          {isConnected ? "LIVE ORDERS" : "CONNECTING..."}
        </span>

        <button
          onClick={toggleSound}
          type="button"
          title={soundEnabled ? "Sound Alerts: ON (Click to Mute)" : "Sound Alerts: MUTED (Click to Enable)"}
          style={{
            background: soundEnabled ? "#fef3c7" : "#f1f5f9",
            border: soundEnabled ? "1px solid #fde68a" : "1px solid #cbd5e1",
            borderRadius: "20px",
            padding: "2px 8px",
            fontSize: "11px",
            fontWeight: 800,
            color: soundEnabled ? "#b45309" : "#64748b",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            transition: "all 0.15s ease",
          }}
        >
          <span>{soundEnabled ? "🔔 Sound ON" : "🔕 Muted"}</span>
        </button>
      </div>

      {/* ── Floating Real-time Order Alert Toasts Container ── */}
      <div
        style={{
          position: "fixed",
          top: "60px",
          right: "20px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "380px",
          width: "calc(100vw - 40px)",
          pointerEvents: "none",
        }}
      >
        {notifications.map((notif) => {
          const typeBadge =
            notif.orderType === "dine_in"
              ? `🍽️ Table #${notif.tableNumber || "N/A"}`
              : notif.orderType === "delivery"
              ? "🛵 Delivery"
              : `🎟️ Token #${notif.tokenNumber || "N/A"}`;

          return (
            <div
              key={notif.id}
              style={{
                pointerEvents: "auto",
                background: "linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)",
                border: "2px solid #ea580c",
                borderRadius: "10px",
                padding: "16px",
                boxShadow: "0 12px 28px -4px rgba(234, 88, 12, 0.28), 0 6px 14px -2px rgba(0, 0, 0, 0.1)",
                animation: "notifSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <style>{`
                @keyframes notifSlideIn {
                  from { transform: translateX(120%) scale(0.9); opacity: 0; }
                  to { transform: translateX(0) scale(1); opacity: 1; }
                }
              `}</style>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "6px",
                      background: "#ea580c",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                    }}
                  >
                    🔔
                  </span>
                  <div>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#9a3412" }}>
                      NEW ORDER ARRIVED!
                    </span>
                    <span style={{ fontSize: "10px", color: "#64748b", marginLeft: "6px" }}>
                      {notif.createdAt}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => removeNotification(notif.id)}
                  type="button"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#9a3412",
                    fontSize: "16px",
                    cursor: "pointer",
                    padding: "4px 8px",
                    lineHeight: 1,
                  }}
                  aria-label="Dismiss alert"
                >
                  ✕
                </button>
              </div>

              {/* Order Details Body */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px" }}>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                    {notif.orderNumber}
                  </div>
                  <div style={{ fontSize: "12px", color: "#475569", fontWeight: 600 }}>
                    {notif.customerName} {notif.customerPhone ? `(${notif.customerPhone})` : ""}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: "#16a34a" }}>
                    {currencySymbol} {notif.total.toFixed(2)}
                  </div>
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: "2px",
                      fontSize: "11px",
                      fontWeight: 700,
                      background: "#fed7aa",
                      color: "#9a3412",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {typeBadge}
                  </span>
                </div>
              </div>

              {/* Quick Action Button */}
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <Link
                  href="/admin/orders"
                  onClick={() => removeNotification(notif.id)}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: "#ea580c",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "0 2px 6px rgba(234, 88, 12, 0.2)",
                  }}
                >
                  View in Live Orders Board →
                </Link>
                <Link
                  href="/admin/kitchen"
                  onClick={() => removeNotification(notif.id)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: "#ffffff",
                    border: "1px solid #fdba74",
                    color: "#c2410c",
                    fontSize: "12px",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  🍳 Kitchen
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
