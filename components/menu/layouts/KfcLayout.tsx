"use client";

import React, { useState } from "react";
import type { Category, Product } from "@/types/menu";
import type { ShopSettings } from "@/lib/menu-data";
import { useCart } from "../CartContext";
import BrandLogo from "@/components/BrandLogo";
import MenuEmptyState from "../MenuEmptyState";
import MenuErrorState from "../MenuErrorState";
import { Search, ChevronRight, Plus } from "lucide-react";

const HeartIcon = ({ size = 18, color = "#e4002b", fill = "none" }: { size?: number; color?: string; fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

interface KfcLayoutProps {
  categories: Category[];
  products: Product[];
  filteredProducts: Product[];
  categoriesError: string | null;
  productsError: string | null;
  tableMissing: boolean;
  hasError: boolean;
  settings: ShopSettings;
  activeCategoryId: string | number | null;
  setActiveCategoryId: (id: string | number | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  currentVerifiedTable?: string;
  onCartOpen: () => void;
}

// ─── Inline KFC Bucket Icon ─────────────────────────────────────
const KfcBucketIcon = ({ size = 28, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    {/* Bucket Body */}
    <path
      d="M4 8L6.5 21H17.5L20 8H4Z"
      fill="#ffffff"
      stroke="#e4002b"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Red Stripes on Bucket */}
    <path d="M8 8.5L9.5 20.5" stroke="#e4002b" strokeWidth="2.5" />
    <path d="M12 8.5L12 20.5" stroke="#e4002b" strokeWidth="2.5" />
    <path d="M16 8.5L14.5 20.5" stroke="#e4002b" strokeWidth="2.5" />
    {/* Bucket Rim */}
    <path d="M3 8C3 7 4 6 5 6H19C20 6 21 7 21 8H3Z" fill="#e4002b" />
    {/* Steam / Food Top */}
    <circle cx="8" cy="4" r="1.5" fill="#f59e0b" />
    <circle cx="12" cy="3" r="1.8" fill="#f59e0b" />
    <circle cx="16" cy="4" r="1.5" fill="#f59e0b" />
  </svg>
);

// ─── Scooter Delivery Icon ──────────────────────────────────────
const ScooterIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18.5" cy="17.5" r="3.5" />
    <circle cx="5.5" cy="17.5" r="3.5" />
    <path d="M15 6h-3.5L8 14h6.5l2-5h3" />
    <path d="M5.5 17.5H9" />
    <rect x="2" y="7" width="5" height="5" rx="1" fill="currentColor" opacity="0.3" />
  </svg>
);

// ─── Takeout Bag Icon ───────────────────────────────────────────
const BagIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

// ─── Dine-In / Merch Icon ───────────────────────────────────────
const TableDineIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9h18M5 9v11M19 9v11M9 9V4h6v5" />
  </svg>
);

export default function KfcLayout({
  categories,
  products,
  filteredProducts,
  categoriesError,
  productsError,
  tableMissing,
  hasError,
  settings,
  activeCategoryId,
  setActiveCategoryId,
  searchQuery,
  setSearchQuery,
  setSelectedProduct,
  currentVerifiedTable,
  onCartOpen,
}: KfcLayoutProps) {
  const { totalItems, totalPrice, formatPrice, addItem } = useCart();
  const [orderMode, setOrderMode] = useState<"delivery" | "pickup" | "dine_in">(
    currentVerifiedTable ? "dine_in" : "delivery"
  );
  const [favorites, setFavorites] = useState<Record<string | number, boolean>>({});

  const toggleFavorite = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const variations = product.variations || [];
    if (variations.length > 1 || (product.extra_toppings && product.extra_toppings.length > 0)) {
      setSelectedProduct(product);
      return;
    }
    addItem(product, [], variations[0] || null, []);
  };

  // Top featured hero items (first 2 or products marked as deal)
  const heroProducts = products.filter((p) => p.is_deal).slice(0, 2);
  const topFeatured = heroProducts.length >= 2 ? heroProducts : products.slice(0, 2);

  return (
    <div
      className="kfc-menu-theme"
      style={{
        background: "#f4f4f6",
        minHeight: "100vh",
        color: "#111827",
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* ─── TOP HEADER BAR ─── */}
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          padding: "10px 16px",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Hamburger Menu & Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button
              type="button"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                width: "24px",
              }}
              aria-label="Menu"
            >
              <span style={{ width: "20px", height: "2.5px", background: "#111827", borderRadius: "2px" }} />
              <span style={{ width: "16px", height: "2.5px", background: "#111827", borderRadius: "2px" }} />
              <span style={{ width: "20px", height: "2.5px", background: "#111827", borderRadius: "2px" }} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={settings.shop_name}
                  style={{ width: "34px", height: "34px", objectFit: "cover", borderRadius: "6px" }}
                />
              ) : (
                <BrandLogo size={34} />
              )}
              <span
                style={{
                  fontFamily: '"Impact", "Arial Black", sans-serif',
                  fontSize: "20px",
                  color: "#e4002b",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {settings.shop_name}
              </span>
            </div>
          </div>

          {/* Table pill or Direct Cart Trigger */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {currentVerifiedTable && (
              <span
                style={{
                  background: "#e4002b",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 900,
                  padding: "4px 10px",
                  borderRadius: "20px",
                  letterSpacing: "0.02em",
                }}
              >
                TABLE #{currentVerifiedTable}
              </span>
            )}

            <button
              type="button"
              onClick={onCartOpen}
              style={{
                position: "relative",
                background: "#ffffff",
                border: "1.5px solid #e5e7eb",
                borderRadius: "10px",
                padding: "6px 10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              aria-label="Bucket Cart"
            >
              <KfcBucketIcon size={22} />
              {totalItems > 0 && (
                <span
                  style={{
                    background: "#e4002b",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 900,
                    borderRadius: "12px",
                    padding: "1px 6px",
                    minWidth: "18px",
                    textAlign: "center",
                  }}
                >
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ─── SEGMENTED ORDER MODE TOGGLE (DELIVERY / PICKUP / DINE-IN) ─── */}
      <div style={{ background: "#ffffff", padding: "12px 16px 14px", borderBottom: "1px solid #f0f0f2" }}>
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
          }}
        >
          {/* DELIVERY */}
          <button
            type="button"
            onClick={() => setOrderMode("delivery")}
            style={{
              padding: "10px 8px",
              borderRadius: "10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              transition: "all 0.15s ease",
              border: orderMode === "delivery" ? "1.5px solid #e4002b" : "1px solid #e5e7eb",
              background: orderMode === "delivery" ? "#ffffff" : "#f8f9fa",
              color: orderMode === "delivery" ? "#e4002b" : "#4b5563",
              boxShadow: orderMode === "delivery" ? "0 2px 8px rgba(228, 0, 43, 0.12)" : "none",
            }}
          >
            <ScooterIcon size={16} />
            <span>Delivery</span>
          </button>

          {/* PICKUP */}
          <button
            type="button"
            onClick={() => setOrderMode("pickup")}
            style={{
              padding: "10px 8px",
              borderRadius: "10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              transition: "all 0.15s ease",
              border: orderMode === "pickup" ? "1.5px solid #e4002b" : "1px solid #e5e7eb",
              background: orderMode === "pickup" ? "#ffffff" : "#f8f9fa",
              color: orderMode === "pickup" ? "#e4002b" : "#4b5563",
              boxShadow: orderMode === "pickup" ? "0 2px 8px rgba(228, 0, 43, 0.12)" : "none",
            }}
          >
            <BagIcon size={16} />
            <span>Pickup</span>
          </button>

          {/* DINE-IN */}
          <button
            type="button"
            onClick={() => setOrderMode("dine_in")}
            style={{
              padding: "10px 8px",
              borderRadius: "10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              transition: "all 0.15s ease",
              border: orderMode === "dine_in" ? "1.5px solid #e4002b" : "1px solid #e5e7eb",
              background: orderMode === "dine_in" ? "#ffffff" : "#f8f9fa",
              color: orderMode === "dine_in" ? "#e4002b" : "#4b5563",
              boxShadow: orderMode === "dine_in" ? "0 2px 8px rgba(228, 0, 43, 0.12)" : "none",
            }}
          >
            <TableDineIcon size={16} />
            <span>Dine-In</span>
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "16px" }}>
        {/* ─── TOP HERO FEATURED CARDS (KFC SIGNATURE PROMOS WITH RED RIBBON) ─── */}
        {topFeatured.length > 0 && !searchQuery && (
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "12px",
              }}
            >
              {topFeatured.map((item) => {
                const priceVal = item.variations?.[0]?.price ?? item.price ?? 0;
                return (
                  <div
                    key={`hero-${item.id}`}
                    onClick={() => setSelectedProduct(item)}
                    style={{
                      background: "#ffffff",
                      borderRadius: "12px",
                      border: "1.5px dashed #d1d5db",
                      overflow: "hidden",
                      cursor: "pointer",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "transform 0.15s ease",
                    }}
                    className="hover:scale-[1.01]"
                  >
                    {/* Header with Title and Angled Ribbon */}
                    <div style={{ padding: "12px 10px 0" }}>
                      <h3
                        style={{
                          fontFamily: '"Impact", "Arial Black", sans-serif',
                          fontSize: "clamp(15px, 2.2vw, 19px)",
                          fontWeight: 900,
                          color: "#111827",
                          letterSpacing: "0.02em",
                          margin: 0,
                          textTransform: "capitalize",
                          lineHeight: 1.15,
                        }}
                      >
                        {item.name}
                      </h3>
                    </div>

                    {/* Angled Red Price Ribbon */}
                    <div
                      style={{
                        position: "absolute",
                        top: "28px",
                        right: "0px",
                        background: "#e4002b",
                        color: "#ffffff",
                        padding: "4px 10px 4px 14px",
                        fontWeight: 900,
                        fontSize: "13px",
                        letterSpacing: "0.02em",
                        clipPath: "polygon(14% 0%, 100% 0%, 100% 100%, 0% 100%)",
                        boxShadow: "0 2px 6px rgba(228, 0, 43, 0.35)",
                        zIndex: 2,
                      }}
                    >
                      {formatPrice(priceVal)}
                    </div>

                    {/* Burger/Food on KFC Checkered Paper Background */}
                    <div
                      style={{
                        height: "140px",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: "10px",
                        backgroundImage: `
                          linear-gradient(45deg, #f3f4f6 25%, transparent 25%),
                          linear-gradient(-45deg, #f3f4f6 25%, transparent 25%),
                          linear-gradient(45deg, transparent 75%, #f3f4f6 75%),
                          linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)
                        `,
                        backgroundSize: "16px 16px",
                        backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                      }}
                    >
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          style={{
                            maxHeight: "120px",
                            maxWidth: "90%",
                            objectFit: "contain",
                            filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.18))",
                          }}
                        />
                      ) : (
                        <KfcBucketIcon size={60} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── SEARCH INPUT ─── */}
        <div style={{ marginBottom: "16px", position: "relative" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af",
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${settings.shop_name} deals, burgers, wings...`}
            style={{
              width: "100%",
              padding: "11px 14px 11px 38px",
              borderRadius: "10px",
              background: "#ffffff",
              border: "1.5px solid #e5e7eb",
              fontSize: "13px",
              fontWeight: 600,
              color: "#111827",
              outline: "none",
            }}
          />
        </div>

        {/* ─── CATEGORY HORIZONTAL SLIDER ─── */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "8px",
            marginBottom: "20px",
            scrollbarWidth: "none",
          }}
          className="no-scrollbar"
        >
          <button
            type="button"
            onClick={() => setActiveCategoryId(null)}
            style={{
              whiteSpace: "nowrap",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
              cursor: "pointer",
              transition: "all 0.15s ease",
              border: activeCategoryId === null ? "1.5px solid #e4002b" : "1px solid #e5e7eb",
              background: activeCategoryId === null ? "#e4002b" : "#ffffff",
              color: activeCategoryId === null ? "#ffffff" : "#111827",
            }}
          >
            All Items ({products.length})
          </button>

          {categories.map((cat) => {
            const isActive = activeCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryId(cat.id)}
                style={{
                  whiteSpace: "nowrap",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  border: isActive ? "1.5px solid #e4002b" : "1px solid #e5e7eb",
                  background: isActive ? "#e4002b" : "#ffffff",
                  color: isActive ? "#ffffff" : "#111827",
                }}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* ─── SECTION TITLE: "TOP DEALS" WITH RED ACCENT UNDERLINE ─── */}
        <div style={{ marginBottom: "18px" }}>
          <h2
            style={{
              fontFamily: '"Impact", "Arial Black", sans-serif',
              fontSize: "22px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              margin: 0,
              color: "#111827",
              lineHeight: 1.1,
            }}
          >
            {activeCategoryId !== null
              ? categories.find((c) => c.id === activeCategoryId)?.name || "Menu Deals"
              : "Top Deals & Combos"}
          </h2>
          <div
            style={{
              width: "48px",
              height: "3.5px",
              background: "#e4002b",
              borderRadius: "2px",
              marginTop: "5px",
            }}
          />
        </div>

        {/* ─── ERROR & EMPTY STATES ─── */}
        {hasError && (
          <MenuErrorState tableMissing={tableMissing} message={productsError ?? categoriesError ?? undefined} />
        )}

        {!hasError && filteredProducts.length === 0 && (
          <MenuEmptyState
            message={
              searchQuery
                ? `No items match "${searchQuery}".`
                : "No items available in this category today."
            }
          />
        )}

        {/* ─── 2-COLUMN KFC DEALS GRID (EXACT SCREENSHOT LAYOUT) ─── */}
        {!hasError && filteredProducts.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "12px",
            }}
          >
            {filteredProducts.map((product) => {
              const variations = product.variations || [];
              const priceVal = variations.length > 0 ? variations[0].price : (product.price || 0);
              const isFav = !!favorites[product.id];

              return (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  style={{
                    background: "#ffffff",
                    borderRadius: "14px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                    overflow: "hidden",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "12px",
                    position: "relative",
                    transition: "box-shadow 0.15s ease",
                  }}
                  className="hover:shadow-md"
                >
                  {/* Top Bar: Iconic 3 Red Vertical KFC Stripes & Heart Icon */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    {/* The 3 iconic KFC red bars 🟥 🟥 🟥 */}
                    <div style={{ display: "flex", gap: "3px" }}>
                      <span style={{ width: "5px", height: "14px", background: "#e4002b", borderRadius: "1px" }} />
                      <span style={{ width: "5px", height: "14px", background: "#e4002b", borderRadius: "1px" }} />
                      <span style={{ width: "5px", height: "14px", background: "#e4002b", borderRadius: "1px" }} />
                    </div>

                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(e, product.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px",
                        color: isFav ? "#e4002b" : "#9ca3af",
                      }}
                      aria-label="Favorite"
                    >
                      <HeartIcon size={18} color={isFav ? "#e4002b" : "#9ca3af"} fill={isFav ? "#e4002b" : "none"} />
                    </button>
                  </div>

                  {/* Centered Food Image */}
                  <div
                    style={{
                      height: "120px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      margin: "4px 0 10px",
                    }}
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        style={{
                          maxHeight: "115px",
                          maxWidth: "100%",
                          objectFit: "contain",
                          filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.12))",
                        }}
                      />
                    ) : (
                      <KfcBucketIcon size={52} />
                    )}
                  </div>

                  {/* Body Content */}
                  <div>
                    <h3
                      style={{
                        fontFamily: '"Impact", "Arial Black", sans-serif',
                        fontSize: "15px",
                        fontWeight: 900,
                        color: "#111827",
                        letterSpacing: "0.02em",
                        margin: "0 0 4px",
                        lineHeight: 1.2,
                        textTransform: "capitalize",
                      }}
                    >
                      {product.name}
                    </h3>

                    {product.description && (
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#4b5563",
                          lineHeight: 1.35,
                          margin: "0 0 8px",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {product.description}
                      </p>
                    )}
                  </div>

                  {/* Price & Red Add Button */}
                  <div
                    style={{
                      marginTop: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontFamily: '"Impact", "Arial Black", sans-serif',
                          fontSize: "16px",
                          fontWeight: 900,
                          color: "#111827",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {formatPrice(priceVal)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(e, product)}
                      style={{
                        background: "#e4002b",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        padding: "7px 12px",
                        fontSize: "11px",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        boxShadow: "0 2px 6px rgba(228, 0, 43, 0.3)",
                      }}
                      className="hover:bg-red-700"
                    >
                      <Plus size={13} strokeWidth={3} />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── FLOATING KFC BUCKET CART TRIGGER ─── */}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "20px",
          zIndex: 45,
        }}
      >
        <button
          type="button"
          onClick={onCartOpen}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "#ffffff",
            border: "2px solid #e4002b",
            boxShadow: "0 8px 24px rgba(228, 0, 43, 0.35)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            transition: "transform 0.15s ease",
          }}
          className="hover:scale-105 active:scale-95"
          aria-label="View Bucket"
        >
          <KfcBucketIcon size={32} />
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              background: "#e4002b",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 900,
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #ffffff",
            }}
          >
            {totalItems}
          </span>
        </button>
      </div>

      {/* ─── FLOATING BOTTOM STRIP WHEN BUCKET HAS ITEMS ─── */}
      {totalItems > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 44,
            width: "calc(100% - 32px)",
            maxWidth: "460px",
          }}
        >
          <button
            type="button"
            onClick={onCartOpen}
            style={{
              width: "100%",
              background: "#e4002b",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 8px 25px rgba(228, 0, 43, 0.4)",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  background: "#ffffff",
                  color: "#e4002b",
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "14px",
                }}
              >
                {totalItems}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em", opacity: 0.9 }}>
                  Your Bucket
                </div>
                <div style={{ fontSize: "15px", fontWeight: 900 }}>
                  {formatPrice(totalPrice)}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 900, fontSize: "13px" }}>
              <span>View Bucket</span>
              <ChevronRight size={18} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
