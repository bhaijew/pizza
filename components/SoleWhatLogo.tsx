"use client";

import React from "react";

interface SoleWhatLogoProps {
  size?: number;
  className?: string;
  variant?: "badge" | "iconOnly" | "shield";
  showGlow?: boolean;
}

/**
 * Sole-What Bespoke Brand Emblem
 * An iconic, high-end monogram fusing the letters "S" & "W" with a dynamic
 * culinary flame crest and real-time cloud pulse spark.
 */
export default function SoleWhatLogo({
  size = 40,
  className = "",
  variant = "badge",
  showGlow = true,
}: SoleWhatLogoProps) {
  const iconSize = variant === "badge" || variant === "shield" ? Math.round(size * 0.68) : size;

  // Unique Vector Geometry for Sole-What (SW Monogram + Flame Crown + Cloud Spark)
  const SoleWhatIcon = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-transform duration-300 group-hover:scale-105"
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Core Primary Gradient (Crimson to Ember Orange) */}
        <linearGradient id="swPrimaryGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="48%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>

        {/* Secondary Wing Gradient (Sunset Gold to Rose) */}
        <linearGradient id="swAccentGrad" x1="56" y1="12" x2="14" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="55%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>

        {/* Golden Crown Spark */}
        <linearGradient id="swGoldGrad" x1="32" y1="4" x2="48" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="60%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        {/* Subtle Depth Shadow */}
        <filter id="swDropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#991b1b" floodOpacity="0.35" />
        </filter>

        {/* Soft Radial Ambient Glow */}
        <filter id="swGlowFilter" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* ─── Ambient Glow Halo (Only when glowing) ─── */}
      {showGlow && (
        <circle
          cx="32"
          cy="32"
          r="24"
          fill="url(#swPrimaryGrad)"
          opacity="0.22"
          filter="url(#swGlowFilter)"
        />
      )}

      {/* ─── The Iconic S-W Fusion Geometry ─── */}
      <g filter="url(#swDropShadow)">
        
        {/* Left 'S' Dynamic Sweep Ribbon */}
        <path
          d="M 31 16.5 C 24 16.5 17 19.5 14.5 24.5 C 12 29.5 14 34 19 36.5 L 27.5 40.5 C 31.5 42.5 33 44.5 31.5 48 C 29.8 51.5 24.5 52 19 49 C 15.5 47 13.5 44 13 41.5"
          stroke="url(#swPrimaryGrad)"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right 'W' Precision Wing Ribbon */}
        <path
          d="M 23 47.5 L 30 26.5 C 31 23.5 33.5 23.5 34.5 26.5 L 39 39 C 40 41.5 42 41.5 43 39 L 48.5 21"
          stroke="url(#swAccentGrad)"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Outer Right Wing Tip with Arrowhead Energy */}
        <path
          d="M 43 38 L 47 48 C 48 50.5 50.5 51 52.5 48.5 L 56 42.5"
          stroke="url(#swPrimaryGrad)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* ─── Top Flame / Crown Apex (Culinary Excellence) ─── */}
        <path
          d="M 33 6.5 C 33 6.5 36.5 10 35 13.5 C 33.8 16 31 16.5 31 16.5 C 31 16.5 33.5 15.5 34 14 C 34.6 12.2 33 6.5 33 6.5 Z"
          fill="url(#swGoldGrad)"
        />

        {/* ─── Realtime Cloud Pulse Diamond Spark (Intelligence Node) ─── */}
        <path
          d="M 50 11 L 52 7 L 54 11 L 58 13 L 54 15 L 52 19 L 50 15 L 46 13 Z"
          fill="url(#swGoldGrad)"
          filter="url(#swGlowFilter)"
        />

        {/* Central Sync Core Micro-Node */}
        <circle cx="32" cy="32" r="2" fill="#ffffff" opacity="0.9" />
      </g>
    </svg>
  );

  // Variant: Standalone Icon Only
  if (variant === "iconOnly") {
    return (
      <div
        className={`inline-flex items-center justify-center transition-all ${className}`}
        style={{
          width: size,
          height: size,
          flexShrink: 0,
        }}
      >
        {SoleWhatIcon}
      </div>
    );
  }

  // Variant: Shield / Crest
  if (variant === "shield") {
    const borderRadius = Math.round(size * 0.28);
    return (
      <div
        className={`relative inline-flex items-center justify-center transition-all ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: `${borderRadius}px`,
          background: "linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)",
          border: "1.5px solid rgba(234, 88, 12, 0.25)",
          boxShadow: showGlow
            ? "0 8px 20px -4px rgba(234, 88, 12, 0.2), 0 2px 6px -1px rgba(0, 0, 0, 0.06)"
            : "0 2px 8px -2px rgba(0, 0, 0, 0.08)",
          flexShrink: 0,
        }}
      >
        {SoleWhatIcon}
      </div>
    );
  }

  // Variant: Badge (The signature gradient badge with luxury squircle)
  const borderRadius = Math.round(size * 0.26);

  return (
    <div
      className={`relative inline-flex items-center justify-center transition-transform hover:scale-105 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: `${borderRadius}px`,
        background: "linear-gradient(135deg, #ffffff 0%, #fffbf5 100%)",
        border: "1px solid rgba(226, 232, 240, 0.9)",
        boxShadow: showGlow
          ? "0 10px 25px -5px rgba(234, 88, 12, 0.18), 0 2px 6px rgba(0, 0, 0, 0.05)"
          : "0 2px 8px rgba(0, 0, 0, 0.06)",
        flexShrink: 0,
      }}
    >
      {/* Background micro warm tint */}
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(254, 215, 170, 0.3) 0%, transparent 70%)",
        }}
      />
      {SoleWhatIcon}
    </div>
  );
}
