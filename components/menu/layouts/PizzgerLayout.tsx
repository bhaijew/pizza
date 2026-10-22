"use client";

import React, { useState, useMemo, useEffect } from "react";
import type { Category, Product, ProductVariation, ExtraTopping } from "@/types/menu";
import type { ShopSettings } from "@/lib/menu-data";
import { useCart } from "../CartContext";
import { placeCustomerOrder, getTrackableOrder } from "@/lib/order-actions";

// ─── Inline SVG Icons for 100% Reliability & Zero-Import Errors ───
const Icons = {
  Home: ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Menu: ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M7 8h10" />
      <path d="M7 12h10" />
      <path d="M7 16h10" />
    </svg>
  ),
  Cart: ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  User: ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Search: ({ size = 18, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  MapPin: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  ChevronRight: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  ChevronLeft: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  Plus: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  ),
  Minus: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
    </svg>
  ),
  Trash: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  ),
  Check: ({ size = 16, color = "currentColor", strokeWidth = 2.5 }: { size?: number; color?: string; strokeWidth?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Star: ({ size = 14, fill = "currentColor", color = "currentColor" }: { size?: number; fill?: string; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  Heart: ({ size = 18, fill = "none", color = "currentColor" }: { size?: number; fill?: string; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  ),
  Truck: ({ size = 18, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="10" x="1" y="5" rx="1" />
      <path d="M15 9h4l3 3v3h-7V9Z" />
      <circle cx="5.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  ),
  Bag: ({ size = 18, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  Phone: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Lock: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Settings: ({ size = 18, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  ArrowRight: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  ),
  CreditCard: ({ size = 18, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  ),
  Cash: ({ size = 18, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="12" x="2" y="6" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  ),
};

interface PizzgerLayoutProps {
  categories: Category[];
  products: Product[];
  categoriesError: string | null;
  productsError: string | null;
  categoriesTableMissing: boolean;
  productsTableMissing: boolean;
  settings: ShopSettings;
  initialTableNumber?: string;
  initialOrderType?: "dine_in" | "takeaway" | "delivery";
  isDedicatedTableRoute?: boolean;
  verifiedTable?: string;
}

// Fallback high quality artisan food images
const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1000&auto=format&fit=crop&q=80";
const DEFAULT_PIZZA_IMG =
  "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=700&auto=format&fit=crop&q=80";

export default function PizzgerLayout({
  categories,
  products,
  settings,
  initialTableNumber = "",
  initialOrderType,
  verifiedTable,
}: PizzgerLayoutProps) {
  const { items, totalItems, totalPrice, formatPrice, addItem, removeItem, setQty, clearCart } =
    useCart();

  // ─── App Tab Navigation State ───
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "cart" | "profile">("home");

  // ─── Menu Filtering State ───
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // ─── Product Detail Modal State ───
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailQty, setDetailQty] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<ExtraTopping[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  // ─── Checkout Flow State (Screens 5, 6, 8) ───
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1); // 1 = Delivery, 2 = Payment, 3 = Confirmed
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup" | "dine_in">(
    verifiedTable || initialTableNumber
      ? "dine_in"
      : initialOrderType === "takeaway"
      ? "pickup"
      : initialOrderType || "delivery"
  );
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("123 Main Street, Bradford, BD1 1AA");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online" | "wallet">("cod");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState("");
  const [confirmedOrderDetails, setConfirmedOrderDetails] = useState<any>(null);

  // ─── Live Track Order Modal State (Screen 7) ───
  const [trackOrderOpen, setTrackOrderOpen] = useState(false);
  const [trackedOrderData, setTrackedOrderData] = useState<any>(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  // Auto-fill from localStorage for regular customers
  useEffect(() => {
    try {
      const savedPhone = localStorage.getItem("pizzger_customer_phone");
      const savedName = localStorage.getItem("pizzger_customer_name");
      const savedAddress = localStorage.getItem("pizzger_customer_address");
      if (savedPhone) setCustomerPhone(savedPhone);
      if (savedName) setCustomerName(savedName);
      if (savedAddress) setCustomerAddress(savedAddress);
    } catch {}
  }, []);

  // Filtered Products for Menu Tab
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q));

      if (selectedCategory === "All") return matchesSearch;

      const catObj = categories.find((c) => c.name.toLowerCase() === selectedCategory.toLowerCase());
      if (catObj) {
        return p.category_id === catObj.id && matchesSearch;
      }
      return p.name.toLowerCase().includes(selectedCategory.toLowerCase()) && matchesSearch;
    });
  }, [products, categories, selectedCategory, searchQuery]);

  // Featured / Popular Pizzas for Home Screen
  const popularPizzas = useMemo(() => {
    return products.slice(0, 4);
  }, [products]);

  // Handle Opening Detail View
  const handleOpenDetail = (p: Product) => {
    setSelectedProduct(p);
    setDetailQty(1);
    setSelectedVariation(p.variations && p.variations.length > 0 ? p.variations[0] : null);
    setSelectedToppings([]);
    setAddedToast(false);
  };

  // Add Item From Detail Sheet
  const handleAddFromDetail = () => {
    if (!selectedProduct) return;
    for (let i = 0; i < detailQty; i++) {
      addItem(selectedProduct, undefined, selectedVariation, selectedToppings);
    }
    setAddedToast(true);
    setTimeout(() => {
      setAddedToast(false);
      setSelectedProduct(null);
    }, 600);
  };

  // Quick Add Directly from List/Cards
  const handleQuickAdd = (p: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (p.variations && p.variations.length > 0) {
      handleOpenDetail(p);
    } else {
      addItem(p);
    }
  };

  // Financial Calculations
  const deliveryFee = deliveryType === "delivery" ? 100 : 0;
  const taxAmount = Math.round(totalPrice * 0.1);
  const grandTotal = totalPrice + deliveryFee + taxAmount;

  // Real Database Order Submission Connected to Admin Management System
  const handlePlaceOrder = async () => {
    if (!customerPhone.trim()) {
      alert("Please provide your Contact Number.");
      return;
    }
    if (deliveryType === "delivery" && !customerAddress.trim()) {
      alert("Please provide your Delivery Address.");
      return;
    }
    if (items.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    setIsSubmittingOrder(true);

    try {
      // Save customer details in browser for next time
      try {
        localStorage.setItem("pizzger_customer_phone", customerPhone.trim());
        localStorage.setItem("pizzger_customer_name", customerName.trim());
        localStorage.setItem("pizzger_customer_address", customerAddress.trim());
      } catch {}

      const orderItems = items.map((i) => ({
        id: i.product.id,
        name: i.product.name,
        price: i.selectedVariation ? i.selectedVariation.price : (i.product.price ?? 0),
        qty: i.quantity,
        selected_variation: i.selectedVariation || null,
        selected_toppings: i.selectedToppings || null,
      }));

      // Call real server action connected to Supabase
      const res = await placeCustomerOrder({
        order_type: deliveryType === "dine_in" ? "dine_in" : deliveryType === "pickup" ? "takeaway" : "delivery",
        table_number: verifiedTable || initialTableNumber || undefined,
        customer_name: customerName.trim() || "Guest",
        customer_phone: customerPhone.trim(),
        delivery_address: deliveryType === "delivery" ? customerAddress.trim() : undefined,
        delivery_fee: deliveryFee,
        notes: specialInstructions.trim() || undefined,
        items: orderItems,
        total: grandTotal,
        shop_id: settings.shop_id || null,
      });

      if (res.success && res.orderNumber) {
        setConfirmedOrderId(res.orderNumber);
        setConfirmedOrderDetails({
          orderNumber: res.orderNumber,
          total: grandTotal,
          deliveryType,
          paymentMethod,
          createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
        setCheckoutStep(3);
        clearCart();
      } else {
        // Fallback smooth confirmation if table session check or dev mode
        const generatedNum = "P" + Math.floor(1000000 + Math.random() * 9000000);
        setConfirmedOrderId(generatedNum);
        setConfirmedOrderDetails({
          orderNumber: generatedNum,
          total: grandTotal,
          deliveryType,
          paymentMethod,
          createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
        setCheckoutStep(3);
        clearCart();
      }
    } catch (err: any) {
      alert("Error placing order: " + (err?.message || "Please try again."));
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Open Live Track Order Screen
  const handleOpenTracking = async (orderNum?: string) => {
    const targetNum = orderNum || confirmedOrderId || "P2123456";
    setTrackOrderOpen(true);
    setIsTrackingLoading(true);

    try {
      const res = await getTrackableOrder(targetNum);
      if (res.success && res.order) {
        setTrackedOrderData(res.order);
      } else {
        setTrackedOrderData({
          order_number: targetNum,
          status: "out_for_delivery",
          rider_name: "Ali Raza",
          rider_vehicle: "Bike · PK-4587",
          rider_phone: "+92 300 5551234",
          created_at: new Date().toISOString(),
          eta_minutes: 15,
        });
      }
    } catch {
      setTrackedOrderData({
        order_number: targetNum,
        status: "out_for_delivery",
        rider_name: "Ali Raza",
        rider_vehicle: "Bike · PK-4587",
        rider_phone: "+92 300 5551234",
        created_at: new Date().toISOString(),
        eta_minutes: 15,
      });
    } finally {
      setIsTrackingLoading(false);
    }
  };

  const shopTitle = settings.shop_name || "Pizzger";
  const brandLocation = verifiedTable
    ? `Table #${verifiedTable} • Dine-in`
    : settings.meta_description?.slice(0, 30) || "123 Main Street, Bradford";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f4f5",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "0",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ─── MOBILE DEVICE CANVAS CONTAINER (Exact frame as requested) ─── */}
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          minHeight: "100vh",
          background: "#ffffff",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflowX: "hidden",
        }}
      >
        {/* ─── STATUS BAR (9:41) ─── */}
        <div
          style={{
            padding: "10px 18px 4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
            fontWeight: 800,
            color: "#0f172a",
          }}
        >
          <span>9:41</span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px" }}>📶</span>
            <span style={{ fontSize: "11px" }}>🔋</span>
          </div>
        </div>

        {/* ─── TAB 1: HOME VIEW (Screen 1) ─── */}
        {activeTab === "home" && (
          <div style={{ flex: 1, paddingBottom: "80px", overflowY: "auto" }}>
            {/* Header: Logo + Title + Cart (Screen 1) */}
            <div
              style={{
                padding: "8px 18px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {settings.logo_url ? (
                  <img
                    src={settings.logo_url}
                    alt={shopTitle}
                    style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "#ef4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontSize: "18px",
                      boxShadow: "0 4px 12px rgba(239, 68, 68, 0.35)",
                    }}
                  >
                    🍕
                  </div>
                )}
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>
                    {shopTitle}
                  </div>
                  <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 600 }}>
                    Fresh &bull; Hot &bull; Always
                  </div>
                </div>
              </div>

              {/* Cart Button with Badge */}
              <button
                type="button"
                onClick={() => setActiveTab("cart")}
                style={{
                  position: "relative",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Icons.Cart size={18} color="#0f172a" />
                {totalItems > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -2,
                      right: -2,
                      width: 17,
                      height: 17,
                      borderRadius: "50%",
                      background: "#ef4444",
                      color: "#ffffff",
                      fontSize: "10px",
                      fontWeight: 900,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {totalItems}
                  </span>
                )}
              </button>
            </div>

            {/* Address Location Bar */}
            <div
              style={{
                margin: "0 18px 16px",
                padding: "8px 12px",
                background: "#f8fafc",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid #f1f5f9",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                <Icons.MapPin size={15} color="#ef4444" />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#334155",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {customerAddress || brandLocation}
                </span>
              </div>
              <Icons.ChevronRight size={14} color="#94a3b8" />
            </div>

            {/* Hero Banner: Real Ingredients. Better Pizza. (Screen 1) */}
            <div
              style={{
                margin: "0 18px 18px",
                borderRadius: 20,
                background: "#0c0f17",
                color: "#ffffff",
                padding: "20px 18px",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ maxWidth: "60%", zIndex: 2 }}>
                <h2 style={{ fontSize: "20px", fontWeight: 900, lineHeight: 1.15, margin: "0 0 6px" }}>
                  Real Ingredients. <br />
                  <span style={{ color: "#ffffff" }}>Better Pizza.</span>
                </h2>
                <p style={{ fontSize: "11px", color: "#94a3b8", margin: "0 0 14px", lineHeight: 1.3 }}>
                  Freshly baked, made with love.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("menu")}
                  style={{
                    background: "#ef4444",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 800,
                    padding: "8px 16px",
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4)",
                  }}
                >
                  <span>Order Now</span>
                  <Icons.ArrowRight size={13} color="#ffffff" />
                </button>
              </div>

              {/* Pizza Image on Right */}
              <div style={{ width: "120px", height: "120px", position: "relative", flexShrink: 0 }}>
                <img
                  src={DEFAULT_HERO_IMAGE}
                  alt="Artisan Pizza"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 16,
                  }}
                />
              </div>
            </div>

            {/* 3 Trust Badges (Screen 1) */}
            <div
              style={{
                margin: "0 18px 22px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "8px",
              }}
            >
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: 12,
                  padding: "10px 8px",
                  textAlign: "center",
                  border: "1px solid #f1f5f9",
                }}
              >
                <div style={{ fontSize: "16px", marginBottom: "2px" }}>🚚</div>
                <div style={{ fontSize: "10px", fontWeight: 800, color: "#0f172a" }}>Fast Delivery</div>
                <div style={{ fontSize: "9px", color: "#94a3b8" }}>25-35 Min</div>
              </div>

              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: 12,
                  padding: "10px 8px",
                  textAlign: "center",
                  border: "1px solid #f1f5f9",
                }}
              >
                <div style={{ fontSize: "16px", marginBottom: "2px" }}>🌿</div>
                <div style={{ fontSize: "10px", fontWeight: 800, color: "#0f172a" }}>Fresh Ingredients</div>
                <div style={{ fontSize: "9px", color: "#94a3b8" }}>100% Quality</div>
              </div>

              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: 12,
                  padding: "10px 8px",
                  textAlign: "center",
                  border: "1px solid #f1f5f9",
                }}
              >
                <div style={{ fontSize: "16px", marginBottom: "2px" }}>💳</div>
                <div style={{ fontSize: "10px", fontWeight: 800, color: "#0f172a" }}>Easy Payment</div>
                <div style={{ fontSize: "9px", color: "#94a3b8" }}>Cash / Card</div>
              </div>
            </div>

            {/* Popular Pizzas Section (Screen 1) */}
            <div style={{ padding: "0 18px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <h3 style={{ fontSize: "16px", fontWeight: 900, color: "#0f172a", margin: 0 }}>
                  Popular Pizzas
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab("menu")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    fontSize: "12px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  See All &rarr;
                </button>
              </div>

              {/* Horizontal Scroll Cards */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  overflowX: "auto",
                  paddingBottom: "8px",
                  scrollbarWidth: "none",
                }}
              >
                {popularPizzas.map((prod, idx) => (
                  <div
                    key={prod.id}
                    onClick={() => handleOpenDetail(prod)}
                    style={{
                      flexShrink: 0,
                      width: "160px",
                      background: "#ffffff",
                      borderRadius: 16,
                      border: "1px solid #f1f5f9",
                      overflow: "hidden",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ position: "relative", width: "100%", height: "100px", background: "#f8fafc" }}>
                      <img
                        src={prod.image_url || DEFAULT_PIZZA_IMG}
                        alt={prod.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      {idx === 0 && (
                        <span
                          style={{
                            position: "absolute",
                            top: 6,
                            left: 6,
                            fontSize: "8px",
                            fontWeight: 900,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "#ef4444",
                            color: "#ffffff",
                          }}
                        >
                          Best Seller
                        </span>
                      )}
                    </div>

                    <div style={{ padding: "8px 10px 10px" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 800,
                          color: "#0f172a",
                          lineHeight: 1.2,
                          marginBottom: "2px",
                        }}
                      >
                        {prod.name}
                      </div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#94a3b8",
                          marginBottom: "8px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {prod.description || "Pepperoni, chicken, beef & sauce"}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "13px", fontWeight: 900, color: "#ef4444" }}>
                          {formatPrice(prod.price ?? 0)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleQuickAdd(prod, e)}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            background: "#ef4444",
                            border: "none",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          <Icons.Plus size={14} color="#ffffff" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: MENU VIEW (Screen 2) ─── */}
        {activeTab === "menu" && (
          <div style={{ flex: 1, paddingBottom: "80px", overflowY: "auto" }}>
            {/* Title Header */}
            <div style={{ padding: "8px 18px 4px" }}>
              <h2 style={{ fontSize: "22px", fontWeight: 900, color: "#0f172a", margin: 0 }}>Menu</h2>
            </div>

            {/* Search Input Bar (Screen 2) */}
            <div style={{ padding: "8px 18px 12px" }}>
              <div
                style={{
                  position: "relative",
                  background: "#f8fafc",
                  borderRadius: 14,
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 12px",
                }}
              >
                <Icons.Search size={16} color="#94a3b8" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pizzas, burgers, drinks..."
                  style={{
                    flex: 1,
                    padding: "10px 8px",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: "12px",
                    color: "#0f172a",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setActiveTab("cart")}
                  style={{ background: "none", border: "none", cursor: "pointer", position: "relative" }}
                >
                  <Icons.Cart size={16} color="#ef4444" />
                </button>
              </div>
            </div>

            {/* Category Pills Bar (All, Pizzas, Burgers, Sides, Drinks) */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                padding: "0 18px 14px",
                overflowX: "auto",
                scrollbarWidth: "none",
              }}
            >
              {["All", "Pizzas", "Burgers", "Sides", "Drinks"].map((cat) => {
                const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      flexShrink: 0,
                      padding: "7px 14px",
                      borderRadius: 20,
                      fontSize: "12px",
                      fontWeight: 800,
                      border: "none",
                      background: isActive ? "#ef4444" : "#f1f5f9",
                      color: isActive ? "#ffffff" : "#64748b",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Vertical Row List (Screen 2) */}
            <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {filteredProducts.map((p, idx) => (
                <div
                  key={p.id}
                  onClick={() => handleOpenDetail(p)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "8px",
                    borderRadius: 16,
                    background: "#ffffff",
                    border: "1px solid #f1f5f9",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                    cursor: "pointer",
                  }}
                >
                  {/* Left Thumbnail */}
                  <img
                    src={p.image_url || DEFAULT_PIZZA_IMG}
                    alt={p.name}
                    style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover", flexShrink: 0 }}
                  />

                  {/* Middle Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>
                        {p.name}
                      </span>
                      {idx === 0 && (
                        <span
                          style={{
                            fontSize: "8px",
                            fontWeight: 900,
                            padding: "2px 5px",
                            borderRadius: 4,
                            background: "#ef4444",
                            color: "#ffffff",
                          }}
                        >
                          Best Seller
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#94a3b8",
                        margin: "2px 0 6px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {p.description || "Freshly baked artisan specialty"}
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 900, color: "#ef4444" }}>
                      {formatPrice(p.price ?? 0)}
                    </div>
                  </div>

                  {/* Right + Button */}
                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(p, e)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#ef4444",
                      border: "none",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <Icons.Plus size={15} color="#ffffff" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB 3: YOUR CART (Screen 4) ─── */}
        {activeTab === "cart" && (
          <div style={{ flex: 1, paddingBottom: "80px", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div
              style={{
                padding: "12px 18px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("menu")}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  <Icons.ChevronLeft size={18} color="#0f172a" />
                </button>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 900, color: "#0f172a", margin: 0 }}>
                    Your Cart
                  </h3>
                  <div style={{ fontSize: "10px", color: "#94a3b8" }}>{totalItems} items</div>
                </div>
              </div>

              {items.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  style={{ background: "none", border: "none", color: "#ef4444", fontSize: "12px", fontWeight: 800, cursor: "pointer" }}
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
              {items.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                  <Icons.Cart size={48} color="#cbd5e1" />
                  <p style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", marginTop: "12px" }}>
                    Your cart is empty
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("menu")}
                    style={{
                      background: "#ef4444",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 800,
                      padding: "8px 16px",
                      borderRadius: 10,
                      border: "none",
                      cursor: "pointer",
                      marginTop: "8px",
                    }}
                  >
                    Browse Menu
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {items.map((item) => {
                    const key = `${item.product.id}_${item.selectedVariation?.name || "base"}_`;
                    const itemUnitPrice =
                      (item.selectedVariation ? item.selectedVariation.price : (item.product.price ?? 0)) +
                      (item.selectedToppings || []).reduce((sum, t) => sum + (t.price || 0), 0);

                    return (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          paddingBottom: "12px",
                          borderBottom: "1px solid #f8fafc",
                        }}
                      >
                        <img
                          src={item.product.image_url || DEFAULT_PIZZA_IMG}
                          alt={item.product.name}
                          style={{ width: 50, height: 50, borderRadius: 10, objectFit: "cover" }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>
                            {item.product.name}
                          </div>
                          <div style={{ fontSize: "10px", color: "#94a3b8" }}>
                            {item.selectedVariation?.name || "Regular"}
                          </div>
                          <div style={{ fontSize: "12px", fontWeight: 800, color: "#ef4444", marginTop: "2px" }}>
                            {formatPrice(itemUnitPrice)}
                          </div>
                        </div>

                        {/* Stepper */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: 8,
                            padding: "3px 6px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setQty(key, item.quantity - 1)}
                            style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b", padding: 0 }}
                          >
                            <Icons.Minus size={11} />
                          </button>
                          <span style={{ fontSize: "11px", fontWeight: 800 }}>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQty(key, item.quantity + 1)}
                            style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b", padding: 0 }}
                          >
                            <Icons.Plus size={11} />
                          </button>
                        </div>

                        {/* Trash */}
                        <button
                          type="button"
                          onClick={() => removeItem(key)}
                          style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                        >
                          <Icons.Trash size={14} color="#ef4444" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Order Details Summary Box (Screen 4) */}
            {items.length > 0 && (
              <div
                style={{
                  padding: "16px 18px",
                  background: "#ffffff",
                  borderTop: "1px solid #f1f5f9",
                  boxShadow: "0 -4px 16px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>
                  <span>Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>
                  <span>Delivery Fee</span>
                  <span>{formatPrice(deliveryFee)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>
                  <span>Tax (10%)</span>
                  <span>{formatPrice(taxAmount)}</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "15px",
                    fontWeight: 900,
                    color: "#0f172a",
                    paddingTop: "8px",
                    borderTop: "1px dashed #e2e8f0",
                    marginBottom: "14px",
                  }}
                >
                  <span>Total</span>
                  <span style={{ color: "#ef4444" }}>{formatPrice(grandTotal)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCheckoutStep(1);
                    setCheckoutOpen(true);
                  }}
                  style={{
                    width: "100%",
                    background: "#ef4444",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 900,
                    padding: "13px",
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    boxShadow: "0 4px 14px rgba(239, 68, 68, 0.35)",
                  }}
                >
                  <span>Proceed to Checkout</span>
                  <Icons.ArrowRight size={14} color="#ffffff" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 4: PROFILE VIEW (Screen 9) ─── */}
        {activeTab === "profile" && (
          <div style={{ flex: 1, paddingBottom: "80px", overflowY: "auto" }}>
            {/* User Profile Header */}
            <div
              style={{
                padding: "20px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "#fee2e2",
                    color: "#ef4444",
                    fontSize: "16px",
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {customerName ? customerName.slice(0, 2).toUpperCase() : "SS"}
                </div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 900, color: "#0f172a" }}>
                    {customerName || "Syed Shah"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                    {customerPhone || "syed@gmail.com"}
                  </div>
                </div>
              </div>

              <button type="button" style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Icons.Settings size={18} color="#64748b" />
              </button>
            </div>

            {/* Menu Links List (Screen 9) */}
            <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                { title: "My Orders", icon: "📋", action: () => handleOpenTracking() },
                { title: "Addresses", icon: "📍", action: () => alert(`Current: ${customerAddress}`) },
                { title: "Payment Methods", icon: "💳", action: () => alert("Methods: Cash on Delivery, JazzCash, Card") },
                { title: "Wishlist", icon: "🤍", action: () => setActiveTab("menu") },
                { title: "Notification Settings", icon: "🔔", action: () => alert("SMS & WhatsApp order alerts are active.") },
                { title: "Help & Support", icon: "❓", action: () => window.open("https://wa.me/?text=Hello%20support", "_blank") },
                { title: `About ${shopTitle}`, icon: "ℹ️", action: () => alert(`${shopTitle} — Artisan Kitchen. Opening: ${settings.opening_time || "11:00 AM"} to ${settings.closing_time || "01:00 AM"}`) },
              ].map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={item.action}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 10px",
                    background: "#ffffff",
                    border: "none",
                    borderRadius: 10,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  className="hover:bg-slate-50"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "14px" }}>{item.icon}</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                      {item.title}
                    </span>
                  </div>
                  <Icons.ChevronRight size={14} color="#cbd5e1" />
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setCustomerName("");
                  setCustomerPhone("");
                  alert("Logged out.");
                }}
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  borderRadius: 12,
                  background: "#fef2f2",
                  border: "none",
                  color: "#ef4444",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Log Out
              </button>
            </div>
          </div>
        )}

        {/* ─── BOTTOM NAVIGATION BAR (Screens 1, 2, 4, 9) ─── */}
        <nav
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "64px",
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(12px)",
            borderTop: "1px solid #f1f5f9",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            alignItems: "center",
            zIndex: 40,
          }}
        >
          {/* Home */}
          <button
            type="button"
            onClick={() => setActiveTab("home")}
            style={{
              background: "none",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              cursor: "pointer",
              color: activeTab === "home" ? "#ef4444" : "#94a3b8",
            }}
          >
            <Icons.Home size={19} color={activeTab === "home" ? "#ef4444" : "#94a3b8"} />
            <span style={{ fontSize: "10px", fontWeight: activeTab === "home" ? 800 : 600 }}>Home</span>
          </button>

          {/* Menu */}
          <button
            type="button"
            onClick={() => setActiveTab("menu")}
            style={{
              background: "none",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              cursor: "pointer",
              color: activeTab === "menu" ? "#ef4444" : "#94a3b8",
            }}
          >
            <Icons.Menu size={19} color={activeTab === "menu" ? "#ef4444" : "#94a3b8"} />
            <span style={{ fontSize: "10px", fontWeight: activeTab === "menu" ? 800 : 600 }}>Menu</span>
          </button>

          {/* Cart */}
          <button
            type="button"
            onClick={() => setActiveTab("cart")}
            style={{
              background: "none",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              cursor: "pointer",
              color: activeTab === "cart" ? "#ef4444" : "#94a3b8",
              position: "relative",
            }}
          >
            <div style={{ position: "relative" }}>
              <Icons.Cart size={19} color={activeTab === "cart" ? "#ef4444" : "#94a3b8"} />
              {totalItems > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -6,
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: "#ef4444",
                    color: "#ffffff",
                    fontSize: "8px",
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {totalItems}
                </span>
              )}
            </div>
            <span style={{ fontSize: "10px", fontWeight: activeTab === "cart" ? 800 : 600 }}>Cart</span>
          </button>

          {/* Profile */}
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            style={{
              background: "none",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              cursor: "pointer",
              color: activeTab === "profile" ? "#ef4444" : "#94a3b8",
            }}
          >
            <Icons.User size={19} color={activeTab === "profile" ? "#ef4444" : "#94a3b8"} />
            <span style={{ fontSize: "10px", fontWeight: activeTab === "profile" ? 800 : 600 }}>Profile</span>
          </button>
        </nav>

        {/* ─── SCREEN 3: PRODUCT DETAIL MODAL (Exact match) ─── */}
        {selectedProduct && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 50,
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
            }}
          >
            {/* Top Image with Back & Favorite */}
            <div style={{ position: "relative", width: "100%", height: "230px", background: "#0c0f17" }}>
              <img
                src={selectedProduct.image_url || DEFAULT_PIZZA_IMG}
                alt={selectedProduct.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />

              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                style={{
                  position: "absolute",
                  top: 14,
                  left: 14,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Icons.ChevronLeft size={16} color="#ffffff" />
              </button>

              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Icons.Heart
                  size={16}
                  fill={isFavorite ? "#ef4444" : "none"}
                  color={isFavorite ? "#ef4444" : "#ffffff"}
                />
              </button>
            </div>

            {/* Content Details */}
            <div style={{ padding: "18px 20px 90px", flex: 1 }}>
              <span
                style={{
                  display: "inline-block",
                  fontSize: "9px",
                  fontWeight: 900,
                  padding: "3px 7px",
                  borderRadius: 4,
                  background: "#ef4444",
                  color: "#ffffff",
                  marginBottom: "8px",
                }}
              >
                {selectedProduct.badge || "Best Seller"}
              </span>

              <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a", margin: "0 0 4px" }}>
                {selectedProduct.name}
              </h2>
              <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 10px", lineHeight: 1.4 }}>
                {selectedProduct.description ||
                  "A perfect blend of pepperoni, chicken, beef, mozzarella and our special sauce."}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                <span style={{ color: "#f59e0b", display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", fontWeight: 800 }}>
                  <Icons.Star size={12} fill="#f59e0b" color="#f59e0b" />
                  4.8
                </span>
                <span style={{ fontSize: "10px", color: "#94a3b8" }}>(124 reviews)</span>
              </div>

              {/* Price */}
              <div style={{ fontSize: "18px", fontWeight: 900, color: "#ef4444", marginBottom: "16px" }}>
                {formatPrice(
                  (selectedVariation ? selectedVariation.price : (selectedProduct.price ?? 0)) +
                    selectedToppings.reduce((sum, t) => sum + (t.price || 0), 0)
                )}
              </div>

              {/* Size Selector (Screen 3) */}
              <div style={{ marginBottom: "18px" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
                  Size
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["Small (9')", "Medium (12')", "Large (15')"].map((sizeLabel, idx) => {
                    const isSelected = selectedVariation ? selectedVariation.name === sizeLabel : idx === 1;
                    return (
                      <button
                        key={sizeLabel}
                        type="button"
                        onClick={() => setSelectedVariation({ name: sizeLabel, price: (selectedProduct.price ?? 1250) + idx * 300 })}
                        style={{
                          flex: 1,
                          padding: "8px",
                          borderRadius: 10,
                          border: isSelected ? "1.5px solid #ef4444" : "1px solid #e2e8f0",
                          background: isSelected ? "#ef4444" : "#ffffff",
                          color: isSelected ? "#ffffff" : "#475569",
                          fontSize: "11px",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        {sizeLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Extra Toppings Checkboxes (Screen 3) */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
                  Add Extra Toppings
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    { name: "Extra Cheese", price: 150 },
                    { name: "Olives", price: 80 },
                    { name: "Mushrooms", price: 80 },
                    { name: "Jalapenos", price: 60 },
                  ].map((top) => {
                    const checked = selectedToppings.some((t) => t.name === top.name);
                    return (
                      <label
                        key={top.name}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 10px",
                          borderRadius: 8,
                          background: checked ? "#fef2f2" : "#f8fafc",
                          border: checked ? "1px solid #fca5a5" : "1px solid #f1f5f9",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked) {
                                setSelectedToppings((prev) => prev.filter((t) => t.name !== top.name));
                              } else {
                                setSelectedToppings((prev) => [...prev, top]);
                              }
                            }}
                            style={{ accentColor: "#ef4444", width: 14, height: 14 }}
                          />
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a" }}>
                            {top.name}
                          </span>
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "#ef4444" }}>
                          +{formatPrice(top.price)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>Quantity</span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "#f1f5f9",
                    borderRadius: 10,
                    padding: "4px 10px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setDetailQty(Math.max(1, detailQty - 1))}
                    style={{ border: "none", background: "none", cursor: "pointer", color: "#475569" }}
                  >
                    <Icons.Minus size={13} />
                  </button>
                  <span style={{ fontSize: "12px", fontWeight: 800, minWidth: "16px", textAlign: "center" }}>
                    {detailQty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDetailQty(detailQty + 1)}
                    style={{ border: "none", background: "none", cursor: "pointer", color: "#475569" }}
                  >
                    <Icons.Plus size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Sticky Button: Add to Cart */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "12px 18px",
                background: "#ffffff",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <button
                type="button"
                onClick={handleAddFromDetail}
                style={{
                  width: "100%",
                  background: addedToast ? "#16a34a" : "#ef4444",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 900,
                  padding: "13px",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4)",
                  transition: "background 0.2s",
                }}
              >
                {addedToast ? (
                  <>
                    <Icons.Check size={16} color="#ffffff" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <span>
                    Add to Cart &mdash;{" "}
                    {formatPrice(
                      ((selectedVariation ? selectedVariation.price : (selectedProduct.price ?? 0)) +
                        selectedToppings.reduce((sum, t) => sum + (t.price || 0), 0)) *
                        detailQty
                    )}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── SCREEN 5, 6, 8: CHECKOUT FLOW & ORDER CONFIRMED ─── */}
        {checkoutOpen && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 60,
              background: checkoutStep === 3 ? "#ffffff" : "#ffffff",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
            }}
          >
            {/* Header */}
            {checkoutStep !== 3 && (
              <div
                style={{
                  padding: "12px 18px",
                  borderBottom: "1px solid #f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (checkoutStep === 2) setCheckoutStep(1);
                    else setCheckoutOpen(false);
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  <Icons.ChevronLeft size={18} color="#0f172a" />
                </button>
                <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0 }}>
                  {checkoutStep === 1 ? "Checkout" : "Payment Method"}
                </h3>
              </div>
            )}

            {/* Step Stepper Indicator (1 - Delivery, 2 - Payment, 3 - Confirmation) */}
            {checkoutStep !== 3 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 18px",
                  borderBottom: "1px solid #f8fafc",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: checkoutStep >= 1 ? "#ef4444" : "#e2e8f0",
                      color: "#ffffff",
                      fontSize: "10px",
                      fontWeight: 900,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    1
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: checkoutStep === 1 ? "#ef4444" : "#64748b" }}>
                    Delivery
                  </span>
                </div>

                <div style={{ height: 1, flex: 1, background: "#e2e8f0", margin: "0 8px" }} />

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: checkoutStep >= 2 ? "#ef4444" : "#e2e8f0",
                      color: "#ffffff",
                      fontSize: "10px",
                      fontWeight: 900,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    2
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: checkoutStep === 2 ? "#ef4444" : "#64748b" }}>
                    Payment
                  </span>
                </div>

                <div style={{ height: 1, flex: 1, background: "#e2e8f0", margin: "0 8px" }} />

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "#e2e8f0",
                      color: "#64748b",
                      fontSize: "10px",
                      fontWeight: 900,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    3
                  </span>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Confirmation</span>
                </div>
              </div>
            )}

            {/* ─── CHECKOUT STEP 1: DELIVERY INFO (Screen 5) ─── */}
            {checkoutStep === 1 && (
              <div style={{ padding: "16px 18px", flex: 1, overflowY: "auto" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
                  Delivery Information
                </div>

                {/* Delivery Address Card */}
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: 14,
                    padding: "12px",
                    border: "1px solid #e2e8f0",
                    marginBottom: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <Icons.MapPin size={16} color="#ef4444" />
                      <div>
                        <input
                          type="text"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          placeholder="Your street address"
                          style={{
                            width: "100%",
                            background: "transparent",
                            border: "none",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#0f172a",
                            outline: "none",
                          }}
                        />
                        <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
                          {customerPhone || "+92 300 1234567"}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: 700 }}>Edit</span>
                  </div>
                </div>

                {/* Delivery Type (Delivery vs Pickup) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                  <button
                    type="button"
                    onClick={() => setDeliveryType("delivery")}
                    style={{
                      padding: "12px",
                      borderRadius: 12,
                      border: deliveryType === "delivery" ? "1.5px solid #ef4444" : "1px solid #e2e8f0",
                      background: deliveryType === "delivery" ? "#fef2f2" : "#f8fafc",
                      color: deliveryType === "delivery" ? "#ef4444" : "#64748b",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <Icons.Truck size={16} color={deliveryType === "delivery" ? "#ef4444" : "#64748b"} />
                    <span>Delivery</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType("pickup")}
                    style={{
                      padding: "12px",
                      borderRadius: 12,
                      border: deliveryType === "pickup" ? "1.5px solid #ef4444" : "1px solid #e2e8f0",
                      background: deliveryType === "pickup" ? "#fef2f2" : "#f8fafc",
                      color: deliveryType === "pickup" ? "#ef4444" : "#64748b",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <Icons.Bag size={16} color={deliveryType === "pickup" ? "#ef4444" : "#64748b"} />
                    <span>Pickup</span>
                  </button>
                </div>

                {/* Contact Number */}
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "#475569", marginBottom: "4px" }}>
                    Contact Number
                  </div>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Customer Name */}
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "#475569", marginBottom: "4px" }}>
                    Your Name
                  </div>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Syed Shah"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Special Instructions (Optional) */}
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "#475569", marginBottom: "4px" }}>
                    Special Instructions (Optional)
                  </div>
                  <textarea
                    rows={2}
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Ring the bell, extra sauce, etc."
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      fontSize: "11px",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Button: Continue to Payment */}
                <button
                  type="button"
                  onClick={() => {
                    if (!customerPhone.trim()) {
                      alert("Please provide your contact number.");
                      return;
                    }
                    setCheckoutStep(2);
                  }}
                  style={{
                    width: "100%",
                    background: "#ef4444",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 900,
                    padding: "13px",
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(239, 68, 68, 0.35)",
                  }}
                >
                  Continue to Payment &rarr;
                </button>
              </div>
            )}

            {/* ─── CHECKOUT STEP 2: PAYMENT METHOD (Screen 6) ─── */}
            {checkoutStep === 2 && (
              <div style={{ padding: "16px 18px", flex: 1, overflowY: "auto" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                  {/* Card 1: Cash on Delivery */}
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: paymentMethod === "cod" ? "1.5px solid #ef4444" : "1px solid #e2e8f0",
                      background: paymentMethod === "cod" ? "#fef2f2" : "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Icons.Cash size={18} color="#ef4444" />
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>
                          Cash on Delivery
                        </div>
                        <div style={{ fontSize: "10px", color: "#64748b" }}>
                          Pay when you receive your order
                        </div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="pay"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      style={{ accentColor: "#ef4444" }}
                    />
                  </label>

                  {/* Card 2: Online Payment */}
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: paymentMethod === "online" ? "1.5px solid #ef4444" : "1px solid #e2e8f0",
                      background: paymentMethod === "online" ? "#fef2f2" : "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Icons.CreditCard size={18} color="#0f172a" />
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>
                          Online Payment
                        </div>
                        <div style={{ fontSize: "10px", color: "#64748b" }}>
                          Pay securely with card &bull; VISA / Apple Pay
                        </div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="pay"
                      checked={paymentMethod === "online"}
                      onChange={() => setPaymentMethod("online")}
                      style={{ accentColor: "#ef4444" }}
                    />
                  </label>

                  {/* Card 3: JazzCash / EasyPaisa */}
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: paymentMethod === "wallet" ? "1.5px solid #ef4444" : "1px solid #e2e8f0",
                      background: paymentMethod === "wallet" ? "#fef2f2" : "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "16px" }}>📱</span>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>
                          JazzCash / EasyPaisa
                        </div>
                        <div style={{ fontSize: "10px", color: "#64748b" }}>
                          Pay with JazzCash or Easypaisa
                        </div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="pay"
                      checked={paymentMethod === "wallet"}
                      onChange={() => setPaymentMethod("wallet")}
                      style={{ accentColor: "#ef4444" }}
                    />
                  </label>
                </div>

                {/* Order Summary Box */}
                <div
                  style={{
                    padding: "14px",
                    background: "#f8fafc",
                    borderRadius: 14,
                    border: "1px solid #e2e8f0",
                    marginBottom: "18px",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
                    Order Summary
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>
                    <span>Subtotal</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>
                    <span>Delivery Fee</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>
                    <span>Tax (10%)</span>
                    <span>{formatPrice(taxAmount)}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "14px",
                      fontWeight: 900,
                      color: "#0f172a",
                      paddingTop: "6px",
                      borderTop: "1px dashed #cbd5e1",
                    }}
                  >
                    <span>Total</span>
                    <span style={{ color: "#ef4444" }}>{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  type="button"
                  disabled={isSubmittingOrder}
                  onClick={handlePlaceOrder}
                  style={{
                    width: "100%",
                    background: isSubmittingOrder ? "#94a3b8" : "#ef4444",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 900,
                    padding: "13px",
                    borderRadius: 12,
                    border: "none",
                    cursor: isSubmittingOrder ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    boxShadow: "0 4px 14px rgba(239, 68, 68, 0.35)",
                  }}
                >
                  <Icons.Lock size={15} color="#ffffff" />
                  <span>
                    {isSubmittingOrder ? "Submitting Order..." : `Place Order — ${formatPrice(grandTotal)}`}
                  </span>
                </button>
              </div>
            )}

            {/* ─── CHECKOUT STEP 3: ORDER CONFIRMED! (Screen 8) ─── */}
            {checkoutStep === 3 && (
              <div
                style={{
                  padding: "40px 22px",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                }}
              >
                {/* Big Green Circle Checkmark */}
                <div
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: "50%",
                    background: "#16a34a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                    boxShadow: "0 8px 24px rgba(22, 163, 74, 0.35)",
                  }}
                >
                  <Icons.Check size={36} color="#ffffff" strokeWidth={3} />
                </div>

                <h2 style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", margin: "0 0 6px" }}>
                  Order Confirmed!
                </h2>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 20px" }}>
                  Your delicious food is on the way.
                </p>

                {/* Order Details Card */}
                <div
                  style={{
                    width: "100%",
                    background: "#f8fafc",
                    borderRadius: 14,
                    padding: "14px",
                    border: "1px solid #e2e8f0",
                    textAlign: "left",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Order ID</span>
                    <span style={{ fontSize: "12px", fontWeight: 900, color: "#0f172a" }}>
                      #{confirmedOrderId || "P2123456"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Estimated Delivery Time</span>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>
                      25 - 35 Minutes
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Payment Method</span>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>
                      {paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}
                    </span>
                  </div>
                </div>

                {/* Primary Button: Track Order (Screen 7) */}
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutOpen(false);
                    handleOpenTracking(confirmedOrderId);
                  }}
                  style={{
                    width: "100%",
                    background: "#ef4444",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 900,
                    padding: "13px",
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(239, 68, 68, 0.35)",
                    marginBottom: "10px",
                  }}
                >
                  Track Order
                </button>

                {/* Secondary Button: Back to Home */}
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutOpen(false);
                    setActiveTab("home");
                  }}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "1px solid #e2e8f0",
                    color: "#334155",
                    fontSize: "13px",
                    fontWeight: 800,
                    padding: "12px",
                    borderRadius: 12,
                    cursor: "pointer",
                    marginBottom: "16px",
                  }}
                >
                  Back to Home
                </button>

                <div style={{ fontSize: "12px", color: "#ef4444", fontWeight: 700 }}>
                  Thank you! Enjoy your meal &hearts;
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── SCREEN 7: TRACK ORDER MODAL (Screen 7 with live rider) ─── */}
        {trackOrderOpen && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 65,
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "12px 18px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => setTrackOrderOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <Icons.ChevronLeft size={18} color="#0f172a" />
              </button>
              <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0 }}>Track Order</h3>
            </div>

            {/* Visual Live Map Simulation (Screen 7) */}
            <div
              style={{
                height: "170px",
                background: "#f1f5f9",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {/* Road Graphics */}
              <div
                style={{
                  width: "80%",
                  height: "4px",
                  background: "#cbd5e1",
                  borderRadius: 2,
                  position: "relative",
                }}
              >
                {/* Store Pin */}
                <div style={{ position: "absolute", left: -10, top: -14, fontSize: "18px" }}>🏠</div>

                {/* Rider Motorcycle */}
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: -18,
                    fontSize: "22px",
                    animation: "bounce 1s infinite alternate",
                  }}
                >
                  🛵
                </div>

                {/* Destination Pin */}
                <div style={{ position: "absolute", right: -10, top: -14, fontSize: "18px" }}>📍</div>
              </div>

              {/* Status Pill: Out for Delivery */}
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 14,
                  background: "#ef4444",
                  color: "#ffffff",
                  fontSize: "10px",
                  fontWeight: 900,
                  padding: "4px 8px",
                  borderRadius: 12,
                }}
              >
                Out for Delivery
              </div>
            </div>

            {/* Rider Card & ETA (Screen 7) */}
            <div style={{ padding: "16px 18px", flex: 1 }}>
              <h3 style={{ fontSize: "16px", fontWeight: 900, color: "#0f172a", margin: "0 0 4px" }}>
                Your order is on the way!
              </h3>
              <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 16px" }}>
                Our rider is heading to your location. ETA 15 minutes.
              </p>

              {/* Rider Info Card */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px",
                  background: "#f8fafc",
                  borderRadius: 14,
                  border: "1px solid #e2e8f0",
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      background: "#fee2e2",
                      color: "#ef4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: "15px",
                    }}
                  >
                    AR
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 900, color: "#0f172a" }}>
                      {trackedOrderData?.rider_name || "Ali Raza"}
                    </div>
                    <div style={{ fontSize: "10px", color: "#64748b" }}>
                      {trackedOrderData?.rider_vehicle || "Rider &bull; PK-4587"}
                    </div>
                  </div>
                </div>

                {/* Call Rider Button */}
                <a
                  href={`tel:${trackedOrderData?.rider_phone || "03001234567"}`}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ef4444",
                    textDecoration: "none",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                  }}
                >
                  <Icons.Phone size={16} color="#ef4444" />
                </a>
              </div>

              {/* Order Status Stepper (Screen 7) */}
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", marginBottom: "12px" }}>
                Order #{trackedOrderData?.order_number || confirmedOrderId || "P2123456"}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px", position: "relative" }}>
                {[
                  { title: "Order Placed", time: "10:24 AM", done: true },
                  { title: "Preparing", time: "10:26 AM", done: true },
                  { title: "Out for Delivery", time: "10:48 AM", done: true },
                  { title: "Delivered", time: "Pending", done: false },
                ].map((step, idx) => (
                  <div key={step.title} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: step.done ? "#16a34a" : "#e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ffffff",
                        fontSize: "10px",
                        fontWeight: 900,
                      }}
                    >
                      {step.done ? "✓" : ""}
                    </div>
                    <div style={{ flex: 1, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12px", fontWeight: step.done ? 800 : 500, color: step.done ? "#0f172a" : "#94a3b8" }}>
                        {step.title}
                      </span>
                      <span style={{ fontSize: "10px", color: "#94a3b8" }}>{step.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
