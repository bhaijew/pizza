"use client";

import React, { useState, useMemo, useRef } from "react";
import type { Category, Product } from "@/types/menu";
import type { ShopSettings } from "@/lib/menu-data";
import { useCart } from "./CartContext";
import OptimizedImage from "@/components/ui/OptimizedImage";
import {
  Search,
  X,
  Flame,
  Plus,
  UtensilsCrossed,
  Sparkles,
  Phone,
  Clock,
  Check,
  ChevronRight,
} from "lucide-react";

// ─── Native Crisp SVG Icons (Zero missing module errors) ───────────
function PizzaSliceLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 10C17 6 31 6 42 10C42 10 39 15 36 17C28 14 20 14 12 17C9 15 6 10 6 10Z" fill="#f59e0b" />
      <path d="M8.5 13.5C18.5 10 29.5 10 39.5 13.5L24 43L8.5 13.5Z" fill="#ef4444" />
      <path d="M10 14.5C19 11.5 29 11.5 38 14.5L24 41L10 14.5Z" fill="#f97316" />
      <circle cx="24" cy="22" r="3.5" fill="#fef08a" />
      <circle cx="18" cy="18" r="2.5" fill="#fef08a" />
      <circle cx="30" cy="19" r="2.5" fill="#fef08a" />
      <circle cx="24" cy="30" r="2" fill="#fef08a" />
      <circle cx="21" cy="26" r="3" fill="#b91c1c" />
      <circle cx="28" cy="24" r="2.8" fill="#b91c1c" />
      <circle cx="24" cy="16" r="2.8" fill="#b91c1c" />
      <circle cx="17" cy="23" r="1.2" fill="#15803d" />
      <circle cx="31" cy="27" r="1.2" fill="#15803d" />
      <circle cx="24" cy="34" r="1" fill="#15803d" />
    </svg>
  );
}

function CartTrolleyIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function TruckDeliveryIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function ShieldQualityIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function WalletPaymentIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

function LeafEcoIcon({ size = 15, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

interface PizzgerMenuThemeProps {
  categories: Category[];
  products: Product[];
  settings: ShopSettings;
  onSelectProduct: (product: Product) => void;
  onOpenCart: () => void;
  verifiedTable?: string;
}

export default function PizzgerMenuTheme({
  categories,
  products,
  settings,
  onSelectProduct,
  onOpenCart,
  verifiedTable,
}: PizzgerMenuThemeProps) {
  const { totalItems, currencySymbol, addItem } = useCart();
  const [activeCategoryId, setActiveCategoryId] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  const shopName = settings.shop_name || "Pizzger";
  const displayCurrency = settings.currency_symbol || currencySymbol || "Rs.";

  // Quick direct add for products without variations/toppings
  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const hasVariations = product.variations && product.variations.length > 0;
    const hasToppings = product.extra_toppings && product.extra_toppings.length > 0;

    if (hasVariations || hasToppings) {
      onSelectProduct(product);
    } else {
      addItem(product);
      setAddedNotice(`Added "${product.name}" to cart!`);
      setTimeout(() => setAddedNotice(null), 2000);
    }
  };

  // Group products by category for "All" view
  const categoryGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    // Map each category to its matching products
    const groups: { category: Category; items: Product[] }[] = [];

    // First: defined categories in order
    categories.forEach((cat) => {
      const items = products.filter((p) => {
        const matchesCategory = p.category_id === cat.id;
        const matchesSearch =
          !q ||
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q));
        return matchesCategory && matchesSearch;
      });
      if (items.length > 0) {
        groups.push({ category: cat, items });
      }
    });

    // Also collect uncategorized products if any
    const uncategorized = products.filter((p) => {
      const isUncat = p.category_id == null || !categories.some((c) => c.id === p.category_id);
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q));
      return isUncat && matchesSearch;
    });

    if (uncategorized.length > 0) {
      groups.push({
        category: { id: "other", name: "Specialties & Others" },
        items: uncategorized,
      });
    }

    return groups;
  }, [categories, products, searchQuery]);

  // Single category products when a category is selected
  const selectedCategoryProducts = useMemo(() => {
    if (activeCategoryId === null) return [];
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCat = p.category_id === activeCategoryId;
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [products, activeCategoryId, searchQuery]);

  return (
    <div style={{ backgroundColor: "#fbfbfc", minHeight: "100vh", color: "#0f172a", fontFamily: "var(--font-sans, system-ui, sans-serif)" }}>

      {/* ─── TOAST NOTIFICATION ─── */}
      {addedNotice && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#062319",
            color: "#ffffff",
            padding: "12px 24px",
            borderRadius: "9999px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Check size={12} strokeWidth={3} />
          </span>
          <span>{addedNotice}</span>
        </div>
      )}

      {/* ─── 1. SINGLE-LINE HEADER (Strictly 1 Line, No Double Bar) ─── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "#ffffff",
          borderBottom: "1px solid #f1f5f9",
          boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          height: 68,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left: Brand Identity in a single horizontal cluster */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt={shopName}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "10px",
                  objectFit: "cover",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              />
            ) : (
              <PizzaSliceLogo size={38} />
            )}

            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: 900,
                    letterSpacing: "-0.03em",
                    color: "#0f172a",
                    lineHeight: 1.1,
                  }}
                >
                  {shopName}
                </span>
                {verifiedTable && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      background: "#ecfdf5",
                      color: "#059669",
                      padding: "2px 6px",
                      borderRadius: "6px",
                      border: "1px solid #a7f3d0",
                    }}
                  >
                    Table {verifiedTable}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 700,
                  color: "#64748b",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  lineHeight: 1,
                  marginTop: "2px",
                }}
              >
                Fresh &bull; Hot &bull; Always
              </span>
            </div>
          </div>

          {/* Right: Search, Live Cart Badge & Drawer in single line */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {/* Search Trigger */}
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search Menu"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: searchOpen ? "#f1f5f9" : "transparent",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1e293b",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              className="hover:bg-slate-100"
            >
              {searchOpen ? <X size={20} /> : <Search size={21} />}
            </button>

            {/* Cart with Red Circular Badge */}
            <button
              type="button"
              onClick={onOpenCart}
              aria-label="Open Cart"
              style={{
                position: "relative",
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "transparent",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1e293b",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              className="hover:bg-slate-100"
            >
              <CartTrolleyIcon size={22} />
              {totalItems > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 0,
                    background: "#ef4444",
                    color: "#ffffff",
                    borderRadius: "9999px",
                    minWidth: "18px",
                    height: "18px",
                    fontSize: "10.5px",
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                    border: "2px solid #ffffff",
                    boxShadow: "0 2px 6px rgba(239, 68, 68, 0.4)",
                  }}
                >
                  {totalItems}
                </span>
              )}
            </button>

            {/* Hamburger Menu Drawer Trigger */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Menu Options"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "transparent",
                border: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                color: "#1e293b",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              className="hover:bg-slate-100"
            >
              <span style={{ width: "20px", height: "2.2px", background: "#1e293b", borderRadius: "2px" }} />
              <span style={{ width: "20px", height: "2.2px", background: "#1e293b", borderRadius: "2px" }} />
              <span style={{ width: "20px", height: "2.2px", background: "#1e293b", borderRadius: "2px" }} />
            </button>
          </div>
        </div>
      </header>

      {/* ─── SEARCH BAR SLIDE-DOWN ─── */}
      {searchOpen && (
        <div
          style={{
            background: "#ffffff",
            borderBottom: "1px solid #e2e8f0",
            padding: "12px 16px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ maxWidth: 800, margin: "0 auto", position: "relative" }}>
            <Search
              size={18}
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
            />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pizzas, toppings, deals, or drinks..."
              style={{
                width: "100%",
                padding: "12px 42px 12px 42px",
                borderRadius: "12px",
                border: "1.5px solid #cbd5e1",
                fontSize: "14px",
                outline: "none",
                background: "#f8fafc",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: 12,
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

      {/* ─── 2. HERO SECTION (Dark Forest Green, Cheese Pull Pizza, Same to Same) ─── */}
      <section
        style={{
          background: "linear-gradient(135deg, #052017 0%, #0a3324 55%, #051a13 100%)",
          color: "#ffffff",
          position: "relative",
          overflow: "hidden",
          padding: "clamp(36px, 6vw, 68px) 16px clamp(48px, 7vw, 76px)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            alignItems: "center",
            gap: "36px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Left Hero Content */}
          <div>
            <div
              style={{
                color: "#f97316",
                fontSize: "26px",
                fontFamily: "cursive, 'Brush Script MT', sans-serif",
                fontWeight: 700,
                fontStyle: "italic",
                marginBottom: "8px",
                letterSpacing: "0.02em",
              }}
            >
              Hot &amp; Fresh
            </div>

            <h1
              style={{
                fontSize: "clamp(34px, 5.5vw, 56px)",
                fontWeight: 900,
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
                margin: "0 0 16px",
              }}
            >
              Delicious <br />
              Pizzas, Made <br />
              <span style={{ color: "#f59e0b" }}>for You!</span>
            </h1>

            <p
              style={{
                fontSize: "clamp(14px, 1.8vw, 16px)",
                color: "#e2e8f0",
                lineHeight: 1.5,
                margin: "0 0 28px",
                maxWidth: 440,
                fontWeight: 500,
              }}
            >
              Fresh ingredients, authentic taste, served with love.
            </p>

            <a
              href="#popular-pizzas"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                background: "linear-gradient(90deg, #f97316 0%, #ea580c 100%)",
                color: "#ffffff",
                padding: "14px 34px",
                borderRadius: "9999px",
                fontSize: "15px",
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 8px 24px rgba(234, 88, 12, 0.45)",
                transition: "all 0.2s",
              }}
              className="hover:scale-105 active:scale-95"
            >
              <span>Order Now</span>
              <ChevronRight size={18} strokeWidth={2.5} />
            </a>
          </div>

          {/* Right Hero Image (Cheese Pull Artisan Pizza) */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "540px",
                borderRadius: "24px",
                overflow: "hidden",
                boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
              }}
            >
              <img
                src="/images/pizzger-hero-pizza.jpg"
                alt="Fresh Artisan Pizza with Melty Cheese Pull"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  objectFit: "cover",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. FLOATING HIGHLIGHTS BAR (Image 1 Bottom Feature Pill) ─── */}
      <div
        style={{
          maxWidth: 1100,
          margin: "-28px auto 36px",
          padding: "0 16px",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: "22px",
            boxShadow: "0 12px 36px rgba(0, 0, 0, 0.07)",
            border: "1px solid #f1f5f9",
            padding: "18px 28px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            alignItems: "center",
          }}
        >
          {/* 1. Fast Delivery */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <TruckDeliveryIcon size={22} />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>Fast Delivery</div>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>25–35 Minutes</div>
            </div>
          </div>

          {/* 2. Fresh Ingredients */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ShieldQualityIcon size={22} />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>Fresh Ingredients</div>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>100% Quality</div>
            </div>
          </div>

          {/* 3. Easy Payment */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <WalletPaymentIcon size={22} />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>Easy Payment</div>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Cash on Delivery</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. POPULAR PIZZAS & CATEGORY MENU SECTION (Image 2 + Requirement 5) ─── */}
      <section
        id="popular-pizzas"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "20px 16px 80px",
        }}
      >
        {/* Section Heading + "View All" */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                background: "#fff7ed",
                color: "#ea580c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Flame size={20} fill="#ea580c" />
            </div>
            <h2
              style={{
                fontSize: "clamp(20px, 3.5vw, 24px)",
                fontWeight: 900,
                color: "#0f172a",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Our Popular Menu
            </h2>
          </div>

          {activeCategoryId !== null && (
            <button
              type="button"
              onClick={() => setActiveCategoryId(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "#f97316",
                fontSize: "13.5px",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer",
                padding: "6px 10px",
              }}
              className="hover:underline"
            >
              <span>View All Categories</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* ─── Category Filter Pills (Deep Green Active + Cream Inactive) ─── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            overflowX: "auto",
            paddingBottom: "8px",
            marginBottom: "28px",
            scrollbarWidth: "none",
          }}
        >
          {/* "All" Pill */}
          <button
            type="button"
            onClick={() => setActiveCategoryId(null)}
            style={{
              padding: "10px 22px",
              borderRadius: "9999px",
              fontSize: "13px",
              fontWeight: 800,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
              border: activeCategoryId === null ? "1.5px solid #063b2c" : "1px solid #e2e8f0",
              background: activeCategoryId === null ? "#063b2c" : "#ffffff",
              color: activeCategoryId === null ? "#ffffff" : "#475569",
              boxShadow: activeCategoryId === null ? "0 4px 14px rgba(6, 59, 44, 0.25)" : "none",
            }}
          >
            <UtensilsCrossed size={14} />
            <span>All Categories</span>
          </button>

          {/* Category Tabs */}
          {categories.map((cat, idx) => {
            const isActive = activeCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryId(cat.id)}
                style={{
                  padding: "10px 22px",
                  borderRadius: "9999px",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                  border: isActive ? "1.5px solid #063b2c" : "1px solid #e2e8f0",
                  background: isActive ? "#063b2c" : "#ffffff",
                  color: isActive ? "#ffffff" : "#475569",
                  boxShadow: isActive ? "0 4px 14px rgba(6, 59, 44, 0.25)" : "none",
                }}
              >
                {idx % 3 === 0 ? (
                  <LeafEcoIcon size={14} color={isActive ? "#ffffff" : "#ea580c"} />
                ) : idx % 3 === 1 ? (
                  <Sparkles size={14} style={{ color: isActive ? "#ffffff" : "#ea580c" }} />
                ) : (
                  <Flame size={14} style={{ color: isActive ? "#ffffff" : "#ea580c" }} />
                )}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* ─── REQUIREMENT 5: WHEN FILTER IS ON "ALL", SHOW CATEGORY-WISE IN 2 HORIZONTAL ROWS ─── */}
        {activeCategoryId === null ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
            {categoryGroups.length === 0 ? (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "18px",
                  padding: "48px 24px",
                  textAlign: "center",
                  border: "1px solid #f1f5f9",
                }}
              >
                <div style={{ fontSize: "36px", marginBottom: "8px" }}>🍕</div>
                <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
                  No items found
                </h3>
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                  Try clearing your search query.
                </p>
              </div>
            ) : (
              categoryGroups.map((group) => (
                <div key={group.category.id} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Category Section Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "18px" }}>🍕</span>
                      <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", margin: 0 }}>
                        {group.category.name}
                      </h3>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 800,
                          background: "#f1f5f9",
                          color: "#475569",
                          padding: "2px 8px",
                          borderRadius: "9999px",
                        }}
                      >
                        {group.items.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveCategoryId(group.category.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ea580c",
                        fontSize: "12.5px",
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                        cursor: "pointer",
                      }}
                      className="hover:underline"
                    >
                      <span>Explore</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  {/* 2 Horizontal Lines / Rows for this Category */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateRows: group.items.length > 2 ? "repeat(2, auto)" : "auto",
                      gridAutoFlow: "column",
                      gridAutoColumns: "minmax(280px, 320px)",
                      gap: "20px",
                      overflowX: "auto",
                      paddingBottom: "14px",
                      scrollSnapType: "x mandatory",
                      scrollbarWidth: "thin",
                    }}
                  >
                    {group.items.map((product, idx) => (
                      <ProductCardItem
                        key={product.id}
                        product={product}
                        idx={idx}
                        currencySymbol={displayCurrency}
                        onSelectProduct={onSelectProduct}
                        onQuickAdd={handleQuickAdd}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Single Selected Category View */
          <div>
            {selectedCategoryProducts.length === 0 ? (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "18px",
                  padding: "48px 24px",
                  textAlign: "center",
                  border: "1px solid #f1f5f9",
                }}
              >
                <div style={{ fontSize: "36px", marginBottom: "8px" }}>🍕</div>
                <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
                  No items in this category
                </h3>
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                  Try choosing another category or viewing all items.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
                  gap: "24px",
                }}
              >
                {selectedCategoryProducts.map((product, idx) => (
                  <ProductCardItem
                    key={product.id}
                    product={product}
                    idx={idx}
                    currencySymbol={displayCurrency}
                    onSelectProduct={onSelectProduct}
                    onQuickAdd={handleQuickAdd}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ─── QUICK NAVIGATION DRAWER (Opened via Hamburger in single-line header) ─── */}
      {drawerOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => setDrawerOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "340px",
              height: "100%",
              background: "#ffffff",
              padding: "24px 20px",
              boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.15)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "28px",
                  paddingBottom: "16px",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <PizzaSliceLogo size={32} />
                  <span style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a" }}>
                    {shopName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "50%",
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Links */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <a
                  href="#popular-pizzas"
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "#f8fafc",
                    color: "#0f172a",
                    fontSize: "14px",
                    fontWeight: 700,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <Flame size={18} color="#ea580c" />
                  <span>Popular Pizzas</span>
                </a>

                <a
                  href="/track"
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "#f8fafc",
                    color: "#0f172a",
                    fontSize: "14px",
                    fontWeight: 700,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <TruckDeliveryIcon size={18} />
                  <span>Live Order Tracking</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onOpenCart();
                  }}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "#fff7ed",
                    color: "#ea580c",
                    fontSize: "14px",
                    fontWeight: 700,
                    border: "1px solid #fed7aa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <CartTrolleyIcon size={18} />
                    <span>View Shopping Cart</span>
                  </div>
                  {totalItems > 0 && (
                    <span style={{ background: "#ea580c", color: "#fff", borderRadius: "9999px", padding: "2px 8px", fontSize: "11px", fontWeight: 800 }}>
                      {totalItems}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Bottom Contact Info */}
            <div style={{ paddingTop: "20px", borderTop: "1px solid #e2e8f0", fontSize: "12px", color: "#64748b" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <Clock size={14} color="#059669" />
                <span>Open: 11:00 AM – 01:00 AM Daily</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Phone size={14} color="#ea580c" />
                <span>Need help? Ask staff or call store</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── FOOTER ─── */}
      <footer
        style={{
          borderTop: "1px solid #f1f5f9",
          background: "#ffffff",
          padding: "28px 16px",
          textAlign: "center",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "4px" }}>
          <span>Powered by</span>
          <strong style={{ color: "#063b2c", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sole-What</strong>
        </div>
        <div>Smart Restaurant POS &amp; Cloud Digital Menu</div>
      </footer>
    </div>
  );
}

// ─── Individual Product Card Component (Image 2 style) ─────────────
function ProductCardItem({
  product,
  idx,
  currencySymbol,
  onSelectProduct,
  onQuickAdd,
}: {
  product: Product;
  idx: number;
  currencySymbol: string;
  onSelectProduct: (p: Product) => void;
  onQuickAdd: (e: React.MouseEvent, p: Product) => void;
}) {
  const displayPrice = product.price ?? 0;
  const [imgError, setImgError] = useState(false);
  const hasBadge = idx === 0 || idx === 1 || !!product.badge;
  const isBestSeller = idx === 0 || product.badge === "BESTSELLER";
  const badgeText = product.badge || (isBestSeller ? "BEST SELLER" : "NEW");

  return (
    <div
      onClick={() => onSelectProduct(product)}
      style={{
        background: "#ffffff",
        borderRadius: "20px",
        border: "1px solid #f1f5f9",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
        scrollSnapAlign: "start",
      }}
      className="hover:scale-[1.015] hover:shadow-lg"
    >
      {/* Top Image Container */}
      <div
        style={{
          position: "relative",
          height: "175px",
          margin: "12px 12px 0 12px",
          borderRadius: "14px",
          overflow: "hidden",
          background: "#f8fafc",
        }}
      >
        {/* Badge */}
        {hasBadge && (
          <span
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              zIndex: 2,
              background: isBestSeller ? "#f97316" : "#0d9488",
              color: "#ffffff",
              fontSize: "10.5px",
              fontWeight: 900,
              padding: "4px 9px",
              borderRadius: "6px",
              letterSpacing: "0.03em",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            {badgeText}
          </span>
        )}
        <OptimizedImage
          src={product.image_url}
          alt={product.name}
          productName={product.name}
          priority={idx < 4}
          aspectRatio="auto"
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {/* Body Content */}
      <div style={{ padding: "14px 16px 18px" }}>
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 800,
            color: "#0f172a",
            margin: "0 0 5px",
            lineHeight: 1.25,
          }}
        >
          {product.name}
        </h3>

        <p
          style={{
            fontSize: "12.5px",
            color: "#64748b",
            lineHeight: 1.45,
            margin: "0 0 16px",
            minHeight: "36px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.description || "Freshly baked artisan pizza loaded with mozzarella and secret sauce."}
        </p>

        {/* Price and Orange Circle Plus Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "4px",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: 900,
              color: "#ea580c",
              letterSpacing: "-0.01em",
            }}
          >
            {currencySymbol}{" "}
            {typeof displayPrice === "number"
              ? displayPrice.toLocaleString()
              : displayPrice}
          </div>

          <button
            type="button"
            onClick={(e) => onQuickAdd(e, product)}
            aria-label={`Add ${product.name}`}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "#f97316",
              color: "#ffffff",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(249, 115, 22, 0.4)",
              transition: "transform 0.15s, background 0.15s",
            }}
            className="hover:scale-110 active:scale-95"
          >
            <Plus size={19} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}
