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
  ChevronRight,
  SlidersHorizontal,
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
  const [showCustomerDetails, setShowCustomerDetails] = useState<boolean>(false);

  // Menu Search & Category Filter state
  const [productSearch, setProductSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeCatalogTab, setActiveCatalogTab] = useState<"menu" | "custom">("menu");

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
    setProductSearch("");
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

  // Extract unique category names
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    availableProducts.forEach((p) => {
      if (p.category_name && p.category_name.trim()) {
        set.add(p.category_name.trim());
      }
    });
    return Array.from(set).sort();
  }, [availableProducts]);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    return availableProducts.filter((p) => {
      const matchesCategory =
        selectedCategory === "all" ||
        (p.category_name && p.category_name.toLowerCase() === selectedCategory.toLowerCase());

      if (!matchesCategory) return false;

      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.category_name && p.category_name.toLowerCase().includes(q))
      );
    });
  }, [availableProducts, productSearch, selectedCategory]);

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

  // Add Product from Catalog (With or Without Variation)
  const handleAddProductItem = (
    product: ShopMenuProduct,
    variation?: { name: string; price: number; id?: string }
  ) => {
    const itemPrice = variation ? Number(variation.price) : Number(product.price);
    const variationName = variation ? variation.name : undefined;

    // Check if identical item (same ID and same variation) is already in cart
    const existingIndex = items.findIndex(
      (it) => it.id === product.id && it.detail === variationName
    );

    if (existingIndex >= 0) {
      handleUpdateQty(existingIndex, 1);
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: itemPrice,
          qty: 1,
          detail: variationName,
          selected_variation: variation ? { name: variation.name, price: itemPrice } : null,
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

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(9, 9, 11, 0.88)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      {/* ── FULL WINDOW CONTAINER ────────────────────────────────────────── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "8px",
          width: "98vw",
          maxWidth: "1520px",
          height: "96vh",
          maxHeight: "96vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.45)",
          border: "1px solid #cbd5e1",
          overflow: "hidden",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* ── TOP HEADER BAR ──────────────────────────────────────────────── */}
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid #e2e8f0",
            background: "#0f172a",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          {/* Left Title & Locked ID */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "5px",
                background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 2px 8px rgba(234, 88, 12, 0.4)",
              }}
            >
              <RefreshCw size={20} />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.2px" }}>
                  Order Recreate &amp; Modify Terminal
                </h2>

                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: "#22c55e",
                    color: "#000000",
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: "0.5px",
                  }}
                >
                  <Lock size={11} />
                  ORDER #{order.order_number} (ID KEPT SAME)
                </span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>
                Add items, select sizes (Small, Medium, Large), or modify customer details with instant kitchen sync.
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Status Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#1e293b", padding: "4px 8px", borderRadius: "5px", border: "1px solid #334155" }}>
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>STATUS:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  background: "#0f172a",
                  color: "#ffffff",
                  border: "1px solid #ea580c",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: 12,
                  fontWeight: 800,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="preparing">🍳 Preparing (Kitchen)</option>
                <option value="ready">Ready (Pickup/Dispatch)</option>
                <option value="delivered">✅ Delivered / Served</option>
                <option value="pending">⏳ Pending Queue</option>
              </select>
            </div>

            {/* Reset 30-Min Timer Toggle */}
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: resetTime ? "#14532d" : "#1e293b",
                border: `1px solid ${resetTime ? "#22c55e" : "#334155"}`,
                borderRadius: "5px",
                padding: "6px 10px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 800,
                color: resetTime ? "#86efac" : "#94a3b8",
              }}
              title="Reset the 30-minute kitchen timer so kitchen prepares fresh"
            >
              <input
                type="checkbox"
                checked={resetTime}
                onChange={(e) => setResetTime(e.target.checked)}
                style={{ accentColor: "#22c55e", cursor: "pointer" }}
              />
              <Clock size={13} />
              <span>Reset 30m Timer</span>
            </label>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              style={{
                background: "#334155",
                border: "1px solid #475569",
                borderRadius: "5px",
                padding: "6px 10px",
                color: "#ffffff",
                cursor: isPending ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Close Recreate Terminal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div
            style={{
              padding: "10px 18px",
              background: "#fef2f2",
              borderBottom: "1px solid #fecaca",
              color: "#dc2626",
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ── TWO-COLUMN SPLIT POS BODY ───────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1.15fr 0.85fr",
            overflow: "hidden",
            background: "#f8fafc",
          }}
        >
          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* LEFT PANEL: PRODUCT SEARCH, CATEGORY TABS & MENU VARIATIONS CATALOG */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          <div
            style={{
              borderRight: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              background: "#ffffff",
              overflow: "hidden",
            }}
          >
            {/* Top Search & Catalog Tabs Bar */}
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid #e2e8f0",
                background: "#f8fafc",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Search Input */}
                <div
                  style={{
                    flex: 1,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Search
                    size={16}
                    color="#94a3b8"
                    style={{ position: "absolute", left: 12 }}
                  />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search menu (e.g. Tikka, Fajita, Supreme, Wings, Burger, Coke...)"
                    style={{
                      width: "100%",
                      padding: "9px 12px 9px 36px",
                      borderRadius: "5px",
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#0f172a",
                      outline: "none",
                      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
                    }}
                  />
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => setProductSearch("")}
                      style={{
                        position: "absolute",
                        right: 8,
                        background: "#e2e8f0",
                        border: "none",
                        borderRadius: "50%",
                        width: 18,
                        height: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#64748b",
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Mode Selector */}
                <div style={{ display: "flex", gap: 4, background: "#e2e8f0", padding: 3, borderRadius: "5px" }}>
                  <button
                    type="button"
                    onClick={() => setActiveCatalogTab("menu")}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "4px",
                      border: "none",
                      background: activeCatalogTab === "menu" ? "#0f172a" : "transparent",
                      color: activeCatalogTab === "menu" ? "#ffffff" : "#64748b",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Pizza size={13} />
                    <span>Store Menu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCatalogTab("custom")}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "4px",
                      border: "none",
                      background: activeCatalogTab === "custom" ? "#0f172a" : "transparent",
                      color: activeCatalogTab === "custom" ? "#ffffff" : "#64748b",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Plus size={13} />
                    <span>Custom Item</span>
                  </button>
                </div>
              </div>

              {/* Category Pills Slider (Only in Menu mode) */}
              {activeCatalogTab === "menu" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    overflowX: "auto",
                    paddingBottom: 4,
                  }}
                  className="hide-scrollbar"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "5px",
                      border: "1px solid",
                      borderColor: selectedCategory === "all" ? "#ea580c" : "#cbd5e1",
                      background: selectedCategory === "all" ? "#ea580c" : "#ffffff",
                      color: selectedCategory === "all" ? "#ffffff" : "#475569",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    All Items ({availableProducts.length})
                  </button>

                  {categoriesList.map((cat) => {
                    const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                    const count = availableProducts.filter(
                      (p) => p.category_name?.toLowerCase() === cat.toLowerCase()
                    ).length;

                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        style={{
                          padding: "5px 12px",
                          borderRadius: "5px",
                          border: "1px solid",
                          borderColor: isSelected ? "#ea580c" : "#cbd5e1",
                          background: isSelected ? "#ea580c" : "#ffffff",
                          color: isSelected ? "#ffffff" : "#475569",
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Menu Items Catalog Scrollable Grid */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px 18px",
              }}
            >
              {activeCatalogTab === "menu" ? (
                loadingProducts ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Loading shop menu products...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>No products matched your search.</p>
                    <p style={{ margin: "4px 0 0", fontSize: 12 }}>Try another keyword or switch category.</p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                      gap: 12,
                    }}
                  >
                    {filteredProducts.map((prod) => {
                      const hasVariations = prod.variations && prod.variations.length > 0;

                      return (
                        <div
                          key={prod.id}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "6px",
                            padding: "12px 14px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f172a", lineHeight: 1.3 }}>
                                {prod.name}
                              </h4>
                              {prod.category_name && (
                                <span
                                  style={{
                                    fontSize: 9.5,
                                    fontWeight: 800,
                                    background: "#f1f5f9",
                                    color: "#64748b",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {prod.category_name}
                                </span>
                              )}
                            </div>

                            <div style={{ margin: "4px 0 10px", fontSize: 12, color: "#64748b" }}>
                              Base Price: <strong style={{ color: "#0f172a" }}>{currencySymbol} {Number(prod.price).toLocaleString()}</strong>
                            </div>
                          </div>

                          {/* ── VARIATIONS SELECTION (Small, Medium, Large, etc.) ── */}
                          {hasVariations ? (
                            <div style={{ marginTop: 6 }}>
                              <span style={{ fontSize: 10, fontWeight: 800, color: "#ea580c", textTransform: "uppercase", display: "block", marginBottom: 5 }}>
                                Select Size / Variation:
                              </span>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: 5 }}>
                                {prod.variations!.map((v, vIdx) => (
                                  <button
                                    key={vIdx}
                                    type="button"
                                    onClick={() => handleAddProductItem(prod, v)}
                                    style={{
                                      padding: "6px 4px",
                                      borderRadius: "4px",
                                      background: "#fff7ed",
                                      border: "1px solid #fed7aa",
                                      color: "#c2410c",
                                      cursor: "pointer",
                                      textAlign: "center",
                                      transition: "all 0.12s ease",
                                    }}
                                    title={`Add ${prod.name} (${v.name})`}
                                    className="hover:scale-105"
                                  >
                                    <div style={{ fontSize: 11, fontWeight: 900, textTransform: "capitalize" }}>
                                      {v.name}
                                    </div>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9a3412", marginTop: 1 }}>
                                      {currencySymbol}{Number(v.price).toLocaleString()}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            /* Single Item Direct Add */
                            <button
                              type="button"
                              onClick={() => handleAddProductItem(prod)}
                              style={{
                                width: "100%",
                                padding: "7px 10px",
                                borderRadius: "4px",
                                background: "#0f172a",
                                color: "#ffffff",
                                border: "none",
                                fontSize: 12,
                                fontWeight: 800,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                              }}
                              className="hover:scale-[1.02]"
                            >
                              <Plus size={14} />
                              <span>Add to Order ({currencySymbol}{Number(prod.price).toLocaleString()})</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                /* Custom Open Item Form */
                <div
                  style={{
                    maxWidth: 480,
                    margin: "20px auto",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "20px 24px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
                    ➕ Add Custom / Open Item
                  </h3>
                  <p style={{ margin: "0 0 16px", fontSize: 12, color: "#64748b" }}>
                    Punch special customer requests, off-menu dishes, or custom fees.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#475569", marginBottom: 4 }}>
                        ITEM NAME / DESCRIPTION:
                      </label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="e.g. Extra Cheese Slice, Custom Sauce, Dip..."
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "5px",
                          border: "1px solid #cbd5e1",
                          fontSize: 13,
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#475569", marginBottom: 4 }}>
                          PRICE ({currencySymbol}):
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={customPrice}
                          onChange={(e) => setCustomPrice(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="e.g. 150"
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: "5px",
                            border: "1px solid #cbd5e1",
                            fontSize: 13,
                            fontWeight: 700,
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#475569", marginBottom: 4 }}>
                          QUANTITY:
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={customQty}
                          onChange={(e) => setCustomQty(Math.max(1, Number(e.target.value) || 1))}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: "5px",
                            border: "1px solid #cbd5e1",
                            fontSize: 13,
                            fontWeight: 700,
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCustomItem}
                      disabled={!customName.trim()}
                      style={{
                        marginTop: 6,
                        padding: "10px",
                        borderRadius: "5px",
                        background: "#ea580c",
                        color: "#ffffff",
                        border: "none",
                        fontSize: 13,
                        fontWeight: 900,
                        cursor: !customName.trim() ? "not-allowed" : "pointer",
                      }}
                    >
                      ➕ Add Custom Item To Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* RIGHT PANEL: ACTIVE ORDER ITEMS LIST & CUSTOMER BILLING SUMMARY   */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              background: "#ffffff",
              overflow: "hidden",
            }}
          >
            {/* Customer Details Bar / Accordion */}
            <div
              style={{
                padding: "12px 18px",
                borderBottom: "1px solid #e2e8f0",
                background: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <User size={15} color="#ea580c" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                    {customerName || "Customer Guest"}
                  </span>
                  {customerPhone && (
                    <span style={{ fontSize: 12, color: "#64748b" }}>({customerPhone})</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowCustomerDetails(!showCustomerDetails)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#ea580c",
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <SlidersHorizontal size={12} />
                  <span>{showCustomerDetails ? "Hide Info" : "Edit Customer Info"}</span>
                </button>
              </div>

              {/* Editable Customer Info Drawer */}
              {showCustomerDetails && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 10,
                    background: "#ffffff",
                    borderRadius: "5px",
                    border: "1px solid #cbd5e1",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Customer Name"
                      style={{ padding: "6px 8px", fontSize: 12, borderRadius: "4px", border: "1px solid #cbd5e1" }}
                    />
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Mobile / WhatsApp Phone"
                      style={{ padding: "6px 8px", fontSize: 12, borderRadius: "4px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Delivery Destination Address"
                    style={{ padding: "6px 8px", fontSize: 12, borderRadius: "4px", border: "1px solid #cbd5e1" }}
                  />
                  <input
                    type="text"
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="Special Kitchen / Preparation Notes"
                    style={{ padding: "6px 8px", fontSize: 12, borderRadius: "4px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              )}
            </div>

            {/* Cart Items List Header */}
            <div
              style={{
                padding: "8px 18px",
                background: "#f1f5f9",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                fontWeight: 800,
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              <span>Items in Order ({items.length})</span>
              <span>Subtotal: {currencySymbol}{itemsSubtotal.toLocaleString()}</span>
            </div>

            {/* Scrollable Items Container */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "12px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {items.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                  <ShoppingBag size={28} style={{ margin: "0 auto 8px" }} />
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Your order cart is empty.</p>
                  <p style={{ margin: "4px 0 0", fontSize: 12 }}>Click any product or variation from the left menu to add.</p>
                </div>
              ) : (
                items.map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    }}
                  >
                    {/* Item Name & Variation Detail */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                          {it.name}
                        </span>
                        {it.detail && (
                          <span
                            style={{
                              background: "#ffedd5",
                              color: "#c2410c",
                              fontSize: 10,
                              fontWeight: 900,
                              padding: "1px 6px",
                              borderRadius: "3px",
                              textTransform: "capitalize",
                            }}
                          >
                            ✨ {it.detail}
                          </span>
                        )}
                      </div>

                      {/* Editable Price */}
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: "#64748b" }}>Rate: {currencySymbol}</span>
                        <input
                          type="number"
                          min="0"
                          value={it.price}
                          onChange={(e) => handleUpdatePrice(idx, Number(e.target.value) || 0)}
                          style={{
                            width: 70,
                            padding: "2px 4px",
                            fontSize: 11,
                            fontWeight: 700,
                            borderRadius: "3px",
                            border: "1px solid #cbd5e1",
                            color: "#0f172a",
                          }}
                          title="Custom unit rate override"
                        />
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>
                          × {it.qty} = <strong style={{ color: "#0f172a" }}>{currencySymbol}{(it.price * it.qty).toLocaleString()}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Quantity Stepper & Delete */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          border: "1px solid #cbd5e1",
                          borderRadius: "4px",
                          overflow: "hidden",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(idx, -1)}
                          style={{
                            width: 28,
                            height: 28,
                            background: "#f1f5f9",
                            border: "none",
                            color: "#0f172a",
                            fontWeight: 900,
                            cursor: "pointer",
                            fontSize: 14,
                          }}
                        >
                          -
                        </button>
                        <span
                          style={{
                            width: 32,
                            textAlign: "center",
                            fontSize: 12,
                            fontWeight: 800,
                            color: "#0f172a",
                          }}
                        >
                          {it.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(idx, 1)}
                          style={{
                            width: 28,
                            height: 28,
                            background: "#f1f5f9",
                            border: "none",
                            color: "#0f172a",
                            fontWeight: 900,
                            cursor: "pointer",
                            fontSize: 14,
                          }}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        style={{
                          background: "#fee2e2",
                          border: "none",
                          borderRadius: "4px",
                          padding: "6px",
                          color: "#dc2626",
                          cursor: "pointer",
                        }}
                        title="Delete item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── FINANCIAL BILLING FOOTER ───────────────────────────────── */}
            <div
              style={{
                borderTop: "2px solid #e2e8f0",
                background: "#f8fafc",
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Items Subtotal:</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                  {currencySymbol} {itemsSubtotal.toLocaleString()}
                </span>
              </div>

              {/* Delivery Fee Input */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Bike size={14} color="#ea580c" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Delivery Surcharge:</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>{currencySymbol}</span>
                  <input
                    type="number"
                    min="0"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(Math.max(0, Number(e.target.value) || 0))}
                    style={{
                      width: 80,
                      padding: "4px 8px",
                      borderRadius: "4px",
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#0f172a",
                      textAlign: "right",
                    }}
                  />
                </div>
              </div>

              {/* Grand Total Bar */}
              <div
                style={{
                  padding: "12px 14px",
                  background: "#0f172a",
                  borderRadius: "6px",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
              >
                <div>
                  <span style={{ fontSize: 10, fontWeight: 900, color: "#f97316", textTransform: "uppercase", display: "block" }}>
                    TOTAL RECREATED BILL
                  </span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{items.length} Line Items</span>
                </div>

                <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.5px" }}>
                  {currencySymbol} {grandTotal.toLocaleString()}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "5px",
                    background: "#e2e8f0",
                    color: "#475569",
                    border: "none",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: isPending ? "not-allowed" : "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveRecreatedOrder}
                  disabled={isPending || items.length === 0}
                  style={{
                    flex: 2,
                    padding: "12px",
                    borderRadius: "5px",
                    background: isPending ? "#78350f" : "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
                    color: "#ffffff",
                    border: "none",
                    fontSize: 14,
                    fontWeight: 900,
                    cursor: isPending || items.length === 0 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: "0 4px 14px rgba(234, 88, 12, 0.4)",
                  }}
                >
                  {isPending ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Saving &amp; Recreating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Save &amp; Recreate Order Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
