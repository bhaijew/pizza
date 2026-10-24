"use client";

import React, { useState, useEffect, useRef } from "react";
import { getOptimizedImageUrl, getCategoryFallbackImage } from "@/lib/image-optimizer";
import ImagePlaceholder from "@/components/menu/ImagePlaceholder";

interface OptimizedImageProps {
  src?: string | null;
  alt: string;
  categoryName?: string;
  productName?: string;
  aspectRatio?: string;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onHoverZoom?: boolean;
}

/**
 * OptimizedImage — High-Performance, Low-Bandwidth Image Component
 *
 * Designed specifically for slow mobile networks (2G / 3G in Pakistan):
 * 1. Automatically downscales high-res URLs to ~20KB lightweight WebP/AVIF thumbnails.
 * 2. Renders an instant pulsing shimmer skeleton while downloading so cards NEVER appear blank.
 * 3. Priority loading for top-of-page items, lazy loading for off-screen items.
 * 4. Automatic retry & resilient fallback on packet loss or network drop.
 */
export default function OptimizedImage({
  src,
  alt,
  categoryName,
  productName,
  aspectRatio = "16/10",
  priority = false,
  className = "",
  style,
  onHoverZoom = true,
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Compute optimized URL (400px width, 65% quality WebP/AVIF instead of 800px+ 200KB+ raw images)
  const optimizedSrc = React.useMemo(() => {
    if (!src) return "";
    return getOptimizedImageUrl(src, 380, 65);
  }, [src]);

  // If image is already complete in browser cache on initial mount
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [optimizedSrc]);

  // Handle network failure or 404
  const handleError = () => {
    if (errorCount === 0) {
      // First retry: try category fallback image
      setErrorCount(1);
    } else {
      // Second retry failed: show SVG placeholder
      setErrorCount(2);
    }
  };

  // Determine active source based on error state
  const currentSrc =
    errorCount === 1
      ? getCategoryFallbackImage(categoryName, productName)
      : optimizedSrc;

  // If no source at all, or after 2 failed retries, show clean SVG food placeholder
  if (!src || errorCount >= 2) {
    return <ImagePlaceholder />;
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        aspectRatio,
        overflow: "hidden",
        backgroundColor: "#f1f5f9",
        ...style,
      }}
      className={className}
      onMouseEnter={() => onHoverZoom && setIsHovered(true)}
      onMouseLeave={() => onHoverZoom && setIsHovered(false)}
    >
      {/* 1. Shimmer skeleton loader visible until image is fully loaded */}
      {!loaded && (
        <div
          className="image-shimmer"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
      )}

      {/* 2. Optimized Image with progressive fade-in */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "low"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={handleError}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.3s ease, transform 0.35s ease",
          transform: isHovered ? "scale(1.05)" : "scale(1)",
          willChange: "transform, opacity",
        }}
      />
    </div>
  );
}
