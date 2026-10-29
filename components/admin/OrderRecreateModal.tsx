"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import type { Order } from "@/types/menu";
import { recreateOrder, getShopMenuProducts, type ShopMenuProduct } from "@/lib/admin-actions";
import { broadcastPoleDisplay } from "@/lib/pole-display";
import {
  X,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  Lock,
  UtensilsCrossed,
  Bike,
  ShoppingBag,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  User,
  Phone,
  MapPin,
  Pizza,
  Layers,
  Edit2,
  Check,
} from "lucide-react";

export interface RecreateItemState {
  id?: string | number;
  name: string;
  price: number;
  qty: number;
  detail?: string;
  selected_variation?: any;
}

export interface OrderRecreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  currencySymbol?: string;
  shopId?: number | null;
  initialProducts?: ShopMenuProduct[];
  onSuccess?: (updatedOrder: Order) => void;
}

export default function OrderRecreateModal({
  isOpen,
  onClose,
  order,
  currencySymbol = "Rs.",
  shopId,
  initialProducts = [],
  onSuccess,
}: OrderRecreateModalProps) {
  const [items, setItems] = useState<RecreateItemState[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ShopMenuProduct[]>(initialProducts);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Settings
  const [resetTime, setResetTime] = useState(true);
  const [status, setStatus] = useState<string>("preparing");
  const [notesInput, setNotesInput] = useState<string>("");
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  // Customer & Delivery info state
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);

  // Add Item state
  const [addMode, setAddMode] = useState<"menu" | "custom">("menu");
  const [selectedProductId, setSelectedProductId] = useState<string | number>("");
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [addQty, setAddQty] = useState<number>(1);

  // Custom Item Form state
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState<number | "">("");
  const [customQty, setCustomQty] = useState<number>(1);

  // Initialize items from current order when opened
  useEffect(() => {
    if (!order) return;

    const rawItems = Array.isArray(order.items) ? order.items : [];
    const mapped: RecreateItemState[] = rawItems.map((it: any) => ({
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

    setItems(mapped.length > 0 ? mapped : [{ name: "Standard Pizza", price: Number(order.total) || 0, qty: 1 }]);
    setStatus(order.status === "delivered" || order.status === "cancelled" ? "preparing" : order.status);
    setDeliveryFee(Number(order.delivery_fee) || 0);
    setNotesInput("");
    setErrorMsg(null);
    setResetTime(true);
    setSelectedProductId("");
    setSelectedVariation(null);
    setAddQty(1);
    setCustomName("");
    setCustomPrice("");
    setCustomQty(1);
    setIsEditingCustomer(false);

    // Initialize Customer Info
    let initialAddress = order.delivery_address || "";
    if (!initialAddress && order.notes?.includes("[DELIVERY:")) {
      const match = order.notes.match(/\[DELIVERY:\s*Address:\s*([^|]+)/i);
      if (match) initialAddress = match[1].trim();
    }
    setCustomerName(order.customer_name || "");
    setCustomerPhone(order.customer_phone || "");
    setDeliveryAddress(initialAddress);
  }, [order]);

  // Load menu products with variations
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoadingProducts(true);
    getShopMenuProducts(shopId || order?.shop_id)
      .then((data) => {
        if (mounted && data) {
          setAvailableProducts(data);
        }
      })
      .catch((err) => console.error("Failed to fetch products:", err))
      .finally(() => {
        if (mounted) setLoadingProducts(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, shopId, order?.shop_id]);

  // Selected product object for size variations
  const currentSelectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return availableProducts.find((p) => String(p.id) === String(selectedProductId)) || null;
  }, [selectedProductId, availableProducts]);

  // Reset selected variation when product changes
  useEffect(() => {
    if (currentSelectedProduct && currentSelectedProduct.variations && currentSelectedProduct.variations.length > 0) {
      setSelectedVariation(currentSelectedProduct.variations[0]);
    } else {
      setSelectedVariation(null);
    }
  }, [currentSelectedProduct]);

  // Calculate live totals
  const itemsSubtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + it.price * it.qty, 0);
  }, [items]);

  const grandTotal = useMemo(() => {
    return Math.max(0, itemsSubtotal + (Number(deliveryFee) || 0));
  }, [itemsSubtotal, deliveryFee]);

  // Real-time broadcast to Counter Pole Display screen
  useEffect(() => {
    if (!isOpen || !order) return;
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
  }, [isOpen, order, items, itemsSubtotal, deliveryFee, grandTotal, shopId, customerName]);

  if (!isOpen || !order) return null;

  // Item quantity steppers
  const handleUpdateQty = (index: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((it, idx) => {
          if (idx !== index) return it;
          const nextQty = it.qty + delta;
          return { ...it, qty: nextQty };
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

  // Add Product from Menu dropdown
  const handleAddSelectedProduct = () => {
    if (!currentSelectedProduct) return;

    const price = selectedVariation ? Number(selectedVariation.price) : Number(currentSelectedProduct.price);
    const detail = selectedVariation ? selectedVariation.name : undefined;

    const existingIndex = items.findIndex(
      (it) => String(it.id) === String(currentSelectedProduct.id) && it.detail === detail
    );

    if (existingIndex >= 0) {
      handleUpdateQty(existingIndex, addQty);
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: currentSelectedProduct.id,
          name: currentSelectedProduct.name,
          price,
          qty: Math.max(1, addQty),
          detail,
          selected_variation: selectedVariation ? { name: selectedVariation.name, price } : null,
        },
      ]);
    }

    setSelectedProductId("");
    setSelectedVariation(null);
    setAddQty(1);
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
  };

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
          status,
          notes: notesInput.trim() || undefined,
          resetTime,
        });

        if (res.success && res.order) {
          if (onSuccess) {
            onSuccess(res.order);
          }
          onClose();
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
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* ─── MODAL HEADER ────────────────────────────────────────── */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
              <RefreshCw size={20} className={isPending ? "animate-spin" : ""} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="bg-gradient-to-r from-orange-600 to-amber-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  Order Recreate System
                </span>
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                  <Lock size={10} className="text-emerald-600" />
                  {order.order_number} <span className="text-emerald-600/70 font-sans font-medium">(ID Kept Same)</span>
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                Recreate &amp; Modify Customer Order
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* ─── SCROLLABLE CONTENT BODY ─────────────────────────────── */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-semibold flex items-center gap-2.5 shadow-xs">
              <AlertCircle size={17} className="shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ─── CUSTOMER & TIME CARD ──────────────────────────────── */}
          <div className="bg-gradient-to-br from-amber-50/60 via-orange-50/30 to-amber-50/50 border border-amber-200/80 rounded-2xl p-4 space-y-3 shadow-xs">
            {/* Top: Customer Details Header & Edit Button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 text-xs text-slate-800 flex-1 min-w-0">
                <div className="w-7 h-7 rounded-full bg-orange-100 border border-orange-200 text-orange-700 flex items-center justify-center shrink-0">
                  <User size={13} />
                </div>
                <div className="truncate flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-slate-900 text-sm truncate">
                    {customerName || order.customer_name || "Guest Customer"}
                  </span>
                  {(customerPhone || order.customer_phone) && (
                    <span className="bg-white/80 border border-amber-200 text-amber-900 font-mono font-bold text-xs px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 shadow-2xs">
                      <Phone size={10} className="text-orange-600" />
                      {customerPhone || order.customer_phone}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingCustomer(!isEditingCustomer)}
                className="text-[11px] font-bold text-orange-800 hover:text-orange-950 bg-white border border-amber-300 hover:bg-orange-100/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95"
              >
                <Edit2 size={11} className="text-orange-600" />
                <span>{isEditingCustomer ? "Done Editing" : "Change Info"}</span>
              </button>
            </div>

            {/* Editable Customer Fields (Toggled) */}
            {isEditingCustomer && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-amber-200/70 animate-in fade-in duration-150">
                <div>
                  <label className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer Name"
                    className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-amber-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 03334867615"
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white border border-amber-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block mb-1">
                    Delivery Address
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="House, Street, Area"
                    className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-amber-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs"
                  />
                </div>
              </div>
            )}

            {/* Delivery address display if present and not editing */}
            {!isEditingCustomer && (deliveryAddress || order.delivery_address) && (
              <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-white/60 border border-amber-100 rounded-xl px-2.5 py-1">
                <MapPin size={12} className="text-orange-600 shrink-0" />
                <span className="truncate font-medium">{deliveryAddress || order.delivery_address}</span>
              </div>
            )}

            {/* Bottom: Time Info & Reset Toggle */}
            <div className="flex items-center justify-between pt-2.5 border-t border-amber-200/70 gap-2 flex-wrap">
              <div className="text-xs text-slate-700 font-medium flex items-center gap-2 flex-wrap">
                <Clock size={13} className="text-orange-600 shrink-0" />
                <span>
                  Original: <strong className="font-mono text-slate-900 font-bold">{originalTimeFormatted || "--:--"}</strong>
                </span>
                <span className="text-orange-500 font-bold">→</span>
                <span>
                  New: <strong className="font-mono text-orange-700 font-bold">{currentTimeFormatted}</strong>
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">NOW</span>
              </div>

              <label
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                  resetTime
                    ? "bg-white border-orange-400 text-orange-900 shadow-2xs ring-1 ring-orange-200"
                    : "bg-amber-100/40 border-amber-200 text-slate-500"
                }`}
              >
                <input
                  type="checkbox"
                  checked={resetTime}
                  onChange={(e) => setResetTime(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
                <span>Reset Time to Now</span>
              </label>
            </div>
          </div>

          {/* ─── ORDER ITEMS SECTION ───────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>Order Items</span>
                <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2 py-0.2 rounded-full">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </span>
              </h3>
              <span className="text-[11px] text-slate-400">
                Adjust quantities or edit price per item
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
              {items.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs space-y-1">
                  <p className="font-semibold text-slate-600">No items in this order.</p>
                  <p>Add products using the selector below to continue.</p>
                </div>
              ) : (
                items.map((item, idx) => {
                  const lineTotal = item.price * item.qty;

                  return (
                    <div
                      key={idx}
                      className="p-3 sm:p-3.5 text-xs flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-slate-900 text-sm">
                            {item.name}
                          </span>
                          {item.detail && (
                            <span className="bg-orange-50 text-orange-700 border border-orange-200 text-[11px] font-extrabold px-2 py-0.5 rounded-lg shadow-2xs">
                              {item.detail}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Stepper & Price */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {/* Stepper */}
                        <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, -1)}
                            className="w-7 h-7 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors flex items-center justify-center font-black text-sm cursor-pointer"
                            title="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="px-2 text-xs font-black font-mono text-slate-900 min-w-6 text-center">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, 1)}
                            className="w-7 h-7 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors flex items-center justify-center cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Unit Price Input */}
                        <div
                          className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all"
                          title="Click to override unit price"
                        >
                          <span className="text-[10px] text-slate-400 font-bold mr-1">@ {currencySymbol}</span>
                          <input
                            type="number"
                            min="0"
                            value={item.price}
                            onChange={(e) => handleUpdatePrice(idx, Number(e.target.value) || 0)}
                            className="w-14 sm:w-16 text-xs font-mono font-bold text-slate-900 bg-transparent text-right focus:outline-none"
                          />
                        </div>

                        {/* Line Total */}
                        <div className="font-mono font-black text-slate-900 min-w-16 sm:min-w-20 text-right text-xs sm:text-sm">
                          {currencySymbol}{lineTotal.toLocaleString()}
                        </div>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ─── ADD PRODUCT TO ORDER BOX ──────────────────────────── */}
          <div className="border border-amber-200/90 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Plus size={14} className="text-orange-600 stroke-[3]" />
                Add Product to Order
                <span className="text-slate-400 font-normal text-[11px] hidden sm:inline">(e.g. +1 Burger, Drink, Pizza)</span>
              </span>

              {/* Mode Toggle */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setAddMode("menu")}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    addMode === "menu"
                      ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  From Menu
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode("custom")}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    addMode === "custom"
                      ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Custom Item
                </button>
              </div>
            </div>

            {addMode === "menu" ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {/* Select Product */}
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="flex-1 min-w-[200px] px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs cursor-pointer"
                  >
                    <option value="">-- Select Product from Menu --</option>
                    {availableProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.category_name ? `(${p.category_name})` : ""} - {currencySymbol}{Number(p.price).toLocaleString()}
                      </option>
                    ))}
                  </select>

                  {/* Quantity */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-slate-500 font-bold">Qty:</span>
                    <input
                      type="number"
                      min="1"
                      value={addQty}
                      onChange={(e) => setAddQty(Math.max(1, Number(e.target.value) || 1))}
                      className="w-14 px-2 py-2 text-xs font-black text-center bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs"
                    />
                  </div>

                  {/* Add Button */}
                  <button
                    type="button"
                    disabled={!selectedProductId}
                    onClick={handleAddSelectedProduct}
                    className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-black rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm shadow-orange-600/20 cursor-pointer active:scale-95 shrink-0"
                  >
                    <Plus size={14} className="stroke-[3]" />
                    <span>Add Item</span>
                  </button>
                </div>

                {/* Size Variations Chips if available */}
                {currentSelectedProduct?.variations && currentSelectedProduct.variations.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1 pl-0.5">
                    <span className="text-[11px] font-extrabold text-slate-600 flex items-center gap-1">
                      <Pizza size={12} className="text-orange-600" />
                      Select Size:
                    </span>
                    {currentSelectedProduct.variations.map((v: any, idx: number) => {
                      const isSelected = selectedVariation?.name === v.name;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedVariation(v)}
                          className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? "bg-orange-600 text-white shadow-sm shadow-orange-600/20 ring-2 ring-orange-600/30"
                              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                          }`}
                        >
                          {isSelected && <Check size={11} className="stroke-[3]" />}
                          <span>{v.name}</span>
                          <span className={isSelected ? "text-orange-100 font-mono" : "text-slate-400 font-mono text-[11px]"}>
                            ({currencySymbol}{Number(v.price).toLocaleString()})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Custom Item Inputs */
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Item Name (e.g. 1.5L Drink, Extra Dip)"
                  className="flex-1 min-w-[180px] px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs"
                />
                <input
                  type="number"
                  min="0"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Price"
                  className="w-24 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold text-right focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs"
                />
                <input
                  type="number"
                  min="1"
                  value={customQty}
                  onChange={(e) => setCustomQty(Math.max(1, Number(e.target.value) || 1))}
                  className="w-14 px-2 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 text-center font-black focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs"
                />
                <button
                  type="button"
                  disabled={!customName.trim()}
                  onClick={handleAddCustomItem}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-black rounded-xl transition-all disabled:opacity-40 flex items-center gap-1.5 shadow-sm shadow-orange-600/20 cursor-pointer active:scale-95 shrink-0"
                >
                  <Plus size={14} className="stroke-[3]" />
                  <span>Add Custom</span>
                </button>
              </div>
            )}
          </div>

          {/* ─── STATUS & REASON ROW ───────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1">
                Status After Recreate
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs cursor-pointer"
              >
                <option value="preparing">🍳 Preparing (Send to Kitchen)</option>
                <option value="ready">🛵 Ready (Pickup / Dispatch)</option>
                <option value="delivered">✅ Delivered / Served</option>
                <option value="pending">⏳ Pending Approval</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1">
                Reason / Request Note
              </label>
              <input
                type="text"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="e.g. Customer called to add 1 burger"
                className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* ─── MODAL FOOTER ────────────────────────────────────────── */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/90 backdrop-blur-md flex items-center justify-between gap-3 sticky bottom-0 z-20 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 text-xs font-medium">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-all cursor-pointer text-xs active:scale-95 shadow-2xs"
            >
              Cancel
            </button>

            <div className="text-slate-500 hidden sm:flex items-center gap-2.5">
              <span>Subtotal: <strong className="font-mono text-slate-900 font-bold">{currencySymbol}{itemsSubtotal.toLocaleString()}</strong></span>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <Bike size={13} className="text-slate-400 shrink-0" />
                <span className="text-slate-600 font-bold">Delivery:</span>
                <span className="text-slate-400 font-mono text-[11px]">{currencySymbol}</span>
                <input
                  type="number"
                  min="0"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(Math.max(0, Number(e.target.value) || 0))}
                  className="w-16 px-1.5 py-1 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-right shadow-2xs"
                  title="Edit delivery charge"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Total Badge */}
            <div className="text-right">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 block -mb-0.5">Grand Total</span>
              <span className="text-base sm:text-xl font-black font-mono text-slate-900">
                {currencySymbol}{grandTotal.toLocaleString()}
              </span>
            </div>

            <button
              type="button"
              disabled={isPending || items.length === 0}
              onClick={handleSaveRecreatedOrder}
              className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs sm:text-sm font-black rounded-xl transition-all shadow-md shadow-orange-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
              <span>{isPending ? "Recreating..." : "Save & Recreate Order"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
