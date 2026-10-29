"use client";

import { useState, useEffect } from "react";
import {
  Printer,
  Receipt,
  ChefHat,
  X,
  Zap,
  Clock,
  Phone,
  User,
  MapPin,
  UtensilsCrossed,
  Bike,
  ShoppingBag,
  Check,
} from "lucide-react";
import { updateOrderDeliveryDetails } from "@/lib/admin-actions";

export interface ThermalPrintItem {
  name: string;
  qty: number;
  price: number;
  variation?: string | null;
  toppings?: string[] | null;
  dealItems?: string[] | null;
  notes?: string | null;
}

export interface ThermalPrintOrderData {
  orderNumber: string;
  orderType: "dine_in" | "takeaway" | "delivery";
  tableNumber?: string | null;
  tokenNumber?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  riderName?: string | null;
  riderPhone?: string | null;
  createdAt?: string | null;
  items: ThermalPrintItem[];
  subtotal: number;
  discountAmount?: number;
  promoCode?: string | null;
  deliveryFee?: number;
  total: number;
  paymentMethod?: string | null;
  paymentStatus?: "paid" | "unpaid" | "cod" | string;
  notes?: string | null;
  shopName?: string;
  shopAddress?: string | null;
  shopPhone?: string | null;
  currencySymbol?: string;
}

interface ThermalDualPrintModalProps {
  order: any;
  shopInfo?: {
    name?: string;
    address?: string | null;
    phone?: string | null;
    currencySymbol?: string;
  };
  onClose: () => void;
  defaultTab?: "counter" | "kitchen" | "dual";
  onOrderUpdated?: (updatedOrder: any) => void;
}

export function normalizeOrderForPrint(
  raw: any,
  shopInfo?: { name?: string; address?: string | null; phone?: string | null; currencySymbol?: string }
): ThermalPrintOrderData {
  const orderNumber =
    raw.order_number || raw.orderNumber || (raw.id ? `ORD-${raw.id}` : "ORD-001");

  // Extract type
  let orderType: "dine_in" | "takeaway" | "delivery" = "takeaway";
  const rawType = (raw.order_type || raw.orderType || "").toLowerCase();
  let tableNumber = raw.table_number || raw.tableNumber || null;
  let tokenNumber = raw.token_number || raw.tokenNumber || null;
  let deliveryAddress = raw.delivery_address || raw.address || null;
  let riderName = raw.delivery_rider_name || raw.riderName || null;
  let riderPhone = raw.delivery_rider_phone || null;

  // Extract from notes fallback
  const notesStr = raw.notes || "";
  if (notesStr.includes("[DELIVERY:")) {
    const match = notesStr.match(/\[DELIVERY:\s*Address:\s*([^|]+)/i);
    if (match) deliveryAddress = match[1].trim();
  }
  if (!riderName && notesStr.includes("[RIDER:")) {
    const rMatch = notesStr.match(/\[RIDER:\s*([^|]+)/i);
    if (rMatch) riderName = rMatch[1].trim();
    const pMatch = notesStr.match(/Phone:\s*([^\]]+)/i);
    if (pMatch) riderPhone = pMatch[1].trim();
  }
  if (!tableNumber && notesStr.includes("[DINE-IN:")) {
    const match = notesStr.match(/\[DINE-IN:\s*Table\s*([0-9A-Za-z]+)/i) || notesStr.match(/\[DINE-IN:\s*([^\]|]+)/i);
    if (match) tableNumber = match[1].trim();
  }
  if (!tokenNumber && notesStr.includes("TOKEN:")) {
    const match = notesStr.match(/TOKEN:\s*([A-Za-z0-9-]+)/i);
    if (match) tokenNumber = match[1].trim();
  }

  if (rawType === "delivery" || deliveryAddress) {
    orderType = "delivery";
  } else if (rawType === "dine_in" || tableNumber) {
    orderType = "dine_in";
  } else {
    orderType = "takeaway";
  }

  // Parse items
  let parsedRawItems: any[] = [];
  if (Array.isArray(raw.items)) {
    parsedRawItems = raw.items;
  } else if (typeof raw.items === "string") {
    try {
      parsedRawItems = JSON.parse(raw.items);
    } catch {
      parsedRawItems = [];
    }
  }

  const items: ThermalPrintItem[] = parsedRawItems.map((it: any) => {
    let variation: string | null = null;
    if (it.selectedVariation) {
      variation = typeof it.selectedVariation === "object" ? it.selectedVariation.name : String(it.selectedVariation);
    } else if (it.selected_variation) {
      variation = typeof it.selected_variation === "object" ? it.selected_variation.name : String(it.selected_variation);
    } else if (it.variant_selection) {
      variation = String(it.variant_selection);
    } else if (it.detail) {
      variation = String(it.detail);
    }

    let toppings: string[] = [];
    if (Array.isArray(it.selectedToppings)) {
      toppings = it.selectedToppings.map((t: any) => (typeof t === "object" ? t.name : String(t)));
    } else if (typeof it.selectedToppings === "string" && it.selectedToppings.trim()) {
      toppings = [it.selectedToppings.trim()];
    }

    // Extract deal items if combo / bumper / deal
    let dealItems: string[] = [];
    const rawDeal = it.dealItems || it.deal_items || it.items_included || it.included_items;
    if (Array.isArray(rawDeal) && rawDeal.length > 0) {
      dealItems = rawDeal.map((x: any) => String(x).trim()).filter(Boolean);
    } else if (typeof rawDeal === "string" && rawDeal.trim()) {
      try {
        const parsed = JSON.parse(rawDeal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          dealItems = parsed.map((x: any) => String(x).trim()).filter(Boolean);
        }
      } catch {}
      if (dealItems.length === 0) {
        dealItems = rawDeal.split(/[\r\n,•·+]+/).map((s: string) => s.trim()).filter(Boolean);
      }
    }
    if (dealItems.length === 0) {
      const desc = it.description || it.product?.description || "";
      const nameLower = (it.name || it.title || "").toLowerCase();
      const isDeal =
        nameLower.includes("deal") ||
        nameLower.includes("combo") ||
        nameLower.includes("bumper") ||
        nameLower.includes("super") ||
        (it.category && String(it.category).toLowerCase().includes("deal"));
      if (isDeal && typeof desc === "string" && desc.trim()) {
        try {
          const parsed = JSON.parse(desc);
          if (Array.isArray(parsed) && parsed.length > 0) {
            dealItems = parsed.map((x: any) => String(x).trim()).filter(Boolean);
          }
        } catch {}
        if (dealItems.length === 0) {
          const lines = desc.split(/[\r\n]+/).map((l: string) => l.replace(/^[•\-\*\d+\.\s]+/, "").trim()).filter(Boolean);
          if (lines.length > 1) {
            dealItems = lines;
          } else {
            const plusParts = desc.split(/[\+•]+/).map((s: string) => s.trim()).filter(Boolean);
            if (plusParts.length > 1) dealItems = plusParts;
          }
        }
      }
    }

    return {
      name: it.name || it.title || it.product_name || "Item",
      qty: Number(it.quantity || it.qty) || 1,
      price: Number(it.price || it.subtotal || it.unit_price) || 0,
      variation,
      toppings: toppings.length > 0 ? toppings : null,
      dealItems: dealItems.length > 0 ? dealItems : null,
      notes: it.notes || it.instructions || null,
    };
  });

  const total = Number(raw.total) || 0;
  const deliveryFee = Number(raw.delivery_fee || raw.deliveryFee) || 0;
  const discountAmount = Number(raw.discount_amount || raw.discountAmount) || 0;
  const itemsSum = items.reduce((acc, it) => acc + it.price * it.qty, 0);
  const subtotal = itemsSum > 0 ? itemsSum : total - deliveryFee + discountAmount;

  return {
    orderNumber,
    orderType,
    tableNumber,
    tokenNumber,
    customerName: raw.customer_name || raw.customerName || "Walk-in Guest",
    customerPhone: raw.customer_phone || raw.customerPhone || "N/A",
    deliveryAddress,
    riderName,
    riderPhone,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    items: items.length > 0 ? items : [{ name: "Standard Meal", qty: 1, price: total }],
    subtotal: Math.max(0, subtotal),
    discountAmount,
    promoCode: raw.promo_code || raw.promoCode || null,
    deliveryFee,
    total,
    paymentMethod: raw.paymentMethod || raw.payment_method || (orderType === "delivery" ? "Cash on Delivery" : "Cash / Counter"),
    paymentStatus: raw.payment_status || (raw.status === "delivered" ? "paid" : "unpaid"),
    notes: raw.notes || null,
    shopName: shopInfo?.name || "PIZZA SHOP",
    shopAddress: shopInfo?.address || "Main Boulevard, Food Street",
    shopPhone: shopInfo?.phone || "0300-1234567",
    currencySymbol: shopInfo?.currencySymbol || "Rs.",
  };
}

export default function ThermalDualPrintModal({
  order,
  shopInfo,
  onClose,
  defaultTab = "dual",
  onOrderUpdated,
}: ThermalDualPrintModalProps) {
  const [activeTab, setActiveTab] = useState<"counter" | "kitchen" | "dual">(defaultTab);
  const [paperWidth, setPaperWidth] = useState<"80mm" | "58mm">("80mm");
  const [printMode, setPrintMode] = useState<"counter" | "kitchen" | "dual" | null>(null);

  const data = normalizeOrderForPrint(order, shopInfo);

  // Delivery & Print Time customization
  const [editableDeliveryFee, setEditableDeliveryFee] = useState<number>(
    Number(order?.delivery_fee ?? order?.deliveryFee ?? data.deliveryFee ?? 0)
  );
  const [editableOrderType, setEditableOrderType] = useState<"dine_in" | "takeaway" | "delivery">(
    data.orderType
  );
  const [savingFee, setSavingFee] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setEditableDeliveryFee(Number(order?.delivery_fee ?? order?.deliveryFee ?? data.deliveryFee ?? 0));
    setEditableOrderType(data.orderType);
  }, [order?.id, order?.delivery_fee, order?.deliveryFee, data.orderType]);

  const currentSafeFee = Math.max(0, Number(editableDeliveryFee) || 0);
  const effectiveSubtotal = data.subtotal;
  const effectiveDiscount = data.discountAmount || 0;
  const effectiveDeliveryFee = editableOrderType === "delivery" ? currentSafeFee : currentSafeFee;
  const effectiveTotal = Math.max(0, Number((effectiveSubtotal - effectiveDiscount + effectiveDeliveryFee).toFixed(2)));

  const printData: ThermalPrintOrderData = {
    ...data,
    orderType: editableOrderType,
    deliveryFee: effectiveDeliveryFee,
    total: effectiveTotal,
  };

  const handleSaveDeliveryDetails = async () => {
    if (!order?.id) return;
    setSavingFee(true);
    setSaveSuccessMsg(null);
    try {
      const res = await updateOrderDeliveryDetails(
        Number(order.id),
        currentSafeFee,
        editableOrderType
      );
      if (res.success) {
        setSaveSuccessMsg("Delivery fee updated!");
        if (onOrderUpdated) {
          onOrderUpdated({
            ...order,
            delivery_fee: currentSafeFee,
            order_type: editableOrderType,
            total: effectiveTotal,
          });
        }
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      } else {
        alert(res.error || "Failed to update delivery fee");
      }
    } catch (e: any) {
      alert(e?.message || "Error saving delivery fee");
    } finally {
      setSavingFee(false);
    }
  };

  const formattedDate = (() => {
    try {
      const d = new Date(data.createdAt || Date.now());
      return d.toLocaleDateString("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) + " " + d.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return new Date().toLocaleString();
    }
  })();

  const triggerPrint = (target: "counter" | "kitchen" | "dual") => {
    setPrintMode(target);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setPrintMode(null);
      }, 500);
    }, 150);
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <>
      {/* ─── PRINT-ONLY DEDICATED STYLESHEET ────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media screen {
          .thermal-print-container {
            display: none !important;
          }
        }
        @media print {
          @page {
            margin: 2mm 3mm;
            size: ${paperWidth === "80mm" ? "80mm auto" : "58mm auto"};
          }
          html, body {
            zoom: 1 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            width: 100% !important;
          }
          /* Hide the interactive UI, backdrops, and navbar */
          body > *:not(.thermal-print-container-root) {
            display: none !important;
          }
          .thermal-no-print {
            display: none !important;
          }
          .thermal-print-container {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: ${paperWidth === "80mm" ? "76mm" : "52mm"} !important;
            margin: 0 auto !important;
            padding: 2mm 1mm !important;
            font-family: 'Courier New', Courier, monospace !important;
            color: #000000 !important;
            background: #ffffff !important;
            font-size: ${paperWidth === "80mm" ? "12px" : "10px"} !important;
            line-height: 1.35 !important;
            text-rendering: optimizeLegibility !important;
          }
          .page-tear-break {
            page-break-after: always !important;
            break-after: page !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }
        }
      `}} />

      {/* ─── INTERACTIVE MODAL (SCREEN VIEW) ────────────────────────── */}
      <div className="thermal-no-print fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <div className="bg-white text-slate-900 w-full max-w-4xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Top Bar Header */}
          <div className="bg-slate-900 text-white px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white shadow-sm">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-black text-sm sm:text-base uppercase tracking-tight text-white">
                    Thermal Dual-Slip Printer
                  </h2>
                  <span className="bg-red-500/20 text-red-300 text-[10px] font-black px-2 py-0.5 rounded uppercase border border-red-500/30">
                    ESC/POS 80mm & 58mm
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Customer Counter Bill &amp; Kitchen Order Ticket (KOT)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Paper Width Toggle */}
              <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setPaperWidth("80mm")}
                  className={`px-2 py-1 rounded font-bold transition-all ${
                    paperWidth === "80mm"
                      ? "bg-amber-400 text-slate-950 shadow-sm"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  80mm Roll
                </button>
                <button
                  type="button"
                  onClick={() => setPaperWidth("58mm")}
                  className={`px-2 py-1 rounded font-bold transition-all ${
                    paperWidth === "58mm"
                      ? "bg-amber-400 text-slate-950 shadow-sm"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  58mm Roll
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* POS Print-Time Delivery Fee & Order Type Adjuster */}
          <div className="bg-amber-50/80 border-b border-amber-200 px-4 py-2 sm:px-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-[11px] font-black uppercase text-amber-950 tracking-wide flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5 text-amber-700" />
                POS Adjuster:
              </span>

              {/* Order Type Toggle */}
              <div className="flex bg-white p-0.5 rounded-md border border-amber-300 text-xs shadow-xs">
                {(["takeaway", "dine_in", "delivery"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEditableOrderType(t)}
                    className={`px-2.5 py-1 rounded text-[11px] font-extrabold transition-all cursor-pointer ${
                      editableOrderType === t
                        ? "bg-amber-500 text-slate-950 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {t === "delivery" ? "🛵 Delivery" : t === "dine_in" ? "🍽️ Dine-In" : "🛍️ Takeaway"}
                  </button>
                ))}
              </div>

              {/* Delivery Fee Input & Presets */}
              <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-amber-300 shadow-xs">
                <label className="text-[11px] font-bold text-slate-700">Fee (Rs.):</label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={editableDeliveryFee === 0 ? "" : editableDeliveryFee}
                  placeholder="0 (Free)"
                  onChange={(e) => setEditableDeliveryFee(Math.max(0, Number(e.target.value) || 0))}
                  className="w-20 h-6 px-1.5 text-xs font-black text-slate-900 bg-amber-50/60 rounded border border-amber-200 outline-none focus:border-amber-500"
                />
                <div className="flex gap-1">
                  {[0, 50, 100, 150, 200].map((fee) => (
                    <button
                      key={fee}
                      type="button"
                      onClick={() => setEditableDeliveryFee(fee)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold transition-all cursor-pointer ${
                        editableDeliveryFee === fee
                          ? "bg-amber-600 text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {fee === 0 ? "Free" : fee}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Net Total & Save to DB */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] text-slate-500 font-bold uppercase leading-none">Net Total</div>
                <div className="text-xs sm:text-sm font-black text-slate-950 font-mono">
                  {data.currencySymbol} {effectiveTotal.toLocaleString()}
                </div>
              </div>

              {order?.id && (
                <button
                  type="button"
                  onClick={handleSaveDeliveryDetails}
                  disabled={savingFee}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Save new delivery fee to order in database"
                >
                  {savingFee ? (
                    <span>Saving...</span>
                  ) : saveSuccessMsg ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Fee</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Action Print Buttons Ribbon */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 sm:px-6 flex flex-wrap items-center justify-between gap-2">
            {/* Tab Selector */}
            <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab("counter")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "counter"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Receipt className="w-3.5 h-3.5 text-blue-600" />
                <span>Counter Bill</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("kitchen")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "kitchen"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ChefHat className="w-3.5 h-3.5 text-amber-600" />
                <span>Kitchen KOT</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("dual")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "dual"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-red-600" />
                <span>Dual Preview (Both)</span>
              </button>
            </div>

            {/* Print Triggers */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => triggerPrint("counter")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Print Counter</span>
              </button>

              <button
                type="button"
                onClick={() => triggerPrint("kitchen")}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>Print KOT</span>
              </button>

              <button
                type="button"
                onClick={() => triggerPrint("dual")}
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-all active:scale-95"
              >
                <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                <span>⚡ Print Both (2 Slips)</span>
              </button>
            </div>
          </div>

          {/* Body Preview Area */}
          <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100 flex justify-center items-start flex-1 min-h-[380px]">
            {activeTab === "dual" ? (
              <div className="flex flex-col md:flex-row gap-6 items-start justify-center max-w-full">
                {/* Counter Preview Card */}
                <div className="flex flex-col items-center">
                  <div className="text-[11px] font-black uppercase text-slate-500 mb-1.5 flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5 text-blue-600" />
                    <span>1. Counter / Customer Bill</span>
                  </div>
                  <div
                    style={{ width: paperWidth === "80mm" ? 310 : 240 }}
                    className="bg-white text-black p-4 sm:p-5 rounded shadow-lg border border-slate-300 font-mono text-[11px] leading-snug"
                  >
                    <CounterSlipContent data={printData} formattedDate={formattedDate} paperWidth={paperWidth} />
                  </div>
                </div>

                {/* Tear-off indicator */}
                <div className="hidden md:flex flex-col items-center justify-center self-center text-slate-400">
                  <div className="h-16 w-0 border-l border-dashed border-slate-400" />
                  <span className="text-[10px] font-black uppercase my-1 text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                    ✂ Auto-Cut Tear
                  </span>
                  <div className="h-16 w-0 border-l border-dashed border-slate-400" />
                </div>

                {/* Kitchen KOT Preview Card */}
                <div className="flex flex-col items-center">
                  <div className="text-[11px] font-black uppercase text-slate-500 mb-1.5 flex items-center gap-1">
                    <ChefHat className="w-3.5 h-3.5 text-amber-600" />
                    <span>2. Kitchen Order Ticket (KOT)</span>
                  </div>
                  <div
                    style={{ width: paperWidth === "80mm" ? 310 : 240 }}
                    className="bg-amber-50/50 text-black p-4 sm:p-5 rounded shadow-lg border border-amber-300 font-mono text-[11px] leading-snug"
                  >
                    <KitchenKotContent data={printData} formattedDate={formattedDate} paperWidth={paperWidth} />
                  </div>
                </div>
              </div>
            ) : activeTab === "counter" ? (
              <div
                style={{ width: paperWidth === "80mm" ? 340 : 260 }}
                className="bg-white text-black p-5 rounded shadow-xl border border-slate-300 font-mono text-xs leading-snug"
              >
                <CounterSlipContent data={printData} formattedDate={formattedDate} paperWidth={paperWidth} />
              </div>
            ) : (
              <div
                style={{ width: paperWidth === "80mm" ? 340 : 260 }}
                className="bg-amber-50/50 text-black p-5 rounded shadow-xl border border-amber-300 font-mono text-xs leading-snug"
              >
                <KitchenKotContent data={printData} formattedDate={formattedDate} paperWidth={paperWidth} />
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="bg-white border-t border-slate-200 px-4 py-3 sm:px-6 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Printer Status: Ready (Chrome / Edge ESC/POS direct dialog)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-slate-400">Order: #{data.orderNumber}</span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── PRINTABLE CONTAINER (SHOWN ONLY WHEN WINDOW.PRINT()) ────── */}
      <div className="thermal-print-container-root">
        <div className="thermal-print-container">
          {/* 1. Counter Slip Print Element */}
          {(printMode === "counter" || printMode === "dual") && (
            <div className="print-slip-counter">
              <CounterSlipContent data={printData} formattedDate={formattedDate} paperWidth={paperWidth} />
            </div>
          )}

          {/* 2. Page Break Separator for Dual Print */}
          {printMode === "dual" && <div className="page-tear-break" />}

          {/* 3. Kitchen KOT Print Element */}
          {(printMode === "kitchen" || printMode === "dual") && (
            <div className="print-slip-kitchen">
              <KitchenKotContent data={printData} formattedDate={formattedDate} paperWidth={paperWidth} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── COUNTER RECEIPT COMPONENT ──────────────────────────────────────
function CounterSlipContent({
  data,
  formattedDate,
  paperWidth,
}: {
  data: ThermalPrintOrderData;
  formattedDate: string;
  paperWidth: "80mm" | "58mm";
}) {
  return (
    <div className="text-black">
      {/* Brand Header */}
      <div className="text-center pb-2 border-b border-dashed border-black">
        <div className="font-black text-base sm:text-lg tracking-tight uppercase">
          {data.shopName}
        </div>
        {data.shopAddress && (
          <div className="text-[10px] uppercase text-black font-semibold mt-0.5">
            {data.shopAddress}
          </div>
        )}
        {data.shopPhone && (
          <div className="text-[10px] text-black">Tel: {data.shopPhone}</div>
        )}
        <div className="font-black text-xs uppercase tracking-wider mt-1.5 border border-black inline-block px-2 py-0.5">
          CUSTOMER RECEIPT / BILL
        </div>
      </div>

      {/* Order Meta Info */}
      <div className="py-2 text-[10px] border-b border-dashed border-black space-y-0.5 font-semibold">
        <div className="flex justify-between items-center text-xs font-black">
          <span>ORDER #{data.orderNumber}</span>
          <span className="uppercase font-black border-b border-black">
            {data.orderType === "delivery"
              ? "DELIVERY"
              : data.orderType === "dine_in"
              ? `TABLE ${data.tableNumber || "IN"}`
              : "TAKEAWAY"}
          </span>
        </div>
        {data.tokenNumber && (
          <div className="flex justify-between font-black text-xs text-black">
            <span>TOKEN NO:</span>
            <span>{data.tokenNumber}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Date &amp; Time:</span>
          <span>{formattedDate}</span>
        </div>
        <div className="flex justify-between">
          <span>Customer:</span>
          <span className="font-bold">{data.customerName}</span>
        </div>
        {data.customerPhone && data.customerPhone !== "N/A" && (
          <div className="flex justify-between">
            <span>Phone:</span>
            <span>{data.customerPhone}</span>
          </div>
        )}
        {data.orderType === "delivery" && data.deliveryAddress && (
          <div className="pt-0.5">
            <span className="font-bold">Address: </span>
            <span>{data.deliveryAddress}</span>
          </div>
        )}
        {data.riderName && (
          <div className="flex justify-between">
            <span>Rider:</span>
            <span>{data.riderName} {data.riderPhone ? `(${data.riderPhone})` : ""}</span>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="py-2 border-b border-dashed border-black">
        <div className="flex justify-between font-black text-[10px] border-b border-black pb-1 mb-1">
          <span>QTY &amp; ITEM</span>
          <span>TOTAL</span>
        </div>
        <div className="space-y-1.5">
          {data.items.map((it, idx) => (
            <div key={idx} className="text-[10px]">
              <div className="flex justify-between font-bold">
                <span className="pr-1">
                  {it.qty}x {it.name}
                </span>
                <span className="font-mono font-black shrink-0">
                  {data.currencySymbol} {(it.price * it.qty).toLocaleString()}
                </span>
              </div>
              {it.variation && (
                <div className="text-[9px] pl-3 italic text-black/80">
                  + {it.variation}
                </div>
              )}
              {it.toppings && it.toppings.length > 0 && (
                <div className="text-[9px] pl-3 text-black/80">
                  + {it.toppings.join(", ")}
                </div>
              )}
              {it.dealItems && it.dealItems.length > 0 && (
                <div className="text-[9px] pl-3 text-black/90 font-medium">
                  <span className="font-bold underline">Includes:</span>
                  {it.dealItems.map((d, dIdx) => (
                    <div key={dIdx} className="pl-1.5">• {d}</div>
                  ))}
                </div>
              )}
              {it.notes && (
                <div className="text-[9px] pl-3 font-semibold text-black/90">
                  Note: {it.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Totals Calculation */}
      <div className="py-2 text-[10px] border-b border-dashed border-black space-y-0.5">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{data.currencySymbol} {data.subtotal.toLocaleString()}</span>
        </div>
        {data.discountAmount && data.discountAmount > 0 ? (
          <div className="flex justify-between font-bold">
            <span>Discount {data.promoCode ? `(${data.promoCode})` : ""}:</span>
            <span>- {data.currencySymbol} {data.discountAmount.toLocaleString()}</span>
          </div>
        ) : null}
        {data.deliveryFee && data.deliveryFee > 0 ? (
          <div className="flex justify-between">
            <span>Delivery Charges:</span>
            <span>+ {data.currencySymbol} {data.deliveryFee.toLocaleString()}</span>
          </div>
        ) : data.orderType === "delivery" ? (
          <div className="flex justify-between font-bold">
            <span>Delivery Charges:</span>
            <span>FREE (Rs. 0)</span>
          </div>
        ) : null}
        <div className="flex justify-between font-black text-sm pt-1 border-t border-black mt-1">
          <span>NET PAYABLE:</span>
          <span>{data.currencySymbol} {data.total.toLocaleString()}</span>
        </div>
      </div>

      {/* Payment and Barcode / Thank You */}
      <div className="pt-2 text-center text-[10px] space-y-1">
        <div className="font-bold uppercase">
          Payment: {data.paymentMethod}
        </div>
        {data.notes && (
          <div className="text-[9px] italic border border-black/30 p-1 my-1">
            Order Note: {data.notes}
          </div>
        )}
        <div className="pt-1 font-bold">
          *** THANK YOU FOR VISITING ***
        </div>
        <div className="text-[9px] text-black/70">
          Software by Pizza Management POS
        </div>
        <div className="text-[8px] font-mono tracking-widest text-black/50">
          ||| | |||| || ||||| |||| || |
        </div>
      </div>
    </div>
  );
}

// ─── KITCHEN KOT COMPONENT (CHEF SLIP) ──────────────────────────────
function KitchenKotContent({
  data,
  formattedDate,
  paperWidth,
}: {
  data: ThermalPrintOrderData;
  formattedDate: string;
  paperWidth: "80mm" | "58mm";
}) {
  return (
    <div className="text-black">
      {/* KOT Banner Header */}
      <div className="text-center pb-2 border-b-2 border-black">
        <div className="font-black text-base sm:text-lg tracking-wider uppercase">
          *** KITCHEN ORDER TICKET ***
        </div>
        <div className="text-[10px] uppercase font-bold text-black/80 mt-0.5">
          {data.shopName} (CHEF PREPARATION)
        </div>
      </div>

      {/* Massive Table / Token Badge */}
      <div className="my-2 border-2 border-black py-1.5 px-2 text-center bg-black/5">
        <div className="font-black text-base sm:text-xl uppercase tracking-tight">
          {data.orderType === "dine_in"
            ? `TABLE #${data.tableNumber || "DINE-IN"}`
            : data.tokenNumber
            ? `TOKEN: ${data.tokenNumber}`
            : data.orderType === "delivery"
            ? "🛵 DELIVERY ORDER"
            : "🛍️ TAKEAWAY"}
        </div>
        <div className="flex justify-between items-center text-[10px] font-bold border-t border-black/40 pt-1 mt-1">
          <span>ORDER #{data.orderNumber}</span>
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Service details for Cook */}
      <div className="pb-1.5 text-[10px] border-b border-dashed border-black font-semibold flex justify-between">
        <span>Type: <strong className="uppercase">{data.orderType}</strong> ({data.paymentMethod?.toUpperCase() || "CASH"})</span>
        <span>Guest: {data.customerName?.slice(0, 15)}</span>
      </div>

      {/* Cooking Items List with Checkboxes & Huge Quantities */}
      <div className="py-2 border-b-2 border-black">
        <div className="font-black text-[10px] uppercase border-b border-black pb-1 mb-2 flex justify-between">
          <span>[✓] QTY &amp; ITEM SPECIFICATION</span>
          <span>STATUS</span>
        </div>

        <div className="space-y-3">
          {data.items.map((it, idx) => (
            <div key={idx} className="border-b border-dashed border-black/30 pb-2 last:border-b-0">
              <div className="flex items-start gap-1.5">
                <span className="font-mono text-base font-black leading-none shrink-0">
                  [ ]
                </span>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs sm:text-sm font-black uppercase">
                      <span className="bg-black text-white px-1.5 py-0.2 rounded-sm mr-1 font-mono">
                        {it.qty}X
                      </span>
                      {it.name}
                    </span>
                  </div>

                  {it.variation && (
                    <div className="text-[11px] font-bold text-black mt-0.5 pl-1">
                      ➔ SIZE/CRUST: <span className="uppercase underline">{it.variation}</span>
                    </div>
                  )}

                  {it.toppings && it.toppings.length > 0 && (
                    <div className="text-[10px] font-bold text-black mt-0.5 pl-1">
                      ➔ TOPPINGS: {it.toppings.join(", ")}
                    </div>
                  )}

                  {it.dealItems && it.dealItems.length > 0 && (
                    <div className="text-[10px] pl-2 font-bold text-black border-l-2 border-black/70 my-1 bg-black/5 py-1 rounded-xs">
                      <span className="underline font-black">DEAL PREP ITEMS:</span>
                      {it.dealItems.map((d, dIdx) => (
                        <div key={dIdx} className="font-mono text-[10px]">[ ] {d.toUpperCase()}</div>
                      ))}
                    </div>
                  )}

                  {it.notes && (
                    <div className="text-[10px] font-black text-black bg-black/10 px-1.5 py-0.5 mt-1 rounded border border-black/20">
                      ⚠ COOK NOTE: {it.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kitchen Instructions / Special Notes */}
      {data.notes && (
        <div className="py-2 border-b border-dashed border-black">
          <div className="text-[10px] font-black uppercase text-black">
            SPECIAL INSTRUCTIONS:
          </div>
          <div className="text-[10px] font-bold bg-black/5 p-1.5 border border-black/40 mt-0.5">
            {data.notes}
          </div>
        </div>
      )}

      {/* Cook Sign-off Footer */}
      <div className="pt-2 text-[9px] text-center space-y-2">
        <div className="flex justify-between font-semibold border-b border-dashed border-black/40 pb-1">
          <span>Oven Station: _________</span>
          <span>Chef: _________</span>
        </div>
        <div className="font-bold text-[10px] uppercase">
          *** PASS TO PACKAGING WHEN COMPLETED ***
        </div>
      </div>
    </div>
  );
}
