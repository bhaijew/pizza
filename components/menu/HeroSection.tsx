"use client";

import { useEffect, useState } from "react";
import type { ShopSettings } from "@/lib/menu-data";

interface HeroSectionProps {
  verifiedTable?: string;
  themeColor?: string;
  settings?: Partial<ShopSettings>;
}

export default function HeroSection({
  verifiedTable,
  themeColor = "#991b1b",
  settings,
}: HeroSectionProps = {}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // ─── Extract Hero Settings with Safe Fallbacks ─────────────────
  const badgeText =
    settings?.hero_badge_text !== undefined
      ? settings.hero_badge_text
      : "Artisan Kitchen • Stone Baked Daily";

  const title =
    settings?.hero_title !== undefined
      ? settings.hero_title
      : "Handcrafted Pizzas.";

  const titleHighlight =
    settings?.hero_title_highlight !== undefined
      ? settings.hero_title_highlight
      : "Fresh Every Order.";

  const subtitle =
    settings?.hero_subtitle !== undefined
      ? settings.hero_subtitle
      : "Fresh stone-baked pizzas, burgers & drinks prepared to order.";

  const btnPrimaryText =
    settings?.hero_btn_primary_text !== undefined
      ? settings.hero_btn_primary_text
      : "Explore Menu";
  const btnPrimaryLink = settings?.hero_btn_primary_link || "#menu";

  const btnSecondaryText =
    settings?.hero_btn_secondary_text !== undefined
      ? settings.hero_btn_secondary_text
      : "";
  const btnSecondaryLink = settings?.hero_btn_secondary_link || "#specials";

  const chip1 =
    settings?.hero_chip1_text !== undefined
      ? settings.hero_chip1_text
      : "10-15 Min Stone Bake";

  const chip2 =
    settings?.hero_chip2_text !== undefined
      ? settings.hero_chip2_text
      : "100% Real Whole Cheese";

  const chip3 =
    settings?.hero_chip3_text !== undefined
      ? settings.hero_chip3_text
      : "";

  const showChips =
    settings?.hero_show_chips !== false &&
    (!!chip1.trim() || !!chip2.trim() || !!chip3.trim());

  const bgType = settings?.hero_bg_type || "image";
  const bgImage = settings?.hero_bg_image;
  const bgGradient = settings?.hero_bg_gradient;
  const bgColor = settings?.hero_bg_color;
  // Eliminate intrusive grid mesh so food photos are crystal clear
  const showPattern = settings?.hero_show_pattern === true;

  // ─── Dynamic Auto-Scrolling Background Slideshow ────────────────
  const heroSlideImages = (function () {
    const slides: string[] = [];
    if (bgImage?.trim()) slides.push(bgImage.trim());
    if (Array.isArray(settings?.slider_images)) {
      settings.slider_images.forEach((s: any) => {
        if (s?.image_url && !slides.includes(s.image_url)) slides.push(s.image_url);
      });
    }
    const defaultSlides = [
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=1600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=1600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=1600&auto=format&fit=crop&q=80",
    ];
    defaultSlides.forEach((url) => {
      if (!slides.includes(url)) slides.push(url);
    });
    return slides;
  })();

  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-cycle slide every 4.5 seconds
  useEffect(() => {
    if (heroSlideImages.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlideImages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [heroSlideImages.length]);

  // Determine badge text
  const renderedBadge = verifiedTable
    ? badgeText.trim()
      ? `Table #${verifiedTable} • ${badgeText.trim()}`
      : `Table #${verifiedTable} Dine-In Menu • Scan Verified`
    : badgeText.trim();

  const hasButtons = !!btnPrimaryText.trim() || !!btnSecondaryText.trim();
  const hasHeading = !!title.trim() || !!titleHighlight.trim();

  return (
    <section
      id="hero"
      aria-label="Restaurant hero"
      style={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#09090b",
        color: "#ffffff",
        padding: "clamp(24px, 3.6vw, 42px) clamp(16px, 2.5vw, 24px)",
        borderBottom: "2px solid #f59e0b",
      }}
    >
      {/* Dynamic Auto-Scrolling Background Slideshow with Horizontal Slide Animation */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        {heroSlideImages.map((imgUrl, idx) => {
          const isActive = idx === activeSlide;
          const isPrev = (idx === activeSlide - 1) || (activeSlide === 0 && idx === heroSlideImages.length - 1);
          return (
            <div
              key={imgUrl + idx}
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url("${imgUrl}")`,
                backgroundPosition: "center",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                opacity: isActive ? 1 : 0,
                transform: isActive
                  ? "translateX(0) scale(1.06)"
                  : isPrev
                  ? "translateX(-8%) scale(1.0)"
                  : "translateX(8%) scale(1.0)",
                transition: "opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), transform 5s cubic-bezier(0.25, 1, 0.5, 1)",
              }}
            />
          );
        })}

        {/* Deep Cinematic Gradient Overlay for 100% Text Clarity */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(105deg, rgba(9, 9, 11, 0.92) 0%, rgba(9, 9, 11, 0.78) 45%, rgba(9, 9, 11, 0.65) 100%)",
          }}
        />
      </div>

      {/* Auto-Slide Glowing Progress Timer Bar */}
      <div
        key={`hero-timer-${activeSlide}`}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 3,
          background: "linear-gradient(90deg, #f59e0b, #fbbf24, #fde047)",
          boxShadow: "0 0 10px rgba(251, 191, 36, 0.7)",
          zIndex: 10,
          animation: "heroSlideTimer 4.5s linear forwards",
        }}
      />

      {/* Slide Navigation Dots & Manual Arrows */}
      {heroSlideImages.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 18,
            display: "flex",
            alignItems: "center",
            gap: 6,
            zIndex: 3,
            background: "rgba(0, 0, 0, 0.35)",
            backdropFilter: "blur(6px)",
            padding: "4px 8px",
            borderRadius: 20,
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveSlide((prev) => (prev - 1 + heroSlideImages.length) % heroSlideImages.length)}
            aria-label="Previous image"
            style={{
              background: "transparent",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              padding: "0 2px",
              display: "flex",
              alignItems: "center",
              opacity: 0.8,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {heroSlideImages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: i === activeSlide ? 18 : 6,
                height: 6,
                borderRadius: 3,
                background: i === activeSlide ? "#fbbf24" : "rgba(255, 255, 255, 0.4)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s ease",
                padding: 0,
              }}
            />
          ))}

          <button
            type="button"
            onClick={() => setActiveSlide((prev) => (prev + 1) % heroSlideImages.length)}
            aria-label="Next image"
            style={{
              background: "transparent",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              padding: "0 2px",
              display: "flex",
              alignItems: "center",
              opacity: 0.8,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}

      {/* Embedded Animation Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes heroSlideTimer {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}} />

      {/* Subtle grid pattern if explicitly enabled */}
      {showPattern && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}

      {/* Warm Golden Glow Spotlight */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -20,
          right: "10%",
          width: 420,
          height: 220,
          background: "radial-gradient(circle, rgba(251, 191, 36, 0.22) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 1,
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
          {/* Badge (Rendered only if text is provided) */}
          {renderedBadge && (
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
                {renderedBadge}
              </span>
            </div>
          )}

          {/* Headline: Main Title & Highlight Accent Title */}
          {hasHeading && (
            <h1
              style={{
                fontFamily: "var(--font-display, inherit)",
                fontSize: "clamp(24px, 4vw, 36px)",
                fontWeight: 900,
                color: "#ffffff",
                marginBottom: 8,
                lineHeight: 1.18,
                letterSpacing: "-0.02em",
                textShadow: "0 2px 10px rgba(0,0,0,0.18)",
              }}
            >
              {title.trim() && <span>{title.trim()} </span>}
              {titleHighlight.trim() && (
                <span
                  style={{
                    color: "#fde047",
                    textShadow: "0 2px 12px rgba(253, 224, 71, 0.4)",
                  }}
                >
                  {titleHighlight.trim()}
                </span>
              )}
            </h1>
          )}

          {/* Subtext (Rendered only if text is provided) */}
          {subtitle.trim() && (
            <p
              style={{
                fontSize: "clamp(12px, 1.4vw, 14px)",
                color: "#fef2f2",
                lineHeight: 1.5,
                marginBottom: hasButtons ? 16 : 8,
                maxWidth: 540,
                opacity: 0.95,
              }}
            >
              {subtitle.trim()}
            </p>
          )}

          {/* Action Buttons */}
          {hasButtons && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
              {/* Primary Button */}
              {btnPrimaryText.trim() && (
                <a
                  href={btnPrimaryLink}
                  id="hero-view-menu-btn"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 18px",
                    borderRadius: 4,
                    background: "#fbbf24",
                    color: "#7c2d12",
                    fontFamily: "var(--font-display, inherit)",
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
                  <span>{btnPrimaryText.trim()}</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="square">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <polyline points="19 12 12 19 5 12" />
                  </svg>
                </a>
              )}

              {/* Secondary Button (Optional, renders only if text is provided) */}
              {btnSecondaryText.trim() && (
                <a
                  href={btnSecondaryLink}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "8px 14px",
                    borderRadius: 4,
                    background: "rgba(255, 255, 255, 0.12)",
                    color: "#ffffff",
                    fontFamily: "var(--font-display, inherit)",
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
                  {btnSecondaryText.trim()}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Highlight Chips (Shown only if enabled and at least one chip has text) */}
        {showChips && (
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
            {chip1.trim() && (
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
                  {chip1.trim()}
                </span>
              </div>
            )}

            {chip2.trim() && (
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
                  {chip2.trim()}
                </span>
              </div>
            )}

            {chip3.trim() && (
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
                  {chip3.trim()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

