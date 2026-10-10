"use client";

/**
 * MenuHeader — crisp, professional square navigation bar.
 * Clean architectural aesthetic, SVG icons, and live cart summary.
 */
import Link from "next/link";
import { useCart } from "./CartContext";
import BrandLogo from "@/components/BrandLogo";

interface MenuHeaderProps {
  onCartOpen: () => void;
  shopName?: string;
  verifiedTable?: string;
}

export default function MenuHeader({ onCartOpen, shopName = "Pizza Shop", verifiedTable }: MenuHeaderProps) {
  const { totalItems, totalPrice, formatPrice } = useCart();

  return (
    <header className="sticky top-0 z-40 w-full">
      <div
        style={{
          background: "rgba(255, 255, 255, 0.94)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 20px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          {/* Logo / Brand — Vibrant Red, Orange & Golden Yellow Square Emblem */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <BrandLogo size={36} variant="iconOnly" />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h1
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: 17,
                    color: "#0f172a",
                    lineHeight: 1.1,
                    margin: 0,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {shopName}
                </h1>
                {verifiedTable ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.02em",
                      padding: "2px 8px",
                      borderRadius: 3,
                      background: "#fef3c7",
                      color: "#92400e",
                      border: "1px solid #fde68a",
                    }}
                  >
                    <span>📍</span>
                    <span>Table #{verifiedTable} (QR Verified)</span>
                  </span>
                ) : (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      padding: "2px 6px",
                      borderRadius: 3,
                      background: "#ecfdf5",
                      color: "#059669",
                      border: "1px solid #a7f3d0",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 1,
                        background: "#10b981",
                        display: "inline-block",
                      }}
                    />
                    Open
                  </span>
                )}
              </div>
              <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0", fontWeight: 500 }}>
                Artisan Kitchen &amp; Fresh Pizza
              </p>
            </div>
          </div>

          {/* Navigation Links & Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <nav className="hidden md:flex items-center gap-2">
              <a
                href="#menu"
                style={{
                  padding: "6px 12px",
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#334155",
                  textDecoration: "none",
                  border: "1px solid transparent",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                }}
              >
                Menu Catalog
              </a>
              <a
                href="#specials"
                style={{
                  padding: "6px 12px",
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#334155",
                  textDecoration: "none",
                  border: "1px solid transparent",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                }}
              >
                Why Choose Us
              </a>
            </nav>

            {/* Square Cart Button */}
            <button
              id="open-cart-btn"
              onClick={onCartOpen}
              aria-label={`Open cart. ${totalItems} item${totalItems !== 1 ? "s" : ""} in cart`}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 14px",
                borderRadius: 4,
                background: totalItems > 0 ? "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)" : "#fff7ed",
                color: totalItems > 0 ? "#ffffff" : "#c2410c",
                border: totalItems > 0 ? "1px solid #b91c1c" : "1px solid #fed7aa",
                cursor: "pointer",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 13,
                transition: "all 0.2s ease",
                boxShadow: totalItems > 0 ? "0 2px 8px rgba(220, 38, 38, 0.3)" : "none",
              }}
              onMouseEnter={(e) => {
                if (totalItems > 0) {
                  e.currentTarget.style.filter = "brightness(1.08)";
                } else {
                  e.currentTarget.style.background = "#ffedd5";
                }
              }}
              onMouseLeave={(e) => {
                if (totalItems > 0) {
                  e.currentTarget.style.filter = "none";
                } else {
                  e.currentTarget.style.background = "#fff7ed";
                }
              }}
            >
              {/* Shopping Bag SVG */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>

              <span className="hidden sm:inline">Cart</span>

              {totalItems > 0 && (
                <>
                  <span
                    style={{
                      minWidth: 18,
                      height: 18,
                      borderRadius: 2,
                      background: "#fbbf24",
                      color: "#7c2d12",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 900,
                      padding: "0 4px",
                    }}
                  >
                    {totalItems}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      opacity: 0.95,
                      borderLeft: "1px solid rgba(255,255,255,0.3)",
                      paddingLeft: 6,
                    }}
                    className="hidden md:inline"
                  >
                    {formatPrice(totalPrice)}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
