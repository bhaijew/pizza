"use client";

import { useState, useEffect, useMemo, useTransition, useCallback } from "react";
import type { Order } from "@/types/menu";
import { updateOrderStatus, assignOrderRider, triggerRiderWhatsAppAlert } from "@/lib/admin-actions";
import { createClient } from "@/utils/supabase/client";
import {
  Search,
  Bike,
  UtensilsCrossed,
  ShoppingBag,
  Clock,
  ArrowRight,
  ExternalLink,
  Flame,
  CheckCircle2,
  XCircle,
  Key,
  MapPin,
  Phone,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";

interface OrdersLiveBoardProps {
  initialOrders: Order[];
  currencySymbol?: string;
  shopId?: number | null;
}

type FilterTab = "all" | "active" | "delivery" | "tables" | "tokens" | "pending" | "preparing" | "ready" | "delivered" | "cancelled";

function getOrderServiceInfo(order: Order) {
  let tableNumber = order.table_number || null;
  let tokenNumber = order.token_number || null;
  let deliveryAddress = order.delivery_address || null;
  let riderName = order.delivery_rider_name || null;
  let riderPhone = order.delivery_rider_phone || null;

  if (order.notes?.includes("[DELIVERY:")) {
    const match = order.notes.match(/\[DELIVERY:\s*Address:\s*([^|]+)/i);
    if (match) deliveryAddress = match[1].trim();
  }
  if (!riderName && order.notes?.includes("[RIDER:")) {
    const rMatch = order.notes.match(/\[RIDER:\s*([^|]+)/i);
    if (rMatch) riderName = rMatch[1].trim();
    const pMatch = order.notes.match(/Phone:\s*([^\]]+)/i);
    if (pMatch) riderPhone = pMatch[1].trim();
  }
  if (!tableNumber && order.notes?.includes("[DINE-IN:")) {
    const match = order.notes.match(/\[DINE-IN:\s*Table\s*([0-9A-Za-z]+)/i) || order.notes.match(/\[DINE-IN:\s*([^\]|]+)/i);
    if (match) tableNumber = match[1].trim();
  }
  if (!tokenNumber && order.notes?.includes("TOKEN:")) {
    const match = order.notes.match(/TOKEN:\s*([A-Za-z0-9-]+)/i);
    if (match) tokenNumber = match[1].trim();
  }

  const isDelivery = order.order_type === "delivery" || !!deliveryAddress;
  const isDineIn = !isDelivery && (order.order_type === "dine_in" || !!tableNumber);

  return {
    type: isDelivery ? ("delivery" as const) : isDineIn ? ("dine_in" as const) : ("takeaway" as const),
    tableNumber,
    tokenNumber,
    deliveryAddress,
    riderName,
    riderPhone,
    label: isDelivery ? "Delivery" : isDineIn ? (tableNumber ? `Table #${tableNumber}` : "Dine-In") : (tokenNumber ? `Token ${tokenNumber}` : "Takeaway"),
  };
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; nextStatus?: string; nextLabel?: string }
> = {
  pending: {
    label: "Pending Approval",
    color: "#ca8a04",
    bg: "#fefce8",
    border: "#fef08a",
    nextStatus: "confirmed",
    nextLabel: "Confirm Order →",
  },
  confirmed: {
    label: "Confirmed",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
    nextStatus: "preparing",
    nextLabel: "Send to Kitchen →",
  },
  preparing: {
    label: "In Oven / Preparing",
    color: "#ea580c",
    bg: "#fff7ed",
    border: "#fed7aa",
    nextStatus: "ready",
    nextLabel: "Mark as Ready →",
  },
  ready: {
    label: "Ready for Pickup",
    color: "#9333ea",
    bg: "#faf5ff",
    border: "#e9d5ff",
    nextStatus: "delivered",
    nextLabel: "Mark Delivered ✓",
  },
  delivered: {
    label: "Delivered / Completed",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
  },
  cancelled: {
    label: "Cancelled",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
  },
};

export default function OrdersLiveBoard({
  initialOrders,
  currencySymbol = "$",
  shopId,
}: OrdersLiveBoardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<FilterTab>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [realtimeActive, setRealtimeActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Play crisp 2-tone enterprise POS alert chime (A5 -> D6)
  const playPosOrderChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now); // A5
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(1174.66, now + 0.12); // D6

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.18);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.6);
    } catch {
      // Audio autoplay policy fallback
    }
  }, []);

  // Feature 8: Rider assignment state
  const [assigningRiderOrderId, setAssigningRiderOrderId] = useState<number | null>(null);
  const [riderNameInput, setRiderNameInput] = useState("");
  const [riderPhoneInput, setRiderPhoneInput] = useState("");
  const [sendingRiderWaId, setSendingRiderWaId] = useState<number | null>(null);
  const [riderWaSentId, setRiderWaSentId] = useState<number | null>(null);

  const handleAssignRiderSubmit = (orderId: number) => {
    if (!riderNameInput.trim()) return;
    startTransition(async () => {
      await assignOrderRider(orderId, riderNameInput.trim(), riderPhoneInput.trim());
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                delivery_rider_name: riderNameInput.trim(),
                delivery_rider_phone: riderPhoneInput.trim() || null,
                status: "ready",
              }
            : o
        )
      );
      setAssigningRiderOrderId(null);
    });
  };

  const handleSendRiderWhatsApp = async (orderId: number) => {
    setSendingRiderWaId(orderId);
    try {
      const res = await triggerRiderWhatsAppAlert(orderId);
      if (res.success) {
        setRiderWaSentId(orderId);
        setTimeout(() => setRiderWaSentId(null), 4000);
      } else {
        alert(res.error || "Failed to dispatch WhatsApp alert to rider.");
      }
    } catch (err: any) {
      alert(err?.message || "WhatsApp dispatch error.");
    } finally {
      setSendingRiderWaId(null);
    }
  };

  // Enterprise Multi-Tenant Realtime WebSocket Subscription
  useEffect(() => {
    const supabase = createClient();
    const channelName = `pos-live-orders-${shopId || "all"}-${Math.random().toString(36).substring(2, 7)}`;

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
            // Additional branch isolation guard
            if (shopId && newOrder.shop_id && Number(newOrder.shop_id) !== Number(shopId)) {
              return;
            }
            setOrders((prev) => [newOrder, ...prev]);
            if (soundEnabled) {
              playPosOrderChime();
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
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeActive(true);
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setRealtimeActive(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, soundEnabled, playPosOrderChime]);

  const handleStatusChange = (orderId: number, nextStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus as any } : o))
    );

    startTransition(async () => {
      const res = await updateOrderStatus(orderId, nextStatus);
      if (res?.error) {
        alert(res.error);
        window.location.reload();
      }
    });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const info = getOrderServiceInfo(order);

      if (activeTab === "active") {
        if (order.status === "delivered" || order.status === "cancelled") return false;
      } else if (activeTab === "delivery") {
        if (info.type !== "delivery") return false;
      } else if (activeTab === "tables") {
        if (info.type !== "dine_in") return false;
      } else if (activeTab === "tokens") {
        if (info.type !== "takeaway") return false;
      } else if (activeTab !== "all" && order.status !== activeTab) {
        return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchNumber = order.order_number.toLowerCase().includes(q);
        const matchCustomer = order.customer_name?.toLowerCase().includes(q);
        const matchPhone = order.customer_phone?.toLowerCase().includes(q);
        const matchLabel = info.label.toLowerCase().includes(q);
        const matchRider = info.riderName?.toLowerCase().includes(q);
        const matchAddress = info.deliveryAddress?.toLowerCase().includes(q);
        return matchNumber || matchCustomer || matchPhone || matchLabel || !!matchRider || !!matchAddress;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  const activeCount = orders.filter(
    (o) => o.status !== "delivered" && o.status !== "cancelled"
  ).length;

  return (
    <div>
      {/* ─── LIVE HEADER ────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Kitchen &amp; Order Live Board
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "3px 8px",
                borderRadius: "5px",
                fontSize: "11px",
                fontWeight: 700,
                background: realtimeActive ? "#f0fdf4" : "#fefce8",
                color: realtimeActive ? "#16a34a" : "#ca8a04",
                border: realtimeActive ? "1px solid #bbf7d0" : "1px solid #fef08a",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "5px",
                  background: realtimeActive ? "#16a34a" : "#ca8a04",
                }}
              ></span>
              {realtimeActive ? "REALTIME LIVE" : "CONNECTING..."}
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
            Incoming customer orders update here instantly without refreshing.
          </p>
        </div>

        {/* Sound Alert Toggle & Search */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) {
                playPosOrderChime();
              }
            }}
            title={soundEnabled ? "Mute live order sound alerts" : "Enable live order sound alerts"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              borderRadius: "6px",
              border: soundEnabled ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
              background: soundEnabled ? "#f0fdf4" : "#f8fafc",
              color: soundEnabled ? "#16a34a" : "#64748b",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span>{soundEnabled ? "Sound: ON" : "Sound: OFF"}</span>
          </button>

          {/* Search */}
          <div style={{ position: "relative", width: "240px" }}>
            <input
              type="text"
              placeholder="Search order # or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 34px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <Search
              size={15}
              style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}
            />
          </div>
        </div>
      </div>

      {/* ─── STATUS FILTER TABS ──────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "20px",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "12px",
        }}
      >
        <button
          onClick={() => setActiveTab("active")}
          style={{
            padding: "7px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeTab === "active" ? "1px solid #fed7aa" : "1px solid #e2e8f0",
            background: activeTab === "active" ? "#fff7ed" : "#ffffff",
            color: activeTab === "active" ? "#ea580c" : "#64748b",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.15s ease",
          }}
        >
          <Flame size={14} className={activeTab === "active" ? "text-orange-500" : ""} />
          <span>Active ({activeCount})</span>
        </button>

        <button
          onClick={() => setActiveTab("delivery")}
          style={{
            padding: "7px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeTab === "delivery" ? "1px solid #a7f3d0" : "1px solid #e2e8f0",
            background: activeTab === "delivery" ? "#ecfdf5" : "#ffffff",
            color: activeTab === "delivery" ? "#065f46" : "#64748b",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.15s ease",
          }}
        >
          <Bike size={14} />
          <span>Delivery ({orders.filter((o) => getOrderServiceInfo(o).type === "delivery").length})</span>
        </button>

        <button
          onClick={() => setActiveTab("all")}
          style={{
            padding: "7px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeTab === "all" ? "1px solid #cbd5e1" : "1px solid #e2e8f0",
            background: activeTab === "all" ? "#f1f5f9" : "#ffffff",
            color: activeTab === "all" ? "#0f172a" : "#64748b",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.15s ease",
          }}
        >
          <ShoppingBag size={14} />
          <span>All Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("tables")}
          style={{
            padding: "7px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeTab === "tables" ? "1px solid #fde68a" : "1px solid #e2e8f0",
            background: activeTab === "tables" ? "#fef3c7" : "#ffffff",
            color: activeTab === "tables" ? "#92400e" : "#64748b",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.15s ease",
          }}
        >
          <UtensilsCrossed size={14} />
          <span>Tables ({orders.filter(o => getOrderServiceInfo(o).type === "dine_in").length})</span>
        </button>

        <button
          onClick={() => setActiveTab("tokens")}
          style={{
            padding: "7px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeTab === "tokens" ? "1px solid #fed7aa" : "1px solid #e2e8f0",
            background: activeTab === "tokens" ? "#fff7ed" : "#ffffff",
            color: activeTab === "tokens" ? "#c2410c" : "#64748b",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.15s ease",
          }}
        >
          <Key size={14} />
          <span>Tokens ({orders.filter(o => getOrderServiceInfo(o).type === "takeaway").length})</span>
        </button>

        <button
          onClick={() => setActiveTab("pending")}
          style={{
            padding: "7px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeTab === "pending" ? "1px solid #fef08a" : "1px solid #e2e8f0",
            background: activeTab === "pending" ? "#fefce8" : "#ffffff",
            color: activeTab === "pending" ? "#ca8a04" : "#64748b",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.15s ease",
          }}
        >
          <Clock size={13} />
          <span>Pending</span>
        </button>

        <button
          onClick={() => setActiveTab("preparing")}
          style={{
            padding: "7px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeTab === "preparing" ? "1px solid #fed7aa" : "1px solid #e2e8f0",
            background: activeTab === "preparing" ? "#fff7ed" : "#ffffff",
            color: activeTab === "preparing" ? "#ea580c" : "#64748b",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.15s ease",
          }}
        >
          <Flame size={13} />
          <span>In Kitchen</span>
        </button>

        <button
          onClick={() => setActiveTab("ready")}
          style={{
            padding: "7px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeTab === "ready" ? "1px solid #e9d5ff" : "1px solid #e2e8f0",
            background: activeTab === "ready" ? "#faf5ff" : "#ffffff",
            color: activeTab === "ready" ? "#9333ea" : "#64748b",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.15s ease",
          }}
        >
          <CheckCircle2 size={13} />
          <span>Ready</span>
        </button>

        <button
          onClick={() => setActiveTab("delivered")}
          style={{
            padding: "7px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeTab === "delivered" ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
            background: activeTab === "delivered" ? "#f0fdf4" : "#ffffff",
            color: activeTab === "delivered" ? "#16a34a" : "#64748b",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.15s ease",
          }}
        >
          <CheckCircle2 size={13} />
          <span>Delivered</span>
        </button>
      </div>

      {/* ─── ORDERS GRID ────────────────────────────────────── */}
      {filteredOrders.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            border: "1px dashed #cbd5e1",
            borderRadius: "5px",
            padding: "60px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px", color: "#94a3b8" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="21" r="1"></circle>
              <circle cx="19" cy="21" r="1"></circle>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
            </svg>
          </div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px", color: "#0f172a" }}>
            No orders found in this view
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            {orders.length === 0
              ? "When customers place orders from the menu page, they will appear here instantly."
              : "No orders match your selected filter or search query."}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "16px",
          }}
        >
          {filteredOrders.map((order) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const items = Array.isArray(order.items) ? order.items : [];

            return (
              <div
                key={order.id}
                style={{
                  background: "#ffffff",
                  border: `1px solid ${cfg.border}`,
                  borderRadius: "10px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                }}
                className="admin-card-hover"
              >
                <div>
                  {/* Top Bar: Service Mode Badge (Table # / Token #) & Status Badge */}
                  {(() => {
                    const info = getOrderServiceInfo(order);
                    return (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "10px",
                          flexWrap: "wrap",
                          gap: "6px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 9px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: 800,
                              background: info.type === "delivery" ? "#ecfdf5" : info.type === "dine_in" ? "#fef3c7" : "#fff7ed",
                              color: info.type === "delivery" ? "#065f46" : info.type === "dine_in" ? "#92400e" : "#c2410c",
                              border: info.type === "delivery" ? "1px solid #a7f3d0" : info.type === "dine_in" ? "1px solid #fde68a" : "1px solid #fed7aa",
                            }}
                          >
                            {info.type === "delivery" ? (
                              <Bike size={13} />
                            ) : info.type === "dine_in" ? (
                              <UtensilsCrossed size={13} />
                            ) : (
                              <ShoppingBag size={13} />
                            )}
                            <span>{info.label}</span>
                          </span>

                          {info.tokenNumber && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "3px 8px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: 800,
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                border: "1px solid #bfdbfe",
                              }}
                            >
                              <span>🔑 Token:</span>
                              <span style={{ fontFamily: "monospace" }}>{info.tokenNumber}</span>
                            </span>
                          )}
                        </div>

                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "5px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${cfg.border}`,
                          }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Order Number & Timestamp */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "15px",
                        fontWeight: 800,
                        color: "#0f172a",
                      }}
                    >
                      {order.order_number}
                    </span>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Customer Info */}
                  {(order.customer_name || order.customer_phone) && (
                    <div
                      style={{
                        background: "#f8fafc",
                        padding: "8px 10px",
                        borderRadius: "5px",
                        fontSize: "12px",
                        marginBottom: "10px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>{order.customer_name || "Guest Customer"}</span>
                      </div>
                      {order.customer_phone && (
                        <div style={{ color: "#64748b", fontSize: "11px", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                          <span>{order.customer_phone}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feature 8: Delivery Destination & Rider Info */}
                  {(() => {
                    const info = getOrderServiceInfo(order);
                    if (info.type !== "delivery") return null;

                    return (
                      <div style={{ marginBottom: "12px" }}>
                        {info.deliveryAddress && (
                          <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "5px", padding: "8px 10px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 800, color: "#065f46", textTransform: "uppercase" }}>
                              📍 Delivery Address:
                            </span>
                            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#0f172a", fontWeight: 700 }}>
                              {info.deliveryAddress}
                            </p>
                          </div>
                        )}

                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "5px", padding: "8px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                          <div>
                            <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                              Dispatch Rider:
                            </span>
                            <p style={{ margin: "2px 0 0", fontSize: "12px", fontWeight: 800, color: info.riderName ? "#0f172a" : "#dc2626" }}>
                              {info.riderName ? `${info.riderName} (${info.riderPhone || "No phone"})` : "Rider Not Assigned"}
                            </p>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => {
                                setAssigningRiderOrderId(order.id);
                                setRiderNameInput(info.riderName || "");
                                setRiderPhoneInput(info.riderPhone || "");
                              }}
                              style={{
                                padding: "4px 8px",
                                borderRadius: "4px",
                                background: "#ffffff",
                                border: "1px solid #cbd5e1",
                                color: "#334155",
                                fontSize: "11px",
                                fontWeight: 800,
                                cursor: "pointer",
                              }}
                            >
                              {info.riderName ? "Change" : "Assign Rider"}
                            </button>

                            {info.riderPhone && (
                              <>
                                <button
                                  type="button"
                                  disabled={sendingRiderWaId === order.id}
                                  onClick={() => handleSendRiderWhatsApp(order.id)}
                                  title="Send instant automated WhatsApp alert to Rider via Railway Gateway"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    background: riderWaSentId === order.id ? "#15803d" : "#25d366",
                                    color: "#ffffff",
                                    fontSize: "11px",
                                    fontWeight: 800,
                                    border: "none",
                                    cursor: sendingRiderWaId === order.id ? "not-allowed" : "pointer",
                                    boxShadow: "0 1px 3px rgba(37, 211, 102, 0.3)",
                                  }}
                                >
                                  <span>
                                    {sendingRiderWaId === order.id
                                      ? "Sending..."
                                      : riderWaSentId === order.id
                                      ? "Sent ✓"
                                      : "💬 Auto WhatsApp"}
                                  </span>
                                </button>

                                <a
                                  href={`https://wa.me/${info.riderPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                    `Salam ${info.riderName || "Rider"}, New Delivery Order [${order.order_number}]!\n` +
                                    `Destination: ${info.deliveryAddress || "Address provided"}\n` +
                                    `Customer: ${order.customer_name} (${order.customer_phone || "N/A"})\n` +
                                    `Total to Collect: ${currencySymbol}${Number(order.total).toFixed(2)}\n` +
                                    `Please pick up from restaurant now.`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Open WhatsApp Web chat directly"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    background: "#f0fdf4",
                                    border: "1px solid #bbf7d0",
                                    color: "#166534",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    textDecoration: "none",
                                  }}
                                >
                                  <span>Web ↗</span>
                                </a>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Modal/Inline Form to Assign Rider */}
                        {assigningRiderOrderId === order.id && (
                          <div style={{ marginTop: 8, padding: 10, background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 4 }}>
                            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 800, color: "#0f172a" }}>
                              Assign Delivery Rider
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
                              <input
                                type="text"
                                placeholder="Rider Name (e.g. Tariq)"
                                value={riderNameInput}
                                onChange={(e) => setRiderNameInput(e.target.value)}
                                style={{ height: 30, padding: "0 8px", fontSize: 12, border: "1px solid #cbd5e1", borderRadius: 3 }}
                              />
                              <input
                                type="tel"
                                placeholder="Rider Phone (e.g. 03001234567)"
                                value={riderPhoneInput}
                                onChange={(e) => setRiderPhoneInput(e.target.value)}
                                style={{ height: 30, padding: "0 8px", fontSize: 12, border: "1px solid #cbd5e1", borderRadius: 3 }}
                              />
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleAssignRiderSubmit(order.id)}
                                style={{ padding: "4px 10px", background: "#059669", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                              >
                                Save Rider
                              </button>
                              <button
                                type="button"
                                onClick={() => setAssigningRiderOrderId(null)}
                                style={{ padding: "4px 10px", background: "#f1f5f9", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: 3, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Order Items List */}
                  <div
                    style={{
                      borderTop: "1px solid #f1f5f9",
                      borderBottom: "1px solid #f1f5f9",
                      padding: "10px 0",
                      marginBottom: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    {items.length === 0 ? (
                      <span style={{ fontSize: "12px", color: "#64748b" }}>Order items details</span>
                    ) : (
                      items.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "12px",
                            color: "#334155",
                          }}
                        >
                          <div>
                            <strong style={{ color: "#dc2626", marginRight: "6px" }}>
                              {item.quantity || item.qty || 1}x
                            </strong>
                            <span>{item.name || item.product?.name || "Pizza"}</span>
                            {item.selected_variation && (
                              <span style={{ marginLeft: 4, fontSize: 10, background: "#fee2e2", color: "#dc2626", padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>
                                {item.selected_variation.name}
                              </span>
                            )}
                            {item.selected_toppings && item.selected_toppings.length > 0 && (
                              <div style={{ fontSize: 10, color: "#64748b", marginLeft: 16 }}>
                                + {item.selected_toppings.map((t: any) => t.name).join(", ")}
                              </div>
                            )}
                          </div>
                          <span style={{ color: "#64748b" }}>
                            {currencySymbol}{((item.price || item.product?.price || 0) * (item.quantity || item.qty || 1)).toFixed(2)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Notes if any */}
                  {order.notes && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#92400e",
                        background: "#fefce8",
                        border: "1px solid #fef08a",
                        padding: "6px 8px",
                        borderRadius: "5px",
                        marginBottom: "12px",
                      }}
                    >
                      <strong>Note:</strong> {order.notes}
                    </div>
                  )}
                </div>

                {/* Bottom Total & Status Progress Buttons */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Total Amount</span>
                    <span style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                      {currencySymbol}{Number(order.total).toFixed(2)}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {cfg.nextStatus && (() => {
                      const info = getOrderServiceInfo(order);
                      const isReadyForDelivery = order.status === "ready";
                      const buttonLabel = isReadyForDelivery
                        ? (info.tableNumber
                          ? `Verify & Deliver Table #${info.tableNumber} ✓`
                          : `Verify & Deliver Token ${info.tokenNumber || ""} ✓`)
                        : cfg.nextLabel;

                      return (
                        <button
                          onClick={() => handleStatusChange(order.id, cfg.nextStatus!)}
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            borderRadius: "5px",
                            background: isReadyForDelivery ? "#16a34a" : "#ef4444",
                            color: "#ffffff",
                            fontSize: "12px",
                            fontWeight: 700,
                            border: "none",
                            cursor: "pointer",
                            boxShadow: isReadyForDelivery ? "0 2px 4px rgba(22, 163, 74, 0.25)" : "0 2px 4px rgba(239, 68, 68, 0.2)",
                          }}
                        >
                          {buttonLabel}
                        </button>
                      );
                    })()}

                    {order.status === "delivered" && (
                      <div
                        style={{
                          width: "100%",
                          padding: "6px 10px",
                          borderRadius: "4px",
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          color: "#166534",
                          fontSize: "11px",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span>✓</span>
                        <span>
                          {getOrderServiceInfo(order).tableNumber
                            ? `Delivered & Verified at Table #${getOrderServiceInfo(order).tableNumber}`
                            : "Delivered & Verified with Customer"}
                        </span>
                      </div>
                    )}

                    {order.status !== "cancelled" && order.status !== "delivered" && (
                      <button
                        onClick={() => {
                          if (confirm(`Cancel order ${order.order_number}?`)) {
                            handleStatusChange(order.id, "cancelled");
                          }
                        }}
                        style={{
                          padding: "8px 10px",
                          borderRadius: "5px",
                          background: "#ffffff",
                          color: "#dc2626",
                          fontSize: "12px",
                          fontWeight: 600,
                          border: "1px solid #fecaca",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
