"use client";

/**
 * KitchenDisplay (KDS) — Clean White High-Legibility Kitchen Display Screen.
 * Real-time order tickets for chefs & cooks with bold table numbers,
 * item checklist, elapsed time tracker, and 1-click status advancement.
 */
import { useState, useEffect, useMemo, useTransition } from "react";
import type { Order } from "@/types/menu";
import { updateOrderStatus } from "@/lib/admin-actions";
import { createClient } from "@/utils/supabase/client";

interface KitchenDisplayProps {
  initialOrders: Order[];
  shopName?: string;
}

export default function KitchenDisplay({
  initialOrders,
  shopName = "Pizza Kitchen",
}: KitchenDisplayProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filterMode, setFilterMode] = useState<"all" | "tables" | "takeaway">("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isPending, startTransition] = useTransition();

  // Tick every 30 seconds to update order elapsed times
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Realtime Supabase subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("kitchen-orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as Order;
            setOrders((prev) => [newOrder, ...prev]);

            // Audio beep for new kitchen ticket
            if (soundEnabled) {
              try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.3);
              } catch {}
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Order;
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((o) => o.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [soundEnabled]);

  const handleUpdateStatus = (orderId: number, nextStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus as any } : o))
    );

    startTransition(async () => {
      await updateOrderStatus(orderId, nextStatus);
    });
  };

  // Active kitchen tickets: pending, confirmed, preparing
  const activeKitchenOrders = useMemo(() => {
    return orders.filter((o) => {
      const isKitchenStatus = o.status === "pending" || o.status === "confirmed" || o.status === "preparing";
      if (!isKitchenStatus) return false;

      const isDineIn = o.order_type === "dine_in" || !!o.table_number || o.notes?.includes("[DINE-IN:");
      if (filterMode === "tables") return isDineIn;
      if (filterMode === "takeaway") return !isDineIn;
      return true;
    });
  }, [orders, filterMode]);

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#f8fafc",
        color: "#0f172a",
        padding: "16px 0",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ─── KITCHEN HEADER BAR (WHITE THEME) ────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 6,
          padding: "16px 20px",
          marginBottom: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 4,
              background: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              color: "#ffffff",
              boxShadow: "0 2px 6px rgba(220, 38, 38, 0.25)",
            }}
          >
            👨‍🍳
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "#0f172a", letterSpacing: "0.01em" }}>
                {shopName} &bull; Kitchen Display System
              </h1>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  background: "#dcfce7",
                  color: "#15803d",
                  border: "1px solid #bbf7d0",
                  padding: "2px 7px",
                  borderRadius: 3,
                  textTransform: "uppercase",
                }}
              >
                ● LIVE SYNC
              </span>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
              Active table tickets & takeaway prep queue
            </p>
          </div>
        </div>

        {/* Filter buttons & Sound toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", background: "#f1f5f9", padding: 3, borderRadius: 5, border: "1px solid #e2e8f0" }}>
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              style={{
                padding: "6px 12px",
                borderRadius: 4,
                border: "none",
                background: filterMode === "all" ? "#dc2626" : "transparent",
                color: filterMode === "all" ? "#ffffff" : "#475569",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              All Orders ({orders.filter((o) => ["pending", "confirmed", "preparing"].includes(o.status)).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("tables")}
              style={{
                padding: "6px 12px",
                borderRadius: 4,
                border: "none",
                background: filterMode === "tables" ? "#dc2626" : "transparent",
                color: filterMode === "tables" ? "#ffffff" : "#475569",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              🍽️ Tables Only
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("takeaway")}
              style={{
                padding: "6px 12px",
                borderRadius: 4,
                border: "none",
                background: filterMode === "takeaway" ? "#dc2626" : "transparent",
                color: filterMode === "takeaway" ? "#ffffff" : "#475569",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              🛍️ Takeaway Only
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            style={{
              padding: "6px 12px",
              borderRadius: 4,
              border: soundEnabled ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
              background: soundEnabled ? "#f0fdf4" : "#ffffff",
              color: soundEnabled ? "#16a34a" : "#64748b",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {soundEnabled ? "🔔 Chime ON" : "🔕 Chime OFF"}
          </button>
        </div>
      </div>

      {/* ─── ACTIVE KITCHEN TICKETS GRID ───────────────────────────── */}
      {activeKitchenOrders.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            border: "1px dashed #cbd5e1",
            borderRadius: 6,
            padding: "60px 20px",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>🍕</span>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px", color: "#0f172a" }}>
            All Kitchen Tickets Cleared!
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
            No pending or preparing pizza orders in the kitchen. New orders will appear here automatically.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {activeKitchenOrders.map((order) => {
            const isDineIn = order.order_type === "dine_in" || !!order.table_number || order.notes?.includes("[DINE-IN:");
            const tableNum = order.table_number || (order.notes?.match(/\[DINE-IN:\s*Table\s*([0-9A-Za-z]+)/i)?.[1]);
            const tokenNum = order.token_number || (order.notes?.match(/TOKEN:\s*([A-Za-z0-9-]+)/i)?.[1]);

            // Elapsed time calculation
            const elapsedMins = Math.max(0, Math.floor((currentTime - new Date(order.created_at).getTime()) / 60000));
            const isLate = elapsedMins >= 15;
            const isWarning = elapsedMins >= 8 && !isLate;

            const items = Array.isArray(order.items) ? order.items : [];

            return (
              <div
                key={order.id}
                style={{
                  background: "#ffffff",
                  border: isLate
                    ? "2px solid #ef4444"
                    : isWarning
                    ? "2px solid #f59e0b"
                    : order.status === "preparing"
                    ? "2px solid #ea580c"
                    : "1px solid #e2e8f0",
                  borderRadius: 6,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: isLate ? "0 4px 14px rgba(239, 68, 68, 0.15)" : "0 2px 6px rgba(0,0,0,0.04)",
                  overflow: "hidden",
                }}
              >
                <div>
                  {/* Card Header: Table Number / Token & Elapsed Time */}
                  <div
                    style={{
                      background: isDineIn ? "#fef3c7" : "#f1f5f9",
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: isDineIn ? "1px solid #fde68a" : "1px solid #e2e8f0",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{isDineIn ? "🍽️" : "🛍️"}</span>
                      <span
                        style={{
                          fontWeight: 900,
                          fontSize: 17,
                          color: isDineIn ? "#92400e" : "#0f172a",
                          letterSpacing: "0.01em",
                        }}
                      >
                        {isDineIn ? (tableNum ? `TABLE #${tableNum}` : "Dine-In Table") : `TOKEN: ${tokenNum || "Takeaway"}`}
                      </span>
                    </div>

                    {/* Timer Badge */}
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 3,
                        fontSize: 11,
                        fontWeight: 800,
                        background: isLate ? "#fee2e2" : isWarning ? "#fef3c7" : "#ecfdf5",
                        color: isLate ? "#b91c1c" : isWarning ? "#b45309" : "#047857",
                        border: isLate ? "1px solid #fecaca" : isWarning ? "1px solid #fde68a" : "1px solid #a7f3d0",
                      }}
                    >
                      ⏱️ {elapsedMins}m ago
                    </span>
                  </div>

                  {/* Order metadata */}
                  <div
                    style={{
                      padding: "7px 14px",
                      background: "#f8fafc",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 11,
                      borderBottom: "1px solid #e2e8f0",
                      color: "#64748b",
                    }}
                  >
                    <span style={{ fontFamily: "monospace", color: "#0f172a", fontWeight: 700 }}>
                      #{String(order.id).slice(0, 8)}
                    </span>
                    <span>
                      {order.customer_name ? `Customer: ${order.customer_name}` : "Guest"}
                    </span>
                  </div>

                  {/* Food Items Checklist */}
                  <div style={{ padding: "14px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                      {items.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: 8,
                            padding: "8px 10px",
                            background: "#f8fafc",
                            borderRadius: 4,
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 3,
                                background: "#dc2626",
                                color: "#ffffff",
                                fontWeight: 900,
                                fontSize: 13,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {item.quantity || item.qty || 1}x
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                              {item.name || item.product?.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <div
                        style={{
                          background: "#fffbeb",
                          border: "1px solid #fef08a",
                          borderRadius: 4,
                          padding: "6px 10px",
                          fontSize: 11,
                          color: "#854d0e",
                        }}
                      >
                        <strong>Note:</strong> {order.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* 1-Click Cook Actions */}
                <div style={{ padding: "12px 14px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                  {order.status !== "preparing" ? (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(order.id, "preparing")}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: 4,
                        background: "#ea580c",
                        border: "1px solid #c2410c",
                        color: "#ffffff",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        boxShadow: "0 2px 4px rgba(234, 88, 12, 0.2)",
                      }}
                    >
                      <span>🔥</span>
                      <span>Put in Oven / Start Cooking</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(order.id, "ready")}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: 4,
                        background: "#16a34a",
                        border: "1px solid #15803d",
                        color: "#ffffff",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        boxShadow: "0 2px 4px rgba(22, 163, 74, 0.2)",
                      }}
                    >
                      <span>🛎️</span>
                      <span>
                        {isDineIn ? `Ready & Cooked (Table #${tableNum || ""})` : "Ready for Counter Pickup"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
