"use client";

import { useActionState, useState } from "react";
import { updateSettings } from "@/lib/admin-actions";
import type { ShopSettings } from "@/lib/menu-data";
import {
  Store,
  Clock,
  Globe,
  Check,
  CheckCircle2,
  AlertTriangle,
  Coins,
  Search,
  ExternalLink,
  Sparkles,
  Layers,
  ArrowRight,
  MessageSquare,
} from "lucide-react";

const Palette = ({ size = 16, style }: { size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
);

interface SettingsFormProps {
  initialSettings: ShopSettings;
  shopSlug?: string;
  shopName?: string;
}

const CURRENCY_PRESETS = [
  { code: "PKR", label: "PKR", symbol: "Rs. ", name: "Pakistani Rupee" },
  { code: "USD", label: "USD", symbol: "$", name: "US Dollar" },
  { code: "AED", label: "AED", symbol: "AED ", name: "UAE Dirham" },
  { code: "SAR", label: "SAR", symbol: "SAR ", name: "Saudi Riyal" },
  { code: "GBP", label: "GBP", symbol: "£", name: "British Pound" },
  { code: "EUR", label: "EUR", symbol: "€", name: "Euro" },
  { code: "INR", label: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "CAD", label: "CAD", symbol: "C$", name: "Canadian Dollar" },
];

function formatTimeAmPm(timeStr?: string): string {
  if (!timeStr) return "N/A";
  const parts = timeStr.split(":");
  let h = parseInt(parts[0], 10);
  const m = parts[1] || "00";
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

export default function SettingsForm({
  initialSettings,
  shopSlug = "menu",
  shopName: propShopName,
}: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateSettings, {
    error: null,
    success: false,
  });

  const [shopName, setShopName] = useState(initialSettings.shop_name || propShopName || "Pizza Shop");
  const [menuTitle, setMenuTitle] = useState(initialSettings.menu_title || "Handcrafted Pizza Menu");
  const [metaTitle, setMetaTitle] = useState(initialSettings.meta_title || "");
  const [metaDescription, setMetaDescription] = useState(initialSettings.meta_description || "");
  const [currencySymbol, setCurrencySymbol] = useState(initialSettings.currency_symbol || "Rs. ");
  const [openingTime, setOpeningTime] = useState(initialSettings.opening_time || "11:00");
  const [closingTime, setClosingTime] = useState(initialSettings.closing_time || "01:00");
  const [googleReviewUrl, setGoogleReviewUrl] = useState(initialSettings.google_review_url || "");

  const [whatsappSessionId, setWhatsappSessionId] = useState(initialSettings.whatsapp_session_id || "");
  const whatsappApiKey = initialSettings.whatsapp_api_key || "";
  const themeColor = initialSettings.theme_color || "#ea580c";
  const sliderEnabled = initialSettings.slider_enabled !== false;
  const sliderHeight = initialSettings.slider_height_mobile || 180;
  const sliderImages = initialSettings.slider_images || [];
  const heroBadgeText = initialSettings.hero_badge_text || "";
  const heroTitle = initialSettings.hero_title || "";
  const heroTitleHighlight = initialSettings.hero_title_highlight || "";
  const heroSubtitle = initialSettings.hero_subtitle || "";
  const heroBtnPrimaryText = initialSettings.hero_btn_primary_text || "";
  const heroBtnPrimaryLink = initialSettings.hero_btn_primary_link || "";
  const heroBtnSecondaryText = initialSettings.hero_btn_secondary_text || "";
  const heroBtnSecondaryLink = initialSettings.hero_btn_secondary_link || "";
  const heroChip1Text = initialSettings.hero_chip1_text || "";
  const heroChip2Text = initialSettings.hero_chip2_text || "";
  const heroChip3Text = initialSettings.hero_chip3_text || "";
  const heroShowChips = initialSettings.hero_show_chips !== false;
  const heroBgType = initialSettings.hero_bg_type || "gradient";
  const heroBgColor = initialSettings.hero_bg_color || "";
  const heroBgGradient = initialSettings.hero_bg_gradient || "";
  const heroBgImage = initialSettings.hero_bg_image || "";
  const heroShowPattern = initialSettings.hero_show_pattern !== false;

  return (
    <div style={{ width: "100%", paddingBottom: "100px" }}>
      {/* ─── Top Header & Tab Navigation Bar ─── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "5px",
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "5px",
              background: "#fff7ed",
              color: "#ea580c",
              border: "1px solid #fed7aa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Store size={22} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "#0f172a", letterSpacing: "-0.01em" }}>
                Store &amp; Business Settings
              </h1>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: "5px",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #e2e8f0",
                }}
              >
                Configuration
              </span>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
              Manage brand details, currency formatting, shift operating hours, and search SEO.
            </p>
          </div>
        </div>

        {/* Actions & Tab Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "5px",
              background: "#0f172a",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 700,
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.12)",
            }}
          >
            <Store size={14} />
            <span>Store Settings</span>
          </span>

          <a
            href="/admin/menu-ui"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "5px",
              background: "#f8fafc",
              color: "#475569",
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "none",
              border: "1px solid #cbd5e1",
              transition: "all 0.15s ease",
            }}
            className="hover:bg-violet-50 hover:text-violet-700 hover:border-violet-300"
          >
            <Palette size={14} style={{ color: "#7c3aed" }} />
            <span>Menu UI Studio</span>
            <ArrowRight size={13} style={{ opacity: 0.6 }} />
          </a>

          <a
            href="/admin/order-lookup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "5px",
              background: "#f0f9ff",
              color: "#0369a1",
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "none",
              border: "1px solid #bae6fd",
              transition: "all 0.15s ease",
            }}
            className="hover:bg-sky-100 hover:text-sky-800"
          >
            <span>🔍</span>
            <span>Order Lookup (ORD-)</span>
          </a>

          <button
            type="submit"
            form="settings-form"
            disabled={isPending}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 18px",
              borderRadius: "5px",
              background: isPending
                ? "#94a3b8"
                : "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 800,
              border: "none",
              cursor: isPending ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(234, 88, 12, 0.3)",
              transition: "transform 0.15s ease",
            }}
            className="hover:scale-[1.02] active:scale-[0.98]"
          >
            <Check size={14} />
            <span>{isPending ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </div>

      {/* ─── Status Feedback Alerts ─── */}
      {state.success && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "5px",
            background: "#f0fdf4",
            border: "1px solid #86efac",
            color: "#15803d",
            fontSize: "13px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: 700,
            boxShadow: "0 1px 2px rgba(22, 163, 74, 0.05)",
          }}
        >
          <CheckCircle2 size={18} style={{ color: "#16a34a", flexShrink: 0 }} />
          <span>Shop and business settings saved successfully! Your digital menu is now updated.</span>
        </div>
      )}

      {state.error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "5px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            fontSize: "13px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: 700,
          }}
        >
          <AlertTriangle size={18} style={{ color: "#ef4444", flexShrink: 0 }} />
          <span>{state.error}</span>
        </div>
      )}

      <form id="settings-form" action={formAction} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Hidden inputs to preserve UI settings without overwriting them */}
        <input type="hidden" name="theme_color" value={themeColor} />
        <input type="hidden" name="slider_enabled" value={sliderEnabled ? "true" : "false"} />
        <input type="hidden" name="slider_height_mobile" value={sliderHeight} />
        <input
          type="hidden"
          name="slider_images"
          value={typeof sliderImages === "string" ? sliderImages : JSON.stringify(sliderImages)}
        />
        <input type="hidden" name="hero_badge_text" value={heroBadgeText} />
        <input type="hidden" name="hero_title" value={heroTitle} />
        <input type="hidden" name="hero_title_highlight" value={heroTitleHighlight} />
        <input type="hidden" name="hero_subtitle" value={heroSubtitle} />
        <input type="hidden" name="hero_btn_primary_text" value={heroBtnPrimaryText} />
        <input type="hidden" name="hero_btn_primary_link" value={heroBtnPrimaryLink} />
        <input type="hidden" name="hero_btn_secondary_text" value={heroBtnSecondaryText} />
        <input type="hidden" name="hero_btn_secondary_link" value={heroBtnSecondaryLink} />
        <input type="hidden" name="hero_chip1_text" value={heroChip1Text} />
        <input type="hidden" name="hero_chip2_text" value={heroChip2Text} />
        <input type="hidden" name="hero_chip3_text" value={heroChip3Text} />
        <input type="hidden" name="hero_show_chips" value={heroShowChips ? "true" : "false"} />
        <input type="hidden" name="hero_bg_type" value={heroBgType} />
        <input type="hidden" name="hero_bg_color" value={heroBgColor} />
        <input type="hidden" name="hero_bg_gradient" value={heroBgGradient} />
        <input type="hidden" name="hero_bg_image" value={heroBgImage} />
        <input type="hidden" name="hero_show_pattern" value={heroShowPattern ? "true" : "false"} />
        <input type="hidden" name="whatsapp_api_key" value={whatsappApiKey} />

        {/* ─── CARD 1: Brand & Store Identity ─── */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            padding: "20px 22px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "5px",
                background: "#fff7ed",
                color: "#ea580c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #fed7aa",
              }}
            >
              <Store size={17} />
            </div>
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                Brand &amp; Store Identity
              </h2>
              <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
                Your business brand title and the main heading displayed on customer digital menus.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {/* Shop Name */}
            <div>
              <label
                htmlFor="shop_name"
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                Shop Name (Brand / Store Title) <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                id="shop_name"
                name="shop_name"
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Mafia Pizza"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "5px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontSize: "13px",
                  fontWeight: 700,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s ease",
                }}
                className="focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
              <p style={{ margin: "5px 0 0", fontSize: "11px", color: "#94a3b8" }}>
                Printed on customer receipts, order tickets, and WhatsApp messages.
              </p>
            </div>

            {/* Menu Section Heading */}
            <div>
              <label
                htmlFor="menu_title"
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                Menu Section Heading Title <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                id="menu_title"
                name="menu_title"
                type="text"
                required
                value={menuTitle}
                onChange={(e) => setMenuTitle(e.target.value)}
                placeholder="e.g. Handcrafted Pizza Menu"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "5px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontSize: "13px",
                  fontWeight: 600,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s ease",
                }}
                className="focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
              <p style={{ margin: "5px 0 0", fontSize: "11px", color: "#94a3b8" }}>
                Title displayed directly above the food categories on the customer menu.
              </p>
            </div>
          </div>
        </div>

        {/* ─── CARD 2: Currency & Pricing Format ─── */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            padding: "20px 22px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "5px",
                background: "#f0fdf4",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #bbf7d0",
              }}
            >
              <Coins size={17} />
            </div>
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                Currency Symbol &amp; Price Display
              </h2>
              <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
                Select a quick currency preset or enter a custom symbol for menu items, cart totals, and POS billing.
              </p>
            </div>
          </div>

          {/* Currency Presets Grid */}
          <div style={{ marginBottom: "14px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "8px" }}>
              Quick Regional Currency Presets:
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(105px, 1fr))",
                gap: "8px",
              }}
            >
              {CURRENCY_PRESETS.map((p) => {
                const isSelected = currencySymbol.trim() === p.symbol.trim();
                return (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => setCurrencySymbol(p.symbol)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "5px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      border: isSelected ? "1.5px solid #ea580c" : "1px solid #e2e8f0",
                      background: isSelected ? "#fff7ed" : "#ffffff",
                      color: isSelected ? "#ea580c" : "#334155",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.15s ease",
                      boxShadow: isSelected ? "0 1px 3px rgba(234, 88, 12, 0.15)" : "none",
                    }}
                    className="hover:border-slate-300"
                  >
                    <span style={{ fontWeight: 800 }}>{p.symbol.trim()}</span>
                    <span
                      style={{
                        fontSize: "10px",
                        color: isSelected ? "#c2410c" : "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      {p.code}
                    </span>
                    {isSelected && <Check size={12} style={{ color: "#ea580c", marginLeft: "2px" }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Symbol Input & Live Price Preview Bar */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "5px",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label
                htmlFor="currency_symbol"
                style={{ fontSize: "12px", fontWeight: 700, color: "#334155", whiteSpace: "nowrap" }}
              >
                Custom Currency Prefix:
              </label>
              <input
                id="currency_symbol"
                name="currency_symbol"
                type="text"
                required
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder="e.g. Rs., $, AED"
                style={{
                  width: "120px",
                  padding: "7px 10px",
                  borderRadius: "5px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontSize: "13px",
                  fontWeight: 800,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                className="focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {/* Live Price Tag Mockup */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                Menu Price Tag Preview:
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 10px",
                  borderRadius: "5px",
                  background: "#ea580c",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 900,
                  letterSpacing: "-0.01em",
                  boxShadow: "0 1px 3px rgba(234, 88, 12, 0.3)",
                }}
              >
                {currencySymbol}1,450
              </span>
            </div>
          </div>
        </div>

        {/* ─── CARD 3: Operating Shift Hours & Z-Report ─── */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            padding: "20px 22px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "5px",
                background: "#eef2ff",
                color: "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #c7d2fe",
              }}
            >
              <Clock size={17} />
            </div>
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                Operating Shift Hours &amp; Daily Z-Report Window
              </h2>
              <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
                Orders placed between Opening and Closing times are automatically grouped into Daily Closing Z-Reports.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
            }}
          >
            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#334155",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Store Opening Time
              </label>
              <input
                type="time"
                name="opening_time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "5px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  fontWeight: 700,
                  boxSizing: "border-box",
                  background: "#ffffff",
                  color: "#0f172a",
                }}
                className="focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#334155",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Store Closing Time
              </label>
              <input
                type="time"
                name="closing_time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "5px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  fontWeight: 700,
                  boxSizing: "border-box",
                  background: "#ffffff",
                  color: "#0f172a",
                }}
                className="focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Shift Timeline Banner */}
          <div
            style={{
              marginTop: "14px",
              padding: "10px 14px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "5px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "12px",
              color: "#475569",
            }}
          >
            <Clock size={16} style={{ color: "#6366f1", flexShrink: 0 }} />
            <span>
              Active Daily Shift:{" "}
              <strong style={{ color: "#0f172a" }}>{formatTimeAmPm(openingTime)}</strong> to{" "}
              <strong style={{ color: "#0f172a" }}>{formatTimeAmPm(closingTime)}</strong>.{" "}
              <span style={{ color: "#64748b" }}>
                Night shifts crossing midnight (e.g. 11:00 AM to 01:00 AM) are handled automatically in daily reports.
              </span>
            </span>
          </div>
        </div>

        {/* ─── CARD 4: Google SEO & Search Presence ─── */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            padding: "20px 22px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "5px",
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #bfdbfe",
              }}
            >
              <Search size={17} />
            </div>
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                Google Search &amp; Browser Metadata (SEO)
              </h2>
              <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
                Optimize how your restaurant ranks on Google search results and appears in WhatsApp link previews.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Browser Tab Title */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                <label
                  htmlFor="meta_title"
                  style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}
                >
                  Browser Tab Title <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <span style={{ fontSize: "11px", color: metaTitle.length > 60 ? "#ea580c" : "#94a3b8" }}>
                  {metaTitle.length} / 60 characters
                </span>
              </div>
              <input
                id="meta_title"
                name="meta_title"
                type="text"
                required
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="e.g. Mafia Pizza | Hot & Fresh Handcrafted Pizzas Delivered"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "5px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontSize: "13px",
                  fontWeight: 600,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                className="focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Google Search Snippet */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                <label
                  htmlFor="meta_description"
                  style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}
                >
                  Google Search Snippet (Meta Description)
                </label>
                <span style={{ fontSize: "11px", color: metaDescription.length > 160 ? "#ea580c" : "#94a3b8" }}>
                  {metaDescription.length} / 160 characters
                </span>
              </div>
              <textarea
                id="meta_description"
                name="meta_description"
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Short description displayed on Google search results & WhatsApp shares..."
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "5px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontSize: "13px",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                  lineHeight: "1.4",
                }}
                className="focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Google Search Result Mockup */}
            <div style={{ marginTop: "4px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "6px" }}>
                Google Search Snippet Preview:
              </div>
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #dfe1e5",
                  borderRadius: "5px",
                  padding: "14px 16px",
                  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "5px",
                      background: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                    }}
                  >
                    🍕
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#202124", lineHeight: "1.2" }}>
                      {shopName || "Restaurant Store"}
                    </div>
                    <div style={{ fontSize: "11px", color: "#5f6368", lineHeight: "1.2" }}>
                      https://{shopSlug}.foodmenu.app › menu
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    color: "#1a0dab",
                    fontSize: "16px",
                    fontWeight: 600,
                    margin: "4px 0 3px",
                    lineHeight: "1.3",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {metaTitle || `${shopName} | Handcrafted Pizzas & Fast Delivery`}
                </div>

                <div style={{ color: "#4d5156", fontSize: "12px", lineHeight: "1.45" }}>
                  {metaDescription ||
                    "Order fresh handcrafted pizzas, chef special deals, sides and cold beverages online. Hot and fast delivery direct to your doorstep."}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── CARD 5: Google Reviews Integration ─── */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            padding: "20px 22px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "5px",
                background: "#f0fdf4",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #bbf7d0",
              }}
            >
              <Globe size={17} />
            </div>
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                Google Maps Review Link
              </h2>
              <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
                Direct satisfied customers after checkout or delivery to leave a 5-star Google review.
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="google_review_url"
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 700,
                color: "#334155",
                marginBottom: "6px",
              }}
            >
              Google Maps Business Review URL
            </label>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="url"
                id="google_review_url"
                name="google_review_url"
                placeholder="https://g.page/r/YOUR_PLACE_ID/review"
                value={googleReviewUrl}
                onChange={(e) => setGoogleReviewUrl(e.target.value)}
                style={{
                  flex: 1,
                  padding: "9px 12px",
                  borderRadius: "5px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                className="focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              {googleReviewUrl && (
                <a
                  href={googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 14px",
                    borderRadius: "5px",
                    background: "#f0fdf4",
                    border: "1px solid #86efac",
                    color: "#16a34a",
                    fontSize: "12px",
                    fontWeight: 700,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                  className="hover:bg-emerald-100"
                >
                  <ExternalLink size={13} />
                  <span>Test Link</span>
                </a>
              )}
            </div>
            <p style={{ margin: "5px 0 0", fontSize: "11px", color: "#94a3b8" }}>
              Tip: Go to Google Business Profile &gt; Ask for reviews &gt; Copy link and paste here.
            </p>
          </div>
        </div>

        {/* ─── CARD 6: Sole-What WhatsApp Bot Session ID ─── */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            padding: "20px 22px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "5px",
                  background: "#ecfdf5",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #bbf7d0",
                }}
              >
                <MessageSquare size={17} />
              </div>
              <div>
                <h2 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                  Sole-What WhatsApp Bot Session ID
                </h2>
                <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
                  Each shop must enter its own unique session ID to send automated WhatsApp order confirmations.
                </p>
              </div>
            </div>

            <a
              href="/admin/sole-what"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "5px",
                background: "#f0fdf4",
                border: "1px solid #86efac",
                color: "#16a34a",
                fontSize: "12px",
                fontWeight: 700,
                textDecoration: "none",
              }}
              className="hover:bg-emerald-100"
            >
              <span>Scan QR / Sole-What Dashboard</span>
              <ArrowRight size={12} />
            </a>
          </div>

          <div>
            <label
              htmlFor="whatsapp_session_id"
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 700,
                color: "#334155",
                marginBottom: "6px",
              }}
            >
              Shop WhatsApp Session ID
            </label>
            <input
              type="text"
              id="whatsapp_session_id"
              name="whatsapp_session_id"
              placeholder="e.g. pizger-bot or rhs5o (Leave empty to disable WhatsApp alerts for this shop)"
              value={whatsappSessionId}
              onChange={(e) => setWhatsappSessionId(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "5px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: "13px",
                fontWeight: 700,
                outline: "none",
                boxSizing: "border-box",
              }}
              className="focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />

            {/* Status notice */}
            <div
              style={{
                marginTop: "10px",
                padding: "10px 14px",
                borderRadius: "5px",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: whatsappSessionId.trim() ? "#f0fdf4" : "#fffbeb",
                border: whatsappSessionId.trim() ? "1px solid #bbf7d0" : "1px solid #fde68a",
                color: whatsappSessionId.trim() ? "#166534" : "#92400e",
              }}
            >
              {whatsappSessionId.trim() ? (
                <>
                  <CheckCircle2 size={16} style={{ color: "#16a34a", flexShrink: 0 }} />
                  <span>
                    <strong>Active:</strong> Automated WhatsApp order alerts for <strong>{shopName}</strong> will send via session <strong>&quot;{whatsappSessionId.trim()}&quot;</strong>.
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle size={16} style={{ color: "#d97706", flexShrink: 0 }} />
                  <span>
                    <strong>Paused:</strong> No session ID entered for <strong>{shopName}</strong>. Order messages will NOT send (preventing cross-shop messages). Enter a session ID to enable.
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ─── CARD 7: Bottom Save Action Bar ─── */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "5px",
            padding: "16px 20px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
            marginTop: "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={isPending}
              style={{
                padding: "11px 26px",
                borderRadius: "5px",
                background: isPending
                  ? "#94a3b8"
                  : "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 800,
                border: "none",
                cursor: isPending ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(234, 88, 12, 0.3)",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                transition: "transform 0.15s ease",
              }}
              className="hover:scale-[1.02] active:scale-[0.98]"
            >
              {isPending ? (
                <>
                  <span
                    style={{
                      width: "14px",
                      height: "14px",
                      border: "2px solid #ffffff",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Save Shop Settings</span>
                </>
              )}
            </button>

            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
              {isPending
                ? "Saving changes to database..."
                : state.success
                ? "✓ All shop settings are up to date."
                : "Ready to save shop and business settings."}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: state.success ? "#16a34a" : "#ea580c",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
              {shopName} Config
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}
