"use client";

import React from "react";
import type { Category, Product } from "@/types/menu";
import type { ShopSettings } from "@/lib/menu-data";
import { useCart } from "../CartContext";
import BrandLogo from "@/components/BrandLogo";
import MenuEmptyState from "../MenuEmptyState";
import MenuErrorState from "../MenuErrorState";
import { Search, Flame, Zap, Plus, ArrowRight, ShoppingBag } from "lucide-react";

const MinusIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const UtensilsIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
    <path d="M15 2v19" />
    <path d="M6 2v7a3 3 0 0 0 6 0V2" />
    <path d="M9 2v19" />
  </svg>
);

interface StreetExpressLayoutProps {
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

export default function StreetExpressLayout({
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
}: StreetExpressLayoutProps) {
  const { items, totalItems, totalPrice, formatPrice, addItem, setQty, getItemKey } = useCart();
  const themeColor = settings.theme_color || "#ea580c";

  // Helper to find existing cart item count for a single-variant product
  const getProductCartCount = (product: Product): { count: number; itemKey: string | null } => {
    const variations = product.variations || [];
    if (variations.length > 1) return { count: 0, itemKey: null };
    const defaultVar = variations[0] || null;
    const match = items.find((i) => i.product.id === product.id);
    return { count: match ? match.quantity : 0, itemKey: match ? getItemKey(match) : null };
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

  const handleStepQty = (e: React.MouseEvent, itemKey: string, newQty: number) => {
    e.stopPropagation();
    setQty(itemKey, newQty);
  };

  return (
    <div
      className="street-express-menu"
      style={{
        background: "#f8fafc",
        minHeight: "100vh",
        color: "#0f172a",
        fontFamily: "var(--font-outfit, system-ui, sans-serif)",
      }}
    >
      {/* ─── ENERGETIC STREET HEADER ─── */}
      <section
        style={{
          background: "linear-gradient(135deg, #ea580c 0%, #dc2626 50%, #991b1b 100%)",
          color: "#ffffff",
          padding: "24px 16px 28px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 2 }}>
          {/* Top Bar with Logo & Flash Deals */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "#ffffff",
                  padding: "2px",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {settings.logo_url ? (
                  <img
                    src={settings.logo_url}
                    alt={settings.shop_name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }}
                  />
                ) : (
                  <BrandLogo size={36} variant="iconOnly" />
                )}
              </div>

              <div>
                <h1 style={{ fontSize: "20px", fontWeight: 900, margin: 0, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
                  {settings.shop_name}
                </h1>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px", fontWeight: 600 }}>
                  <Zap size={12} style={{ color: "#facc15" }} />
                  <span>Fast Delivery &amp; Pickup</span>
                </div>
              </div>
            </div>

            {currentVerifiedTable ? (
              <div
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  background: "#ffffff",
                  color: "#dc2626",
                  fontSize: "12px",
                  fontWeight: 900,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                Table #{currentVerifiedTable}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "5px 10px",
                  borderRadius: "6px",
                  background: "rgba(0,0,0,0.25)",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#fef08a",
                }}
              >
                <Flame size={13} />
                <span>10-15 Min Bake</span>
              </div>
            )}
          </div>

          {/* Quick Search */}
          <div style={{ position: "relative", width: "100%" }}>
            <Search
              size={17}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#64748b",
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Quick search pizza, burgers, shakes, deals..."
              style={{
                width: "100%",
                padding: "11px 14px 11px 40px",
                borderRadius: "10px",
                background: "#ffffff",
                border: "none",
                fontSize: "13px",
                color: "#0f172a",
                outline: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                fontWeight: 500,
              }}
            />
          </div>
        </div>
      </section>

      {/* ─── QUICK CATEGORY SCROLLER ─── */}
      <section
        style={{
          position: "sticky",
          top: 64,
          zIndex: 30,
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          padding: "10px 16px",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
          className="no-scrollbar"
        >
          <button
            type="button"
            onClick={() => setActiveCategoryId(null)}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
              border: activeCategoryId === null ? "none" : "1px solid #e2e8f0",
              background: activeCategoryId === null ? "#ea580c" : "#f8fafc",
              color: activeCategoryId === null ? "#ffffff" : "#475569",
            }}
          >
            🔥 All Items ({products.length})
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
                  padding: "7px 14px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  border: isActive ? "none" : "1px solid #e2e8f0",
                  background: isActive ? "#ea580c" : "#f8fafc",
                  color: isActive ? "#ffffff" : "#475569",
                }}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── HIGH-DENSITY CARD GRID ─── */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px 110px" }}>
        {hasError && (
          <MenuErrorState
            tableMissing={tableMissing}
            message={productsError ?? categoriesError ?? undefined}
          />
        )}

        {!hasError && filteredProducts.length === 0 && (
          <MenuEmptyState
            message={
              searchQuery
                ? `No items found for "${searchQuery}".`
                : activeCategoryId !== null
                ? "No items in this category."
                : "No items available right now."
            }
          />
        )}

        {!hasError && filteredProducts.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
              gap: "14px",
            }}
          >
            {filteredProducts.map((product) => {
              const variations = product.variations || [];
              const startPrice = variations.length > 0 ? variations[0].price : (product.price || 0);
              const hasMultiSizes = variations.length > 1;
              const { count, itemKey } = getProductCartCount(product);

              return (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    cursor: "pointer",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                  className="hover:-translate-y-1 hover:shadow-md"
                >
                  {/* Food Picture Header */}
                  <div
                    style={{
                      height: "140px",
                      position: "relative",
                      background: "#f1f5f9",
                      overflow: "hidden",
                    }}
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
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
                          color: "#94a3b8",
                        }}
                      >
                        <UtensilsIcon size={36} />
                      </div>
                    )}

                    {/* Price Pill Floating On Image */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "8px",
                        left: "8px",
                        background: "rgba(15, 23, 42, 0.9)",
                        color: "#ffffff",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 800,
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {formatPrice(startPrice)}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: "12px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                    <div>
                      <h3
                        style={{
                          fontSize: "14px",
                          fontWeight: 800,
                          color: "#0f172a",
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
                            color: "#64748b",
                            lineHeight: 1.4,
                            margin: 0,
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

                    {/* Card Actions — Direct Inline Stepper or Select */}
                    <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px dashed #f1f5f9" }}>
                      {hasMultiSizes ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(product);
                          }}
                          style={{
                            width: "100%",
                            padding: "7px 10px",
                            borderRadius: "7px",
                            background: "#f1f5f9",
                            border: "1px solid #e2e8f0",
                            color: "#0f172a",
                            fontSize: "11px",
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                          }}
                          className="hover:bg-slate-200"
                        >
                          <span>Sizes / Options</span>
                          <ArrowRight size={12} />
                        </button>
                      ) : count > 0 && itemKey ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "#ea580c",
                            borderRadius: "7px",
                            padding: "3px 6px",
                            color: "#ffffff",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => handleStepQty(e, itemKey, count - 1)}
                            style={{
                              width: "26px",
                              height: "26px",
                              borderRadius: "5px",
                              background: "rgba(0,0,0,0.2)",
                              border: "none",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                          >
                            <MinusIcon size={13} />
                          </button>

                          <span style={{ fontSize: "13px", fontWeight: 900 }}>{count}</span>

                          <button
                            type="button"
                            onClick={(e) => handleStepQty(e, itemKey, count + 1)}
                            style={{
                              width: "26px",
                              height: "26px",
                              borderRadius: "5px",
                              background: "rgba(0,0,0,0.2)",
                              border: "none",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleQuickAdd(e, product)}
                          style={{
                            width: "100%",
                            padding: "7px 10px",
                            borderRadius: "7px",
                            background: "#ea580c",
                            border: "none",
                            color: "#ffffff",
                            fontSize: "12px",
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "5px",
                            boxShadow: "0 2px 6px rgba(234, 88, 12, 0.25)",
                          }}
                          className="hover:bg-orange-700"
                        >
                          <Plus size={14} />
                          <span>Add to Order</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── STICKY EXPRESS CHECKOUT BAR ─── */}
      {totalItems > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: "16px",
            left: "16px",
            right: "16px",
            zIndex: 40,
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          <button
            type="button"
            onClick={onCartOpen}
            style={{
              width: "100%",
              background: "#16a34a",
              color: "#ffffff",
              borderRadius: "12px",
              padding: "14px 18px",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              boxShadow: "0 8px 24px rgba(22, 163, 74, 0.35)",
            }}
            className="hover:bg-emerald-700 active:scale-95 transition-transform"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "13px",
                }}
              >
                {totalItems}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "14px", fontWeight: 900 }}>
                  {formatPrice(totalPrice)}
                </div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
                  {totalItems} {totalItems === 1 ? "Item" : "Items"} in Cart
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 900 }}>
              <span>PROCEED TO ORDER</span>
              <ArrowRight size={16} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
