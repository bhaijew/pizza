"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import Link from "next/link";
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
  ExternalLink,
  ChefHat,
  Filter,
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

  // Product Catalog & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
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
    setSearchQuery("");
    setSelectedCategory("all");

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

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    availableProducts.forEach((p) => {
      if (p.category_name && p.category_name.trim()) {
        set.add(p.category_name.trim());
      }
    });
    return ["all", ...Array.from(set)];
  }, [availableProducts]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return availableProducts.filter((p) => {
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category_name && p.category_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        selectedCategory === "all" ||
        (p.category_name && p.category_name.toLowerCase() === selectedCategory.toLowerCase());

      return matchesSearch && matchesCat;
    });
  }, [availableProducts, searchQuery, selectedCategory]);

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

  // Select a product from the visual grid
  const handleSelectProductCard = (product: ShopMenuProduct) => {
    setSelectedProductId(product.id);
    setAddQty(1);
    if (product.variations && product.variations.length > 0) {
      setSelectedVariation(product.variations[0]);
    } else {
      setSelectedVariation(null);
    }
  };

  // Add Product from Menu
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
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      {/* ─── FULL SIZE MODAL CONTAINER (EXPANSIVE WIDESCREEN) ────── */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-6xl xl:max-w-7xl h-[94vh] max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* ─── HEADER BAR ────────────────────────────────────────── */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
              <RefreshCw size={20} className={isPending ? "animate-spin" : ""} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="bg-gradient-to-r from-orange-600 to-amber-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  Recreate Order Window
                </span>
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                  <Lock size={10} className="text-emerald-600" />
                  Order #{order.order_number}
                  <span className="text-emerald-600/70 font-sans font-medium hidden sm:inline">(ID Kept Same)</span>
                </span>
                <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-full capitalize">
                  {(order as any).type || (order as any).order_type || "takeaway"}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                Recreate &amp; Modify Customer Order
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href={`/admin/orders/recreate/${order.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-extrabold text-xs border border-orange-200 transition-colors shadow-2xs"
              title="Open full page recreate view"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">Full Page View</span>
            </Link>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
              title="Close window"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ─── ERROR ALERT ─────────────────────────────────────────── */}
        {errorMsg && (
          <div className="mx-5 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2 shrink-0">
            <AlertCircle size={16} className="shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ─── TWO-COLUMN WORKSPACE BODY ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden min-h-0">
          
          {/* ════════════════════════════════════════════════════════════
              LEFT COLUMN: ORDER ITEMS, CUSTOMER & SETTINGS (7 COLS)
              ════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 flex flex-col h-full overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200">
            
            {/* Scrollable Items & Details Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              
              {/* Customer Strip & Time Settings */}
              <div className="bg-gradient-to-br from-amber-50/70 via-orange-50/30 to-amber-50/50 border border-amber-200/80 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-xs flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-orange-100 border border-orange-200 text-orange-700 flex items-center justify-center shrink-0">
                      <User size={13} />
                    </div>
                    <div className="truncate flex items-center gap-2">
                      <span className="font-black text-slate-900 text-sm truncate">
                        {customerName || order.customer_name || "Guest Customer"}
                      </span>
                      {(customerPhone || order.customer_phone) && (
                        <span className="text-[11px] font-mono font-bold text-slate-500 bg-white/80 border border-amber-200/60 px-1.5 py-0.5 rounded">
                          {customerPhone || order.customer_phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Edit Customer Button */}
                  <button
                    type="button"
                    onClick={() => setIsEditingCustomer(!isEditingCustomer)}
                    className="text-[11px] font-extrabold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer bg-white/80 border border-orange-200 px-2 py-0.5 rounded-lg shadow-2xs"
                  >
                    <Edit2 size={11} />
                    <span>{isEditingCustomer ? "Done" : "Edit Customer"}</span>
                  </button>
                </div>

                {/* Delivery Address badge */}
                {(deliveryAddress || order.delivery_address) && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-white/90 border border-amber-200/80 rounded-xl px-2.5 py-1">
                    <MapPin size={12} className="text-orange-600 shrink-0" />
                    <span className="font-bold">Delivery:</span>
                    <span className="truncate">{deliveryAddress || order.delivery_address}</span>
                  </div>
                )}

                {/* Inline Customer Edit Form */}
                {isEditingCustomer && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-amber-200/60">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Customer Name"
                      className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Phone Number"
                      className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Delivery Address"
                      className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                )}

                {/* Reset Time & Status Bar */}
                <div className="flex items-center justify-between gap-3 pt-1 border-t border-amber-200/40 text-xs flex-wrap">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock size={12} className="text-orange-600" />
                    <span className="text-[11px]">Original: <strong>{originalTimeFormatted || "--:--"}</strong></span>
                    <span className="text-slate-400">→</span>
                    <span className="text-[11px]">New: <strong className="text-orange-600">{currentTimeFormatted}</strong></span>
                    <label className="ml-1 inline-flex items-center gap-1 cursor-pointer font-bold text-slate-800 text-[11px]">
                      <input
                        type="checkbox"
                        checked={resetTime}
                        onChange={(e) => setResetTime(e.target.checked)}
                        className="rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                      <span>Reset Time to Now</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500">Status:</span>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="preparing">🍳 Preparing (Kitchen)</option>
                      <option value="ready">🛵 Ready</option>
                      <option value="delivered">✅ Delivered</option>
                      <option value="pending">⏳ Pending</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Order Items Header */}
              <div className="flex items-center justify-between px-0.5 pt-1">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={14} className="text-orange-600" />
                  <span>Items in Recreated Ticket</span>
                  <span className="bg-orange-100 text-orange-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {items.length} {items.length === 1 ? "Item" : "Items"}
                  </span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Override prices or quantities directly
                </span>
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
                {items.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-xs space-y-2">
                    <ChefHat size={36} className="mx-auto text-slate-300" />
                    <p className="font-bold text-slate-700 text-sm">No items in this order ticket.</p>
                    <p className="text-slate-400">Select any Pizza, Burger, or Deal from the right catalog.</p>
                  </div>
                ) : (
                  items.map((item, idx) => {
                    const lineTotal = item.price * item.qty;

                    return (
                      <div
                        key={idx}
                        className="p-3 sm:p-3.5 text-xs flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                      >
                        {/* Item Name & Variation Badge */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 text-sm">
                              {item.name}
                            </span>
                            {item.detail && (
                              <span className="bg-orange-50 text-orange-700 border border-orange-200 text-[11px] font-extrabold px-2 py-0.5 rounded-lg shadow-2xs flex items-center gap-1">
                                <Pizza size={10} className="text-orange-600" />
                                {item.detail}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity Controls, Unit Price, Line Total, Trash */}
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

                          {/* Unit Price Override Input */}
                          <div
                            className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all"
                            title="Edit unit price"
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
                          <div className="font-mono font-black text-slate-900 min-w-16 text-right text-xs sm:text-sm">
                            {currencySymbol}{lineTotal.toLocaleString()}
                          </div>

                          {/* Remove button */}
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

              {/* Recreate Notes input */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Recreate Audit Note / Instruction (Optional)
                </label>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="e.g. Customer called to change 1 Large Pizza to Fajita"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Left Column Sticky Bottom: Totals & Submit */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 text-xs font-medium">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-all cursor-pointer text-xs shadow-2xs"
                >
                  Cancel
                </button>

                <div className="text-slate-500 hidden sm:flex items-center gap-2">
                  <span>Subtotal: <strong className="font-mono text-slate-900 font-bold">{currencySymbol}{itemsSubtotal.toLocaleString()}</strong></span>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1">
                    <Bike size={12} className="text-slate-400" />
                    <span className="text-slate-600 font-bold">Delivery:</span>
                    <input
                      type="number"
                      min="0"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(Math.max(0, Number(e.target.value) || 0))}
                      className="w-16 px-1.5 py-1 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-right shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
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
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs sm:text-sm font-black rounded-xl transition-all shadow-md shadow-orange-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
                  <span>{isPending ? "Recreating..." : "Save & Recreate"}</span>
                </button>
              </div>
            </div>
          </div>


          {/* ════════════════════════════════════════════════════════════
              RIGHT COLUMN: INTERACTIVE PIZZA & MENU CATALOG (5 COLS)
              ════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 flex flex-col h-full bg-slate-50/70 overflow-hidden">
            
            {/* Catalog Top Bar: Search & Mode Toggle */}
            <div className="p-3.5 border-b border-slate-200 bg-white space-y-2.5 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-black text-xs text-slate-900 uppercase tracking-wide">
                  <Sparkles size={14} className="text-orange-600" />
                  <span>Select Items &amp; Pizza Sizes</span>
                </div>

                {/* Mode Selector */}
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setAddMode("menu")}
                    className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                      addMode === "menu" ? "bg-white text-orange-600 shadow-2xs font-black" : "text-slate-600"
                    }`}
                  >
                    Menu Catalog
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMode("custom")}
                    className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                      addMode === "custom" ? "bg-white text-orange-600 shadow-2xs font-black" : "text-slate-600"
                    }`}
                  >
                    Custom Item
                  </button>
                </div>
              </div>

              {addMode === "menu" && (
                <>
                  {/* Search input */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search pizza, flavor, burger, drink..."
                      className="w-full pl-8.5 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Category Pills */}
                  {categories.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-[11px] font-bold">
                      {categories.map((cat) => {
                        const isSelected = selectedCategory === cat;
                        const label = cat === "all" ? "All Products" : cat;
                        const isPizzaCat = cat.toLowerCase().includes("pizza");

                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                              isSelected
                                ? "bg-orange-600 text-white font-black shadow-xs"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {isPizzaCat && <span>🍕</span>}
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Catalog Content Area */}
            {addMode === "custom" ? (
              /* Custom Item Form */
              <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                <div className="bg-white border border-amber-200 rounded-2xl p-4 space-y-3 shadow-xs">
                  <h4 className="font-black text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Plus size={14} className="text-orange-600 stroke-[3]" />
                    <span>Add Custom / Special Item</span>
                  </h4>
                  <p className="text-slate-500 text-xs">
                    Quickly add off-menu item, special sauce, or custom charges to this ticket.
                  </p>

                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Item Title / Name *</label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="e.g. Extra 1.5L Drink, Loaded Fries"
                        className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Unit Price ({currencySymbol}) *</label>
                        <input
                          type="number"
                          min="0"
                          value={customPrice}
                          onChange={(e) => setCustomPrice(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="Price"
                          className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 text-right"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={customQty}
                          onChange={(e) => setCustomQty(Math.max(1, Number(e.target.value) || 1))}
                          className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-center focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!customName.trim()}
                      onClick={handleAddCustomItem}
                      className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-orange-600/20 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus size={14} className="stroke-[3]" />
                      <span>Add Custom Item</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Menu Catalog with Pizza Size Selector */
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* 1. Scrollable Product Cards / List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {loadingProducts ? (
                    <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={20} className="animate-spin text-orange-600" />
                      <span>Loading shop menu products...</span>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                      <p className="font-bold text-slate-600">No products match &quot;{searchQuery}&quot;</p>
                      <p>Switch category or try another keyword.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filteredProducts.map((p) => {
                        const isSelected = String(selectedProductId) === String(p.id);
                        const hasVariations = p.variations && p.variations.length > 0;
                        const isPizza = p.name.toLowerCase().includes("pizza") || (p.category_name && p.category_name.toLowerCase().includes("pizza"));

                        return (
                          <div
                            key={p.id}
                            onClick={() => handleSelectProductCard(p)}
                            className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                              isSelected
                                ? "bg-orange-50/90 border-orange-500 shadow-md ring-2 ring-orange-500/20"
                                : "bg-white border-slate-200 hover:border-orange-300 hover:shadow-xs"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="min-w-0 flex-1">
                                <div className="font-black text-xs text-slate-900 leading-snug truncate">
                                  {isPizza && <span className="mr-1">🍕</span>}
                                  {p.name}
                                </div>
                                {p.category_name && (
                                  <span className="text-[10px] font-bold text-slate-400 block truncate">
                                    {p.category_name}
                                  </span>
                                )}
                              </div>
                              {isSelected && (
                                <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0">
                                  <Check size={11} className="stroke-[3]" />
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                              <span className="font-mono font-black text-slate-900 text-[11px]">
                                {hasVariations ? (
                                  <span className="text-orange-600">From {currencySymbol}{Math.min(...p.variations!.map((v: any) => Number(v.price) || 0)).toLocaleString()}</span>
                                ) : (
                                  <span>{currencySymbol}{Number(p.price).toLocaleString()}</span>
                                )}
                              </span>

                              {hasVariations && (
                                <span className="text-[9.5px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md">
                                  {p.variations!.length} Sizes
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. DEDICATED PIZZA SIZES & ADD BAR (STICKY BOTTOM OF RIGHT COLUMN) */}
                {currentSelectedProduct && (
                  <div className="p-3.5 bg-white border-t border-slate-200 shadow-lg space-y-2.5 shrink-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate flex items-center gap-1.5">
                        <span className="text-base">🍕</span>
                        <div className="truncate">
                          <span className="text-xs font-black text-slate-900 truncate block">
                            {currentSelectedProduct.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Select size variation &amp; quantity
                          </span>
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-2xs shrink-0">
                        <button
                          type="button"
                          onClick={() => setAddQty(Math.max(1, addQty - 1))}
                          className="w-7 h-7 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
                        >
                          −
                        </button>
                        <span className="px-2 text-xs font-black font-mono text-slate-900 min-w-6 text-center">
                          {addQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAddQty(addQty + 1)}
                          className="w-7 h-7 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* SIZES SELECTION BUTTONS / CHIPS */}
                    {currentSelectedProduct.variations && currentSelectedProduct.variations.length > 0 ? (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                          Pizza / Item Size:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {currentSelectedProduct.variations.map((v: any, vIdx: number) => {
                            const isVarSelected = selectedVariation?.name === v.name;

                            return (
                              <button
                                key={vIdx}
                                type="button"
                                onClick={() => setSelectedVariation(v)}
                                className={`px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between ${
                                  isVarSelected
                                    ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white border-orange-600 shadow-sm shadow-orange-600/30 ring-2 ring-orange-500/30"
                                    : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-black truncate">{v.name}</span>
                                  {isVarSelected && <Check size={11} className="stroke-[3]" />}
                                </div>
                                <span
                                  className={`text-[10px] font-mono font-bold ${
                                    isVarSelected ? "text-orange-100" : "text-slate-500"
                                  }`}
                                >
                                  {currencySymbol}{Number(v.price).toLocaleString()}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs font-mono font-bold text-slate-700">
                        Price: {currencySymbol}{Number(currentSelectedProduct.price).toLocaleString()}
                      </div>
                    )}

                    {/* Big Add Button */}
                    <button
                      type="button"
                      onClick={handleAddSelectedProduct}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-600/25 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Plus size={15} className="stroke-[3]" />
                      <span>
                        Add to Ticket (
                        {currencySymbol}
                        {(
                          (selectedVariation ? Number(selectedVariation.price) : Number(currentSelectedProduct.price)) *
                          addQty
                        ).toLocaleString()}
                        )
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
