"use client";

import { useState, useTransition } from "react";
import { confirmDeliveryByRider, markDeliveryPickedUpByRider } from "@/lib/order-actions";
import {
  Bike,
  MapPin,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  Store,
  RefreshCw,
  Check,
  Copy,
} from "lucide-react";

// Safe inline SVG helpers for robust compatibility
const NavigationIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);

const PackageIcon = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const ChevronDownIcon = ({ size = 16, color = "#64748b" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronUpIcon = ({ size = 16, color = "#64748b" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);


interface RiderDeliveryPortalProps {
  order: any;
  orderNumber: string;
  shopName?: string;
  shopPhone?: string;
  currencySymbol?: string;
}

export default function RiderDeliveryPortal({
  order: initialOrder,
  orderNumber,
  shopName = "Pizza Restaurant",
  shopPhone = "0300-1234567",
  currencySymbol = "Rs.",
}: RiderDeliveryPortalProps) {
  const [order, setOrder] = useState<any>(initialOrder);
  const [isPending, startTransition] = useTransition();
  const [deliveryNote, setDeliveryNote] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showItems, setShowItems] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Parse delivery info from order
  let deliveryAddress = order?.delivery_address || "";
  let riderName = order?.delivery_rider_name || "";
  let riderPhone = order?.delivery_rider_phone || "";
  let deliveryFee: number | null = null;

  if (order?.notes?.includes("[DELIVERY:")) {
    const match = order.notes.match(/\[DELIVERY:\s*Address:\s*([^|]+)/i);
    if (match && !deliveryAddress) deliveryAddress = match[1].trim();
    const feeMatch = order.notes.match(/Fee:\s*([0-9.]+)/i);
    if (feeMatch) deliveryFee = parseFloat(feeMatch[1]);
  }
  if (order?.notes?.includes("[RIDER:")) {
    const rMatch = order.notes.match(/\[RIDER:\s*([^|]+)/i);
    if (rMatch && !riderName) riderName = rMatch[1].trim();
  }

  const items = Array.isArray(order?.items) ? order.items : [];
  const isDelivered = order?.status === "delivered";
  const isCancelled = order?.status === "cancelled";
  const customerPhoneClean = (order?.customer_phone || "").replace(/[^0-9]/g, "");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    deliveryAddress || "Pakistan"
  )}`;
  const customerWaUrl = `https://wa.me/${customerPhoneClean}?text=${encodeURIComponent(
    `Salam ${order?.customer_name || "Customer"}! I am your delivery rider${
      riderName ? ` (${riderName})` : ""
    } from ${shopName} delivering your order #${orderNumber}. Please let me know if you need any directions.`
  )}`;

  // Handle Mark Picked Up
  const handleMarkPickedUp = () => {
    startTransition(async () => {
      const res = await markDeliveryPickedUpByRider(orderNumber);
      if (res.success && res.order) {
        setOrder(res.order);
      } else {
        setErrorMsg(res.error || "Failed to mark order as picked up.");
      }
    });
  };

  // Handle Confirm Delivered
  const handleConfirmDelivered = () => {
    startTransition(async () => {
      setErrorMsg(null);
      const res = await confirmDeliveryByRider(orderNumber, riderName, deliveryNote);
      if (res.success && res.order) {
        setOrder(res.order);
        setShowConfirmModal(false);
      } else {
        setErrorMsg(res.error || "Failed to confirm delivery.");
      }
    });
  };

  // Copy Portal Link
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (!order) {
    return (
      <div style={{ maxWidth: "480px", margin: "40px auto", padding: "20px", textAlign: "center", fontFamily: "var(--font-poppins, sans-serif)" }}>
        <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <AlertCircle size={32} />
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
          Order Not Found
        </h2>
        <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 20px" }}>
          Could not find delivery order <strong>#{orderNumber}</strong>. Please verify the order number.
        </p>
        <a
          href="/delivery"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: "#059669",
            color: "#ffffff",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "13px",
          }}
        >
          ← Search Another Order
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "520px",
        margin: "0 auto",
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "16px 12px 60px",
        fontFamily: "var(--font-poppins, system-ui, sans-serif)",
      }}
    >
      {/* Top Header Card */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#ffffff",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "12px",
          boxShadow: "0 4px 14px rgba(15, 23, 42, 0.15)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                background: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              <Bike size={18} />
            </div>
            <div>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Rider Delivery Portal
              </span>
              <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#ffffff" }}>
                {shopName}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#ffffff",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
            title="Share or copy portal link"
          >
            {copiedLink ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copiedLink ? "Copied" : "Copy Link"}</span>
          </button>
        </div>

        {/* Order ID & Live Status Bar */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            borderRadius: "8px",
            padding: "10px 12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "10px",
          }}
        >
          <div>
            <span style={{ fontSize: "10px", color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 700 }}>
              Order Reference
            </span>
            <span style={{ fontSize: "18px", fontWeight: 900, fontFamily: "monospace", color: "#38bdf8", letterSpacing: "-0.5px" }}>
              #{order.order_number}
            </span>
          </div>

          <div>
            {isDelivered ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  background: "#10b981",
                  color: "#ffffff",
                  fontSize: "11.5px",
                  fontWeight: 800,
                }}
              >
                <CheckCircle2 size={13} />
                <span>Delivered ✓</span>
              </span>
            ) : isCancelled ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  background: "#dc2626",
                  color: "#ffffff",
                  fontSize: "11.5px",
                  fontWeight: 800,
                }}
              >
                <span>Cancelled</span>
              </span>
            ) : (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  background: "#f59e0b",
                  color: "#0f172a",
                  fontSize: "11.5px",
                  fontWeight: 800,
                }}
              >
                <Clock size={13} />
                <span>Out for Delivery</span>
              </span>
            )}
          </div>
        </div>

        {riderName && (
          <div style={{ marginTop: "8px", fontSize: "11.5px", color: "#cbd5e1", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🛵 Assigned Rider:</span>
            <strong style={{ color: "#ffffff" }}>{riderName}</strong>
          </div>
        )}
      </div>

      {/* Cash to Collect Card (Primary Action Focus!) */}
      <div
        style={{
          background: isDelivered ? "#f0fdf4" : "linear-gradient(135deg, #fefce8 0%, #fffbeb 100%)",
          border: isDelivered ? "2px solid #86efac" : "2px solid #fde047",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <div>
          <span style={{ fontSize: "11px", fontWeight: 800, color: isDelivered ? "#166534" : "#854d0e", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {isDelivered ? "Cash Collected (Completed)" : "💰 Total Cash to Collect"}
          </span>
          <div style={{ fontSize: "26px", fontWeight: 900, color: isDelivered ? "#15803d" : "#0f172a", marginTop: "2px" }}>
            {currencySymbol} {Number(order.total).toFixed(2)}
          </div>
          {deliveryFee !== null && (
            <span style={{ fontSize: "11px", color: isDelivered ? "#166534" : "#92400e", fontWeight: 700 }}>
              (Includes {currencySymbol}{deliveryFee} Delivery Charge)
            </span>
          )}
        </div>

        <div style={{ textAlign: "right" }}>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: "6px",
              background: isDelivered ? "#dcfce7" : "#fef08a",
              color: isDelivered ? "#166534" : "#713f12",
              fontSize: "12px",
              fontWeight: 800,
            }}
          >
            {isDelivered ? "PAID ✓" : "Cash on Delivery"}
          </span>
        </div>
      </div>

      {/* Delivery Destination & Navigation Card */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "12px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
          <MapPin size={16} className="text-emerald-600" />
          <span style={{ fontSize: "11px", fontWeight: 800, color: "#065f46", textTransform: "uppercase" }}>
            Delivery Destination
          </span>
        </div>

        <p style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 800, color: "#0f172a", lineHeight: 1.4 }}>
          {deliveryAddress || "Address provided via phone"}
        </p>

        {deliveryAddress && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              height: "40px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 800,
              textDecoration: "none",
              boxShadow: "0 2px 6px rgba(2, 132, 199, 0.3)",
              boxSizing: "border-box",
            }}
          >
            <NavigationIcon size={16} />
            <span>Open Google Maps Turn-by-Turn Navigation</span>
          </a>
        )}
      </div>

      {/* Customer Contact Card */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "12px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <div>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
              Customer Details
            </span>
            <h3 style={{ margin: "2px 0 0", fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>
              {order.customer_name || "Valued Customer"}
            </h3>
            {order.customer_phone && (
              <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#475569", fontWeight: 700 }}>
                {order.customer_phone}
              </span>
            )}
          </div>
        </div>

        {order.customer_phone && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <a
              href={`tel:${order.customer_phone}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                height: "38px",
                borderRadius: "8px",
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                color: "#0f172a",
                fontSize: "12px",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              <Phone size={14} className="text-blue-600" />
              <span>Call Customer</span>
            </a>

            <a
              href={customerWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                height: "38px",
                borderRadius: "8px",
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                color: "#065f46",
                fontSize: "12px",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              <MessageSquare size={14} className="text-emerald-600" />
              <span>WhatsApp</span>
            </a>
          </div>
        )}
      </div>

      {/* Order Food Package Items Checklist */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "14px 16px",
          marginBottom: "16px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <button
          type="button"
          onClick={() => setShowItems(!showItems)}
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <PackageIcon size={15} className="text-slate-600" />
            <span style={{ fontSize: "12.5px", fontWeight: 800, color: "#0f172a" }}>
              Food Items in Package ({items.length})
            </span>
          </div>
          {showItems ? <ChevronUpIcon size={16} color="#64748b" /> : <ChevronDownIcon size={16} color="#64748b" />}
        </button>

        {showItems && (
          <div style={{ marginTop: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {items.map((item: any, idx: number) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#334155" }}>
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
                <span style={{ color: "#64748b", fontWeight: 600 }}>
                  {currencySymbol}{((item.price || item.product?.price || 0) * (item.quantity || item.qty || 1)).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            fontSize: "12px",
            padding: "10px 14px",
            borderRadius: "8px",
            marginBottom: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Primary Action Button Bar */}
      {isDelivered ? (
        <div
          style={{
            background: "#ecfdf5",
            border: "2px solid #10b981",
            borderRadius: "12px",
            padding: "16px",
            textAlign: "center",
          }}
        >
          <CheckCircle2 size={36} className="text-emerald-600" style={{ margin: "0 auto 8px" }} />
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 900, color: "#065f46" }}>
            Delivery Completed & Verified! 🎉
          </h3>
          <p style={{ margin: 0, fontSize: "12px", color: "#047857" }}>
            Order #{order.order_number} has been marked as delivered. Cash collection has been recorded in the live system.
          </p>
        </div>
      ) : isCancelled ? (
        <div
          style={{
            background: "#fef2f2",
            border: "2px solid #ef4444",
            borderRadius: "12px",
            padding: "16px",
            textAlign: "center",
          }}
        >
          <AlertCircle size={36} className="text-red-600" style={{ margin: "0 auto 8px" }} />
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 900, color: "#991b1b" }}>
            Order Cancelled
          </h3>
          <p style={{ margin: 0, fontSize: "12px", color: "#b91c1c" }}>
            This order was cancelled by the shop administrator. Do not deliver.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {order.status !== "ready" && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleMarkPickedUp}
              style={{
                width: "100%",
                height: "44px",
                borderRadius: "10px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                color: "#1d4ed8",
                fontSize: "13px",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <PackageIcon size={16} />
              <span>📦 Mark Order Picked Up from Restaurant</span>
            </button>
          )}

          <button
            type="button"
            disabled={isPending}
            onClick={() => setShowConfirmModal(true)}
            style={{
              width: "100%",
              height: "50px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: 900,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35)",
            }}
            className="hover:brightness-110 active:scale-[0.99] transition-all"
          >
            <CheckCircle2 size={20} />
            <span>Confirm Order Delivered & Cash Collected</span>
          </button>
        </div>
      )}

      {/* Confirmation Modal Drawer */}
      {showConfirmModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(3px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: "0",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              width: "100%",
              maxWidth: "500px",
              borderTopLeftRadius: "16px",
              borderTopRightRadius: "16px",
              padding: "20px 16px 28px",
              boxShadow: "0 -10px 25px -5px rgba(0,0,0,0.1)",
              animation: "slideUp 0.2s ease-out",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: "#dcfce7",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 10px",
                }}
              >
                <CheckCircle2 size={30} />
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 900, color: "#0f172a" }}>
                Confirm Delivery Completion
              </h3>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                Confirm that order <strong>#{order.order_number}</strong> has been handed to{" "}
                <strong>{order.customer_name || "the customer"}</strong> and cash of{" "}
                <strong style={{ color: "#059669" }}>
                  {currencySymbol} {Number(order.total).toFixed(2)}
                </strong>{" "}
                has been collected.
              </p>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                Delivery Note (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Handed to customer at doorstep / Gate"
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                style={{
                  width: "100%",
                  height: "38px",
                  padding: "0 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  color: "#0f172a",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                style={{
                  flex: 1,
                  height: "44px",
                  borderRadius: "8px",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Go Back
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmDelivered}
                style={{
                  flex: 2,
                  height: "44px",
                  borderRadius: "8px",
                  background: "#10b981",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 900,
                  cursor: isPending ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.35)",
                }}
              >
                {isPending ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Confirming...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Yes, Confirm Delivered ✓</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
