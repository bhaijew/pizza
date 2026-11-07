"use client";

import { useState, useEffect, useMemo, useTransition, useCallback } from "react";
import type { Order } from "@/types/menu";
import { verifyMenuOrder, rejectMenuOrder } from "@/lib/admin-actions";
import { createClient } from "@/utils/supabase/client";
import {
  playAlertChime,
  SOUND_VOLUME_KEY,
  SOUND_MUTED_KEY,
} from "@/components/admin/AudioNotificationController";
import {
  ShieldCheck,
  Phone,
  MessageSquare,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Bike,
  UtensilsCrossed,
  ShoppingBag,
  ExternalLink,
  RefreshCw,
  Search,
  AlertTriangle,
  Flame,
  Check,
  Sun,
  Moon,
} from "lucide-react";
import ThermalDualPrintModal from "@/components/admin/ThermalDualPrintModal";

interface OrderVerificationClientProps {
  initialOrders: Order[];
  currencySymbol?: string;
  shopId?: number | null;
  shopSlug?: string | null;
  shopName?: string;
  shopPhone?: string;
  shopAddress?: string;
}

export default function OrderVerificationClient({
  initialOrders,
  currencySymbol = "Rs.",
  shopId = null,
  shopSlug = "pizza-mafia",
  shopName = "Pizza Restaurant",
  shopPhone = "0300-1234567",
  shopAddress = "Food Street",
}: OrderVerificationClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<"pending" | "verified" | "rejected" | "all">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectingOrderId, setRejectingOrderId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isDark, setIsDark] = useState(true);

  // Load saved theme preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pizza_admin_verify_theme") || localStorage.getItem("pizza_admin_sidebar_theme");
      if (saved === "light") setIsDark(false);
      else if (saved === "dark") setIsDark(true);
    } catch {}
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    try {
      localStorage.setItem("pizza_admin_verify_theme", next ? "dark" : "light");
    } catch {}
  };

  // Determine if order belongs in online verification flow
  const isVerifyTarget = (o: any) => {
    return (
      o.source === "online_menu" ||
      o.is_verified === false ||
      Boolean(o.notes?.includes("[ONLINE_MENU: AWAITING_VERIFICATION]")) ||
      Boolean(o.notes?.includes("[DELIVERY:")) ||
      Boolean(o.notes?.includes("[DINE-IN:")) ||
      Boolean(o.notes?.includes("[TAKEAWAY:"))
    );
  };

  // Determine if order is an online menu order awaiting verification
  const isPendingVerification = (order: Order) => {
    if (order.status === "cancelled") return false;
    return (
      (order as any).is_verified === false ||
      order.notes?.includes("[ONLINE_MENU: AWAITING_VERIFICATION]") ||
      ((order as any).source === "online_menu" && !(order as any).is_verified)
    );
  };

  const isVerified = (order: Order) => {
    if (order.status === "cancelled") return false;
    return (
      (order as any).is_verified === true &&
      !order.notes?.includes("[ONLINE_MENU: AWAITING_VERIFICATION]")
    );
  };

  const isRejected = (order: Order) => {
    return order.status === "cancelled";
  };

  // Play crisp local synthesized alert chime
  const playVerifyAlert = useCallback(() => {
    let vol = 80;
    let muted = false;
    try {
      const savedVol = localStorage.getItem(SOUND_VOLUME_KEY);
      const savedMuted = localStorage.getItem(SOUND_MUTED_KEY);
      if (savedVol !== null) vol = parseInt(savedVol, 10);
      if (savedMuted !== null) muted = savedMuted === "true";
    } catch {}
    playAlertChime(vol, muted, "pos");
  }, []);

  // Live Sync Engine — bypasses RLS and fetches brand new orders with zero browser reload
  const fetchLiveOrders = useCallback(
    async (silent = true) => {
      try {
        if (!silent) setIsRefreshing(true);
        const res = await fetch(`/api/orders/live?shopId=${shopId || ""}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          if (json.orders && Array.isArray(json.orders)) {
            const allOrders = json.orders as Order[];
            const relevantOrders = allOrders.filter(isVerifyTarget);

            setOrders((prev) => {
              const prevIds = new Set(prev.map((o) => o.id));
              const hasNewPending = relevantOrders.some(
                (o) => !prevIds.has(o.id) && isPendingVerification(o)
              );
              if (hasNewPending) {
                playVerifyAlert();
              }

              const getOrderFp = (o: Order) =>
                `${o.id}_${o.status}_${(o as any).is_verified}_${o.total}_${o.created_at}_${o.updated_at || ""}_${o.items?.length || 0}_${(o.notes || "").slice(-25)}`;
              const prevSign = prev.map(getOrderFp).join(",");
              const newSign = relevantOrders.map(getOrderFp).join(",");
              if (prevSign !== newSign) {
                return relevantOrders;
              }
              return prev;
            });
            setLastSyncTime(new Date());
          }
        }
      } catch {
        // network blink safe
      } finally {
        if (!silent) setIsRefreshing(false);
      }
    },
    [shopId, playVerifyAlert]
  );

  // Fast background auto-poll every 2.5 seconds (zero manual refresh needed!)
  useEffect(() => {
    const syncInterval = setInterval(() => {
      fetchLiveOrders(true);
    }, 2500);

    return () => clearInterval(syncInterval);
  }, [fetchLiveOrders]);

  // Enterprise Realtime WebSocket Subscription for instant incoming menu orders
  useEffect(() => {
    const supabase = createClient();
    const channelName = `verify-orders-${shopId || "all"}-${Math.random().toString(36).substring(2, 7)}`;

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
            if (isVerifyTarget(newOrder)) {
              setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
              if (isPendingVerification(newOrder)) {
                playVerifyAlert();
              }
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Order;
            if (shopId && updated.shop_id != null && Number(updated.shop_id) !== Number(shopId)) {
              setOrders((prev) => prev.filter((o) => o.id !== updated.id));
              return;
            }
            if (isVerifyTarget(updated)) {
              setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
            } else {
              setOrders((prev) => prev.filter((o) => o.id !== updated.id));
            }
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((o) => o.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, playVerifyAlert]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        if (activeTab === "pending") {
          if (!isPendingVerification(order)) return false;
        } else if (activeTab === "verified") {
          if (!isVerified(order)) return false;
        } else if (activeTab === "rejected") {
          if (!isRejected(order)) return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const num = (order.order_number || "").toLowerCase();
          const name = (order.customer_name || "").toLowerCase();
          const phone = (order.customer_phone || "").replace(/\D/g, "");
          const cleanQ = q.replace(/\D/g, "");
          return (
            num.includes(q) ||
            name.includes(q) ||
            (cleanQ && phone.includes(cleanQ))
          );
        }

        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, activeTab, searchQuery]);

  // Tab counts
  const pendingCount = useMemo(() => orders.filter(isPendingVerification).length, [orders]);
  const verifiedCount = useMemo(() => orders.filter(isVerified).length, [orders]);
  const rejectedCount = useMemo(() => orders.filter(isRejected).length, [orders]);

  // Handle Verify Order Action
  const handleVerify = (order: Order, sendToKitchen = true) => {
    setProcessingId(order.id);
    startTransition(async () => {
      const res = await verifyMenuOrder(order.id, { sendToKitchen });
      if (res.success && res.order) {
        setOrders((prev) => prev.map((o) => (o.id === order.id ? res.order! : o)));
      } else {
        alert(res.error || "Failed to verify order.");
      }
      setProcessingId(null);
    });
  };

  // Handle Verify & Immediate Print
  const handleVerifyAndPrint = (order: Order) => {
    setProcessingId(order.id);
    startTransition(async () => {
      const res = await verifyMenuOrder(order.id, { sendToKitchen: true });
      if (res.success && res.order) {
        setOrders((prev) => prev.map((o) => (o.id === order.id ? res.order! : o)));
        setPrintingOrder(res.order);
      } else {
        alert(res.error || "Failed to verify order.");
      }
      setProcessingId(null);
    });
  };

  // Handle Reject / Prank Order
  const handleRejectSubmit = (orderId: number) => {
    if (!rejectReason.trim()) {
      alert("Please enter or select a rejection reason.");
      return;
    }
    setProcessingId(orderId);
    startTransition(async () => {
      const res = await rejectMenuOrder(orderId, rejectReason);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: "cancelled",
                  is_verified: false,
                  notes: `[REJECTED: ${rejectReason}] ${o.notes || ""}`,
                }
              : o
          )
        );
        setRejectingOrderId(null);
        setRejectReason("");
      } else {
        alert(res.error || "Failed to reject order.");
      }
      setProcessingId(null);
    });
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "60px", fontFamily: "var(--font-poppins, system-ui, sans-serif)" }}>
      {/* ─── 1. EXECUTIVE COMMAND BAR WITH BACKGROUND PHOTO & THEME SUPPORT ─── */}
      <div
        style={{
          position: "relative",
          background: isDark
            ? "linear-gradient(135deg, rgba(9, 23, 42, 0.90) 0%, rgba(13, 35, 63, 0.94) 100%), url('/images/pizzger-hero-pizza.jpg') center/cover no-repeat"
            : "linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(248, 250, 252, 0.96) 100%), url('/images/pizzger-hero-pizza.jpg') center/cover no-repeat",
          borderRadius: "5px",
          border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid #cbd5e1",
          padding: "16px 20px",
          marginBottom: "16px",
          boxShadow: isDark
            ? "0 10px 30px -8px rgba(9, 23, 42, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)"
            : "0 6px 20px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.04)",
          backdropFilter: "blur(8px)",
          color: isDark ? "#ffffff" : "#0f172a",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
          {/* Left: Glowing Executive Badge & Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "5px",
                background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(234, 88, 12, 0.45)",
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={20} strokeWidth={2.4} />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: 900,
                    color: isDark ? "#ffffff" : "#0f172a",
                    letterSpacing: "0.02em",
                    textTransform: "uppercase",
                  }}
                >
                  Online Menu Orders Verification
                </h2>

                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "2px 8px",
                    borderRadius: "5px",
                    background: isDark ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.15)",
                    border: isDark ? "1px solid rgba(52, 211, 153, 0.4)" : "1px solid rgba(16, 185, 129, 0.4)",
                    color: isDark ? "#34d399" : "#059669",
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#10b981",
                      boxShadow: "0 0 6px #10b981",
                    }}
                    className="admin-pulse-green"
                  />
                  <span>Auto-Live (2.5s)</span>
                </span>
              </div>

              <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: isDark ? "#94a3b8" : "#64748b" }}>
                Review customer details, address, and items before releasing orders into the Live Kitchen &amp; POS Board.
              </p>
            </div>
          </div>

          {/* Right: Executive Controls Bar (Theme Toggle, Refresh, Live Board) */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            {/* White & Dark Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 12px",
                borderRadius: "5px",
                border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                background: isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff",
                color: isDark ? "#ffffff" : "#0f172a",
                fontSize: "11.5px",
                fontWeight: 800,
                cursor: "pointer",
                backdropFilter: "blur(4px)",
                transition: "all 0.15s ease",
              }}
              title={isDark ? "Switch to White / Light Mode" : "Switch to Dark Executive Mode"}
            >
              {isDark ? (
                <>
                  <Sun size={13} className="text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon size={13} className="text-slate-700" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => fetchLiveOrders(false)}
              disabled={isRefreshing}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 12px",
                borderRadius: "5px",
                border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                background: isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff",
                color: isDark ? "#ffffff" : "#0f172a",
                fontSize: "11.5px",
                fontWeight: 800,
                cursor: isRefreshing ? "wait" : "pointer",
                backdropFilter: "blur(4px)",
                transition: "all 0.15s ease",
              }}
              title="Force check for new orders now"
            >
              <RefreshCw size={12} className={isRefreshing ? "animate-spin text-amber-400" : ""} />
              <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
            </button>

            {/* Link to Live Orders Board */}
            <a
              href="/admin/orders"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 14px",
                borderRadius: "5px",
                background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                border: "none",
                color: "#ffffff",
                fontSize: "11.5px",
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(234, 88, 12, 0.35)",
                transition: "all 0.15s ease",
              }}
            >
              <span>Live Orders Board →</span>
            </a>
          </div>
        </div>

        {/* Real-time Statistics Strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginTop: "14px" }}>
          <div
            style={{
              background: isDark ? "rgba(0, 0, 0, 0.4)" : "#ffffff",
              border: isDark ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid #fde68a",
              borderRadius: "5px",
              padding: "10px 14px",
              boxShadow: isDark ? "none" : "0 2px 6px rgba(245, 158, 11, 0.08)",
            }}
          >
            <span style={{ fontSize: "10.5px", color: isDark ? "#fbbf24" : "#b45309", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Awaiting Verification
            </span>
            <div style={{ fontSize: "24px", fontWeight: 900, color: isDark ? "#ffffff" : "#0f172a", marginTop: "2px" }}>
              {pendingCount}
            </div>
          </div>

          <div
            style={{
              background: isDark ? "rgba(0, 0, 0, 0.4)" : "#ffffff",
              border: isDark ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid #bbf7d0",
              borderRadius: "5px",
              padding: "10px 14px",
              boxShadow: isDark ? "none" : "0 2px 6px rgba(16, 185, 129, 0.08)",
            }}
          >
            <span style={{ fontSize: "10.5px", color: isDark ? "#34d399" : "#15803d", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Approved &amp; Sent to Live
            </span>
            <div style={{ fontSize: "24px", fontWeight: 900, color: isDark ? "#ffffff" : "#0f172a", marginTop: "2px" }}>
              {verifiedCount}
            </div>
          </div>

          <div
            style={{
              background: isDark ? "rgba(0, 0, 0, 0.4)" : "#ffffff",
              border: isDark ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid #fecaca",
              borderRadius: "5px",
              padding: "10px 14px",
              boxShadow: isDark ? "none" : "0 2px 6px rgba(239, 68, 68, 0.08)",
            }}
          >
            <span style={{ fontSize: "10.5px", color: isDark ? "#f87171" : "#dc2626", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Rejected / Prank Orders
            </span>
            <div style={{ fontSize: "24px", fontWeight: 900, color: isDark ? "#ffffff" : "#0f172a", marginTop: "2px" }}>
              {rejectedCount}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. FILTER TABS & SEARCH BAR (5PX RADIUS + THEME SUPPORT) ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            style={{
              padding: "7px 14px",
              borderRadius: "5px",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
              border: activeTab === "pending" ? "1.5px solid #f59e0b" : isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid #cbd5e1",
              background: activeTab === "pending" ? (isDark ? "rgba(245, 158, 11, 0.2)" : "#fffbeb") : isDark ? "rgba(255, 255, 255, 0.05)" : "#ffffff",
              color: activeTab === "pending" ? (isDark ? "#fbbf24" : "#b45309") : isDark ? "#94a3b8" : "#475569",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <span>🟡 Awaiting Verification</span>
            <span style={{ background: "#f59e0b", color: "#ffffff", padding: "1px 6px", borderRadius: "5px", fontSize: "10.5px" }}>
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("verified")}
            style={{
              padding: "7px 14px",
              borderRadius: "5px",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
              border: activeTab === "verified" ? "1.5px solid #10b981" : isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid #cbd5e1",
              background: activeTab === "verified" ? (isDark ? "rgba(16, 185, 129, 0.2)" : "#ecfdf5") : isDark ? "rgba(255, 255, 255, 0.05)" : "#ffffff",
              color: activeTab === "verified" ? (isDark ? "#34d399" : "#065f46") : isDark ? "#94a3b8" : "#475569",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <span>🟢 Verified &amp; Approved</span>
            <span style={{ background: "#10b981", color: "#ffffff", padding: "1px 6px", borderRadius: "5px", fontSize: "10.5px" }}>
              {verifiedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rejected")}
            style={{
              padding: "7px 14px",
              borderRadius: "5px",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
              border: activeTab === "rejected" ? "1.5px solid #ef4444" : isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid #cbd5e1",
              background: activeTab === "rejected" ? (isDark ? "rgba(239, 68, 68, 0.2)" : "#fef2f2") : isDark ? "rgba(255, 255, 255, 0.05)" : "#ffffff",
              color: activeTab === "rejected" ? (isDark ? "#f87171" : "#991b1b") : isDark ? "#94a3b8" : "#475569",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <span>🔴 Rejected</span>
            <span style={{ background: "#ef4444", color: "#ffffff", padding: "1px 6px", borderRadius: "5px", fontSize: "10.5px" }}>
              {rejectedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("all")}
            style={{
              padding: "7px 14px",
              borderRadius: "5px",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
              border: activeTab === "all" ? (isDark ? "1.5px solid #f97316" : "1.5px solid #0f172a") : isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid #cbd5e1",
              background: activeTab === "all" ? (isDark ? "#f97316" : "#0f172a") : isDark ? "rgba(255, 255, 255, 0.05)" : "#ffffff",
              color: activeTab === "all" ? "#ffffff" : isDark ? "#94a3b8" : "#475569",
              transition: "all 0.15s ease",
            }}
          >
            All Menu Orders ({orders.length})
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: "relative", minWidth: "240px" }}>
          <Search size={14} style={{ position: "absolute", left: "10px", top: "11px", color: isDark ? "#64748b" : "#94a3b8" }} />
          <input
            type="text"
            placeholder="Search order #, customer, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              height: "36px",
              paddingLeft: "32px",
              paddingRight: "10px",
              fontSize: "12px",
              borderRadius: "5px",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
              background: isDark ? "rgba(15, 23, 42, 0.8)" : "#ffffff",
              color: isDark ? "#ffffff" : "#0f172a",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* ─── 3. ORDERS CARDS GRID (5PX RADIUS & THEME AWARE) ─── */}
      {filteredOrders.length === 0 ? (
        <div
          style={{
            background: isDark ? "#0f172a" : "#ffffff",
            border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1.5px solid #e2e8f0",
            borderRadius: "5px",
            padding: "44px 20px",
            textAlign: "center",
            boxShadow: isDark ? "0 4px 14px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "70px",
              height: "70px",
              borderRadius: "5px",
              overflow: "hidden",
              margin: "0 auto 14px",
              border: "2px solid #fed7aa",
              boxShadow: "0 4px 12px rgba(234, 88, 12, 0.15)",
              background: isDark ? "#1e293b" : "#fff7ed",
            }}
          >
            <img
              src="/images/pizzger-hero-pizza.jpg"
              alt="Verification Queue Clean"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 800, color: isDark ? "#ffffff" : "#0f172a" }}>
            No Orders in this View
          </h3>
          <p style={{ margin: 0, fontSize: "13px", color: isDark ? "#94a3b8" : "#64748b" }}>
            {activeTab === "pending"
              ? "All online menu orders have been verified! New incoming orders will appear here in real-time."
              : "No orders found matching the selected filter."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "14px" }}>
          {filteredOrders.map((order) => {
            const isUnverified = isPendingVerification(order);
            const isApproved = isVerified(order);
            const isOrderCancelled = isRejected(order);
            const items = Array.isArray(order.items) ? order.items : [];
            const isDelivery = order.order_type === "delivery" || order.delivery_address || order.notes?.includes("[DELIVERY:");
            const isDineIn = order.order_type === "dine_in" || order.table_number || order.notes?.includes("[DINE-IN:");
            const isTakeaway = order.order_type === "takeaway" || order.token_number || order.notes?.includes("[TAKEAWAY:");

            const discountVal = Number((order as any).discount_amount || 0);
            const promoCode = (order as any).promo_code;
            const itemsSum = Array.isArray(order.items)
              ? order.items.reduce((s: number, it: any) => s + (Number(it.price || 0) * Number(it.qty || it.quantity || 1)), 0)
              : 0;
            const feeVal = Number(order.delivery_fee || 0);
            const rawUndiscounted = itemsSum > 0 ? (itemsSum + feeVal) : 0;
            const isTotalUndiscounted = discountVal > 0 && Math.abs(Number(order.total) - rawUndiscounted) < 1;
            const effectiveTotal = isTotalUndiscounted
              ? Math.max(0, Number(order.total) - discountVal)
              : Number(order.total);

            const customerPhoneClean = (order.customer_phone || "").replace(/\D/g, "");
            const waVerificationMsg = encodeURIComponent(
              `Salam ${order.customer_name || "Customer"}! This is ${shopName}. We received your online order #${order.order_number} (${currencySymbol} ${effectiveTotal.toFixed(2)}). Please confirm if you are available to receive it so our kitchen can prepare it now.`
            );
            const customerWaUrl = `https://wa.me/${customerPhoneClean}?text=${waVerificationMsg}`;
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              order.delivery_address || "Pakistan"
            )}`;

            return (
              <div
                key={order.id}
                style={{
                  background: isDark ? "#0f172a" : "#ffffff",
                  border: isUnverified
                    ? "2px solid #f59e0b"
                    : isOrderCancelled
                    ? (isDark ? "1.5px solid #7f1d1d" : "1.5px solid #fecaca")
                    : (isDark ? "1.5px solid #065f46" : "1.5px solid #bbf7d0"),
                  borderRadius: "5px",
                  padding: "16px",
                  boxShadow: isUnverified
                    ? "0 4px 14px rgba(245, 158, 11, 0.16)"
                    : isDark
                    ? "0 4px 12px rgba(0, 0, 0, 0.3)"
                    : "0 2px 6px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  {/* Top Header Card Info */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "16px", fontWeight: 900, fontFamily: "monospace", color: isDark ? "#f8fafc" : "#0f172a" }}>
                          #{order.order_number}
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: "5px",
                            background: isDelivery ? (isDark ? "rgba(37, 99, 235, 0.2)" : "#eff6ff") : isDineIn ? (isDark ? "rgba(168, 85, 247, 0.2)" : "#fdf4ff") : (isDark ? "rgba(234, 179, 8, 0.2)" : "#fefce8"),
                            color: isDelivery ? (isDark ? "#93c5fd" : "#1d4ed8") : isDineIn ? (isDark ? "#f0abfc" : "#86198f") : (isDark ? "#fde047" : "#854d0e"),
                            border: `1px solid ${isDelivery ? (isDark ? "rgba(59, 130, 246, 0.4)" : "#bfdbfe") : isDineIn ? (isDark ? "rgba(168, 85, 247, 0.4)" : "#f5d0fe") : (isDark ? "rgba(234, 179, 8, 0.4)" : "#fde047")}`,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          {isDelivery ? <Bike size={11} /> : isDineIn ? <UtensilsCrossed size={11} /> : <ShoppingBag size={11} />}
                          <span>{isDelivery ? "Delivery" : isDineIn ? `Table #${order.table_number || "QR"}` : `Takeaway #${order.token_number || "Token"}`}</span>
                        </span>
                      </div>
                      <span style={{ fontSize: "11px", color: isDark ? "#94a3b8" : "#64748b", marginTop: "2px", display: "block" }}>
                        {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • Online Menu Order
                      </span>
                    </div>

                    <div>
                      {isUnverified ? (
                        <span style={{ fontSize: "11px", fontWeight: 800, color: isDark ? "#fbbf24" : "#b45309", background: isDark ? "rgba(245, 158, 11, 0.2)" : "#fef3c7", padding: "3px 8px", borderRadius: "5px", border: isDark ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid #fde68a" }}>
                          ⚠️ Awaiting Verify
                        </span>
                      ) : isOrderCancelled ? (
                        <span style={{ fontSize: "11px", fontWeight: 800, color: isDark ? "#fca5a5" : "#991b1b", background: isDark ? "rgba(239, 68, 68, 0.2)" : "#fee2e2", padding: "3px 8px", borderRadius: "5px", border: isDark ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid #fecaca" }}>
                          ❌ Rejected
                        </span>
                      ) : (
                        <span style={{ fontSize: "11px", fontWeight: 800, color: isDark ? "#86efac" : "#166534", background: isDark ? "rgba(16, 185, 129, 0.2)" : "#dcfce7", padding: "3px 8px", borderRadius: "5px", border: isDark ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid #bbf7d0" }}>
                          ✓ Live Order
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer Information Box */}
                  <div
                    style={{
                      background: isDark ? "rgba(255, 255, 255, 0.04)" : "#f8fafc",
                      border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
                      borderRadius: "5px",
                      padding: "10px 12px",
                      marginBottom: "12px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <strong style={{ fontSize: "13.5px", color: isDark ? "#f8fafc" : "#0f172a" }}>
                        {order.customer_name || "Valued Customer"}
                      </strong>
                      <span style={{ fontSize: "12px", fontFamily: "monospace", fontWeight: 700, color: isDark ? "#38bdf8" : "#0284c7" }}>
                        {order.customer_phone || "No phone"}
                      </span>
                    </div>

                    {order.delivery_address && (
                      <p style={{ margin: "4px 0 8px", fontSize: "12px", color: isDark ? "#cbd5e1" : "#475569", lineHeight: 1.35 }}>
                        📍 {order.delivery_address}
                      </p>
                    )}

                    {/* Quick Contact & Verification Buttons */}
                    <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                      {order.customer_phone && (
                        <>
                          <a
                            href={`tel:${order.customer_phone}`}
                            style={{
                              flex: 1,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "4px",
                              padding: "6px 8px",
                              borderRadius: "5px",
                              background: isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff",
                              border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                              color: isDark ? "#ffffff" : "#0f172a",
                              fontSize: "11.5px",
                              fontWeight: 700,
                              textDecoration: "none",
                            }}
                          >
                            <Phone size={13} className="text-blue-500" />
                            <span>Call</span>
                          </a>

                          <a
                            href={customerWaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              flex: 1.2,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "4px",
                              padding: "6px 8px",
                              borderRadius: "5px",
                              background: isDark ? "rgba(16, 185, 129, 0.2)" : "#ecfdf5",
                              border: isDark ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid #a7f3d0",
                              color: isDark ? "#34d399" : "#065f46",
                              fontSize: "11.5px",
                              fontWeight: 700,
                              textDecoration: "none",
                            }}
                          >
                            <MessageSquare size={13} className="text-emerald-500" />
                            <span>Verify WA</span>
                          </a>
                        </>
                      )}

                      {order.delivery_address && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: "6px 8px",
                            borderRadius: "5px",
                            background: isDark ? "rgba(37, 99, 235, 0.2)" : "#eff6ff",
                            border: isDark ? "1px solid rgba(59, 130, 246, 0.4)" : "1px solid #bfdbfe",
                            color: isDark ? "#93c5fd" : "#1d4ed8",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                          title="Open Google Maps"
                        >
                          <MapPin size={13} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Food Items in Package */}
                  <div style={{ borderTop: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #f1f5f9", paddingTop: "8px", marginBottom: "12px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      {items.map((item: any, idx: number) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: isDark ? "#e2e8f0" : "#334155" }}>
                          <div>
                            <strong style={{ color: "#ef4444", marginRight: "6px" }}>
                              {item.quantity || item.qty || 1}x
                            </strong>
                            <span>{item.name || item.product?.name || "Item"}</span>
                            {item.selected_variation && (
                              <span style={{ marginLeft: 4, fontSize: 10, background: isDark ? "rgba(239, 68, 68, 0.25)" : "#fee2e2", color: isDark ? "#fca5a5" : "#dc2626", padding: "1px 5px", borderRadius: "5px", fontWeight: 700 }}>
                                {item.selected_variation.name}
                              </span>
                            )}
                            {item.selected_toppings && item.selected_toppings.length > 0 && (
                              <div style={{ fontSize: 10, color: isDark ? "#94a3b8" : "#64748b", marginLeft: 16 }}>
                                + {item.selected_toppings.map((t: any) => t.name).join(", ")}
                              </div>
                            )}
                          </div>
                          <span style={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>
                            {currencySymbol}{((item.price || item.product?.price || 0) * (item.quantity || item.qty || 1)).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {discountVal > 0 && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: isDark ? "rgba(16, 185, 129, 0.15)" : "#f0fdf4",
                          border: isDark ? "1px dashed rgba(52, 211, 153, 0.4)" : "1px dashed #86efac",
                          borderRadius: "5px",
                          padding: "4px 8px",
                          marginTop: "8px",
                          marginBottom: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "11px",
                            color: isDark ? "#86efac" : "#166534",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span>🎟️ Coupon:</span>
                          <strong
                            style={{
                              background: isDark ? "rgba(16, 185, 129, 0.3)" : "#dcfce7",
                              padding: "1px 6px",
                              borderRadius: "5px",
                              letterSpacing: "0.5px",
                              fontSize: "10.5px",
                            }}
                          >
                            {promoCode || "DISCOUNT"}
                          </strong>
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: 800, color: isDark ? "#34d399" : "#15803d" }}>
                          -{currencySymbol} {discountVal.toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px", paddingTop: "6px", borderTop: isDark ? "1px dashed rgba(255, 255, 255, 0.1)" : "1px dashed #cbd5e1" }}>
                      <span style={{ fontSize: "12px", color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700 }}>Total Order Value:</span>
                      <strong style={{ fontSize: "16px", color: isDark ? "#ffffff" : "#0f172a", fontWeight: 900 }}>
                        {currencySymbol} {effectiveTotal.toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons (Strictly 5px radius) */}
                <div>
                  {isUnverified ? (
                    <div>
                      {rejectingOrderId === order.id ? (
                        <div style={{ background: isDark ? "rgba(239, 68, 68, 0.15)" : "#fef2f2", border: isDark ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid #fecaca", borderRadius: "5px", padding: "10px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 800, color: isDark ? "#fca5a5" : "#991b1b", display: "block", marginBottom: "4px" }}>
                            Reason for Rejecting / Cancelling:
                          </span>
                          <input
                            type="text"
                            placeholder="e.g. Customer phone not answering / Prank order"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            style={{
                              width: "100%",
                              height: "32px",
                              fontSize: "12px",
                              padding: "0 8px",
                              borderRadius: "5px",
                              border: isDark ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid #cbd5e1",
                              background: isDark ? "#1e293b" : "#ffffff",
                              color: isDark ? "#ffffff" : "#0f172a",
                              marginBottom: "6px",
                              boxSizing: "border-box",
                            }}
                          />
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingOrderId(null);
                                setRejectReason("");
                              }}
                              style={{
                                flex: 1,
                                height: "30px",
                                borderRadius: "5px",
                                background: isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff",
                                border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                                color: isDark ? "#ffffff" : "#0f172a",
                                fontSize: "11.5px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={isPending && processingId === order.id}
                              onClick={() => handleRejectSubmit(order.id)}
                              style={{
                                flex: 1,
                                height: "30px",
                                borderRadius: "5px",
                                background: "#dc2626",
                                color: "#ffffff",
                                border: "none",
                                fontSize: "11.5px",
                                fontWeight: 800,
                                cursor: "pointer",
                              }}
                            >
                              {isPending && processingId === order.id ? "Rejecting..." : "Confirm Reject"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {/* Primary Button: Verify & Send to Kitchen */}
                            <button
                              type="button"
                              disabled={isPending && processingId === order.id}
                              onClick={() => handleVerify(order, true)}
                              style={{
                                flex: 2,
                                height: "40px",
                                borderRadius: "5px",
                                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                color: "#ffffff",
                                border: "none",
                                fontSize: "12.5px",
                                fontWeight: 900,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                              }}
                              className="hover:brightness-110 active:scale-[0.99] transition-all"
                            >
                              {isPending && processingId === order.id ? (
                                <RefreshCw size={14} className="animate-spin" />
                              ) : (
                                <CheckCircle2 size={15} />
                              )}
                              <span>Verify &amp; Send to Kitchen</span>
                            </button>

                            {/* Verify & Print Thermal Receipt */}
                            <button
                              type="button"
                              disabled={isPending && processingId === order.id}
                              onClick={() => handleVerifyAndPrint(order)}
                              style={{
                                flex: 1,
                                height: "40px",
                                borderRadius: "5px",
                                background: isDark ? "rgba(37, 99, 235, 0.2)" : "#eff6ff",
                                color: isDark ? "#93c5fd" : "#1d4ed8",
                                border: isDark ? "1.5px solid rgba(59, 130, 246, 0.4)" : "1.5px solid #bfdbfe",
                                fontSize: "11.5px",
                                fontWeight: 800,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                              }}
                              title="Verify order and immediately open Thermal Receipt & KOT print dialog"
                            >
                              <Printer size={14} />
                              <span>Verify &amp; Print</span>
                            </button>
                          </div>

                          {/* Reject / Prank Order Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingOrderId(order.id);
                              setRejectReason("Customer not answering / Prank Order");
                            }}
                            style={{
                              width: "100%",
                              height: "30px",
                              borderRadius: "5px",
                              background: isDark ? "rgba(239, 68, 68, 0.15)" : "#fef2f2",
                              color: isDark ? "#fca5a5" : "#dc2626",
                              border: isDark ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid #fecaca",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            ❌ Reject / Fake Prank Order
                          </button>
                        </div>
                      )}
                    </div>
                  ) : isOrderCancelled ? (
                    <div style={{ textAlign: "center", padding: "8px", background: isDark ? "rgba(239, 68, 68, 0.15)" : "#fef2f2", borderRadius: "5px", fontSize: "11.5px", color: isDark ? "#fca5a5" : "#991b1b", fontWeight: 700, border: isDark ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid #fecaca" }}>
                      Rejected &amp; Cancelled by Admin
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: isDark ? "rgba(16, 185, 129, 0.15)" : "#f0fdf4", borderRadius: "5px", border: isDark ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid #bbf7d0" }}>
                      <span style={{ fontSize: "11.5px", color: isDark ? "#86efac" : "#166534", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Check size={13} />
                        <span>Active on Live Orders Board</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setPrintingOrder(order)}
                        style={{
                          background: isDark ? "rgba(255, 255, 255, 0.1)" : "#ffffff",
                          border: isDark ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid #cbd5e1",
                          color: isDark ? "#ffffff" : "#0f172a",
                          padding: "4px 8px",
                          borderRadius: "5px",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <Printer size={12} />
                        <span>Print</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── THERMAL DUAL PRINT MODAL ─── */}
      {printingOrder && (
        <ThermalDualPrintModal
          order={printingOrder}
          shopInfo={{
            name: shopName,
            address: shopAddress,
            phone: shopPhone,
            currencySymbol,
          }}
          onClose={() => setPrintingOrder(null)}
        />
      )}
    </div>
  );
}
