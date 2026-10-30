"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useCart } from "./CartContext";
import { placeCustomerOrder, submitCustomerOrderReview } from "@/lib/order-actions";
import {
  validatePromoCode,
  lookupCustomerLoyalty,
  type PromoValidationResult,
} from "@/lib/promo-actions";
import type { Product } from "@/types/menu";
import { MENU2_THEMES, type Menu2ThemeId } from "./menu2-themes";
import {
  X,
  ShoppingBag,
  Plus,
  Check,
  ChevronRight,
  Bike,
  UtensilsCrossed,
  MapPin,
  Phone,
  Users,
  Sparkles,
  TicketPercent,
  FileText,
  ExternalLink,
} from "lucide-react";

interface Menu2CartDrawerProps {
  open: boolean;
  onClose: () => void;
  tableNumber?: string;
  setTableNumber?: (val: string) => void;
  orderType?: "dine_in" | "takeaway" | "delivery";
  setOrderType?: (val: "dine_in" | "takeaway" | "delivery") => void;
  shopId?: number | null;
  shopName?: string;
  googleReviewUrl?: string;
  menuProducts?: Product[];
  themeId?: Menu2ThemeId;
}

export default function Menu2CartDrawer({
  open,
  onClose,
  tableNumber: propTableNumber = "",
  setTableNumber: propSetTableNumber,
  orderType: propOrderType = "delivery",
  setOrderType: propSetOrderType,
  shopId,
  shopName = "Store",
  googleReviewUrl,
  menuProducts = [],
  themeId = "ruby_gold",
}: Menu2CartDrawerProps) {
  const theme = MENU2_THEMES[themeId] || MENU2_THEMES.ruby_gold;
  const {
    items,
    totalItems,
    totalPrice,
    setQty,
    clearCart,
    formatPrice,
    getItemKey,
    getUnitPrice,
    addItem,
  } = useCart();

  const [step, setStep] = useState<"cart" | "info" | "confirmed">("cart");
  const [selectedOrderType, setSelectedOrderType] = useState<"dine_in" | "takeaway" | "delivery">(
    propTableNumber ? "dine_in" : propOrderType
  );
  const [currentTable, setCurrentTable] = useState(propTableNumber);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoValidationResult | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMsg, setPromoMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [placedOrderNumber, setPlacedOrderNumber] = useState<string | null>(null);
  const [confirmedType, setConfirmedType] = useState<"dine_in" | "takeaway" | "delivery">("delivery");
  const [confirmedTable, setConfirmedTable] = useState<string | null>(null);
  const [confirmedToken, setConfirmedToken] = useState<string | null>(null);
  const [confirmedAddress, setConfirmedAddress] = useState<string | null>(null);

  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);
  const [reviewSubmitting, setReviewSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (propTableNumber) {
      setCurrentTable(propTableNumber);
      setSelectedOrderType("dine_in");
    } else if (propOrderType) {
      setSelectedOrderType(propOrderType);
    }
  }, [propTableNumber, propOrderType]);

  useEffect(() => {
    const digits = customerPhone.replace(/\D/g, "");
    if (digits.length >= 10) {
      lookupCustomerLoyalty(customerPhone, shopId)
        .then((info) => {
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
    }
  }, [customerPhone, shopId]);

  const upsellItems = useMemo(() => {
    const cartIds = new Set(items.map((i) => Number(i.product.id)));
    return menuProducts
      .filter((p) => {
        if (p.is_available === false || cartIds.has(Number(p.id))) return false;
        const n = (p.name || "").toLowerCase();
        return (
          n.includes("drink") ||
          n.includes("pepsi") ||
          n.includes("coke") ||
          n.includes("sprite") ||
          n.includes("fries") ||
          n.includes("dip") ||
          n.includes("sauce") ||
          n.includes("water") ||
          (Number(p.price) > 0 && Number(p.price) <= 350)
        );
      })
      .slice(0, 6);
  }, [menuProducts, items]);

  const handleOrderTypeChange = (type: "dine_in" | "takeaway" | "delivery") => {
    setSelectedOrderType(type);
    if (propSetOrderType) propSetOrderType(type);
  };

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

  const promoDiscount = appliedPromo?.discountAmount || 0;
  const totalDiscount = promoDiscount;
  const finalPayable = Math.max(0, totalPrice - totalDiscount);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMessage("Please enter your active Phone / WhatsApp number.");
      return;
    }
    if (selectedOrderType === "dine_in" && !currentTable.trim()) {
      setErrorMessage("Please enter your Table Number.");
      return;
    }
    if (selectedOrderType === "delivery" && !deliveryAddress.trim()) {
      setErrorMessage("Please enter your complete delivery address.");
      return;
    }
    if (items.length === 0) {
      setErrorMessage("Your basket is empty.");
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
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      delivery_address: selectedOrderType === "delivery" ? deliveryAddress.trim() : undefined,
      delivery_fee: 0,
      discount_amount: totalDiscount,
      promo_code: appliedPromo?.code || null,
      notes: orderNotes.trim(),
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
      setStep("confirmed");
      clearCart();
    } else {
      setErrorMessage(result.error || "Could not place order. Please try again.");
    }
  };

  const handleSubmitReview = async () => {
    if (reviewSubmitting || !placedOrderNumber) return;
    setReviewSubmitting(true);
    try {
      await submitCustomerOrderReview({
        orderNumber: placedOrderNumber,
        rating: reviewRating || 5,
        comment: reviewComment.trim() || undefined,
      });
      if (reviewRating >= 4 && googleReviewUrl?.trim()) {
        window.open(googleReviewUrl.trim(), "_blank", "noopener,noreferrer");
      }
      setReviewSubmitted(true);
    } catch {
      // ignore
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleCloseAll = () => {
    onClose();
    setTimeout(() => {
      setStep("cart");
      setPlacedOrderNumber(null);
      setErrorMessage(null);
    }, 250);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={handleCloseAll} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full sm:max-w-[460px] ${theme.pageBg} h-full flex flex-col shadow-2xl border-l ${theme.cardBorder} animate-in slide-in-from-right duration-200`}
      >
        {/* ─── DRAWER TOP HEADER + STEP PROGRESS BAR ─── */}
        <div className={`${theme.headerBg} text-white px-5 pt-4 pb-3.5 shrink-0 border-b ${theme.headerBorder}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-[7px] ${theme.primaryBadge} flex items-center justify-center font-black`}>
                <ShoppingBag size={18} />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight leading-none">
                  {step === "cart"
                    ? "Your Order Basket"
                    : step === "info"
                    ? "Customer Information"
                    : "Order Confirmed!"}
                </h2>
                <p className="text-[11px] text-white/70 mt-1">{shopName}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseAll}
              className="w-8 h-8 rounded-[7px] bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Step Indicator Pills */}
          <div className="grid grid-cols-3 gap-1.5 mt-3.5 pt-3 border-t border-white/15 text-[10px] font-extrabold uppercase tracking-wider">
            <button
              type="button"
              onClick={() => step === "info" && setStep("cart")}
              disabled={step === "confirmed"}
              className={`py-1.5 px-2 rounded-[5px] text-center transition ${
                step === "cart"
                  ? theme.primaryBadge
                  : "bg-white/10 text-white/75"
              }`}
            >
              1. Basket ({totalItems})
            </button>
            <div
              className={`py-1.5 px-2 rounded-[5px] text-center transition ${
                step === "info"
                  ? theme.primaryBadge
                  : "bg-white/10 text-white/75"
              }`}
            >
              2. Customer Info
            </div>
            <div
              className={`py-1.5 px-2 rounded-[5px] text-center transition ${
                step === "confirmed"
                  ? theme.primaryBadge
                  : "bg-white/10 text-white/75"
              }`}
            >
              3. Receipt
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            STEP 1: CART ITEMS + UPSELL + PROMO CODE
            ═══════════════════════════════════════════════════════════════ */}
        {step === "cart" && (
          <>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {items.length === 0 ? (
                <div className={`${theme.cardBg} rounded-[7px] border ${theme.cardBorder} p-10 text-center my-6`}>
                  <div className={`w-14 h-14 rounded-[7px] ${theme.sizeBoxBg} flex items-center justify-center mx-auto mb-3 text-2xl`}>
                    🛒
                  </div>
                  <h3 className="text-base font-black">Your basket is empty</h3>
                  <p className={`text-xs ${theme.cardDescText} mt-1`}>
                    Add delicious pizzas, burgers, or deals from the menu to start your order.
                  </p>
                  <button
                    type="button"
                    onClick={handleCloseAll}
                    className={`mt-4 px-5 py-2.5 rounded-[7px] ${theme.primaryBtn} text-xs font-extrabold uppercase tracking-wider cursor-pointer`}
                  >
                    Browse Menu
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider opacity-70">
                        Selected Items ({totalItems})
                      </span>
                      <button
                        type="button"
                        onClick={clearCart}
                        className="text-[11px] font-bold text-red-500 hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>

                    {items.map((item) => {
                      const key = getItemKey(item);
                      const unitPrice = getUnitPrice(item);
                      return (
                        <div
                          key={key}
                          className={`${theme.cardBg} p-3.5 rounded-[7px] border ${theme.cardBorder} shadow-2xs flex items-center justify-between gap-3`}
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-black truncate">
                              {item.product.name}
                            </h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.selectedVariation && (
                                <span className={`px-2 py-0.5 rounded-[4px] ${theme.sizeBoxBg} border text-[10px] font-extrabold`}>
                                  Size: {item.selectedVariation.name}
                                </span>
                              )}
                              {item.selectedToppings &&
                                item.selectedToppings.map((t, idx) => (
                                  <span
                                    key={idx}
                                    className={`px-2 py-0.5 rounded-[4px] ${theme.sizeBoxBg} text-[10px] font-bold`}
                                  >
                                    + {t.name}
                                  </span>
                                ))}
                            </div>
                            <p className={`text-xs sm:text-sm font-black ${theme.priceText} mt-1.5`}>
                              {formatPrice(unitPrice * item.quantity)}
                            </p>
                          </div>

                          <div className={`flex items-center gap-1.5 ${theme.sizeBoxBg} p-1 rounded-[7px] border shrink-0`}>
                            <button
                              type="button"
                              onClick={() => setQty(key, item.quantity - 1)}
                              className={`w-7 h-7 rounded-[5px] ${theme.cardBg} font-black text-xs flex items-center justify-center cursor-pointer`}
                            >
                              -
                            </button>
                            <span className="text-xs font-black w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQty(key, item.quantity + 1)}
                              className={`w-7 h-7 rounded-[5px] ${theme.primaryBtn} font-black text-xs flex items-center justify-center cursor-pointer`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick Upsell Strip */}
                  {upsellItems.length > 0 && (
                    <div className={`${theme.cardBg} p-3.5 rounded-[7px] border ${theme.cardBorder} space-y-2.5`}>
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={13} className="text-amber-500" />
                        <span className="text-[11px] font-black uppercase tracking-wider">
                          Complete Your Meal With
                        </span>
                      </div>

                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                        {upsellItems.map((u) => (
                          <div
                            key={u.id}
                            className={`shrink-0 w-36 p-2.5 rounded-[7px] ${theme.sizeBoxBg} border flex flex-col justify-between gap-2`}
                          >
                            <div>
                              <p className="text-xs font-extrabold truncate">
                                {u.name}
                              </p>
                              <p className={`text-[11px] font-black ${theme.priceText} mt-0.5`}>
                                {formatPrice(Number(u.price) || 0)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => addItem(u, undefined, null, [])}
                              className={`w-full py-1.5 rounded-[5px] ${theme.primaryBtn} text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition`}
                            >
                              <Plus size={11} />
                              <span>Add</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Promo Code Box */}
                  <div className={`${theme.cardBg} p-3.5 rounded-[7px] border ${theme.cardBorder} space-y-2`}>
                    <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                      <TicketPercent size={13} className={theme.priceText} />
                      <span>Have a Promo / Discount Code?</span>
                    </span>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code..."
                        className={`flex-1 px-3 py-2 rounded-[7px] border ${theme.cardBorder} bg-transparent text-xs font-mono font-bold uppercase focus:outline-none`}
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={promoLoading}
                        className={`px-4 py-2 rounded-[7px] ${theme.primaryBtn} text-xs font-extrabold cursor-pointer transition disabled:opacity-50`}
                      >
                        {promoLoading ? "..." : "Apply"}
                      </button>
                    </div>
                    {promoMsg && (
                      <p
                        className={`text-xs font-bold ${
                          promoMsg.type === "success" ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {promoMsg.text}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {items.length > 0 && (
              <div className={`p-4 sm:p-5 ${theme.cardBg} border-t ${theme.cardBorder} space-y-3 shrink-0`}>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between opacity-75 font-semibold">
                    <span>Items Subtotal</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-500 font-bold">
                      <span>Discount Applied</span>
                      <span>- {formatPrice(totalDiscount)}</span>
                    </div>
                  )}
                  <div className={`flex justify-between text-sm sm:text-base font-black pt-1 border-t ${theme.cardBorder}`}>
                    <span>Total Payable</span>
                    <span className={theme.priceText}>{formatPrice(finalPayable)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep("info")}
                  className={`w-full py-3.5 px-5 rounded-[7px] ${theme.primaryBtn} font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-between shadow-lg transition cursor-pointer`}
                >
                  <span>Proceed to Customer Info</span>
                  <ChevronRight size={17} />
                </button>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            STEP 2: CUSTOMER INFORMATION PAGE
            ═══════════════════════════════════════════════════════════════ */}
        {step === "info" && (
          <form onSubmit={handlePlaceOrder} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-[7px] bg-red-500/15 border border-red-500 text-red-500 text-xs font-bold">
                  {errorMessage}
                </div>
              )}

              {/* 1. Order Mode Selector */}
              <div className={`${theme.cardBg} p-3.5 rounded-[7px] border ${theme.cardBorder} space-y-2.5`}>
                <label className="block text-[11px] font-black uppercase tracking-wider opacity-75">
                  1. Select Order Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "delivery", label: "Delivery", icon: Bike },
                    { id: "takeaway", label: "Takeaway", icon: ShoppingBag },
                    { id: "dine_in", label: "Dine-In", icon: UtensilsCrossed },
                  ].map((m) => {
                    const Icon = m.icon;
                    const active = selectedOrderType === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleOrderTypeChange(m.id as any)}
                        className={`py-2.5 px-2 rounded-[7px] border-2 flex flex-col items-center justify-center gap-1 text-xs font-extrabold transition cursor-pointer ${
                          active
                            ? `${theme.catActiveBg}`
                            : `${theme.sizeBoxBg} ${theme.cardBorder}`
                        }`}
                      >
                        <Icon size={15} />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Customer Contact & Address Details */}
              <div className={`${theme.cardBg} p-4 rounded-[7px] border ${theme.cardBorder} space-y-3.5`}>
                <div className={`flex items-center justify-between border-b ${theme.cardBorder} pb-2`}>
                  <span className="text-[11px] font-black uppercase tracking-wider opacity-80">
                    2. Customer Contact &amp; Address
                  </span>
                  <span className={`text-[10px] font-bold ${theme.primaryBadge} px-2 py-0.5 rounded-[4px]`}>
                    Auto-Saved
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-extrabold mb-1">
                    Phone / WhatsApp Number *
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="03XX-XXXXXXX"
                      className={`w-full pl-9 pr-3.5 py-2.5 rounded-[7px] border ${theme.cardBorder} bg-transparent text-sm font-mono font-bold focus:outline-none`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold mb-1">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter your full name"
                      className={`w-full pl-9 pr-3.5 py-2.5 rounded-[7px] border ${theme.cardBorder} bg-transparent text-sm font-semibold focus:outline-none`}
                    />
                  </div>
                </div>

                {selectedOrderType === "delivery" && (
                  <div>
                    <label className="block text-xs font-extrabold mb-1">
                      Complete Delivery Address *
                    </label>
                    <div className="relative">
                      <MapPin size={14} className={`absolute left-3 top-3 ${theme.priceText}`} />
                      <textarea
                        rows={2}
                        required
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="House / Street, Mohalla / Town, Nearby Landmark..."
                        className={`w-full pl-9 pr-3.5 py-2 rounded-[7px] border ${theme.cardBorder} bg-transparent text-sm font-medium focus:outline-none`}
                      />
                    </div>
                  </div>
                )}

                {selectedOrderType === "dine_in" && (
                  <div>
                    <label className="block text-xs font-extrabold mb-1">
                      Table Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={currentTable}
                      onChange={(e) => {
                        setCurrentTable(e.target.value);
                        if (propSetTableNumber) propSetTableNumber(e.target.value);
                      }}
                      placeholder="e.g. Table 4"
                      className={`w-full px-3.5 py-2.5 rounded-[7px] border ${theme.cardBorder} bg-transparent text-sm font-bold focus:outline-none`}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-extrabold mb-1">
                    Special Instructions (Optional)
                  </label>
                  <div className="relative">
                    <FileText size={14} className="absolute left-3 top-3 opacity-50" />
                    <input
                      type="text"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="e.g. Extra spicy, less mayo, ring bell..."
                      className={`w-full pl-9 pr-3.5 py-2.5 rounded-[7px] border ${theme.cardBorder} bg-transparent text-xs sm:text-sm focus:outline-none`}
                    />
                  </div>
                </div>
              </div>

              {/* Compact Order Bill Summary */}
              <div className={`${theme.headerBg} text-white p-4 rounded-[7px] space-y-1.5 text-xs`}>
                <div className="flex justify-between text-white/70">
                  <span>Order Items ({totalItems})</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className={`flex justify-between ${theme.accentText} font-bold`}>
                    <span>Discount</span>
                    <span>- {formatPrice(totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm sm:text-base font-black pt-2 border-t border-white/15">
                  <span>Total Cash Payable</span>
                  <span className={theme.accentText}>{formatPrice(finalPayable)}</span>
                </div>
              </div>
            </div>

            <div className={`p-4 sm:p-5 ${theme.cardBg} border-t ${theme.cardBorder} flex items-center gap-2.5 shrink-0`}>
              <button
                type="button"
                onClick={() => setStep("cart")}
                className={`px-4 py-3.5 rounded-[7px] border ${theme.cardBorder} font-extrabold text-xs uppercase cursor-pointer`}
              >
                ← Back
              </button>

              <button
                type="submit"
                disabled={submitting}
                className={`flex-1 py-3.5 px-5 rounded-[7px] ${theme.primaryBtn} font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50`}
              >
                <Check size={16} />
                <span>{submitting ? "Placing Order..." : `Confirm Order — ${formatPrice(finalPayable)}`}</span>
              </button>
            </div>
          </form>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            STEP 3: ORDER CONFIRMED TICKET
            ═══════════════════════════════════════════════════════════════ */}
        {step === "confirmed" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-center">
            <div className={`${theme.cardBg} p-6 rounded-[7px] border-2 ${theme.cardBorder} shadow-md space-y-3`}>
              <div className={`w-14 h-14 rounded-[7px] ${theme.primaryBadge} flex items-center justify-center mx-auto font-black`}>
                <Check size={28} />
              </div>

              <span className={`inline-block px-2.5 py-0.5 rounded-[5px] ${theme.sizeBoxBg} text-[10px] font-black uppercase tracking-widest`}>
                Sent to Kitchen
              </span>

              <h3 className="text-xl font-black">
                Thank You, {customerName}!
              </h3>

              <div className={`${theme.headerBg} text-white p-3.5 rounded-[7px]`}>
                <span className="block text-[10px] uppercase tracking-widest text-white/70 font-bold">
                  Order Number
                </span>
                <span className={`text-lg font-mono font-black ${theme.accentText}`}>
                  {placedOrderNumber}
                </span>
              </div>

              <div className={`text-xs ${theme.cardDescText} space-y-1 pt-1`}>
                <p className="font-bold capitalize">
                  Order Type: {confirmedType.replace("_", " ")}
                </p>
                {confirmedAddress && <p>Delivery To: {confirmedAddress}</p>}
                {confirmedTable && <p>Table: {confirmedTable}</p>}
                {confirmedToken && <p>Token: {confirmedToken}</p>}
              </div>

              {placedOrderNumber && (
                <Link
                  href={`/track/${encodeURIComponent(placedOrderNumber)}`}
                  className={`w-full py-3 px-4 rounded-[7px] ${theme.primaryBtn} font-black text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition shadow-sm`}
                >
                  <span>Track Live Order Status</span>
                  <ExternalLink size={14} />
                </Link>
              )}
            </div>

            {!reviewSubmitted ? (
              <div className={`${theme.cardBg} p-4 rounded-[7px] border ${theme.cardBorder} space-y-3 text-left`}>
                <span className="block text-xs font-black uppercase tracking-wider">
                  Rate Your Ordering Experience
                </span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`w-9 h-9 rounded-[7px] font-black text-sm border transition cursor-pointer ${
                        reviewRating >= star
                          ? `${theme.primaryBadge} border-transparent`
                          : `${theme.sizeBoxBg} ${theme.cardBorder} opacity-50`
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Write a quick feedback note..."
                  className={`w-full px-3 py-2 rounded-[7px] border ${theme.cardBorder} bg-transparent text-xs`}
                />
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={reviewSubmitting}
                  className={`w-full py-2.5 rounded-[7px] ${theme.primaryBtn} text-xs font-extrabold uppercase tracking-wider cursor-pointer`}
                >
                  {reviewSubmitting ? "Submitting..." : "Submit Feedback"}
                </button>
              </div>
            ) : (
              <div className={`p-3 rounded-[7px] ${theme.sizeBoxBg} border text-xs font-bold`}>
                Thank you for your feedback!
              </div>
            )}

            <button
              type="button"
              onClick={handleCloseAll}
              className={`w-full py-3 rounded-[7px] border ${theme.cardBorder} ${theme.cardBg} text-xs font-black uppercase tracking-wider cursor-pointer`}
            >
              Back to Menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
