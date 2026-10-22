"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Volume2, VolumeX, Bell, Check } from "lucide-react";

export const SOUND_VOLUME_KEY = "solewhat_pos_sound_volume";
export const SOUND_MUTED_KEY = "solewhat_pos_sound_muted";

/**
 * Universal Web Audio Synthesizer chime for POS and Kitchen alerts.
 * Uses Web Audio API oscillator synthesis — zero external mp3/wav files required,
 * completely immune to 404s, CORS issues, or slow network downloads.
 */
export function playAlertChime(
  volumePercent: number = 80,
  isMuted: boolean = false,
  soundType: "pos" | "kitchen" = "pos"
) {
  if (isMuted || volumePercent <= 0) return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    // Normalized master gain (scale 0..100 to 0..0.45 gain)
    const masterGain = (Math.max(0, Math.min(100, volumePercent)) / 100) * 0.42;

    if (soundType === "kitchen") {
      // Kitchen Ascending Chime: Crisp Attention Grabber (880Hz A5 -> 1320Hz E6)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.18);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(1174.66, now + 0.08);

      gain.gain.setValueAtTime(masterGain, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.4);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.55);
    } else {
      // Enterprise POS Chime: 3-Harmonic Warm Affirmation
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const osc3 = ctx.createOscillator();
      const gain = ctx.createGain();

      // Tone 1: High crisp ding (880Hz - A5)
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);

      // Tone 2: Harmonic pleasant chime (1320Hz - E6)
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1320, now + 0.12);

      // Tone 3: Rich base affirmation (440Hz - A4)
      osc3.type = "triangle";
      osc3.frequency.setValueAtTime(440, now + 0.12);

      gain.gain.setValueAtTime(masterGain, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc1.connect(gain);
      osc2.connect(gain);
      osc3.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.35);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.85);
      osc3.start(now + 0.1);
      osc3.stop(now + 0.85);
    }
  } catch {
    // Autoplay restrictions or headless browser
  }
}

interface AudioNotificationControllerProps {
  soundType?: "pos" | "kitchen";
  variant?: "compact" | "expanded";
  onVolumeChange?: (volume: number, isMuted: boolean) => void;
  className?: string;
}

export default function AudioNotificationController({
  soundType = "pos",
  variant = "compact",
  onVolumeChange,
  className = "",
}: AudioNotificationControllerProps) {
  const [volume, setVolume] = useState<number>(80);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const savedVol = localStorage.getItem(SOUND_VOLUME_KEY);
      const savedMuted = localStorage.getItem(SOUND_MUTED_KEY);

      if (savedVol !== null) {
        const parsed = parseInt(savedVol, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
          setVolume(parsed);
        }
      }
      if (savedMuted !== null) {
        setIsMuted(savedMuted === "true");
      }
    } catch {
      // LocalStorage unavailable
    }
  }, []);

  // Broadcast changes and persist
  const handleVolumeUpdate = (newVol: number) => {
    setVolume(newVol);
    const unmuted = newVol > 0 ? false : isMuted;
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
      try {
        localStorage.setItem(SOUND_MUTED_KEY, "false");
      } catch {}
    }
    try {
      localStorage.setItem(SOUND_VOLUME_KEY, String(newVol));
    } catch {}
    if (onVolumeChange) {
      onVolumeChange(newVol, unmuted);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    try {
      localStorage.setItem(SOUND_MUTED_KEY, String(nextMuted));
    } catch {}
    if (onVolumeChange) {
      onVolumeChange(volume, nextMuted);
    }
  };

  const handleTestChime = useCallback(() => {
    setIsTesting(true);
    // Play test chime at current volume (or temporary unmuted if muted)
    const testVol = isMuted ? 80 : volume;
    playAlertChime(testVol, false, soundType);
    setTimeout(() => {
      setIsTesting(false);
    }, 900);
  }, [volume, isMuted, soundType]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const effectiveVolume = isMuted ? 0 : volume;
  const VolumeIcon = effectiveVolume === 0 ? VolumeX : Volume2;

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      {/* ─── Compact Pill Button ─── */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          background: isMuted ? "#fef2f2" : "#f0fdf4",
          border: isMuted ? "1px solid #fecaca" : "1px solid #bbf7d0",
          borderRadius: 8,
          padding: "2px",
          transition: "all 0.2s ease",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <button
          type="button"
          onClick={handleToggleMute}
          title={isMuted ? "Unmute Notifications" : "Mute Notifications"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 9px",
            borderRadius: 6,
            border: "none",
            background: "transparent",
            color: isMuted ? "#dc2626" : "#16a34a",
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          className="hover:opacity-80 active:scale-95"
        >
          <VolumeIcon size={15} />
          <span>{isMuted ? "Muted" : `${volume}%`}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          title="Open Audio Notification Controls"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "5px 8px",
            borderRadius: 6,
            borderLeft: isMuted ? "1px solid #fecaca" : "1px solid #bbf7d0",
            borderTop: "none",
            borderRight: "none",
            borderBottom: "none",
            background: isOpen ? (isMuted ? "#fee2e2" : "#dcfce7") : "transparent",
            color: isMuted ? "#991b1b" : "#15803d",
            fontSize: 11,
            fontWeight: 800,
            cursor: "pointer",
          }}
          className="hover:opacity-80"
        >
          <span style={{ fontSize: 10 }}>⚙</span>
        </button>
      </div>

      {/* ─── Floating Settings Popover ─── */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 270,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "16px",
            boxShadow: "0 12px 30px -4px rgba(15, 23, 42, 0.15), 0 4px 10px rgba(0,0,0,0.05)",
            zIndex: 9999,
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
              paddingBottom: 8,
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Bell size={15} className="text-orange-600" />
              <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                Order Notification Chime
              </span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: isMuted ? "#dc2626" : "#059669",
                background: isMuted ? "#fef2f2" : "#ecfdf5",
                padding: "2px 7px",
                borderRadius: 6,
                border: isMuted ? "1px solid #fecaca" : "1px solid #a7f3d0",
              }}
            >
              {isMuted ? "MUTED" : `${volume}%`}
            </span>
          </div>

          {/* Volume Slider Section */}
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
                fontSize: 11,
                fontWeight: 600,
                color: "#64748b",
              }}
            >
              <span>Volume Level</span>
              <button
                type="button"
                onClick={handleToggleMute}
                style={{
                  border: "none",
                  background: "transparent",
                  color: isMuted ? "#2563eb" : "#ef4444",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                {isMuted ? "Unmute" : "Mute Sound"}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={handleToggleMute}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  cursor: "pointer",
                  color: isMuted ? "#94a3b8" : "#ea580c",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <VolumeIcon size={18} />
              </button>

              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeUpdate(parseInt(e.target.value, 10))}
                style={{
                  flex: 1,
                  height: 6,
                  accentColor: "#ea580c",
                  cursor: "pointer",
                  borderRadius: 4,
                }}
              />

              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#0f172a",
                  minWidth: 36,
                  textAlign: "right",
                }}
              >
                {isMuted ? "0%" : `${volume}%`}
              </span>
            </div>
          </div>

          {/* Test Chime Button */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              type="button"
              onClick={handleTestChime}
              disabled={isTesting}
              style={{
                width: "100%",
                padding: "9px 14px",
                borderRadius: 8,
                border: "1px solid #ea580c",
                background: isTesting ? "#fff7ed" : "linear-gradient(135deg, #ea580c 0%, #dc2626 100%)",
                color: isTesting ? "#c2410c" : "#ffffff",
                fontSize: 12,
                fontWeight: 800,
                cursor: isTesting ? "wait" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                boxShadow: isTesting ? "none" : "0 4px 12px rgba(234, 88, 12, 0.25)",
                transition: "all 0.18s ease",
              }}
              className="hover:opacity-95 active:scale-98"
            >
              {isTesting ? (
                <>
                  <span
                    className="animate-spin"
                    style={{
                      display: "inline-block",
                      width: 12,
                      height: 12,
                      border: "2px solid currentColor",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                    }}
                  />
                  <span>Playing Sound...</span>
                </>
              ) : (
                <>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="none"
                    style={{ display: "inline-block" }}
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>Play Test Chime 🔔</span>
                </>
              )}
            </button>

            <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", textAlign: "center", lineHeight: 1.3 }}>
              Web Audio Synthesizer &bull; Instant &amp; persists on this browser
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
