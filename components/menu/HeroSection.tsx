"use client";

/**
 * HeroSection — vibrant Red, Yellow, White & Orange theme.
 * Compact height, golden highlights, and crisp square elements.
 */
import { useEffect, useState } from "react";

interface HeroSectionProps {
  verifiedTable?: string;
}

export default function HeroSection({ verifiedTable }: HeroSectionProps = {}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      id="hero"
      aria-label="Restaurant hero"
      style={{
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(135deg, #991b1b 0%, #b91c1c 30%, #c2410c 70%, #d97706 100%)",
        color: "#ffffff",
        padding: "clamp(20px, 3.2vw, 36px) clamp(16px, 2.5vw, 24px)",
        borderBottom: "2px solid #f59e0b",
      }}
    >
      {/* Subtle modern square grid pattern */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
        }}
      />

      {/* Warm Golden Glow Spotlight */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -20,
          right: "10%",
          width: 420,
          height: 220,
          background: "radial-gradient(circle, rgba(251, 191, 36, 0.28) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}
      >
        <div style={{ maxWidth: 680 }}>
          {/* Golden Yellow / White Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(254, 240, 138, 0.18)",
              border: "1px solid rgba(254, 240, 138, 0.4)",
              borderRadius: 3,
              padding: "3px 8px",
              marginBottom: 10,
              backdropFilter: "blur(4px)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 1,
                background: "#fde047",
                boxShadow: "0 0 8px #fde047",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "#fef08a",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {verifiedTable
                ? `Table #${verifiedTable} Dine-In Menu • Scan Verified`
                : "Artisan Kitchen • Stone Baked Daily"}
            </span>
          </div>

          {/* Headline: Crisp White with Golden Yellow Highlight */}
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 4vw, 36px)",
              fontWeight: 900,
              color: "#ffffff",
              marginBottom: 8,
              lineHeight: 1.18,
              letterSpacing: "-0.02em",
              textShadow: "0 2px 10px rgba(0,0,0,0.18)",
            }}
          >
            Handcrafted Pizzas.{" "}
            <span
              style={{
                color: "#fde047",
                textShadow: "0 2px 12px rgba(253, 224, 71, 0.4)",
              }}
            >
              Fresh Every Order.
            </span>
          </h1>

          {/* Subtext */}
          <p
            style={{
              fontSize: "clamp(12px, 1.4vw, 14px)",
              color: "#fef2f2",
              lineHeight: 1.5,
              marginBottom: 16,
              maxWidth: 540,
              opacity: 0.95,
            }}
          >
            Fresh stone-baked pizzas, burgers &amp; drinks prepared to order with live tracking.
          </p>

          {/* Red, Yellow & White Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            {/* Primary Button: Golden Yellow with Dark Red Accent */}
            <a
              href="#menu"
              id="hero-view-menu-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 18px",
                borderRadius: 4,
                background: "#fbbf24",
                color: "#7c2d12",
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: "0.02em",
                textDecoration: "none",
                boxShadow: "0 3px 10px rgba(0, 0, 0, 0.2)",
                border: "1px solid #f59e0b",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#fde047";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fbbf24";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span>Explore Menu</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="square">
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
            </a>

            {/* Secondary Button: Crisp White Outline */}
            <a
              href="#specials"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "8px 14px",
                borderRadius: 4,
                background: "rgba(255, 255, 255, 0.12)",
                color: "#ffffff",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 12,
                textDecoration: "none",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                transition: "all 0.15s ease",
                backdropFilter: "blur(4px)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
              }}
            >
              Kitchen Standards
            </a>
          </div>
        </div>

        {/* 3 Slim Highlight Chips (Red, Yellow, White & Orange palette) */}
        <div
          id="specials"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 8,
            paddingTop: 12,
            borderTop: "1px solid rgba(255, 255, 255, 0.18)",
          }}
        >
          <div
            style={{
              padding: "6px 10px",
              borderRadius: 3,
              background: "rgba(0, 0, 0, 0.18)",
              border: "1px solid rgba(254, 240, 138, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 2,
                background: "rgba(253, 224, 71, 0.25)",
                color: "#fde047",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#ffffff" }}>
              10-15 Min Stone Bake
            </span>
          </div>

          <div
            style={{
              padding: "6px 10px",
              borderRadius: 3,
              background: "rgba(0, 0, 0, 0.18)",
              border: "1px solid rgba(254, 215, 170, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 2,
                background: "rgba(251, 146, 60, 0.25)",
                color: "#fed7aa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#ffffff" }}>
              100% Real Whole Cheese
            </span>
          </div>

          <div
            style={{
              padding: "6px 10px",
              borderRadius: 3,
              background: "rgba(0, 0, 0, 0.18)",
              border: "1px solid rgba(254, 240, 138, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 2,
                background: "rgba(254, 240, 138, 0.25)",
                color: "#fef08a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              </svg>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#ffffff" }}>
              Live Kitchen Tracking
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
