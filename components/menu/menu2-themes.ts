export type Menu2ThemeId = "ruby_gold" | "midnight_gold" | "saffron_spice" | "royal_berry" | "emerald_honey";

export interface Menu2ThemePalette {
  id: Menu2ThemeId;
  label: string;
  tagline?: string;
  swatch: string;
  isDark?: boolean;
  pageBg: string;
  stickyBarBg: string;
  headerBg: string;
  headerBorder: string;
  primaryBtn: string;
  primaryBadge: string;
  accentText: string;
  priceText: string;
  cardBg: string;
  cardBorder: string;
  cardHoverBorder: string;
  cardFooterBg: string;
  cardTitleText: string;
  cardDescText: string;
  sectionBannerBg: string;
  catActiveBg: string;
  catInactiveBg: string;
  sizeBoxBg: string;
  sizeActiveBg: string;
  modalBg: string;
  modalBodyBg: string;
}

export const MENU2_THEMES: Record<Menu2ThemeId, Menu2ThemePalette> = {
  ruby_gold: {
    id: "ruby_gold",
    label: "Ruby & Gold",
    swatch: "#e11d48",
    pageBg: "bg-[#fff8f3] text-[#1c100b]",
    stickyBarBg: "bg-[#fff8f3]/95 border-[#fed7aa]",
    headerBg: "bg-gradient-to-r from-[#2a070b] via-[#4c0d14] to-[#2a070b]",
    headerBorder: "border-[#7f1d1d]",
    primaryBtn: "bg-gradient-to-r from-[#be123c] to-[#e11d48] hover:from-[#9f1239] hover:to-[#be123c] text-white",
    primaryBadge: "bg-[#fbbf24] text-[#2a070b]",
    accentText: "text-[#fbbf24]",
    priceText: "text-[#be123c]",
    cardBg: "bg-white",
    cardBorder: "border-[#fed7aa]/90",
    cardHoverBorder: "hover:border-[#e11d48]",
    cardFooterBg: "bg-gradient-to-r from-[#fff1f2] to-[#fffbeb] border-[#fecdd3]/60",
    cardTitleText: "text-[#1c100b] group-hover:text-[#be123c]",
    cardDescText: "text-[#785c51]",
    sectionBannerBg: "bg-gradient-to-r from-[#3b070e] via-[#6b111c] to-[#3b070e] text-white",
    catActiveBg: "bg-gradient-to-r from-[#be123c] to-[#e11d48] text-white border-[#be123c] shadow-md shadow-rose-600/20",
    catInactiveBg: "bg-white text-[#3b070e] border-[#fed7aa] hover:border-[#e11d48] hover:bg-[#fff1f2]",
    sizeBoxBg: "bg-[#fff8f3] border-[#fed7aa]/80",
    sizeActiveBg: "bg-[#be123c] text-white",
    modalBg: "bg-white",
    modalBodyBg: "bg-[#fff8f3]",
  },
  midnight_gold: {
    id: "midnight_gold",
    label: "Midnight Gold",
    swatch: "#f59e0b",
    isDark: true,
    pageBg: "bg-[#0b0f19] text-[#f8fafc]",
    stickyBarBg: "bg-[#0b0f19]/95 border-[#1e293b]",
    headerBg: "bg-gradient-to-r from-[#060911] via-[#111827] to-[#060911]",
    headerBorder: "border-[#f59e0b]/30",
    primaryBtn: "bg-gradient-to-r from-[#f59e0b] to-[#ea580c] hover:from-[#fbbf24] hover:to-[#f97316] text-[#090d16]",
    primaryBadge: "bg-[#f59e0b] text-[#090d16]",
    accentText: "text-[#fbbf24]",
    priceText: "text-[#fbbf24]",
    cardBg: "bg-[#131b2e]",
    cardBorder: "border-[#1e293b]",
    cardHoverBorder: "hover:border-[#f59e0b]",
    cardFooterBg: "bg-[#0f1626] border-[#1e293b]",
    cardTitleText: "text-white group-hover:text-[#fbbf24]",
    cardDescText: "text-slate-400",
    sectionBannerBg: "bg-gradient-to-r from-[#131b2e] via-[#1e293b] to-[#131b2e] text-white border border-[#f59e0b]/30",
    catActiveBg: "bg-gradient-to-r from-[#f59e0b] to-[#ea580c] text-[#090d16] border-[#f59e0b] shadow-md shadow-amber-500/20",
    catInactiveBg: "bg-[#131b2e] text-slate-200 border-[#1e293b] hover:border-[#f59e0b]",
    sizeBoxBg: "bg-[#0b0f19] border-[#1e293b]",
    sizeActiveBg: "bg-[#f59e0b] text-[#090d16]",
    modalBg: "bg-[#131b2e] text-white",
    modalBodyBg: "bg-[#0b0f19]",
  },
  saffron_spice: {
    id: "saffron_spice",
    label: "Saffron Spice",
    swatch: "#ea580c",
    pageBg: "bg-[#fffbeb] text-[#271206]",
    stickyBarBg: "bg-[#fffbeb]/95 border-[#fde68a]",
    headerBg: "bg-gradient-to-r from-[#431407] via-[#7c2d12] to-[#431407]",
    headerBorder: "border-[#9a3412]",
    primaryBtn: "bg-gradient-to-r from-[#ea580c] to-[#d97706] hover:from-[#c2410c] hover:to-[#b45309] text-white",
    primaryBadge: "bg-[#fef08a] text-[#431407]",
    accentText: "text-[#fde047]",
    priceText: "text-[#c2410c]",
    cardBg: "bg-white",
    cardBorder: "border-[#fde68a]",
    cardHoverBorder: "hover:border-[#ea580c]",
    cardFooterBg: "bg-gradient-to-r from-[#fff7ed] to-[#fefce8] border-[#fed7aa]",
    cardTitleText: "text-[#271206] group-hover:text-[#ea580c]",
    cardDescText: "text-[#785c48]",
    sectionBannerBg: "bg-gradient-to-r from-[#431407] via-[#9a3412] to-[#431407] text-white",
    catActiveBg: "bg-gradient-to-r from-[#ea580c] to-[#d97706] text-white border-[#ea580c] shadow-md shadow-orange-500/20",
    catInactiveBg: "bg-white text-[#431407] border-[#fde68a] hover:border-[#ea580c]",
    sizeBoxBg: "bg-[#fffbeb] border-[#fde68a]",
    sizeActiveBg: "bg-[#ea580c] text-white",
    modalBg: "bg-white",
    modalBodyBg: "bg-[#fffbeb]",
  },
  royal_berry: {
    id: "royal_berry",
    label: "Royal Plum",
    swatch: "#9333ea",
    pageBg: "bg-[#faf5ff] text-[#1e1033]",
    stickyBarBg: "bg-[#faf5ff]/95 border-[#e9d5ff]",
    headerBg: "bg-gradient-to-r from-[#2e1065] via-[#581c87] to-[#2e1065]",
    headerBorder: "border-[#6b21a8]",
    primaryBtn: "bg-gradient-to-r from-[#7e22ce] to-[#db2777] hover:from-[#6b21a8] hover:to-[#be185d] text-white",
    primaryBadge: "bg-[#facc15] text-[#2e1065]",
    accentText: "text-[#facc15]",
    priceText: "text-[#7e22ce]",
    cardBg: "bg-white",
    cardBorder: "border-[#e9d5ff]",
    cardHoverBorder: "hover:border-[#9333ea]",
    cardFooterBg: "bg-gradient-to-r from-[#f3e8ff]/60 to-[#fce7f3]/60 border-[#e9d5ff]",
    cardTitleText: "text-[#1e1033] group-hover:text-[#7e22ce]",
    cardDescText: "text-[#64537a]",
    sectionBannerBg: "bg-gradient-to-r from-[#2e1065] via-[#6b21a8] to-[#2e1065] text-white",
    catActiveBg: "bg-gradient-to-r from-[#7e22ce] to-[#db2777] text-white border-[#7e22ce] shadow-md shadow-purple-600/20",
    catInactiveBg: "bg-white text-[#2e1065] border-[#e9d5ff] hover:border-[#9333ea]",
    sizeBoxBg: "bg-[#faf5ff] border-[#e9d5ff]",
    sizeActiveBg: "bg-[#7e22ce] text-white",
    modalBg: "bg-white",
    modalBodyBg: "bg-[#faf5ff]",
  },
  emerald_honey: {
    id: "emerald_honey",
    label: "Emerald Honey",
    swatch: "#059669",
    pageBg: "bg-[#f0fdf4] text-[#052e16]",
    stickyBarBg: "bg-[#f0fdf4]/95 border-[#bbf7d0]",
    headerBg: "bg-gradient-to-r from-[#052e16] via-[#064e3b] to-[#052e16]",
    headerBorder: "border-[#047857]",
    primaryBtn: "bg-gradient-to-r from-[#059669] to-[#0d9488] hover:from-[#047857] hover:to-[#0f766e] text-white",
    primaryBadge: "bg-[#fbbf24] text-[#052e16]",
    accentText: "text-[#fbbf24]",
    priceText: "text-[#059669]",
    cardBg: "bg-white",
    cardBorder: "border-[#bbf7d0]",
    cardHoverBorder: "hover:border-[#059669]",
    cardFooterBg: "bg-gradient-to-r from-[#dcfce7]/60 to-[#fef9c3]/60 border-[#bbf7d0]",
    cardTitleText: "text-[#052e16] group-hover:text-[#059669]",
    cardDescText: "text-[#3f6250]",
    sectionBannerBg: "bg-gradient-to-r from-[#052e16] via-[#065f46] to-[#052e16] text-white",
    catActiveBg: "bg-gradient-to-r from-[#059669] to-[#0d9488] text-white border-[#059669] shadow-md shadow-emerald-600/20",
    catInactiveBg: "bg-white text-[#052e16] border-[#bbf7d0] hover:border-[#059669]",
    sizeBoxBg: "bg-[#f0fdf4] border-[#bbf7d0]",
    sizeActiveBg: "bg-[#059669] text-white",
    modalBg: "bg-white",
    modalBodyBg: "bg-[#f0fdf4]",
  },
};

