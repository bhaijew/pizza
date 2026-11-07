"use client";

/**
 * MenuHeader — Heat Box / Cheezious Style Dual-Ribbon Streetwear Header.
 * Features:
 * - Dual tilted red & black ticker tapes (Pizza, Burger, Fried Chicken, Fries, Nuggets)
 * - Large circular dropping brand logo overlapping the ribbon and header
 * - Delivery location / Table pill (Delivery E-7 >)
 * - Phone hotline pill (051 111 111 199)
 * - Red-bordered isometric Pizza Box Cart button with live item counter
 * - Red-bordered Hamburger menu button with quick navigation drawer
 */
import { useState } from "react";
import Link from "next/link";
import { useCart } from "./CartContext";

interface MenuHeaderProps {
  onCartOpen: () => void;
  shopName?: string;
  verifiedTable?: string;
  logoUrl?: string | null;
  phone?: string | null;
  branchName?: string;
}

const TICKER_ITEMS = [
  { icon: "🍕", label: "PIZZA" },
  { icon: "🍔", label: "BURGER" },
  { icon: "🍗", label: "FRIED CHICKEN" },
  { icon: "🍟", label: "FRIES" },
  { icon: "🍟", label: "PIZZA FRIES" },
  { icon: "🍗", label: "NUGGETS" },
];

export default function MenuHeader({
  onCartOpen,
  shopName = "Heat Box Pizza",
  verifiedTable,
  logoUrl,
  phone = "051 111 111 199",
  branchName = "E-7",
}: MenuHeaderProps) {
  const displayPhone = phone || "051 111 111 199";
  const { totalItems, totalPrice, formatPrice } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Triple items for seamless infinite marquee loop
  const marqueeList = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <header className="sticky top-0 z-40 w-full" style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}>
      {/* ─── DUAL-TAPE STREETWEAR RIBBON (Red & Black Crossing Ticker) ─── */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#18181b",
          height: 52,
          userSelect: "none",
        }}
      >
        {/* UPPER TAPE: Fast-Food Red (#dc2626) tilted slightly */}
        <div
          style={{
            position: "absolute",
            top: -4,
            left: "-5%",
            width: "110%",
            height: 28,
            background: "#dc2626",
            transform: "rotate(-1.2deg)",
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
            boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
              whiteSpace: "nowrap",
              animation: "heatboxMarqueeLeft 28s linear infinite",
            }}
          >
            {marqueeList.map((item, idx) => (
              <span
                key={`red-ticker-${idx}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.06em",
                  color: "#ffffff",
                  textTransform: "uppercase",
                }}
              >
                <span style={{ fontSize: 13 }}>{item.icon}</span>
                <span>{item.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* LOWER TAPE: Solid Matte Black (#18181b) tilted crossing angle */}
        <div
          style={{
            position: "absolute",
            bottom: -3,
            left: "-5%",
            width: "110%",
            height: 28,
            background: "#18181b",
            transform: "rotate(1.1deg)",
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
              whiteSpace: "nowrap",
              animation: "heatboxMarqueeRight 28s linear infinite",
            }}
          >
            {marqueeList.map((item, idx) => (
              <span
                key={`black-ticker-${idx}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.06em",
                  color: "#ffffff",
                  textTransform: "uppercase",
                }}
              >
                <span style={{ fontSize: 13 }}>{item.icon}</span>
                <span>{item.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── MAIN WHITE NAVIGATION BAR ─── */}
      <div
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #f1f5f9",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)",
          position: "relative",
          zIndex: 30,
        }}
      >
        <div
          style={{
            maxWidth: 1380,
            margin: "0 auto",
            padding: "0 16px",
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          {/* ─── LEFT: Delivery / Branch Pill + Phone Hotline Pill ─── */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Delivery Location Pill */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px 6px 10px",
                borderRadius: 9999,
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              className="hover:border-red-300 hover:shadow-md"
              title={verifiedTable ? `Table #${verifiedTable} Verified` : `Branch: ${branchName}`}
            >
              {/* Red Pizza Slice Icon */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#fef2f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8 2 3.5 3 2 4c0 0 3 17 10 18 7-1 10-18 10-18-1.5-1-6-2-10-2z" fill="#ef4444" />
                  <path d="M2.5 4.5C6 3.5 18 3.5 21.5 4.5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="10" cy="11" r="1.6" fill="#ffffff" />
                  <circle cx="14" cy="14" r="1.6" fill="#ffffff" />
                  <circle cx="12" cy="8" r="1.3" fill="#ffffff" />
                </svg>
              </div>

              {/* Text: DELIVERY / Branch */}
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: "#0f172a",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {verifiedTable ? "DINE-IN" : "DELIVERY"}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 900,
                    color: "#0f172a",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {verifiedTable ? `Table ${verifiedTable}` : branchName}
                </span>
              </div>

              {/* Chevron Arrow */}
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  color: "#64748b",
                  marginLeft: 2,
                }}
              >
                &gt;
              </span>
            </div>

            {/* Phone Hotline Pill (Hidden on extra small screens, visible on sm+) */}
            <a
              href={`tel:${displayPhone.replace(/\s+/g, "")}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px 8px 10px",
                borderRadius: 9999,
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                textDecoration: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              className="hidden sm:inline-flex hover:border-red-300 hover:shadow-md"
              title={`Call Hotline ${displayPhone}`}
            >
              {/* Red Phone Receiver Icon */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#fef2f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#ef4444">
                  <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.21 2.2z" />
                </svg>
              </div>

              {/* Hotline Number */}
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  color: "#0f172a",
                  letterSpacing: "0.02em",
                  whiteSpace: "nowrap",
                }}
              >
                {displayPhone}
              </span>
            </a>
          </div>

          {/* ─── CENTER: Big Circular Dropping Brand Logo Badge ─── */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -36%)",
              zIndex: 50,
              pointerEvents: "auto",
            }}
          >
            <Link
              href="/"
              style={{
                display: "block",
                width: 86,
                height: 86,
                borderRadius: "50%",
                background: "#1e1e1e",
                border: "4px solid #ffffff",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.22)",
                overflow: "hidden",
                textDecoration: "none",
                position: "relative",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              className="hover:scale-105"
              title={shopName}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={shopName}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 6,
                    background: "radial-gradient(circle at 50% 30%, #292524 0%, #1c1917 100%)",
                  }}
                >
                  {/* Stylized Red Pizza Crust Crown */}
                  <svg width="42" height="24" viewBox="0 0 50 28" fill="none">
                    <path
                      d="M5 24C5 12 14 4 25 4C36 4 45 12 45 24"
                      stroke="#ef4444"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M12 24C12 16 18 10 25 10C32 10 38 16 38 24"
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle cx="25" cy="18" r="2.5" fill="#ef4444" />
                    <circle cx="18" cy="20" r="1.8" fill="#ffffff" />
                    <circle cx="32" cy="20" r="1.8" fill="#ffffff" />
                  </svg>

                  {/* Brand Wordmark */}
                  <div style={{ textAlign: "center", marginTop: 2, lineHeight: 1 }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 900,
                        color: "#ffffff",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      HEAT
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontSize: 10,
                        fontWeight: 900,
                        color: "#ef4444",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                      }}
                    >
                      BOX
                    </span>
                  </div>
                </div>
              )}
            </Link>
          </div>

          {/* ─── RIGHT: Red-Bordered Pizza Box Button + Red-Bordered Hamburger Menu Button ─── */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Red-Bordered Isometric Pizza Box Cart Button */}
            <button
              type="button"
              id="open-cart-btn"
              onClick={onCartOpen}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                border: "1.5px solid #ef4444",
                background: totalItems > 0 ? "#fef2f2" : "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
                boxShadow: "0 2px 8px rgba(239, 68, 68, 0.12)",
                transition: "all 0.18s ease",
              }}
              className="hover:scale-105 active:scale-95"
              aria-label={`Open Cart. ${totalItems} items in cart`}
              title="View Cart & Orders"
            >
              {/* Isometric Red Pizza Box SVG matching mockup */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 8.5L12 4l9 4.5L12 13 3 8.5z" fill="#ef4444" />
                <path d="M3 8.5v7l9 4.5v-7L3 8.5z" fill="#dc2626" />
                <path d="M21 8.5v7l-9 4.5v-7l9-4.5z" fill="#b91c1c" />
                {/* Box Center Badge */}
                <circle cx="12" cy="8.5" r="2.2" fill="#ffffff" />
                <path d="M12 7.5L11 9h2l-1-1.5z" fill="#dc2626" />
              </svg>

              {/* Floating Badge Count */}
              {totalItems > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    background: "#ef4444",
                    color: "#ffffff",
                    borderRadius: 9999,
                    minWidth: 20,
                    height: 20,
                    padding: "0 4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 900,
                    border: "2px solid #ffffff",
                    boxShadow: "0 2px 6px rgba(239, 68, 68, 0.4)",
                  }}
                >
                  {totalItems}
                </span>
              )}
            </button>

            {/* Red-Bordered Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                border: "1.5px solid #ef4444",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4.5,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(239, 68, 68, 0.12)",
                transition: "all 0.18s ease",
              }}
              className="hover:scale-105 active:scale-95"
              aria-label="Open Navigation Menu"
              title="Navigation Menu"
            >
              <span style={{ width: 20, height: 2.4, background: "#1e293b", borderRadius: 2 }} />
              <span style={{ width: 20, height: 2.4, background: "#1e293b", borderRadius: 2 }} />
              <span style={{ width: 20, height: 2.4, background: "#1e293b", borderRadius: 2 }} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── QUICK NAVIGATION DRAWER (Opened via Hamburger Menu) ─── */}
      {drawerOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => setDrawerOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 360,
              height: "100%",
              background: "#ffffff",
              padding: "24px 20px",
              boxShadow: "-6px 0 28px rgba(0, 0, 0, 0.2)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Drawer Top Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 24,
                  paddingBottom: 16,
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "#1e1e1e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontSize: 20,
                    }}
                  >
                    🍕
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", margin: 0, lineHeight: 1.1 }}>
                      {shopName}
                    </h2>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#ea580c" }}>
                      Artisan Kitchen &amp; Fresh Pizza
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "#f1f5f9",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                  title="Close Menu"
                >
                  ✕
                </button>
              </div>

              {/* Delivery / Table Info Badge */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span style={{ display: "block", fontSize: 10, fontWeight: 800, color: "#991b1b", textTransform: "uppercase" }}>
                    Service Mode
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: "#dc2626" }}>
                    {verifiedTable ? `Table #${verifiedTable} (Dine-In)` : `Delivery (${branchName})`}
                  </span>
                </div>
                <span style={{ fontSize: 24 }}>🛵</span>
              </div>

              {/* Navigation Quick Links */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <a
                  href="#menu"
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "#f8fafc",
                    color: "#0f172a",
                    fontWeight: 800,
                    fontSize: 14,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>🍕 Full Menu Catalog</span>
                  <span>→</span>
                </a>

                <a
                  href="#deals"
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "#f8fafc",
                    color: "#0f172a",
                    fontWeight: 800,
                    fontSize: 14,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>🎁 Special Deals &amp; Combos</span>
                  <span>→</span>
                </a>

                <Link
                  href="/track"
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "#f8fafc",
                    color: "#0f172a",
                    fontWeight: 800,
                    fontSize: 14,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>📍 Track Live Order</span>
                  <span>→</span>
                </Link>

                <a
                  href={`tel:${displayPhone.replace(/\s+/g, "")}`}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "#ecfdf5",
                    color: "#065f46",
                    border: "1px solid #a7f3d0",
                    fontWeight: 800,
                    fontSize: 14,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>📞 Call Hotline ({displayPhone})</span>
                  <span>Call</span>
                </a>
              </div>
            </div>

            {/* Bottom Checkout CTA */}
            <div style={{ paddingTop: 20, borderTop: "1px solid #e2e8f0" }}>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  onCartOpen();
                }}
                style={{
                  width: "100%",
                  padding: "14px 20px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  color: "#ffffff",
                  fontSize: 15,
                  fontWeight: 900,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 14px rgba(220, 38, 38, 0.35)",
                }}
              >
                <span>View Cart ({totalItems} items)</span>
                <span>{totalItems > 0 ? formatPrice(totalPrice) : "Open"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Continuous Marquee Keyframes */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes heatboxMarqueeLeft {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            @keyframes heatboxMarqueeRight {
              0% { transform: translateX(-50%); }
              100% { transform: translateX(0); }
            }
          `,
        }}
      />
    </header>
  );
}
