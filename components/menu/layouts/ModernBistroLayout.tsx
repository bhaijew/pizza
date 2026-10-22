"use client";

import React from "react";
import type { Category, Product } from "@/types/menu";
import type { ShopSettings } from "@/lib/menu-data";
import { useCart } from "../CartContext";
import BrandLogo from "@/components/BrandLogo";
import MenuEmptyState from "../MenuEmptyState";
import MenuErrorState from "../MenuErrorState";
import { Search, Sparkles, Clock, Utensils, ChevronRight, ShoppingBag } from "lucide-react";

interface ModernBistroLayoutProps {
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

export default function ModernBistroLayout({
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
}: ModernBistroLayoutProps) {
  const { totalItems, totalPrice, formatPrice } = useCart();
  const themeColor = settings.theme_color || "#c2410c";

  return (
    <div
      className="modern-bistro-menu"
      style={{
        background: "#faf9f6",
        minHeight: "100vh",
        color: "#1e293b",
        fontFamily: "var(--font-outfit, var(--font-inter, system-ui, sans-serif))",
      }}
    >
      {/* ─── BISTRO HAUTE HERO BANNER ─── */}
      <section
        style={{
          background: "linear-gradient(135deg, #090d16 0%, #151c2d 60%, #1a1512 100%)",
          color: "#ffffff",
          padding: "clamp(32px, 5vw, 56px) 20px clamp(28px, 4vw, 44px)",
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid rgba(217, 119, 6, 0.25)",
        }}
      >
        {/* Subtle Ambient Glow */}
        <div
          style={{
            position: "absolute",
            top: "-30%",
            right: "10%",
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, rgba(217, 119, 6, 0.18) 0%, transparent 70%)",
            filter: "blur(50px)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            position: "relative",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {/* Logo Emblem or Custom Logo */}
          <div
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "16px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1.5px solid rgba(217, 119, 6, 0.4)",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
              overflow: "hidden",
            }}
          >
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.shop_name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <BrandLogo size={46} variant="iconOnly" />
            )}
          </div>

          {/* Haute Sub-badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "20px",
              background: "rgba(217, 119, 6, 0.15)",
              border: "1px solid rgba(217, 119, 6, 0.35)",
              color: "#fbbf24",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            <Sparkles size={13} />
            <span>Gourmet Kitchen • Curated Menu</span>
          </div>

          {/* Shop Title */}
          <h1
            style={{
              fontFamily: "var(--font-display, Georgia, serif)",
              fontSize: "clamp(26px, 4.5vw, 42px)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              margin: "0 0 10px",
              color: "#ffffff",
              lineHeight: 1.15,
            }}
          >
            {settings.shop_name}
          </h1>

          <p
            style={{
              fontSize: "clamp(13px, 1.8vw, 15px)",
              color: "#cbd5e1",
              maxWidth: "580px",
              lineHeight: 1.55,
              margin: "0 0 20px",
              fontWeight: 400,
            }}
          >
            {settings.hero_subtitle || "Stone-baked handcrafted pizzas and artisanal delicacies prepared fresh to order."}
          </p>

          {/* Service Hours & Table Pill */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                background: "rgba(255, 255, 255, 0.07)",
                borderRadius: "30px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                fontSize: "12px",
                color: "#e2e8f0",
              }}
            >
              <Clock size={13} style={{ color: "#34d399" }} />
              <span>
                {settings.opening_time || "11:00"} – {settings.closing_time || "01:00"}
              </span>
            </div>

            {currentVerifiedTable && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  background: "rgba(16, 185, 129, 0.15)",
                  borderRadius: "30px",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  fontSize: "12px",
                  color: "#6ee7b7",
                  fontWeight: 700,
                }}
              >
                <span>Table #{currentVerifiedTable}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── STICKY SEARCH & CATEGORY BAR ─── */}
      <section
        style={{
          position: "sticky",
          top: 64,
          zIndex: 30,
          background: "rgba(250, 249, 246, 0.96)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.03)",
          padding: "12px 16px",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Search Field */}
          <div style={{ position: "relative", width: "100%" }}>
            <Search
              size={17}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, toppings, gourmet specials..."
              style={{
                width: "100%",
                padding: "10px 14px 10px 40px",
                borderRadius: "10px",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                fontSize: "13px",
                color: "#0f172a",
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
              }}
            />
          </div>

          {/* Horizontal Category Carousel */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              overflowX: "auto",
              paddingBottom: "4px",
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
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
                border: activeCategoryId === null ? `1.5px solid #0f172a` : "1px solid #e2e8f0",
                background: activeCategoryId === null ? "#0f172a" : "#ffffff",
                color: activeCategoryId === null ? "#ffffff" : "#475569",
              }}
            >
              All Courses ({products.length})
            </button>

            {categories.map((cat) => {
              const count = products.filter((p) => p.category_id === cat.id).length;
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
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    border: isActive ? `1.5px solid #0f172a` : "1px solid #e2e8f0",
                    background: isActive ? "#0f172a" : "#ffffff",
                    color: isActive ? "#ffffff" : "#475569",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>{cat.name}</span>
                  <span
                    style={{
                      fontSize: "10px",
                      opacity: isActive ? 0.9 : 0.6,
                      background: isActive ? "rgba(255,255,255,0.2)" : "#f1f5f9",
                      padding: "1px 6px",
                      borderRadius: "10px",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── MAIN DISHES CONTENT ─── */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px 100px" }}>
        {/* Error Handling */}
        {hasError && (
          <MenuErrorState
            tableMissing={tableMissing}
            message={productsError ?? categoriesError ?? undefined}
          />
        )}

        {/* Empty State */}
        {!hasError && filteredProducts.length === 0 && (
          <MenuEmptyState
            message={
              searchQuery
                ? `No bistro creations matched "${searchQuery}".`
                : activeCategoryId !== null
                ? "No items listed under this course today."
                : "Menu is being updated by our chefs."
            }
          />
        )}

        {/* Haute Card Grid — 2-Column Desktop, 1-Column Mobile Luxury Cards */}
        {!hasError && filteredProducts.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 460px), 1fr))",
              gap: "20px",
            }}
          >
            {filteredProducts.map((product) => {
              const variations = product.variations || [];
              const startPrice = variations.length > 0 ? variations[0].price : (product.price || 0);
              const isDeal = product.is_deal === true;

              return (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  style={{
                    background: "#ffffff",
                    borderRadius: "14px",
                    border: "1px solid #e8e6e1",
                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
                    padding: "16px",
                    display: "flex",
                    gap: "16px",
                    cursor: "pointer",
                    transition: "all 0.22s ease",
                    position: "relative",
                  }}
                  className="hover:shadow-lg hover:border-slate-400 group"
                >
                  {/* Dish Thumbnail */}
                  <div
                    style={{
                      width: "115px",
                      height: "115px",
                      borderRadius: "10px",
                      overflow: "hidden",
                      background: "#f1f5f9",
                      flexShrink: 0,
                      position: "relative",
                    }}
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transition: "transform 0.3s ease",
                        }}
                        className="group-hover:scale-105"
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#94a3b8",
                        }}
                      >
                        <Utensils size={32} />
                      </div>
                    )}

                    {isDeal && (
                      <span
                        style={{
                          position: "absolute",
                          top: "6px",
                          left: "6px",
                          background: "#dc2626",
                          color: "#ffffff",
                          fontSize: "9px",
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Deal
                      </span>
                    )}
                  </div>

                  {/* Dish Content */}
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
                        <h3
                          style={{
                            fontFamily: "var(--font-display, Georgia, serif)",
                            fontSize: "16px",
                            fontWeight: 700,
                            color: "#0f172a",
                            margin: 0,
                            lineHeight: 1.25,
                          }}
                        >
                          {product.name}
                        </h3>
                      </div>

                      {product.description && (
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#64748b",
                            lineHeight: 1.45,
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

                    {/* Price and Action Row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed #f1f5f9" }}>
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>
                          {formatPrice(startPrice)}
                        </div>
                        {variations.length > 1 && (
                          <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600 }}>
                            {variations.length} sizes available
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(product);
                        }}
                        style={{
                          padding: "7px 14px",
                          borderRadius: "8px",
                          background: "#0f172a",
                          color: "#ffffff",
                          fontSize: "11px",
                          fontWeight: 700,
                          border: "none",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          transition: "background 0.2s",
                        }}
                        className="hover:bg-amber-600"
                      >
                        <span>Select</span>
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── FLOATING BISTRO ORDER PILL ─── */}
      {totalItems > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 40,
            width: "calc(100% - 32px)",
            maxWidth: "460px",
          }}
        >
          <button
            type="button"
            onClick={onCartOpen}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              color: "#ffffff",
              borderRadius: "14px",
              padding: "14px 20px",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.15)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "#d97706",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "13px",
                }}
              >
                {totalItems}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                  Order Summary
                </div>
                <div style={{ fontSize: "14px", fontWeight: 800 }}>
                  {formatPrice(totalPrice)}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#fbbf24" }}>
              <span>View Order</span>
              <ChevronRight size={16} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
