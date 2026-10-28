"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import type { Order } from "@/types/menu";
import { recreateOrder, getShopMenuProducts } from "@/lib/admin-actions";
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
  initialProducts?: {
    id: number;
    name: string;
    price: number;
    category_name?: string;
    is_available?: boolean;
  }[];
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
  const [availableProducts, setAvailableProducts] = useState(initialProducts);
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

  // Quick Add Product state
  const [addMode, setAddMode] = useState<"menu" | "custom">("menu");
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | "">("");
  const [addQty, setAddQty] = useState<number>(1);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState<number | "">("");

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
    setAddQty(1);
    setCustomName("");
    setCustomPrice("");

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

  // Load menu products if not provided
  useEffect(() => {
    if (!isOpen) return;
    if (availableProducts.length > 0) return;

    let mounted = true;
    setLoadingProducts(true);
    getShopMenuProducts(shopId)
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
  }, [isOpen, shopId, availableProducts.length]);

  // Filter products for dropdown
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return availableProducts;
    const q = productSearch.toLowerCase().trim();
    return availableProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category_name && p.category_name.toLowerCase().includes(q))
    );
  }, [availableProducts, productSearch]);

  // Calculate live totals
  const itemsSubtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + it.price * it.qty, 0);
  }, [items]);

  const grandTotal = useMemo(() => {
    return Math.max(0, itemsSubtotal + (Number(deliveryFee) || 0));
  }, [itemsSubtotal, deliveryFee]);

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

  // Add Product from Menu
  const handleAddMenuProduct = () => {
    if (!selectedProductId) return;
    const prod = availableProducts.find((p) => p.id === Number(selectedProductId));
    if (!prod) return;

    const existingIndex = items.findIndex((it) => it.id === prod.id && !it.detail);
    if (existingIndex >= 0) {
      // Increase existing item quantity
      handleUpdateQty(existingIndex, addQty);
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: prod.id,
          name: prod.name,
          price: prod.price,
          qty: addQty,
        },
      ]);
    }

    setSelectedProductId("");
    setAddQty(1);
    setProductSearch("");
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
        qty: addQty,
      },
    ]);

    setCustomName("");
    setCustomPrice("");
    setAddQty(1);
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
        setErrorMsg(err?.message || "An unexpected error occurred.");
      }
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "680px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        {/* ─── MODAL HEADER ─────────────────────────────────────── */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e2e8f0",
            background: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  background: "#ea580c",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                <RefreshCw size={12} />
                Order Recreate System
              </span>

              {/* Locked Order ID Badge */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 9px",
                  borderRadius: "4px",
                  background: "#ecfdf5",
                  color: "#065f46",
                  border: "1px solid #a7f3d0",
                  fontSize: "12px",
                  fontWeight: 800,
                  fontFamily: "monospace",
                }}
                title="Order ID & Tracking Number are strictly preserved"
              >
                <Lock size={12} />
                <span>{order.order_number}</span>
                <span style={{ fontSize: "10px", color: "#047857" }}>(ID KEPT SAME)</span>
              </span>
            </div>

            <h2
              style={{
                margin: "6px 0 0",
                fontSize: "17px",
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.01em",
              }}
            >
              Recreate &amp; Modify Customer Order
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "6px",
              color: "#64748b",
              cursor: isPending ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── MODAL SCROLLABLE BODY ────────────────────────────── */}
        <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
          {errorMsg && (
            <div
              style={{
                marginBottom: "16px",
                padding: "10px 14px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "6px",
                color: "#dc2626",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Time & Customer Info Banner */}
          <div
            style={{
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: "8px",
              padding: "12px 14px",
              marginBottom: "18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#9a3412" }}>
                Customer: {order.customer_name || "Guest Customer"} •{" "}
                <span style={{ color: "#c2410c" }}>{order.customer_phone || "No phone"}</span>
              </div>
              <div style={{ fontSize: "11px", color: "#ea580c", marginTop: "2px" }}>
                Original Time: {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {" ➔ "}
                <strong>
                  New Time: {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (Refreshes to NOW)
                </strong>
              </div>
            </div>

            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#ffffff",
                padding: "5px 10px",
                borderRadius: "6px",
                border: "1px solid #fdba74",
                fontSize: "11px",
                fontWeight: 700,
                color: "#9a3412",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={resetTime}
                onChange={(e) => setResetTime(e.target.checked)}
                style={{ accentColor: "#ea580c" }}
              />
              <span>Reset Time to Now (Active)</span>
            </label>
          </div>

          {/* ─── CUSTOMER & DELIVERY DETAILS ─────────────────────── */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #fed7aa",
              borderRadius: "8px",
              padding: "12px 14px",
              marginBottom: "18px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
                paddingBottom: "8px",
                borderBottom: "1px solid #ffedd5",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <User size={15} style={{ color: "#ea580c" }} />
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#9a3412", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Customer Details &amp; Address
                </span>
              </div>
              <span style={{ fontSize: "10.5px", color: "#9a3412", fontWeight: 600 }}>
                Editable: Name, Number &amp; Address
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "10px" }}>
              {/* Customer Name */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 800, color: "#475569", marginBottom: "4px" }}>
                  <User size={12} style={{ color: "#ea580c" }} />
                  CUSTOMER NAME:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ali Khan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#0f172a",
                    background: "#ffffff",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Customer Phone */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 800, color: "#475569", marginBottom: "4px" }}>
                  <Phone size={12} style={{ color: "#ea580c" }} />
                  PHONE / WHATSAPP NUMBER:
                </label>
                <input
                  type="text"
                  placeholder="e.g. 03001234567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    fontWeight: 600,
                    fontFamily: "monospace",
                    color: "#0f172a",
                    background: "#ffffff",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Delivery Address */}
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 800, color: "#475569", marginBottom: "4px" }}>
                <MapPin size={12} style={{ color: "#ea580c" }} />
                DELIVERY ADDRESS:
              </label>
              <input
                type="text"
                placeholder="e.g. House 14, Street 2, Sector G-10/4, Islamabad"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#0f172a",
                  background: "#ffffff",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* ─── ITEMS LIST ───────────────────────────────────────── */}
          <div style={{ marginBottom: "18px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <h3 style={{ fontSize: "13px", fontWeight: 800, color: "#1e293b", margin: 0 }}>
                Order Items ({items.reduce((s, it) => s + it.qty, 0)} items)
              </h3>
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                Adjust quantities or remove items below
              </span>
            </div>

            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                background: "#ffffff",
                overflow: "hidden",
              }}
            >
              {items.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
                  No items in order. Add items from the menu below.
                </div>
              ) : (
                items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderBottom: idx === items.length - 1 ? "none" : "1px solid #f1f5f9",
                      background: idx % 2 === 0 ? "#ffffff" : "#fbfcfe",
                      gap: "8px",
                    }}
                  >
                    {/* Item Name & Variation */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                        {item.name}
                      </div>
                      {item.detail && (
                        <span
                          style={{
                            display: "inline-block",
                            fontSize: "10px",
                            fontWeight: 700,
                            background: "#fee2e2",
                            color: "#dc2626",
                            padding: "1px 5px",
                            borderRadius: "3px",
                            marginTop: "2px",
                          }}
                        >
                          {item.detail}
                        </span>
                      )}
                    </div>

                    {/* Quantity Stepper */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        background: "#f1f5f9",
                        padding: "3px 6px",
                        borderRadius: "6px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(idx, -1)}
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "4px",
                          border: "none",
                          background: "#ffffff",
                          color: "#334155",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          fontWeight: 900,
                        }}
                      >
                        <span style={{ fontSize: "16px", lineHeight: "1", fontWeight: 900 }}>−</span>
                      </button>

                      <span
                        style={{
                          width: "24px",
                          textAlign: "center",
                          fontSize: "12px",
                          fontWeight: 800,
                          color: "#0f172a",
                        }}
                      >
                        {item.qty}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleUpdateQty(idx, 1)}
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "4px",
                          border: "none",
                          background: "#ffffff",
                          color: "#334155",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          fontWeight: 900,
                        }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Price per unit input */}
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>@</span>
                      <input
                        type="number"
                        min="0"
                        value={item.price}
                        onChange={(e) => handleUpdatePrice(idx, Number(e.target.value) || 0)}
                        style={{
                          width: "70px",
                          padding: "4px 6px",
                          fontSize: "12px",
                          fontWeight: 700,
                          border: "1px solid #cbd5e1",
                          borderRadius: "4px",
                          textAlign: "right",
                        }}
                      />
                    </div>

                    {/* Line Total */}
                    <div
                      style={{
                        width: "80px",
                        textAlign: "right",
                        fontSize: "13px",
                        fontWeight: 800,
                        color: "#0f172a",
                      }}
                    >
                      {currencySymbol}
                      {(item.price * item.qty).toLocaleString()}
                    </div>

                    {/* Delete Item */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      title="Remove item from order"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#94a3b8",
                        cursor: "pointer",
                        padding: "4px",
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as any).style.color = "#ef4444")}
                      onMouseLeave={(e) => ((e.currentTarget as any).style.color = "#94a3b8")}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ─── ADD MORE PRODUCTS / BURGER / PIZZA ───────────────── */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px dashed #cbd5e1",
              borderRadius: "8px",
              padding: "14px",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Plus size={14} className="text-orange-600" />
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>
                  Add Product to Order (e.g. +1 Burger, Drink, Pizza)
                </span>
              </div>

              {/* Toggle Mode: Menu vs Custom */}
              <div style={{ display: "flex", gap: "4px", background: "#e2e8f0", padding: "2px", borderRadius: "5px" }}>
                <button
                  type="button"
                  onClick={() => setAddMode("menu")}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    border: "none",
                    background: addMode === "menu" ? "#ffffff" : "transparent",
                    color: addMode === "menu" ? "#0f172a" : "#64748b",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  From Menu
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode("custom")}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    border: "none",
                    background: addMode === "custom" ? "#ffffff" : "transparent",
                    color: addMode === "custom" ? "#0f172a" : "#64748b",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Custom Item
                </button>
              </div>
            </div>

            {addMode === "menu" ? (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                {/* Search / Select Product */}
                <div style={{ flex: "2 1 220px", position: "relative" }}>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : "")}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#0f172a",
                      outline: "none",
                    }}
                  >
                    <option value="">-- Select Product from Menu --</option>
                    {filteredProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {currencySymbol}
                        {p.price} ({p.category_name || "Food"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700 }}>Qty:</span>
                  <input
                    type="number"
                    min="1"
                    value={addQty}
                    onChange={(e) => setAddQty(Math.max(1, Number(e.target.value) || 1))}
                    style={{
                      width: "55px",
                      padding: "7px 6px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      fontWeight: 700,
                      textAlign: "center",
                    }}
                  />
                </div>

                {/* Add Button */}
                <button
                  type="button"
                  disabled={!selectedProductId}
                  onClick={handleAddMenuProduct}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    background: selectedProductId ? "#ea580c" : "#cbd5e1",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 800,
                    border: "none",
                    cursor: selectedProductId ? "pointer" : "not-allowed",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Plus size={14} />
                  <span>Add Item</span>
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Custom item name (e.g. Zinger Burger)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  style={{
                    flex: "2 1 180px",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                  }}
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  style={{
                    width: "80px",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                  }}
                />
                <input
                  type="number"
                  min="1"
                  value={addQty}
                  onChange={(e) => setAddQty(Math.max(1, Number(e.target.value) || 1))}
                  style={{
                    width: "55px",
                    padding: "8px 6px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    textAlign: "center",
                  }}
                />
                <button
                  type="button"
                  disabled={!customName.trim()}
                  onClick={handleAddCustomItem}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    background: customName.trim() ? "#ea580c" : "#cbd5e1",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 800,
                    border: "none",
                    cursor: customName.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  Add Custom
                </button>
              </div>
            )}
          </div>

          {/* ─── RECREATE STATUS & REASON SETTINGS ─────────────────── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "12px",
              marginBottom: "18px",
            }}
          >
            {/* Status Selection */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "#475569", marginBottom: "4px" }}>
                STATUS AFTER RECREATE:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#0f172a",
                  background: "#ffffff",
                }}
              >
                <option value="preparing">In Oven / Preparing (Send to Kitchen) [Recommended]</option>
                <option value="pending">Pending Approval</option>
                <option value="confirmed">Confirmed</option>
                <option value="ready">Ready for Pickup / Dispatch</option>
                <option value="delivered">Delivered / Completed</option>
              </select>
            </div>

            {/* Audit / Recreate Reason */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "#475569", marginBottom: "4px" }}>
                REASON / CUSTOMER REQUEST:
              </label>
              <input
                type="text"
                placeholder="e.g. Customer called to add 1 burger"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* ─── BILL BREAKDOWN TOTALS ────────────────────────────── */}
          <div
            style={{
              background: "#f1f5f9",
              borderRadius: "8px",
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                Items Subtotal: <strong>{currencySymbol}{itemsSubtotal.toLocaleString()}</strong>
                {order.order_type === "delivery" && (
                  <span style={{ marginLeft: "8px" }}>
                    • Delivery:{" "}
                    <input
                      type="number"
                      min="0"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
                      style={{ width: "50px", padding: "2px 4px", fontSize: "11px", borderRadius: "3px", border: "1px solid #cbd5e1" }}
                    />
                  </span>
                )}
              </div>
              <div style={{ fontSize: "11px", color: "#059669", fontWeight: 700, marginTop: "2px" }}>
                ✓ Order ID <strong>#{order.order_number}</strong> is preserved for customer tracking.
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 800 }}>
                Total Bill Amount:
              </span>
              <div style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a" }}>
                {currencySymbol}{grandTotal.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* ─── FOOTER ACTIONS ───────────────────────────────────── */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid #e2e8f0",
            background: "#f8fafc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            style={{
              padding: "9px 16px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#64748b",
              fontSize: "12px",
              fontWeight: 700,
              cursor: isPending ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isPending || items.length === 0}
            onClick={handleSaveRecreatedOrder}
            style={{
              padding: "9px 20px",
              borderRadius: "6px",
              border: "none",
              background: isPending ? "#cbd5e1" : "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 800,
              cursor: isPending || items.length === 0 ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 6px rgba(234, 88, 12, 0.3)",
            }}
          >
            <RefreshCw size={15} className={isPending ? "animate-spin" : ""} />
            <span>{isPending ? "Recreating Order..." : "Save & Recreate Order"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
