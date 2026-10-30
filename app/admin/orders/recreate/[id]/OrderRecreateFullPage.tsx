"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Order } from "@/types/menu";
import { recreateOrder, type ShopMenuProduct } from "@/lib/admin-actions";
import { broadcastPoleDisplay } from "@/lib/pole-display";
import {
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  Lock,
  UtensilsCrossed,
  Bike,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  User,
  Phone,
  MapPin,
  Edit2,
  Check,
  X,
  Layers,
  ChefHat,
  Receipt,
} from "lucide-react";

const ArrowLeft = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

export interface RecreateItemState {
  id?: string | number;
  name: string;
  price: number;
  qty: number;
  detail?: string;
  selected_variation?: any;
}

interface Props {
  order: Order;
  initialProducts?: ShopMenuProduct[];
  currencySymbol?: string;
  shopId?: number | null;
}

export default function OrderRecreateFullPage({
  order,
  initialProducts = [],
  currencySymbol = "Rs.",
  shopId,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Order Items
  const [items, setItems] = useState<RecreateItemState[]>(() => {
    const rawItems = Array.isArray(order.items) ? order.items : [];
    if (rawItems.length === 0) {
      return [{ name: "Standard Order", price: Number(order.total) || 0, qty: 1 }];
    }
    return rawItems.map((it: any) => ({
      id: it.id,
      name: it.name || it.product?.name || "Menu Item",
      price: Number(it.price || it.product?.price || 0),
      qty: Math.max(1, Number(it.quantity || it.qty || 1)),
      detail:
        it.selected_variation?.name ||
        (typeof it.selected_variation === "string" ? it.selected_variation : undefined) ||
        it.detail ||
        undefined,
      selected_variation: it.selected_variation || null,
    }));
  });

  // Settings
  const [resetTime, setResetTime] = useState(true);
  const [status, setStatus] = useState<string>(
    order.status === "delivered" || order.status === "cancelled" ? "preparing" : order.status
  );
  const [deliveryFee, setDeliveryFee] = useState<number>(Number(order.delivery_fee) || 0);
  const [notesInput, setNotesInput] = useState<string>(order.notes || "");

  // Customer details
  const [customerName, setCustomerName] = useState<string>(order.customer_name || "");
  const [customerPhone, setCustomerPhone] = useState<string>(order.customer_phone || "");
  const [deliveryAddress, setDeliveryAddress] = useState<string>(() => {
    if (order.delivery_address) return order.delivery_address;
    if (order.notes?.includes("[DELIVERY:")) {
      const match = order.notes.match(/\[DELIVERY:\s*Address:\s*([^|]+)/i);
      if (match) return match[1].trim();
    }
    return "";
  });
  const [tableNumber, setTableNumber] = useState<string>(order.table_number || "");
  const [tokenNumber, setTokenNumber] = useState<string>(order.token_number || "");
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);

  // Search & Catalog Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedVariations, setSelectedVariations] = useState<Record<number, any>>({});

  // Custom Item Form state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState<number | "">("");
  const [customQty, setCustomQty] = useState<number>(1);

  // Extract Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    initialProducts.forEach((p) => {
      if (p.category_name) set.add(p.category_name);
    });
    return ["all", ...Array.from(set).sort()];
  }, [initialProducts]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return initialProducts.filter((product) => {
      // Category filter
      if (selectedCategory !== "all" && product.category_name !== selectedCategory) {
        return false;
      }
      // Search filter
      if (q) {
        const matchName = product.name.toLowerCase().includes(q);
        const matchCat = (product.category_name || "").toLowerCase().includes(q);
        return matchName || matchCat;
      }
      return true;
    });
  }, [initialProducts, selectedCategory, searchQuery]);

  // Item quantity controls
  const handleUpdateQty = (index: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((it, idx) => {
          if (idx !== index) return it;
          return { ...it, qty: it.qty + delta };
        })
        .filter((it) => it.qty > 0)
    );
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdatePrice = (index: number, newPrice: number) => {
    setItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, price: Math.max(0, newPrice) } : it))
    );
  };

  // Add Product from Catalog
  const handleAddProduct = (product: ShopMenuProduct) => {
    const variation = selectedVariations[product.id] || (product.variations && product.variations[0]) || null;
    const price = variation ? Number(variation.price) : Number(product.price);
    const detail = variation ? variation.name : undefined;

    const existingIndex = items.findIndex(
      (it) => String(it.id) === String(product.id) && it.detail === detail
    );

    if (existingIndex >= 0) {
      handleUpdateQty(existingIndex, 1);
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price,
          qty: 1,
          detail,
          selected_variation: variation ? { name: variation.name, price } : null,
        },
      ]);
    }
  };

  // Add Custom Item
  const handleAddCustomItem = () => {
    if (!customName.trim()) return;
    const priceVal = Number(customPrice) || 0;

    setItems((prev) => [
      ...prev,
      {
        name: customName.trim(),
        price: priceVal,
        qty: Math.max(1, customQty),
      },
    ]);

    setCustomName("");
    setCustomPrice("");
    setCustomQty(1);
    setShowCustomModal(false);
  };

  // Live Totals
  const itemsSubtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + it.price * it.qty, 0);
  }, [items]);

  const grandTotal = useMemo(() => {
    return Math.max(0, itemsSubtotal + (Number(deliveryFee) || 0));
  }, [itemsSubtotal, deliveryFee]);

  // Real-time broadcast to Counter Pole Display
  useEffect(() => {
    try {
      broadcastPoleDisplay({
        status: "active",
        shopId: shopId || order.shop_id || null,
        orderNumber: order.order_number,
        customerName: customerName || order.customer_name || undefined,
        orderType: (order.order_type as any) || "takeaway",
        items: items.map((it) => ({
          name: it.name,
          qty: it.qty,
          price: it.price,
          detail: it.detail,
        })),
        subtotal: itemsSubtotal,
        deliveryFee: Number(deliveryFee) || 0,
        total: grandTotal,
      });
    } catch {}
  }, [order, items, itemsSubtotal, deliveryFee, grandTotal, shopId, customerName]);

  // Submit Recreated Order
  const handleSaveRecreatedOrder = () => {
    if (items.length === 0) {
      setErrorMsg("Order must contain at least 1 item.");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      try {
        const res = await recreateOrder({
          orderId: order.id,
          items: items.map((it) => ({
            id: it.id,
            name: it.name,
            price: it.price,
            qty: it.qty,
            quantity: it.qty,
            detail: it.detail,
            selected_variation: it.selected_variation,
          })),
          total: grandTotal,
          deliveryFee: Number(deliveryFee) || 0,
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          deliveryAddress: deliveryAddress.trim() || undefined,
          tableNumber: tableNumber.trim() || undefined,
          tokenNumber: tokenNumber.trim() || undefined,
          status,
          notes: notesInput.trim() || undefined,
          resetTime,
        });

        if (res.success) {
          setSuccessMsg("Order successfully recreated! Redirecting to Live Orders...");
          setTimeout(() => {
            router.push("/admin/orders");
            router.refresh();
          }, 600);
        } else {
          setErrorMsg(res.error || "Failed to recreate order.");
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to recreate order.");
      }
    });
  };

  const originalTimeFormatted = order.created_at
    ? new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";
  const currentTimeFormatted = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-12">
      {/* ─── TOP MASTER NAVBAR ────────────────────────────────────────── */}
      <header className="bg-slate-900 text-white px-4 sm:px-6 py-3 sticky top-0 z-30 shadow-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Live Orders</span>
          </Link>
          <div className="h-5 w-px bg-slate-700 hidden sm:block" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-orange-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Recreate Order
            </span>
            <span className="font-mono font-bold text-sm text-amber-300 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
              <Lock size={12} className="text-emerald-400" />
              {order.order_number}
              <span className="text-[10px] text-slate-400 font-sans font-medium">(ID Kept Same)</span>
            </span>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <div className="text-[11px] text-slate-400 font-medium">Recreated Total</div>
            <div className="text-base font-black text-emerald-400 font-mono">
              {currencySymbol}{grandTotal.toLocaleString()}
            </div>
          </div>

          <button
            type="button"
            disabled={isPending || items.length === 0}
            onClick={handleSaveRecreatedOrder}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={15} className={isPending ? "animate-spin" : ""} />
            <span>{isPending ? "Saving..." : "Confirm & Recreate"}</span>
          </button>
        </div>
      </header>

      {/* Alerts */}
      {errorMsg && (
        <div className="mx-4 sm:mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="mx-4 sm:mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ─── ORDER SUMMARY STRIP ───────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          {/* Customer & Destination */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <User size={15} className="text-orange-600" />
                {customerName || "Walk-in Guest"}
              </span>
              {customerPhone && (
                <span className="text-xs text-slate-500 font-mono font-medium flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                  <Phone size={12} className="text-slate-400" />
                  {customerPhone}
                </span>
              )}
            </div>

            {deliveryAddress ? (
              <div className="flex items-center gap-1 text-xs text-slate-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                <Bike size={13} className="text-orange-600" />
                <span className="font-bold">Delivery:</span>
                <span className="max-w-xs truncate">{deliveryAddress}</span>
              </div>
            ) : tableNumber ? (
              <div className="flex items-center gap-1 text-xs text-slate-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                <UtensilsCrossed size={13} className="text-amber-600" />
                <span className="font-bold">Table #{tableNumber}</span>
              </div>
            ) : tokenNumber ? (
              <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                <ShoppingBag size={13} className="text-slate-600" />
                <span className="font-bold">Token {tokenNumber}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                <ShoppingBag size={13} />
                <span>Takeaway</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsEditingCustomer(!isEditingCustomer)}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer underline underline-offset-2"
            >
              <Edit2 size={11} />
              <span>{isEditingCustomer ? "Close Edit" : "Edit Customer"}</span>
            </button>
          </div>

          {/* Time Reset & Status Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <Clock size={13} className="text-orange-600" />
              <span>Original: <strong>{originalTimeFormatted || "--:--"}</strong></span>
              <span className="text-slate-400">→</span>
              <span>New: <strong className="text-orange-600">{currentTimeFormatted}</strong></span>
              <label className="ml-2 inline-flex items-center gap-1.5 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={resetTime}
                  onChange={(e) => setResetTime(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
                <span>Reset Time</span>
              </label>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-slate-500">Kitchen Status:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="pending">Pending Approval</option>
                <option value="preparing">In Kitchen (Preparing)</option>
                <option value="ready">Ready for Pickup</option>
                <option value="delivered">Delivered (Complete)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inline Customer Edit Form */}
        {isEditingCustomer && (
          <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-xl border">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Guest Name"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Phone Number</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="0300-1234567"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Delivery Address</label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Street, Sector, City"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Table / Token</label>
                <input
                  type="text"
                  value={tableNumber || tokenNumber}
                  onChange={(e) => {
                    setTableNumber(e.target.value);
                    setTokenNumber(e.target.value);
                  }}
                  placeholder="e.g. 4 or T-12"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsEditingCustomer(false)}
                className="mt-4 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ─── FULL PAGE 2-COLUMN MAIN CONTENT ───────────────────────────── */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* ─── LEFT COLUMN: PRODUCT SEARCH & MENU CATALOG (8 COLS) ───── */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          {/* Search Bar & Custom Item Trigger */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by name or category (e.g. Fajita, Tikka, Burger, Fries, Drink)..."
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowCustomModal(true)}
                className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
                title="Add custom off-menu item"
              >
                <Plus size={14} className="text-amber-700 stroke-[3]" />
                <span className="hidden sm:inline">Custom Item</span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                const label = cat === "all" ? "All Products" : cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? "bg-orange-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
              <span>Menu Items ({filteredProducts.length})</span>
              <span>Click any item or size to add</span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
                <Search size={32} className="mx-auto text-slate-300" />
                <div className="text-sm font-bold text-slate-700">No products match &quot;{searchQuery}&quot;</div>
                <p className="text-xs text-slate-400">Try typing another word or add as a custom item.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredProducts.map((product) => {
                  const currentVar = selectedVariations[product.id] || (product.variations && product.variations[0]) || null;
                  const effectivePrice = currentVar ? Number(currentVar.price) : Number(product.price);
                  const inOrderCount = items
                    .filter((it) => String(it.id) === String(product.id))
                    .reduce((sum, it) => sum + it.qty, 0);

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl border border-slate-200/90 hover:border-orange-300 p-3.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-3 group relative"
                    >
                      {/* Product Header */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-black text-slate-900 text-sm leading-snug group-hover:text-orange-600 transition-colors">
                            {product.name}
                          </h4>
                          {inOrderCount > 0 && (
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0">
                              {inOrderCount} in ticket
                            </span>
                          )}
                        </div>

                        {product.category_name && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {product.category_name}
                          </span>
                        )}
                      </div>

                      {/* Size Variations Chips */}
                      {product.variations && product.variations.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {product.variations.map((v: any, vIdx: number) => {
                            const isVarSelected = currentVar?.name === v.name;
                            return (
                              <button
                                key={vIdx}
                                type="button"
                                onClick={() =>
                                  setSelectedVariations((prev) => ({ ...prev, [product.id]: v }))
                                }
                                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                  isVarSelected
                                    ? "bg-orange-500 text-white shadow-2xs"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                {v.name}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Price & Add Action */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="font-mono font-black text-slate-900 text-sm">
                          {currencySymbol}{effectivePrice.toLocaleString()}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddProduct(product)}
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-black rounded-xl flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                        >
                          <Plus size={13} className="stroke-[3]" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT COLUMN: CURRENT ORDER TICKET & SUMMARY (4-5 COLS) ─ */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden sticky top-20 flex flex-col">
            {/* Ticket Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt size={17} className="text-orange-400" />
                <h3 className="font-black text-sm tracking-tight">Order Ticket</h3>
              </div>
              <span className="bg-slate-800 text-slate-300 font-bold text-xs px-2.5 py-0.5 rounded-full border border-slate-700">
                {items.length} {items.length === 1 ? "Item" : "Items"}
              </span>
            </div>

            {/* Ticket Items List */}
            <div className="p-4 divide-y divide-slate-100 max-h-[46vh] overflow-y-auto space-y-2">
              {items.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                  <ChefHat size={32} className="mx-auto text-slate-300" />
                  <div className="font-bold text-slate-700">Order ticket is empty</div>
                  <p className="text-slate-400">Click &quot;+ Add&quot; on any product on the left to include it.</p>
                </div>
              ) : (
                items.map((item, idx) => {
                  const lineTotal = item.price * item.qty;

                  return (
                    <div key={idx} className="pt-2.5 first:pt-0 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-slate-900 text-xs sm:text-sm truncate">
                            {item.name}
                          </div>
                          {item.detail && (
                            <span className="inline-block text-[10px] font-extrabold text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.2 rounded mt-0.5">
                              {item.detail}
                            </span>
                          )}
                        </div>

                        {/* Line Total */}
                        <div className="font-mono font-black text-slate-900 text-xs sm:text-sm text-right shrink-0">
                          {currencySymbol}{lineTotal.toLocaleString()}
                        </div>
                      </div>

                      {/* Controls: Price override, Stepper, Delete */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                          <span>@ {currencySymbol}</span>
                          <input
                            type="number"
                            min="0"
                            value={item.price}
                            onChange={(e) => handleUpdatePrice(idx, Number(e.target.value) || 0)}
                            className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded text-right focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Stepper */}
                          <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(idx, -1)}
                              className="w-6 h-6 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
                            >
                              −
                            </button>
                            <span className="px-2 text-xs font-black font-mono text-slate-900">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(idx, 1)}
                              className="w-6 h-6 text-slate-600 hover:bg-slate-200 flex items-center justify-center"
                            >
                              <Plus size={11} />
                            </button>
                          </div>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-300 hover:text-red-600 p-1 rounded transition-colors"
                            title="Remove item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Ticket Totals & Notes */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-200 space-y-3">
              {/* Delivery Fee Input */}
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-mono font-bold text-slate-800">
                  {currencySymbol}{itemsSubtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <Bike size={12} className="text-orange-600" />
                  <span>Delivery Fee:</span>
                </span>
                <div className="flex items-center gap-1 font-mono font-bold">
                  <span>{currencySymbol}</span>
                  <input
                    type="number"
                    min="0"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(Math.max(0, Number(e.target.value) || 0))}
                    className="w-16 px-1.5 py-0.5 text-xs text-right bg-white border border-slate-300 rounded font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Order Notes */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Kitchen / Delivery Notes:
                </label>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="e.g. Extra spicy, send with ketchup..."
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {/* Grand Total */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Grand Total</div>
                  <div className="text-[10px] text-slate-400">Order ID preserved</div>
                </div>
                <div className="font-mono font-black text-xl text-slate-900">
                  {currencySymbol}{grandTotal.toLocaleString()}
                </div>
              </div>

              {/* Confirm Recreate Action */}
              <button
                type="button"
                disabled={isPending || items.length === 0}
                onClick={handleSaveRecreatedOrder}
                className="w-full py-3 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm rounded-xl shadow-md shadow-orange-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={16} className={isPending ? "animate-spin" : ""} />
                <span>{isPending ? "Recreating Order..." : "Confirm & Recreate Order"}</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ─── CUSTOM ITEM POPUP MODAL ───────────────────────────────────── */}
      {showCustomModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCustomModal(false);
          }}
        >
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Plus size={16} className="text-orange-600" />
                Add Custom Off-Menu Item
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Item Title</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. 1.5L Coke, Extra Mayo Dip, Special Wrap"
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Price ({currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={customQty}
                    onChange={(e) => setCustomQty(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-xs font-black text-center bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!customName.trim()}
                onClick={handleAddCustomItem}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black rounded-xl disabled:opacity-40"
              >
                Add to Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
