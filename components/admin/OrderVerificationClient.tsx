"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import type { Order } from "@/types/menu";
import { verifyMenuOrder, rejectMenuOrder } from "@/lib/admin-actions";
import { createClient } from "@/utils/supabase/client";
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
            setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
            try {
              // Play alert chime if available
              const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
              audio.volume = 0.8;
              audio.play().catch(() => {});
            } catch {}
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Order;
            if (shopId && updated.shop_id != null && Number(updated.shop_id) !== Number(shopId)) {
              setOrders((prev) => prev.filter((o) => o.id !== updated.id));
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
  }, [shopId]);

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
      {/* ─── PAGE HEADER ─── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#ffffff",
          borderRadius: "5px",
          border: "1px solid #334155",
          padding: "20px",
          marginBottom: "16px",
          boxShadow: "0 4px 14px rgba(15, 23, 42, 0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(245, 158, 11, 0.18)", border: "1px solid rgba(245, 158, 11, 0.35)", padding: "3px 8px", borderRadius: "4px", marginBottom: "6px" }}>
              <ShieldCheck size={14} className="text-amber-400" />
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Order Verification Terminal
              </span>
            </div>
            <h1 style={{ margin: "2px 0 6px", fontSize: "22px", fontWeight: 900, letterSpacing: "-0.5px" }}>
              Online Menu Orders Verification
            </h1>
            <p style={{ margin: 0, fontSize: "12.5px", color: "#94a3b8", maxWidth: "680px" }}>
              Review customer details, address, and items before releasing orders into the Live Kitchen & POS Board. Prevents fake / prank orders and eliminates wasted cooking and thermal paper.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <a
              href="/admin/orders"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 800,
                padding: "8px 14px",
                borderRadius: "5px",
                textDecoration: "none",
              }}
            >
              <span>Live Orders Board →</span>
            </a>
          </div>
        </div>

        {/* Real-time Statistics Strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginTop: "16px" }}>
          <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "5px", padding: "10px 14px" }}>
            <span style={{ fontSize: "11px", color: "#fbbf24", fontWeight: 800, textTransform: "uppercase" }}>Awaiting Verification</span>
            <div style={{ fontSize: "24px", fontWeight: 900, color: "#ffffff", marginTop: "2px" }}>
              {pendingCount}
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "5px", padding: "10px 14px" }}>
            <span style={{ fontSize: "11px", color: "#34d399", fontWeight: 800, textTransform: "uppercase" }}>Approved & Sent to Live</span>
            <div style={{ fontSize: "24px", fontWeight: 900, color: "#ffffff", marginTop: "2px" }}>
              {verifiedCount}
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "5px", padding: "10px 14px" }}>
            <span style={{ fontSize: "11px", color: "#f87171", fontWeight: 800, textTransform: "uppercase" }}>Rejected / Prank Orders</span>
            <div style={{ fontSize: "24px", fontWeight: 900, color: "#ffffff", marginTop: "2px" }}>
              {rejectedCount}
            </div>
          </div>
        </div>
      </div>

      {/* ─── FILTER TABS & SEARCH BAR ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            style={{
              padding: "7px 14px",
              borderRadius: "5px",
              fontSize: "12.5px",
              fontWeight: 800,
              cursor: "pointer",
              border: activeTab === "pending" ? "1.5px solid #f59e0b" : "1px solid #cbd5e1",
              background: activeTab === "pending" ? "#fffbeb" : "#ffffff",
              color: activeTab === "pending" ? "#b45309" : "#475569",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🟡 Awaiting Verification</span>
            <span style={{ background: "#f59e0b", color: "#ffffff", padding: "1px 6px", borderRadius: "10px", fontSize: "11px" }}>
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("verified")}
            style={{
              padding: "7px 14px",
              borderRadius: "5px",
              fontSize: "12.5px",
              fontWeight: 800,
              cursor: "pointer",
              border: activeTab === "verified" ? "1.5px solid #10b981" : "1px solid #cbd5e1",
              background: activeTab === "verified" ? "#ecfdf5" : "#ffffff",
              color: activeTab === "verified" ? "#065f46" : "#475569",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🟢 Verified & Approved</span>
            <span style={{ background: "#10b981", color: "#ffffff", padding: "1px 6px", borderRadius: "10px", fontSize: "11px" }}>
              {verifiedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rejected")}
            style={{
              padding: "7px 14px",
              borderRadius: "5px",
              fontSize: "12.5px",
              fontWeight: 800,
              cursor: "pointer",
              border: activeTab === "rejected" ? "1.5px solid #ef4444" : "1px solid #cbd5e1",
              background: activeTab === "rejected" ? "#fef2f2" : "#ffffff",
              color: activeTab === "rejected" ? "#991b1b" : "#475569",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🔴 Rejected</span>
            <span style={{ background: "#ef4444", color: "#ffffff", padding: "1px 6px", borderRadius: "10px", fontSize: "11px" }}>
              {rejectedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("all")}
            style={{
              padding: "7px 14px",
              borderRadius: "5px",
              fontSize: "12.5px",
              fontWeight: 800,
              cursor: "pointer",
              border: activeTab === "all" ? "1.5px solid #0f172a" : "1px solid #cbd5e1",
              background: activeTab === "all" ? "#0f172a" : "#ffffff",
              color: activeTab === "all" ? "#ffffff" : "#475569",
            }}
          >
            All Menu Orders ({orders.length})
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: "relative", minWidth: "240px" }}>
          <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "#94a3b8" }} />
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
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* ─── ORDERS CARDS GRID ─── */}
      {filteredOrders.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            border: "1.5px solid #e2e8f0",
            borderRadius: "5px",
            padding: "48px 20px",
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ width: "48px", height: "48px", borderRadius: "5px", background: "#f1f5f9", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <CheckCircle2 size={24} />
          </div>
          <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
            No Orders in this View
          </h3>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
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

            const customerPhoneClean = (order.customer_phone || "").replace(/\D/g, "");
            const waVerificationMsg = encodeURIComponent(
              `Salam ${order.customer_name || "Customer"}! This is ${shopName}. We received your online order #${order.order_number} (${currencySymbol} ${Number(order.total).toFixed(2)}). Please confirm if you are available to receive it so our kitchen can prepare it now.`
            );
            const customerWaUrl = `https://wa.me/${customerPhoneClean}?text=${waVerificationMsg}`;
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              order.delivery_address || "Pakistan"
            )}`;

            return (
              <div
                key={order.id}
                style={{
                  background: "#ffffff",
                  border: isUnverified
                    ? "2px solid #f59e0b"
                    : isOrderCancelled
                    ? "1.5px solid #fecaca"
                    : "1.5px solid #bbf7d0",
                  borderRadius: "5px",
                  padding: "16px",
                  boxShadow: isUnverified ? "0 4px 12px rgba(245, 158, 11, 0.12)" : "0 2px 6px rgba(0,0,0,0.03)",
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
                        <span style={{ fontSize: "16px", fontWeight: 900, fontFamily: "monospace", color: "#0f172a" }}>
                          #{order.order_number}
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: "3px",
                            background: isDelivery ? "#eff6ff" : isDineIn ? "#fdf4ff" : "#fefce8",
                            color: isDelivery ? "#1d4ed8" : isDineIn ? "#86198f" : "#854d0e",
                            border: `1px solid ${isDelivery ? "#bfdbfe" : isDineIn ? "#f5d0fe" : "#fde047"}`,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          {isDelivery ? <Bike size={11} /> : isDineIn ? <UtensilsCrossed size={11} /> : <ShoppingBag size={11} />}
                          <span>{isDelivery ? "Delivery" : isDineIn ? `Table #${order.table_number || "QR"}` : `Takeaway #${order.token_number || "Token"}`}</span>
                        </span>
                      </div>
                      <span style={{ fontSize: "11px", color: "#64748b", marginTop: "2px", display: "block" }}>
                        {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • Online Menu Order
                      </span>
                    </div>

                    <div>
                      {isUnverified ? (
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "#b45309", background: "#fef3c7", padding: "3px 8px", borderRadius: "4px", border: "1px solid #fde68a" }}>
                          ⚠️ Awaiting Verify
                        </span>
                      ) : isOrderCancelled ? (
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "#991b1b", background: "#fee2e2", padding: "3px 8px", borderRadius: "4px", border: "1px solid #fecaca" }}>
                          ❌ Rejected
                        </span>
                      ) : (
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "#166534", background: "#dcfce7", padding: "3px 8px", borderRadius: "4px", border: "1px solid #bbf7d0" }}>
                          ✓ Live Order
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer Information Box */}
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "5px",
                      padding: "10px 12px",
                      marginBottom: "12px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <strong style={{ fontSize: "13.5px", color: "#0f172a" }}>
                        {order.customer_name || "Valued Customer"}
                      </strong>
                      <span style={{ fontSize: "12px", fontFamily: "monospace", fontWeight: 700, color: "#0284c7" }}>
                        {order.customer_phone || "No phone"}
                      </span>
                    </div>

                    {order.delivery_address && (
                      <p style={{ margin: "4px 0 8px", fontSize: "12px", color: "#475569", lineHeight: 1.35 }}>
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
                              borderRadius: "4px",
                              background: "#ffffff",
                              border: "1px solid #cbd5e1",
                              color: "#0f172a",
                              fontSize: "11.5px",
                              fontWeight: 700,
                              textDecoration: "none",
                            }}
                          >
                            <Phone size={13} className="text-blue-600" />
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
                              borderRadius: "4px",
                              background: "#ecfdf5",
                              border: "1px solid #a7f3d0",
                              color: "#065f46",
                              fontSize: "11.5px",
                              fontWeight: 700,
                              textDecoration: "none",
                            }}
                          >
                            <MessageSquare size={13} className="text-emerald-600" />
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
                            borderRadius: "4px",
                            background: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            color: "#1d4ed8",
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
                  <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "8px", marginBottom: "12px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      {items.map((item: any, idx: number) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#334155" }}>
                          <div>
                            <strong style={{ color: "#dc2626", marginRight: "6px" }}>
                              {item.quantity || item.qty || 1}x
                            </strong>
                            <span>{item.name || item.product?.name || "Item"}</span>
                            {item.selected_variation && (
                              <span style={{ marginLeft: 4, fontSize: 10, background: "#fee2e2", color: "#dc2626", padding: "1px 5px", borderRadius: "3px", fontWeight: 700 }}>
                                {item.selected_variation.name}
                              </span>
                            )}
                            {item.selected_toppings && item.selected_toppings.length > 0 && (
                              <div style={{ fontSize: 10, color: "#64748b", marginLeft: 16 }}>
                                + {item.selected_toppings.map((t: any) => t.name).join(", ")}
                              </div>
                            )}
                          </div>
                          <span style={{ color: "#64748b", fontWeight: 600 }}>
                            {currencySymbol}{((item.price || item.product?.price || 0) * (item.quantity || item.qty || 1)).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed #cbd5e1" }}>
                      <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>Total Order Value:</span>
                      <strong style={{ fontSize: "16px", color: "#0f172a", fontWeight: 900 }}>
                        {currencySymbol} {Number(order.total).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div>
                  {isUnverified ? (
                    <div>
                      {rejectingOrderId === order.id ? (
                        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "5px", padding: "10px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 800, color: "#991b1b", display: "block", marginBottom: "4px" }}>
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
                              borderRadius: "4px",
                              border: "1px solid #cbd5e1",
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
                                borderRadius: "4px",
                                background: "#ffffff",
                                border: "1px solid #cbd5e1",
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
                                borderRadius: "4px",
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
                                height: "42px",
                                borderRadius: "5px",
                                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                color: "#ffffff",
                                border: "none",
                                fontSize: "13px",
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
                                <RefreshCw size={15} className="animate-spin" />
                              ) : (
                                <CheckCircle2 size={16} />
                              )}
                              <span>Verify & Send to Kitchen</span>
                            </button>

                            {/* Verify & Print Thermal Receipt */}
                            <button
                              type="button"
                              disabled={isPending && processingId === order.id}
                              onClick={() => handleVerifyAndPrint(order)}
                              style={{
                                flex: 1,
                                height: "42px",
                                borderRadius: "5px",
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                border: "1.5px solid #bfdbfe",
                                fontSize: "12px",
                                fontWeight: 800,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                              }}
                              title="Verify order and immediately open Thermal Receipt & KOT print dialog"
                            >
                              <Printer size={15} />
                              <span>Verify & Print</span>
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
                              height: "32px",
                              borderRadius: "4px",
                              background: "#fef2f2",
                              color: "#dc2626",
                              border: "1px solid #fecaca",
                              fontSize: "11.5px",
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
                    <div style={{ textAlign: "center", padding: "8px", background: "#fef2f2", borderRadius: "4px", fontSize: "11.5px", color: "#991b1b", fontWeight: 700 }}>
                      Rejected & Cancelled by Admin
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#f0fdf4", borderRadius: "4px", border: "1px solid #bbf7d0" }}>
                      <span style={{ fontSize: "12px", color: "#166534", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Check size={14} />
                        <span>Active on Live Orders Board</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setPrintingOrder(order)}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          color: "#0f172a",
                          padding: "4px 8px",
                          borderRadius: "4px",
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
