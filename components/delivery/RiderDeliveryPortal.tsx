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
  RefreshCw,
  Check,
  Copy,
} from "lucide-react";

// Safe inline SVG helpers for robust compatibility
const BanknoteIcon = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="12" x="2" y="6" rx="2" />
    <circle cx="12" cy="12" r="2" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
);

const CreditCardIcon = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </svg>
);

const GlobeIcon = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" x2="22" y1="12" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

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
  shopSlug?: string;
  shopPhone?: string;
  currencySymbol?: string;
}

export default function RiderDeliveryPortal({
  order: initialOrder,
  orderNumber,
  shopName = "Pizza Restaurant",
  shopSlug = "pizza-mafia",
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
  const [copiedTxn, setCopiedTxn] = useState(false);

  // Check if order already has card/digital or cash payment recorded
  const initialPaymentMethod = order?.payment_method || "";
  const initialIsCard =
    initialPaymentMethod.toLowerCase().includes("card") ||
    initialPaymentMethod.toLowerCase().includes("online") ||
    order?.notes?.includes("Payment: Card");
  const initialTxn =
    order?.transaction_id ||
    order?.notes?.match(/TXN:\s*([^)\],|]+)/i)?.[1]?.trim() ||
    initialPaymentMethod.match(/TXN:\s*([^)\],|]+)/i)?.[1]?.trim() ||
    "";

  // Payment Method Selection State: "Cash" or "Card"
  const [paymentMode, setPaymentMode] = useState<"Cash" | "Card">(initialIsCard ? "Card" : "Cash");
  const [transactionId, setTransactionId] = useState<string>(initialTxn);

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

  // Subdomain Delivery Portal Link (e.g. https://pizza-mafia.solewhat.store/delivery/ORD-XXXX)
  const canonicalPortalUrl = shopSlug
    ? `https://${shopSlug}.solewhat.store/delivery/${encodeURIComponent(orderNumber)}`
    : `https://pizza-mafia.solewhat.store/delivery/${encodeURIComponent(orderNumber)}`;

  // Resolved delivered payment details
  const deliveredMethod = order?.payment_method || (paymentMode === "Card" ? "Card / Online" : "Cash on Delivery");
  const deliveredIsCard =
    deliveredMethod.toLowerCase().includes("card") ||
    deliveredMethod.toLowerCase().includes("online") ||
    order?.notes?.includes("Payment: Card");
  const deliveredTxn =
    order?.transaction_id ||
    order?.notes?.match(/TXN:\s*([^)\],|]+)/i)?.[1]?.trim() ||
    deliveredMethod.match(/TXN:\s*([^)\],|]+)/i)?.[1]?.trim() ||
    transactionId;

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

  // Handle Confirm Delivered with Payment Mode & Optional Transaction ID
  const handleConfirmDelivered = () => {
    startTransition(async () => {
      setErrorMsg(null);
      const res = await confirmDeliveryByRider(
        orderNumber,
        riderName,
        deliveryNote,
        paymentMode,
        paymentMode === "Card" ? transactionId : undefined
      );
      if (res.success && res.order) {
        setOrder(res.order);
        setShowConfirmModal(false);
      } else {
        setErrorMsg(res.error || "Failed to confirm delivery.");
      }
    });
  };

  // Copy Subdomain Portal Link
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(canonicalPortalUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyTxn = (txn: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(txn);
      setCopiedTxn(true);
      setTimeout(() => setCopiedTxn(false), 2000);
    }
  };

  if (!order) {
    return (
      <div
        style={{
          maxWidth: "480px",
          margin: "40px auto",
          padding: "24px 20px",
          textAlign: "center",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "5px",
          fontFamily: "var(--font-poppins, sans-serif)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "5px",
            background: "#fee2e2",
            color: "#dc2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <AlertCircle size={28} />
        </div>
        <h2 style={{ fontSize: "19px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
          Order Not Found
        </h2>
        <p style={{ fontSize: "13.5px", color: "#64748b", margin: "0 0 20px" }}>
          Could not find delivery order <strong>#{orderNumber}</strong>. Please verify the order number.
        </p>
        <a
          href="/delivery"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: "#059669",
            color: "#ffffff",
            borderRadius: "5px",
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
        background: "#f1f5f9",
        padding: "14px 12px 60px",
        fontFamily: "var(--font-poppins, system-ui, sans-serif)",
      }}
    >
      {/* ─── 1. TOP HEADER CARD (Square 5px) ─── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#ffffff",
          borderRadius: "5px",
          border: "1px solid #334155",
          padding: "16px",
          marginBottom: "10px",
          boxShadow: "0 4px 12px rgba(15, 23, 42, 0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "5px",
                background: "#059669",
                border: "1px solid #10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                flexShrink: 0,
              }}
            >
              <Bike size={20} />
            </div>
            <div>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "#34d399",
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  display: "block",
                }}
              >
                Rider Delivery Portal
              </span>
              <h2 style={{ margin: "1px 0 0", fontSize: "16px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.2px" }}>
                {shopName}
              </h2>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                padding: "6px 10px",
                borderRadius: "5px",
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.22)",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
              title="Copy official subdomain delivery portal link"
            >
              {copiedLink ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
            </button>
            <span
              style={{
                fontSize: "9px",
                color: "#94a3b8",
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                fontFamily: "monospace",
              }}
            >
              <GlobeIcon size={9} />
              <span>{shopSlug}.solewhat.store</span>
            </span>
          </div>
        </div>

        {/* Order ID & Live Status Bar */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.07)",
            borderRadius: "5px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
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
                  padding: "5px 10px",
                  borderRadius: "5px",
                  background: "#10b981",
                  border: "1px solid #059669",
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
                  padding: "5px 10px",
                  borderRadius: "5px",
                  background: "#dc2626",
                  border: "1px solid #b91c1c",
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
                  padding: "5px 10px",
                  borderRadius: "5px",
                  background: "#f59e0b",
                  border: "1px solid #d97706",
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
          <div style={{ marginTop: "10px", fontSize: "12px", color: "#cbd5e1", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🛵 Assigned Rider:</span>
            <strong style={{ color: "#ffffff" }}>{riderName}</strong>
            {riderPhone && (
              <span style={{ color: "#94a3b8", fontSize: "11px", fontFamily: "monospace" }}>({riderPhone})</span>
            )}
          </div>
        )}
      </div>

      {/* ─── 2. PAYMENT & AMOUNT CARD (Square 5px with Cash vs Card) ─── */}
      <div
        style={{
          background: isDelivered ? "#f0fdf4" : "#ffffff",
          border: isDelivered ? "1.5px solid #86efac" : "1.5px solid #e2e8f0",
          borderRadius: "5px",
          padding: "16px",
          marginBottom: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: isDelivered ? "0" : "12px" }}>
          <div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: isDelivered ? "#166534" : "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                display: "block",
              }}
            >
              {isDelivered ? "✓ Total Payment Verified & Recorded" : "💰 Total Amount to Collect"}
            </span>
            <div style={{ fontSize: "28px", fontWeight: 900, color: isDelivered ? "#15803d" : "#0f172a", marginTop: "2px" }}>
              {currencySymbol} {Number(order.total).toFixed(2)}
            </div>
            {deliveryFee !== null && (
              <span style={{ fontSize: "11.5px", color: isDelivered ? "#166534" : "#64748b", fontWeight: 700 }}>
                (Includes {currencySymbol}{deliveryFee} Delivery Charge)
              </span>
            )}
          </div>

          <div style={{ textAlign: "right" }}>
            <span
              style={{
                display: "inline-block",
                padding: "5px 10px",
                borderRadius: "5px",
                background: isDelivered ? "#dcfce7" : "#fef08a",
                border: isDelivered ? "1px solid #86efac" : "1px solid #fde047",
                color: isDelivered ? "#166534" : "#713f12",
                fontSize: "12px",
                fontWeight: 800,
              }}
            >
              {isDelivered
                ? deliveredIsCard
                  ? "PAID (Card/Digital) ✓"
                  : "PAID (Cash) ✓"
                : "Payment Due on Delivery"}
            </span>
          </div>
        </div>

        {/* DELIVERED STATE: Show recorded payment details and transaction ID */}
        {isDelivered ? (
          <div
            style={{
              marginTop: "12px",
              paddingTop: "12px",
              borderTop: "1px dashed #bbf7d0",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
              <span style={{ color: "#166534", fontWeight: 700 }}>Payment Method:</span>
              <strong style={{ color: "#15803d", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                {deliveredIsCard ? (
                  <>
                    <CreditCardIcon size={14} />
                    <span>Card / Online Transfer</span>
                  </>
                ) : (
                  <>
                    <BanknoteIcon size={14} />
                    <span>Cash on Delivery</span>
                  </>
                )}
              </strong>
            </div>

            {deliveredTxn && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#ffffff",
                  padding: "6px 10px",
                  borderRadius: "5px",
                  border: "1px solid #bbf7d0",
                  fontSize: "11.5px",
                }}
              >
                <span style={{ color: "#475569", fontWeight: 700 }}>Transaction / Ref #:</span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <code style={{ fontFamily: "monospace", fontWeight: 800, color: "#0f172a", fontSize: "12px" }}>
                    {deliveredTxn}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopyTxn(deliveredTxn)}
                    style={{
                      border: "none",
                      background: "none",
                      color: "#059669",
                      cursor: "pointer",
                      padding: "2px",
                      display: "flex",
                      alignItems: "center",
                    }}
                    title="Copy Transaction ID"
                  >
                    {copiedTxn ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ACTIVE / PENDING DELIVERY: Payment Method Selector (Cash vs Card) */
          <div
            style={{
              borderTop: "1px solid #f1f5f9",
              paddingTop: "12px",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 800,
                color: "#475569",
                textTransform: "uppercase",
                marginBottom: "8px",
                letterSpacing: "0.5px",
              }}
            >
              Select Payment Method Collected:
            </label>

            {/* 2 Square 5px Toggle Buttons: Cash vs Card */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setPaymentMode("Cash")}
                style={{
                  height: "46px",
                  borderRadius: "5px",
                  border: paymentMode === "Cash" ? "2px solid #059669" : "1.5px solid #cbd5e1",
                  background: paymentMode === "Cash" ? "#ecfdf5" : "#ffffff",
                  color: paymentMode === "Cash" ? "#065f46" : "#475569",
                  fontWeight: 800,
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: paymentMode === "Cash" ? "0 2px 6px rgba(5, 150, 105, 0.15)" : "none",
                }}
              >
                <BanknoteIcon size={18} className={paymentMode === "Cash" ? "text-emerald-600" : "text-slate-400"} />
                <span>💵 Cash</span>
                {paymentMode === "Cash" && (
                  <span style={{ fontSize: "10px", background: "#059669", color: "#ffffff", padding: "1px 5px", borderRadius: "3px" }}>
                    ✓ Selected
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode("Card")}
                style={{
                  height: "46px",
                  borderRadius: "5px",
                  border: paymentMode === "Card" ? "2px solid #2563eb" : "1.5px solid #cbd5e1",
                  background: paymentMode === "Card" ? "#eff6ff" : "#ffffff",
                  color: paymentMode === "Card" ? "#1e40af" : "#475569",
                  fontWeight: 800,
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: paymentMode === "Card" ? "0 2px 6px rgba(37, 99, 235, 0.15)" : "none",
                }}
              >
                <CreditCardIcon size={18} className={paymentMode === "Card" ? "text-blue-600" : "text-slate-400"} />
                <span>💳 Card / Online</span>
                {paymentMode === "Card" && (
                  <span style={{ fontSize: "10px", background: "#2563eb", color: "#ffffff", padding: "1px 5px", borderRadius: "3px" }}>
                    ✓ Selected
                  </span>
                )}
              </button>
            </div>

            {/* If Card / Online is chosen: Transaction ID / Reference Input */}
            {paymentMode === "Card" && (
              <div
                style={{
                  marginTop: "10px",
                  background: "#f8fafc",
                  border: "1px solid #bfdbfe",
                  borderRadius: "5px",
                  padding: "10px 12px",
                }}
              >
                <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "#1e40af", marginBottom: "4px" }}>
                  Transaction ID / Reference # (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Raast ref, slip #, card auth code (e.g. TXN-98421)"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 10px",
                    borderRadius: "5px",
                    border: "1px solid #93c5fd",
                    fontSize: "12.5px",
                    color: "#0f172a",
                    boxSizing: "border-box",
                    outline: "none",
                    background: "#ffffff",
                  }}
                />
                <span style={{ display: "block", fontSize: "10px", color: "#64748b", marginTop: "4px" }}>
                  ℹ️ This reference will appear in the manager POS Live Board & shift accounts.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── 3. DELIVERY DESTINATION & NAVIGATION CARD (Square 5px) ─── */}
      <div
        style={{
          background: "#ffffff",
          border: "1.5px solid #e2e8f0",
          borderRadius: "5px",
          padding: "16px",
          marginBottom: "10px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
          <MapPin size={16} className="text-emerald-600" />
          <span style={{ fontSize: "11px", fontWeight: 800, color: "#065f46", textTransform: "uppercase" }}>
            Delivery Destination
          </span>
        </div>

        <p style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 800, color: "#0f172a", lineHeight: 1.45 }}>
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
              height: "42px",
              borderRadius: "5px",
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 800,
              textDecoration: "none",
              boxShadow: "0 2px 6px rgba(2, 132, 199, 0.25)",
              boxSizing: "border-box",
            }}
          >
            <NavigationIcon size={16} />
            <span>Open Google Maps Turn-by-Turn Navigation</span>
          </a>
        )}
      </div>

      {/* ─── 4. CUSTOMER CONTACT CARD (Square 5px) ─── */}
      <div
        style={{
          background: "#ffffff",
          border: "1.5px solid #e2e8f0",
          borderRadius: "5px",
          padding: "16px",
          marginBottom: "10px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
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
                height: "40px",
                borderRadius: "5px",
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
                height: "40px",
                borderRadius: "5px",
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

      {/* ─── 5. FOOD PACKAGE ITEMS CHECKLIST (Square 5px) ─── */}
      <div
        style={{
          background: "#ffffff",
          border: "1.5px solid #e2e8f0",
          borderRadius: "5px",
          padding: "14px 16px",
          marginBottom: "14px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
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
        )}
      </div>

      {/* ─── 6. ERROR MESSAGE ALERT (Square 5px) ─── */}
      {errorMsg && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            fontSize: "12px",
            padding: "10px 14px",
            borderRadius: "5px",
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

      {/* ─── 7. PRIMARY ACTION BUTTON BAR (Square 5px) ─── */}
      {isDelivered ? (
        <div
          style={{
            background: "#ecfdf5",
            border: "2px solid #10b981",
            borderRadius: "5px",
            padding: "16px",
            textAlign: "center",
          }}
        >
          <CheckCircle2 size={36} className="text-emerald-600" style={{ margin: "0 auto 8px" }} />
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 900, color: "#065f46" }}>
            Delivery Completed & Verified! 🎉
          </h3>
          <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#047857" }}>
            Order #{order.order_number} marked delivered. {deliveredIsCard ? "Card / Digital payment" : "Cash collection"}{" "}
            recorded in the live system.
          </p>
          {deliveredTxn && (
            <div style={{ display: "inline-block", background: "#ffffff", padding: "3px 8px", borderRadius: "3px", border: "1px solid #a7f3d0", fontSize: "11px", color: "#065f46", fontWeight: 700 }}>
              Ref: {deliveredTxn}
            </div>
          )}
        </div>
      ) : isCancelled ? (
        <div
          style={{
            background: "#fef2f2",
            border: "2px solid #ef4444",
            borderRadius: "5px",
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
                borderRadius: "5px",
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
              borderRadius: "5px",
              background: paymentMode === "Card"
                ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
                : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: 900,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: paymentMode === "Card"
                ? "0 4px 12px rgba(37, 99, 235, 0.35)"
                : "0 4px 12px rgba(16, 185, 129, 0.35)",
            }}
            className="hover:brightness-110 active:scale-[0.99] transition-all"
          >
            <CheckCircle2 size={20} />
            <span>
              {paymentMode === "Card"
                ? "✓ Confirm Order Delivered & Card Payment Verified"
                : "✓ Confirm Order Delivered & Cash Collected"}
            </span>
          </button>
        </div>
      )}

      {/* ─── 8. CONFIRMATION MODAL DRAWER (Square 5px) ─── */}
      {showConfirmModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.7)",
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
              borderTopLeftRadius: "5px",
              borderTopRightRadius: "5px",
              border: "1px solid #cbd5e1",
              borderBottom: "none",
              padding: "20px 16px 28px",
              boxShadow: "0 -10px 25px -5px rgba(0,0,0,0.15)",
              animation: "slideUp 0.2s ease-out",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "5px",
                  background: paymentMode === "Card" ? "#eff6ff" : "#dcfce7",
                  color: paymentMode === "Card" ? "#2563eb" : "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 10px",
                  border: `1px solid ${paymentMode === "Card" ? "#bfdbfe" : "#86efac"}`,
                }}
              >
                {paymentMode === "Card" ? <CreditCardIcon size={26} /> : <CheckCircle2 size={26} />}
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 900, color: "#0f172a" }}>
                Confirm Delivery Completion
              </h3>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                Confirm order <strong>#{order.order_number}</strong> handed to{" "}
                <strong>{order.customer_name || "the customer"}</strong> and{" "}
                <strong style={{ color: paymentMode === "Card" ? "#2563eb" : "#059669" }}>
                  {paymentMode === "Card" ? "💳 Card/Online Payment" : "💵 Cash"}
                </strong>{" "}
                of{" "}
                <strong style={{ color: "#0f172a" }}>
                  {currencySymbol} {Number(order.total).toFixed(2)}
                </strong>{" "}
                verified.
              </p>
            </div>

            {/* Payment Summary Box in Modal */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "5px",
                padding: "10px 12px",
                marginBottom: "14px",
                fontSize: "12px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: transactionId && paymentMode === "Card" ? "4px" : "0" }}>
                <span style={{ color: "#64748b", fontWeight: 700 }}>Payment Method:</span>
                <strong style={{ color: paymentMode === "Card" ? "#1e40af" : "#166534" }}>
                  {paymentMode === "Card" ? "💳 Card / Online Transfer" : "💵 Cash on Delivery"}
                </strong>
              </div>
              {paymentMode === "Card" && transactionId && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b", fontWeight: 700 }}>Transaction ID:</span>
                  <code style={{ fontFamily: "monospace", fontWeight: 800, color: "#0f172a" }}>{transactionId}</code>
                </div>
              )}
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
                  borderRadius: "5px",
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
                  borderRadius: "5px",
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
                  borderRadius: "5px",
                  background: paymentMode === "Card" ? "#2563eb" : "#10b981",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 900,
                  cursor: isPending ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: paymentMode === "Card"
                    ? "0 2px 8px rgba(37, 99, 235, 0.35)"
                    : "0 2px 8px rgba(16, 185, 129, 0.35)",
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
