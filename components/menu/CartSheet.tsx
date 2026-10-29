"use client";

/**
 * CartSheet — professional square slide-in cart drawer.
 * Integrated with Table QR Dine-In & Counter Takeaway Token system!
 * Direct real order placement to Supabase public.orders.
 */
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useCart } from "./CartContext";
import { placeCustomerOrder, submitCustomerOrderReview } from "@/lib/order-actions";
import {
  validatePromoCode,
  lookupCustomerLoyalty,
  type PromoValidationResult,
  type CustomerLoyaltyInfo,
} from "@/lib/promo-actions";
import type { Product } from "@/types/menu";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface CartSheetProps {
  open: boolean;
  onClose: () => void;
  tableNumber?: string;
  setTableNumber?: (val: string) => void;
  orderType?: "dine_in" | "takeaway" | "delivery";
  setOrderType?: (val: "dine_in" | "takeaway" | "delivery") => void;
  isDedicatedTableRoute?: boolean;
  shopId?: number | null;
  shopName?: string;
  googleReviewUrl?: string;
  menuProducts?: Product[];
}

export default function CartSheet({
  open,
  onClose,
  tableNumber: propTableNumber = "",
  setTableNumber: propSetTableNumber,
  orderType: propOrderType = "dine_in",
  setOrderType: propSetOrderType,
  isDedicatedTableRoute = false,
  shopId,
  shopName,
  googleReviewUrl,
  menuProducts,
}: CartSheetProps) {
  const {
    items,
    totalItems,
    totalPrice,
    setQty,
    removeItem,
    clearCart,
    formatPrice,
    getItemKey,
    getUnitPrice,
    addItem,
  } = useCart();

  // Mode: "cart" | "checkout" | "confirmed"
  const [viewMode, setViewMode] = useState<"cart" | "checkout" | "confirmed">("cart");

  // Local state initialized with props
  const [selectedOrderType, setSelectedOrderType] = useState<"dine_in" | "takeaway" | "delivery">(
    propTableNumber ? "dine_in" : propOrderType
  );
  const [currentTable, setCurrentTable] = useState(propTableNumber);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryFee] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Feature 3: Promo Coupon Codes
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoValidationResult | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMsg, setPromoMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Feature 5: Customer Loyalty Points
  const [loyaltyInfo, setLoyaltyInfo] = useState<CustomerLoyaltyInfo | null>(null);
  const [redeemLoyalty, setRedeemLoyalty] = useState(false);

  // Confirmed order state
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string | null>(null);
  const [confirmedType, setConfirmedType] = useState<"dine_in" | "takeaway" | "delivery">("dine_in");
  const [confirmedTable, setConfirmedTable] = useState<string | null>(null);
  const [confirmedToken, setConfirmedToken] = useState<string | null>(null);
  const [confirmedAddress, setConfirmedAddress] = useState<string | null>(null);

  // Google Review & Star Rating states
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);
  const [reviewSubmitting, setReviewSubmitting] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  // Smart Cart Upselling (Dips, Cold Drinks, Sides)
  const [upsellCategory, setUpsellCategory] = useState<"all" | "dips" | "drinks" | "sides">("all");
  const [fallbackUpsellProducts, setFallbackUpsellProducts] = useState<Product[]>([]);
  const [justAddedId, setJustAddedId] = useState<string | number | null>(null);

  // If menuProducts wasn't passed directly via props, load available items dynamically
  useEffect(() => {
    if (menuProducts && menuProducts.length > 0) return;
    async function fetchDynamicUpsell() {
      try {
        const { createClient } = await import("@/utils/supabase/client");
        const supabase = createClient();
        let query = supabase
          .from("products")
          .select("id, name, price, image_url, category_id, is_available, is_active")
          .eq("is_available", true)
          .eq("is_active", true);

        if (shopId) {
          query = query.eq("shop_id", shopId);
        }

        const { data } = await query.limit(50);
        if (data && data.length > 0) {
          setFallbackUpsellProducts(data as Product[]);
        }
      } catch {}
    }
    fetchDynamicUpsell();
  }, [menuProducts, shopId]);

  const pool = (menuProducts && menuProducts.length > 0) ? menuProducts : fallbackUpsellProducts;

  const upsellItems = useMemo(() => {
    if (!pool || pool.length === 0) return [];

    return pool
      .filter((p) => {
        if (p.is_available === false || p.is_active === false) return false;
        const name = (p.name || "").toLowerCase();

        const isDip =
          name.includes("sauce") ||
          name.includes("dip") ||
          name.includes("mayo") ||
          name.includes("cheese special");

        const isDrink =
          name.includes("drink") ||
          name.includes("bottle") ||
          name.includes("water") ||
          name.includes("coke") ||
          name.includes("pepsi") ||
          name.includes("sprite") ||
          name.includes("fanta") ||
          name.includes("dew") ||
          name.includes("sting") ||
          name.includes("litr") ||
          name.includes("ltr") ||
          name.includes("500ml");

        const isSide =
          name.includes("fries") ||
          name.includes("wing") ||
          name.includes("nugget") ||
          name.includes("bread") ||
          name.includes("stick");

        if (upsellCategory === "dips") return isDip;
        if (upsellCategory === "drinks") return isDrink;
        if (upsellCategory === "sides") return isSide;

        return isDip || isDrink || isSide;
      })
      .slice(0, 10);
  }, [pool, upsellCategory]);

  // Sync prop changes
  useEffect(() => {
    if (propTableNumber) {
      setCurrentTable(propTableNumber);
      setSelectedOrderType("dine_in");
    }
  }, [propTableNumber]);

  // Trap Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const handleStartCheckout = () => {
    setErrorMessage(null);
    setViewMode("checkout");
  };

  const handleOrderTypeChange = (type: "dine_in" | "takeaway" | "delivery") => {
    setSelectedOrderType(type);
    if (propSetOrderType) propSetOrderType(type);
  };

  const handleTableChange = (val: string) => {
    setCurrentTable(val);
    if (propSetTableNumber) propSetTableNumber(val);
  };

  // Lookup loyalty points when phone number has 10+ digits
  useEffect(() => {
    const digits = customerPhone.replace(/\D/g, "");
    if (digits.length >= 10) {
      lookupCustomerLoyalty(customerPhone, shopId)
        .then((info) => {
          setLoyaltyInfo(info);
          if (!info || info.pointsBalance <= 0) setRedeemLoyalty(false);
          if (info) {
            if (
              info.customerName &&
              info.customerName !== "Valued Customer" &&
              info.customerName !== "Walk-in Customer"
            ) {
              setCustomerName((prev) => (prev.trim() ? prev : info.customerName!));
            }
            if (info.deliveryAddress) {
              setDeliveryAddress((prev) => (prev.trim() ? prev : info.deliveryAddress!));
            }
          }
        })
        .catch(() => {});
    } else {
      setLoyaltyInfo(null);
      setRedeemLoyalty(false);
    }
  }, [customerPhone, shopId]);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoMsg(null);
    try {
      const res = await validatePromoCode(promoInput, totalPrice, shopId);
      if (res.valid) {
        setAppliedPromo(res);
        setPromoMsg({ type: "success", text: res.message });
      } else {
        setPromoMsg({ type: "error", text: res.message });
      }
    } catch {
      setPromoMsg({ type: "error", text: "Failed to validate promo code." });
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoMsg(null);
  };

  const promoDiscount = appliedPromo?.discountAmount || 0;
  const maxLoyaltyAllowed = Math.max(0, totalPrice - promoDiscount);
  const loyaltyDiscount = redeemLoyalty && loyaltyInfo ? Math.min(maxLoyaltyAllowed, loyaltyInfo.pointsBalance) : 0;
  const totalDiscount = promoDiscount + loyaltyDiscount;
  const finalPayable = Math.max(0, totalPrice - totalDiscount) + (selectedOrderType === "delivery" ? deliveryFee : 0);
  const pointsToEarn = Math.max(0, Math.floor(finalPayable / 50));

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }

    if (!customerPhone.trim()) {
      setErrorMessage("Please enter your WhatsApp / phone number for order updates.");
      return;
    }

    if (selectedOrderType === "dine_in" && !currentTable.trim()) {
      setErrorMessage("Please enter or select your Table Number.");
      return;
    }

    if (selectedOrderType === "delivery") {
      if (!deliveryAddress.trim()) {
        setErrorMessage("Please enter your complete delivery address.");
        return;
      }
    }

    if (items.length === 0) {
      setErrorMessage("Your cart is empty.");
      return;
    }

    setSubmitting(true);

    const orderItems = items.map((i) => ({
      id: i.product.id,
      name: i.product.name,
      price: getUnitPrice(i),
      qty: i.quantity,
      selected_variation: i.selectedVariation || null,
      selected_toppings: i.selectedToppings || [],
    }));

    const result = await placeCustomerOrder({
      order_type: selectedOrderType,
      table_number: selectedOrderType === "dine_in" ? currentTable.trim() : undefined,
      customer_name: customerName,
      customer_phone: customerPhone,
      delivery_address: selectedOrderType === "delivery" ? deliveryAddress.trim() : undefined,
      delivery_fee: selectedOrderType === "delivery" ? deliveryFee : 0,
      discount_amount: totalDiscount,
      promo_code: appliedPromo?.code || null,
      points_redeemed: loyaltyDiscount,
      notes: orderNotes,
      items: orderItems,
      total: finalPayable,
      shop_id: shopId || undefined,
    });

    setSubmitting(false);

    if (result.success && result.orderNumber) {
      setPlacedOrderNumber(result.orderNumber);
      setConfirmedType(result.orderType || selectedOrderType);
      setConfirmedTable(result.tableNumber || currentTable);
      setConfirmedToken(result.tokenNumber || null);
      setConfirmedAddress(result.deliveryAddress || deliveryAddress);
      setViewMode("confirmed");
      clearCart();
    } else {
      setErrorMessage(result.error || "Failed to place order. Please try again.");
    }
  };

  const handlePostGoogleReview = async () => {
    if (reviewSubmitting) return;
    setReviewSubmitting(true);

    const effectiveRating = reviewRating || 5;
    const cleanComment = reviewComment.trim();

    // 1. If text entered, copy to clipboard for easy 1-tap pasting on Google
    if (cleanComment) {
      try {
        await navigator.clipboard.writeText(cleanComment);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 5000);
      } catch {
        // clipboard fallback
      }
    }

    // 2. Save review to order in backend
    if (placedOrderNumber) {
      try {
        await submitCustomerOrderReview({
          orderNumber: placedOrderNumber,
          rating: effectiveRating,
          comment: cleanComment || undefined,
        });
      } catch (err) {
        console.warn("[review save error]", err);
      }
    }

    // 3. If rating is 4 or 5 stars, open Google Review page
    if (effectiveRating >= 4) {
      const effectiveUrl =
        googleReviewUrl?.trim() ||
        `https://www.google.com/search?q=${encodeURIComponent((shopName || "Restaurant") + " reviews")}`;
      window.open(effectiveUrl, "_blank", "noopener,noreferrer");
    }

    setReviewSubmitted(true);
    setReviewSubmitting(false);
  };

  const handleCloseAndReset = () => {
    onClose();
    setTimeout(() => {
      setViewMode("cart");
      setPlacedOrderNumber(null);
      setErrorMessage(null);
      setReviewRating(5);
      setHoverRating(null);
      setReviewComment("");
      setReviewSubmitted(false);
      setReviewSubmitting(false);
      setCopiedToast(false);
    }, 300);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="overlay-backdrop"
        onClick={handleCloseAndReset}
        aria-hidden="true"
      />

      {/* Slide-in Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 60,
          width: "min(460px, 100vw)",
          background: "#ffffff",
          borderLeft: "1px solid #fed7aa",
          boxShadow: "-8px 0 30px rgba(15, 23, 42, 0.15)",
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Drawer Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #fed7aa",
            background: "#fff7ed",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 4,
                background: "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 6px rgba(220, 38, 38, 0.25)",
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 16,
                  margin: 0,
                  color: "#0f172a",
                  lineHeight: 1.2,
                }}
              >
                {viewMode === "confirmed"
                  ? "Order Placed"
                  : viewMode === "checkout"
                  ? "Complete Your Order"
                  : "Your Order Cart"}
              </h2>
              <p style={{ fontSize: 11, color: "#9a3412", margin: 0, fontWeight: 600 }}>
                {viewMode === "confirmed"
                  ? "Sent straight to the kitchen"
                  : viewMode === "checkout"
                  ? selectedOrderType === "dine_in"
                    ? `Dine-In ${currentTable ? `(Table #${currentTable})` : ""}`
                    : "Takeaway / Counter Pickup"
                  : `${totalItems} item${totalItems !== 1 ? "s" : ""} in cart`}
              </p>
            </div>
          </div>

          <button
            id="close-cart-btn"
            onClick={handleCloseAndReset}
            aria-label="Close cart"
            style={{
              width: 30,
              height: 30,
              borderRadius: 4,
              border: "1px solid #fed7aa",
              background: "#ffffff",
              color: "#c2410c",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fee2e2";
              e.currentTarget.style.color = "#dc2626";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.color = "#c2410c";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ─── VIEW 1: CART ITEMS ────────────────────────────────────── */}
        {viewMode === "cart" && (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
              {/* Table / Order Type Summary Chip */}
              {currentTable && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: 4,
                    background: "#fef3c7",
                    border: "1px solid #fde68a",
                    marginBottom: 14,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13 }}>🍽️</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#92400e" }}>
                      Ordering for Table #{currentTable}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#b45309" }}>
                    Dine-In
                  </span>
                </div>
              )}

              {items.length === 0 ? (
                <div
                  role="status"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "60px 16px",
                    textAlign: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 4,
                      background: "#fff7ed",
                      border: "1px solid #fed7aa",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ea580c",
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                    Your cart is empty
                  </h3>
                  <p style={{ fontSize: 13, color: "#64748b", margin: 0, maxWidth: 260, lineHeight: 1.5 }}>
                    Select delicious pizzas, sides, and drinks from our menu to begin your order.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {items.map((item) => {
                    const itemKey = getItemKey(item);
                    const unitPrice = getUnitPrice(item);
                    return (
                      <div
                        key={itemKey}
                        style={{
                          display: "flex",
                          gap: 12,
                          padding: 10,
                          borderRadius: 4,
                          border: "1px solid #ffedd5",
                          background: "#ffffff",
                          alignItems: "center",
                        }}
                      >
                        {/* Square Thumbnail */}
                        <div
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 3,
                            overflow: "hidden",
                            background: "#fff7ed",
                            flexShrink: 0,
                            border: "1px solid #fed7aa",
                          }}
                        >
                          {item.product.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#f59e0b",
                              }}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="12 2 22 20 2 20 12 2" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Info & Quantity */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                            <div style={{ minWidth: 0 }}>
                              <h4
                                style={{
                                  fontFamily: "var(--font-display)",
                                  fontWeight: 700,
                                  fontSize: 14,
                                  margin: "0 0 2px",
                                  color: "#0f172a",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {item.product.name}
                              </h4>
                              {item.selectedVariation && (
                                <div style={{ marginBottom: 2 }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, background: "#fee2e2", color: "#dc2626", padding: "1px 6px", borderRadius: 3 }}>
                                    {item.selectedVariation.name}
                                  </span>
                                </div>
                              )}
                              {item.selectedToppings && item.selectedToppings.length > 0 && (
                                <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.3 }}>
                                  + {item.selectedToppings.map((t) => t.name).join(", ")}
                                </div>
                              )}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 900, color: "#dc2626", whiteSpace: "nowrap" }}>
                              {formatPrice(unitPrice * item.quantity)}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                            <span style={{ fontSize: 11, color: "#9a3412", fontWeight: 600 }}>
                              {formatPrice(unitPrice)} each
                            </span>

                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <button
                                type="button"
                                className="qty-btn"
                                style={{ width: 24, height: 24, fontSize: 14 }}
                                onClick={() => setQty(itemKey, item.quantity - 1)}
                                aria-label={`Decrease ${item.product.name} quantity`}
                              >
                                −
                              </button>
                              <span
                                style={{ minWidth: 20, textAlign: "center", fontWeight: 800, fontSize: 13, color: "#0f172a" }}
                              >
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                className="qty-btn"
                                style={{ width: 24, height: 24, fontSize: 14 }}
                                onClick={() => setQty(itemKey, item.quantity + 1)}
                                aria-label={`Increase ${item.product.name} quantity`}
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => removeItem(itemKey)}
                                aria-label={`Remove ${item.product.name}`}
                                style={{
                                  marginLeft: 4,
                                  width: 24,
                                  height: 24,
                                  borderRadius: 3,
                                  border: "1px solid transparent",
                                  background: "transparent",
                                  color: "#9a3412",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = "#dc2626";
                                  e.currentTarget.style.background = "#fee2e2";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = "#9a3412";
                                  e.currentTarget.style.background = "transparent";
                                }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ─── SMART UPSELLING: Dips, Cold Drinks & Sides ─────────── */}
              {items.length > 0 && upsellItems.length > 0 && (
                <div
                  style={{
                    marginTop: 18,
                    marginBottom: 8,
                    padding: "14px 14px 12px",
                    borderRadius: 8,
                    background: "linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)",
                    border: "1px solid #fde68a",
                    boxShadow: "0 2px 10px rgba(245, 158, 11, 0.08)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 10,
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 16 }}>🔥</span>
                      <div>
                        <h4
                          style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 800,
                            fontSize: 13,
                            margin: 0,
                            color: "#92400e",
                            lineHeight: 1.2,
                          }}
                        >
                          Complete Your Meal
                        </h4>
                        <p style={{ fontSize: 11, color: "#b45309", margin: 0, fontWeight: 500 }}>
                          Popular dips, cold drinks & sides
                        </p>
                      </div>
                    </div>

                    {/* Filter Pills */}
                    <div style={{ display: "flex", gap: 4 }}>
                      {[
                        { id: "all", label: "All" },
                        { id: "dips", label: "🥫 Dips" },
                        { id: "drinks", label: "🥤 Drinks" },
                        { id: "sides", label: "🍟 Sides" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setUpsellCategory(tab.id as any)}
                          style={{
                            padding: "3px 8px",
                            borderRadius: 20,
                            fontSize: 10,
                            fontWeight: 700,
                            border: upsellCategory === tab.id ? "1px solid #d97706" : "1px solid #fed7aa",
                            background: upsellCategory === tab.id ? "#f59e0b" : "#ffffff",
                            color: upsellCategory === tab.id ? "#ffffff" : "#9a3412",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Horizontal Scrollable Upsell Cards */}
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      overflowX: "auto",
                      paddingBottom: 6,
                      paddingTop: 2,
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    {upsellItems.map((product) => {
                      const inCartItem = items.find((i) => String(i.product.id) === String(product.id));
                      const inCartQty = inCartItem?.quantity || 0;
                      const wasJustAdded = justAddedId === product.id;

                      return (
                        <div
                          key={product.id}
                          style={{
                            flex: "0 0 135px",
                            minWidth: 135,
                            maxWidth: 135,
                            borderRadius: 6,
                            background: "#ffffff",
                            border: inCartQty > 0 ? "1px solid #86efac" : "1px solid #fed7aa",
                            padding: "8px 8px 10px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                            position: "relative",
                            transition: "transform 0.15s ease, border-color 0.15s ease",
                            transform: wasJustAdded ? "scale(1.03)" : "scale(1)",
                          }}
                        >
                          {/* Image Thumbnail */}
                          <div
                            style={{
                              width: "100%",
                              height: 68,
                              borderRadius: 4,
                              overflow: "hidden",
                              marginBottom: 6,
                              background: "#f8fafc",
                              position: "relative",
                            }}
                          >
                            <OptimizedImage
                              src={product.image_url}
                              alt={product.name}
                              productName={product.name}
                              aspectRatio="1/1"
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                            {inCartQty > 0 && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: 3,
                                  right: 3,
                                  background: "#16a34a",
                                  color: "#ffffff",
                                  fontSize: 9,
                                  fontWeight: 900,
                                  padding: "1px 5px",
                                  borderRadius: 10,
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                                }}
                              >
                                ✓ {inCartQty}
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div>
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#0f172a",
                                lineHeight: 1.25,
                                height: 28,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                marginBottom: 4,
                              }}
                              title={product.name}
                            >
                              {product.name}
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 900, color: "#dc2626", marginBottom: 6 }}>
                              {formatPrice(product.price || 0)}
                            </div>
                          </div>

                          {/* Add to Cart Button */}
                          <button
                            type="button"
                            onClick={() => {
                              addItem(product);
                              setJustAddedId(product.id);
                              setTimeout(() => setJustAddedId(null), 1000);
                            }}
                            style={{
                              width: "100%",
                              padding: "5px 0",
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 800,
                              border: "none",
                              background: inCartQty > 0 ? "#16a34a" : "#dc2626",
                              color: "#ffffff",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 4,
                              boxShadow: inCartQty > 0 ? "0 1px 4px rgba(22,163,74,0.25)" : "0 1px 4px rgba(220,38,38,0.25)",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.filter = "brightness(1.1)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.filter = "none";
                            }}
                          >
                            {inCartQty > 0 ? `+ Add More (${inCartQty})` : `+ Add`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {items.length > 0 && (
              <div
                style={{
                  borderTop: "1px solid #fed7aa",
                  padding: "16px 20px 20px",
                  background: "#fff7ed",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#7c2d12" }}>Order Total</span>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 900,
                      fontSize: 22,
                      color: "#dc2626",
                    }}
                  >
                    {formatPrice(totalPrice)}
                  </span>
                </div>

                <button
                  type="button"
                  id="proceed-to-checkout-btn"
                  className="btn-primary"
                  onClick={handleStartCheckout}
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: 14,
                    fontWeight: 800,
                    borderRadius: 4,
                    background: "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
                    borderColor: "#b91c1c",
                    boxShadow: "0 2px 8px rgba(220, 38, 38, 0.25)",
                  }}
                >
                  <span>
                    Proceed ({selectedOrderType === "dine_in" && currentTable ? `Table #${currentTable}` : selectedOrderType === "dine_in" ? "Dine-In" : selectedOrderType === "delivery" ? "Home Delivery" : "Takeaway"})
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}

        {/* ─── VIEW 2: CHECKOUT FORM WITH TABLE / TOKEN SELECTION ───── */}
        {viewMode === "checkout" && (
          <form
            onSubmit={handlePlaceOrder}
            style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
          >
            <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
              <button
                type="button"
                onClick={() => setViewMode("cart")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  border: "none",
                  background: "transparent",
                  color: "#c2410c",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 0,
                  marginBottom: 16,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Back to Cart Items
              </button>

              {errorMessage && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 4,
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    fontSize: 13,
                    marginBottom: 16,
                    fontWeight: 600,
                  }}
                >
                  {errorMessage}
                </div>
              )}

              {/* Order Type Toggle: Dine-In vs Takeaway */}
              {isDedicatedTableRoute ? (
                <div
                  style={{
                    marginBottom: 16,
                    padding: "12px 14px",
                    borderRadius: 4,
                    background: "linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)",
                    border: "1.5px solid #f59e0b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22 }}>🍽️</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#7c2d12" }}>
                        Dine-In &bull; Table #{currentTable || propTableNumber}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "#9a3412", fontWeight: 600 }}>
                        Dedicated table link. Food will be served directly to your table.
                      </p>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      background: "#dc2626",
                      color: "#ffffff",
                      padding: "3px 8px",
                      borderRadius: 3,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      flexShrink: 0,
                    }}
                  >
                    Table Locked
                  </span>
                </div>
              ) : (
                <div style={{ marginBottom: 18 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#7c2d12",
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Select Order Service <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => handleOrderTypeChange("dine_in")}
                      style={{
                        padding: "9px 6px",
                        borderRadius: 4,
                        border: selectedOrderType === "dine_in" ? "2px solid #dc2626" : "1px solid #fed7aa",
                        background: selectedOrderType === "dine_in" ? "#fef2f2" : "#ffffff",
                        color: selectedOrderType === "dine_in" ? "#dc2626" : "#7c2d12",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 800,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span style={{ fontSize: 16 }}>🍽️</span>
                      <span>Dine-In</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOrderTypeChange("takeaway")}
                      style={{
                        padding: "9px 6px",
                        borderRadius: 4,
                        border: selectedOrderType === "takeaway" ? "2px solid #ea580c" : "1px solid #fed7aa",
                        background: selectedOrderType === "takeaway" ? "#fff7ed" : "#ffffff",
                        color: selectedOrderType === "takeaway" ? "#ea580c" : "#7c2d12",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 800,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span style={{ fontSize: 16 }}>🛍️</span>
                      <span>Takeaway</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOrderTypeChange("delivery")}
                      style={{
                        padding: "9px 6px",
                        borderRadius: 4,
                        border: selectedOrderType === "delivery" ? "2px solid #059669" : "1px solid #fed7aa",
                        background: selectedOrderType === "delivery" ? "#ecfdf5" : "#ffffff",
                        color: selectedOrderType === "delivery" ? "#059669" : "#7c2d12",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 800,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span style={{ fontSize: 16 }}>🛵</span>
                      <span>Delivery</span>
                    </button>
                  </div>
                </div>
              )}

              {/* DELIVERY ADDRESS & DISPATCH NOTICE */}
              {selectedOrderType === "delivery" && (
                <div
                  style={{
                    padding: "12px",
                    borderRadius: 4,
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 16 }}>🛵</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#065f46", textTransform: "uppercase" }}>
                        Home Delivery Dispatch
                      </span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: deliveryFee > 0 ? "#059669" : "#16a34a" }}>
                      {deliveryFee > 0 ? `Fee: ${formatPrice(deliveryFee)}` : "Free Delivery"}
                    </span>
                  </div>

                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#065f46",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Delivery Address <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="House/Apartment #, Street, Sector / Area, Landmark..."
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 4,
                      border: "1px solid #10b981",
                      fontSize: 13,
                      color: "#0f172a",
                      background: "#ffffff",
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                  <p style={{ fontSize: 10, color: "#047857", margin: "4px 0 0", fontWeight: 600 }}>
                    Our dispatch rider will deliver hot &amp; fresh to your doorstep.
                  </p>
                </div>
              )}

              {/* DINE-IN TABLE SELECTION (Only when not on dedicated table route) */}
              {!isDedicatedTableRoute && selectedOrderType === "dine_in" && (
                <div
                  style={{
                    padding: "12px",
                    borderRadius: 4,
                    background: "#fef3c7",
                    border: "1px solid #fde68a",
                    marginBottom: 16,
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#92400e",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Table Number <span style={{ color: "#dc2626" }}>*</span>
                  </label>

                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 4 or Table 4"
                      value={currentTable}
                      onChange={(e) => handleTableChange(e.target.value)}
                      style={{
                        flex: 1,
                        height: 38,
                        padding: "0 10px",
                        borderRadius: 4,
                        border: "1px solid #f59e0b",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#0f172a",
                        background: "#ffffff",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Quick table selector buttons */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#b45309", textTransform: "uppercase" }}>
                      Quick Select:
                    </span>
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleTableChange(num)}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 3,
                          border: currentTable === num ? "1.5px solid #b45309" : "1px solid #fde68a",
                          background: currentTable === num ? "#f59e0b" : "#ffffff",
                          color: currentTable === num ? "#ffffff" : "#92400e",
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAKEAWAY TOKEN NOTICE */}
              {selectedOrderType === "takeaway" && (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 4,
                    background: "#fff7ed",
                    border: "1px solid #fed7aa",
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 18 }}>🎟️</span>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 800, color: "#c2410c", margin: "0 0 2px" }}>
                      Counter Queue Token
                    </p>
                    <p style={{ fontSize: 11, color: "#9a3412", margin: 0 }}>
                      A digital token number will be assigned to your order for pickup.
                    </p>
                  </div>
                </div>
              )}

              {/* Customer Name */}
              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#7c2d12",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                  }}
                >
                  Your Name <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Usman Ali"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 4,
                    border: "1px solid #fed7aa",
                    fontSize: 13,
                    color: "#0f172a",
                    background: "#ffffff",
                    outline: "none",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#ea580c")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#fed7aa")}
                />
              </div>

              {/* Customer Phone */}
              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#7c2d12",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                  }}
                >
                  Mobile / WhatsApp Number <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0300 1234567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 4,
                    border: "1px solid #fed7aa",
                    fontSize: 13,
                    color: "#0f172a",
                    background: "#ffffff",
                    outline: "none",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#ea580c")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#fed7aa")}
                />
                <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#9a3412", fontWeight: 600 }}>
                  💬 We will send your instant order confirmation to this WhatsApp number.
                </p>
              </div>

              {/* Order Notes */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#7c2d12",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                  }}
                >
                  Special Kitchen Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Extra spicy, no oregano, extra napkins..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 4,
                    border: "1px solid #fed7aa",
                    fontSize: 13,
                    color: "#0f172a",
                    background: "#ffffff",
                    outline: "none",
                    resize: "vertical",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#ea580c")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#fed7aa")}
                />
              </div>

              {/* Feature 3: Promo Coupon Codes */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 6,
                  background: "#fffbeb",
                  border: "1.5px dashed #f59e0b",
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 16 }}>🎟️</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Promo / Coupon Code
                    </span>
                  </div>
                  {appliedPromo && (
                    <span style={{ fontSize: 10, fontWeight: 800, background: "#16a34a", color: "#ffffff", padding: "2px 7px", borderRadius: 3 }}>
                      APPLIED: -{formatPrice(appliedPromo.discountAmount)}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  <input
                    type="text"
                    placeholder="Enter promo code (e.g. WELCOME20)"
                    value={promoInput}
                    disabled={appliedPromo !== null || promoLoading}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (!appliedPromo) handleApplyPromo();
                      }
                    }}
                    style={{
                      flex: 1,
                      height: 36,
                      padding: "0 10px",
                      borderRadius: 4,
                      border: "1px solid #fde68a",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#0f172a",
                      background: appliedPromo ? "#f1f5f9" : "#ffffff",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      outline: "none",
                    }}
                  />
                  {appliedPromo ? (
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      style={{
                        padding: "0 12px",
                        height: 36,
                        borderRadius: 4,
                        border: "1px solid #dc2626",
                        background: "#fef2f2",
                        color: "#dc2626",
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={promoLoading || !promoInput.trim()}
                      style={{
                        padding: "0 14px",
                        height: 36,
                        borderRadius: 4,
                        border: "none",
                        background: "#d97706",
                        color: "#ffffff",
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: promoLoading || !promoInput.trim() ? "not-allowed" : "pointer",
                        opacity: promoLoading || !promoInput.trim() ? 0.6 : 1,
                      }}
                    >
                      {promoLoading ? "Checking..." : "Apply"}
                    </button>
                  )}
                </div>

                {/* Validation Message */}
                {promoMsg && (
                  <p
                    style={{
                      margin: "0 0 8px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: promoMsg.type === "success" ? "#15803d" : "#b91c1c",
                    }}
                  >
                    {promoMsg.type === "success" ? "✓ " : "✕ "}
                    {promoMsg.text}
                  </p>
                )}


              </div>

              {/* Feature 5: Customer Loyalty Points Banner */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 6,
                  background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                  border: "1px solid #fcd34d",
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 16 }}>🪙</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#78350f", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Customer Loyalty Rewards
                    </span>
                  </div>
                  {loyaltyInfo && (
                    <span style={{ fontSize: 11, fontWeight: 900, color: "#b45309" }}>
                      {loyaltyInfo.pointsBalance} pts (Rs. {loyaltyInfo.pointsBalance})
                    </span>
                  )}
                </div>

                {loyaltyInfo && loyaltyInfo.pointsBalance > 0 ? (
                  <div>
                    <p style={{ margin: "2px 0 8px", fontSize: 11, color: "#92400e" }}>
                      You have <strong>{loyaltyInfo.pointsBalance} points</strong> ready to use. 1 point = Rs. 1 cash discount!
                    </p>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#78350f",
                        cursor: "pointer",
                        background: "#ffffff",
                        padding: "8px 10px",
                        borderRadius: 4,
                        border: "1px solid #fde68a",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={redeemLoyalty}
                        onChange={(e) => setRedeemLoyalty(e.target.checked)}
                        style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#d97706" }}
                      />
                      <span>
                        Redeem {loyaltyDiscount} points on this order{" "}
                        <strong style={{ color: "#16a34a" }}>(-{formatPrice(loyaltyDiscount)})</strong>
                      </span>
                    </label>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 11, color: "#92400e" }}>
                    🎁 <strong>VIP Member:</strong> You will earn{" "}
                    <strong style={{ color: "#d97706" }}>+{pointsToEarn} loyalty points</strong> (1 pt per Rs. 50 spent) on this order!
                  </p>
                )}
              </div>

              {/* Mini Order Summary */}
              <div
                style={{
                  padding: "12px",
                  borderRadius: 4,
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#9a3412", textTransform: "uppercase" }}>
                    Items ({totalItems})
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#c2410c" }}>
                    {selectedOrderType === "dine_in"
                      ? `Table #${currentTable || "—"}`
                      : selectedOrderType === "delivery"
                      ? "Rider Delivery"
                      : "Takeaway"}
                  </span>
                </div>
                {items.map((i) => {
                  const unitPrice = getUnitPrice(i);
                  const itemKey = getItemKey(i);
                  return (
                    <div
                      key={itemKey}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                        color: "#334155",
                        marginBottom: 4,
                      }}
                    >
                      <span>
                        {i.quantity}x {i.product.name}
                        {i.selectedVariation ? ` (${i.selectedVariation.name})` : ""}
                      </span>
                      <span style={{ fontWeight: 700, color: "#0f172a" }}>
                        {formatPrice(unitPrice * i.quantity)}
                      </span>
                    </div>
                  );
                })}

                {/* Subtotal */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    color: "#64748b",
                    marginTop: 6,
                    paddingTop: 6,
                    borderTop: "1px dashed #fed7aa",
                  }}
                >
                  <span>Subtotal</span>
                  <span style={{ fontWeight: 700 }}>{formatPrice(totalPrice)}</span>
                </div>

                {/* Delivery Fee */}
                {selectedOrderType === "delivery" && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: "#059669",
                      marginTop: 4,
                    }}
                  >
                    <span>🛵 Delivery Fee</span>
                    <span style={{ fontWeight: 700 }}>
                      {deliveryFee > 0 ? `+${formatPrice(deliveryFee)}` : "FREE"}
                    </span>
                  </div>
                )}

                {/* Promo Code Discount */}
                {promoDiscount > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: "#16a34a",
                      marginTop: 4,
                      fontWeight: 700,
                    }}
                  >
                    <span>🏷️ Promo Discount ({appliedPromo?.code})</span>
                    <span>-{formatPrice(promoDiscount)}</span>
                  </div>
                )}

                {/* Loyalty Points Discount */}
                {loyaltyDiscount > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: "#16a34a",
                      marginTop: 4,
                      fontWeight: 700,
                    }}
                  >
                    <span>🪙 Loyalty Points Redeemed</span>
                    <span>-{formatPrice(loyaltyDiscount)}</span>
                  </div>
                )}

                {/* Points Earning Line */}
                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 6,
                    borderTop: "1px dashed #fed7aa",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#b45309",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>🎁 Points Earning on this order:</span>
                  <span>+{pointsToEarn} pts</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div
              style={{
                borderTop: "1px solid #fed7aa",
                padding: "16px 20px 20px",
                background: "#fff7ed",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#7c2d12", display: "block" }}>Total Payable</span>
                  {totalDiscount > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#16a34a" }}>
                      🎉 Saved {formatPrice(totalDiscount)}
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    fontSize: 22,
                    color: "#dc2626",
                  }}
                >
                  {formatPrice(finalPayable)}
                </span>
              </div>

              <button
                type="submit"
                id="place-order-submit-btn"
                disabled={submitting}
                className="btn-primary"
                style={{
                  width: "100%",
                  padding: "13px",
                  fontSize: 14,
                  fontWeight: 800,
                  borderRadius: 4,
                  background: "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
                  borderColor: "#b91c1c",
                  boxShadow: "0 3px 10px rgba(220, 38, 38, 0.3)",
                }}
              >
                {submitting ? (
                  <span>Sending Order to Kitchen...</span>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>
                      Confirm &amp; Place Order ({selectedOrderType === "dine_in" ? `Table #${currentTable || ""}` : selectedOrderType === "delivery" ? "Home Delivery" : "Takeaway"})
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ─── VIEW 3: ORDER CONFIRMED / DIGITAL TOKEN SLIP ─────────── */}
        {viewMode === "confirmed" && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px 20px",
              textAlign: "center",
              overflowY: "auto",
            }}
          >
            {/* Top Success Badge */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 4,
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="square">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: 20,
                color: "#0f172a",
                margin: "0 0 4px",
              }}
            >
              Order Placed Successfully!
            </h3>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
              Your order was instantly received by our kitchen staff.
            </p>

            {/* CONFIRMED DETAILS CARD */}
            {confirmedType === "delivery" ? (
              /* DELIVERY SLIP */
              <div
                style={{
                  width: "100%",
                  maxWidth: 340,
                  padding: "18px",
                  borderRadius: 5,
                  background: "#ecfdf5",
                  border: "2px solid #a7f3d0",
                  marginBottom: 16,
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.1)",
                }}
              >
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 14 }}>🛵</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#065f46", textTransform: "uppercase" }}>
                    Rider Home Delivery
                  </span>
                </div>

                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: 4,
                    border: "1px solid #a7f3d0",
                    padding: "10px",
                    margin: "8px 0 12px",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#047857", textTransform: "uppercase" }}>
                    Delivery Destination:
                  </span>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "4px 0 0", lineHeight: 1.4 }}>
                    {confirmedAddress || "Home Address"}
                  </p>
                </div>

                <p style={{ fontSize: 12, fontWeight: 700, color: "#065f46", margin: "0 0 4px" }}>
                  Order Ref: <span style={{ fontFamily: "monospace", color: "#0f172a" }}>{placedOrderNumber}</span>
                </p>
                <p style={{ fontSize: 11, color: "#047857", margin: 0 }}>
                  Order dispatched to rider. Estimated arrival: 30-40 minutes.
                </p>
              </div>
            ) : confirmedType === "dine_in" ? (
              <div
                style={{
                  width: "100%",
                  maxWidth: 340,
                  padding: "18px",
                  borderRadius: 5,
                  background: "#fff7ed",
                  border: "2px solid #fed7aa",
                  marginBottom: 20,
                  boxShadow: "0 4px 12px rgba(234, 88, 12, 0.08)",
                }}
              >
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 14 }}>🍽️</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#c2410c", textTransform: "uppercase" }}>
                    Dine-In Table Order
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: confirmedToken ? "1fr 1fr" : "1fr",
                    gap: 8,
                    margin: "8px 0 12px",
                  }}
                >
                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: 4,
                      border: "1px solid #fed7aa",
                      padding: "10px",
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#9a3412", textTransform: "uppercase" }}>
                      Assigned Table
                    </span>
                    <p
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 900,
                        fontSize: 24,
                        color: "#dc2626",
                        margin: "2px 0 0",
                      }}
                    >
                      Table #{confirmedTable || "—"}
                    </p>
                  </div>

                  {confirmedToken && (
                    <div
                      style={{
                        background: "#ffffff",
                        borderRadius: 4,
                        border: "1px solid #fde047",
                        padding: "10px",
                      }}
                    >
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#854d0e", textTransform: "uppercase" }}>
                        Delivery Token
                      </span>
                      <p
                        style={{
                          fontFamily: "monospace",
                          fontWeight: 900,
                          fontSize: 24,
                          color: "#ca8a04",
                          margin: "2px 0 0",
                        }}
                      >
                        {confirmedToken}
                      </p>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    background: "#fef3c7",
                    border: "1px solid #fde68a",
                    borderRadius: 4,
                    padding: "8px 10px",
                    marginBottom: 10,
                    textAlign: "left",
                  }}
                >
                  <p style={{ fontSize: 11, fontWeight: 800, color: "#92400e", margin: 0, display: "flex", alignItems: "center", gap: 5 }}>
                    <span>🔍</span>
                    <span>Delivery Verification:</span>
                  </p>
                  <p style={{ fontSize: 10, color: "#b45309", margin: "3px 0 0", fontWeight: 600 }}>
                    Food will be delivered to Table #{confirmedTable}. Please show your token <strong>({confirmedToken})</strong> to your server when your order arrives.
                  </p>
                </div>

                <p style={{ fontSize: 12, fontWeight: 700, color: "#7c2d12", margin: "0 0 4px" }}>
                  Order Ref: <span style={{ fontFamily: "monospace", color: "#0f172a" }}>{placedOrderNumber}</span>
                </p>
              </div>
            ) : (
              /* TAKEAWAY TOKEN SLIP */
              <div
                style={{
                  width: "100%",
                  maxWidth: 340,
                  padding: "18px",
                  borderRadius: 5,
                  background: "#fefce8",
                  border: "2px solid #fde047",
                  marginBottom: 20,
                  boxShadow: "0 4px 12px rgba(202, 138, 4, 0.12)",
                }}
              >
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 14 }}>🛍️</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#854d0e", textTransform: "uppercase" }}>
                    Counter Queue Token
                  </span>
                </div>

                <div
                  style={{
                    background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                    borderRadius: 4,
                    border: "1px solid #d97706",
                    padding: "12px",
                    margin: "8px 0 12px",
                    color: "#7c2d12",
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Your Token Number
                  </span>
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 900,
                      fontSize: 34,
                      margin: "4px 0 0",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {confirmedToken || "#01"}
                  </p>
                </div>

                <p style={{ fontSize: 12, fontWeight: 700, color: "#7c2d12", margin: "0 0 4px" }}>
                  Order Ref: <span style={{ fontFamily: "monospace", color: "#0f172a" }}>{placedOrderNumber}</span>
                </p>
                <p style={{ fontSize: 11, color: "#854d0e", margin: 0 }}>
                  Please watch the counter screen. We will call your Token when your food is ready!
                </p>
              </div>
            )}

            {/* Live Kitchen Status Bar */}
            <div
              style={{
                width: "100%",
                maxWidth: 340,
                padding: "10px 14px",
                borderRadius: 4,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: "#f59e0b",
                    boxShadow: "0 0 6px #f59e0b",
                  }}
                />
                <span style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>
                  Status: Kitchen Preparing
                </span>
              </div>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                10-15 mins
              </span>
            </div>

            {/* Feature 4: Live Order Tracking Button */}
            {placedOrderNumber && (
              <Link
                href={`/track/${placedOrderNumber}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  width: "100%",
                  maxWidth: 340,
                  padding: "12px 18px",
                  borderRadius: 4,
                  background: "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 800,
                  textDecoration: "none",
                  boxShadow: "0 3px 10px rgba(37, 99, 235, 0.25)",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#ffffff",
                    boxShadow: "0 0 6px #ffffff",
                  }}
                />
                <span>Track Live Order Status &rarr;</span>
              </Link>
            )}

            {/* ─── GOOGLE REVIEW & STAR RATING CARD ─── */}
            <div
              style={{
                width: "100%",
                maxWidth: 340,
                background: "#ffffff",
                border: "1.5px solid #fed7aa",
                borderRadius: 8,
                padding: "16px",
                marginBottom: 12,
                boxShadow: "0 4px 16px rgba(234, 88, 12, 0.08)",
                textAlign: "center",
              }}
            >
              {!reviewSubmitted ? (
                <>
                  {/* Google Review Badge Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginBottom: 4 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span style={{ fontSize: 13, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.2px" }}>
                      Rate &amp; Review on Google
                    </span>
                  </div>
                  <p style={{ margin: "0 0 10px", fontSize: 11.5, color: "#64748b" }}>
                    How was your ordering experience today?
                  </p>

                  {/* 5 Interactive Stars */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      marginBottom: 6,
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = (hoverRating !== null ? hoverRating : reviewRating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          style={{
                            background: "none",
                            border: "none",
                            padding: "2px 4px",
                            cursor: "pointer",
                            fontSize: 28,
                            lineHeight: 1,
                            color: isFilled ? "#f59e0b" : "#cbd5e1",
                            transform: isFilled ? "scale(1.15)" : "scale(1)",
                            transition: "transform 0.15s ease, color 0.15s ease",
                          }}
                          aria-label={`${star} star`}
                        >
                          ★
                        </button>
                      );
                    })}
                  </div>

                  {/* Rating Sentiment Label */}
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: reviewRating >= 4 ? "#d97706" : reviewRating === 3 ? "#0284c7" : "#dc2626",
                      marginBottom: 10,
                    }}
                  >
                    {reviewRating === 5 && "⭐⭐⭐⭐⭐ Excellent / Loved It! 🤩"}
                    {reviewRating === 4 && "⭐⭐⭐⭐ Very Good! 😊"}
                    {reviewRating === 3 && "⭐⭐⭐ Good 🙂"}
                    {reviewRating === 2 && "⭐⭐ Fair 😐"}
                    {reviewRating === 1 && "⭐ Needs Improvement 😕"}
                  </div>

                  {/* Review Text Input Field */}
                  <div style={{ marginBottom: 10 }}>
                    <textarea
                      rows={2}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Write your review for Google (e.g. Delicious hot pizza, crisp crust, super fast delivery!)..."
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        fontSize: 12,
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        outline: "none",
                        resize: "none",
                        fontFamily: "inherit",
                        background: "#f8fafc",
                        color: "#0f172a",
                      }}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="button"
                    disabled={reviewSubmitting}
                    onClick={handlePostGoogleReview}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 6,
                      background:
                        reviewRating >= 4
                          ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
                          : "#475569",
                      color: "#ffffff",
                      fontSize: 12.5,
                      fontWeight: 800,
                      border: "none",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                  >
                    {reviewRating >= 4 ? (
                      <>
                        <span style={{ fontSize: 14 }}>⭐</span>
                        <span>Post on Google Reviews ↗</span>
                      </>
                    ) : (
                      <>
                        <span>📩</span>
                        <span>Send Feedback to Restaurant</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                /* Review Submitted State */
                <div style={{ padding: "8px 4px" }}>
                  <div style={{ fontSize: 26, marginBottom: 4 }}>🎉</div>
                  <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 900, color: "#065f46" }}>
                    Thank You for Your Review!
                  </h4>
                  <p style={{ margin: 0, fontSize: 11.5, color: "#047857" }}>
                    {copiedToast
                      ? "Your review text was copied to clipboard! Ready to paste into Google Reviews."
                      : "We truly appreciate your feedback and hope to serve you again soon!"}
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCloseAndReset}
              className="btn-primary"
              style={{
                width: "100%",
                maxWidth: 340,
                padding: "11px 24px",
                borderRadius: 4,
                background: "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
                borderColor: "#b91c1c",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              Order More Items
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function itemPrice(price: number | null | undefined, qty: number): number {
  return qty;
}
