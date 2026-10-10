"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Deal, Product, Category, ProductVariation } from "@/types/menu";
import { createDeal, updateDeal } from "@/lib/deal-actions";
import { PRESET_FOOD_IMAGES, type PresetFoodImage } from "@/lib/preset-images";
import {
  Plus,
  Trash2,
  Sparkles,
  ShoppingBag,
  Search,
  Check,
  Flame,
  Tag,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";

interface ComboItem {
  id: string;
  productId?: string | number | null;
  name: string;
  variationName?: string;
  quantity: number;
  unitPrice: number;
}

interface DealFormProps {
  initialDeal?: Deal | null;
  products: Product[];
  categories: Category[];
  currencySymbol?: string;
  currentShopId?: number | null;
  currentShopName?: string;
  isMasterAdmin?: boolean;
  availableShops?: { id: number; name: string; slug: string }[];
}

const PRESET_BADGES = [
  "🔥 Hot Deal",
  "👨‍👩‍👧‍👦 Family Combo",
  "⭐ Bestseller",
  "🌙 Midnight Deal",
  "🎉 Weekend Special",
  "🎓 Student Deal",
  "👫 Duo Feast",
  "🍕 Buy 1 Get 1",
  "⚡ Flash Offer",
];

export default function DealForm({
  initialDeal,
  products = [],
  categories = [],
  currencySymbol = "Rs.",
  currentShopId,
  currentShopName = "Pizza Admin",
  isMasterAdmin = false,
  availableShops = [],
}: DealFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState(initialDeal?.title || "");
  const [slug, setSlug] = useState(initialDeal?.slug || "");
  const [badge, setBadge] = useState(initialDeal?.badge || "🔥 Hot Deal");
  const [customBadge, setCustomBadge] = useState("");
  const [description, setDescription] = useState(initialDeal?.description || "");
  const [dealPrice, setDealPrice] = useState<string>(
    initialDeal?.deal_price != null ? String(initialDeal.deal_price) : ""
  );
  const [originalPrice, setOriginalPrice] = useState<string>(
    initialDeal?.original_price != null ? String(initialDeal.original_price) : ""
  );
  const [imageUrl, setImageUrl] = useState(initialDeal?.image_url || "");
  const [sortOrder, setSortOrder] = useState<number>(initialDeal?.sort_order ?? 0);
  const [isAvailable, setIsAvailable] = useState<boolean>(initialDeal?.is_available ?? true);
  const [isActive, setIsActive] = useState<boolean>(initialDeal?.is_active ?? true);
  const [selectedShopId, setSelectedShopId] = useState<string>(
    initialDeal?.shop_id != null ? String(initialDeal.shop_id) : (currentShopId ? String(currentShopId) : "")
  );

  // Included Combo Items State
  const [comboItems, setComboItems] = useState<ComboItem[]>(() => {
    if (!initialDeal?.items_included) return [];
    const raw = initialDeal.items_included;
    const list = Array.isArray(raw) ? raw : typeof raw === "string" ? (raw as string).split(",").map((s) => s.trim()) : [];
    return list.map((str, idx) => {
      const match = str.match(/^(\d+)x\s+(.+)$/);
      if (match) {
        return {
          id: `item-${idx}-${Date.now()}`,
          name: match[2].trim(),
          quantity: parseInt(match[1], 10),
          unitPrice: 0,
        };
      }
      return {
        id: `item-${idx}-${Date.now()}`,
        name: str.trim(),
        quantity: 1,
        unitPrice: 0,
      };
    });
  });

  // Custom Item Input
  const [customItemName, setCustomItemName] = useState("");
  const [customItemQty, setCustomItemQty] = useState(1);
  const [customItemPrice, setCustomItemPrice] = useState("");

  // Product Catalog Search & Category Filter
  const [productSearch, setProductSearch] = useState("");
  const [selectedCatId, setSelectedCatId] = useState<string>("all");
  const [activeImageTab, setActiveImageTab] = useState<string>("All");

  // Filtered Products from Catalog
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      if (selectedCatId !== "all" && String(prod.category_id) !== selectedCatId) {
        return false;
      }
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase();
        return prod.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, selectedCatId, productSearch]);

  // Variations Selection per Product
  const [selectedVariationMap, setSelectedVariationMap] = useState<Record<string, ProductVariation>>({});

  const handleVariationSelect = (productId: string | number, variation: ProductVariation) => {
    setSelectedVariationMap((prev) => ({
      ...prev,
      [String(productId)]: variation,
    }));
  };

  // Add Product from Catalog to Combo
  const handleAddProductToCombo = (product: Product) => {
    const selectedVar = selectedVariationMap[String(product.id)];
    const varName = selectedVar?.name;
    const price = selectedVar?.price ?? product.price ?? 0;

    const existingIndex = comboItems.findIndex(
      (item) => item.productId === product.id && item.variationName === varName
    );

    if (existingIndex >= 0) {
      setComboItems((prev) => {
        const copy = [...prev];
        copy[existingIndex].quantity += 1;
        return copy;
      });
    } else {
      setComboItems((prev) => [
        ...prev,
        {
          id: `combo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: product.id,
          name: product.name,
          variationName: varName,
          quantity: 1,
          unitPrice: price,
        },
      ]);
    }
  };

  // Add Custom Item to Combo
  const handleAddCustomItem = () => {
    if (!customItemName.trim()) return;
    const price = parseFloat(customItemPrice) || 0;
    setComboItems((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        name: customItemName.trim(),
        quantity: Math.max(1, customItemQty),
        unitPrice: price,
      },
    ]);
    setCustomItemName("");
    setCustomItemQty(1);
    setCustomItemPrice("");
  };

  // Combo item quantity controls
  const handleUpdateQty = (id: string, delta: number) => {
    setComboItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as ComboItem[]
    );
  };

  const handleRemoveComboItem = (id: string) => {
    setComboItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Auto-calculated total regular worth of all items in combo
  const calculatedTotalWorth = useMemo(() => {
    return comboItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  }, [comboItems]);

  // One-click apply calculated total as original price
  const handleApplyCalculatedOriginalPrice = () => {
    if (calculatedTotalWorth > 0) {
      setOriginalPrice(String(calculatedTotalWorth));
    }
  };

  // Auto slug generator
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!initialDeal) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
      );
    }
  };

  // Calculations
  const dealPriceNum = parseFloat(dealPrice) || 0;
  const originalPriceNum = parseFloat(originalPrice) || 0;
  const hasSavings = originalPriceNum > dealPriceNum && dealPriceNum > 0;
  const savingsAmount = hasSavings ? originalPriceNum - dealPriceNum : 0;
  const savingsPercent = hasSavings && originalPriceNum > 0 ? Math.round((savingsAmount / originalPriceNum) * 100) : 0;

  // Food image categories
  const imageCategories = ["All", "Pizza", "Burger", "Fries & Sides", "Drinks", "Dessert"];
  const filteredPresetImages = PRESET_FOOD_IMAGES.filter((img) =>
    activeImageTab === "All" ? true : img.category === activeImageTab
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Please enter a Deal Title.");
      return;
    }

    if (isNaN(dealPriceNum) || dealPriceNum <= 0) {
      setErrorMessage("Please enter a valid Deal Price greater than 0.");
      return;
    }

    if (comboItems.length === 0) {
      setErrorMessage("Please add at least one product or item to this deal combo.");
      return;
    }

    // Format included items strings for menu & KOT
    const itemsFormatted = comboItems.map((item) => {
      const qtyStr = item.quantity > 1 ? `${item.quantity}x ` : "";
      const varStr = item.variationName ? ` (${item.variationName})` : "";
      return `${qtyStr}${item.name}${varStr}`;
    });

    const formData = new FormData();
    formData.set("title", title);
    formData.set("slug", slug || title.toLowerCase().replace(/\s+/g, "-"));
    formData.set("badge", customBadge.trim() ? customBadge.trim() : badge);
    formData.set("description", description);
    formData.set("deal_price", dealPrice);
    if (originalPrice.trim()) {
      formData.set("original_price", originalPrice);
    }
    formData.set("image_url", imageUrl);
    formData.set("items_included", JSON.stringify(itemsFormatted));
    formData.set("sort_order", sortOrder.toString());
    formData.set("is_available", isAvailable ? "true" : "false");
    formData.set("is_active", isActive ? "true" : "false");

    if (selectedShopId) {
      formData.set("shop_id", selectedShopId);
    }

    startTransition(async () => {
      let res;
      if (initialDeal?.id) {
        res = await updateDeal(initialDeal.id, { error: null, success: false }, formData);
      } else {
        res = await createDeal({ error: null, success: false }, formData);
      }

      if (res.error) {
        setErrorMessage(res.error);
      } else {
        router.push("/admin/deals");
        router.refresh();
      }
    });
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "60px" }}>
      {/* Top Breadcrumb & Header */}
      <div style={{ marginBottom: "22px" }}>
        <Link
          href="/admin/deals"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: "#64748b",
            textDecoration: "none",
            fontWeight: 600,
            marginBottom: "10px",
            transition: "color 0.15s ease",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          <span>Back to Special Deals</span>
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
              {initialDeal ? `Edit Deal: ${initialDeal.title}` : "Create New Special Deal & Combo"}
            </h1>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
              Add products from your menu to assemble combo bundles, set promotional discounts, and publish directly to customer storefront and FloDesktop POS.
            </p>
          </div>

          <div
            style={{
              padding: "6px 12px",
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: "5px",
              fontSize: "12px",
              color: "#c2410c",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Sparkles size={14} />
            <span>Branch: <strong>{currentShopName}</strong></span>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            borderRadius: "5px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Two-Column Full-Page Form */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: "24px",
            alignItems: "start",
          }}
        >
          {/* ============================================================ */}
          {/* LEFT COLUMN: DEAL DETAILS & PRODUCTS BUNDLE BUILDER */}
          {/* ============================================================ */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Card 1: Deal Information */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
                <Tag size={18} color="#ea580c" />
                <h2 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                  1. Deal Details & Identity
                </h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Title */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Deal Title * <span style={{ fontWeight: 400, color: "#64748b" }}>(e.g. Family Feast, Duo Night, Midnight Special)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2 Large Pizzas + 1.5L Coke Deal"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "5px",
                      fontSize: "14px",
                      fontWeight: 600,
                      outline: "none",
                    }}
                  />
                </div>

                {/* Badge selection */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Promotional Badge / Ribbon
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                    {PRESET_BADGES.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => {
                          setBadge(b);
                          setCustomBadge("");
                        }}
                        style={{
                          padding: "5px 10px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          border: "1px solid",
                          background: badge === b && !customBadge ? "#ea580c" : "#f8fafc",
                          color: badge === b && !customBadge ? "#ffffff" : "#334155",
                          borderColor: badge === b && !customBadge ? "#ea580c" : "#cbd5e1",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Or type custom badge (e.g. ⚡ Flash 30% Off)"
                    value={customBadge}
                    onChange={(e) => setCustomBadge(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "5px",
                      fontSize: "12px",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Catchy Description & Terms
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Treat your family to 2 Large Pizzas of choice, 4 Garlic Breads, and a chilled 1.5L drink. Valid all week!"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "5px",
                      fontSize: "13px",
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                </div>

                {/* Slug */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
                    Web URL Slug
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="family-feast-combo"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "5px",
                      fontSize: "12px",
                      color: "#64748b",
                      background: "#f8fafc",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Card 2: PRODUCTS BUNDLE & COMBO BUILDER */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Layers size={18} color="#ea580c" />
                  <h2 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                    2. Add Products to this Deal
                  </h2>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "3px 8px", borderRadius: "12px" }}>
                  {comboItems.length} items in combo
                </span>
              </div>
              <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#64748b" }}>
                Select actual products from your menu to bundle into this deal. Quantities and sizes can be customized.
              </p>

              {/* Product catalog picker */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  padding: "14px",
                  marginBottom: "18px",
                }}
              >
                {/* Search & Category Filter */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
                  <div style={{ position: "relative", flex: "1 1 200px" }}>
                    <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                    <input
                      type="text"
                      placeholder="Search menu products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "7px 10px 7px 30px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "4px",
                        fontSize: "12px",
                        outline: "none",
                        background: "#ffffff",
                      }}
                    />
                  </div>

                  <select
                    value={selectedCatId}
                    onChange={(e) => setSelectedCatId(e.target.value)}
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "4px",
                      fontSize: "12px",
                      background: "#ffffff",
                      outline: "none",
                      color: "#334155",
                      fontWeight: 600,
                    }}
                  >
                    <option value="all">All Categories ({products.length})</option>
                    {categories.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Available Products Scroll Grid */}
                <div
                  style={{
                    maxHeight: "260px",
                    overflowY: "auto",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: "8px",
                    paddingRight: "4px",
                  }}
                >
                  {filteredProducts.length === 0 ? (
                    <div style={{ gridColumn: "1 / -1", padding: "16px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
                      No menu products found. Add products first or adjust filters.
                    </div>
                  ) : (
                    filteredProducts.map((p) => {
                      const hasVars = p.variations && p.variations.length > 0;
                      const selectedVar = selectedVariationMap[String(p.id)] || (hasVars ? p.variations![0] : null);
                      const currentPrice = selectedVar?.price ?? p.price ?? 0;

                      return (
                        <div
                          key={p.id}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "5px",
                            padding: "8px 10px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            justifyContent: "space-between",
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: "11px", color: "#ea580c", fontWeight: 700 }}>
                              {currencySymbol} {Number(currentPrice).toLocaleString()}
                            </div>

                            {/* Variations dropdown if exists */}
                            {hasVars && (
                              <select
                                value={selectedVar?.name}
                                onChange={(e) => {
                                  const found = p.variations?.find((v) => v.name === e.target.value);
                                  if (found) handleVariationSelect(p.id, found);
                                }}
                                style={{
                                  marginTop: "4px",
                                  fontSize: "10px",
                                  padding: "2px 4px",
                                  borderRadius: "3px",
                                  border: "1px solid #cbd5e1",
                                  background: "#f8fafc",
                                  outline: "none",
                                  width: "100%",
                                }}
                              >
                                {p.variations!.map((v, i) => (
                                  <option key={i} value={v.name}>
                                    {v.name} ({currencySymbol} {v.price})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddProductToCombo(p)}
                            style={{
                              background: "#ea580c",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "4px",
                              padding: "6px 9px",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              flexShrink: 0,
                            }}
                            title="Add product to deal bundle"
                          >
                            <Plus size={13} />
                            <span>Add</span>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Selected Combo Items Breakdown */}
              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", margin: "0 0 8px" }}>
                  Included Items in this Deal:
                </h3>

                {comboItems.length === 0 ? (
                  <div
                    style={{
                      border: "2px dashed #cbd5e1",
                      borderRadius: "5px",
                      padding: "20px",
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: "12px",
                    }}
                  >
                    Click "+ Add" on any menu product above or enter a custom item below to build this deal!
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {comboItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "5px",
                          padding: "8px 12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "10px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                          <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                          <div>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                              {item.name}
                            </span>
                            {item.variationName && (
                              <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "4px", fontWeight: 600 }}>
                                ({item.variationName})
                              </span>
                            )}
                            {item.unitPrice > 0 && (
                              <div style={{ fontSize: "11px", color: "#64748b" }}>
                                {currencySymbol} {item.unitPrice} each × {item.quantity} ={" "}
                                <strong style={{ color: "#0f172a" }}>
                                  {currencySymbol} {item.unitPrice * item.quantity}
                                </strong>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quantity Stepper & Remove */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              border: "1px solid #cbd5e1",
                              borderRadius: "4px",
                              overflow: "hidden",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.id, -1)}
                              style={{
                                background: "#f8fafc",
                                border: "none",
                                padding: "4px 8px",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: 700,
                              }}
                            >
                              -
                            </button>
                            <span style={{ padding: "4px 10px", fontSize: "12px", fontWeight: 700, background: "#ffffff" }}>
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.id, 1)}
                              style={{
                                background: "#f8fafc",
                                border: "none",
                                padding: "4px 8px",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: 700,
                              }}
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveComboItem(item.id)}
                            style={{
                              background: "#fff1f2",
                              border: "1px solid #fecdd3",
                              borderRadius: "4px",
                              padding: "5px 7px",
                              color: "#e11d48",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
                            title="Remove from deal"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Custom Item Row (e.g. Free Drinks, Dip Sauces) */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "5px",
                  padding: "10px 12px",
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                  flexWrap: "wrap",
                  marginBottom: "16px",
                }}
              >
                <input
                  type="text"
                  placeholder="+ Add Custom Item (e.g. Free 1.5L Coke, Garlic Mayo Dip)"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  style={{
                    flex: "1 1 200px",
                    padding: "7px 10px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    fontSize: "12px",
                    outline: "none",
                  }}
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={customItemQty}
                  onChange={(e) => setCustomItemQty(parseInt(e.target.value) || 1)}
                  style={{
                    width: "55px",
                    padding: "7px 6px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    fontSize: "12px",
                    outline: "none",
                    textAlign: "center",
                  }}
                />
                <input
                  type="number"
                  placeholder="Worth (optional)"
                  value={customItemPrice}
                  onChange={(e) => setCustomItemPrice(e.target.value)}
                  style={{
                    width: "110px",
                    padding: "7px 8px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    fontSize: "12px",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomItem}
                  style={{
                    background: "#0f172a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "7px 12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  + Add Item
                </button>
              </div>

              {/* Total Menu Value & One-Click Apply */}
              {calculatedTotalWorth > 0 && (
                <div
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "5px",
                    padding: "10px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "12px", color: "#1e40af" }}>Total Regular Menu Value:</span>
                    <strong style={{ fontSize: "14px", color: "#1e3a8a", marginLeft: "6px" }}>
                      {currencySymbol} {calculatedTotalWorth.toLocaleString()}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCalculatedOriginalPrice}
                    style={{
                      background: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Set as Original Price ({currencySymbol} {calculatedTotalWorth.toLocaleString()})
                  </button>
                </div>
              )}
            </div>

            {/* Card 3: Pricing & Discounts */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
                <Tag size={18} color="#ea580c" />
                <h2 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                  3. Deal Pricing & Savings
                </h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                {/* Deal Price */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Deal / Promo Price * ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 1999"
                    value={dealPrice}
                    onChange={(e) => setDealPrice(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "2px solid #ea580c",
                      borderRadius: "5px",
                      fontSize: "16px",
                      fontWeight: 800,
                      color: "#ea580c",
                      outline: "none",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                    Final price charged to customer.
                  </span>
                </div>

                {/* Original Price */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Original Worth ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 2650"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "5px",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#64748b",
                      outline: "none",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                    Strikethrough price showing savings.
                  </span>
                </div>
              </div>

              {/* Dynamic Savings Display */}
              {hasSavings && (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "5px",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "16px",
                  }}
                >
                  <Sparkles size={20} color="#16a34a" />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "#15803d" }}>
                      Customer Saves: {currencySymbol} {savingsAmount.toLocaleString()} ({savingsPercent}% OFF!)
                    </div>
                    <div style={{ fontSize: "11px", color: "#166534" }}>
                      This discount badge will be highlighted on the online menu and POS.
                    </div>
                  </div>
                </div>
              )}

              {/* Status & Availability Checkboxes */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "14px",
                  paddingTop: "14px",
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#ea580c" }}
                  />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                    Available on Menu
                  </span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#ea580c" }}
                  />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                    Active in System
                  </span>
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Sort Order:</span>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                    style={{
                      width: "60px",
                      padding: "4px 8px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "4px",
                      fontSize: "12px",
                      textAlign: "center",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT COLUMN: DEAL IMAGE & LIVE CUSTOMER PREVIEW */}
          {/* ============================================================ */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Card 4: Deal Photo Picker */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                padding: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <ImageIcon size={18} color="#ea580c" />
                <h2 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                  Deal Photo / Cover
                </h2>
              </div>

              {/* Preset Image Category Tabs */}
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "10px" }}>
                {imageCategories.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveImageTab(tab)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: "1px solid",
                      background: activeImageTab === tab ? "#0f172a" : "#f8fafc",
                      color: activeImageTab === tab ? "#ffffff" : "#475569",
                      borderColor: activeImageTab === tab ? "#0f172a" : "#cbd5e1",
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Preset Photos Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "6px",
                  maxHeight: "160px",
                  overflowY: "auto",
                  marginBottom: "12px",
                  paddingRight: "2px",
                }}
              >
                {filteredPresetImages.map((preset, idx) => (
                  <div
                    key={idx}
                    onClick={() => setImageUrl(preset.url)}
                    style={{
                      position: "relative",
                      borderRadius: "4px",
                      overflow: "hidden",
                      height: "55px",
                      cursor: "pointer",
                      border: imageUrl === preset.url ? "2px solid #ea580c" : "1px solid #e2e8f0",
                    }}
                    title={preset.name}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    {imageUrl === preset.url && (
                      <div
                        style={{
                          position: "absolute",
                          top: "2px",
                          right: "2px",
                          background: "#ea580c",
                          borderRadius: "50%",
                          width: "14px",
                          height: "14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Check size={10} color="#ffffff" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Custom Image URL */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
                  Or enter Custom Photo URL:
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/deal-photo.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    fontSize: "12px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Card 5: LIVE CUSTOMER MENU PREVIEW */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                padding: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <Eye size={18} color="#ea580c" />
                <h2 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                  Live Storefront Preview
                </h2>
              </div>
              <p style={{ margin: "0 0 12px", fontSize: "11px", color: "#64748b" }}>
                How this deal will look to customers on the online ordering site and FloDesktop POS:
              </p>

              {/* Simulated Deal Card */}
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  background: "#ffffff",
                }}
              >
                {/* Photo with badges */}
                <div style={{ position: "relative", height: "160px", background: "#f8fafc", overflow: "hidden" }}>
                  {imageUrl ? (
                    <img src={imageUrl} alt={title || "Deal"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #fed7aa 0%, #fde047 100%)" }}>
                      <ShoppingBag size={42} color="#ea580c" />
                    </div>
                  )}

                  {/* Ribbon */}
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      left: "8px",
                      background: "rgba(15, 23, 42, 0.85)",
                      backdropFilter: "blur(4px)",
                      color: "#ffffff",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    {customBadge.trim() ? customBadge.trim() : badge}
                  </div>

                  {/* Savings pill */}
                  {savingsPercent > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "#16a34a",
                        color: "#ffffff",
                        padding: "3px 8px",
                        borderRadius: "20px",
                        fontSize: "10px",
                        fontWeight: 800,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      }}
                    >
                      SAVE {savingsPercent}%
                    </div>
                  )}
                </div>

                {/* Details */}
                <div style={{ padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                    <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>
                      {title || "Special Combo Title"}
                    </h4>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "17px", fontWeight: 900, color: "#ea580c" }}>
                        {currencySymbol} {dealPriceNum > 0 ? Number(dealPriceNum).toLocaleString() : "---"}
                      </div>
                      {hasSavings && (
                        <div style={{ fontSize: "11px", color: "#94a3b8", textDecoration: "line-through" }}>
                          {currencySymbol} {Number(originalPriceNum).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <p style={{ margin: "0 0 10px", fontSize: "11px", color: "#64748b", lineHeight: "1.4" }}>
                    {description || "Combo deal description will appear here."}
                  </p>

                  {/* Included items checklist */}
                  {comboItems.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginBottom: "12px" }}>
                      {comboItems.map((item) => (
                        <div key={item.id} style={{ fontSize: "11px", color: "#334155", display: "flex", alignItems: "center", gap: "5px" }}>
                          <span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span>
                          <span>
                            {item.quantity > 1 ? `${item.quantity}x ` : ""}
                            {item.name}
                            {item.variationName ? ` (${item.variationName})` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Mock Add to cart button */}
                  <div
                    style={{
                      background: "#ea580c",
                      color: "#ffffff",
                      borderRadius: "5px",
                      padding: "8px",
                      textAlign: "center",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    Add Deal to Cart • {currencySymbol} {dealPriceNum > 0 ? Number(dealPriceNum).toLocaleString() : "---"}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 6: Submit Actions */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <button
                type="submit"
                disabled={isPending}
                style={{
                  background: "#ea580c",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "5px",
                  padding: "12px 18px",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: isPending ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 2px 8px rgba(234, 88, 12, 0.25)",
                  opacity: isPending ? 0.7 : 1,
                  transition: "all 0.15s ease",
                }}
              >
                <Sparkles size={16} />
                <span>{isPending ? "Saving Deal..." : initialDeal ? "Update & Save Deal" : "Create Deal & Publish"}</span>
              </button>

              <Link
                href="/admin/deals"
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "10px",
                  borderRadius: "5px",
                  fontSize: "13px",
                  color: "#64748b",
                  textDecoration: "none",
                  fontWeight: 600,
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                }}
              >
                Cancel & Go Back
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
