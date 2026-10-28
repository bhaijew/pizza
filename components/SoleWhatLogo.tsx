"use client";

import React from "react";
import Image from "next/image";

interface SoleWhatLogoProps {
  size?: number;
  className?: string;
  variant?: "badge" | "iconOnly" | "shield" | "horizontal";
  showGlow?: boolean;
}

/**
 * SoleWhat Official Brand Emblem & Monogram
 * Featuring the official high-tech geometric lightning-hexagon emblem
 * and vibrant electric orange/amber SaaS identity.
 */
export default function SoleWhatLogo({
  size = 42,
  className = "",
  variant = "badge",
  showGlow = true,
}: SoleWhatLogoProps) {
  // Horizontal Lockup (Emblem + "SoleWhat" Typography)
  if (variant === "horizontal") {
    const h = size;
    const w = Math.round(size * 4.8);
    return (
      <div className={`relative inline-flex items-center ${className}`}>
        <Image
          src="/images/solewhat-horizontal.png"
          alt="SoleWhat Official Brand Logo"
          width={w}
          height={h}
          className="object-contain"
          priority
        />
      </div>
    );
  }

  const iconSize = variant === "badge" || variant === "shield" ? Math.round(size * 0.78) : size;

  const LogoIcon = (
    <Image
      src="/images/solewhat-icon.png"
      alt="SoleWhat Emblem"
      width={iconSize}
      height={iconSize}
      className="object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_2px_6px_rgba(234,88,12,0.28)]"
      priority
    />
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
        {LogoIcon}
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
          border: "1.5px solid rgba(234, 88, 12, 0.28)",
          boxShadow: showGlow
            ? "0 8px 20px -4px rgba(234, 88, 12, 0.22), 0 2px 6px -1px rgba(0, 0, 0, 0.06)"
            : "0 2px 8px -2px rgba(0, 0, 0, 0.08)",
          flexShrink: 0,
        }}
      >
        {LogoIcon}
      </div>
    );
  }

  // Variant: Badge (The signature squircle badge with luxury depth)
  const borderRadius = Math.round(size * 0.26);

  return (
    <div
      className={`relative inline-flex items-center justify-center transition-transform hover:scale-105 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: `${borderRadius}px`,
        background: "linear-gradient(135deg, #ffffff 0%, #fffbf5 100%)",
        border: "1px solid rgba(226, 232, 240, 0.95)",
        boxShadow: showGlow
          ? "0 10px 25px -5px rgba(234, 88, 12, 0.2), 0 2px 6px rgba(0, 0, 0, 0.05)"
          : "0 2px 8px rgba(0, 0, 0, 0.06)",
        flexShrink: 0,
      }}
    >
      {/* Background micro warm tint */}
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(254, 215, 170, 0.35) 0%, transparent 70%)",
        }}
      />
      {LogoIcon}
    </div>
  );
}
