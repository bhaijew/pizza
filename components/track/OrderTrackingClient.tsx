"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { getTrackableOrder } from "@/lib/order-actions";
import { Order, OrderStatus } from "@/types/menu";
import { createClient } from "@/utils/supabase/client";

interface OrderTrackingClientProps {
  initialOrderNumber: string;
  initialOrder?: Order | null;
}

export default function OrderTrackingClient({
  initialOrderNumber,
  initialOrder,
}: OrderTrackingClientProps) {
  const [order, setOrder] = useState<Order | null>(initialOrder || null);
  const [loading, setLoading] = useState(!initialOrder);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const prevStatusRef = useRef<OrderStatus | null>(initialOrder?.status || null);

  // Play subtle web audio notification chime when status progresses
  const playStatusChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio autoplay policy fallback
    }
  }, []);

  const fetchLatest = useCallback(async () => {
    const res = await getTrackableOrder(initialOrderNumber);
    if (res.success && res.order) {
      if (prevStatusRef.current && prevStatusRef.current !== res.order.status) {
        playStatusChime();
      }
      prevStatusRef.current = res.order.status;
      setOrder(res.order);
      setError(null);
    } else if (!order) {
      setError(res.error || "Order not found");
    }
    setLastRefreshed(new Date());
    setLoading(false);
  }, [initialOrderNumber, order, playStatusChime]);

  // Enterprise-Grade 100% Live WebSocket Realtime Subscription
  useEffect(() => {
    // 1. Initial snapshot fetch
    fetchLatest();

    // 2. Supabase Realtime WebSocket Channel
    const supabase = createClient();
    const channelName = `customer-tracker-${initialOrderNumber}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `order_number=eq.${initialOrderNumber}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const updated = payload.new as Order;
            if (prevStatusRef.current && prevStatusRef.current !== updated.status) {
              playStatusChime();
            }
            prevStatusRef.current = updated.status;
            setOrder(updated);
            setLastRefreshed(new Date());
            setError(null);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsRealtimeConnected(true);
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setIsRealtimeConnected(false);
        }
      });

    // 3. Gentle defensive fallback heartbeat (every 45s) in case of device sleep/reconnect
    const heartbeat = setInterval(fetchLatest, 45000);

    return () => {
      clearInterval(heartbeat);
      supabase.removeChannel(channel);
    };
  }, [initialOrderNumber, fetchLatest, playStatusChime]);

  const status = order?.status || "pending";
  const orderType = order?.order_type || "takeaway";

  // Compute active step index: 0 = pending/confirmed, 1 = preparing, 2 = ready/dispatched, 3 = delivered
  const getStepIndex = (st: OrderStatus): number => {
    if (st === "pending" || st === "confirmed") return 0;
    if (st === "preparing") return 1;
    if (st === "ready") return 2;
    if (st === "delivered" || (st as string) === "completed") return 3;
    return 0; // cancelled
  };

  const currentStep = getStepIndex(status);

  // Time elapsed since order
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  useEffect(() => {
    if (!order?.created_at) return;
    const calc = () => {
      const diffMs = Date.now() - new Date(order.created_at).getTime();
      setElapsedMinutes(Math.max(0, Math.floor(diffMs / 60000)));
    };
    calc();
    const t = setInterval(calc, 30000);
    return () => clearInterval(t);
  }, [order?.created_at]);

  const steps = [
    {
      label: "Order Received",
      desc: "Kitchen verified your items",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: "Baking & Preparing",
      desc: "Fresh in the stone oven",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      ),
    },
    {
      label:
        orderType === "delivery"
          ? "Out for Delivery"
          : orderType === "dine_in"
          ? "Serving to Table"
          : "Ready for Pickup",
      desc:
        orderType === "delivery"
          ? "Dispatched with delivery rider"
          : orderType === "dine_in"
          ? `Delivering to Table #${order?.table_number || "—"}`
          : "Please collect at counter",
      icon:
        orderType === "delivery" ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="6" cy="19" r="3" />
            <circle cx="17" cy="19" r="3" />
            <path d="M14 6h3l3 4v6h-4" />
            <path d="M2 17h2" />
            <path d="M8.5 17h5.5" />
            <path d="M2 13h10V4H2v9z" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        ),
    },
    {
      label: "Delivered & Enjoyed",
      desc: "Thank you for dining with us",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 44,
              height: 44,
              border: "3px solid #fed7aa",
              borderTopColor: "#dc2626",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: "#7c2d12", fontWeight: 700, fontSize: 15 }}>Connecting to Live Kitchen Radar...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ maxWidth: 500, margin: "60px auto", padding: "30px 20px", textAlign: "center", background: "#ffffff", borderRadius: 8, border: "1px solid #fee2e2" }}>
        <div style={{ width: 50, height: 50, background: "#fee2e2", color: "#dc2626", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: "0 0 8px" }}>Order Not Found</h2>
        <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 20px" }}>{error || "Could not locate this order reference."}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Link
            href="/track"
            style={{
              padding: "10px 18px",
              background: "#f1f5f9",
              color: "#334155",
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Track Another Order
          </Link>
          <Link
            href="/"
            style={{
              padding: "10px 18px",
              background: "#dc2626",
              color: "#ffffff",
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Go to Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "125vh", background: "#f8fafc", padding: "24px 16px 60px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Header Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
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
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Menu
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: isRealtimeConnected ? "#10b981" : "#f59e0b",
                boxShadow: isRealtimeConnected ? "0 0 8px #10b981" : "0 0 6px #f59e0b",
                animation: "pulse 1.8s infinite",
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: isRealtimeConnected ? "#059669" : "#d97706",
                fontWeight: 700,
                letterSpacing: "0.01em",
              }}
            >
              {isRealtimeConnected ? "⚡ 100% Live Radar (WebSocket)" : "Connecting Radar..."} &bull; Synced {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>
        </div>

        {/* Hero Status Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            padding: "24px 20px",
            boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: 3,
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    background:
                      orderType === "delivery"
                        ? "#ecfdf5"
                        : orderType === "dine_in"
                        ? "#fef3c7"
                        : "#fff7ed",
                    color:
                      orderType === "delivery"
                        ? "#065f46"
                        : orderType === "dine_in"
                        ? "#92400e"
                        : "#c2410c",
                    border: `1px solid ${
                      orderType === "delivery"
                        ? "#a7f3d0"
                        : orderType === "dine_in"
                        ? "#fde68a"
                        : "#fed7aa"
                    }`,
                  }}
                >
                  {orderType === "delivery" ? "🛵 Delivery" : orderType === "dine_in" ? `🍽️ Dine-In (Table #${order.table_number || "—"})` : `🛍️ Takeaway (Token ${order.token_number || "—"})`}
                </span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>&bull;</span>
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                  Placed {elapsedMinutes}m ago
                </span>
              </div>

              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 900,
                  fontSize: 24,
                  color: "#0f172a",
                  margin: "0 0 4px",
                }}
              >
                {order.order_number}
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                Customer: <strong>{order.customer_name}</strong>
                {order.customer_phone && ` (${order.customer_phone})`}
              </p>
            </div>

            {/* Status Pill */}
            <div
              style={{
                padding: "8px 14px",
                borderRadius: 4,
                textAlign: "right",
                background:
                  status === "delivered" || (status as string) === "completed"
                    ? "#ecfdf5"
                    : status === "ready"
                    ? "#eff6ff"
                    : status === "preparing"
                    ? "#fff7ed"
                    : status === "cancelled"
                    ? "#fef2f2"
                    : "#f8fafc",
                border: `1px solid ${
                  status === "delivered" || (status as string) === "completed"
                    ? "#a7f3d0"
                    : status === "ready"
                    ? "#bfdbfe"
                    : status === "preparing"
                    ? "#fed7aa"
                    : status === "cancelled"
                    ? "#fecaca"
                    : "#e2e8f0"
                }`,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  color: "#64748b",
                  display: "block",
                }}
              >
                Current Status
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 14,
                  fontWeight: 900,
                  color:
                    status === "delivered" || (status as string) === "completed"
                      ? "#059669"
                      : status === "ready"
                      ? "#2563eb"
                      : status === "preparing"
                      ? "#ea580c"
                      : status === "cancelled"
                      ? "#dc2626"
                      : "#475569",
                  textTransform: "capitalize",
                }}
              >
                {status === "ready" && orderType === "delivery"
                  ? "Out for Delivery"
                  : status}
              </span>
            </div>
          </div>

          {/* Stepper Timeline */}
          {status === "cancelled" ? (
            <div style={{ padding: 16, background: "#fef2f2", borderRadius: 4, border: "1px solid #fecaca", color: "#b91c1c", fontSize: 13, fontWeight: 700 }}>
              This order was cancelled. Please speak with restaurant staff for assistance.
            </div>
          ) : (
            <div style={{ marginTop: 24 }}>
              {/* Progress Line */}
              <div style={{ position: "relative", marginBottom: 30 }}>
                <div
                  style={{
                    position: "absolute",
                    top: 18,
                    left: 20,
                    right: 20,
                    height: 4,
                    background: "#f1f5f9",
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(currentStep / (steps.length - 1)) * 100}%`,
                      background: "linear-gradient(90deg, #dc2626 0%, #10b981 100%)",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: `repeat(${steps.length}, 1fr)`, position: "relative", zIndex: 2 }}>
                  {steps.map((s, idx) => {
                    const isDone = idx < currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                      <div key={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 4,
                            background: isCurrent ? "#dc2626" : isDone ? "#10b981" : "#ffffff",
                            color: isCurrent || isDone ? "#ffffff" : "#94a3b8",
                            border: `2px solid ${isCurrent ? "#dc2626" : isDone ? "#10b981" : "#e2e8f0"}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: isCurrent ? "0 0 12px rgba(220, 38, 38, 0.4)" : "none",
                            marginBottom: 8,
                            transition: "all 0.3s ease",
                          }}
                        >
                          {s.icon}
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: isCurrent ? 800 : 700,
                            color: isCurrent ? "#0f172a" : isDone ? "#10b981" : "#94a3b8",
                            lineHeight: 1.2,
                            marginBottom: 2,
                          }}
                        >
                          {s.label}
                        </span>
                        <span style={{ fontSize: 10, color: "#64748b", maxWidth: 110, display: "none" }}>
                          {s.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Estimated Arrival / Wait Notice */}
          <div
            style={{
              padding: "12px 16px",
              background: "#f8fafc",
              borderRadius: 6,
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 4,
                  background: "#fff7ed",
                  color: "#ea580c",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#0f172a" }}>
                  {status === "delivered" || (status as string) === "completed"
                    ? "Order Fulfilled"
                    : status === "ready"
                    ? orderType === "delivery"
                      ? "Rider is heading to your location"
                      : "Ready to enjoy!"
                    : "Estimated Time"}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>
                  {status === "delivered" || (status as string) === "completed"
                    ? "Enjoy your fresh pizza meal"
                    : status === "ready"
                    ? orderType === "delivery"
                      ? "Estimated delivery: 10-15 mins"
                      : "Please collect or wait at table"
                    : "Average prep & baking time: 15-20 mins"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchLatest}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                padding: "6px 12px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                color: "#475569",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Delivery / Rider Assignment Card (If Delivery) */}
        {orderType === "delivery" && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              padding: "18px 20px",
              marginBottom: 20,
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>🛵</span>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                Rider &amp; Delivery Destination
              </h3>
            </div>

            <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 4, padding: "10px 12px", marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#047857", textTransform: "uppercase" }}>
                Delivery Address:
              </span>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#0f172a", fontWeight: 600 }}>
                {order.delivery_address || (order.notes?.match(/\[DELIVERY: Address: ([^|]+)/)?.[1]) || "Provided during checkout"}
              </p>
            </div>

            {order.delivery_rider_name ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#f8fafc", borderRadius: 4, border: "1px solid #e2e8f0" }}>
                <div>
                  <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Assigned Dispatch Rider
                  </span>
                  <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                    {order.delivery_rider_name}
                  </p>
                </div>
                {order.delivery_rider_phone && (
                  <a
                    href={`tel:${order.delivery_rider_phone}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#10b981",
                      color: "#ffffff",
                      padding: "6px 12px",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 800,
                      textDecoration: "none",
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Call Rider
                  </a>
                )}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                Rider assignment in progress at the restaurant counter.
              </p>
            )}
          </div>
        )}

        {/* Order Items Summary */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            padding: "18px 20px",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
              Order Items ({order.items?.length || 0})
            </h3>
            <span style={{ fontSize: 14, fontWeight: 900, color: "#dc2626" }}>
              Total: Rs. {Number(order.total).toLocaleString()}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {order.items?.map((item: any, idx: number) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  paddingBottom: 10,
                  borderBottom: idx < order.items.length - 1 ? "1px solid #f1f5f9" : "none",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 3,
                        background: "#f1f5f9",
                        color: "#0f172a",
                        fontSize: 11,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {item.qty}x
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                      {item.name}
                    </span>
                  </div>

                  {item.selected_variation && (
                    <div style={{ marginLeft: 30, marginTop: 2 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: "#fee2e2",
                          color: "#dc2626",
                          padding: "1px 6px",
                          borderRadius: 3,
                        }}
                      >
                        {item.selected_variation.name}
                      </span>
                    </div>
                  )}

                  {item.selected_toppings && item.selected_toppings.length > 0 && (
                    <p style={{ margin: "2px 0 0 30px", fontSize: 11, color: "#64748b" }}>
                      + {item.selected_toppings.map((t: any) => t.name).join(", ")}
                    </p>
                  )}
                </div>

                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                  Rs. {Number((item.price || 0) * (item.qty || 1)).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {order.notes && (
            <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Special Instructions:</span>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#334155" }}>{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
