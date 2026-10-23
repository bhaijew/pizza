"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ChefHat,
  MessageSquare,
  Download,
  Plus,
} from "@/components/admin/AdminIcons";

interface CommandCenterHeroProps {
  shopName: string;
  pendingOrders: number;
  posUrl: string;
  customImages?: string[];
}

const DEFAULT_COMMAND_CENTER_IMAGES = [
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1600&auto=format&fit=crop&q=80", // Artisan stone bake pizza
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1600&auto=format&fit=crop&q=80", // Gourmet pizza fresh herbs
  "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=1600&auto=format&fit=crop&q=80", // Crispy golden zinger burger
  "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1600&auto=format&fit=crop&q=80", // Oven hot melted cheese pizza
  "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=1600&auto=format&fit=crop&q=80", // Wood-fire pizza oven chef
  "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=1600&auto=format&fit=crop&q=80", // Fresh pepperoni pizza
];

export default function CommandCenterHero({
  shopName,
  pendingOrders,
  posUrl,
  customImages = [],
}: CommandCenterHeroProps) {
  // Combine custom images (if any) with defaults without duplicates
  const images = (function () {
    const list: string[] = [];
    customImages.forEach((img) => {
      if (img && typeof img === "string" && img.trim() && !list.includes(img.trim())) {
        list.push(img.trim());
      }
    });
    DEFAULT_COMMAND_CENTER_IMAGES.forEach((img) => {
      if (!list.includes(img)) list.push(img);
    });
    return list;
  })();

  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-scroll images every 4.5 seconds
  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % images.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div
      style={{
        borderRadius: 16,
        color: "#ffffff",
        marginBottom: 26,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 20,
        boxShadow:
          "0 20px 40px -15px rgba(7, 12, 24, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#070c18",
      }}
      className="p-5 sm:p-7 md:p-8"
    >
      {/* ─── Multiple Background Images Slideshow with Smooth Slide & Zoom Animation ─── */}
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
        {images.map((imgUrl, idx) => {
          const isActive = idx === activeSlide;
          const isPrev =
            idx === activeSlide - 1 || (activeSlide === 0 && idx === images.length - 1);
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
                  ? "translateX(-6%) scale(1.0)"
                  : "translateX(6%) scale(1.0)",
                transition:
                  "opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), transform 5s cubic-bezier(0.25, 1, 0.5, 1)",
              }}
            />
          );
        })}

        {/* Deep Multi-Layer Gradient Overlay for 100% Legibility */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(7, 12, 24, 0.94) 0%, rgba(7, 12, 24, 0.82) 48%, rgba(7, 12, 24, 0.68) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(7, 12, 24, 0.4) 0%, transparent 40%, rgba(7, 12, 24, 0.85) 100%)",
          }}
        />
      </div>

      {/* Ambient Glow Lights */}
      <div
        style={{
          position: "absolute",
          right: "-40px",
          top: "-40px",
          width: "280px",
          height: "280px",
          background:
            "radial-gradient(circle, rgba(234, 88, 12, 0.35) 0%, rgba(239, 68, 68, 0.15) 50%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "-50px",
          bottom: "-50px",
          width: "260px",
          height: "260px",
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Slide Navigation Controls & Counter */}
      {images.length > 1 && (
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            display: "flex",
            alignItems: "center",
            gap: 6,
            zIndex: 3,
            background: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(8px)",
            padding: "4px 10px",
            borderRadius: 20,
            border: "1px solid rgba(255, 255, 255, 0.18)",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveSlide((prev) => (prev - 1 + images.length) % images.length)}
            aria-label="Previous background"
            style={{
              background: "transparent",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              padding: "0 2px",
              display: "flex",
              alignItems: "center",
              opacity: 0.85,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveSlide(i)}
              aria-label={`Switch to image ${i + 1}`}
              style={{
                width: i === activeSlide ? 16 : 6,
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
            onClick={() => setActiveSlide((prev) => (prev + 1) % images.length)}
            aria-label="Next background"
            style={{
              background: "transparent",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              padding: "0 2px",
              display: "flex",
              alignItems: "center",
              opacity: 0.85,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}

      {/* Auto-Slide Glowing Progress Timer Bar */}
      <div
        key={`admin-hero-timer-${activeSlide}`}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 3,
          background: "linear-gradient(90deg, #f59e0b, #fbbf24, #10b981)",
          boxShadow: "0 0 10px rgba(251, 191, 36, 0.6)",
          zIndex: 10,
          animation: "adminHeroSlideTimer 4.5s linear forwards",
        }}
      />

      {/* Embedded Animation Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes adminHeroSlideTimer {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}} />

      {/* Text & Title Content */}
      <div style={{ position: "relative", zIndex: 2, maxWidth: 640 }}>
        {/* Live Operations Pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 12px",
            borderRadius: 20,
            background: "rgba(16, 185, 129, 0.16)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            marginBottom: 12,
            backdropFilter: "blur(6px)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#10b981",
              display: "inline-block",
              boxShadow: "0 0 10px #10b981",
            }}
            className="admin-pulse-green"
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "#34d399",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Live Operations Terminal
          </span>
        </div>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            margin: "0 0 8px",
            lineHeight: 1.2,
            textShadow: "0 2px 10px rgba(0,0,0,0.5)",
          }}
        >
          <span className="bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">
            {shopName}
          </span>{" "}
          Command Center
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "#e2e8f0",
            lineHeight: 1.5,
            textShadow: "0 1px 4px rgba(0,0,0,0.6)",
          }}
        >
          Real-time kitchen order sequencing, WhatsApp dispatch automation &amp; daily shift telemetry.
        </p>
      </div>

      {/* Quick Executive Shortcuts */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          position: "relative",
          zIndex: 2,
        }}
      >
        <Link
          href="/admin/orders"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 18px",
            borderRadius: 10,
            background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
            color: "#ffffff",
            fontWeight: 800,
            fontSize: 13,
            textDecoration: "none",
            boxShadow: "0 6px 18px -2px rgba(234, 88, 12, 0.45)",
            border: "none",
            transition: "all 0.2s ease",
          }}
          className="hover:scale-105 active:scale-95"
        >
          <ShoppingBag size={16} />
          <span>Live Order Board</span>
          {pendingOrders > 0 && (
            <span
              style={{
                background: "#ffffff",
                color: "#ea580c",
                padding: "1px 8px",
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 900,
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              }}
            >
              {pendingOrders}
            </span>
          )}
        </Link>

        <Link
          href="/admin/kitchen"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 18px",
            borderRadius: 10,
            background: "rgba(15, 23, 42, 0.65)",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: 13,
            textDecoration: "none",
            border: "1px solid rgba(255, 255, 255, 0.22)",
            backdropFilter: "blur(10px)",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
          }}
          className="hover:bg-slate-900/80 hover:scale-105 active:scale-95"
        >
          <ChefHat size={16} className="text-orange-400" />
          <span>Kitchen KDS</span>
        </Link>

        <Link
          href="/admin/sole-what"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 16px",
            borderRadius: 10,
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#ffffff",
            fontWeight: 800,
            fontSize: 13,
            textDecoration: "none",
            boxShadow: "0 6px 18px -2px rgba(16, 185, 129, 0.4)",
            border: "none",
            transition: "all 0.2s ease",
          }}
          className="hover:scale-105 active:scale-95"
          title="Sole-What WhatsApp Gateway Hub"
        >
          <MessageSquare size={16} />
          <span>Sole-What WA</span>
          <span
            style={{
              background: "#ffffff",
              color: "#059669",
              padding: "1px 6px",
              borderRadius: 10,
              fontSize: 10,
              fontWeight: 900,
            }}
          >
            BOT
          </span>
        </Link>

        <Link
          href={posUrl}
          target="_blank"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 16px",
            borderRadius: 10,
            background: "rgba(16, 185, 129, 0.16)",
            color: "#34d399",
            fontWeight: 700,
            fontSize: 13,
            textDecoration: "none",
            border: "1px solid rgba(16, 185, 129, 0.45)",
            backdropFilter: "blur(10px)",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
          }}
          className="hover:bg-emerald-500/25 hover:scale-105 active:scale-95"
          title="Open Cashier POS Terminal"
        >
          <Download size={15} />
          <span>Open POS</span>
        </Link>

        <Link
          href="/admin/products?action=new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "11px 16px",
            borderRadius: 10,
            background: "rgba(15, 23, 42, 0.55)",
            color: "#e2e8f0",
            fontWeight: 600,
            fontSize: 13,
            textDecoration: "none",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            backdropFilter: "blur(10px)",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
          }}
          className="hover:bg-slate-900/80 hover:scale-105 active:scale-95"
        >
          <Plus size={15} />
          <span>Add Pizza</span>
        </Link>
      </div>
    </div>
  );
}
