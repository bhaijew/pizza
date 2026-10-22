"use client";

import React, { useState } from "react";
import type { Category, Product } from "@/types/menu";
import type { ShopSettings } from "@/lib/menu-data";
import { useCart } from "../CartContext";
import BrandLogo from "@/components/BrandLogo";
import MenuEmptyState from "../MenuEmptyState";
import MenuErrorState from "../MenuErrorState";
import { Search, Plus, ChevronRight } from "lucide-react";

const HeartIcon = ({ size = 18, color = "#da291c", fill = "none" }: { size?: number; color?: string; fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

interface McDonaldsLayoutProps {
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

// ─── Golden Arches "M" Icon ─────────────────────────────────────
const GoldenArchesIcon = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M2.5 21C2.5 13.5 6.5 4 8.5 4C10.5 4 12 12.5 12 12.5C12 12.5 13.5 4 15.5 4C17.5 4 21.5 13.5 21.5 21H18.5C18.5 15.5 16.5 8 15.5 8C14.5 8 13.5 14 13.5 16.5H10.5C10.5 14 9.5 8 8.5 8C7.5 8 5.5 15.5 5.5 21H2.5Z"
      fill="#ffbc0d"
    />
  </svg>
);

// ─── Scooter Delivery Icon ──────────────────────────────────────
const DeliveryScooter = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18.5" cy="17.5" r="3.5" />
    <circle cx="5.5" cy="17.5" r="3.5" />
    <path d="M15 6h-3.5L8 14h6.5l2-5h3" />
  </svg>
);

// ─── Shopping Bag Icon ──────────────────────────────────────────
const McBagIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

export default function McDonaldsLayout({
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
}: McDonaldsLayoutProps) {
  const { totalItems, totalPrice, formatPrice, addItem } = useCart();
  const [orderMode, setOrderMode] = useState<"mcdelivery" | "pickup">(
    currentVerifiedTable ? "pickup" : "mcdelivery"
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

  return (
    <div
      className="mcdonalds-menu-theme"
      style={{
        background: "#f8f9fa",
        minHeight: "100vh",
        color: "#27251f",
        fontFamily: 'Speedee, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* ─── MCDONALD'S RED HEADER BAR ─── */}
      <header
        style={{
          background: "#da291c",
          padding: "10px 16px",
          position: "sticky",
          top: 0,
          zIndex: 40,
          boxShadow: "0 2px 10px rgba(218, 41, 28, 0.25)",
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
          {/* Golden Arches Logo & Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              }}
            >
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={settings.shop_name}
                  style={{ width: "30px", height: "30px", objectFit: "cover", borderRadius: "50%" }}
                />
              ) : (
                <GoldenArchesIcon size={24} />
              )}
            </div>

            <div>
              <span
                style={{
                  fontSize: "19px",
                  fontWeight: 900,
                  color: "#ffffff",
                  letterSpacing: "-0.01em",
                }}
              >
                {settings.shop_name}
              </span>
              {currentVerifiedTable && (
                <div style={{ fontSize: "10px", color: "#ffbc0d", fontWeight: 700 }}>
                  Table #{currentVerifiedTable}
                </div>
              )}
            </div>
          </div>

          {/* Golden Bag Cart Button */}
          <button
            type="button"
            onClick={onCartOpen}
            style={{
              position: "relative",
              background: "#ffbc0d",
              color: "#27251f",
              border: "none",
              borderRadius: "20px",
              padding: "6px 14px",
              fontWeight: 900,
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            }}
          >
            <McBagIcon size={16} />
            <span>Bag</span>
            {totalItems > 0 && (
              <span
                style={{
                  background: "#da291c",
                  color: "#ffffff",
                  fontSize: "10px",
                  fontWeight: 900,
                  borderRadius: "10px",
                  padding: "1px 6px",
                }}
              >
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ─── MCDELIVERY / PICK-UP SWITCHER ─── */}
      <div style={{ background: "#ffffff", padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
            background: "#f4f4f5",
            borderRadius: "30px",
            padding: "4px",
          }}
        >
          {/* McDelivery */}
          <button
            type="button"
            onClick={() => setOrderMode("mcdelivery")}
            style={{
              padding: "9px 12px",
              borderRadius: "26px",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 900,
              transition: "all 0.15s ease",
              background: orderMode === "mcdelivery" ? "#ffbc0d" : "transparent",
              color: orderMode === "mcdelivery" ? "#27251f" : "#71717a",
              boxShadow: orderMode === "mcdelivery" ? "0 2px 6px rgba(255, 188, 13, 0.4)" : "none",
            }}
          >
            <DeliveryScooter size={16} />
            <span>McDelivery</span>
          </button>

          {/* Pick-Up */}
          <button
            type="button"
            onClick={() => setOrderMode("pickup")}
            style={{
              padding: "9px 12px",
              borderRadius: "26px",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 900,
              transition: "all 0.15s ease",
              background: orderMode === "pickup" ? "#ffbc0d" : "transparent",
              color: orderMode === "pickup" ? "#27251f" : "#71717a",
              boxShadow: orderMode === "pickup" ? "0 2px 6px rgba(255, 188, 13, 0.4)" : "none",
            }}
          >
            <McBagIcon size={16} />
            <span>Pick-Up</span>
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "14px 16px 80px" }}>
        {/* ─── SAVER DEALS PROMO BANNER ─── */}
        {!searchQuery && (
          <div
            style={{
              marginBottom: "16px",
              background: "linear-gradient(135deg, #da291c 0%, #b91c1c 100%)",
              borderRadius: "14px",
              padding: "16px",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 4px 14px rgba(218, 41, 28, 0.2)",
            }}
          >
            <div style={{ position: "relative", zIndex: 2 }}>
              <div
                style={{
                  background: "#ffbc0d",
                  color: "#27251f",
                  fontSize: "10px",
                  fontWeight: 900,
                  padding: "2px 8px",
                  borderRadius: "6px",
                  display: "inline-block",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                }}
              >
                App Exclusive
              </div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 900 }}>
                Saver Meals & Family Combos
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "11px", opacity: 0.9 }}>
                Order your favorites fresh to order right now
              </p>
            </div>

            <div style={{ opacity: 0.25, transform: "scale(1.8)", transformOrigin: "right center" }}>
              <GoldenArchesIcon size={54} />
            </div>
          </div>
        )}

        {/* ─── SEARCH INPUT ─── */}
        <div style={{ marginBottom: "14px", position: "relative" }}>
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
            placeholder={`Search burgers, fries, shakes...`}
            style={{
              width: "100%",
              padding: "10px 14px 10px 38px",
              borderRadius: "10px",
              background: "#ffffff",
              border: "1.5px solid #e5e7eb",
              fontSize: "13px",
              color: "#27251f",
              fontWeight: 600,
              outline: "none",
            }}
          />
        </div>

        {/* ─── CATEGORY NAVIGATION TABS ─── */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "8px",
            marginBottom: "18px",
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
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.15s ease",
              border: activeCategoryId === null ? "none" : "1px solid #e5e7eb",
              background: activeCategoryId === null ? "#ffbc0d" : "#ffffff",
              color: "#27251f",
              boxShadow: activeCategoryId === null ? "0 2px 6px rgba(255, 188, 13, 0.4)" : "none",
            }}
          >
            Full Menu
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
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  border: isActive ? "none" : "1px solid #e5e7eb",
                  background: isActive ? "#ffbc0d" : "#ffffff",
                  color: "#27251f",
                  boxShadow: isActive ? "0 2px 6px rgba(255, 188, 13, 0.4)" : "none",
                }}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* ─── HEADING ─── */}
        <div style={{ marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
          <GoldenArchesIcon size={18} />
          <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#27251f", margin: 0 }}>
            {activeCategoryId !== null
              ? categories.find((c) => c.id === activeCategoryId)?.name || "Menu"
              : "Signature Meals & Favorites"}
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
                : "No dishes currently listed in this category."
            }
          />
        )}

        {/* ─── 2-COLUMN MCDONALD'S GRID ─── */}
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
              const isDeal = product.is_deal === true;

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
                    transition: "transform 0.15s ease",
                  }}
                  className="hover:scale-[1.01]"
                >
                  {/* Top: McValue badge or Heart */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    {isDeal ? (
                      <span
                        style={{
                          background: "#da291c",
                          color: "#ffffff",
                          fontSize: "9px",
                          fontWeight: 900,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          textTransform: "uppercase",
                          letterSpacing: "0.03em",
                        }}
                      >
                        McValue
                      </span>
                    ) : (
                      <span />
                    )}

                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(e, product.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px",
                        color: isFav ? "#da291c" : "#9ca3af",
                      }}
                      aria-label="Favorite"
                    >
                      <HeartIcon size={16} color={isFav ? "#da291c" : "#9ca3af"} fill={isFav ? "#da291c" : "none"} />
                    </button>
                  </div>

                  {/* Centered Food Image */}
                  <div
                    style={{
                      height: "115px",
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
                          maxHeight: "110px",
                          maxWidth: "100%",
                          objectFit: "contain",
                          filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.12))",
                        }}
                      />
                    ) : (
                      <GoldenArchesIcon size={46} />
                    )}
                  </div>

                  {/* Body Content */}
                  <div>
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: 900,
                        color: "#27251f",
                        margin: "0 0 4px",
                        lineHeight: 1.25,
                      }}
                    >
                      {product.name}
                    </h3>

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

                  {/* Price & Golden Add Button */}
                  <div
                    style={{
                      marginTop: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "6px",
                    }}
                  >
                    <div style={{ fontSize: "15px", fontWeight: 900, color: "#da291c" }}>
                      {formatPrice(priceVal)}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(e, product)}
                      style={{
                        background: "#ffbc0d",
                        color: "#27251f",
                        border: "none",
                        borderRadius: "8px",
                        padding: "7px 12px",
                        fontSize: "11px",
                        fontWeight: 900,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        boxShadow: "0 2px 6px rgba(255, 188, 13, 0.35)",
                      }}
                      className="hover:bg-amber-400"
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

      {/* ─── FLOATING MCDONALD'S GOLDEN ORDER BAR ─── */}
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
              background: "#da291c",
              color: "#ffffff",
              border: "none",
              borderRadius: "14px",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 8px 24px rgba(218, 41, 28, 0.4)",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  background: "#ffbc0d",
                  color: "#27251f",
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
                  McDelivery Bag
                </div>
                <div style={{ fontSize: "15px", fontWeight: 900 }}>
                  {formatPrice(totalPrice)}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 900, fontSize: "13px", color: "#ffbc0d" }}>
              <span>Checkout</span>
              <ChevronRight size={18} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
