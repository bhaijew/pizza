"use client";

import React, { useEffect, useState } from "react";
import type { Product, ProductVariation, ExtraTopping } from "@/types/menu";
import { useCart } from "./CartContext";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { getDealItems } from "@/lib/deal-helper";
import { MENU2_THEMES, type Menu2ThemeId } from "./menu2-themes";
import { X, Check, ShoppingBag, Flame } from "lucide-react";

interface Menu2ProductModalProps {
  product: Product | null;
  onClose: () => void;
  shopName?: string;
  themeId?: Menu2ThemeId;
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
  return "🍽️";
}

export default function Menu2ProductModal({
  product,
  onClose,
  shopName = "Store",
  themeId = "ruby_gold",
}: Menu2ProductModalProps) {
  const { addItem, formatPrice } = useCart();
  const theme = MENU2_THEMES[themeId] || MENU2_THEMES.ruby_gold;

  const variations = product?.variations || [];
  const extraToppings = product?.extra_toppings || [];

  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(
    variations.length > 0 ? variations[0] : null
  );
  const [selectedToppings, setSelectedToppings] = useState<ExtraTopping[]>([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (product) {
      const vars = product.variations || [];
      setSelectedVariation(vars.length > 0 ? vars[0] : null);
      setSelectedToppings([]);
      setQty(1);
      setAdded(false);
    }
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [product, onClose]);

  if (!product) return null;

  const dealItems = getDealItems(product);
  const unitPrice =
    (selectedVariation ? Number(selectedVariation.price) : Number(product.price || 0)) +
    selectedToppings.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
  const finalTotal = unitPrice * qty;

  const toggleTopping = (topping: ExtraTopping) => {
    setSelectedToppings((prev) => {
      const exists = prev.some((t) => t.name === topping.name);
      return exists ? prev.filter((t) => t.name !== topping.name) : [...prev, topping];
    });
  };

  const handleConfirmAdd = () => {
    for (let i = 0; i < qty; i++) {
      addItem(product, undefined, selectedVariation, selectedToppings);
    }
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 550);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className={`relative z-10 w-full sm:max-w-2xl rounded-t-[14px] sm:rounded-[7px] border ${theme.cardBorder} ${theme.modalBg} shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* Top Visual Header Banner */}
        <div className={`relative h-48 sm:h-56 w-full ${theme.headerBg} shrink-0 overflow-hidden`}>
          {product.image_url ? (
            <OptimizedImage
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full ${theme.headerBg} flex flex-col items-center justify-center p-6 text-center relative`}>
              <div className="w-16 h-16 rounded-[7px] bg-white/10 border border-white/20 flex items-center justify-center text-4xl mb-2 relative z-10">
                {getCategoryEmoji(product.category?.name || product.name)}
              </div>
              <span className={`text-xs font-extrabold uppercase tracking-widest ${theme.accentText} relative z-10`}>
                {product.category?.name || shopName}
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3.5 right-3.5 z-20 w-9 h-9 rounded-[7px] bg-black/70 hover:bg-black text-white border border-white/20 flex items-center justify-center transition cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="absolute bottom-3.5 inset-x-4 sm:inset-x-6 flex items-end justify-between gap-3 z-10">
            <div className="min-w-0">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[5px] ${theme.primaryBadge} text-[10px] font-black uppercase tracking-wider mb-1.5`}>
                <Flame size={11} />
                <span>{product.badge || product.category?.name || "Fresh Prep"}</span>
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-white leading-tight truncate">
                {product.name}
              </h2>
            </div>

            <div className={`${theme.primaryBadge} px-3.5 py-1.5 rounded-[7px] shrink-0 text-right shadow-lg`}>
              <span className="block text-[9px] font-extrabold uppercase tracking-wider leading-none opacity-80">
                {selectedVariation ? selectedVariation.name : "Price"}
              </span>
              <span className="text-base sm:text-xl font-black tracking-tight leading-none">
                {formatPrice(unitPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Customization Body */}
        <div className={`p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 ${theme.modalBodyBg}`}>
          {(product.description || dealItems.length > 0) && (
            <div className={`${theme.cardBg} p-3.5 rounded-[7px] border ${theme.cardBorder}`}>
              {dealItems.length > 0 ? (
                <div className="space-y-1.5">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${theme.priceText} block`}>
                    Included In This Deal:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {dealItems.map((item, idx) => (
                      <span
                        key={idx}
                        className={`px-2.5 py-1 rounded-[5px] ${theme.sizeBoxBg} text-xs font-bold`}
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className={`text-xs sm:text-sm ${theme.cardDescText} leading-relaxed`}>
                  {product.description}
                </p>
              )}
            </div>
          )}

          {/* Size / Portion Variations */}
          {variations.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                  Choose Size / Portion
                </h3>
                <span className={`px-2 py-0.5 rounded-[5px] ${theme.primaryBadge} text-[10px] font-extrabold uppercase`}>
                  Required
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {variations.map((v, idx) => {
                  const isSelected = selectedVariation?.name === v.name;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedVariation(v)}
                      className={`p-3 rounded-[7px] border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? `${theme.catActiveBg}`
                          : `${theme.cardBg} ${theme.cardBorder} hover:opacity-90`
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 w-full">
                        <span className="text-xs font-extrabold truncate">{v.name}</span>
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                            isSelected
                              ? "border-white bg-white text-black"
                              : "border-current opacity-40"
                          }`}
                        >
                          {isSelected && <Check size={10} />}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-black mt-2 block ${
                          isSelected ? "text-white" : theme.priceText
                        }`}
                      >
                        {formatPrice(Number(v.price) || 0)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Extra Toppings / Add-Ons */}
          {extraToppings.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                  Extra Toppings &amp; Add-Ons
                </h3>
                <span className="text-[11px] font-bold opacity-60">Optional</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {extraToppings.map((top, idx) => {
                  const isChecked = selectedToppings.some((t) => t.name === top.name);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleTopping(top)}
                      className={`px-3.5 py-2.5 rounded-[7px] border text-left transition flex items-center justify-between cursor-pointer ${
                        isChecked
                          ? `${theme.catActiveBg}`
                          : `${theme.cardBg} ${theme.cardBorder}`
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-4 h-4 rounded-[4px] flex items-center justify-center border ${
                            isChecked
                              ? "bg-white border-white text-black"
                              : "border-current opacity-40"
                          }`}
                        >
                          {isChecked && <Check size={11} />}
                        </span>
                        <span className="text-xs font-bold">{top.name}</span>
                      </div>
                      <span className="text-xs font-extrabold">
                        +{formatPrice(Number(top.price) || 0)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className={`${theme.cardBg} p-3.5 rounded-[7px] border ${theme.cardBorder} flex items-center justify-between`}>
            <div>
              <span className="block text-xs font-black uppercase tracking-wider">
                Select Quantity
              </span>
              <span className={`text-[11px] ${theme.cardDescText}`}>Number of servings to add</span>
            </div>

            <div className={`inline-flex items-center gap-3 ${theme.sizeBoxBg} p-1 rounded-[7px] border`}>
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className={`w-8 h-8 rounded-[5px] ${theme.cardBg} font-black text-sm flex items-center justify-center shadow-2xs cursor-pointer`}
              >
                -
              </button>
              <span className="text-sm font-black w-6 text-center">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className={`w-8 h-8 rounded-[5px] ${theme.primaryBtn} font-black text-sm flex items-center justify-center shadow-2xs cursor-pointer transition`}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className={`p-4 sm:px-6 ${theme.cardBg} border-t ${theme.cardBorder} flex items-center gap-3`}>
          <button
            type="button"
            onClick={handleConfirmAdd}
            className={`flex-1 py-3.5 px-5 rounded-[7px] font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
              added ? "bg-emerald-600 text-white" : theme.primaryBtn
            }`}
          >
            {added ? (
              <>
                <Check size={17} />
                <span>Added to Basket!</span>
              </>
            ) : (
              <>
                <ShoppingBag size={16} />
                <span>Add to Order — {formatPrice(finalTotal)}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-3.5 rounded-[7px] border ${theme.cardBorder} font-extrabold text-xs sm:text-sm transition cursor-pointer hover:opacity-80`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
