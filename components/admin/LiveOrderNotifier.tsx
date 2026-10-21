"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import type { Order } from "@/types/menu";
import {
  Bell,
  UtensilsCrossed,
  Bike,
  ShoppingBag,
  X,
  ChefHat,
  ArrowRight,
} from "lucide-react";

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

  const seenOrderIdsRef = useRef<Set<number>>(new Set());
  const isInitialLoadRef = useRef(true);

  const triggerOrderToast = (newOrder: Order) => {
    if (shopId && newOrder.shop_id && Number(newOrder.shop_id) !== Number(shopId)) {
      return;
    }

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

    setNotifications((prev) => [notifItem, ...prev.slice(0, 4)]);

    setTimeout(() => {
      removeNotification(notifItem.id);
    }, 10000);
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
          if (newOrder.id && !seenOrderIdsRef.current.has(newOrder.id)) {
            seenOrderIdsRef.current.add(newOrder.id);
            triggerOrderToast(newOrder);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setIsConnected(false);
        }
      });

    // 3-second live sync engine via server API (guarantees alerts without manual page refresh)
    const syncInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/live?shopId=${shopId || ""}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          if (json.orders && Array.isArray(json.orders)) {
            const data = json.orders as Order[];

            if (isInitialLoadRef.current) {
              // Populate seen IDs on first load so historical orders don't chime
              data.forEach((o) => {
                if (o.id) seenOrderIdsRef.current.add(o.id);
              });
              isInitialLoadRef.current = false;
            } else {
              // Check for brand new orders
              for (const o of data) {
                if (o.id && !seenOrderIdsRef.current.has(o.id)) {
                  seenOrderIdsRef.current.add(o.id);
                  triggerOrderToast(o);
                }
              }
            }
            setIsConnected(true);
          }
        }
      } catch {
        // network blink safe
      }
    }, 3000);

    return () => {
      clearInterval(syncInterval);
      supabase.removeChannel(channel);
    };
  }, [shopId, soundEnabled]);

  return (
    <>


      {/* ── Floating Real-time Order Alert Toasts Container ── */}
      <div
        style={{
          position: "fixed",
          top: "74px",
          right: "24px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          maxWidth: "390px",
          width: "calc(100vw - 48px)",
          pointerEvents: "none",
        }}
      >
        {notifications.map((notif) => {
          const isDineIn = notif.orderType === "dine_in";
          const isDelivery = notif.orderType === "delivery";

          return (
            <div
              key={notif.id}
              style={{
                pointerEvents: "auto",
                background: "linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)",
                border: "2px solid #ea580c",
                borderRadius: "14px",
                padding: "18px",
                boxShadow: "0 16px 36px -4px rgba(234, 88, 12, 0.32), 0 8px 18px -2px rgba(0, 0, 0, 0.12)",
                animation: "notifSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <style>{`
                @keyframes notifSlideIn {
                  from { transform: translateX(120%) scale(0.92); opacity: 0; }
                  to { transform: translateX(0) scale(1); opacity: 1; }
                }
              `}</style>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(234, 88, 12, 0.4)",
                    }}
                  >
                    <Bell size={16} className="animate-bounce" />
                  </div>
                  <div>
                    <span style={{ fontSize: "14px", fontWeight: 900, color: "#9a3412", letterSpacing: "-0.01em" }}>
                      NEW ORDER ARRIVED!
                    </span>
                    <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "8px" }}>
                      {notif.createdAt}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => removeNotification(notif.id)}
                  type="button"
                  style={{
                    background: "rgba(0, 0, 0, 0.05)",
                    border: "none",
                    borderRadius: "6px",
                    color: "#9a3412",
                    padding: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-label="Dismiss alert"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Order Details Body */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "17px", fontWeight: 900, color: "#0f172a", fontFamily: "monospace" }}>
                    {notif.orderNumber}
                  </div>
                  <div style={{ fontSize: "13px", color: "#475569", fontWeight: 600 }}>
                    {notif.customerName} {notif.customerPhone ? `(${notif.customerPhone})` : ""}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "17px", fontWeight: 900, color: "#16a34a" }}>
                    {currencySymbol} {notif.total.toFixed(2)}
                  </div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      marginTop: "3px",
                      fontSize: "11px",
                      fontWeight: 800,
                      background: "#ffedd5",
                      color: "#9a3412",
                      border: "1px solid #fed7aa",
                      padding: "2px 8px",
                      borderRadius: "5px",
                    }}
                  >
                    {isDineIn ? (
                      <>
                        <UtensilsCrossed size={11} />
                        <span>Table #{notif.tableNumber || "N/A"}</span>
                      </>
                    ) : isDelivery ? (
                      <>
                        <Bike size={11} />
                        <span>Delivery</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={11} />
                        <span>Token #{notif.tokenNumber || "N/A"}</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Quick Action Button */}
              <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
                <Link
                  href="/admin/orders"
                  onClick={() => removeNotification(notif.id)}
                  style={{
                    flex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "9px 14px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 800,
                    textDecoration: "none",
                    boxShadow: "0 2px 8px rgba(234, 88, 12, 0.3)",
                  }}
                >
                  <span>Open Live Board</span>
                  <ArrowRight size={13} />
                </Link>
                <Link
                  href="/admin/kitchen"
                  onClick={() => removeNotification(notif.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    background: "#ffffff",
                    border: "1px solid #fdba74",
                    color: "#c2410c",
                    fontSize: "12px",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  <ChefHat size={14} />
                  <span>Kitchen</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
