"use client";

import React from "react";

interface BrandLogoProps {
  size?: number;
  className?: string;
  variant?: "iconOnly" | "badge";
  theme?: "transparent" | "dark" | "gold" | "crimson";
  showGlow?: boolean;
}

/**
 * Modern Artisan Pizza Brand Emblem
 * Features golden baked crust, molten cheese pull, savory pepperoni slices,
 * fresh basil herb accents, and steam aroma glow. Zero red background by default.
 */
export default function BrandLogo({
  size = 42,
  className = "",
  variant = "iconOnly",
  theme = "transparent",
  showGlow = true,
}: BrandLogoProps) {
  const iconSize = variant === "badge" ? Math.round(size * 0.72) : size;

  const PizzaIcon = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Crust Gradient — Golden Baked */}
        <linearGradient id="crustGrad" x1="6" y1="8" x2="42" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        {/* Sauce & Cheese Gradient — Molten Mozzarella */}
        <linearGradient id="cheeseGrad" x1="12" y1="14" x2="36" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="40%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>

        {/* Pepperoni Gradient */}
        <linearGradient id="pepGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="70%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>

        {/* Badge Background Glow */}
        <linearGradient id="badgeBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="50%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>

        {/* Steam Filter */}
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Steam lines */}
      <path
        d="M 19 6 C 18 4, 21 3, 20 1"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
      <path
        d="M 27 7 C 26 5, 29 4, 28 2"
        stroke="#fde047"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.7"
      />

      {/* Pizza Slice Triangle / Cheese base */}
      <path
        d="M 8.5 15.5 C 17.5 12 30.5 12 39.5 15.5 L 24 43.5 Z"
        fill="url(#cheeseGrad)"
        stroke="#b45309"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Crust Arc */}
      <path
        d="M 6.5 14.5 C 16.5 9.5 31.5 9.5 41.5 14.5 C 42.5 16.5 40.5 18.5 38 17.5 C 29.5 14 18.5 14 10 17.5 C 7.5 18.5 5.5 16.5 6.5 14.5 Z"
        fill="url(#crustGrad)"
        stroke="#b45309"
        strokeWidth="1.2"
      />

      {/* Crust Texture Marks */}
      <circle cx="16" cy="12.5" r="1" fill="#b45309" fillOpacity="0.4" />
      <circle cx="24" cy="11.5" r="1.2" fill="#b45309" fillOpacity="0.4" />
      <circle cx="32" cy="12.5" r="1" fill="#b45309" fillOpacity="0.4" />

      {/* Cheese Melt Droplets */}
      <path
        d="M 12 17 C 12 19, 13.5 19, 14 17.5"
        stroke="#facc15"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 28 17 C 28.5 20, 30.5 20, 31 17.5"
        stroke="#facc15"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Pepperoni 1 (Top Left) */}
      <g filter="url(#softGlow)">
        <circle cx="18" cy="21" r="4.2" fill="url(#pepGrad)" stroke="#7f1d1d" strokeWidth="0.8" />
        <circle cx="16.5" cy="19.5" r="0.8" fill="#fca5a5" fillOpacity="0.8" />
        <circle cx="19" cy="22.5" r="0.5" fill="#fef2f2" fillOpacity="0.6" />
      </g>

      {/* Pepperoni 2 (Top Right) */}
      <g filter="url(#softGlow)">
        <circle cx="30" cy="22" r="4.2" fill="url(#pepGrad)" stroke="#7f1d1d" strokeWidth="0.8" />
        <circle cx="28.5" cy="20.5" r="0.8" fill="#fca5a5" fillOpacity="0.8" />
        <circle cx="31.5" cy="23.5" r="0.5" fill="#fef2f2" fillOpacity="0.6" />
      </g>

      {/* Pepperoni 3 (Center Lower) */}
      <g filter="url(#softGlow)">
        <circle cx="24" cy="31" r="3.8" fill="url(#pepGrad)" stroke="#7f1d1d" strokeWidth="0.8" />
        <circle cx="22.8" cy="29.8" r="0.7" fill="#fca5a5" fillOpacity="0.8" />
      </g>

      {/* Fresh Green Basil Leaf 1 */}
      <path
        d="M 23 18 C 21 16, 23 14, 25 15 C 25 17, 24 18, 23 18 Z"
        fill="#10b981"
        stroke="#047857"
        strokeWidth="0.5"
      />

      {/* Fresh Green Basil Leaf 2 */}
      <path
        d="M 18 29 C 16.5 28, 17.5 26.5, 19 27 C 19 28.5, 18.5 29, 18 29 Z"
        fill="#10b981"
        stroke="#047857"
        strokeWidth="0.5"
      />

      {/* Cheese highlight / gleam */}
      <path
        d="M 28 29 L 26.5 35"
        stroke="#ffffff"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
    </svg>
  );

  if (variant === "iconOnly" || theme === "transparent" || theme === "crimson") {
    return (
      <div
        className={`inline-flex items-center justify-center transition-transform hover:scale-105 ${className}`}
        style={{
          width: size,
          height: size,
          flexShrink: 0,
          filter: showGlow
            ? "drop-shadow(0 4px 8px rgba(245, 158, 11, 0.4)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))"
            : undefined,
        }}
      >
        {PizzaIcon}
      </div>
    );
  }

  // Badge Variant: Clean luxury squircle without red background
  const borderRadius = Math.round(size * 0.24);

  const themeStyles = {
    transparent: {
      background: "transparent",
      border: "none",
      boxShadow: "none",
      aura: "none",
    },
    dark: {
      background: "rgba(255, 255, 255, 0.05)",
      border: "1px solid rgba(255, 255, 255, 0.12)",
      boxShadow: showGlow ? "0 4px 14px rgba(0, 0, 0, 0.4)" : "none",
      aura: "none",
    },
    gold: {
      background: "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)",
      border: "1px solid rgba(245, 158, 11, 0.3)",
      boxShadow: showGlow ? "0 4px 14px rgba(245, 158, 11, 0.25)" : "none",
      aura: "none",
    },
    crimson: {
      background: "transparent",
      border: "none",
      boxShadow: "none",
      aura: "none",
    },
  }[theme];

  return (
    <div
      className={`relative inline-flex items-center justify-center transition-transform hover:scale-105 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: `${borderRadius}px`,
        background: themeStyles.background,
        border: themeStyles.border,
        boxShadow: themeStyles.boxShadow,
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* Background warm radial aura */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: themeStyles.aura,
          pointerEvents: "none",
        }}
      />
      {PizzaIcon}
    </div>
  );
}
