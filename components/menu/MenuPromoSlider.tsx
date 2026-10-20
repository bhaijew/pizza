"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { PromoSlide } from "@/lib/preset-images";
import { Sparkles } from "lucide-react";

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const ArrowRightIcon = ({ color }: { color?: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

interface MenuPromoSliderProps {
  slides?: PromoSlide[];
  mobileHeight?: number;
  desktopHeight?: number;
  themeColor?: string;
  autoPlayInterval?: number;
}

export default function MenuPromoSlider({
  slides = [],
  mobileHeight = 180,
  desktopHeight = 260,
  themeColor = "#ea580c",
  autoPlayInterval = 4500,
}: MenuPromoSliderProps) {
  const activeSlides = slides.filter((s) => s.is_active !== false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const total = activeSlides.length;

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Autoplay
  useEffect(() => {
    if (total <= 1 || isPaused) return;
    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [total, isPaused, autoPlayInterval, nextSlide]);

  if (total === 0) return null;

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 clamp(12px, 2vw, 20px)",
      }}
    >
      <div
        className="promo-slider-container relative overflow-hidden select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          borderRadius: "14px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
          position: "relative",
          margin: "12px 0 20px",
          backgroundColor: "#0f172a",
        }}
      >
        {/* Slides Track */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "var(--slider-height, 180px)",
            overflow: "hidden",
          }}
        >
          {activeSlides.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <div
                key={slide.id || idx}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? "scale(1)" : "scale(1.04)",
                  transition: "opacity 0.5s ease-in-out, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                  pointerEvents: isActive ? "auto" : "none",
                  zIndex: isActive ? 2 : 1,
                }}
              >
                {/* Background Image */}
                <img
                  src={slide.image_url}
                  alt={slide.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                  }}
                  loading={idx === 0 ? "eager" : "lazy"}
                />

                {/* Dark Gradient Overlay for optimal legibility */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(90deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.65) 55%, rgba(15, 23, 42, 0.25) 100%)",
                  }}
                />

                {/* Ambient theme glow */}
                <div
                  style={{
                    position: "absolute",
                    top: "-20%",
                    left: "-10%",
                    width: "50%",
                    height: "140%",
                    background: `radial-gradient(circle, ${themeColor}40 0%, transparent 70%)`,
                    pointerEvents: "none",
                  }}
                />

                {/* Content Overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    padding: "clamp(12px, 3.5vw, 28px)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    maxWidth: "min(680px, 85%)",
                    color: "#ffffff",
                    zIndex: 3,
                  }}
                >
                  {slide.badge && (
                    <div style={{ marginBottom: "6px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "3px 9px",
                          borderRadius: "6px",
                          background: themeColor,
                          color: "#ffffff",
                          fontSize: "11px",
                          fontWeight: 800,
                          letterSpacing: "0.03em",
                          boxShadow: `0 2px 8px ${themeColor}60`,
                          textTransform: "uppercase",
                        }}
                      >
                        <Sparkles size={11} />
                        <span>{slide.badge}</span>
                      </span>
                    </div>
                  )}

                  <h3
                    style={{
                      fontSize: "clamp(13px, 2.5vw, 18px)",
                      fontWeight: 900,
                      lineHeight: 1.25,
                      margin: "0 0 3px",
                      textShadow: "0 2px 8px rgba(0, 0, 0, 0.6)",
                      letterSpacing: "-0.015em",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {slide.title}
                  </h3>

                  {slide.subtitle && (
                    <p
                      style={{
                        fontSize: "clamp(11px, 2vw, 13px)",
                        color: "#e2e8f0",
                        margin: "0 0 10px",
                        lineHeight: 1.35,
                        textShadow: "0 1px 4px rgba(0, 0, 0, 0.5)",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {slide.subtitle}
                    </p>
                  )}

                  {slide.link_url && (
                    <div>
                      <a
                        href={slide.link_url}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 14px",
                          borderRadius: "6px",
                          background: "#ffffff",
                          color: "#0f172a",
                          fontSize: "11px",
                          fontWeight: 800,
                          textDecoration: "none",
                          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <span>View Deal</span>
                        <ArrowRightIcon color={themeColor} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation Arrows (shown if more than 1 slide) */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              style={{
                position: "absolute",
                left: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "rgba(15, 23, 42, 0.65)",
                backdropFilter: "blur(4px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 10,
                transition: "background 0.15s ease",
              }}
              aria-label="Previous slide"
            >
              <ChevronLeftIcon />
            </button>

            <button
              type="button"
              onClick={nextSlide}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "rgba(15, 23, 42, 0.65)",
                backdropFilter: "blur(4px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 10,
                transition: "background 0.15s ease",
              }}
              aria-label="Next slide"
            >
              <ChevronRightIcon />
            </button>

            {/* Dots Pagination */}
            <div
              style={{
                position: "absolute",
                bottom: "8px",
                right: "12px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                zIndex: 10,
                background: "rgba(15, 23, 42, 0.6)",
                backdropFilter: "blur(4px)",
                padding: "3px 8px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              {activeSlides.map((_, dotIdx) => {
                const isDotActive = dotIdx === currentIndex;
                return (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => setCurrentIndex(dotIdx)}
                    style={{
                      width: isDotActive ? "16px" : "6px",
                      height: "6px",
                      borderRadius: "3px",
                      background: isDotActive ? themeColor : "rgba(255, 255, 255, 0.4)",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      transition: "all 0.25s ease",
                    }}
                    aria-label={`Go to slide ${dotIdx + 1}`}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .promo-slider-container {
          --slider-height: ${mobileHeight}px;
        }
        @media (min-width: 768px) {
          .promo-slider-container {
            --slider-height: ${desktopHeight}px;
          }
        }
      `}</style>
    </div>
  );
}
