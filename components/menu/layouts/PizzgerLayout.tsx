"use client";

import React, { useState, useMemo, useEffect } from "react";
import type { Category, Product, ProductVariation, ExtraTopping } from "@/types/menu";
import type { ShopSettings } from "@/lib/menu-data";
import { useCart } from "../CartContext";
import {
  Search,
  ShoppingBag,
  Menu as MenuIcon,
  X,
  ChevronRight,
  Flame,
  Clock,
  ShieldCheck,
  Plus,
  Trash2,
  Check,
  ArrowRight,
  Sparkles,
  Crown,
  CheckCircle2,
  Phone,
  MapPin,
} from "lucide-react";

// Inline icons for reliability
const Minus = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const Star = ({ size = 14, fill = "currentColor", color = "currentColor" }: { size?: number; fill?: string; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const Heart = ({ size = 18, fill = "none", color = "currentColor" }: { size?: number; fill?: string; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const ChevronLeft = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const Truck = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="10" x="1" y="5" rx="1" />
    <path d="M15 9h4l3 3v3h-7V9Z" />
    <circle cx="5.5" cy="17.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);

const ShoppingBasket = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 11-1 9" />
    <path d="m19 11-2 9" />
    <path d="M2 11h20" />
    <path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8c.9 0 1.8-.7 2-1.6l1.6-7.4" />
    <path d="m5 11 4-7" />
    <path d="m19 11-4-7" />
    <path d="m9 11 1 9" />
  </svg>
);

interface PizzgerLayoutProps {
  categories: Category[];
  products: Product[];
  categoriesError: string | null;
  productsError: string | null;
  categoriesTableMissing: boolean;
  productsTableMissing: boolean;
  settings: ShopSettings;
  initialTableNumber?: string;
  initialOrderType?: "dine_in" | "takeaway" | "delivery";
  isDedicatedTableRoute?: boolean;
  verifiedTable?: string;
}

// Fallback high quality artisan food images
const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&auto=format&fit=crop&q=80";
const DEFAULT_PIZZA_IMG =
  "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=700&auto=format&fit=crop&q=80";

// Category icon mapper
function getCategoryIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("pizza")) return "🍕";
  if (n.includes("burger")) return "🍔";
  if (n.includes("side") || n.includes("fries") || n.includes("appetizer")) return "🍟";
  if (n.includes("drink") || n.includes("beverage")) return "🥤";
  if (n.includes("deal") || n.includes("combo")) return "🏷️";
  if (n.includes("dessert") || n.includes("sweet")) return "🍰";
  if (n.includes("pasta")) return "🍝";
  return "🍽️";
}

export default function PizzgerLayout({
  categories,
  products,
  categoriesError,
  productsError,
  categoriesTableMissing,
  productsTableMissing,
  settings,
  initialTableNumber = "",
  initialOrderType,
  verifiedTable,
}: PizzgerLayoutProps) {
  const { items, totalItems, totalPrice, formatPrice, addItem, removeItem, setQty, clearCart } =
    useCart();

  // State
  const [activeCategoryId, setActiveCategoryId] = useState<string | number | null>(
    categories.length > 0 ? categories[0].id : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"All" | "Veg" | "Non-Veg" | "Special">("All");

  // Overlays
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailQty, setDetailQty] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<ExtraTopping[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [detailAddedFeedback, setDetailAddedFeedback] = useState(false);

  // Checkout modal
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">(
    initialOrderType === "dine_in" ? "pickup" : "delivery"
  );
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [confirmedOrderId, setConfirmedOrderId] = useState<string>("");
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);

  // Popular items (e.g. top products or deals)
  const popularItems = useMemo(() => {
    return products.slice(0, 6);
  }, [products]);

  // Active Category details
  const currentCategory = useMemo(() => {
    return categories.find((c) => c.id === activeCategoryId) || categories[0];
  }, [categories, activeCategoryId]);

  // Filtered Products for category view
  const categoryProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        activeCategoryId === null || p.category_id === activeCategoryId;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q));

      let matchesDiet = true;
      if (activeFilter === "Veg") {
        matchesDiet = Boolean(
          p.name.toLowerCase().includes("veg") ||
          (p.description && p.description.toLowerCase().includes("veg")) ||
          (p.badge && p.badge.toLowerCase().includes("veg"))
        );
      } else if (activeFilter === "Non-Veg") {
        matchesDiet = Boolean(
          !p.name.toLowerCase().includes("veg") ||
          p.name.toLowerCase().includes("chicken") ||
          p.name.toLowerCase().includes("beef") ||
          p.name.toLowerCase().includes("meat")
        );
      } else if (activeFilter === "Special") {
        matchesDiet = Boolean(p.is_deal === true || !!p.badge);
      }

      return matchesCategory && matchesSearch && matchesDiet;
    });
  }, [products, activeCategoryId, searchQuery, activeFilter]);

  // Open product detail sheet
  const handleOpenDetail = (p: Product) => {
    setSelectedProduct(p);
    setDetailQty(1);
    setSelectedVariation(p.variations && p.variations.length > 0 ? p.variations[0] : null);
    setSelectedToppings([]);
    setDetailAddedFeedback(false);
  };

  // Add from Detail Sheet
  const handleAddFromDetail = () => {
    if (!selectedProduct) return;
    for (let i = 0; i < detailQty; i++) {
      addItem(selectedProduct, undefined, selectedVariation, selectedToppings);
    }
    setDetailAddedFeedback(true);
    setTimeout(() => {
      setDetailAddedFeedback(false);
      setSelectedProduct(null);
    }, 600);
  };

  // Quick add to cart from list / popular cards
  const handleQuickAdd = (p: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (p.variations && p.variations.length > 0) {
      handleOpenDetail(p);
    } else {
      addItem(p);
    }
  };

  // Calculations for checkout
  const deliveryFee = deliveryType === "delivery" ? 100 : 0;
  const taxAmount = Math.round(totalPrice * 0.1);
  const grandTotal = totalPrice + deliveryFee + taxAmount;

  const handlePlaceOrder = () => {
    if (!customerPhone.trim()) {
      alert("Please provide your contact number.");
      return;
    }
    if (deliveryType === "delivery" && !customerAddress.trim()) {
      alert("Please enter your delivery address.");
      return;
    }

    const orderNum = "PG" + Math.floor(100000 + Math.random() * 900000);
    setConfirmedOrderId(orderNum);
    setCheckoutStep(3);

    // If WhatsApp configured or standard URL
    if (settings.whatsapp_session_id || true) {
      const summary = items
        .map(
          (i) =>
            `• ${i.quantity}x ${i.product.name} ${
              i.selectedVariation ? `(${i.selectedVariation.name})` : ""
            } - ${formatPrice(
              (i.selectedVariation?.price ?? i.product.price ?? 0) * i.quantity
            )}`
        )
        .join("\n");

      const waMsg = encodeURIComponent(
        `🍕 *NEW PIZZGER ORDER #${orderNum}*\n` +
          `--------------------------\n` +
          `*Customer:* ${customerName || "Guest"}\n` +
          `*Phone:* ${customerPhone}\n` +
          `*Type:* ${deliveryType.toUpperCase()}\n` +
          (deliveryType === "delivery" ? `*Address:* ${customerAddress}\n` : "") +
          `--------------------------\n` +
          `${summary}\n` +
          `--------------------------\n` +
          `*Subtotal:* ${formatPrice(totalPrice)}\n` +
          (deliveryFee > 0 ? `*Delivery Fee:* ${formatPrice(deliveryFee)}\n` : "") +
          `*Tax (10%):* ${formatPrice(taxAmount)}\n` +
          `*Grand Total:* ${formatPrice(grandTotal)}\n` +
          `*Payment:* ${paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}\n` +
          (specialInstructions ? `*Notes:* ${specialInstructions}\n` : "")
      );

      // WhatsApp send trigger can run in background
      if (settings.whatsapp_session_id) {
        window.open(`https://wa.me/?text=${waMsg}`, "_blank");
      }
    }
  };

  const handleCloseConfirmation = () => {
    setCheckoutOpen(false);
    setCheckoutStep(1);
    clearCart();
  };

  const shopTitle = settings.shop_name || "Pizzger";
  const heroTitle = settings.hero_title || "Handcrafted Pizzas.";
  const heroHighlight = settings.hero_title_highlight || "Fresh Every Order.";
  const heroSub =
    settings.hero_subtitle || "Fresh stone-baked pizzas, burgers & drinks prepared to order.";
  const heroBadge = settings.hero_badge_text || "HOT & FRESH";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fafaf9",
        color: "#0f172a",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ─── 1. PIZZGER TOP NAVBAR (Screen 1) ─── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #f1f5f9",
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt={shopTitle}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                objectFit: "cover",
                border: "1.5px solid #f97316",
              }}
            />
          ) : (
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "linear-gradient(135deg, #ea580c, #f97316)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(234, 88, 12, 0.3)",
              }}
            >
              <span style={{ fontSize: "20px" }}>🍕</span>
            </div>
          )}

          <div>
            <div style={{ fontSize: "17px", fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>
              {shopTitle}
            </div>
            <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 600 }}>
              Artisan Kitchen &amp; Fresh Pizza
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            aria-label="Search items"
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              color: "#334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Search size={18} />
          </button>

          {/* Cart Icon with badge */}
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label="View Cart"
            style={{
              position: "relative",
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              color: "#334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ShoppingBag size={18} />
            {totalItems > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "#ea580c",
                  color: "#ffffff",
                  fontSize: "10px",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(234, 88, 12, 0.4)",
                }}
              >
                {totalItems}
              </span>
            )}
          </button>

          {/* Menu Drawer Toggle */}
          <button
            type="button"
            onClick={() => setInfoDrawerOpen(true)}
            aria-label="Store details"
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              color: "#334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <MenuIcon size={18} />
          </button>
        </div>
      </header>

      {/* Real-time search dropdown if active */}
      {showSearch && (
        <div style={{ padding: "10px 18px", background: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search handcrafted pizzas, burgers, drinks..."
              style={{
                width: "100%",
                padding: "10px 38px 10px 14px",
                borderRadius: 10,
                border: "1.5px solid #ea580c",
                fontSize: "14px",
                outline: "none",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      <main style={{ maxWidth: 1120, margin: "0 auto", paddingBottom: "100px" }}>
        {/* ─── 2. ARTISAN DARK HERO SECTION (Screen 1) ─── */}
        <section
          style={{
            margin: "16px",
            borderRadius: 24,
            background: "linear-gradient(135deg, #090d16 0%, #131b2e 100%)",
            color: "#ffffff",
            padding: "28px 22px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 14px 34px -10px rgba(15, 23, 42, 0.4)",
          }}
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            style={{
              position: "absolute",
              top: "-20%",
              right: "-10%",
              width: "350px",
              height: "350px",
              background: "radial-gradient(circle, rgba(234, 88, 12, 0.25) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              alignItems: "center",
              gap: "24px",
              position: "relative",
              zIndex: 2,
            }}
          >
            {/* Left Copy */}
            <div>
              {/* Badge: HOT & FRESH */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#ea580c",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 900,
                  letterSpacing: "0.06em",
                  padding: "4px 10px",
                  borderRadius: 6,
                  marginBottom: "14px",
                  textTransform: "uppercase",
                }}
              >
                <Flame size={13} fill="#ffffff" />
                <span>{heroBadge}</span>
              </div>

              {/* Title & Highlight */}
              <h1
                style={{
                  fontSize: "clamp(26px, 4vw, 36px)",
                  fontWeight: 900,
                  lineHeight: 1.15,
                  margin: "0 0 10px",
                  color: "#ffffff",
                }}
              >
                {heroTitle} <br />
                <span style={{ color: "#f97316" }}>{heroHighlight}</span>
              </h1>

              {/* Subtitle */}
              <p
                style={{
                  fontSize: "13px",
                  color: "#94a3b8",
                  lineHeight: 1.5,
                  margin: "0 0 20px",
                  maxWidth: "420px",
                }}
              >
                {heroSub}
              </p>

              {/* CTA Button: Explore Menu -> */}
              <a
                href="#menu-section"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#f59e0b",
                  color: "#0f172a",
                  fontSize: "13px",
                  fontWeight: 800,
                  padding: "12px 20px",
                  borderRadius: 10,
                  textDecoration: "none",
                  boxShadow: "0 4px 16px rgba(245, 158, 11, 0.35)",
                  transition: "transform 0.2s",
                }}
                className="hover:scale-105"
              >
                <span>Explore Menu</span>
                <ArrowRight size={15} />
              </a>

              {/* Feature Chips */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "14px",
                  marginTop: "24px",
                  paddingTop: "18px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#cbd5e1" }}>
                  <Clock size={14} color="#f97316" />
                  <span>10-15 Min Stone Bake</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#cbd5e1" }}>
                  <ShieldCheck size={14} color="#f97316" />
                  <span>100% Real Whole Cheese</span>
                </div>
              </div>
            </div>

            {/* Right: Floating Pizza Image */}
            <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
              <img
                src={DEFAULT_HERO_IMAGE}
                alt="Handcrafted Artisan Pizza"
                style={{
                  width: "100%",
                  maxWidth: "340px",
                  height: "230px",
                  borderRadius: "20px",
                  objectFit: "cover",
                  boxShadow: "0 16px 36px rgba(0, 0, 0, 0.5)",
                  border: "2px solid rgba(255, 255, 255, 0.1)",
                }}
              />
            </div>
          </div>
        </section>

        {/* ─── 3. CATEGORY ICONS CAROUSEL (Screen 1) ─── */}
        <section style={{ padding: "0 16px 8px" }} id="menu-section">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              overflowX: "auto",
              paddingBottom: "8px",
              scrollbarWidth: "none",
            }}
          >
            {categories.map((cat) => {
              const isActive = activeCategoryId === cat.id;
              const icon = getCategoryIcon(cat.name);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategoryId(cat.id);
                    setActiveFilter("All");
                  }}
                  style={{
                    flexShrink: 0,
                    minWidth: "78px",
                    padding: "12px 10px",
                    borderRadius: 16,
                    border: isActive ? "2px solid #ea580c" : "1.5px solid #f1f5f9",
                    background: isActive ? "#fff7ed" : "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    boxShadow: isActive ? "0 6px 16px rgba(234, 88, 12, 0.15)" : "0 2px 6px rgba(0,0,0,0.02)",
                    transition: "all 0.2s",
                  }}
                >
                  <span style={{ fontSize: "24px" }}>{icon}</span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: isActive ? 800 : 600,
                      color: isActive ? "#ea580c" : "#475569",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ─── 4. POPULAR ITEMS SECTION (Screen 1) ─── */}
        {popularItems.length > 0 && (
          <section style={{ padding: "16px 16px 24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Crown size={18} color="#ea580c" />
                <h2 style={{ fontSize: "17px", fontWeight: 900, color: "#0f172a", margin: 0 }}>
                  Popular Items
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("category-listing");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ea580c",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>View All</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Popular Items Horizontal Scroll */}
            <div
              style={{
                display: "flex",
                gap: "14px",
                overflowX: "auto",
                paddingBottom: "8px",
                scrollbarWidth: "none",
              }}
            >
              {popularItems.map((prod, idx) => {
                const img = prod.image_url || DEFAULT_PIZZA_IMG;
                const badgeText = prod.badge || (idx === 0 ? "BEST SELLER" : idx === 1 ? "NEW" : undefined);
                const isGreen = badgeText === "NEW";

                return (
                  <div
                    key={prod.id}
                    onClick={() => handleOpenDetail(prod)}
                    style={{
                      flexShrink: 0,
                      width: "180px",
                      background: "#ffffff",
                      borderRadius: 18,
                      border: "1px solid #f1f5f9",
                      overflow: "hidden",
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      position: "relative",
                    }}
                  >
                    {/* Image & Badge */}
                    <div style={{ position: "relative", width: "100%", height: "120px", background: "#f8fafc" }}>
                      <img
                        src={img}
                        alt={prod.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      {badgeText && (
                        <span
                          style={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            fontSize: "9px",
                            fontWeight: 900,
                            padding: "3px 6px",
                            borderRadius: 4,
                            background: isGreen ? "#16a34a" : "#ea580c",
                            color: "#ffffff",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {badgeText}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ padding: "10px 12px 14px" }}>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 800,
                          color: "#0f172a",
                          lineHeight: 1.2,
                          marginBottom: "3px",
                        }}
                      >
                        {prod.name}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#94a3b8",
                          marginBottom: "10px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {prod.description || "Freshly baked artisan specialty"}
                      </div>

                      {/* Price & Add Button */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "14px", fontWeight: 900, color: "#ea580c" }}>
                          {formatPrice(prod.price ?? 0)}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleQuickAdd(prod, e)}
                          aria-label={`Add ${prod.name} to cart`}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            background: "#ea580c",
                            border: "none",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(234, 88, 12, 0.35)",
                          }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── 5. CATEGORY DETAILS & ROW-CARD LISTING (Screen 2) ─── */}
        <section style={{ padding: "8px 16px" }} id="category-listing">
          {/* Category Banner Card */}
          <div
            style={{
              borderRadius: 20,
              background: "linear-gradient(135deg, #182234 0%, #0d121c 100%)",
              color: "#ffffff",
              padding: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
            }}
          >
            <div>
              <h3 style={{ fontSize: "20px", fontWeight: 900, margin: "0 0 4px", color: "#ffffff" }}>
                {currentCategory ? currentCategory.name : "All Items"}
              </h3>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                {currentCategory?.description || "Freshly baked. Full of authentic artisan flavor."}
              </p>
            </div>

            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid rgba(255,255,255,0.2)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              }}
            >
              <img
                src={DEFAULT_PIZZA_IMG}
                alt="Category"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          </div>

          {/* Sub-Filters: All, Veg, Non-Veg, Special */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            {(["All", "Veg", "Non-Veg", "Special"] as const).map((filter) => {
              const active = activeFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    fontSize: "12px",
                    fontWeight: 700,
                    border: "none",
                    background: active ? "#ea580c" : "#f1f5f9",
                    color: active ? "#ffffff" : "#64748b",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          {/* Vertical List of Items (Row-based design) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {categoryProducts.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 16px",
                  background: "#ffffff",
                  borderRadius: 16,
                  color: "#94a3b8",
                }}
              >
                <p style={{ fontSize: "14px", fontWeight: 600 }}>No items found in this section.</p>
              </div>
            ) : (
              categoryProducts.map((p, idx) => {
                const img = p.image_url || DEFAULT_PIZZA_IMG;
                const badge = p.badge || (idx === 0 ? "BEST SELLER" : idx === 1 ? "NEW" : undefined);
                const isGreen = badge === "NEW" || badge === "VEG";

                // Count in cart
                const cartCount = items
                  .filter((i) => i.product.id === p.id)
                  .reduce((sum, i) => sum + i.quantity, 0);

                return (
                  <div
                    key={p.id}
                    onClick={() => handleOpenDetail(p)}
                    style={{
                      background: "#ffffff",
                      borderRadius: 18,
                      border: "1px solid #f1f5f9",
                      padding: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      cursor: "pointer",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                      transition: "transform 0.15s, box-shadow 0.15s",
                    }}
                    className="hover:scale-[1.01]"
                  >
                    {/* Left 90x90 Image with Badge */}
                    <div
                      style={{
                        position: "relative",
                        width: "86px",
                        height: "86px",
                        borderRadius: 14,
                        overflow: "hidden",
                        flexShrink: 0,
                        background: "#f8fafc",
                      }}
                    >
                      <img src={img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {badge && (
                        <span
                          style={{
                            position: "absolute",
                            top: 6,
                            left: 6,
                            fontSize: "8px",
                            fontWeight: 900,
                            padding: "2px 5px",
                            borderRadius: 4,
                            background: isGreen ? "#16a34a" : "#ea580c",
                            color: "#ffffff",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {badge}
                        </span>
                      )}
                    </div>

                    {/* Middle Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 800,
                          color: "#0f172a",
                          marginBottom: "4px",
                          lineHeight: 1.2,
                        }}
                      >
                        {p.name}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#94a3b8",
                          marginBottom: "8px",
                          lineHeight: 1.3,
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {p.description || "Fresh stone-baked with premium toppings"}
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 900, color: "#ea580c" }}>
                        {formatPrice(p.price ?? 0)}
                      </div>
                    </div>

                    {/* Right: Round Orange Add Button or Count */}
                    <div style={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                      {cartCount > 0 ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "#fff7ed",
                            border: "1.5px solid #ea580c",
                            borderRadius: 20,
                            padding: "3px 8px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              const cartItem = items.find((i) => i.product.id === p.id);
                              if (cartItem) {
                                setQty(
                                  `${p.id}_${cartItem.selectedVariation?.name || "base"}_`,
                                  cartCount - 1
                                );
                              }
                            }}
                            style={{
                              border: "none",
                              background: "none",
                              color: "#ea580c",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            <Minus size={13} />
                          </button>
                          <span style={{ fontSize: "12px", fontWeight: 800, color: "#ea580c" }}>
                            {cartCount}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleQuickAdd(p, e)}
                            style={{
                              border: "none",
                              background: "none",
                              color: "#ea580c",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleQuickAdd(p, e)}
                          aria-label={`Add ${p.name}`}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "#ea580c",
                            border: "none",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(234, 88, 12, 0.3)",
                            transition: "transform 0.15s",
                          }}
                          className="hover:scale-110 active:scale-95"
                        >
                          <Plus size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* ─── 6. FLOATING BOTTOM CART BAR (Mobile friendly) ─── */}
      {totalItems > 0 && !cartOpen && !checkoutOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            left: 0,
            right: 0,
            zIndex: 40,
            padding: "0 20px",
            maxWidth: 500,
            margin: "0 auto",
          }}
        >
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            style={{
              width: "100%",
              background: "#ea580c",
              color: "#ffffff",
              borderRadius: 16,
              padding: "14px 20px",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 10px 28px rgba(234, 88, 12, 0.45)",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  background: "rgba(255,255,255,0.25)",
                  padding: "4px 9px",
                  borderRadius: 10,
                  fontSize: "12px",
                  fontWeight: 900,
                }}
              >
                {totalItems}
              </span>
              <span style={{ fontSize: "14px", fontWeight: 800 }}>View Your Cart</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "15px", fontWeight: 900 }}>
              <span>{formatPrice(totalPrice)}</span>
              <ArrowRight size={16} />
            </div>
          </button>
        </div>
      )}

      {/* ─── 7. PRODUCT DETAIL MODAL / SHEET (Screen 4) ─── */}
      {selectedProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "520px",
              maxHeight: "92vh",
              overflowY: "auto",
              background: "#ffffff",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: "20px 20px 32px",
              position: "relative",
              boxShadow: "0 -10px 40px rgba(0,0,0,0.25)",
            }}
          >
            {/* Top Bar: Back & Favorite */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "14px",
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#f1f5f9",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <ChevronLeft size={18} color="#0f172a" />
              </button>

              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#f1f5f9",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Heart size={18} fill={isFavorite ? "#ea580c" : "none"} color={isFavorite ? "#ea580c" : "#64748b"} />
              </button>
            </div>

            {/* Product Image */}
            <div
              style={{
                width: "100%",
                height: "230px",
                borderRadius: 20,
                overflow: "hidden",
                background: "#0f172a",
                position: "relative",
                marginBottom: "14px",
              }}
            >
              <img
                src={selectedProduct.image_url || DEFAULT_PIZZA_IMG}
                alt={selectedProduct.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <span
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  background: "#ea580c",
                  color: "#ffffff",
                  fontSize: "10px",
                  fontWeight: 900,
                  padding: "4px 8px",
                  borderRadius: 6,
                }}
              >
                {selectedProduct.badge || "BEST SELLER"}
              </span>
            </div>

            {/* Title, Rating & Description */}
            <h2 style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", margin: "0 0 4px" }}>
              {selectedProduct.name}
            </h2>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 10px", lineHeight: 1.5 }}>
              {selectedProduct.description ||
                "A perfect blend of pepperoni, chicken, beef, mozzarella and our signature artisan sauce."}
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#f59e0b", fontSize: "12px", fontWeight: 800 }}>
                <Star size={14} fill="#f59e0b" />
                <span>4.8</span>
              </div>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>(124 reviews)</span>
            </div>

            {/* Price */}
            <div style={{ fontSize: "22px", fontWeight: 900, color: "#ea580c", marginBottom: "18px" }}>
              {formatPrice(
                (selectedVariation ? selectedVariation.price : (selectedProduct.price ?? 0)) +
                  selectedToppings.reduce((sum, t) => sum + (t.price || 0), 0)
              )}
            </div>

            {/* Size Selector */}
            {selectedProduct.variations && selectedProduct.variations.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
                  Select Size
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {selectedProduct.variations.map((v) => {
                    const isSelected = selectedVariation?.name === v.name;
                    return (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => setSelectedVariation(v)}
                        style={{
                          flex: 1,
                          padding: "10px",
                          borderRadius: 12,
                          border: isSelected ? "2px solid #ea580c" : "1px solid #e2e8f0",
                          background: isSelected ? "#ea580c" : "#f8fafc",
                          color: isSelected ? "#ffffff" : "#334155",
                          fontSize: "12px",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        {v.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Extra Toppings */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
                Add Extra Toppings
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { name: "Extra Cheese", price: 150 },
                  { name: "Olives", price: 80 },
                  { name: "Mushrooms", price: 80 },
                  { name: "Jalapenos", price: 60 },
                ].map((top) => {
                  const checked = selectedToppings.some((t) => t.name === top.name);
                  return (
                    <label
                      key={top.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderRadius: 12,
                        background: checked ? "#fff7ed" : "#f8fafc",
                        border: checked ? "1.5px solid #ea580c" : "1px solid #e2e8f0",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setSelectedToppings((prev) => prev.filter((t) => t.name !== top.name));
                            } else {
                              setSelectedToppings((prev) => [...prev, top]);
                            }
                          }}
                          style={{ accentColor: "#ea580c", width: 16, height: 16 }}
                        />
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>
                          {top.name}
                        </span>
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: 800, color: "#ea580c" }}>
                        +{formatPrice(top.price)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Quantity Stepper & Add Button */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  background: "#f1f5f9",
                  borderRadius: 14,
                  padding: "8px 14px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setDetailQty(Math.max(1, detailQty - 1))}
                  style={{ border: "none", background: "none", cursor: "pointer", color: "#334155" }}
                >
                  <Minus size={16} />
                </button>
                <span style={{ fontSize: "14px", fontWeight: 800, minWidth: "16px", textAlign: "center" }}>
                  {detailQty}
                </span>
                <button
                  type="button"
                  onClick={() => setDetailQty(detailQty + 1)}
                  style={{ border: "none", background: "none", cursor: "pointer", color: "#334155" }}
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddFromDetail}
                style={{
                  flex: 1,
                  background: detailAddedFeedback ? "#16a34a" : "#ea580c",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 800,
                  padding: "14px",
                  borderRadius: 14,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 16px rgba(234, 88, 12, 0.4)",
                  transition: "background 0.2s",
                }}
              >
                {detailAddedFeedback ? (
                  <>
                    <Check size={18} />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <span>
                    Add to Cart —{" "}
                    {formatPrice(
                      ((selectedVariation ? selectedVariation.price : (selectedProduct.price ?? 0)) +
                        selectedToppings.reduce((sum, t) => sum + (t.price || 0), 0)) *
                        detailQty
                    )}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 8. YOUR CART DRAWER (Screen 3) ─── */}
      {cartOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 70,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => setCartOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "440px",
              height: "100%",
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "-10px 0 40px rgba(0,0,0,0.15)",
            }}
          >
            {/* Cart Header */}
            <div
              style={{
                padding: "20px 22px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <ShoppingBag size={20} color="#ea580c" />
                <div>
                  <h3 style={{ fontSize: "17px", fontWeight: 900, color: "#0f172a", margin: 0 }}>
                    Your Cart
                  </h3>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>{totalItems} items</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCartOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#f1f5f9",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px" }}>
              {items.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                  <ShoppingBag size={48} style={{ opacity: 0.3, marginBottom: "12px" }} />
                  <p style={{ fontSize: "14px", fontWeight: 700 }}>Your cart is empty</p>
                  <p style={{ fontSize: "12px" }}>Add delicious handcrafted pizzas to get started.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {items.map((item) => {
                    const key = `${item.product.id}_${item.selectedVariation?.name || "base"}_`;
                    const itemUnitPrice =
                      (item.selectedVariation ? item.selectedVariation.price : (item.product.price ?? 0)) +
                      (item.selectedToppings || []).reduce((sum, t) => sum + (t.price || 0), 0);

                    return (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          paddingBottom: "14px",
                          borderBottom: "1px solid #f8fafc",
                        }}
                      >
                        <img
                          src={item.product.image_url || DEFAULT_PIZZA_IMG}
                          alt={item.product.name}
                          style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover" }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>
                            {item.product.name}
                          </div>
                          <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
                            {item.selectedVariation?.name || "Regular"}
                          </div>
                          <div style={{ fontSize: "13px", fontWeight: 800, color: "#ea580c" }}>
                            {formatPrice(itemUnitPrice)}
                          </div>
                        </div>

                        {/* Quantity Counter */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: 10,
                            padding: "4px 8px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setQty(key, item.quantity - 1)}
                            style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b" }}
                          >
                            <Minus size={13} />
                          </button>
                          <span style={{ fontSize: "12px", fontWeight: 800 }}>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQty(key, item.quantity + 1)}
                            style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b" }}
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        {/* Trash */}
                        <button
                          type="button"
                          onClick={() => removeItem(key)}
                          style={{
                            border: "none",
                            background: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            padding: "4px",
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Order Details & Checkout Footer */}
            {items.length > 0 && (
              <div
                style={{
                  padding: "18px 22px",
                  background: "#f8fafc",
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", marginBottom: "10px" }}>
                  Order Details
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>
                  <span>Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>
                  <span>Delivery Fee</span>
                  <span>{formatPrice(deliveryFee)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>
                  <span>Tax (10%)</span>
                  <span>{formatPrice(taxAmount)}</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "16px",
                    fontWeight: 900,
                    color: "#0f172a",
                    paddingTop: "10px",
                    borderTop: "1px dashed #cbd5e1",
                    marginBottom: "16px",
                  }}
                >
                  <span>Total</span>
                  <span style={{ color: "#ea580c" }}>{formatPrice(grandTotal)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutOpen(true);
                  }}
                  style={{
                    width: "100%",
                    background: "#ea580c",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 800,
                    padding: "14px",
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 16px rgba(234, 88, 12, 0.4)",
                    marginBottom: "10px",
                  }}
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={clearCart}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Trash2 size={13} />
                  <span>Clear Cart</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 9. CHECKOUT MODAL (Screen 5) ─── */}
      {checkoutOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => {
            if (checkoutStep !== 3) setCheckoutOpen(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "480px",
              maxHeight: "92vh",
              overflowY: "auto",
              background: checkoutStep === 3 ? "#0f172a" : "#ffffff",
              color: checkoutStep === 3 ? "#ffffff" : "#0f172a",
              borderRadius: 24,
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              position: "relative",
            }}
          >
            {checkoutStep !== 3 ? (
              <>
                {/* Checkout Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
                  <button
                    type="button"
                    onClick={() => setCheckoutOpen(false)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "#f1f5f9",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <h3 style={{ fontSize: "18px", fontWeight: 900, margin: 0 }}>Checkout</h3>
                </div>

                {/* 3 Step Indicator */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "20px",
                    paddingBottom: "16px",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "#ea580c",
                        color: "#ffffff",
                        fontSize: "11px",
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      1
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#ea580c" }}>Delivery</span>
                  </div>
                  <div style={{ height: 1, flex: 1, background: "#e2e8f0", margin: "0 10px" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "#f1f5f9",
                        color: "#64748b",
                        fontSize: "11px",
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      2
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Payment</span>
                  </div>
                  <div style={{ height: 1, flex: 1, background: "#e2e8f0", margin: "0 10px" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "#f1f5f9",
                        color: "#64748b",
                        fontSize: "11px",
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      3
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Confirmation</span>
                  </div>
                </div>

                {/* Delivery Type: Delivery vs Pickup */}
                <div style={{ marginBottom: "18px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 800, color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>
                    Delivery Type
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setDeliveryType("delivery")}
                      style={{
                        padding: "12px",
                        borderRadius: 12,
                        border: deliveryType === "delivery" ? "2px solid #ea580c" : "1px solid #e2e8f0",
                        background: deliveryType === "delivery" ? "#fff7ed" : "#f8fafc",
                        color: deliveryType === "delivery" ? "#ea580c" : "#64748b",
                        fontSize: "13px",
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      <Truck size={16} />
                      <span>Delivery</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType("pickup")}
                      style={{
                        padding: "12px",
                        borderRadius: 12,
                        border: deliveryType === "pickup" ? "2px solid #ea580c" : "1px solid #e2e8f0",
                        background: deliveryType === "pickup" ? "#fff7ed" : "#f8fafc",
                        color: deliveryType === "pickup" ? "#ea580c" : "#64748b",
                        fontSize: "13px",
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      <ShoppingBasket size={16} />
                      <span>Pickup</span>
                    </button>
                  </div>
                </div>

                {/* Customer Details Form */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. John Doe"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                      Contact Number *
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+92 300 1234567"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        outline: "none",
                      }}
                    />
                  </div>

                  {deliveryType === "delivery" && (
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                        Delivery Address *
                      </label>
                      <input
                        type="text"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="House / Street / Area"
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: "1px solid #cbd5e1",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      />
                    </div>
                  )}

                  {/* Payment Method */}
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>
                      Payment Method
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: paymentMethod === "cod" ? "1.5px solid #ea580c" : "1px solid #e2e8f0",
                          background: paymentMethod === "cod" ? "#fff7ed" : "#f8fafc",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === "cod"}
                            onChange={() => setPaymentMethod("cod")}
                            style={{ accentColor: "#ea580c" }}
                          />
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                            Cash on Delivery
                          </span>
                        </div>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>Pay when received</span>
                      </label>

                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: paymentMethod === "online" ? "1.5px solid #ea580c" : "1px solid #e2e8f0",
                          background: paymentMethod === "online" ? "#fff7ed" : "#f8fafc",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === "online"}
                            onChange={() => setPaymentMethod("online")}
                            style={{ accentColor: "#ea580c" }}
                          />
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                            Online Payment
                          </span>
                        </div>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>Card / Wallet</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="e.g. Ring the bell, extra garlic sauce..."
                      rows={2}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Place Order CTA */}
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  style={{
                    width: "100%",
                    background: "#ea580c",
                    color: "#ffffff",
                    fontSize: "15px",
                    fontWeight: 900,
                    padding: "14px",
                    borderRadius: 14,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 6px 20px rgba(234, 88, 12, 0.4)",
                  }}
                >
                  Place Order — {formatPrice(grandTotal)}
                </button>
              </>
            ) : (
              /* ─── 10. ORDER CONFIRMED SCREEN (Screen 6) ─── */
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                {/* Brand Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "24px" }}>
                  <span style={{ fontSize: "22px" }}>🍕</span>
                  <span style={{ fontSize: "18px", fontWeight: 900, color: "#ffffff" }}>{shopTitle}</span>
                </div>

                {/* Green Animated Checkmark */}
                <div
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: "50%",
                    background: "#16a34a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 18px",
                    boxShadow: "0 0 30px rgba(22, 163, 74, 0.4)",
                  }}
                >
                  <Check size={42} color="#ffffff" strokeWidth={3} />
                </div>

                <h2 style={{ fontSize: "22px", fontWeight: 900, color: "#ffffff", margin: "0 0 6px" }}>
                  Order Confirmed!
                </h2>
                <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0 0 6px" }}>
                  Your order has been placed successfully.
                </p>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#f97316", marginBottom: "24px" }}>
                  Order #{confirmedOrderId}
                </div>

                {/* Order Details Card */}
                <div
                  style={{
                    background: "#1e293b",
                    borderRadius: 16,
                    padding: "16px 20px",
                    textAlign: "left",
                    marginBottom: "24px",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>Estimated Delivery Time</span>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#ffffff" }}>25 – 35 Minutes</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>Order Total</span>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#f97316" }}>{formatPrice(grandTotal)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>Payment Method</span>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#ffffff" }}>
                      {paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}
                    </span>
                  </div>
                </div>

                {/* Primary: Track Order */}
                <button
                  type="button"
                  onClick={handleCloseConfirmation}
                  style={{
                    width: "100%",
                    background: "#f59e0b",
                    color: "#0f172a",
                    fontSize: "14px",
                    fontWeight: 900,
                    padding: "14px",
                    borderRadius: 14,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(245, 158, 11, 0.3)",
                    marginBottom: "10px",
                  }}
                >
                  Track Order
                </button>

                {/* Secondary: Back to Home */}
                <button
                  type="button"
                  onClick={handleCloseConfirmation}
                  style={{
                    width: "100%",
                    background: "transparent",
                    color: "#cbd5e1",
                    fontSize: "13px",
                    fontWeight: 700,
                    padding: "12px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.15)",
                    cursor: "pointer",
                    marginBottom: "20px",
                  }}
                >
                  Back to Home
                </button>

                <div style={{ fontSize: "12px", color: "#f97316", fontWeight: 600 }}>
                  Thank you! Enjoy your meal ♡
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 11. STORE INFO DRAWER ─── */}
      {infoDrawerOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 70,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => setInfoDrawerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "340px",
              height: "100%",
              background: "#ffffff",
              padding: "24px",
              boxShadow: "-10px 0 30px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 900, margin: 0 }}>Store Information</h3>
              <button
                type="button"
                onClick={() => setInfoDrawerOpen(false)}
                style={{ width: 32, height: 32, borderRadius: "50%", background: "#f1f5f9", border: "none", cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700 }}>STORE NAME</div>
                <div style={{ fontSize: "15px", fontWeight: 800 }}>{shopTitle}</div>
              </div>

              <div>
                <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700 }}>OPENING HOURS</div>
                <div style={{ fontSize: "14px", fontWeight: 700 }}>
                  {settings.opening_time || "11:00 AM"} – {settings.closing_time || "01:00 AM"}
                </div>
              </div>

              {verifiedTable && (
                <div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700 }}>YOUR TABLE</div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#ea580c" }}>Table #{verifiedTable}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
