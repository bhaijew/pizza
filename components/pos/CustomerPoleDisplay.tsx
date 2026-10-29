"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  POLE_LOCAL_STORAGE_KEY,
  POLE_BROADCAST_CHANNEL_NAME,
  POLE_DISPLAY_CHANNEL_PREFIX,
  type PoleDisplayState,
  type PoleDisplayItem,
  broadcastPoleDisplay,
} from "@/lib/pole-display";
import { createClient } from "@/utils/supabase/client";
import {
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  Sparkles,
  QrCode,
  CreditCard,
  CheckCircle2,
  Clock,
  Flame,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

const MaximizeIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);

const MinimizeIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
  </svg>
);

interface CustomerPoleDisplayProps {
  initialShop?: {
    id: number;
    name: string;
    slug: string;
    logo_url?: string | null;
    currency_symbol?: string;
    phone?: string | null;
    owner_phone?: string | null;
    raast_id?: string | null;
    easypaisa_number?: string | null;
    jazzcash_number?: string | null;
    deals?: { id: number; title: string; price: number; image?: string; description?: string }[];
  } | null;
}

export default function CustomerPoleDisplay({ initialShop }: CustomerPoleDisplayProps) {
  const supabase = useMemo(() => createClient(), []);

  // Live Digital Clock state
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [paymentTab, setPaymentTab] = useState<"raast" | "easypaisa" | "jazzcash" | "cash">("raast");
  const [showDemoControls, setShowDemoControls] = useState(false);

  // Active Pole Display State
  const [displayState, setDisplayState] = useState<PoleDisplayState>(() => {
    // Check initial local storage if available
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(POLE_LOCAL_STORAGE_KEY);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch {}
    }

    return {
      status: "idle",
      shopId: initialShop?.id ?? null,
      shopName: initialShop?.name || "SoleWhat Store",
      shopSlug: initialShop?.slug || "",
      shopLogo: initialShop?.logo_url || null,
      currencySymbol: initialShop?.currency_symbol || "Rs.",
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      deliveryFee: 0,
      total: 0,
      orderType: "takeaway",
      updatedAt: Date.now(),
    };
  });

  // Carousel promo slides for Idle state
  const promoSlides = useMemo(() => {
    return [
      {
        title: "Chef's Handcrafted Artisanal Pizza",
        subtitle: "Stone-baked fresh daily with 100% pure imported dairy mozzarella",
        tag: "🔥 BESTSELLER",
        accent: "#ea580c",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1000&q=80",
      },
      {
        title: "Sizzling Peri Peri Wings & Sides",
        subtitle: "Marinated 24 hours in authentic spices & flame-grilled to perfection",
        tag: "🍗 CRISPY & HOT",
        accent: "#e11d48",
        image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=1000&q=80",
      },
      {
        title: "Instant Digital QR Pay Available",
        subtitle: "Pay seamlessly with Raast, EasyPaisa, JazzCash, or Debit Card",
        tag: "⚡ 0% TRANSACTION FEE",
        accent: "#059669",
        image: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=1000&q=80",
      },
    ];
  }, []);

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Rotate idle promotional slides every 6 seconds
  useEffect(() => {
    if (displayState.status !== "idle" && displayState.items.length > 0) return;
    const interval = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % promoSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [displayState.status, displayState.items.length, promoSlides.length]);

  // Live Clock updater (PKT)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZone: "Asia/Karachi",
        })
      );
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "Asia/Karachi",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Synchronize state across BroadcastChannel, LocalStorage, and Supabase Realtime
  useEffect(() => {
    const handleSync = (newState: PoleDisplayState) => {
      if (!newState) return;
      // Filter strictly by shopId if both have shopId
      if (initialShop?.id && newState.shopId && Number(newState.shopId) !== Number(initialShop.id)) {
        return;
      }
      setDisplayState(newState);
    };

    // 1. BroadcastChannel API for multi-monitor setups
    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      bc = new BroadcastChannel(POLE_BROADCAST_CHANNEL_NAME);
      bc.onmessage = (event) => {
        if (event.data) {
          handleSync(event.data);
        }
      };
    }

    // 2. Storage event for cross-tab updates
    const handleStorage = (e: StorageEvent) => {
      if (e.key === POLE_LOCAL_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          handleSync(parsed);
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);

    // 3. Supabase Realtime Broadcast channel for tablet counter stands
    const targetShopId = initialShop?.id || displayState.shopId;
    let realtimeChannel: any = null;
    if (targetShopId) {
      realtimeChannel = supabase
        .channel(`${POLE_DISPLAY_CHANNEL_PREFIX}-${targetShopId}`)
        .on("broadcast", { event: "cart_sync" }, (payload) => {
          if (payload.payload) {
            handleSync(payload.payload);
          }
        })
        .subscribe();
    }

    return () => {
      if (bc) bc.close();
      window.removeEventListener("storage", handleStorage);
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [supabase, initialShop?.id, displayState.shopId]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const curr = displayState.currencySymbol || "Rs.";
  const hasItems = displayState.items && displayState.items.length > 0;
  const isIdle = !hasItems || displayState.status === "idle";
  const isCompleted = displayState.status === "completed";

  // Dynamic Payment QR string for Pakistani Wallets & Raast
  const paymentPhone =
    initialShop?.easypaisa_number ||
    initialShop?.jazzcash_number ||
    initialShop?.phone ||
    initialShop?.owner_phone ||
    "03001234567";

  const raastId = initialShop?.raast_id || paymentPhone;

  const dynamicQrData = useMemo(() => {
    const cleanPhone = paymentPhone.replace(/\D/g, "");
    const amount = Math.max(0, displayState.total);
    const store = displayState.shopName || "SoleWhat Store";

    if (paymentTab === "raast") {
      // Standard Raast EMVCo / URI Payload
      return `raast://pay?id=${encodeURIComponent(raastId)}&amount=${amount}&ref=${encodeURIComponent(
        displayState.orderNumber || "COUNTER"
      )}&name=${encodeURIComponent(store)}`;
    }
    if (paymentTab === "easypaisa") {
      return `easypaisa://send?to=${cleanPhone}&amount=${amount}&merchant=${encodeURIComponent(store)}`;
    }
    if (paymentTab === "jazzcash") {
      return `jazzcash://transfer?mobile=${cleanPhone}&amount=${amount}&ref=${encodeURIComponent(store)}`;
    }
    return `solewhat:bill?store=${encodeURIComponent(store)}&amount=${amount}&order=${encodeURIComponent(
      displayState.orderNumber || "COUNTER"
    )}`;
  }, [paymentTab, paymentPhone, raastId, displayState.total, displayState.shopName, displayState.orderNumber]);

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(
    dynamicQrData
  )}`;

  // Demo simulator helper
  const handleSimulateSampleCart = (type: "combo" | "single") => {
    const sampleItems: PoleDisplayItem[] =
      type === "combo"
        ? [
            { name: "Chicken Tikka Feast (Large 13\")", qty: 1, price: 2190, detail: "Stuffed Cheese Crust" },
            { name: "Crispy Peri Peri Wings (6 Pcs)", qty: 1, price: 590 },
            { name: "Coca Cola Bottle 1.5L", qty: 1, price: 230 },
          ]
        : [
            { name: "Pepperoni Passion (Medium 10\")", qty: 2, price: 1450, detail: "Extra Mozzarella" },
            { name: "Garlic Butter Breadsticks", qty: 1, price: 390 },
          ];

    const subtotal = sampleItems.reduce((acc, it) => acc + it.price * it.qty, 0);
    const discount = type === "combo" ? 250 : 0;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal - discount + tax;

    const newState: PoleDisplayState = {
      status: "active",
      shopId: initialShop?.id || null,
      shopName: initialShop?.name || "SoleWhat Store",
      currencySymbol: "Rs.",
      orderNumber: `ORD-${Math.floor(100 + Math.random() * 900)}`,
      customerName: "Counter Guest",
      orderType: "takeaway",
      items: sampleItems,
      subtotal,
      discount,
      tax,
      deliveryFee: 0,
      total,
      cashTendered: 3500,
      changeDue: 3500 - total > 0 ? 3500 - total : 0,
      updatedAt: Date.now(),
    };

    broadcastPoleDisplay(newState, supabase);
    setDisplayState(newState);
  };

  const handleSimulatePaid = () => {
    const newState: PoleDisplayState = {
      ...displayState,
      status: "completed",
      updatedAt: Date.now(),
    };
    broadcastPoleDisplay(newState, supabase);
    setDisplayState(newState);

    // Auto reset to idle after 6 seconds
    setTimeout(() => {
      const idleState: PoleDisplayState = {
        ...displayState,
        status: "idle",
        items: [],
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
        updatedAt: Date.now(),
      };
      broadcastPoleDisplay(idleState, supabase);
      setDisplayState(idleState);
    }, 6000);
  };

  const handleResetIdle = () => {
    const idleState: PoleDisplayState = {
      ...displayState,
      status: "idle",
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
      updatedAt: Date.now(),
    };
    broadcastPoleDisplay(idleState, supabase);
    setDisplayState(idleState);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#09090b",
        color: "#ffffff",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        userSelect: "none",
        overflowX: "hidden",
      }}
    >
      {/* ── Top Header Navigation Bar ────────────────────────────────────────── */}
      <header
        style={{
          background: "linear-gradient(180deg, #18181b 0%, #111113 100%)",
          borderBottom: "1px solid #27272a",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {displayState.shopLogo ? (
            <img
              src={displayState.shopLogo}
              alt={displayState.shopName}
              style={{
                width: 44,
                height: 44,
                borderRadius: "5px",
                objectFit: "cover",
                border: "2px solid #ea580c",
              }}
            />
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "5px",
                background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 20,
                color: "#ffffff",
                boxShadow: "0 2px 8px rgba(234, 88, 12, 0.4)",
              }}
            >
              🍕
            </div>
          )}

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: "-0.3px", color: "#ffffff" }}>
                {displayState.shopName}
              </h1>
              <span
                style={{
                  background: "#22c55e",
                  color: "#000000",
                  fontSize: 10,
                  fontWeight: 900,
                  padding: "2px 6px",
                  borderRadius: "5px",
                  letterSpacing: "0.5px",
                }}
              >
                LIVE COUNTER POLE
              </span>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#a1a1aa", fontWeight: 600 }}>
              {displayState.orderNumber ? `Active Bill: ${displayState.orderNumber}` : "Welcome to the Counter"}
              {displayState.customerName ? ` • Guest: ${displayState.customerName}` : ""}
            </p>
          </div>
        </div>

        {/* Right Section: Time & Fullscreen Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Live Digital Clock Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#27272a",
              padding: "6px 12px",
              borderRadius: "5px",
              border: "1px solid #3f3f46",
            }}
          >
            <Clock size={15} color="#22c55e" />
            <span style={{ fontSize: 13, fontWeight: 800, color: "#ffffff", letterSpacing: "0.5px" }}>
              {currentTime || "00:00:00"}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 900,
                background: "#059669",
                color: "#ffffff",
                padding: "1px 5px",
                borderRadius: "5px",
              }}
            >
              PKT
            </span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            style={{
              background: "#27272a",
              border: "1px solid #3f3f46",
              color: "#a1a1aa",
              padding: "8px",
              borderRadius: "5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen Counter View"}
          >
            {isFullscreen ? <MinimizeIcon size={16} /> : <MaximizeIcon size={16} />}
          </button>
        </div>
      </header>

      {/* ── Main View Area ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {isIdle ? (
          /* ── Idle State: Atmospheric Digital Signage Carousel ───────────────── */
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              padding: "40px 20px",
              overflow: "hidden",
            }}
          >
            {/* Background ambient glow image */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${promoSlides[activeSlideIndex].image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: 0.18,
                filter: "blur(20px)",
                transition: "opacity 1s ease",
              }}
            />

            <div
              style={{
                position: "relative",
                zIndex: 2,
                maxWidth: 960,
                width: "100%",
                background: "rgba(24, 24, 27, 0.85)",
                backdropFilter: "blur(24px)",
                border: "1px solid #3f3f46",
                borderRadius: "5px",
                padding: "36px 32px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 32,
                alignItems: "center",
                boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              }}
            >
              {/* Slide Text Content */}
              <div>
                <span
                  style={{
                    display: "inline-block",
                    background: promoSlides[activeSlideIndex].accent,
                    color: "#ffffff",
                    fontSize: 11,
                    fontWeight: 900,
                    padding: "4px 10px",
                    borderRadius: "5px",
                    letterSpacing: "0.5px",
                    marginBottom: 14,
                  }}
                >
                  {promoSlides[activeSlideIndex].tag}
                </span>

                <h2
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    lineHeight: 1.2,
                    margin: "0 0 12px",
                    color: "#ffffff",
                  }}
                >
                  {promoSlides[activeSlideIndex].title}
                </h2>

                <p style={{ fontSize: 15, color: "#d4d4d8", margin: "0 0 24px", lineHeight: 1.5 }}>
                  {promoSlides[activeSlideIndex].subtitle}
                </p>

                <div
                  style={{
                    background: "rgba(39, 39, 42, 0.8)",
                    border: "1px solid #52525b",
                    borderRadius: "5px",
                    padding: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "5px",
                      background: "#ea580c",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <UtensilsCrossed size={20} color="#ffffff" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#ffffff" }}>
                      Please Place Order At Counter
                    </h4>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#a1a1aa" }}>
                      Our friendly cashier is ready to punch your meal live!
                    </p>
                  </div>
                </div>

                {/* Carousel Progress Indicators */}
                <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
                  {promoSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSlideIndex(idx)}
                      style={{
                        width: idx === activeSlideIndex ? 36 : 12,
                        height: 6,
                        borderRadius: "5px",
                        background: idx === activeSlideIndex ? "#ea580c" : "#52525b",
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                      }}
                      title={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Promo Banner Visual Frame */}
              <div
                style={{
                  position: "relative",
                  borderRadius: "5px",
                  overflow: "hidden",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  border: "2px solid #3f3f46",
                  height: 320,
                }}
              >
                <img
                  src={promoSlides[activeSlideIndex].image}
                  alt={promoSlides[activeSlideIndex].title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.6s ease",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.8) 100%)",
                    display: "flex",
                    alignItems: "flex-end",
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ShieldCheck size={18} color="#22c55e" />
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>
                      100% Halal & Fresh Ingredients Guaranteed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── Active Transaction State: Live Bill + QR Pay Split View ────────── */
          <div
            style={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: "1.1fr 0.9fr",
              height: "calc(100vh - 70px)",
              overflow: "hidden",
            }}
          >
            {/* Left Column: Live Cart Items List */}
            <div
              style={{
                borderRight: "1px solid #27272a",
                display: "flex",
                flexDirection: "column",
                background: "#121214",
              }}
            >
              {/* Order Service Pill Header */}
              <div
                style={{
                  padding: "14px 24px",
                  background: "#18181b",
                  borderBottom: "1px solid #27272a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      background:
                        displayState.orderType === "dine_in"
                          ? "#3b82f6"
                          : displayState.orderType === "delivery"
                          ? "#8b5cf6"
                          : "#ea580c",
                      color: "#ffffff",
                      fontSize: 11,
                      fontWeight: 900,
                      padding: "4px 8px",
                      borderRadius: "5px",
                      textTransform: "uppercase",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {displayState.orderType === "dine_in" ? (
                      <>
                        <UtensilsCrossed size={12} />
                        DINE-IN {displayState.tableNumber ? `• TABLE ${displayState.tableNumber}` : ""}
                      </>
                    ) : displayState.orderType === "delivery" ? (
                      <>
                        <Bike size={12} />
                        DELIVERY ORDER
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={12} />
                        TAKEAWAY COUNTER
                      </>
                    )}
                  </span>

                  <span style={{ fontSize: 13, color: "#a1a1aa", fontWeight: 700 }}>
                    {displayState.items.length} {displayState.items.length === 1 ? "Item" : "Items"} in Cart
                  </span>
                </div>

                {isCompleted && (
                  <span
                    style={{
                      background: "#22c55e",
                      color: "#000000",
                      fontSize: 11,
                      fontWeight: 900,
                      padding: "4px 10px",
                      borderRadius: "5px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <CheckCircle2 size={13} />
                    ORDER PAID & SENT TO KITCHEN
                  </span>
                )}
              </div>

              {/* Items List Table / Scrollable Container */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "16px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {displayState.items.map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#1c1c1f",
                      border: "1px solid #2e2e33",
                      borderRadius: "5px",
                      padding: "14px 18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <span
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "5px",
                          background: "#ea580c",
                          color: "#ffffff",
                          fontSize: 14,
                          fontWeight: 900,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {it.qty}×
                      </span>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#ffffff" }}>{it.name}</div>
                        {it.detail && (
                          <div style={{ fontSize: 12, color: "#ea580c", fontWeight: 700, marginTop: 2 }}>
                            ✨ {it.detail}
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>
                          Unit Price: {curr} {Number(it.price).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 17, fontWeight: 900, color: "#ffffff" }}>
                        {curr} {(Number(it.price) * Number(it.qty)).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Notification Alert */}
              <div
                style={{
                  padding: "12px 24px",
                  background: "#18181b",
                  borderTop: "1px solid #27272a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "#a1a1aa",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={14} color="#f97316" />
                  <span>Items update dynamically as cashier scans and punches</span>
                </div>
                <span style={{ fontWeight: 700, color: "#22c55e" }}>Live Cloud Synchronized</span>
              </div>
            </div>

            {/* Right Column: Grand Total Summary & Dynamic Pakistani QR Pay */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                background: "#18181b",
                padding: "20px 28px",
                overflowY: "auto",
              }}
            >
              {/* Payment Summary Box */}
              <div
                style={{
                  background: "#202024",
                  border: "1px solid #333338",
                  borderRadius: "5px",
                  padding: "18px 20px",
                  marginBottom: 18,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#a1a1aa", fontSize: 13, fontWeight: 600 }}>Subtotal</span>
                  <span style={{ color: "#ffffff", fontSize: 14, fontWeight: 700 }}>
                    {curr} {displayState.subtotal.toLocaleString()}
                  </span>
                </div>

                {displayState.discount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: "#22c55e", fontSize: 13, fontWeight: 700 }}>Discount Applied</span>
                    <span style={{ color: "#22c55e", fontSize: 14, fontWeight: 800 }}>
                      - {curr} {displayState.discount.toLocaleString()}
                    </span>
                  </div>
                )}

                {displayState.tax > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: "#a1a1aa", fontSize: 13, fontWeight: 600 }}>GST / Sales Tax</span>
                    <span style={{ color: "#ffffff", fontSize: 14, fontWeight: 700 }}>
                      + {curr} {displayState.tax.toLocaleString()}
                    </span>
                  </div>
                )}

                {displayState.deliveryFee > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: "#a1a1aa", fontSize: 13, fontWeight: 600 }}>Delivery Charge</span>
                    <span style={{ color: "#ffffff", fontSize: 14, fontWeight: 700 }}>
                      + {curr} {displayState.deliveryFee.toLocaleString()}
                    </span>
                  </div>
                )}

                <div
                  style={{
                    height: 1,
                    background: "#333338",
                    margin: "12px 0 14px",
                  }}
                />

                {/* Grand Total Bar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 900,
                        color: "#f97316",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        display: "block",
                      }}
                    >
                      PAYABLE AMOUNT
                    </span>
                    <span style={{ fontSize: 11, color: "#71717a" }}>Exact Net Grand Total</span>
                  </div>

                  <div
                    style={{
                      fontSize: 34,
                      fontWeight: 900,
                      color: "#ffffff",
                      letterSpacing: "-0.5px",
                      textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                    }}
                  >
                    {curr} {displayState.total.toLocaleString()}
                  </div>
                </div>

                {/* Cash Tendered & Change Return Badges (if entered) */}
                {displayState.cashTendered && displayState.cashTendered > 0 && (
                  <div
                    style={{
                      marginTop: 14,
                      padding: "10px 12px",
                      background: "#18181b",
                      borderRadius: "5px",
                      border: "1px solid #3f3f46",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 11, color: "#a1a1aa", fontWeight: 700 }}>CASH TENDERED:</span>
                      <div style={{ fontSize: 15, fontWeight: 900, color: "#ffffff" }}>
                        {curr} {displayState.cashTendered.toLocaleString()}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 800 }}>CHANGE DUE:</span>
                      <div style={{ fontSize: 16, fontWeight: 900, color: "#22c55e" }}>
                        {curr} {(displayState.changeDue ?? 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic QR Pay Tabs */}
              <div
                style={{
                  flex: 1,
                  background: "#202024",
                  border: "1px solid #333338",
                  borderRadius: "5px",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* QR Method Tabs */}
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    background: "#18181b",
                    padding: 4,
                    borderRadius: "5px",
                    border: "1px solid #333338",
                    marginBottom: 16,
                    width: "100%",
                    maxWidth: 360,
                  }}
                >
                  {[
                    { id: "raast", label: "⚡ Raast P2P / QR" },
                    { id: "easypaisa", label: "🟢 EasyPaisa" },
                    { id: "jazzcash", label: "🔴 JazzCash" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setPaymentTab(tab.id as any)}
                      style={{
                        flex: 1,
                        padding: "7px 4px",
                        borderRadius: "5px",
                        border: "none",
                        background: paymentTab === tab.id ? "#ea580c" : "transparent",
                        color: paymentTab === tab.id ? "#ffffff" : "#a1a1aa",
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* QR Code Graphic Frame */}
                <div
                  style={{
                    background: "#ffffff",
                    padding: 12,
                    borderRadius: "5px",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={qrImageUrl}
                    alt="Scan to Pay"
                    style={{
                      width: 170,
                      height: 170,
                      display: "block",
                      imageRendering: "crisp-edges",
                    }}
                  />
                </div>

                {/* Instructions & Account details */}
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#ffffff", marginBottom: 3 }}>
                    Scan & Pay with Any Banking App
                  </div>
                  <div style={{ fontSize: 11, color: "#a1a1aa" }}>
                    {paymentTab === "raast" && (
                      <>
                        Raast ID / IBAN: <strong style={{ color: "#ffffff" }}>{raastId}</strong>
                      </>
                    )}
                    {paymentTab === "easypaisa" && (
                      <>
                        EasyPaisa Account: <strong style={{ color: "#22c55e" }}>{paymentPhone}</strong>
                      </>
                    )}
                    {paymentTab === "jazzcash" && (
                      <>
                        JazzCash Account: <strong style={{ color: "#f87171" }}>{paymentPhone}</strong>
                      </>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "#71717a", marginTop: 4 }}>
                    Title: <strong>{displayState.shopName}</strong> • Exact Bill: {curr}{" "}
                    {displayState.total.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Discreet Cashier Demo Controls Drawer (For Testing) ─────────────── */}
      <div
        style={{
          background: "#18181b",
          borderTop: "1px solid #27272a",
          padding: "6px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11,
          color: "#71717a",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setShowDemoControls(!showDemoControls)}
            style={{
              background: showDemoControls ? "#ea580c" : "#27272a",
              color: showDemoControls ? "#ffffff" : "#a1a1aa",
              border: "1px solid #3f3f46",
              borderRadius: "5px",
              padding: "4px 8px",
              fontSize: 10,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {showDemoControls ? "Hide Cashier Test Controls" : "🛠️ Test Cashier Simulator"}
          </button>
          <span>Turn any tablet or iPad into an enterprise counter screen.</span>
        </div>

        {showDemoControls && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => handleSimulateSampleCart("combo")}
              style={{
                background: "#27272a",
                color: "#ffffff",
                border: "1px solid #3f3f46",
                borderRadius: "5px",
                padding: "4px 8px",
                fontSize: 10,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              ➕ Punch Combo Meal
            </button>
            <button
              onClick={() => handleSimulateSampleCart("single")}
              style={{
                background: "#27272a",
                color: "#ffffff",
                border: "1px solid #3f3f46",
                borderRadius: "5px",
                padding: "4px 8px",
                fontSize: 10,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              ➕ Punch 2× Pizzas
            </button>
            <button
              onClick={handleSimulatePaid}
              style={{
                background: "#059669",
                color: "#ffffff",
                border: "1px solid #10b981",
                borderRadius: "5px",
                padding: "4px 8px",
                fontSize: 10,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              ✅ Simulate Paid
            </button>
            <button
              onClick={handleResetIdle}
              style={{
                background: "#3f3f46",
                color: "#ffffff",
                border: "none",
                borderRadius: "5px",
                padding: "4px 8px",
                fontSize: 10,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              🔄 Reset To Idle
            </button>
          </div>
        )}

        <span>Powered by SoleWhat POS 2.0</span>
      </div>
    </div>
  );
}
