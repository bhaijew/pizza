"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { Category, Product, ProductVariation } from "@/types/menu";
import type { ShopSettings } from "@/lib/menu-data";
import { createClient } from "@/utils/supabase/client";
import { CartProvider, useCart } from "./CartContext";
import Menu2ProductModal from "./Menu2ProductModal";
import Menu2CartDrawer from "./Menu2CartDrawer";
import { MENU2_THEMES, type Menu2ThemeId } from "./menu2-themes";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { getDealItems } from "@/lib/deal-helper";
import {
  Search,
  X,
  ShoppingBag,
  Flame,
  Sparkles,
  Plus,
  Clock,
  Bike,
  ChevronRight,
  Check,
} from "lucide-react";

interface Menu2ClientProps {
  categories: Category[];
  products: Product[];
  settings: ShopSettings;
  availableShops?: { id: number; name: string; slug: string }[];
  activeShopSlug?: string;
  initialTableNumber?: string;
  initialOrderType?: "dine_in" | "takeaway" | "delivery";
}

function getCategoryEmoji(name: string): string {
  const n = (name || "").toLowerCase();
  if (n.includes("deal") || n.includes("combo") || n.includes("family")) return "🔥";
  if (n.includes("pizza")) return "🍕";
  if (n.includes("burger") || n.includes("zinger")) return "🍔";
  if (n.includes("fries") || n.includes("side") || n.includes("nugget") || n.includes("wing")) return "🍟";
  if (n.includes("shawarma") || n.includes("roll") || n.includes("wrap")) return "🌯";
  if (n.includes("paratha")) return "🫓";
  if (n.includes("pasta") || n.includes("lasagna")) return "🍝";
  if (n.includes("drink") || n.includes("beverage") || n.includes("shake") || n.includes("water")) return "🥤";
  if (n.includes("dip") || n.includes("sauce") || n.includes("extra")) return "🥫";
  if (n.includes("dessert") || n.includes("sweet") || n.includes("cake")) return "🍰";
  return "🍽️";
}

const DEFAULT_PROMO_SLIDES = [
  {
    badge: "SIGNATURE STONE-BAKED",
    title: "Loaded Cheese & Crispy Crust",
    highlight: "Fresh Out Of The Oven",
    subtitle: "Hand-stretched dough, rich herb tomato sauce, and 100% pure mozzarella cheese.",
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1400&auto=format&fit=crop&q=80",
  },
  {
    badge: "CRUNCHY GOURMET BURGERS",
    title: "Golden Zinger & Smash Burgers",
    highlight: "Served Hot & Crispy",
    subtitle: "Double-breaded crispy chicken fillets topped with signature smoky house sauce.",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1400&auto=format&fit=crop&q=80",
  },
  {
    badge: "FAMILY FEAST COMBOS",
    title: "Save Big On Group Platters",
    highlight: "Fast Doorstep Delivery",
    subtitle: "Complete family deals with large pizzas, crispy wings, fries, and chilled drinks.",
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1400&auto=format&fit=crop&q=80",
  },
];

function Menu2Inner({
  categories,
  products,
  settings,
  initialTableNumber = "",
  initialOrderType,
}: Menu2ClientProps) {
  const {
    items: cartItems,
    totalItems,
    totalPrice,
    formatPrice,
    addItem,
    setQty,
    getItemKey,
    getUnitPrice,
  } = useCart();

  const initialTheme = ((settings as any)?.menu2_theme as Menu2ThemeId) || "ruby_gold";
  const [themeId, setThemeId] = useState<Menu2ThemeId>(
    MENU2_THEMES[initialTheme] ? initialTheme : "ruby_gold"
  );
  const theme = MENU2_THEMES[themeId] || MENU2_THEMES.ruby_gold;

  useEffect(() => {
    const incoming = (settings as any)?.menu2_theme as Menu2ThemeId | undefined;
    if (incoming && MENU2_THEMES[incoming]) {
      setThemeId(incoming);
    }
  }, [(settings as any)?.menu2_theme]);

  const [liveCategories, setLiveCategories] = useState<Category[]>(categories);
  const [liveProducts, setLiveProducts] = useState<Product[]>(products);

  useEffect(() => {
    setLiveCategories(categories);
  }, [categories]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | number | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const [selectedVarByProduct, setSelectedVarByProduct] = useState<Record<string, number>>({});

  const [orderType, setOrderType] = useState<"dine_in" | "takeaway" | "delivery">(
    initialOrderType || (initialTableNumber ? "dine_in" : "delivery")
  );
  const [tableNumber, setTableNumber] = useState<string>(initialTableNumber);

  const searchParams = useSearchParams();

  useEffect(() => {
    const urlTable = searchParams?.get("table");
    const urlType = searchParams?.get("type") as "dine_in" | "takeaway" | "delivery" | null;
    if (urlTable && !tableNumber) {
      setTableNumber(urlTable);
      setOrderType("dine_in");
    } else if (urlType && !initialOrderType) {
      setOrderType(urlType);
    }
  }, [searchParams, tableNumber, initialOrderType]);

  useEffect(() => {
    setLiveProducts(products);
  }, [products]);

  const slides = useMemo(() => {
    const rawList = Array.isArray(settings.slider_images) ? settings.slider_images : [];
    const customImgs = rawList
      .filter((item: any) => item && item.is_active !== false)
      .map((item: any) =>
        typeof item === "string"
          ? { image: item.trim(), title: "", subtitle: "", badge: "" }
          : {
              image: String(item?.image_url || item?.url || "").trim(),
              title: item?.title || "",
              subtitle: item?.subtitle || "",
              badge: item?.badge || "",
            }
      )
      .filter((s) => Boolean(s.image));
    if (customImgs.length === 0) return DEFAULT_PROMO_SLIDES;
    return customImgs.map((custom, idx: number) => {
      const def = DEFAULT_PROMO_SLIDES[idx % DEFAULT_PROMO_SLIDES.length];
      return {
        ...def,
        image: custom.image,
        title: custom.title || def.title,
        subtitle: custom.subtitle || def.subtitle,
        badge: custom.badge || def.badge,
      };
    });
  }, [settings.slider_images]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    const supabase = createClient();
    const shopId = settings?.shop_id;
    const targetShopId = shopId != null ? Number(shopId) : null;
    const channel = supabase
      .channel(`menu2-realtime-${targetShopId ?? "all"}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as any;
            setLiveProducts((prev) =>
              prev.map((item) =>
                Number(item.id) === Number(updated.id)
                  ? {
                      ...item,
                      ...updated,
                      price: updated.price != null ? Number(updated.price) : item.price,
                      category: item.category || updated.category,
                    }
                  : item
              )
            );
          } else if (payload.eventType === "INSERT") {
            const inserted = payload.new as any;
            const prodShopId = inserted.shop_id != null ? Number(inserted.shop_id) : null;
            if (targetShopId === null || prodShopId === targetShopId) {
              setLiveProducts((prev) => [...prev, inserted]);
            }
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as { id?: number };
            if (deleted?.id) {
              setLiveProducts((prev) => prev.filter((p) => Number(p.id) !== Number(deleted.id)));
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updatedCat = payload.new as Category;
            setLiveCategories((prev) =>
              prev
                .map((c) => (Number(c.id) === Number(updatedCat.id) ? { ...c, ...updatedCat } : c))
                .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [settings?.shop_id]);

  const visibleCategories = useMemo(() => {
    return [...liveCategories]
      .filter((cat) => cat.is_active !== false)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .filter((cat) =>
        liveProducts.some((p) => String(p.category_id) === String(cat.id) && p.is_available !== false)
      );
  }, [liveCategories, liveProducts]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return liveProducts.filter((p) => {
      if (p.is_available === false || p.is_active === false) return false;
      if (activeCategoryId !== null && String(p.category_id) !== String(activeCategoryId)) {
        return false;
      }
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category?.name && p.category.name.toLowerCase().includes(q))
      );
    });
  }, [liveProducts, activeCategoryId, searchQuery]);

  const groupedSections = useMemo(() => {
    if (activeCategoryId !== null || searchQuery.trim()) {
      const activeCat = categories.find((c) => String(c.id) === String(activeCategoryId));
      return [
        {
          id: activeCategoryId ?? "search",
          name: searchQuery.trim()
            ? `Search Results (${filteredProducts.length})`
            : activeCat?.name || "Menu Items",
          items: filteredProducts,
        },
      ];
    }

    const sections = visibleCategories
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        items: filteredProducts.filter((p) => String(p.category_id) === String(cat.id)),
      }))
      .filter((sec) => sec.items.length > 0);

    const categorizedIds = new Set(sections.flatMap((s) => s.items.map((i) => i.id)));
    const uncategorized = filteredProducts.filter((p) => !categorizedIds.has(p.id));
    if (uncategorized.length > 0) {
      sections.push({
        id: "other",
        name: "More Favorites",
        items: uncategorized,
      });
    }

    return sections;
  }, [visibleCategories, filteredProducts, activeCategoryId, searchQuery, categories]);

  const getSelectedVariationForProduct = (product: Product): ProductVariation | null => {
    const vars = Array.isArray(product.variations) ? product.variations : [];
    if (vars.length === 0) return null;
    const idx = selectedVarByProduct[String(product.id)] ?? 0;
    return vars[idx] || vars[0];
  };

  const handleDirectAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const hasToppings = Array.isArray(product.extra_toppings) && product.extra_toppings.length > 0;
    if (hasToppings) {
      setSelectedProduct(product);
      return;
    }

    const chosenVar = getSelectedVariationForProduct(product);
    addItem(product, undefined, chosenVar, []);
    setJustAddedId(product.id);
    setTimeout(() => {
      setJustAddedId((prev) => (prev === product.id ? null : prev));
    }, 900);
  };

  const currentSlide = slides[activeSlide] || slides[0];

  return (
    <div className={`min-h-screen ${theme.pageBg} font-sans pb-28 lg:pb-16 transition-colors duration-300`}>
      {/* ─── TOP STICKY HEADER (Rich Gradient + 5-Color Theme Switcher + My Order) ─── */}
      <header className={`sticky top-0 z-40 ${theme.headerBg} text-white border-b ${theme.headerBorder} shadow-lg`}>
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center gap-3 min-w-0">
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.shop_name}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-[7px] object-cover border border-white/25 shrink-0"
              />
            ) : (
              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-[7px] ${theme.primaryBadge} flex items-center justify-center text-xl font-black shadow-md shrink-0`}>
                🍕
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-lg font-black tracking-tight text-white truncate">
                  {settings.shop_name || "Pizza Mafia"}
                </h1>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${theme.primaryBadge} shrink-0`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  Open
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-white/75 truncate">
                Fresh Oven-Baked Pizzas, Burgers &amp; Deals
              </p>
            </div>
          </div>

          {/* My Order Button */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className={`relative inline-flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-[7px] ${theme.primaryBtn} font-black text-xs sm:text-sm shadow-lg transition cursor-pointer`}
            >
              <ShoppingBag size={16} />
              <span>My Order</span>
              <span className={`px-2 py-0.5 rounded-[5px] ${theme.primaryBadge} font-black text-xs`}>
                {totalItems}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── INTERACTIVE AUTO-PLAYING HERO SLIDER (7px Square Radius) ─── */}
      <section className="max-w-7xl mx-auto px-3.5 sm:px-6 pt-4 pb-2">
        <div className={`relative rounded-[7px] overflow-hidden ${theme.headerBg} text-white min-h-[210px] sm:min-h-[270px] lg:min-h-[310px] flex items-center shadow-xl border ${theme.headerBorder}`}>
          {slides.map((sl, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ${
                idx === activeSlide ? "opacity-40 scale-100" : "opacity-0 scale-105"
              }`}
              style={{ backgroundImage: `url("${sl.image}")` }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/20 pointer-events-none" />

          <div className="relative z-10 w-full p-5 sm:p-8 lg:p-10 flex flex-col justify-between gap-4">
            <div className="max-w-2xl space-y-2.5 sm:space-y-3.5">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] ${theme.primaryBadge} text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-xs`}>
                <Flame size={13} />
                <span>{currentSlide.badge}</span>
              </div>

              <h2 className="text-xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.12]">
                {currentSlide.title}{" "}
                <span className={`${theme.accentText} block sm:inline`}>{currentSlide.highlight}</span>
              </h2>

              <p className="text-xs sm:text-sm md:text-base text-white/85 max-w-xl leading-relaxed line-clamp-2 sm:line-clamp-none">
                {currentSlide.subtitle}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs font-bold">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] bg-white/15 border border-white/20 text-white">
                  <Clock size={12} className={theme.accentText} />
                  <span>25–35 Min</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] bg-white/15 border border-white/20 text-white">
                  <Bike size={12} className={theme.accentText} />
                  <span>Fast Delivery</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    aria-label={`Slide ${idx + 1}`}
                    className={`h-2 rounded-[4px] transition-all cursor-pointer ${
                      idx === activeSlide
                        ? `w-7 ${theme.primaryBadge}`
                        : "w-2 bg-white/35 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STICKY SEARCH + SQUARE CATEGORY DECK ─── */}
      <div className={`sticky top-[92px] md:top-[65px] z-30 ${theme.stickyBarBg} backdrop-blur-md border-b py-3 shadow-xs`}>
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 space-y-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pizzas, burgers, deals, or drinks..."
              className={`w-full pl-9 pr-8 py-2.5 rounded-[7px] ${theme.cardBg} border ${theme.cardBorder} text-xs sm:text-sm font-semibold focus:outline-none shadow-2xs`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Horizontal Category Tiles */}
          <div className="flex items-stretch gap-2 overflow-x-auto no-scrollbar pb-0.5">
            <button
              type="button"
              onClick={() => setActiveCategoryId(null)}
              className={`group relative flex items-center gap-2 px-3 py-2 rounded-[7px] border text-left transition-all cursor-pointer shrink-0 ${
                activeCategoryId === null ? theme.catActiveBg : theme.catInactiveBg
              }`}
            >
              <span
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-[5px] flex items-center justify-center text-sm sm:text-base shrink-0 ${
                  activeCategoryId === null ? "bg-black/20" : theme.sizeBoxBg
                }`}
              >
                🍽️
              </span>
              <div>
                <span className="block text-xs font-black leading-none">All Menu</span>
                <span className="block text-[10px] font-bold mt-0.5 opacity-80">
                  {liveProducts.filter((p) => p.is_available !== false).length} Items
                </span>
              </div>
            </button>

            {visibleCategories.map((cat) => {
              const isSelected = String(activeCategoryId) === String(cat.id);
              const count = liveProducts.filter(
                (p) => String(p.category_id) === String(cat.id) && p.is_available !== false
              ).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategoryId(isSelected ? null : cat.id)}
                  className={`group relative flex items-center gap-2 px-3 py-2 rounded-[7px] border text-left transition-all cursor-pointer shrink-0 ${
                    isSelected ? theme.catActiveBg : theme.catInactiveBg
                  }`}
                >
                  <span
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-[5px] flex items-center justify-center text-sm sm:text-base shrink-0 ${
                      isSelected ? "bg-black/20" : theme.sizeBoxBg
                    }`}
                  >
                    {getCategoryEmoji(cat.name)}
                  </span>
                  <div>
                    <span className="block text-xs font-black leading-none">{cat.name}</span>
                    <span className="block text-[10px] font-bold mt-0.5 opacity-80">
                      {count} {count === 1 ? "Item" : "Items"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT: MENU SECTIONS + STICKY DESKTOP BASKET ─── */}
      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 pt-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Main Column: Menu Sections (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-7">
            {groupedSections.length === 0 ? (
              <div className={`${theme.cardBg} rounded-[7px] border ${theme.cardBorder} p-10 text-center`}>
                <div className="text-4xl mb-2">🍕</div>
                <h3 className="text-base font-black">No dishes found</h3>
                <p className={`text-xs ${theme.cardDescText} mt-1`}>
                  Try clearing your search or selecting another menu category.
                </p>
              </div>
            ) : (
              groupedSections.map((section) => (
                <section key={String(section.id)} className="space-y-3.5">
                  {/* Rich Colored Category Banner Strip */}
                  <div className={`${theme.sectionBannerBg} rounded-[7px] px-4 py-2.5 flex items-center justify-between shadow-sm`}>
                    <div className="flex items-center gap-2.5">
                      <span className={`w-7 h-7 rounded-[5px] ${theme.primaryBadge} flex items-center justify-center text-base`}>
                        {getCategoryEmoji(section.name)}
                      </span>
                      <h3 className="text-sm sm:text-base font-black uppercase tracking-wider">
                        {section.name}
                      </h3>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-[5px] text-[11px] font-extrabold ${theme.primaryBadge}`}>
                      {section.items.length} {section.items.length === 1 ? "Dish" : "Dishes"}
                    </span>
                  </div>

                  {/* Mobile-Responsive Rich Product Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {section.items.map((product) => {
                      const variations = Array.isArray(product.variations) ? product.variations : [];
                      const hasVariations = variations.length > 0;
                      const dealBullets = getDealItems(product);

                      const selectedVarIdx = selectedVarByProduct[String(product.id)] ?? 0;
                      const activeVar = hasVariations
                        ? variations[selectedVarIdx] || variations[0]
                        : null;

                      const displayPrice = activeVar
                        ? Number(activeVar.price) || 0
                        : Number(product.price) || 0;

                      const isAdded = justAddedId === product.id;

                      const matchingCartItem = cartItems.find(
                        (ci) =>
                          ci.product.id === product.id &&
                          (ci.selectedVariation?.name || "") === (activeVar?.name || "") &&
                          (!ci.selectedToppings || ci.selectedToppings.length === 0)
                      );

                      return (
                        <div
                          key={product.id}
                          onClick={() => setSelectedProduct(product)}
                          className={`group ${theme.cardBg} rounded-[7px] border-2 ${theme.cardBorder} ${theme.cardHoverBorder} overflow-hidden shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between`}
                        >
                          <div>
                            {/* Top Row: Square Image + Title + Price */}
                            <div className="p-3.5 flex gap-3.5 items-start">
                              <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-[7px] overflow-hidden ${theme.headerBg} shrink-0 relative border ${theme.cardBorder}`}>
                                {product.image_url ? (
                                  <OptimizedImage
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className={`w-full h-full ${theme.headerBg} flex flex-col items-center justify-center p-2 text-center`}>
                                    <span className="text-3xl">
                                      {getCategoryEmoji(product.category?.name || product.name)}
                                    </span>
                                    <span className={`text-[9px] font-extrabold uppercase tracking-wider ${theme.accentText} mt-1`}>
                                      Fresh
                                    </span>
                                  </div>
                                )}

                                {product.badge && (
                                  <span className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-[4px] ${theme.primaryBadge} text-[9px] font-black uppercase shadow-xs`}>
                                    {product.badge}
                                  </span>
                                )}
                              </div>

                              {/* Title, Description & Price */}
                              <div className="flex-1 min-w-0">
                                <h4 className={`text-sm sm:text-base font-black ${theme.cardTitleText} transition-colors leading-snug`}>
                                  {product.name}
                                </h4>

                                {dealBullets.length > 0 ? (
                                  <div className="mt-1.5 flex flex-wrap gap-1">
                                    {dealBullets.slice(0, 3).map((b, idx) => (
                                      <span
                                        key={idx}
                                        className={`px-1.5 py-0.5 rounded-[4px] ${theme.sizeBoxBg} border text-[10px] font-bold`}
                                      >
                                        • {b}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  product.description && (
                                    <p className={`text-xs ${theme.cardDescText} mt-1 line-clamp-2 leading-relaxed`}>
                                      {product.description}
                                    </p>
                                  )
                                )}

                                <div className="mt-2.5 flex items-baseline gap-1.5">
                                  {hasVariations && (
                                    <span className="text-[10px] font-extrabold uppercase opacity-60">
                                      {activeVar?.name}:
                                    </span>
                                  )}
                                  <span className={`text-base sm:text-lg font-black ${theme.priceText}`}>
                                    {formatPrice(displayPrice)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Interactive Size Pills Bar */}
                            {hasVariations && (
                              <div className="px-3.5 pb-2.5">
                                <div className={`grid grid-cols-3 gap-1.5 ${theme.sizeBoxBg} p-1.5 rounded-[7px] border`}>
                                  {variations.map((v, idx) => {
                                    const isVarActive = selectedVarIdx === idx;
                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedVarByProduct((prev) => ({
                                            ...prev,
                                            [String(product.id)]: idx,
                                          }));
                                        }}
                                        className={`py-1 px-1.5 rounded-[5px] text-center transition cursor-pointer ${
                                          isVarActive
                                            ? `${theme.sizeActiveBg} shadow-xs`
                                            : "opacity-75 hover:opacity-100"
                                        }`}
                                      >
                                        <span className="block text-[10px] font-extrabold truncate">
                                          {v.name}
                                        </span>
                                        <span className="block text-[9px] font-bold opacity-90">
                                          {formatPrice(Number(v.price) || 0)}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Rich Colored Card Footer */}
                          <div className={`px-3.5 py-2.5 ${theme.cardFooterBg} border-t flex items-center justify-between gap-2`}>
                            <span className="text-[11px] font-bold opacity-70">
                              Tap to customize
                            </span>

                            {matchingCartItem ? (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className={`inline-flex items-center gap-2 ${theme.headerBg} text-white p-1 rounded-[7px]`}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setQty(
                                      getItemKey(matchingCartItem),
                                      matchingCartItem.quantity - 1
                                    )
                                  }
                                  className="w-6 h-6 rounded-[5px] bg-white/15 hover:bg-red-600 text-white font-black text-xs flex items-center justify-center cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="text-xs font-black px-1">
                                  {matchingCartItem.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setQty(
                                      getItemKey(matchingCartItem),
                                      matchingCartItem.quantity + 1
                                    )
                                  }
                                  className={`w-6 h-6 rounded-[5px] ${theme.primaryBadge} font-black text-xs flex items-center justify-center cursor-pointer`}
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => handleDirectAdd(product, e)}
                                className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-[7px] text-xs font-black uppercase tracking-wide transition cursor-pointer shadow-xs ${
                                  isAdded ? "bg-emerald-600 text-white" : theme.primaryBtn
                                }`}
                              >
                                {isAdded ? (
                                  <>
                                    <Check size={13} />
                                    <span>Added</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus size={13} />
                                    <span>Add</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))
            )}
          </div>

          {/* Right Column: Live Sticky Order Basket on Desktop (4 cols on lg) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-[145px]">
            <div className={`${theme.cardBg} rounded-[7px] border-2 ${theme.cardBorder} shadow-md overflow-hidden`}>
              <div className={`p-4 ${theme.headerBg} text-white flex items-center justify-between`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-[7px] ${theme.primaryBadge} flex items-center justify-center font-black`}>
                    <ShoppingBag size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black">Your Order Basket</h3>
                    <p className="text-[11px] text-white/70">Instant checkout ready</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-[5px] ${theme.primaryBadge} text-xs font-black`}>
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </span>
              </div>

              {cartItems.length === 0 ? (
                <div className="p-8 text-center">
                  <div className={`w-12 h-12 rounded-[7px] ${theme.sizeBoxBg} flex items-center justify-center mx-auto mb-2.5 text-xl`}>
                    🛒
                  </div>
                  <p className="text-sm font-extrabold">Your basket is empty</p>
                  <p className={`text-xs ${theme.cardDescText} mt-1`}>
                    Click any item on the menu to add it to your order.
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  <div className={`max-h-80 overflow-y-auto divide-y ${theme.cardBorder} pr-1`}>
                    {cartItems.map((item) => {
                      const key = getItemKey(item);
                      const unitPrice = getUnitPrice(item);
                      return (
                        <div key={key} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-extrabold truncate">
                              {item.product.name}
                            </p>
                            {item.selectedVariation && (
                              <p className={`text-[11px] ${theme.priceText} font-bold`}>
                                Size: {item.selectedVariation.name}
                              </p>
                            )}
                            <p className="text-xs font-black mt-0.5">
                              {formatPrice(unitPrice * item.quantity)}
                            </p>
                          </div>

                          <div className={`flex items-center gap-1 ${theme.sizeBoxBg} rounded-[7px] p-1 border shrink-0`}>
                            <button
                              type="button"
                              onClick={() => setQty(key, item.quantity - 1)}
                              className={`w-6 h-6 rounded-[5px] ${theme.cardBg} font-bold text-xs flex items-center justify-center cursor-pointer`}
                            >
                              -
                            </button>
                            <span className="text-xs font-black w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQty(key, item.quantity + 1)}
                              className={`w-6 h-6 rounded-[5px] ${theme.primaryBtn} font-bold text-xs flex items-center justify-center cursor-pointer`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className={`pt-3 border-t ${theme.cardBorder} space-y-2.5`}>
                    <div className="flex items-center justify-between text-sm font-black">
                      <span>Subtotal</span>
                      <span className={`text-base ${theme.priceText}`}>{formatPrice(totalPrice)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCartOpen(true)}
                      className={`w-full py-3.5 px-4 rounded-[7px] ${theme.primaryBtn} font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-between transition cursor-pointer`}
                    >
                      <span>Proceed to Checkout</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* ─── FLOATING MOBILE CHECKOUT BAR (7px Square Radius) ─── */}
      {totalItems > 0 && (
        <div className="fixed bottom-3.5 inset-x-3.5 z-40 lg:hidden">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className={`w-full py-3.5 px-4 rounded-[7px] ${theme.headerBg} border ${theme.headerBorder} text-white shadow-2xl flex items-center justify-between cursor-pointer`}
          >
            <div className="flex items-center gap-3">
              <span className={`w-7 h-7 rounded-[5px] ${theme.primaryBadge} font-black text-xs flex items-center justify-center`}>
                {totalItems}
              </span>
              <div className="text-left">
                <span className={`block text-[10px] uppercase tracking-wider font-bold ${theme.accentText}`}>
                  Your Basket Ready
                </span>
                <span className="text-sm font-black text-white">{formatPrice(totalPrice)}</span>
              </div>
            </div>

            <div className={`flex items-center gap-1.5 text-xs font-black ${theme.primaryBadge} px-3 py-2 rounded-[5px]`}>
              <span>Checkout</span>
              <ChevronRight size={14} />
            </div>
          </button>
        </div>
      )}

      {/* ─── MENU 2 PRODUCT CUSTOMIZATION MODAL ─── */}
      <Menu2ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        shopName={settings.shop_name}
        themeId={themeId}
      />

      {/* ─── MENU 2 SLIDE-OVER CART & CUSTOMER INFO DRAWER ─── */}
      <Menu2CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        tableNumber={tableNumber}
        setTableNumber={setTableNumber}
        orderType={orderType}
        setOrderType={setOrderType}
        shopId={settings.shop_id}
        shopName={settings.shop_name}
        googleReviewUrl={settings.google_review_url || ""}
        menuProducts={liveProducts}
        themeId={themeId}
      />
    </div>
  );
}

export default function Menu2Client(props: Menu2ClientProps) {
  return (
    <CartProvider currencySymbol={props.settings.currency_symbol}>
      <Menu2Inner {...props} />
    </CartProvider>
  );
}
