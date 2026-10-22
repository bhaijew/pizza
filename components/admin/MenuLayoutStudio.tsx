"use client";

import React, { useState, useTransition } from "react";
import BrandLogo from "@/components/BrandLogo";
import { updateShopLogoAndLayout } from "@/lib/admin-actions";
import type { ShopSettings } from "@/lib/menu-data";
import {
  Check,
  Sparkles,
  ExternalLink,
  Flame,
  UtensilsCrossed,
  Zap,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";

const UploadIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const LinkIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const RotateCcwIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

interface MenuLayoutStudioProps {
  initialSettings: ShopSettings;
  shopName: string;
  shopSlug?: string | null;
  shopId?: number | null;
}

export default function MenuLayoutStudio({
  initialSettings,
  shopName,
  shopSlug,
  shopId,
}: MenuLayoutStudioProps) {
  const [logoUrl, setLogoUrl] = useState<string>(initialSettings.logo_url || "");
  const [menuLayout, setMenuLayout] = useState<"cheezious" | "kfc" | "mcdonalds">(
    (initialSettings.menu_layout as "cheezious" | "kfc" | "mcdonalds") === "kfc"
      ? "kfc"
      : (initialSettings.menu_layout as "cheezious" | "kfc" | "mcdonalds") === "mcdonalds"
      ? "mcdonalds"
      : "cheezious"
  );
  const [logoMode, setLogoMode] = useState<"upload" | "url">("upload");
  const [uploadFileName, setUploadFileName] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // File Upload to Data URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, SVG, WEBP).");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      alert("Logo file size must be less than 4MB.");
      return;
    }

    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLogoUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    setLogoUrl("");
    setUploadFileName("");
  };

  const handleSave = () => {
    setStatusMessage(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("logo_url", logoUrl.trim());
      formData.set("menu_layout", menuLayout);

      const res = await updateShopLogoAndLayout({ error: null, success: false }, formData);
      if (res.success) {
        setStatusMessage({
          type: "success",
          text: "Brand logo and menu layout saved successfully! Customer menu and dashboard have been updated.",
        });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Failed to save settings. Please try again.",
        });
      }
    });
  };

  const previewUrl = shopSlug ? `/${shopSlug}` : "/";

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 80px" }}>
      {/* ─── STUDIO HEADER ─── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "28px",
          paddingBottom: "20px",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a", margin: 0 }}>
              Menu Layout &amp; Logo Studio
            </h1>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                padding: "3px 8px",
                borderRadius: "6px",
                background: "#fdf2f8",
                color: "#db2777",
                border: "1px solid #fbcfe8",
              }}
            >
              MULTI-TENANT BRANDING
            </span>
          </div>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Upload your branch/store logo to show in the <strong>Admin Dashboard</strong> and <strong>Customer Menu</strong>, and choose your favorite menu layout.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              borderRadius: "8px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#334155",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
            }}
            className="hover:bg-slate-50"
          >
            <Eye size={15} />
            <span>Preview Public Menu</span>
            <ExternalLink size={13} style={{ opacity: 0.6 }} />
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 22px",
              borderRadius: "8px",
              background: isPending ? "#94a3b8" : "#16a34a",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 800,
              border: "none",
              cursor: isPending ? "not-allowed" : "pointer",
              boxShadow: "0 2px 10px rgba(22, 163, 74, 0.25)",
            }}
            className="hover:bg-emerald-700"
          >
            {isPending ? (
              <span>Saving Changes...</span>
            ) : (
              <>
                <Check size={16} />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── STATUS ALERT ─── */}
      {statusMessage && (
        <div
          style={{
            marginBottom: "24px",
            padding: "14px 18px",
            borderRadius: "8px",
            background: statusMessage.type === "success" ? "#ecfdf5" : "#fef2f2",
            border: `1px solid ${statusMessage.type === "success" ? "#a7f3d0" : "#fecaca"}`,
            color: statusMessage.type === "success" ? "#065f46" : "#991b1b",
            fontSize: "14px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {statusMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* ─── SECTION 1: LOGO MANAGEMENT ─── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
          padding: "24px",
          marginBottom: "32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
              1. Store / Branch Logo
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              Your logo appears in the top-left of the admin sidebar (where the pizza icon was) and in the customer menu header.
            </p>
          </div>

          {logoUrl && (
            <button
              type="button"
              onClick={handleResetLogo}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: "transparent",
                border: "1px solid #e2e8f0",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                color: "#dc2626",
                fontWeight: 600,
                cursor: "pointer",
              }}
              className="hover:bg-red-50"
            >
              <RotateCcwIcon size={13} />
              <span>Reset to Default Pizza Icon</span>
            </button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
          {/* Left: Input / Upload area */}
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              <button
                type="button"
                onClick={() => setLogoMode("upload")}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: logoMode === "upload" ? "1.5px solid #0f172a" : "1px solid #e2e8f0",
                  background: logoMode === "upload" ? "#0f172a" : "#f8fafc",
                  color: logoMode === "upload" ? "#ffffff" : "#475569",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <UploadIcon size={14} />
                <span>Upload Logo File</span>
              </button>

              <button
                type="button"
                onClick={() => setLogoMode("url")}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: logoMode === "url" ? "1.5px solid #0f172a" : "1px solid #e2e8f0",
                  background: logoMode === "url" ? "#0f172a" : "#f8fafc",
                  color: logoMode === "url" ? "#ffffff" : "#475569",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <LinkIcon size={14} />
                <span>Image Web URL</span>
              </button>
            </div>

            {logoMode === "upload" ? (
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "28px 16px",
                  borderRadius: "10px",
                  border: "2px dashed #cbd5e1",
                  background: "#f8fafc",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "border-color 0.2s",
                }}
                className="hover:border-slate-500"
              >
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: "#e2e8f0",
                    color: "#475569",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "10px",
                  }}
                >
                  <UploadIcon size={20} />
                </div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "2px" }}>
                  {uploadFileName ? uploadFileName : "Click or Drag to Upload Logo"}
                </div>
                <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                  PNG, JPG, SVG, or WEBP (Square 1:1 ratio recommended, up to 4MB)
                </div>
              </label>
            ) : (
              <div>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
                <p style={{ fontSize: "11px", color: "#94a3b8", margin: "6px 0 0" }}>
                  Paste a direct link to an online image (Cloudinary, Imgur, Supabase, etc.).
                </p>
              </div>
            )}
          </div>

          {/* Right: Live Mockup Preview */}
          <div
            style={{
              background: "#0b101b",
              borderRadius: "10px",
              padding: "18px 20px",
              color: "#ffffff",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "12px" }}>
                Live Mockup Preview: Admin Sidebar
              </div>

              {/* Sidebar Header Mockup */}
              <div
                style={{
                  background: "#151c2e",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={shopName}
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "8px",
                      objectFit: "cover",
                      background: "#ffffff",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                    }}
                  />
                ) : (
                  <BrandLogo size={38} variant="iconOnly" />
                )}

                <div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#ffffff", lineHeight: 1.2 }}>
                    {shopName}
                  </div>
                  <div style={{ fontSize: "11px", color: "#22c55e", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px", marginTop: "3px" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                    <span>Live Terminal</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: "11px", color: "#94a3b8" }}>
              ✓ Automatically synchronizes across desktop sidebar, mobile drawer, and menu header.
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: MENU LAYOUT CHOICES ─── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
          padding: "24px",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
            2. Choose Menu Design Layout
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Select one of the three real fast-food mobile app layouts. Your customer menu will dynamically switch to this presentation.
          </p>
        </div>

        {/* 3 Real Fast-Food Layout Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {/* Option 1: Cheezious Real Style */}
          <div
            onClick={() => setMenuLayout("cheezious")}
            style={{
              borderRadius: "14px",
              border: menuLayout === "cheezious" ? "2.5px solid #ea580c" : "1.5px solid #e2e8f0",
              background: menuLayout === "cheezious" ? "#fffbeb" : "#ffffff",
              boxShadow: menuLayout === "cheezious" ? "0 8px 24px rgba(234, 88, 12, 0.16)" : "none",
              padding: "18px",
              cursor: "pointer",
              position: "relative",
              transition: "all 0.2s ease",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 900,
                    padding: "3px 8px",
                    borderRadius: "6px",
                    background: "#fef08a",
                    color: "#854d0e",
                  }}
                >
                  REAL APP • CHEEZIOUS
                </span>

                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    border: menuLayout === "cheezious" ? "6px solid #ea580c" : "2px solid #cbd5e1",
                    background: "#ffffff",
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <Sparkles size={20} style={{ color: "#eab308" }} />
                <h3 style={{ fontSize: "16px", fontWeight: 900, color: "#18181b", margin: 0 }}>
                  Cheezious Style
                </h3>
              </div>

              <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5, margin: "0 0 14px" }}>
                Cheezious fast-food mobile app design. Bright Cheddar Yellow delivery switcher, circular pizzas with soft shadow, terracotta Starting Price badge, and + ADD TO CART pill.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px", color: "#334155" }}>
                <div>✓ Cheddar Yellow Delivery/Pickup switcher</div>
                <div>✓ Category slider with &lt; &gt; arrow buttons</div>
                <div>✓ Circular dish photos with subtle shadows</div>
                <div>✓ Starting Price badge &amp; + Add To Cart pill</div>
              </div>
            </div>

            <div
              style={{
                marginTop: "16px",
                paddingTop: "12px",
                borderTop: "1px dashed #e2e8f0",
                fontSize: "12px",
                fontWeight: 700,
                color: menuLayout === "cheezious" ? "#ea580c" : "#94a3b8",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              {menuLayout === "cheezious" && <Check size={14} />}
              <span>{menuLayout === "cheezious" ? "Active Selected Layout" : "Click to Select"}</span>
            </div>
          </div>

          {/* Option 2: KFC Real Style */}
          <div
            onClick={() => setMenuLayout("kfc")}
            style={{
              borderRadius: "14px",
              border: menuLayout === "kfc" ? "2.5px solid #e4002b" : "1.5px solid #e2e8f0",
              background: menuLayout === "kfc" ? "#fef2f2" : "#ffffff",
              boxShadow: menuLayout === "kfc" ? "0 8px 24px rgba(228, 0, 43, 0.16)" : "none",
              padding: "18px",
              cursor: "pointer",
              position: "relative",
              transition: "all 0.2s ease",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 900,
                    padding: "3px 8px",
                    borderRadius: "6px",
                    background: "#fee2e2",
                    color: "#991b1b",
                  }}
                >
                  REAL APP • KFC CRISPY
                </span>

                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    border: menuLayout === "kfc" ? "6px solid #e4002b" : "2px solid #cbd5e1",
                    background: "#ffffff",
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <Flame size={20} style={{ color: "#e4002b" }} />
                <h3 style={{ fontSize: "16px", fontWeight: 900, color: "#111827", margin: 0 }}>
                  KFC Style
                </h3>
              </div>

              <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5, margin: "0 0 14px" }}>
                Authentic KFC app design. 3-tab Delivery / Pickup / Dine-In switcher, Krunch/Zinger promos with angled red ribbons, 3 red stripes, and floating KFC Bucket cart.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px", color: "#334155" }}>
                <div>✓ 3-tab Delivery / Pickup / Dine-In switcher</div>
                <div>✓ Angled red ribbon price tags (Rs 310)</div>
                <div>✓ Iconic 3 vertical red KFC stripes on cards</div>
                <div>✓ KFC Bucket cart floating button with badge</div>
              </div>
            </div>

            <div
              style={{
                marginTop: "16px",
                paddingTop: "12px",
                borderTop: "1px dashed #e2e8f0",
                fontSize: "12px",
                fontWeight: 700,
                color: menuLayout === "kfc" ? "#e4002b" : "#94a3b8",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              {menuLayout === "kfc" && <Check size={14} />}
              <span>{menuLayout === "kfc" ? "Active Selected Layout" : "Click to Select"}</span>
            </div>
          </div>

          {/* Option 3: McDonald's Real Style */}
          <div
            onClick={() => setMenuLayout("mcdonalds")}
            style={{
              borderRadius: "14px",
              border: menuLayout === "mcdonalds" ? "2.5px solid #da291c" : "1.5px solid #e2e8f0",
              background: menuLayout === "mcdonalds" ? "#fefce8" : "#ffffff",
              boxShadow: menuLayout === "mcdonalds" ? "0 8px 24px rgba(218, 41, 28, 0.16)" : "none",
              padding: "18px",
              cursor: "pointer",
              position: "relative",
              transition: "all 0.2s ease",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 900,
                    padding: "3px 8px",
                    borderRadius: "6px",
                    background: "#fef08a",
                    color: "#854d0e",
                  }}
                >
                  REAL APP • MCDONALD&apos;S
                </span>

                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    border: menuLayout === "mcdonalds" ? "6px solid #da291c" : "2px solid #cbd5e1",
                    background: "#ffffff",
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <Zap size={20} style={{ color: "#eab308" }} />
                <h3 style={{ fontSize: "16px", fontWeight: 900, color: "#27251f", margin: 0 }}>
                  McDonald&apos;s Style
                </h3>
              </div>

              <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5, margin: "0 0 14px" }}>
                Iconic Golden Arches yellow and classic red mobile ordering app. McDelivery toggle, app-exclusive saver combos, McValue tags, and golden add buttons.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px", color: "#334155" }}>
                <div>✓ Golden Arches red &amp; gold app header</div>
                <div>✓ McDelivery / Pick-Up toggle bar</div>
                <div>✓ App-exclusive saver combos banner</div>
                <div>✓ Golden yellow Add buttons &amp; McDelivery bag</div>
              </div>
            </div>

            <div
              style={{
                marginTop: "16px",
                paddingTop: "12px",
                borderTop: "1px dashed #e2e8f0",
                fontSize: "12px",
                fontWeight: 700,
                color: menuLayout === "mcdonalds" ? "#da291c" : "#94a3b8",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              {menuLayout === "mcdonalds" && <Check size={14} />}
              <span>{menuLayout === "mcdonalds" ? "Active Selected Layout" : "Click to Select"}</span>
            </div>
          </div>


        </div>

        {/* Bottom Save Reminder */}
        <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 28px",
              borderRadius: "8px",
              background: isPending ? "#94a3b8" : "#16a34a",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 800,
              border: "none",
              cursor: isPending ? "not-allowed" : "pointer",
              boxShadow: "0 2px 10px rgba(22, 163, 74, 0.25)",
            }}
          >
            {isPending ? "Saving..." : "Apply & Save Selected Menu Layout"}
          </button>
        </div>
      </div>
    </div>
  );
}
