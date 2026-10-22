"use client";

import React, { useState, useRef } from "react";
import type { Category, Product } from "@/types/menu";
import type { ShopSettings } from "@/lib/menu-data";
import { useCart } from "../CartContext";
import BrandLogo from "@/components/BrandLogo";
import MenuEmptyState from "../MenuEmptyState";
import MenuErrorState from "../MenuErrorState";
import { Search, ChevronRight, ShoppingBag } from "lucide-react";

const HeartIcon = ({ size = 18, color = "#ea580c", fill = "none" }: { size?: number; color?: string; fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const ChevronLeftIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

interface CheeziousLayoutProps {
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

// ─── Inline Cheezious Cheese Icon ───────────────────────────────
const CheeseIcon = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M21 16L12 3L3 8V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V16Z"
      fill="#ffcc00"
      stroke="#f59e0b"
      strokeWidth="1.5"
    />
    <circle cx="8" cy="14" r="1.5" fill="#f59e0b" />
    <circle cx="15" cy="17" r="2" fill="#f59e0b" />
    <circle cx="14" cy="11" r="1" fill="#f59e0b" />
  </svg>
);

// ─── Map Pin Icon ───────────────────────────────────────────────
const PinIcon = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
  </svg>
);

// ─── Store / Pick-up Icon ───────────────────────────────────────
const StoreIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

// ─── User Profile Outline Icon ──────────────────────────────────
const ProfileIcon = ({ size = 22, color = "#f97316" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// ─── Cheezious Cart Outline Icon ────────────────────────────────
const CartOutlineIcon = ({ size = 24, color = "#f97316" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

export default function CheeziousLayout({
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
}: CheeziousLayoutProps) {
  const { totalItems, totalPrice, formatPrice, addItem } = useCart();
  const [orderMode, setOrderMode] = useState<"delivery" | "pickup">(
    currentVerifiedTable ? "pickup" : "delivery"
  );
  const [favorites, setFavorites] = useState<Record<string | number, boolean>>({});
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const toggleFavorite = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const scrollCategories = (direction: "left" | "right") => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === "left" ? -180 : 180;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
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

  return (
    <div
      className="cheezious-menu-theme"
      style={{
        background: "#ffffff",
        minHeight: "100vh",
        color: "#18181b",
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* ─── TOP ORANGE STRIPE ─── */}
      <div style={{ height: "4px", background: "linear-gradient(90deg, #f97316 0%, #ea580c 100%)" }} />

      {/* ─── TOP HEADER BAR ─── */}
      <header
        style={{
          background: "#ffffff",
          padding: "10px 16px",
          position: "sticky",
          top: 0,
          zIndex: 40,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
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
          {/* Hamburger (Orange Lines) */}
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
            <span style={{ width: "20px", height: "2.5px", background: "#ea580c", borderRadius: "2px" }} />
            <span style={{ width: "16px", height: "2.5px", background: "#ea580c", borderRadius: "2px" }} />
            <span style={{ width: "20px", height: "2.5px", background: "#ea580c", borderRadius: "2px" }} />
          </button>

          {/* Cheezious Brand / Shop Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.shop_name}
                style={{ width: "34px", height: "34px", objectFit: "cover", borderRadius: "50%" }}
              />
            ) : (
              <CheeseIcon size={26} />
            )}
            <span
              style={{
                fontSize: "20px",
                fontWeight: 900,
                color: "#27272a",
                letterSpacing: "-0.02em",
                fontStyle: "italic",
              }}
            >
              {settings.shop_name}
            </span>
          </div>

          {/* Right: Cart with red circular badge & User Profile */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button
              type="button"
              onClick={onCartOpen}
              style={{
                position: "relative",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
                alignItems: "center",
              }}
              aria-label="View Cart"
            >
              <CartOutlineIcon size={24} color="#ea580c" />
              <span
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-8px",
                  background: "#dc2626",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 900,
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {totalItems}
              </span>
            </button>

            <button
              type="button"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
                alignItems: "center",
              }}
              aria-label="User Profile"
            >
              <ProfileIcon size={22} color="#ea580c" />
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "14px 16px 80px" }}>
        {/* ─── DELIVERY / PICK-UP SWITCHER CAPSULE ─── */}
        <div style={{ marginBottom: "14px" }}>
          <div
            style={{
              background: "#f3f4f6",
              borderRadius: "30px",
              padding: "3px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "4px",
            }}
          >
            {/* DELIVERY (Active: Bright Cheddar Yellow) */}
            <button
              type="button"
              onClick={() => setOrderMode("delivery")}
              style={{
                padding: "10px 14px",
                borderRadius: "26px",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "13px",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.02em",
                transition: "all 0.15s ease",
                background: orderMode === "delivery" ? "#ffcc00" : "transparent",
                color: orderMode === "delivery" ? "#000000" : "#6b7280",
                boxShadow: orderMode === "delivery" ? "0 2px 6px rgba(255, 204, 0, 0.4)" : "none",
              }}
            >
              <PinIcon size={16} color={orderMode === "delivery" ? "#000000" : "#6b7280"} />
              <span>Delivery</span>
            </button>

            {/* PICK-UP */}
            <button
              type="button"
              onClick={() => setOrderMode("pickup")}
              style={{
                padding: "10px 14px",
                borderRadius: "26px",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "13px",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.02em",
                transition: "all 0.15s ease",
                background: orderMode === "pickup" ? "#ffcc00" : "transparent",
                color: orderMode === "pickup" ? "#000000" : "#6b7280",
                boxShadow: orderMode === "pickup" ? "0 2px 6px rgba(255, 204, 0, 0.4)" : "none",
              }}
            >
              <StoreIcon size={16} />
              <span>Pick-Up</span>
            </button>
          </div>
        </div>

        {/* ─── SEARCH INPUT ("Find in cheezious") ─── */}
        <div style={{ marginBottom: "16px", position: "relative" }}>
          <Search
            size={18}
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
            placeholder={`Find in ${settings.shop_name.toLowerCase()}...`}
            style={{
              width: "100%",
              padding: "11px 14px 11px 40px",
              borderRadius: "24px",
              background: "#f4f4f5",
              border: "1px solid #e4e4e7",
              fontSize: "13px",
              fontWeight: 500,
              color: "#18181b",
              outline: "none",
            }}
          />
        </div>

        {/* ─── CATEGORY NAVIGATION WITH CIRCULAR ARROWS (< CATEGORIES >) ─── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "22px",
          }}
        >
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={() => scrollCategories("left")}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#ffffff",
              border: "1.5px solid #fed7aa",
              color: "#ea580c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
            aria-label="Scroll left"
          >
            <ChevronLeftIcon size={18} />
          </button>

          {/* Category Pills Container */}
          <div
            ref={categoryScrollRef}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              overflowX: "auto",
              scrollbarWidth: "none",
              padding: "2px 0",
            }}
            className="no-scrollbar"
          >
            <button
              type="button"
              onClick={() => setActiveCategoryId(null)}
              style={{
                whiteSpace: "nowrap",
                padding: "10px 18px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.15s ease",
                border: activeCategoryId === null ? "none" : "1px solid #e4e4e7",
                background: activeCategoryId === null ? "#ffcc00" : "#ffffff",
                color: activeCategoryId === null ? "#000000" : "#18181b",
                boxShadow: activeCategoryId === null ? "0 2px 6px rgba(255, 204, 0, 0.4)" : "none",
              }}
            >
              All Items
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
                    padding: "10px 18px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: 800,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    border: isActive ? "none" : "1px solid #e4e4e7",
                    background: isActive ? "#ffcc00" : "#ffffff",
                    color: isActive ? "#000000" : "#18181b",
                    boxShadow: isActive ? "0 2px 6px rgba(255, 204, 0, 0.4)" : "none",
                  }}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={() => scrollCategories("right")}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#ffffff",
              border: "1.5px solid #fed7aa",
              color: "#ea580c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* ─── CATEGORY SECTION HEADING (e.g. "Thin Crust Pizza") ─── */}
        <div style={{ marginBottom: "16px" }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 900,
              color: "#09090b",
              margin: 0,
            }}
          >
            {activeCategoryId !== null
              ? categories.find((c) => c.id === activeCategoryId)?.name || "Specialties"
              : "Signature Menu"}
          </h2>
        </div>

        {/* ─── ERROR & EMPTY STATES ─── */}
        {hasError && (
          <MenuErrorState tableMissing={tableMissing} message={productsError ?? categoriesError ?? undefined} />
        )}

        {!hasError && filteredProducts.length === 0 && (
          <MenuEmptyState
            message={
              searchQuery
                ? `No items found matching "${searchQuery}".`
                : "No dishes listed under this category right now."
            }
          />
        )}

        {/* ─── 2-COLUMN CHEEZIOUS PRODUCT CARDS (EXACT SCREENSHOT LAYOUT) ─── */}
        {!hasError && filteredProducts.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "14px",
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
                    borderRadius: "16px",
                    border: "1px solid #f1f1f4",
                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)",
                    overflow: "hidden",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "12px",
                    position: "relative",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                  className="hover:shadow-md"
                >
                  {/* Top: Heart Icon on Right */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      zIndex: 2,
                    }}
                  >
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(e, product.id)}
                      style={{
                        background: "rgba(255, 255, 255, 0.9)",
                        borderRadius: "50%",
                        border: "none",
                        cursor: "pointer",
                        padding: "5px",
                        color: isFav ? "#ea580c" : "#9ca3af",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      aria-label="Favorite"
                    >
                      <HeartIcon size={16} color={isFav ? "#ea580c" : "#9ca3af"} fill={isFav ? "#ea580c" : "none"} />
                    </button>
                  </div>

                  {/* Circular Pizza / Dish Image Centered */}
                  <div
                    style={{
                      width: "100%",
                      height: "125px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "4px 0 10px",
                    }}
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        style={{
                          width: "115px",
                          height: "115px",
                          objectFit: "cover",
                          borderRadius: "50%",
                          filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.14))",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100px",
                          height: "100px",
                          borderRadius: "50%",
                          background: "#fffbeb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CheeseIcon size={44} />
                      </div>
                    )}
                  </div>

                  {/* Lower Card Info Container */}
                  <div
                    style={{
                      background: "#fafafa",
                      borderRadius: "12px",
                      padding: "10px",
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      {/* Dish Title */}
                      <h3
                        style={{
                          fontSize: "14px",
                          fontWeight: 800,
                          color: "#18181b",
                          margin: "0 0 4px",
                          lineHeight: 1.25,
                        }}
                      >
                        {product.name}
                      </h3>

                      {/* Description */}
                      {product.description && (
                        <p
                          style={{
                            fontSize: "11px",
                            color: "#71717a",
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

                    {/* Price Row: Orange Price + Terracotta "Starting Price" Badge */}
                    <div style={{ marginTop: "6px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                          gap: "4px",
                        }}
                      >
                        <div style={{ fontSize: "14px", fontWeight: 900, color: "#ea580c" }}>
                          {formatPrice(priceVal)}
                        </div>

                        <span
                          style={{
                            background: "#c25e40",
                            color: "#ffffff",
                            fontSize: "9px",
                            fontWeight: 800,
                            padding: "2px 7px",
                            borderRadius: "10px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Starting Price
                        </span>
                      </div>

                      {/* + ADD TO CART Pill Button */}
                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(e, product)}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "20px",
                          background: "#ffffff",
                          border: "1.5px solid #e4e4e7",
                          color: "#18181b",
                          fontSize: "11px",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.03em",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.15s ease",
                        }}
                        className="hover:border-amber-500 hover:text-amber-600"
                      >
                        + Add To Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── STICKY CHEEZIOUS CART BAR ─── */}
      {totalItems > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 45,
            width: "calc(100% - 32px)",
            maxWidth: "460px",
          }}
        >
          <button
            type="button"
            onClick={onCartOpen}
            style={{
              width: "100%",
              background: "#ffcc00",
              color: "#000000",
              border: "none",
              borderRadius: "16px",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 8px 24px rgba(255, 204, 0, 0.45)",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  background: "#000000",
                  color: "#ffcc00",
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
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
                <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>
                  Cheezious Cart
                </div>
                <div style={{ fontSize: "15px", fontWeight: 900 }}>
                  {formatPrice(totalPrice)}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 900, fontSize: "13px" }}>
              <span>View Cart</span>
              <ChevronRight size={18} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
