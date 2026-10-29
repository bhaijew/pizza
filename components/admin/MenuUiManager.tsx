"use client";

import { useState, useTransition, useMemo } from "react";
import { updateMenuUiSettings, requestMenu2Unlock } from "@/lib/admin-actions";
import type { ShopSettings } from "@/lib/menu-data";
import { DEFAULT_PROMO_SLIDES, type PromoSlide, PRESET_FOOD_IMAGES } from "@/lib/preset-images";
import { MENU2_THEMES, type Menu2ThemeId } from "@/components/menu/menu2-themes";
import {
  Smartphone,
  Sparkles,
  Plus,
  Trash2,
  Image as ImageIcon,
  Check,
  ChevronRight,
  Sliders,
  X,
  Eye,
  Laptop,
  ShoppingBag,
  Layers,
  CheckCircle2,
  Lock,
  Crown,
  ExternalLink,
  Clock,
} from "lucide-react";

const ChevronUp = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 15-6-6-6 6" />
  </svg>
);

const ChevronDown = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const Palette = ({ size = 18, style }: { size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
);

interface MenuUiManagerProps {
  initialSettings: ShopSettings;
  shopName?: string;
  shopSlug?: string;
}

const THEME_COLOR_PRESETS = [
  { label: "Pizza Red", color: "#dc2626", bg: "#fef2f2" },
  { label: "Fire Orange", color: "#ea580c", bg: "#fff7ed" },
  { label: "Golden Amber", color: "#d97706", bg: "#fffbeb" },
  { label: "Basil Green", color: "#16a34a", bg: "#f0fdf4" },
  { label: "Royal Blue", color: "#2563eb", bg: "#eff6ff" },
  { label: "Charcoal Dark", color: "#0f172a", bg: "#f8fafc" },
  { label: "Violet Plum", color: "#7c3aed", bg: "#f5f3ff" },
];

const SLIDER_SIZE_PRESETS = [
  { label: "Compact", height: 140, desc: "Fast ordering, saves vertical space" },
  { label: "Standard", height: 180, desc: "Balanced mobile aspect ratio (Recommended)" },
  { label: "Prominent", height: 220, desc: "Large visual banners for deals" },
  { label: "Hero Banner", height: 260, desc: "Full visual impact on mobile" },
];

const HERO_GRADIENT_PRESETS = [
  { label: "Theme Match", gradient: "", desc: "Auto-syncs with primary theme color" },
  { label: "Fire Ember", gradient: "linear-gradient(135deg, #7f1d1d 0%, #b91c1c 35%, #ea580c 75%, #f59e0b 100%)", desc: "Warm fiery pizza oven glow" },
  { label: "Midnight Sourdough", gradient: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #311042 75%, #451a03 100%)", desc: "Sleek dark violet & amber" },
  { label: "Tuscan Brick", gradient: "linear-gradient(135deg, #431407 0%, #7c2d12 40%, #9a3412 80%, #c2410c 100%)", desc: "Rustic artisanal clay brick" },
  { label: "Emerald Herb", gradient: "linear-gradient(135deg, #022c22 0%, #064e3b 45%, #047857 85%, #10b981 100%)", desc: "Fresh basil & olive garden" },
  { label: "Dark Obsidian", gradient: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%)", desc: "Minimalist stealth charcoal" },
];

export default function MenuUiManager({
  initialSettings,
  shopName = "Pizza Shop",
  shopSlug = "main",
}: MenuUiManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // ─── THEME & COLOR STATE ───────────────────────────────────────
  const [themeColor, setThemeColor] = useState(initialSettings.theme_color || "#7c3aed");

  // ─── MENU 2.0 PREMIUM SYSTEM & COLOR SCHEME STATE ──────────────
  const [menu2Status, setMenu2Status] = useState<"locked" | "requested" | "approved">(
    initialSettings.menu2_status || "locked"
  );
  const [activeMenuTemplate, setActiveMenuTemplate] = useState<"menu1" | "menu2">(
    initialSettings.menu2_status === "approved" && initialSettings.active_menu_template === "menu2"
      ? "menu2"
      : "menu1"
  );
  const [menu2Theme, setMenu2Theme] = useState<Menu2ThemeId>(
    (initialSettings.menu2_theme as Menu2ThemeId) && MENU2_THEMES[initialSettings.menu2_theme as Menu2ThemeId]
      ? (initialSettings.menu2_theme as Menu2ThemeId)
      : "ruby_gold"
  );
  const [isRequestingUnlock, setIsRequestingUnlock] = useState(false);

  // ─── SLIDER STATE ──────────────────────────────────────────────
  const [sliderEnabled, setSliderEnabled] = useState(initialSettings.slider_enabled !== false);
  const [sliderHeight, setSliderHeight] = useState(initialSettings.slider_height_mobile || 180);

  // Initialize slides
  const parsedSlides = useMemo<PromoSlide[]>(() => {
    if (initialSettings.slider_images && Array.isArray(initialSettings.slider_images) && initialSettings.slider_images.length > 0) {
      return initialSettings.slider_images;
    }
    return DEFAULT_PROMO_SLIDES;
  }, [initialSettings.slider_images]);

  const [slides, setSlides] = useState<PromoSlide[]>(parsedSlides);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // ─── HERO BANNER CUSTOMIZATION STATE ───────────────────────────
  const [heroBadgeText, setHeroBadgeText] = useState(
    initialSettings.hero_badge_text !== undefined ? initialSettings.hero_badge_text : "Artisan Kitchen • Stone Baked Daily"
  );
  const [heroTitle, setHeroTitle] = useState(
    initialSettings.hero_title !== undefined ? initialSettings.hero_title : "Handcrafted Pizzas."
  );
  const [heroTitleHighlight, setHeroTitleHighlight] = useState(
    initialSettings.hero_title_highlight !== undefined ? initialSettings.hero_title_highlight : "Fresh Every Order."
  );
  const [heroSubtitle, setHeroSubtitle] = useState(
    initialSettings.hero_subtitle !== undefined
      ? initialSettings.hero_subtitle
      : "Fresh stone-baked pizzas, burgers & drinks prepared to order."
  );
  const [heroBtnPrimaryText, setHeroBtnPrimaryText] = useState(
    initialSettings.hero_btn_primary_text !== undefined ? initialSettings.hero_btn_primary_text : "Order Now"
  );
  const [heroBgType, setHeroBgType] = useState(initialSettings.hero_bg_type || "gradient");
  const [heroBgGradient, setHeroBgGradient] = useState(initialSettings.hero_bg_gradient || "");
  const [heroBgImage, setHeroBgImage] = useState(initialSettings.hero_bg_image || "");

  // ─── PREVIEW CONTROLS ──────────────────────────────────────────
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
  const [foodImagePickerSlideId, setFoodImagePickerSlideId] = useState<string | null>(null);

  // ─── SLIDE OPERATIONS ──────────────────────────────────────────
  const handleAddSlide = () => {
    const newSlide: PromoSlide = {
      id: `slide-${Date.now()}`,
      title: "Special Chef Choice Combo",
      subtitle: "Fresh stone-baked pizza loaded with premium toppings",
      image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1000&auto=format&fit=crop&q=80",
      badge: "Deal 🔥",
      link_url: "#menu",
      is_active: true,
    };
    setSlides([...slides, newSlide]);
  };

  const handleUpdateSlide = (id: string, updates: Partial<PromoSlide>) => {
    setSlides(slides.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleDeleteSlide = (id: string) => {
    if (slides.length <= 1) {
      alert("You need at least 1 promo slide.");
      return;
    }
    setSlides(slides.filter((s) => s.id !== id));
  };

  const handleMoveSlide = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === slides.length - 1) return;
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const newSlides = [...slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIdx];
    newSlides[targetIdx] = temp;
    setSlides(newSlides);
  };

  // ─── SAVE HANDLER ──────────────────────────────────────────────
  const handleSave = () => {
    setSaveNotice(null);
    startTransition(async () => {
      const res = await updateMenuUiSettings({
        themeColor,
        sliderEnabled,
        sliderHeightMobile: sliderHeight,
        sliderImages: slides,
        heroBadgeText,
        heroTitle,
        heroTitleHighlight,
        heroSubtitle,
        heroBtnPrimaryText,
        heroBgType,
        heroBgGradient,
        heroBgImage,
        activeMenuTemplate,
        menu2Theme,
      });

      if (res.success) {
        setSaveNotice("✓ Menu UI, active menu template, and color scheme saved successfully!");
        setTimeout(() => setSaveNotice(null), 4000);
      } else {
        setSaveNotice(`⚠️ Error: ${res.error || "Failed to save settings"}`);
      }
    });
  };

  const handleRequestMenu2 = async () => {
    setIsRequestingUnlock(true);
    setSaveNotice(null);
    try {
      const res = await requestMenu2Unlock(menu2Theme);
      if (res.success) {
        setMenu2Status("requested");
        setSaveNotice(
          "✓ Request sent to Super Admin! Once Super Admin approves your request, Premium Menu 2.0 will automatically be unlocked and applied to your live storefront."
        );
      } else {
        setSaveNotice(`⚠️ Error: ${res.error || "Could not send unlock request"}`);
      }
    } finally {
      setIsRequestingUnlock(false);
    }
  };

  const activeSlidesList = useMemo(() => slides.filter((s) => s.is_active !== false), [slides]);
  const currentPreviewSlide = activeSlidesList[activeSlideIndex % Math.max(1, activeSlidesList.length)] || slides[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* ─── Page Top Bar ─── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "5px",
          padding: "18px 22px",
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
              width: "40px",
              height: "40px",
              borderRadius: "5px",
              background: `${themeColor}15`,
              color: themeColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${themeColor}35`,
            }}
          >
            <Palette size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 900, margin: 0, color: "#0f172a" }}>
              Menu UI, Theme &amp; Banner Customization
            </h1>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
              Control colors, mobile promo slider, product card layout, and hero banners for {shopName}.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "10px 20px",
              borderRadius: "5px",
              background: themeColor,
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 800,
              border: "none",
              cursor: isPending ? "not-allowed" : "pointer",
              boxShadow: `0 2px 10px ${themeColor}40`,
              transition: "transform 0.15s ease",
            }}
            className="hover:opacity-95"
          >
            <CheckCircle2 size={15} />
            <span>{isPending ? "Saving Changes..." : "Save Menu & UI Settings"}</span>
          </button>
        </div>
      </div>

      {saveNotice && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "5px",
            background: saveNotice.startsWith("✓") ? "#f0fdf4" : "#fef2f2",
            border: saveNotice.startsWith("✓") ? "1px solid #bbf7d0" : "1px solid #fecaca",
            color: saveNotice.startsWith("✓") ? "#15803d" : "#b91c1c",
            fontSize: "13px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle2 size={16} />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* ─── Two-Column Split: Controls on Left, Live Mockup Preview on Right ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 540px), 1fr))", gap: "22px", alignItems: "start" }}>
        {/* ════════════════════════════════════════════════════════
            LEFT COLUMN: UI SETTINGS & CONTROLS
        ════════════════════════════════════════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* ─── CARD 0: STOREFRONT MENU SYSTEM & PREMIUM MENU 2.0 (SQUARE LUXE) ─── */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "7px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Crown size={18} style={{ color: "#d97706" }} />
                <h2 style={{ fontSize: "14px", fontWeight: 900, margin: 0, color: "#0f172a" }}>
                  Storefront Menu Template &amp; Premium Menu 2.0
                </h2>
              </div>

              {menu2Status === "approved" ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: "#dcfce7",
                    border: "1px solid #86efac",
                    color: "#15803d",
                    fontSize: "11px",
                    fontWeight: 900,
                  }}
                >
                  <CheckCircle2 size={13} />
                  <span>Premium Menu 2.0 Unlocked</span>
                </span>
              ) : menu2Status === "requested" ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: "#fef3c7",
                    border: "1px solid #fcd34d",
                    color: "#b45309",
                    fontSize: "11px",
                    fontWeight: 900,
                  }}
                >
                  <Clock size={13} />
                  <span>Waiting for Super Admin Approval</span>
                </span>
              ) : (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    color: "#475569",
                    fontSize: "11px",
                    fontWeight: 900,
                  }}
                >
                  <Lock size={12} />
                  <span>Premium Locked (Super Admin Approval Required)</span>
                </span>
              )}
            </div>

            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: 1.45 }}>
              Select your live storefront menu style and customize the <strong>Menu 2.0 (Square Luxe)</strong> color scheme. Menu 2.0 is a premium storefront layout — send an unlock request below and once Super Admin approves, it will automatically apply to your live shop.
            </p>

            {/* Menu 1.0 vs Menu 2.0 Selector Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
              {/* Standard Menu 1.0 */}
              <div
                onClick={() => setActiveMenuTemplate("menu1")}
                style={{
                  border: activeMenuTemplate === "menu1" ? `2px solid ${themeColor}` : "1px solid #cbd5e1",
                  background: activeMenuTemplate === "menu1" ? `${themeColor}08` : "#f8fafc",
                  borderRadius: "7px",
                  padding: "14px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", fontWeight: 900, color: "#0f172a" }}>
                    Menu 1.0 — Classic Menu
                  </span>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "5px",
                      fontSize: "10px",
                      fontWeight: 800,
                      background: activeMenuTemplate === "menu1" ? themeColor : "#e2e8f0",
                      color: activeMenuTemplate === "menu1" ? "#ffffff" : "#475569",
                    }}
                  >
                    {activeMenuTemplate === "menu1" ? "ACTIVE" : "Standard"}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "11px", color: "#64748b", lineHeight: 1.4 }}>
                  Default classic restaurant menu with standard category tabs and quick cart drawer.
                </p>
              </div>

              {/* Premium Menu 2.0 */}
              <div
                onClick={() => {
                  if (menu2Status === "approved") {
                    setActiveMenuTemplate("menu2");
                  }
                }}
                style={{
                  border:
                    activeMenuTemplate === "menu2"
                      ? "2px solid #d97706"
                      : menu2Status === "approved"
                        ? "1px solid #fcd34d"
                        : "1px dashed #cbd5e1",
                  background:
                    activeMenuTemplate === "menu2"
                      ? "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)"
                      : "#fffdf7",
                  borderRadius: "7px",
                  padding: "14px",
                  cursor: menu2Status === "approved" ? "pointer" : "default",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  position: "relative",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 900, color: "#0f172a", display: "flex", alignItems: "center", gap: "5px" }}>
                    {menu2Status !== "approved" && <Lock size={13} style={{ color: "#d97706" }} />}
                    <span>Menu 2.0 — Square Luxe</span>
                  </span>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "5px",
                      fontSize: "10px",
                      fontWeight: 900,
                      background:
                        activeMenuTemplate === "menu2"
                          ? "#d97706"
                          : menu2Status === "approved"
                            ? "#dcfce7"
                            : menu2Status === "requested"
                              ? "#fef3c7"
                              : "#1e293b",
                      color:
                        activeMenuTemplate === "menu2"
                          ? "#ffffff"
                          : menu2Status === "approved"
                            ? "#15803d"
                            : menu2Status === "requested"
                              ? "#b45309"
                              : "#fbbf24",
                    }}
                  >
                    {activeMenuTemplate === "menu2"
                      ? "ACTIVE LIVE"
                      : menu2Status === "approved"
                        ? "UNLOCKED"
                        : menu2Status === "requested"
                          ? "REQUESTED"
                          : "🔒 PREMIUM"}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "11px", color: "#64748b", lineHeight: 1.4 }}>
                  7px square-luxe header, auto-playing hero slider, inline pizza size selector cards &amp; 3-step slide-over checkout.
                </p>
              </div>
            </div>

            {/* Menu 2.0 Color Scheme Picker (Admin Controlled — Removed from Customer Header) */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "7px",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 900, color: "#0f172a" }}>
                    Menu 2.0 Color Scheme (Admin Controlled)
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                    Select the color palette for Menu 2.0. Customers will see this theme on your storefront without any public switcher bar.
                  </div>
                </div>
                <a
                  href={shopSlug && shopSlug !== "main" ? `/menu2?shop=${shopSlug}` : "/menu2"}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    background: "#0f172a",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 800,
                    textDecoration: "none",
                  }}
                >
                  <span>Preview Menu 2.0</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "8px" }}>
                {Object.values(MENU2_THEMES).map((t) => {
                  const selected = menu2Theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setMenu2Theme(t.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "9px 11px",
                        borderRadius: "7px",
                        background: selected ? "#ffffff" : "#f1f5f9",
                        border: selected ? `2px solid ${t.swatch}` : "1px solid #cbd5e1",
                        cursor: "pointer",
                        textAlign: "left",
                        boxShadow: selected ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                      }}
                    >
                      <span
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "5px",
                          background: t.swatch,
                          flexShrink: 0,
                          border: "1px solid rgba(0,0,0,0.15)",
                        }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: "11px", fontWeight: 900, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {t.label}
                        </div>
                        <div style={{ fontSize: "9.5px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {t.tagline}
                        </div>
                      </div>
                      {selected && <Check size={13} style={{ color: t.swatch, flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lock / Request / Approved Action Strip */}
            {menu2Status === "locked" && (
              <div
                style={{
                  background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                  borderRadius: "7px",
                  padding: "14px 16px",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 900, color: "#fbbf24", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Lock size={13} />
                    <span>Menu 2.0 is Locked (Premium Storefront)</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#cbd5e1", marginTop: "2px" }}>
                    Want to activate Menu 2.0 on your shop? Send an unlock request to the Super Admin. Once accepted, it will be applied automatically.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRequestMenu2}
                  disabled={isRequestingUnlock}
                  style={{
                    padding: "9px 16px",
                    borderRadius: "7px",
                    background: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 900,
                    cursor: isRequestingUnlock ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 4px 12px rgba(234, 88, 12, 0.35)",
                  }}
                >
                  <Crown size={14} />
                  <span>{isRequestingUnlock ? "Sending Request..." : "Request Super Admin to Unlock Menu 2.0"}</span>
                </button>
              </div>
            )}

            {menu2Status === "requested" && (
              <div
                style={{
                  background: "#fffbeb",
                  border: "1px solid #fcd34d",
                  borderRadius: "7px",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div style={{ fontSize: "12px", color: "#92400e", fontWeight: 700 }}>
                  ⏳ <strong>Unlock Request Pending:</strong> Your request for <strong>Menu 2.0 ({MENU2_THEMES[menu2Theme]?.label})</strong> has been sent to the Super Admin. As soon as Super Admin accepts, Menu 2.0 will go live on your shop!
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  style={{
                    padding: "7px 12px",
                    borderRadius: "6px",
                    background: "#d97706",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "11px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Save Color Scheme
                </button>
              </div>
            )}

            {menu2Status === "approved" && (
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "7px",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div style={{ fontSize: "12px", color: "#166534", fontWeight: 700 }}>
                  ✓ <strong>Approved by Super Admin:</strong> Currently active menu is{" "}
                  <strong>{activeMenuTemplate === "menu2" ? `Menu 2.0 (${MENU2_THEMES[menu2Theme]?.label})` : "Menu 1.0 (Classic)"}</strong>. Click <strong>Save Menu &amp; UI Settings</strong> after changing template or color scheme.
                </div>
              </div>
            )}
          </div>

          {/* ─── CARD 1: MENU THEME & ACCENT COLOR ─── */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "5px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Palette size={18} style={{ color: themeColor }} />
              <h2 style={{ fontSize: "14px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                Menu Theme &amp; Accent Color
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: 1.45 }}>
              Choose your restaurant's primary theme color. Tint will apply to menu buttons, banners, category pills and cart highlights.
            </p>

            {/* Color Palette Chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {THEME_COLOR_PRESETS.map((p) => {
                const isSelected = themeColor.toLowerCase() === p.color.toLowerCase();
                return (
                  <button
                    key={p.color}
                    type="button"
                    onClick={() => setThemeColor(p.color)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "7px 12px",
                      borderRadius: "5px",
                      background: isSelected ? p.bg : "#ffffff",
                      border: isSelected ? `2px solid ${p.color}` : "1px solid #cbd5e1",
                      color: isSelected ? p.color : "#334155",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                      boxShadow: isSelected ? `0 2px 6px ${p.color}30` : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: p.color,
                        display: "inline-block",
                      }}
                    />
                    <span>{p.label}</span>
                    {isSelected && <Check size={13} style={{ strokeWidth: 3 }} />}
                  </button>
                );
              })}
            </div>

            {/* Custom Hex Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Custom Hex:</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  style={{
                    width: "36px",
                    height: "36px",
                    padding: 0,
                    border: "1px solid #cbd5e1",
                    borderRadius: "5px",
                    cursor: "pointer",
                    background: "none",
                  }}
                  title="Pick a custom color"
                />
                <input
                  type="text"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  style={{
                    width: "110px",
                    padding: "8px 10px",
                    borderRadius: "5px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: "#0f172a",
                    outline: "none",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  color: themeColor,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                ● Active Palette
              </span>
            </div>
          </div>

          {/* ─── CARD 2: MOBILE MENU PROMO & DEAL SLIDER ─── */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "5px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Smartphone size={18} style={{ color: themeColor }} />
                <h2 style={{ fontSize: "14px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                  Mobile Menu Promo &amp; Deal Slider
                </h2>
              </div>

              {/* Slider Enable/Disable Toggle */}
              <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 700, color: "#334155" }}>
                <input
                  type="checkbox"
                  checked={sliderEnabled}
                  onChange={(e) => setSliderEnabled(e.target.checked)}
                  style={{ accentColor: themeColor, width: "16px", height: "16px", cursor: "pointer" }}
                />
                <span>Enable Slider</span>
              </label>
            </div>

            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: 1.45 }}>
              Controls the banner slider displayed to mobile customers. Adjust the height in pixels to fit your menu perfectly.
            </p>

            {sliderEnabled && (
              <>
                {/* Mobile Slider Height Selector */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 800, color: "#334155", textTransform: "uppercase" }}>
                      MOBILE SLIDER HEIGHT: <span style={{ color: themeColor }}>{sliderHeight}PX</span>
                    </label>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      Live Mobile Preview updates instantly 👉
                    </span>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", marginBottom: "12px" }}>
                    {SLIDER_SIZE_PRESETS.map((p) => {
                      const isSelected = sliderHeight === p.height;
                      return (
                        <button
                          key={p.height}
                          type="button"
                          onClick={() => setSliderHeight(p.height)}
                          style={{
                            padding: "8px 10px",
                            borderRadius: "5px",
                            textAlign: "left",
                            cursor: "pointer",
                            border: isSelected ? `2px solid ${themeColor}` : "1px solid #cbd5e1",
                            background: isSelected ? "#ffffff" : "#ffffff",
                            boxShadow: isSelected ? `0 2px 8px ${themeColor}25` : "none",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", fontWeight: 800, color: isSelected ? themeColor : "#0f172a" }}>
                              {p.label}
                            </span>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                              {p.height}px
                            </span>
                          </div>
                          <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
                            {p.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Range Slider Control */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>120px</span>
                    <input
                      type="range"
                      min={120}
                      max={300}
                      step={10}
                      value={sliderHeight}
                      onChange={(e) => setSliderHeight(parseInt(e.target.value, 10))}
                      style={{
                        flex: 1,
                        accentColor: themeColor,
                        cursor: "pointer",
                      }}
                    />
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>300px</span>
                  </div>
                </div>

                {/* ─── ACTIVE SLIDES MANAGER ─── */}
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase" }}>
                      ACTIVE SLIDES ({slides.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddSlide}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "6px 12px",
                        borderRadius: "5px",
                        background: themeColor,
                        color: "#ffffff",
                        fontSize: "11px",
                        fontWeight: 800,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <Plus size={13} />
                      <span>Add Promo Slide</span>
                    </button>
                  </div>

                  {/* Slides List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {slides.map((slide, idx) => (
                      <div
                        key={slide.id}
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "5px",
                          padding: "12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748b" }}>
                              #{idx + 1}
                            </span>
                            <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>
                              {slide.title || "Untitled Slide"}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => handleMoveSlide(idx, "up")}
                              disabled={idx === 0}
                              style={{
                                padding: "4px 6px",
                                borderRadius: "4px",
                                border: "1px solid #cbd5e1",
                                background: "#ffffff",
                                cursor: idx === 0 ? "not-allowed" : "pointer",
                                opacity: idx === 0 ? 0.4 : 1,
                              }}
                              title="Move Up"
                            >
                              <ChevronUp size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveSlide(idx, "down")}
                              disabled={idx === slides.length - 1}
                              style={{
                                padding: "4px 6px",
                                borderRadius: "4px",
                                border: "1px solid #cbd5e1",
                                background: "#ffffff",
                                cursor: idx === slides.length - 1 ? "not-allowed" : "pointer",
                                opacity: idx === slides.length - 1 ? 0.4 : 1,
                              }}
                              title="Move Down"
                            >
                              <ChevronDown size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSlide(slide.id)}
                              style={{
                                padding: "4px 6px",
                                borderRadius: "4px",
                                border: "1px solid #fecaca",
                                background: "#fef2f2",
                                color: "#dc2626",
                                cursor: "pointer",
                              }}
                              title="Delete Slide"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "10px", alignItems: "start" }}>
                          {/* Slide Thumbnail */}
                          <div>
                            <div
                              style={{
                                width: "80px",
                                height: "55px",
                                borderRadius: "5px",
                                overflow: "hidden",
                                background: "#e2e8f0",
                                position: "relative",
                              }}
                            >
                              <img
                                src={slide.image_url}
                                alt={slide.title}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setFoodImagePickerSlideId(foodImagePickerSlideId === slide.id ? null : slide.id)
                              }
                              style={{
                                width: "100%",
                                marginTop: "4px",
                                padding: "3px 4px",
                                fontSize: "10px",
                                fontWeight: 700,
                                background: "#ffffff",
                                border: "1px solid #cbd5e1",
                                borderRadius: "4px",
                                color: "#334155",
                                cursor: "pointer",
                              }}
                            >
                              Pick Image
                            </button>
                          </div>

                          {/* Inputs */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <input
                              type="text"
                              value={slide.title}
                              onChange={(e) => handleUpdateSlide(slide.id, { title: e.target.value })}
                              placeholder="Slide Title (e.g. Weekend Pizza Feast)"
                              style={{
                                width: "100%",
                                padding: "6px 8px",
                                borderRadius: "4px",
                                border: "1px solid #cbd5e1",
                                fontSize: "12px",
                                fontWeight: 700,
                                boxSizing: "border-box",
                              }}
                            />
                            <input
                              type="text"
                              value={slide.subtitle || ""}
                              onChange={(e) => handleUpdateSlide(slide.id, { subtitle: e.target.value })}
                              placeholder="Subtitle / Details..."
                              style={{
                                width: "100%",
                                padding: "5px 8px",
                                borderRadius: "4px",
                                border: "1px solid #cbd5e1",
                                fontSize: "11px",
                                boxSizing: "border-box",
                              }}
                            />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                              <input
                                type="text"
                                value={slide.badge || ""}
                                onChange={(e) => handleUpdateSlide(slide.id, { badge: e.target.value })}
                                placeholder="Badge tag (e.g. 20% OFF)"
                                style={{
                                  width: "100%",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  border: "1px solid #cbd5e1",
                                  fontSize: "11px",
                                  boxSizing: "border-box",
                                }}
                              />
                              <input
                                type="text"
                                value={slide.link_url || ""}
                                onChange={(e) => handleUpdateSlide(slide.id, { link_url: e.target.value })}
                                placeholder="Link URL (#menu)"
                                style={{
                                  width: "100%",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  border: "1px solid #cbd5e1",
                                  fontSize: "11px",
                                  boxSizing: "border-box",
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Quick Preset Food Images Selector Modal / Drawer */}
                        {foodImagePickerSlideId === slide.id && (
                          <div
                            style={{
                              marginTop: "8px",
                              padding: "10px",
                              background: "#ffffff",
                              border: "1px solid #cbd5e1",
                              borderRadius: "5px",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                              <span style={{ fontSize: "11px", fontWeight: 800, color: "#0f172a" }}>
                                Select High-Res Food Banner Image:
                              </span>
                              <button
                                type="button"
                                onClick={() => setFoodImagePickerSlideId(null)}
                                style={{ background: "none", border: "none", cursor: "pointer" }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                              {PRESET_FOOD_IMAGES.slice(0, 8).map((img) => (
                                <button
                                  key={img.url}
                                  type="button"
                                  onClick={() => {
                                    handleUpdateSlide(slide.id, { image_url: img.url });
                                    setFoodImagePickerSlideId(null);
                                  }}
                                  style={{
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "4px",
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    padding: 0,
                                    background: "#000",
                                  }}
                                >
                                  <img
                                    src={img.url}
                                    alt={img.name}
                                    style={{ width: "100%", height: "45px", objectFit: "cover", display: "block" }}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ─── CARD 3: HERO SECTION TEXT & HEADINGS ─── */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "5px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={18} style={{ color: themeColor }} />
              <h2 style={{ fontSize: "14px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                Desktop Hero Banner Text &amp; Headings
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Hero Badge Text
                </label>
                <input
                  type="text"
                  value={heroBadgeText}
                  onChange={(e) => setHeroBadgeText(e.target.value)}
                  placeholder="e.g. Artisan Kitchen • Stone Baked Daily"
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: "5px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Main Headline
                  </label>
                  <input
                    type="text"
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    placeholder="e.g. Handcrafted Pizzas."
                    style={{
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: "5px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      fontWeight: 700,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Highlight Phrase (Color Tinted)
                  </label>
                  <input
                    type="text"
                    value={heroTitleHighlight}
                    onChange={(e) => setHeroTitleHighlight(e.target.value)}
                    placeholder="e.g. Fresh Every Order."
                    style={{
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: "5px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: themeColor,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Hero Subtitle Paragraph
                </label>
                <input
                  type="text"
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  placeholder="e.g. Fresh stone-baked pizzas, burgers & drinks prepared to order."
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: "5px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            RIGHT COLUMN: REAL-TIME LIVE INTERACTIVE PREVIEW
        ════════════════════════════════════════════════════════ */}
        <div style={{ position: "sticky", top: "20px" }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "5px",
              padding: "18px",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
            }}
          >
            {/* Preview Toolbar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Eye size={16} style={{ color: themeColor }} />
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>
                  Live Customer Menu Preview
                </span>
              </div>

              {/* Device Selector */}
              <div style={{ display: "flex", gap: "4px", background: "#f1f5f9", padding: "3px", borderRadius: "5px" }}>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: "none",
                    background: previewDevice === "mobile" ? "#ffffff" : "transparent",
                    color: previewDevice === "mobile" ? "#0f172a" : "#64748b",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: previewDevice === "mobile" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  <Smartphone size={13} />
                  <span>Mobile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: "none",
                    background: previewDevice === "desktop" ? "#ffffff" : "transparent",
                    color: previewDevice === "desktop" ? "#0f172a" : "#64748b",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: previewDevice === "desktop" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  <Laptop size={13} />
                  <span>Desktop</span>
                </button>
              </div>
            </div>

            {/* Mockup Frame */}
            {previewDevice === "mobile" ? (
              /* Mobile Phone Mockup */
              <div
                style={{
                  width: "100%",
                  maxWidth: "340px",
                  margin: "0 auto",
                  borderRadius: "28px",
                  border: "8px solid #1e293b",
                  background: "#f8fafc",
                  overflow: "hidden",
                  boxShadow: "0 12px 30px rgba(0, 0, 0, 0.15)",
                }}
              >
                {/* Phone Speaker Notch */}
                <div style={{ background: "#1e293b", height: "18px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <div style={{ width: "45px", height: "4px", borderRadius: "2px", background: "#334155" }} />
                </div>

                {/* Mobile Menu Top Bar */}
                <div
                  style={{
                    background: "#ffffff",
                    borderBottom: "1px solid #e2e8f0",
                    padding: "10px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 900, color: "#0f172a" }}>{shopName}</div>
                    <div style={{ fontSize: "9px", color: "#10b981", fontWeight: 700 }}>● Open Now</div>
                  </div>
                  <div
                    style={{
                      padding: "4px 8px",
                      borderRadius: "5px",
                      background: `${themeColor}15`,
                      color: themeColor,
                      fontSize: "10px",
                      fontWeight: 800,
                    }}
                  >
                    🛒 0 Items
                  </div>
                </div>

                {/* Live Mobile Promo Slider */}
                {sliderEnabled && currentPreviewSlide && (
                  <div style={{ padding: "10px", background: "#f1f5f9" }}>
                    <div
                      style={{
                        height: `${sliderHeight}px`,
                        borderRadius: "5px",
                        overflow: "hidden",
                        position: "relative",
                        backgroundImage: `url(${currentPreviewSlide.image_url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)",
                          padding: "12px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "flex-end",
                          color: "#ffffff",
                        }}
                      >
                        {currentPreviewSlide.badge && (
                          <span
                            style={{
                              display: "inline-block",
                              alignSelf: "flex-start",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              background: themeColor,
                              color: "#ffffff",
                              fontSize: "9px",
                              fontWeight: 800,
                              marginBottom: "4px",
                            }}
                          >
                            {currentPreviewSlide.badge}
                          </span>
                        )}
                        <div style={{ fontSize: "13px", fontWeight: 900, lineHeight: 1.2 }}>
                          {currentPreviewSlide.title}
                        </div>
                        <div style={{ fontSize: "10px", color: "#cbd5e1", marginTop: "2px" }}>
                          {currentPreviewSlide.subtitle}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Category Pills Bar (Tinted with Theme Color) */}
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    padding: "8px 10px",
                    background: "#ffffff",
                    borderBottom: "1px solid #e2e8f0",
                    overflowX: "hidden",
                  }}
                >
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "5px",
                      background: themeColor,
                      color: "#ffffff",
                      fontSize: "10px",
                      fontWeight: 800,
                    }}
                  >
                    🔥 Specials
                  </span>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "5px",
                      background: "#f1f5f9",
                      color: "#475569",
                      fontSize: "10px",
                      fontWeight: 700,
                    }}
                  >
                    Pizzas
                  </span>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "5px",
                      background: "#f1f5f9",
                      color: "#475569",
                      fontSize: "10px",
                      fontWeight: 700,
                    }}
                  >
                    Burgers
                  </span>
                </div>

                {/* Sample Product Cards with Price on Right & Button on Left */}
                <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "5px",
                      padding: "10px",
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1628840042765-356cda07504e?w=200&auto=format&fit=crop&q=80"
                      alt="Pizza"
                      style={{ width: "60px", height: "60px", borderRadius: "5px", objectFit: "cover" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>
                        Pepperoni Passion
                      </div>
                      <div style={{ fontSize: "10px", color: "#64748b" }}>
                        Loaded beef pepperoni &amp; mozzarella
                      </div>

                      {/* Button Left, Price Right (5px radius & bold font) */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                        <button
                          type="button"
                          style={{
                            padding: "4px 10px",
                            borderRadius: "5px",
                            background: themeColor,
                            color: "#ffffff",
                            fontSize: "10px",
                            fontWeight: 800,
                            border: "none",
                          }}
                        >
                          + Add
                        </button>
                        <span style={{ fontSize: "13px", fontWeight: 900, color: "#0f172a" }}>
                          Rs. 1,450
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Desktop Preview */
              <div
                style={{
                  width: "100%",
                  borderRadius: "5px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  overflow: "hidden",
                }}
              >
                {/* Desktop Hero View */}
                <div
                  style={{
                    background: heroBgGradient || `linear-gradient(135deg, ${themeColor} 0%, #0f172a 100%)`,
                    padding: "24px 20px",
                    color: "#ffffff",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      background: "rgba(255, 255, 255, 0.15)",
                      fontSize: "9px",
                      fontWeight: 800,
                      marginBottom: "6px",
                    }}
                  >
                    {heroBadgeText}
                  </span>
                  <h3 style={{ fontSize: "18px", fontWeight: 900, margin: "0 0 4px" }}>
                    {heroTitle} <span style={{ color: "#facc15" }}>{heroTitleHighlight}</span>
                  </h3>
                  <p style={{ margin: 0, fontSize: "11px", color: "#cbd5e1", maxWidth: "340px" }}>
                    {heroSubtitle}
                  </p>
                  <div style={{ marginTop: "12px" }}>
                    <button
                      type="button"
                      style={{
                        padding: "6px 14px",
                        borderRadius: "5px",
                        background: "#ffffff",
                        color: themeColor,
                        fontSize: "11px",
                        fontWeight: 900,
                        border: "none",
                      }}
                    >
                      {heroBtnPrimaryText}
                    </button>
                  </div>
                </div>

                {/* Sample Grid Preview */}
                <div style={{ padding: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "5px", padding: "10px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 800 }}>Fajita Feast Large</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                      <button style={{ padding: "4px 8px", borderRadius: "5px", background: themeColor, color: "#fff", fontSize: "10px", fontWeight: 800, border: "none" }}>
                        + Add
                      </button>
                      <span style={{ fontSize: "13px", fontWeight: 900 }}>Rs. 1,650</span>
                    </div>
                  </div>
                  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "5px", padding: "10px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 800 }}>Loaded Cheese Bread</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                      <button style={{ padding: "4px 8px", borderRadius: "5px", background: themeColor, color: "#fff", fontSize: "10px", fontWeight: 800, border: "none" }}>
                        + Add
                      </button>
                      <span style={{ fontSize: "13px", fontWeight: 900 }}>Rs. 699</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
