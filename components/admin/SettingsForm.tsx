"use client";

import { useActionState, useState, useMemo } from "react";
import { updateSettings } from "@/lib/admin-actions";
import type { ShopSettings } from "@/lib/menu-data";
import { DEFAULT_PROMO_SLIDES, type PromoSlide, PRESET_FOOD_IMAGES } from "@/lib/preset-images";
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
  Store,
  Clock,
  MessageSquare,
  Globe,
} from "lucide-react";

const PaletteIcon = ({ size = 16, style }: { size?: number; style?: React.CSSProperties }) => (
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
}

const CURRENCY_PRESETS = [
  { label: "$ (USD / Dollar)", symbol: "$" },
  { label: "Rs. (PKR / Rupee)", symbol: "Rs. " },
  { label: "₹ (INR / Rupee)", symbol: "₹" },
  { label: "€ (EUR / Euro)", symbol: "€" },
  { label: "£ (GBP / Pound)", symbol: "£" },
  { label: "AED (Dirham)", symbol: "AED " },
  { label: "SAR (Riyal)", symbol: "SAR " },
  { label: "C$ (CAD / Dollar)", symbol: "C$" },
];

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

const HERO_BG_IMAGE_PRESETS = [
  { label: "Stone Baked Pizza", url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&auto=format&fit=crop&q=80" },
  { label: "Artisan Oven", url: "https://images.unsplash.com/photo-1579751626657-72bc17010498?w=1200&auto=format&fit=crop&q=80" },
  { label: "Chef Prep Kitchen", url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80" },
  { label: "Gourmet Table", url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80" },
];

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateSettings, {
    error: null,
    success: false,
  });

  const [shopName, setShopName] = useState(initialSettings.shop_name);
  const [menuTitle, setMenuTitle] = useState(initialSettings.menu_title);
  const [metaTitle, setMetaTitle] = useState(initialSettings.meta_title);
  const [metaDescription, setMetaDescription] = useState(initialSettings.meta_description);
  const [currencySymbol, setCurrencySymbol] = useState(initialSettings.currency_symbol || "$");
  const [whatsappSessionId, setWhatsappSessionId] = useState(initialSettings.whatsapp_session_id || "");
  const [whatsappApiKey, setWhatsappApiKey] = useState(initialSettings.whatsapp_api_key || "");
  const [openingTime, setOpeningTime] = useState(initialSettings.opening_time || "11:00");
  const [closingTime, setClosingTime] = useState(initialSettings.closing_time || "01:00");

  // ─── Theme Color State ─────────────────────────────
  const [themeColor, setThemeColor] = useState(initialSettings.theme_color || "#ea580c");

  // ─── Mobile Slider State ───────────────────────────
  const [sliderEnabled, setSliderEnabled] = useState(initialSettings.slider_enabled !== false);
  const [sliderHeight, setSliderHeight] = useState(initialSettings.slider_height_mobile || 180);

  // ─── Hero Customization State ──────────────────────
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
    initialSettings.hero_btn_primary_text !== undefined ? initialSettings.hero_btn_primary_text : "Explore Menu"
  );
  const [heroBtnPrimaryLink, setHeroBtnPrimaryLink] = useState(
    initialSettings.hero_btn_primary_link || "#menu"
  );
  const [heroBtnSecondaryText, setHeroBtnSecondaryText] = useState(
    initialSettings.hero_btn_secondary_text !== undefined ? initialSettings.hero_btn_secondary_text : ""
  );
  const [heroBtnSecondaryLink, setHeroBtnSecondaryLink] = useState(
    initialSettings.hero_btn_secondary_link || "#specials"
  );
  const [heroChip1Text, setHeroChip1Text] = useState(
    initialSettings.hero_chip1_text !== undefined ? initialSettings.hero_chip1_text : "10-15 Min Stone Bake"
  );
  const [heroChip2Text, setHeroChip2Text] = useState(
    initialSettings.hero_chip2_text !== undefined ? initialSettings.hero_chip2_text : "100% Real Whole Cheese"
  );
  const [heroChip3Text, setHeroChip3Text] = useState(
    initialSettings.hero_chip3_text !== undefined ? initialSettings.hero_chip3_text : ""
  );
  const [heroShowChips, setHeroShowChips] = useState(
    initialSettings.hero_show_chips !== undefined ? initialSettings.hero_show_chips : true
  );
  const [heroBgType, setHeroBgType] = useState<"gradient" | "solid" | "image">(
    initialSettings.hero_bg_type || "gradient"
  );
  const [heroBgColor, setHeroBgColor] = useState(initialSettings.hero_bg_color || "#7f1d1d");
  const [heroBgGradient, setHeroBgGradient] = useState(initialSettings.hero_bg_gradient || "");
  const [heroBgImage, setHeroBgImage] = useState(initialSettings.hero_bg_image || "");
  const [heroShowPattern, setHeroShowPattern] = useState(
    initialSettings.hero_show_pattern !== undefined ? initialSettings.hero_show_pattern : true
  );

  const initialSlides: PromoSlide[] = useMemo(() => {
    if (Array.isArray(initialSettings.slider_images) && initialSettings.slider_images.length > 0) {
      return initialSettings.slider_images as PromoSlide[];
    }
    if (typeof initialSettings.slider_images === "string") {
      try {
        const parsed = JSON.parse(initialSettings.slider_images);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return DEFAULT_PROMO_SLIDES;
  }, [initialSettings.slider_images]);

  const [slides, setSlides] = useState<PromoSlide[]>(initialSlides);
  const [previewSlideIdx, setPreviewSlideIdx] = useState(0);

  // Add slide modal state
  const [showAddSlideModal, setShowAddSlideModal] = useState(false);
  const [newSlideTitle, setNewSlideTitle] = useState("Special Deal — 20% OFF");
  const [newSlideSubtitle, setNewSlideSubtitle] = useState("Fresh artisanal sourdough pizza combo");
  const [newSlideBadge, setNewSlideBadge] = useState("Hot Deal 🔥");
  const [newSlideImage, setNewSlideImage] = useState(
    PRESET_FOOD_IMAGES[0]?.url || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1000&auto=format&fit=crop&q=80"
  );
  const [newSlideLink, setNewSlideLink] = useState("#menu");

  const handleAddSlide = () => {
    if (!newSlideTitle.trim() || !newSlideImage.trim()) return;
    const newSlide: PromoSlide = {
      id: `slide-${Date.now()}`,
      title: newSlideTitle.trim(),
      subtitle: newSlideSubtitle.trim() || undefined,
      badge: newSlideBadge.trim() || undefined,
      image_url: newSlideImage.trim(),
      link_url: newSlideLink.trim() || "#menu",
      is_active: true,
    };
    setSlides((prev) => [...prev, newSlide]);
    setShowAddSlideModal(false);
    setNewSlideTitle("Special Deal — 20% OFF");
    setNewSlideSubtitle("Fresh artisanal sourdough pizza combo");
  };

  const handleDeleteSlide = (id: string) => {
    setSlides((prev) => prev.filter((s) => s.id !== id));
    if (previewSlideIdx >= slides.length - 1) {
      setPreviewSlideIdx(Math.max(0, slides.length - 2));
    }
  };

  const activeSlide = slides[previewSlideIdx] || slides[0] || DEFAULT_PROMO_SLIDES[0];

  let previewHeroBg = `linear-gradient(135deg, ${themeColor} 0%, #b91c1c 30%, #c2410c 70%, #d97706 100%)`;
  if (heroBgType === "image" && heroBgImage?.trim()) {
    previewHeroBg = `linear-gradient(rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.82)), url("${heroBgImage.trim()}") center/cover no-repeat`;
  } else if (heroBgType === "solid" && heroBgColor?.trim()) {
    previewHeroBg = heroBgColor.trim();
  } else if (heroBgGradient?.trim()) {
    previewHeroBg = heroBgGradient.trim();
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))", gap: "28px", alignItems: "start" }}>
      {/* ─── LEFT COLUMN: SETTINGS FORM ───────────────────────────── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <Store size={20} className="text-orange-500" />
          <h2 style={{ fontSize: "17px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
            Shop, Menu Colors &amp; Mobile Slider
          </h2>
        </div>
        <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>
          Customize store branding, menu theme color palette, deal banners &amp; mobile slider size.
        </p>

        {state.success && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "8px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#16a34a",
              fontSize: "13px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: 700,
            }}
          >
            <Check size={18} />
            <span>Settings saved successfully! Menu theme &amp; mobile slider are now live.</span>
          </div>
        )}

        {state.error && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "8px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: "13px",
              marginBottom: "18px",
              fontWeight: 600,
            }}
          >
            {state.error}
          </div>
        )}

        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Hidden inputs for custom controls */}
          <input type="hidden" name="theme_color" value={themeColor} />
          <input type="hidden" name="slider_enabled" value={sliderEnabled ? "true" : "false"} />
          <input type="hidden" name="slider_height_mobile" value={sliderHeight} />
          <input type="hidden" name="slider_images" value={JSON.stringify(slides)} />
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

          {/* ═══════════════════════════════════════════════════
              SECTION 1: MENU THEME COLOR CUSTOMIZER
          ═══════════════════════════════════════════════════ */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <PaletteIcon size={16} style={{ color: themeColor }} />
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>
                Menu Theme &amp; Accent Color
              </span>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: "11px", color: "#64748b" }}>
              Choose your restaurant&apos;s primary theme color. Tint will apply to menu buttons, banners, category pills and cart highlights.
            </p>

            {/* Color Presets */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
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
                      padding: "6px 10px",
                      borderRadius: "7px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      border: isSelected ? `2px solid ${p.color}` : "1px solid #cbd5e1",
                      background: isSelected ? p.bg : "#ffffff",
                      color: isSelected ? p.color : "#475569",
                      boxShadow: isSelected ? `0 2px 8px ${p.color}35` : "none",
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
                  </button>
                );
              })}
            </div>

            {/* Custom Color Input */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>
                Custom Hex:
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  style={{
                    width: "36px",
                    height: "36px",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    padding: 0,
                    background: "transparent",
                  }}
                  title="Pick a custom color"
                />
                <input
                  type="text"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  style={{
                    width: "100px",
                    padding: "7px 10px",
                    borderRadius: "6px",
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
                  fontSize: "11px",
                  fontWeight: 700,
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

          {/* ═══════════════════════════════════════════════════
              SECTION 2: MOBILE PROMO & DEAL SLIDER SETTINGS
          ═══════════════════════════════════════════════════ */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Smartphone size={16} className="text-indigo-500" />
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>
                  Mobile Menu Promo &amp; Deal Slider
                </span>
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

            <p style={{ margin: "0 0 14px", fontSize: "11px", color: "#64748b" }}>
              Controls the banner slider displayed to mobile customers. Adjust the height in pixels to fit your menu perfectly.
            </p>

            {sliderEnabled && (
              <>
                {/* Mobile Slider Height Selector */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 800, color: "#334155", textTransform: "uppercase" }}>
                      Mobile Slider Height: <span style={{ color: themeColor }}>{sliderHeight}px</span>
                    </label>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      Live Mobile Preview updates instantly 👉
                    </span>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", marginBottom: "10px" }}>
                    {SLIDER_SIZE_PRESETS.map((p) => {
                      const isSelected = sliderHeight === p.height;
                      return (
                        <button
                          key={p.height}
                          type="button"
                          onClick={() => setSliderHeight(p.height)}
                          style={{
                            padding: "8px 10px",
                            borderRadius: "7px",
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
                          <span style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginTop: "2px" }}>
                            {p.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Range Slider for Fine-tuning */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>120px</span>
                    <input
                      type="range"
                      min={120}
                      max={300}
                      step={10}
                      value={sliderHeight}
                      onChange={(e) => setSliderHeight(Number(e.target.value))}
                      style={{ flex: 1, accentColor: themeColor, cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "11px", color: "#64748b" }}>300px</span>
                  </div>
                </div>

                {/* Slides Manager List */}
                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#334155", textTransform: "uppercase" }}>
                      Active Slides ({slides.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddSlideModal(true)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        background: themeColor,
                        color: "#ffffff",
                        border: "none",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      <Plus size={12} />
                      <span>Add Promo Slide</span>
                    </button>
                  </div>

                  {/* Slides List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {slides.map((s, idx) => (
                      <div
                        key={s.id || idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                          <img
                            src={s.image_url}
                            alt={s.title}
                            style={{
                              width: "44px",
                              height: "32px",
                              borderRadius: "4px",
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {s.title}
                            </div>
                            <div style={{ fontSize: "10px", color: "#64748b" }}>
                              {s.badge || "Deal"} &bull; {s.subtitle || "No subtitle"}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteSlide(s.id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            padding: "4px",
                          }}
                          title="Delete slide"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════
              SECTION 3: HERO BANNER, TEXT & BACKGROUND CUSTOMIZER
          ═══════════════════════════════════════════════════ */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <Sparkles size={16} style={{ color: themeColor }} />
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>
                Menu Hero Banner, Text &amp; Background
              </span>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: "11px", color: "#64748b", lineHeight: 1.4 }}>
              Customize or remove any text from the top restaurant banner. <strong>Leave any field empty to hide that element completely</strong>.
            </p>

            {/* Sub-section A: Headline & Texts */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "14px",
                marginBottom: "14px",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", marginBottom: "12px" }}>
                1. Banner Headlines &amp; Description
              </div>

              {/* Badge Text */}
              <div style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>
                    Top Badge Text
                  </label>
                  {heroBadgeText && (
                    <button
                      type="button"
                      onClick={() => setHeroBadgeText("")}
                      style={{ fontSize: "10px", color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                    >
                      Clear / Remove
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={heroBadgeText}
                  onChange={(e) => setHeroBadgeText(e.target.value)}
                  placeholder="e.g. Artisan Kitchen • Stone Baked Daily (Leave empty to remove)"
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    boxSizing: "border-box",
                  }}
                />
                <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                  Shown at top in golden badge. If blank, badge will not render.
                </span>
              </div>

              {/* Main Title & Highlight Accent Title Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Hero Main Title
                  </label>
                  <input
                    type="text"
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    placeholder="e.g. Handcrafted Pizzas."
                    style={{
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Accent Highlight Title (Golden)
                  </label>
                  <input
                    type="text"
                    value={heroTitleHighlight}
                    onChange={(e) => setHeroTitleHighlight(e.target.value)}
                    placeholder="e.g. Fresh Every Order."
                    style={{
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      boxSizing: "border-box",
                      color: "#b45309",
                      fontWeight: 700,
                    }}
                  />
                </div>
              </div>

              {/* Subtitle */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>
                    Hero Subtitle / Description
                  </label>
                  {heroSubtitle && (
                    <button
                      type="button"
                      onClick={() => setHeroSubtitle("")}
                      style={{ fontSize: "10px", color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                    >
                      Clear / Remove
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  placeholder="e.g. Fresh stone-baked pizzas, burgers & drinks prepared to order."
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
                <span style={{ fontSize: "10px", color: "#16a34a", fontWeight: 600 }}>
                  ✓ Unused &quot;live tracking&quot; wording removed. Leave empty to hide description completely.
                </span>
              </div>
            </div>

            {/* Sub-section B: Action Buttons */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "14px",
                marginBottom: "14px",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", marginBottom: "12px" }}>
                2. Action Buttons
              </div>

              {/* Primary Button */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Primary Button Text
                  </label>
                  <input
                    type="text"
                    value={heroBtnPrimaryText}
                    onChange={(e) => setHeroBtnPrimaryText(e.target.value)}
                    placeholder="e.g. Explore Menu"
                    style={{
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Primary Button Link
                  </label>
                  <input
                    type="text"
                    value={heroBtnPrimaryLink}
                    onChange={(e) => setHeroBtnPrimaryLink(e.target.value)}
                    placeholder="#menu"
                    style={{
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Secondary Button ("Kitchen Standards") */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "4px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Secondary Button Text (Kitchen Standards)
                  </label>
                  <input
                    type="text"
                    value={heroBtnSecondaryText}
                    onChange={(e) => setHeroBtnSecondaryText(e.target.value)}
                    placeholder="(Removed by default — leave blank to keep hidden)"
                    style={{
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Secondary Button Link
                  </label>
                  <input
                    type="text"
                    value={heroBtnSecondaryLink}
                    onChange={(e) => setHeroBtnSecondaryLink(e.target.value)}
                    placeholder="#specials"
                    style={{
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
              <span style={{ fontSize: "10px", color: heroBtnSecondaryText ? "#ea580c" : "#16a34a", fontWeight: 600 }}>
                {heroBtnSecondaryText
                  ? `Active: Secondary button "${heroBtnSecondaryText}" will appear.`
                  : "✓ Kitchen Standards button is removed/hidden. Type text above if you want to re-enable it."}
              </span>
            </div>

            {/* Sub-section C: Feature Highlight Chips */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "14px",
                marginBottom: "14px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>
                  3. Feature Highlight Chips
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={heroShowChips}
                    onChange={(e) => setHeroShowChips(e.target.checked)}
                    style={{ cursor: "pointer" }}
                  />
                  <span>Show Chips</span>
                </label>
              </div>

              {heroShowChips && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div>
                    <label style={{ fontSize: "10px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "3px" }}>
                      Chip 1 (Clock Icon)
                    </label>
                    <input
                      type="text"
                      value={heroChip1Text}
                      onChange={(e) => setHeroChip1Text(e.target.value)}
                      placeholder="e.g. 10-15 Min Stone Bake (Leave blank to remove)"
                      style={{
                        width: "100%",
                        padding: "6px 10px",
                        borderRadius: "5px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "10px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "3px" }}>
                      Chip 2 (Shield Icon)
                    </label>
                    <input
                      type="text"
                      value={heroChip2Text}
                      onChange={(e) => setHeroChip2Text(e.target.value)}
                      placeholder="e.g. 100% Real Whole Cheese (Leave blank to remove)"
                      style={{
                        width: "100%",
                        padding: "6px 10px",
                        borderRadius: "5px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "10px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "3px" }}>
                      Chip 3 (Live Kitchen Tracking)
                    </label>
                    <input
                      type="text"
                      value={heroChip3Text}
                      onChange={(e) => setHeroChip3Text(e.target.value)}
                      placeholder="(Live Kitchen Tracking text removed — leave blank to keep hidden)"
                      style={{
                        width: "100%",
                        padding: "6px 10px",
                        borderRadius: "5px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        boxSizing: "border-box",
                      }}
                    />
                    <span style={{ fontSize: "10px", color: heroChip3Text ? "#ea580c" : "#16a34a", fontWeight: 600 }}>
                      {heroChip3Text
                        ? `Active: Chip "${heroChip3Text}" is showing.`
                        : "✓ \"Live Kitchen Tracking\" chip text is removed/hidden."}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Sub-section D: Hero Background Customizer */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "14px",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", marginBottom: "12px" }}>
                4. Hero Banner Background
              </div>

              {/* Background Type Switcher */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
                {[
                  { id: "gradient", label: "Gradient Presets" },
                  { id: "solid", label: "Solid Color" },
                  { id: "image", label: "Background Image" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setHeroBgType(t.id as any)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      border: heroBgType === t.id ? `2px solid ${themeColor}` : "1px solid #cbd5e1",
                      background: heroBgType === t.id ? `${themeColor}15` : "#ffffff",
                      color: heroBgType === t.id ? themeColor : "#475569",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Gradient Presets */}
              {heroBgType === "gradient" && (
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Select Gradient Preset:
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "6px", marginBottom: "10px" }}>
                    {HERO_GRADIENT_PRESETS.map((gp) => {
                      const isSel = (heroBgGradient === gp.gradient);
                      const bg = gp.gradient || `linear-gradient(135deg, ${themeColor} 0%, #b91c1c 30%, #c2410c 70%, #d97706 100%)`;
                      return (
                        <button
                          key={gp.label}
                          type="button"
                          onClick={() => setHeroBgGradient(gp.gradient)}
                          style={{
                            padding: "8px",
                            borderRadius: "6px",
                            border: isSel ? `2px solid #0f172a` : "1px solid #cbd5e1",
                            background: bg,
                            color: "#ffffff",
                            textAlign: "left",
                            cursor: "pointer",
                            boxShadow: isSel ? "0 2px 8px rgba(0,0,0,0.25)" : "none",
                          }}
                        >
                          <div style={{ fontSize: "11px", fontWeight: 800, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                            {gp.label}
                          </div>
                          <div style={{ fontSize: "9px", opacity: 0.85, textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
                            {gp.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Solid Color */}
              {heroBgType === "solid" && (
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Pick Custom Solid Background Color:
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="color"
                      value={heroBgColor || "#7f1d1d"}
                      onChange={(e) => setHeroBgColor(e.target.value)}
                      style={{ width: "36px", height: "36px", borderRadius: "6px", border: "1px solid #cbd5e1", cursor: "pointer", padding: "2px" }}
                    />
                    <input
                      type="text"
                      value={heroBgColor}
                      onChange={(e) => setHeroBgColor(e.target.value)}
                      placeholder="#7f1d1d"
                      style={{ width: "120px", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontFamily: "monospace" }}
                    />
                  </div>
                </div>
              )}

              {/* Background Image */}
              {heroBgType === "image" && (
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Pick Preset Food / Kitchen Photo:
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginBottom: "10px" }}>
                    {HERO_BG_IMAGE_PRESETS.map((img) => (
                      <button
                        key={img.label}
                        type="button"
                        onClick={() => setHeroBgImage(img.url)}
                        style={{
                          height: "54px",
                          borderRadius: "6px",
                          position: "relative",
                          overflow: "hidden",
                          border: heroBgImage === img.url ? `2px solid ${themeColor}` : "1px solid #cbd5e1",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        <img src={img.url} alt={img.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <span style={{ position: "absolute", bottom: 0, insetInline: 0, background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: "8px", fontWeight: 700, padding: "2px" }}>
                          {img.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Or Custom Background Image URL:
                  </label>
                  <input
                    type="url"
                    value={heroBgImage}
                    onChange={(e) => setHeroBgImage(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
              )}

              {/* Grid Pattern Toggle */}
              <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, color: "#475569", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={heroShowPattern}
                    onChange={(e) => setHeroShowPattern(e.target.checked)}
                    style={{ cursor: "pointer" }}
                  />
                  <span>Show subtle modern square grid overlay pattern</span>
                </label>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════
              SECTION 4: SHOP NAME & BRANDING
          ═══════════════════════════════════════════════════ */}
          <div>
            <label htmlFor="shop_name" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
              Shop Name (Logo &amp; Brand) <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              id="shop_name"
              name="shop_name"
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. Luigi's Woodfired Pizza"
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Currency Selection */}
          <div>
            <label htmlFor="currency_symbol" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
              Currency Symbol / Prefix <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
              {CURRENCY_PRESETS.map((p) => {
                const isSelected = currencySymbol.trim() === p.symbol.trim();
                return (
                  <button
                    key={p.symbol}
                    type="button"
                    onClick={() => setCurrencySymbol(p.symbol)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: "5px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: isSelected ? `1px solid ${themeColor}` : "1px solid #e2e8f0",
                      background: isSelected ? `${themeColor}15` : "#f8fafc",
                      color: isSelected ? themeColor : "#475569",
                    }}
                  >
                    {p.symbol.trim()} ({p.label.split(" ")[0]})
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontSize: "14px",
                  fontWeight: 800,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Price display preview: <strong style={{ color: themeColor }}>{currencySymbol}14.99</strong>
              </span>
            </div>
          </div>

          {/* Menu Title */}
          <div>
            <label htmlFor="menu_title" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
              Menu Section Heading
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
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Operating Hours */}
          <div style={{ padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <Clock size={16} className="text-amber-500" />
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>
                Operating Hours &amp; Shift Reporting
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "3px" }}>
                  Opening Time
                </label>
                <input
                  type="time"
                  name="opening_time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "3px" }}>
                  Closing Time
                </label>
                <input
                  type="time"
                  name="closing_time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: 700 }}
                />
              </div>
            </div>
          </div>

          {/* SEO Metadata */}
          <div>
            <label htmlFor="meta_title" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
              SEO Browser Title
            </label>
            <input
              id="meta_title"
              name="meta_title"
              type="text"
              required
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="e.g. Luigi's Pizza | Fresh Woodfired Pizzas"
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label htmlFor="meta_description" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
              SEO Meta Description
            </label>
            <textarea
              id="meta_description"
              name="meta_description"
              rows={2}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            style={{
              padding: "12px 20px",
              borderRadius: "8px",
              background: themeColor,
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 800,
              border: "none",
              cursor: isPending ? "not-allowed" : "pointer",
              opacity: isPending ? 0.7 : 1,
              boxShadow: `0 4px 14px ${themeColor}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <Check size={16} />
            <span>{isPending ? "Saving..." : "Save Settings & Update Live Menu"}</span>
          </button>
        </form>
      </div>

      {/* ─── RIGHT COLUMN: LIVE MOBILE PHONE REVIEW CARD ─────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", position: "sticky", top: "20px" }}>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Smartphone size={16} style={{ color: themeColor }} />
              <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#0f172a" }}>
                Live Mobile Customer View
              </span>
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "12px",
                background: `${themeColor}15`,
                color: themeColor,
              }}
            >
              Height: {sliderHeight}px
            </span>
          </div>

          <p style={{ margin: "0 0 16px", fontSize: "11px", color: "#64748b" }}>
            Exact real-time simulation of customer mobile phone scan with your selected theme color and slider height.
          </p>

          {/* ─── Realistic Mobile Phone Mockup ─── */}
          <div
            style={{
              width: "100%",
              maxWidth: "340px",
              margin: "0 auto",
              background: "#0f172a",
              borderRadius: "36px",
              padding: "10px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 2px #334155",
            }}
          >
            {/* Phone Screen Area */}
            <div
              style={{
                background: "#f8fafc",
                borderRadius: "28px",
                overflow: "hidden",
                border: "1px solid #1e293b",
                position: "relative",
              }}
            >
              {/* Mobile Top Status Bar & Notch */}
              <div
                style={{
                  background: "#0f172a",
                  color: "#ffffff",
                  padding: "6px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "10px",
                  fontWeight: 700,
                }}
              >
                <span>9:41</span>
                {/* Dynamic island / notch */}
                <div
                  style={{
                    width: "60px",
                    height: "12px",
                    background: "#000000",
                    borderRadius: "8px",
                  }}
                />
                <span>5G 100%</span>
              </div>

              {/* Mobile Menu Navbar */}
              <div
                style={{
                  background: "#ffffff",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "6px",
                      background: themeColor,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: 800,
                    }}
                  >
                    🍕
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>
                    {shopName || "Pizza Shop"}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    background: `${themeColor}15`,
                    color: themeColor,
                    padding: "3px 8px",
                    borderRadius: "5px",
                  }}
                >
                  Cart ({currencySymbol}0)
                </div>
              </div>

              {/* Live Mini Hero Preview in Mobile Phone Mockup */}
              <div
                style={{
                  position: "relative",
                  overflow: "hidden",
                  background: previewHeroBg,
                  color: "#ffffff",
                  padding: "12px 10px 10px",
                  borderBottom: `2px solid ${themeColor}`,
                  transition: "background 0.25s ease",
                }}
              >
                {/* Pattern overlay */}
                {heroShowPattern && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage:
                        "linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                      pointerEvents: "none",
                    }}
                  />
                )}

                <div style={{ position: "relative", zIndex: 1 }}>
                  {/* Badge */}
                  {heroBadgeText.trim() && (
                    <div
                      style={{
                        display: "inline-block",
                        background: "rgba(254, 240, 138, 0.2)",
                        border: "1px solid rgba(254, 240, 138, 0.4)",
                        borderRadius: "3px",
                        padding: "1px 5px",
                        marginBottom: "4px",
                        fontSize: "8px",
                        fontWeight: 800,
                        color: "#fef08a",
                        textTransform: "uppercase",
                      }}
                    >
                      {heroBadgeText.trim()}
                    </div>
                  )}

                  {/* Title */}
                  {(heroTitle.trim() || heroTitleHighlight.trim()) && (
                    <div style={{ fontSize: "13px", fontWeight: 900, lineHeight: 1.2, marginBottom: "3px" }}>
                      {heroTitle.trim() && <span>{heroTitle.trim()} </span>}
                      {heroTitleHighlight.trim() && (
                        <span style={{ color: "#fde047" }}>{heroTitleHighlight.trim()}</span>
                      )}
                    </div>
                  )}

                  {/* Subtitle */}
                  {heroSubtitle.trim() && (
                    <div style={{ fontSize: "9px", color: "#fef2f2", lineHeight: 1.3, marginBottom: "8px", opacity: 0.9 }}>
                      {heroSubtitle.trim()}
                    </div>
                  )}

                  {/* Buttons */}
                  {(heroBtnPrimaryText.trim() || heroBtnSecondaryText.trim()) && (
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "8px", flexWrap: "wrap" }}>
                      {heroBtnPrimaryText.trim() && (
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "3px",
                            background: "#fbbf24",
                            color: "#7c2d12",
                            fontSize: "9px",
                            fontWeight: 800,
                          }}
                        >
                          {heroBtnPrimaryText.trim()} ↓
                        </span>
                      )}
                      {heroBtnSecondaryText.trim() && (
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "3px",
                            background: "rgba(255, 255, 255, 0.15)",
                            color: "#ffffff",
                            border: "1px solid rgba(255, 255, 255, 0.4)",
                            fontSize: "9px",
                            fontWeight: 700,
                          }}
                        >
                          {heroBtnSecondaryText.trim()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Highlight Chips */}
                  {heroShowChips && (heroChip1Text.trim() || heroChip2Text.trim() || heroChip3Text.trim()) && (
                    <div style={{ display: "flex", gap: "4px", overflowX: "hidden", paddingTop: "5px", borderTop: "1px solid rgba(255, 255, 255, 0.2)" }}>
                      {heroChip1Text.trim() && (
                        <span style={{ fontSize: "8px", fontWeight: 700, background: "rgba(0,0,0,0.25)", padding: "2px 5px", borderRadius: "3px" }}>
                          ⏱ {heroChip1Text.trim()}
                        </span>
                      )}
                      {heroChip2Text.trim() && (
                        <span style={{ fontSize: "8px", fontWeight: 700, background: "rgba(0,0,0,0.25)", padding: "2px 5px", borderRadius: "3px" }}>
                          🛡 {heroChip2Text.trim()}
                        </span>
                      )}
                      {heroChip3Text.trim() && (
                        <span style={{ fontSize: "8px", fontWeight: 700, background: "rgba(0,0,0,0.25)", padding: "2px 5px", borderRadius: "3px" }}>
                          🚚 {heroChip3Text.trim()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Live Slider Preview */}
              {sliderEnabled && activeSlide ? (
                <div style={{ position: "relative", padding: "10px 10px 6px" }}>
                  <div
                    style={{
                      height: `${sliderHeight}px`,
                      borderRadius: "12px",
                      position: "relative",
                      overflow: "hidden",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                      transition: "height 0.25s ease",
                    }}
                  >
                    <img
                      src={activeSlide.image_url}
                      alt={activeSlide.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    {/* Gradient Overlay */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(90deg, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.3) 100%)",
                      }}
                    />
                    {/* Slide Content */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        padding: "10px 12px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        color: "#ffffff",
                      }}
                    >
                      {activeSlide.badge && (
                        <span
                          style={{
                            display: "inline-block",
                            alignSelf: "flex-start",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: themeColor,
                            color: "#ffffff",
                            fontSize: "9px",
                            fontWeight: 800,
                            marginBottom: "4px",
                          }}
                        >
                          {activeSlide.badge}
                        </span>
                      )}
                      <div
                        style={{
                          fontSize: sliderHeight > 160 ? "13px" : "11px",
                          fontWeight: 900,
                          lineHeight: 1.2,
                          marginBottom: "2px",
                          textShadow: "0 1px 4px rgba(0,0,0,0.7)",
                        }}
                      >
                        {activeSlide.title}
                      </div>
                      {sliderHeight > 160 && activeSlide.subtitle && (
                        <div style={{ fontSize: "9px", color: "#e2e8f0", lineHeight: 1.2 }}>
                          {activeSlide.subtitle}
                        </div>
                      )}
                    </div>

                    {/* Mini Slider Controls */}
                    {slides.length > 1 && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "6px",
                          right: "8px",
                          display: "flex",
                          gap: "3px",
                        }}
                      >
                        {slides.map((_, dotIdx) => (
                          <button
                            key={dotIdx}
                            type="button"
                            onClick={() => setPreviewSlideIdx(dotIdx)}
                            style={{
                              width: dotIdx === previewSlideIdx ? "12px" : "4px",
                              height: "4px",
                              borderRadius: "2px",
                              background: dotIdx === previewSlideIdx ? themeColor : "rgba(255, 255, 255, 0.5)",
                              border: "none",
                              padding: 0,
                              cursor: "pointer",
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "11px" }}>
                  [Slider Disabled]
                </div>
              )}

              {/* Simulated Category Pills in Mobile View */}
              <div style={{ padding: "6px 10px 4px", display: "flex", gap: "6px", overflowX: "hidden" }}>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: "14px",
                    background: themeColor,
                    color: "#ffffff",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                >
                  All Items
                </span>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: "14px",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#475569",
                    fontSize: "10px",
                    fontWeight: 600,
                  }}
                >
                  Pizzas
                </span>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: "14px",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#475569",
                    fontSize: "10px",
                    fontWeight: 600,
                  }}
                >
                  Burgers
                </span>
              </div>

              {/* Simulated 2-Column Product Grid in Mobile View */}
              <div style={{ padding: "6px 10px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div style={{ background: "#ffffff", borderRadius: "8px", padding: "6px", border: "1px solid #e2e8f0" }}>
                  <div style={{ height: "55px", borderRadius: "5px", background: "#fef3c7", marginBottom: "4px", overflow: "hidden" }}>
                    <img
                      src={PRESET_FOOD_IMAGES[0]?.url}
                      alt="Sample"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ fontSize: "10px", fontWeight: 800, color: "#0f172a" }}>Margherita Classica</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 800, color: themeColor }}>{currencySymbol}12.99</span>
                    <span style={{ padding: "2px 6px", borderRadius: "4px", background: themeColor, color: "#fff", fontSize: "9px", fontWeight: 800 }}>+ Add</span>
                  </div>
                </div>

                <div style={{ background: "#ffffff", borderRadius: "8px", padding: "6px", border: "1px solid #e2e8f0" }}>
                  <div style={{ height: "55px", borderRadius: "5px", background: "#fef3c7", marginBottom: "4px", overflow: "hidden" }}>
                    <img
                      src={PRESET_FOOD_IMAGES[1]?.url}
                      alt="Sample"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ fontSize: "10px", fontWeight: 800, color: "#0f172a" }}>Pepperoni Passion</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 800, color: themeColor }}>{currencySymbol}14.99</span>
                    <span style={{ padding: "2px 6px", borderRadius: "4px", background: themeColor, color: "#fff", fontSize: "9px", fontWeight: 800 }}>+ Add</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Browser Tab Preview */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "16px",
          }}
        >
          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", fontWeight: 700, marginBottom: "8px" }}>
            Google Search &amp; Browser Tab
          </div>
          <div style={{ background: "#f8fafc", borderRadius: "6px", padding: "10px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1d4ed8", marginBottom: "2px" }}>
              {metaTitle || "Pizza Shop"}
            </div>
            <div style={{ fontSize: "11px", color: "#16a34a", marginBottom: "2px" }}>
              https://yourshop.com
            </div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>
              {metaDescription || "Fresh pizzas made to order."}
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODAL: ADD PROMO SLIDE ────────────────────────────────────── */}
      {showAddSlideModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(10, 15, 29, 0.72)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "460px",
              background: "#ffffff",
              borderRadius: "12px",
              padding: "22px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={16} style={{ color: themeColor }} />
                <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                  Add New Mobile Promo Slide
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSlideModal(false)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "6px", padding: "4px", cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                  Slide Headline / Title *
                </label>
                <input
                  type="text"
                  value={newSlideTitle}
                  onChange={(e) => setNewSlideTitle(e.target.value)}
                  placeholder="e.g. 50% OFF Family Pizza Feast"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                  Subtitle / Promo Details
                </label>
                <input
                  type="text"
                  value={newSlideSubtitle}
                  onChange={(e) => setNewSlideSubtitle(e.target.value)}
                  placeholder="e.g. Valid today on all large sourdough pizzas"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Badge Tag
                  </label>
                  <input
                    type="text"
                    value={newSlideBadge}
                    onChange={(e) => setNewSlideBadge(e.target.value)}
                    placeholder="e.g. 1+1 FREE"
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Link Action
                  </label>
                  <input
                    type="text"
                    value={newSlideLink}
                    onChange={(e) => setNewSlideLink(e.target.value)}
                    placeholder="#menu"
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                  Image URL *
                </label>
                <input
                  type="text"
                  value={newSlideImage}
                  onChange={(e) => setNewSlideImage(e.target.value)}
                  placeholder="https://..."
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontFamily: "monospace", boxSizing: "border-box", marginBottom: "6px" }}
                />

                {/* Quick Presets */}
                <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "4px" }}>Quick Preset Images:</div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {PRESET_FOOD_IMAGES.slice(0, 5).map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewSlideImage(img.url)}
                      style={{
                        padding: "3px 6px",
                        borderRadius: "4px",
                        background: newSlideImage === img.url ? `${themeColor}20` : "#f1f5f9",
                        border: newSlideImage === img.url ? `1px solid ${themeColor}` : "1px solid #e2e8f0",
                        fontSize: "10px",
                        cursor: "pointer",
                      }}
                    >
                      {img.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddSlideModal(false)}
                  style={{ padding: "8px 14px", borderRadius: "6px", background: "#f1f5f9", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddSlide}
                  style={{ padding: "8px 18px", borderRadius: "6px", background: themeColor, color: "#ffffff", border: "none", fontSize: "12px", fontWeight: 800, cursor: "pointer" }}
                >
                  Add Slide
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
