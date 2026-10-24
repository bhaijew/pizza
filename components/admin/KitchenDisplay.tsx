"use client";

/**
 * KitchenDisplay (KDS) — Clean White High-Legibility Kitchen Display Screen.
 * Real-time order tickets for chefs & cooks with bold table numbers,
 * item checklist, elapsed time tracker, and 1-click status advancement.
 */
import { useState, useEffect, useMemo, useTransition, useRef, useCallback } from "react";
import type { Order } from "@/types/menu";
import { updateOrderStatus, lockBranchKitchen } from "@/lib/admin-actions";
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
  RefreshCw,
  Printer,
  Receipt,
  Copy,
  Check,
  ExternalLink,
  Zap,
  Lock,
} from "lucide-react";
import AudioNotificationController, {
  playAlertChime,
  SOUND_VOLUME_KEY,
  SOUND_MUTED_KEY,
} from "@/components/admin/AudioNotificationController";
import ThermalDualPrintModal from "@/components/admin/ThermalDualPrintModal";

interface KitchenDisplayProps {
  initialOrders: Order[];
  shopName?: string;
  shopId?: number | null;
  shopSlug?: string | null;
  shopInfo?: {
    name?: string;
    address?: string | null;
    phone?: string | null;
    currencySymbol?: string;
    slug?: string | null;
  };
  isStandalone?: boolean;
}

export default function KitchenDisplay({
  initialOrders,
  shopName = "Pizza Kitchen",
  shopId,
  shopSlug,
  shopInfo,
  isStandalone = false,
}: KitchenDisplayProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filterMode, setFilterMode] = useState<"all" | "tables" | "takeaway">("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isPending, startTransition] = useTransition();

  // Printing state
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [printTab, setPrintTab] = useState<"counter" | "kitchen" | "dual">("kitchen");
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [liveClock, setLiveClock] = useState<string>("");

  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const playKitchenChime = useCallback(() => {
    let vol = 80;
    let muted = false;
    try {
      const savedVol = localStorage.getItem(SOUND_VOLUME_KEY);
      const savedMuted = localStorage.getItem(SOUND_MUTED_KEY);
      if (savedVol !== null) vol = parseInt(savedVol, 10);
      if (savedMuted !== null) muted = savedMuted === "true";
    } catch {}
    playAlertChime(vol, muted, "kitchen");
  }, []);

  // Live second clock for kitchen chefs
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        setLiveClock(now.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }));
      } catch {
        setLiveClock(new Date().toLocaleTimeString());
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyKdsLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const kdsUrl = shopSlug
      ? `${origin}/${shopSlug}/kitchen`
      : `${origin}/kitchen${shopId ? `?shop=${shopId}` : ""}`;
    navigator.clipboard.writeText(kdsUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleLockScreen = async () => {
    await lockBranchKitchen();
    window.location.reload();
  };

  const handleToggleFullscreen = () => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };


  // Tick every 30 seconds to update order elapsed times
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Realtime Supabase subscription + 3-Second High-Reliability Sync Engine (Zero Manual Reloads)
  useEffect(() => {
    const supabase = createClient();
    const channelName = `kitchen-orders-live-${shopId || "all"}-${Math.random().toString(36).substring(2, 7)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as Order;
            if (shopId && newOrder.shop_id != null && Number(newOrder.shop_id) !== Number(shopId)) {
              return;
            }

            if (["pending", "confirmed", "preparing"].includes(newOrder.status)) {
              setOrders((prev) => {
                if (prev.some((o) => o.id === newOrder.id)) return prev;
                if (soundEnabledRef.current) playKitchenChime();
                return [newOrder, ...prev];
              });
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Order;
            if (shopId && updated.shop_id != null && Number(updated.shop_id) !== Number(shopId)) {
              setOrders((prev) => prev.filter((o) => o.id !== updated.id));
              return;
            }

            setOrders((prev) => {
              const existing = prev.find((o) => o.id === updated.id);
              if (existing) {
                return prev.map((o) => (o.id === updated.id ? { ...existing, ...updated } : o));
              }

              if (["pending", "confirmed", "preparing"].includes(updated.status)) {
                if (soundEnabledRef.current) playKitchenChime();
                return [updated, ...prev];
              }

              return prev;
            });
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setOrders((prev) => prev.filter((o) => o.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    // 3-second high-speed sync heartbeat via server API (bypasses RLS, zero screen reloads needed)
    const syncInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/live?kitchen=true&shopId=${shopId || ""}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          if (json.orders && Array.isArray(json.orders)) {
            const data = json.orders as Order[];
            setOrders((prev) => {
              // Trigger chime if brand new order detected
              const prevIds = new Set(prev.map((o) => o.id));
              const hasBrandNew = data.some((o) => !prevIds.has(o.id));
              if (hasBrandNew && soundEnabledRef.current) {
                playKitchenChime();
              }

              const prevSign = prev.map((o) => `${o.id}-${o.status}`).join(",");
              const newSign = data.map((o) => `${o.id}-${o.status}`).join(",");
              if (prevSign !== newSign) {
                return data;
              }
              return prev;
            });
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
  }, [shopId, playKitchenChime]);

  const handleUpdateStatus = (orderId: number, nextStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus as any } : o))
    );

    startTransition(async () => {
      await updateOrderStatus(orderId, nextStatus);
    });
  };

  // Active kitchen tickets: pending, confirmed or preparing
  const activeKitchenOrders = useMemo(() => {
    return orders.filter((o) => {
      const isKitchenStatus = ["pending", "confirmed", "preparing"].includes(o.status);
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

          {/* Live Clock for Kitchen Chefs */}
          {liveClock && (
            <div
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                background: "#0f172a",
                color: "#f8fafc",
                fontSize: 12,
                fontWeight: 800,
                fontFamily: "monospace",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <Clock size={13} className="text-amber-400" />
              <span>{liveClock}</span>
            </div>
          )}

          {/* Copy KDS Direct Link Button */}
          <button
            type="button"
            onClick={handleCopyKdsLink}
            style={{
              padding: "7px 12px",
              borderRadius: 5,
              border: copiedLink ? "1px solid #86efac" : "1px solid #cbd5e1",
              background: copiedLink ? "#f0fdf4" : "#ffffff",
              color: copiedLink ? "#15803d" : "#334155",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s ease",
            }}
            title="Copy standalone KDS link to open on any kitchen tablet, iPad, or TV"
          >
            {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copiedLink ? "KDS Link Copied!" : "📋 KDS Link"}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            style={{
              padding: "7px 12px",
              borderRadius: 5,
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              transition: "all 0.15s ease",
            }}
            title="Toggle fullscreen mode for kitchen tablet display"
          >
            <span>🖥️</span>
            <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </button>

          {/* Audio Chime Notification & Volume Controller */}
          <AudioNotificationController soundType="kitchen" />

          {/* Standalone Lock KDS Screen Button */}
          {isStandalone && (
            <button
              type="button"
              onClick={handleLockScreen}
              style={{
                padding: "7px 12px",
                borderRadius: 5,
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#dc2626",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                transition: "all 0.15s ease",
              }}
              title="Lock this Kitchen Display Station"
            >
              <Lock size={13} />
              <span>Lock KDS</span>
            </button>
          )}
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
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
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

            const items = Array.isArray(order.items)
              ? order.items
              : typeof order.items === "string"
              ? (() => {
                  try {
                    return JSON.parse(order.items);
                  } catch {
                    return [];
                  }
                })()
              : [];

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

                  {/* Recreated Ticket Alert for Cook */}
                  {order.notes?.includes("[RECREATED") && (
                    <div
                      style={{
                        background: "#fff7ed",
                        borderBottom: "1px solid #fed7aa",
                        padding: "6px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "11px",
                        fontWeight: 800,
                        color: "#c2410c",
                      }}
                    >
                      <RefreshCw size={12} />
                      <span>🔄 TICKET RECREATED / ITEMS ADDED (Prepare updated list)</span>
                    </div>
                  )}

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

                {/* 1-Click Cook Actions & Thermal Printing */}
                <div style={{ padding: "12px 14px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                  {/* Thermal Slip Print Quick Buttons */}
                  <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPrintingOrder(order);
                        setPrintTab("kitchen");
                      }}
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        borderRadius: "5px",
                        background: "#fffbeb",
                        border: "1px solid #fde68a",
                        color: "#b45309",
                        fontSize: "11px",
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                      }}
                      title="Print Chef KOT Ticket without prices"
                    >
                      <Printer size={13} />
                      <span>Print KOT</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPrintingOrder(order);
                        setPrintTab("counter");
                      }}
                      style={{
                        padding: "6px 8px",
                        borderRadius: "5px",
                        background: "#f0f9ff",
                        border: "1px solid #bae6fd",
                        color: "#0369a1",
                        fontSize: "11px",
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title="Print Customer Counter Bill with pricing & totals"
                    >
                      <Receipt size={13} />
                      <span>Bill</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPrintingOrder(order);
                        setPrintTab("dual");
                      }}
                      style={{
                        padding: "6px 8px",
                        borderRadius: "5px",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        color: "#dc2626",
                        fontSize: "11px",
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title="Print Both: Counter Bill + Kitchen KOT (2 Slips)"
                    >
                      <Zap size={13} />
                      <span>Both</span>
                    </button>
                  </div>

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

      {/* ─── THERMAL DUAL PRINT MODAL (COUNTER BILL + KITCHEN KOT) ───── */}
      {printingOrder && (
        <ThermalDualPrintModal
          order={printingOrder}
          shopInfo={{
            name: shopName,
            address: shopInfo?.address,
            phone: shopInfo?.phone,
            currencySymbol: shopInfo?.currencySymbol || "Rs.",
          }}
          defaultTab={printTab}
          onOrderUpdated={(updated) => {
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
          }}
          onClose={() => setPrintingOrder(null)}
        />
      )}
    </div>
  );
}

