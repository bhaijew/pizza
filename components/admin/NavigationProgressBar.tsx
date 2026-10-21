"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * NavigationProgressBar
 * Instant visual feedback when clicking links or navigating pages.
 * Displays a glowing orange/red brand progress bar at the very top of the browser.
 */
export default function NavigationProgressBar() {
  const pathname = usePathname();

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger loading animation
  const startLoading = () => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    setIsLoading(true);
    setVisible(true);
    setProgress(18);

    // Incrementally crawl forward
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 88;
        }
        // Decelerate as it gets higher
        const increment = Math.max(1, (90 - prev) * 0.15);
        return Math.min(88, prev + increment);
      });
    }, 120);
  };

  // Complete and fade out loading bar
  const completeLoading = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);

    fadeTimerRef.current = setTimeout(() => {
      setVisible(false);
      fadeTimerRef.current = setTimeout(() => {
        setProgress(0);
        setIsLoading(false);
      }, 250);
    }, 180);
  };

  // Whenever pathname changes, mark navigation as complete
  useEffect(() => {
    completeLoading();
  }, [pathname]);

  // Intercept all internal link clicks across the document
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore external links, downloads, target="_blank", or hash jumps
      if (
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#") ||
        target.getAttribute("target") === "_blank" ||
        target.hasAttribute("download") ||
        e.defaultPrevented ||
        e.button !== 0 || // non-primary click
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        e.shiftKey
      ) {
        return;
      }

      // Check if it's the exact same page
      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl || href === window.location.pathname) {
        return;
      }

      // Start the progress bar immediately!
      startLoading();
    };

    // Custom events support
    const handleCustomStart = () => startLoading();
    const handleCustomComplete = () => completeLoading();

    document.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("pizza-nav-start", handleCustomStart);
    window.addEventListener("pizza-nav-complete", handleCustomComplete);

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("pizza-nav-start", handleCustomStart);
      window.removeEventListener("pizza-nav-complete", handleCustomComplete);
      if (timerRef.current) clearInterval(timerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        zIndex: 99999,
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.25s ease",
      }}
    >
      {/* Background Track Bar */}
      <div
        style={{
          width: `${progress}%`,
          height: "100%",
          background: "linear-gradient(90deg, #ea580c 0%, #ef4444 50%, #f59e0b 100%)",
          boxShadow: "0 0 10px rgba(239, 68, 68, 0.8), 0 0 5px rgba(234, 88, 12, 0.6)",
          transition: progress === 100 ? "width 0.15s ease-out" : "width 0.25s cubic-bezier(0.1, 0.5, 0.5, 1)",
          position: "relative",
        }}
      >
        {/* Glowing Head Particle */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: -2,
            width: 12,
            height: 7,
            borderRadius: "50%",
            background: "#ffffff",
            boxShadow: "0 0 12px 3px #ef4444, 0 0 6px 2px #f59e0b",
            opacity: 0.9,
          }}
        />
      </div>
    </div>
  );
}
