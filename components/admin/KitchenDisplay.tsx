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
import {
  ChefHat,
  UtensilsCrossed,
  ShoppingBag,
  Volume2,
  VolumeX,
  Clock,
  Flame,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface KitchenDisplayProps {
  initialOrders: Order[];
  shopName?: string;
  shopId?: number | null;
}

export default function KitchenDisplay({
  initialOrders,
  shopName = "Pizza Kitchen",
  shopId,
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
    const channelName = `kitchen-orders-${shopId || "all"}-${Math.random().toString(36).substring(2, 7)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          ...(shopId ? { filter: `shop_id=eq.${shopId}` } : {}),
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as Order;
            if (shopId && newOrder.shop_id && Number(newOrder.shop_id) !== Number(shopId)) {
              return;
            }
            setOrders((prev) => [newOrder, ...prev]);

            // Audio beep for new kitchen ticket
            if (soundEnabled) {
              try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                gain.gain.setValueAtTime(0.18, ctx.currentTime);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.3);
              } catch {}
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Order;
            if (shopId && updated.shop_id && Number(updated.shop_id) !== Number(shopId)) {
              return;
            }
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
  }, [shopId, soundEnabled]);

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
              width: 42,
              height: 42,
              borderRadius: 10,
              background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 4px 14px rgba(239, 68, 68, 0.35)",
            }}
          >
            <ChefHat size={22} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "#0f172a", letterSpacing: "-0.01em" }}>
                {shopName} &bull; Kitchen Display System
              </h1>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  background: "#dcfce7",
                  color: "#15803d",
                  border: "1px solid #bbf7d0",
                  padding: "2px 8px",
                  borderRadius: 20,
                  textTransform: "uppercase",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} className="admin-pulse-green" />
                <span>LIVE SYNC</span>
              </span>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
              Active table tickets & takeaway prep queue
            </p>
          </div>
        </div>

        {/* Filter buttons & Sound toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", background: "#f1f5f9", padding: 3, borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
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
                padding: "6px 14px",
                borderRadius: 6,
                border: "none",
                background: filterMode === "tables" ? "#dc2626" : "transparent",
                color: filterMode === "tables" ? "#ffffff" : "#475569",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <UtensilsCrossed size={13} />
              <span>Tables Only</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("takeaway")}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                border: "none",
                background: filterMode === "takeaway" ? "#dc2626" : "transparent",
                color: filterMode === "takeaway" ? "#ffffff" : "#475569",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <ShoppingBag size={13} />
              <span>Takeaway Only</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            style={{
              padding: "7px 12px",
              borderRadius: 6,
              border: soundEnabled ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
              background: soundEnabled ? "#f0fdf4" : "#ffffff",
              color: soundEnabled ? "#16a34a" : "#64748b",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              transition: "all 0.15s ease",
            }}
          >
            {soundEnabled ? <Volume2 size={14} className="text-emerald-500" /> : <VolumeX size={14} />}
            <span>{soundEnabled ? "Chime ON" : "Chime OFF"}</span>
          </button>
        </div>
      </div>

      {/* ─── ACTIVE KITCHEN TICKETS GRID ───────────────────────────── */}
      {activeKitchenOrders.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            border: "1px dashed #cbd5e1",
            borderRadius: 12,
            padding: "64px 20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#dcfce7",
              color: "#16a34a",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <CheckCircle2 size={30} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px", color: "#0f172a" }}>
            All Kitchen Tickets Cleared!
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0, maxWidth: 360, marginInline: "auto" }}>
            No pending or preparing pizza orders in the kitchen. New orders will appear here automatically with live alerts.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 18,
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
                  borderRadius: 10,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: isLate ? "0 8px 20px rgba(239, 68, 68, 0.18)" : "0 2px 8px rgba(0,0,0,0.04)",
                  overflow: "hidden",
                }}
                className="admin-card-hover"
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
                      {isDineIn ? (
                        <UtensilsCrossed size={16} className="text-amber-800" />
                      ) : (
                        <ShoppingBag size={16} className="text-slate-700" />
                      )}
                      <span
                        style={{
                          fontWeight: 900,
                          fontSize: 16,
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
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 800,
                        background: isLate ? "#fee2e2" : isWarning ? "#fef3c7" : "#ecfdf5",
                        color: isLate ? "#b91c1c" : isWarning ? "#b45309" : "#047857",
                        border: isLate ? "1px solid #fecaca" : isWarning ? "1px solid #fde68a" : "1px solid #a7f3d0",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Clock size={11} />
                      <span>{elapsedMins}m ago</span>
                    </span>
                  </div>

                  {/* Order metadata */}
                  <div
                    style={{
                      padding: "8px 14px",
                      background: "#f8fafc",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 11,
                      borderBottom: "1px solid #e2e8f0",
                      color: "#64748b",
                    }}
                  >
                    <span style={{ fontFamily: "monospace", color: "#0f172a", fontWeight: 800 }}>
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
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            padding: "8px 10px",
                            background: "#f8fafc",
                            borderRadius: 6,
                            border: "1px solid #f1f5f9",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 5,
                                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                                color: "#ffffff",
                                fontWeight: 900,
                                fontSize: 13,
                                display: "inline-flex",
                                alignItems: "center",
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
                          borderRadius: 6,
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
                        padding: "11px",
                        borderRadius: 6,
                        background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                        border: "none",
                        color: "#ffffff",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        boxShadow: "0 2px 8px rgba(234, 88, 12, 0.3)",
                      }}
                      className="hover:opacity-95"
                    >
                      <Flame size={16} />
                      <span>Put in Oven / Start Cooking</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(order.id, "ready")}
                      style={{
                        width: "100%",
                        padding: "11px",
                        borderRadius: 6,
                        background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                        border: "none",
                        color: "#ffffff",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        boxShadow: "0 2px 8px rgba(22, 163, 74, 0.3)",
                      }}
                      className="hover:opacity-95"
                    >
                      <CheckCircle2 size={16} />
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
