"use client";

import { useState } from "react";
import Link from "next/link";
import DemoNav from "@/components/demo/DemoNav";

interface DemoProduct {
  id: string;
  name: string;
  category: "pizza" | "burger" | "side" | "drink";
  desc: string;
  image: string;
  badge?: string;
  sizes: { name: string; price: number }[];
  toppings: { name: string; price: number }[];
}

interface CartItem {
  id: string;
  productId: string;
  name: string;
  sizeName: string;
  price: number;
  quantity: number;
  toppings: { name: string; price: number }[];
  notes?: string;
}

const PRODUCTS: DemoProduct[] = [
  {
    id: "p1",
    name: "Chicken Tikka Supreme",
    category: "pizza",
    desc: "Tender spicy chicken tikka chunks, caramelized onions, green peppers, mozzarella cheese, and signature red sauce.",
    image: "🍕",
    badge: "BESTSELLER",
    sizes: [
      { name: "Small (8\")", price: 950 },
      { name: "Medium (10\")", price: 1590 },
      { name: "Large (13\")", price: 2190 },
    ],
    toppings: [
      { name: "Extra Mozzarella Cheese", price: 180 },
      { name: "Cheesy Stuffed Crust", price: 250 },
      { name: "Spicy Jalapenos & Olives", price: 90 },
      { name: "Extra Chicken Tikka Chunks", price: 220 },
    ],
  },
  {
    id: "p2",
    name: "Pepperoni Passion Feast",
    category: "pizza",
    desc: "Double portion of beef pepperoni, loaded mozzarella, savory Italian tomato blend, and dried oregano crust.",
    image: "🍕",
    badge: "CHEF PICK",
    sizes: [
      { name: "Small (8\")", price: 1050 },
      { name: "Medium (10\")", price: 1690 },
      { name: "Large (13\")", price: 2290 },
    ],
    toppings: [
      { name: "Extra Pepperoni Slices", price: 200 },
      { name: "Extra Mozzarella Cheese", price: 180 },
      { name: "Garlic Butter Crust Edge", price: 120 },
    ],
  },
  {
    id: "p3",
    name: "Fajita Sensation Grill",
    category: "pizza",
    desc: "Marinated Mexican fajita chicken, sweet corn, crunchy capsicum, black olives, and rich cream cheese drizzle.",
    image: "🍕",
    sizes: [
      { name: "Small (8\")", price: 990 },
      { name: "Medium (10\")", price: 1590 },
      { name: "Large (13\")", price: 2190 },
    ],
    toppings: [
      { name: "Extra Fajita Chicken", price: 220 },
      { name: "Extra Mozzarella Cheese", price: 180 },
      { name: "Jalapeno Ranch Sauce Drizzle", price: 90 },
    ],
  },
  {
    id: "p4",
    name: "Gourmet Beef Smashed Burger",
    category: "burger",
    desc: "Double smashed prime beef patties, melted sharp cheddar, dill pickles, grilled onions, and house burger glaze in brioche bun.",
    image: "🍔",
    badge: "POPULAR",
    sizes: [
      { name: "Single Patty Meal", price: 690 },
      { name: "Double Smash Meal + Fries", price: 980 },
    ],
    toppings: [
      { name: "Extra Melted Cheddar", price: 120 },
      { name: "Beef Bacon Strips", price: 180 },
      { name: "Crispy Onion Rings Topper", price: 90 },
    ],
  },
  {
    id: "p5",
    name: "Crispy Peri Peri Wings (6 Pcs)",
    category: "side",
    desc: "Crispy golden fried chicken wings tossed in tangy Portuguese peri-peri sauce, served with garlic mayo dip.",
    image: "🍗",
    sizes: [{ name: "6 Pieces Box", price: 540 }, { name: "12 Pieces Party Box", price: 980 }],
    toppings: [
      { name: "Extra Peri Dip", price: 80 },
      { name: "Seasoned Curly Fries", price: 190 },
    ],
  },
  {
    id: "p6",
    name: "Cheesy Garlic Herb Bread",
    category: "side",
    desc: "Warm oven-toasted baguette slices smothered in fresh garlic butter, parsley, and bubbling mozzarella cheese.",
    image: "🥖",
    sizes: [{ name: "4 Pieces Plate", price: 390 }],
    toppings: [{ name: "Extra Cheese Layer", price: 120 }, { name: "Marinara Dipping Sauce", price: 70 }],
  },
  {
    id: "p7",
    name: "Chilled Coca-Cola / Sprite",
    category: "drink",
    desc: "Ice cold refreshing soft drink to complement your meal.",
    image: "🥤",
    sizes: [
      { name: "Can 345ml", price: 120 },
      { name: "Bottle 1.5L", price: 220 },
    ],
    toppings: [],
  },
];

export default function DemoMenuPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([
    {
      id: "cart-init-1",
      productId: "p1",
      name: "Chicken Tikka Supreme",
      sizeName: "Large (13\")",
      price: 2190,
      quantity: 1,
      toppings: [{ name: "Cheesy Stuffed Crust", price: 250 }],
      notes: "Crispy crust please",
    },
    {
      id: "cart-init-2",
      productId: "p6",
      name: "Cheesy Garlic Herb Bread",
      sizeName: "4 Pieces Plate",
      price: 390,
      quantity: 1,
      toppings: [],
    },
  ]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Customization modal state
  const [activeModalProduct, setActiveModalProduct] = useState<DemoProduct | null>(null);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState<number>(0);
  const [selectedToppings, setSelectedToppings] = useState<{ name: string; price: number }[]>([]);
  const [itemNotes, setItemNotes] = useState("");

  // Promo & Loyalty state
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>({
    code: "WELCOME20",
    amount: 566,
  });
  const [loyaltyPhone, setLoyaltyPhone] = useState("0333-4867615");
  const [loyaltyApplied, setLoyaltyApplied] = useState(false);
  const [orderType, setOrderType] = useState<"delivery" | "takeaway" | "dine_in">("delivery");
  const [orderPlacedSuccess, setOrderPlacedSuccess] = useState(false);

  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  const openCustomizer = (prod: DemoProduct) => {
    setActiveModalProduct(prod);
    setSelectedSizeIndex(0);
    setSelectedToppings([]);
    setItemNotes("");
  };

  const toggleTopping = (topping: { name: string; price: number }) => {
    if (selectedToppings.some((t) => t.name === topping.name)) {
      setSelectedToppings(selectedToppings.filter((t) => t.name !== topping.name));
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  const addToCartFromModal = () => {
    if (!activeModalProduct) return;
    const size = activeModalProduct.sizes[selectedSizeIndex] || activeModalProduct.sizes[0];
    const toppingsTotal = selectedToppings.reduce((sum, t) => sum + t.price, 0);
    const itemPrice = size.price + toppingsTotal;

    const newItem: CartItem = {
      id: "cart-" + Date.now(),
      productId: activeModalProduct.id,
      name: activeModalProduct.name,
      sizeName: size.name,
      price: itemPrice,
      quantity: 1,
      toppings: selectedToppings,
      notes: itemNotes.trim(),
    };

    setCart([...cart, newItem]);
    setActiveModalProduct(null);
    setIsCartOpen(true);
    playChime();
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const applyPromo = () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (code === "SAVE20" || code === "WELCOME20") {
      setAppliedDiscount({ code, amount: Math.round(subtotal * 0.2) });
      playChime();
    } else if (code === "FLAT200") {
      setAppliedDiscount({ code, amount: 200 });
      playChime();
    } else {
      alert("Invalid code. Try 'SAVE20' or 'FLAT200' for this demo!");
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = appliedDiscount ? Math.min(appliedDiscount.amount, subtotal) : 0;
  const loyaltyCashback = loyaltyApplied ? 150 : 0;
  const deliveryFee = orderType === "delivery" ? 150 : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount - loyaltyCashback + deliveryFee);
  const totalCartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const filteredProducts = PRODUCTS.filter((p) => {
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePlaceOrder = () => {
    playChime();
    setOrderPlacedSuccess(true);
  };

  return (
    <div style={{ minHeight: "125vh", background: "#f8fafc", color: "#0f172a" }}>
      {/* Universal Top Demo Bar */}
      <DemoNav currentModule="menu" />

      {/* Brand Header */}
      <header
        style={{
          background: "#09090b",
          color: "#ffffff",
          borderBottom: "3px solid #ea580c",
          padding: "24px 20px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 6,
                background: "#ea580c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                boxShadow: "0 4px 10px rgba(234, 88, 12, 0.4)",
              }}
            >
              🍕
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
                  SLICE MASTER PIZZA &amp; GRILL
                </h1>
                <span
                  style={{
                    background: "#22c55e",
                    color: "#000",
                    fontSize: 10,
                    fontWeight: 900,
                    padding: "2px 6px",
                    borderRadius: 3,
                  }}
                >
                  OPEN NOW
                </span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#a1a1aa" }}>
                📍 Main Boulevard, Gulberg, Lahore • 🕒 Open 11:00 AM - 02:00 AM • 📞 0333-4867615
              </p>
            </div>
          </div>

          {/* Quick Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            style={{
              background: "#ea580c",
              color: "#ffffff",
              border: "2px solid #ffffff",
              borderRadius: 6,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 900,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              boxShadow: "0 4px 0 #9a3412",
              textTransform: "uppercase",
            }}
          >
            <span>🛒 My Cart</span>
            <span
              style={{
                background: "#ffffff",
                color: "#ea580c",
                padding: "2px 8px",
                borderRadius: 99,
                fontSize: 12,
              }}
            >
              {totalCartCount}
            </span>
            <span>Rs. {finalTotal.toLocaleString()}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>
        {/* Banner Notice */}
        <div
          style={{
            background: "#fff7ed",
            border: "2px solid #ea580c",
            borderRadius: 6,
            padding: "14px 18px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <span style={{ fontWeight: 900, color: "#c2410c", fontSize: 14 }}>
              🔥 LIVE STOREFRONT SANDBOX DEMO
            </span>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#7c2d12" }}>
              Test customizing toppings, crusts, applying promo code (
              <strong>SAVE20</strong>), and placing a simulated order!
            </p>
          </div>
          <button
            onClick={() => setIsCartOpen(true)}
            style={{
              background: "#09090b",
              color: "#ffffff",
              border: "none",
              padding: "8px 16px",
              borderRadius: 4,
              fontWeight: 800,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Open Cart Drawer ({totalCartCount}) ➔
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {/* Category Tabs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { id: "all", label: "🌟 All Items" },
              { id: "pizza", label: "🍕 Pizzas" },
              { id: "burger", label: "🍔 Smash Burgers" },
              { id: "side", label: "🍗 Sides & Wings" },
              { id: "drink", label: "🥤 Drinks" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  border: selectedCategory === cat.id ? "2px solid #ea580c" : "1.5px solid #cbd5e1",
                  background: selectedCategory === cat.id ? "#ea580c" : "#ffffff",
                  color: selectedCategory === cat.id ? "#ffffff" : "#0f172a",
                  boxShadow: selectedCategory === cat.id ? "0 2px 0 #9a3412" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <input
            type="text"
            placeholder="Search pizza, burger, sides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: 4,
              border: "1.5px solid #cbd5e1",
              fontSize: 13,
              minWidth: 240,
              outline: "none",
            }}
          />
        </div>

        {/* Products Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {filteredProducts.map((p) => {
            const startingPrice = p.sizes[0]?.price || 0;
            return (
              <div
                key={p.id}
                style={{
                  background: "#ffffff",
                  border: "2px solid #09090b",
                  borderRadius: 6,
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 0 #09090b",
                  position: "relative",
                }}
              >
                {p.badge && (
                  <span
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      background: "#ea580c",
                      color: "#ffffff",
                      fontSize: 10,
                      fontWeight: 900,
                      padding: "2px 8px",
                      borderRadius: 3,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {p.badge}
                  </span>
                )}

                <div>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 6,
                      background: "#fff7ed",
                      border: "1px solid #fed7aa",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 32,
                      marginBottom: 14,
                    }}
                  >
                    {p.image}
                  </div>

                  <h3 style={{ fontSize: 17, fontWeight: 900, margin: "0 0 6px", color: "#09090b" }}>
                    {p.name}
                  </h3>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 14px", lineHeight: 1.5 }}>
                    {p.desc}
                  </p>
                </div>

                <div
                  style={{
                    borderTop: "1.5px dashed #e2e8f0",
                    paddingTop: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <span style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 800 }}>
                      Starting From
                    </span>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#ea580c" }}>
                      Rs. {startingPrice.toLocaleString()}
                    </div>
                  </div>

                  <button
                    onClick={() => openCustomizer(p)}
                    style={{
                      background: "#09090b",
                      color: "#ffffff",
                      border: "2px solid #09090b",
                      borderRadius: 4,
                      padding: "8px 16px",
                      fontSize: 12,
                      fontWeight: 900,
                      cursor: "pointer",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                      boxShadow: "0 2px 0 #ea580c",
                    }}
                  >
                    Customize +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── CUSTOMIZATION MODAL ───────────────────────────────────── */}
      {activeModalProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "3px solid #09090b",
              borderRadius: 8,
              width: "100%",
              maxWidth: 520,
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: "#09090b" }}>
                  {activeModalProduct.name}
                </h3>
                <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
                  {activeModalProduct.desc}
                </p>
              </div>
              <button
                onClick={() => setActiveModalProduct(null)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  fontSize: 18,
                  fontWeight: 900,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Size Selector */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 900, color: "#ea580c", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                1. Select Portion / Size:
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {activeModalProduct.sizes.map((s, idx) => (
                  <label
                    key={s.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: 4,
                      border: selectedSizeIndex === idx ? "2px solid #ea580c" : "1.5px solid #cbd5e1",
                      background: selectedSizeIndex === idx ? "#fff7ed" : "#ffffff",
                      cursor: "pointer",
                      fontWeight: 800,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input
                        type="radio"
                        name="productSize"
                        checked={selectedSizeIndex === idx}
                        onChange={() => setSelectedSizeIndex(idx)}
                      />
                      <span>{s.name}</span>
                    </div>
                    <span style={{ color: "#ea580c" }}>Rs. {s.price}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Extra Toppings */}
            {activeModalProduct.toppings.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12, fontWeight: 900, color: "#ea580c", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                  2. Extra Add-ons &amp; Crust:
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {activeModalProduct.toppings.map((t) => {
                    const isChecked = selectedToppings.some((item) => item.name === t.name);
                    return (
                      <label
                        key={t.name}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 14px",
                          borderRadius: 4,
                          border: isChecked ? "2px solid #09090b" : "1.5px solid #cbd5e1",
                          background: isChecked ? "#f8fafc" : "#ffffff",
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleTopping(t)}
                          />
                          <span>{t.name}</span>
                        </div>
                        <span style={{ color: "#09090b", fontWeight: 800 }}>+Rs. {t.price}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Special Kitchen Instruction */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 900, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Special Cooking Instructions (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Extra spicy, bake crust crispy, no oregano..."
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 4,
                  border: "1.5px solid #cbd5e1",
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Add Button */}
            <button
              onClick={addToCartFromModal}
              style={{
                width: "100%",
                background: "#ea580c",
                color: "#ffffff",
                border: "2px solid #09090b",
                borderRadius: 4,
                padding: "12px",
                fontSize: 14,
                fontWeight: 900,
                textTransform: "uppercase",
                cursor: "pointer",
                boxShadow: "0 4px 0 #09090b",
              }}
            >
              Add to Cart ➔
            </button>
          </div>
        </div>
      )}

      {/* ─── CART SLIDE-OVER DRAWER ─────────────────────────────────── */}
      {isCartOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 300,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              width: "100%",
              maxWidth: 440,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-8px 0 25px rgba(0,0,0,0.3)",
              borderLeft: "3px solid #09090b",
            }}
          >
            {/* Cart Header */}
            <div
              style={{
                background: "#09090b",
                color: "#ffffff",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "2px solid #ea580c",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>🛒</span>
                <span style={{ fontWeight: 900, fontSize: 16, textTransform: "uppercase" }}>
                  Your Order Items ({totalCartCount})
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                style={{
                  background: "#27272a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 4,
                  padding: "4px 10px",
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                ✕ Close
              </button>
            </div>

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                  <span style={{ fontSize: 40, display: "block", marginBottom: 10 }}>🍕</span>
                  <p style={{ fontWeight: 800 }}>Your cart is empty.</p>
                  <p style={{ fontSize: 12 }}>Pick your favorite pizza from the menu to test!</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        border: "1.5px solid #e2e8f0",
                        borderRadius: 6,
                        padding: "12px",
                        background: "#fafafa",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <h4 style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 900, color: "#09090b" }}>
                            {item.name}
                          </h4>
                          <span style={{ fontSize: 12, color: "#ea580c", fontWeight: 800 }}>
                            {item.sizeName}
                          </span>
                          {item.toppings.length > 0 && (
                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                              + {item.toppings.map((t) => t.name).join(", ")}
                            </div>
                          )}
                          {item.notes && (
                            <div style={{ fontSize: 11, color: "#059669", fontStyle: "italic", marginTop: 2 }}>
                              Note: {item.notes}
                            </div>
                          )}
                        </div>

                        <span style={{ fontWeight: 900, fontSize: 14, color: "#09090b" }}>
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>

                      {/* Quantity Controls */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          style={{
                            width: 26,
                            height: 26,
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            borderRadius: 3,
                            fontWeight: 900,
                            cursor: "pointer",
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: 13, fontWeight: 900, minWidth: 20, textAlign: "center" }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          style={{
                            width: 26,
                            height: 26,
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            borderRadius: 3,
                            fontWeight: 900,
                            cursor: "pointer",
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Order Options */}
              <div style={{ marginTop: 20, borderTop: "2px solid #e2e8f0", paddingTop: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 900, color: "#09090b", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  Order Type:
                </label>
                <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                  {[
                    { id: "delivery", label: "🛵 Delivery (Rs. 150)" },
                    { id: "takeaway", label: "🥡 Takeaway (Free)" },
                    { id: "dine_in", label: "🍽️ Table #04" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setOrderType(t.id as any)}
                      style={{
                        flex: 1,
                        padding: "8px 4px",
                        fontSize: 11,
                        fontWeight: 800,
                        borderRadius: 4,
                        border: orderType === t.id ? "2px solid #ea580c" : "1px solid #cbd5e1",
                        background: orderType === t.id ? "#fff7ed" : "#ffffff",
                        color: orderType === t.id ? "#c2410c" : "#09090b",
                        cursor: "pointer",
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Promo Code Input */}
                <label style={{ fontSize: 11, fontWeight: 900, color: "#09090b", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  Promo Voucher (Try: SAVE20 or FLAT200):
                </label>
                <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                  <input
                    type="text"
                    placeholder="Enter Promo Code"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      borderRadius: 4,
                      border: "1.5px solid #cbd5e1",
                      fontSize: 12,
                      fontWeight: 800,
                      textTransform: "uppercase",
                    }}
                  />
                  <button
                    onClick={applyPromo}
                    style={{
                      background: "#09090b",
                      color: "#ffffff",
                      border: "none",
                      padding: "8px 14px",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Apply
                  </button>
                </div>

                {/* Loyalty Cash Points */}
                <div
                  style={{
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    borderRadius: 4,
                    padding: "10px",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 900, color: "#047857" }}>
                        🪙 Loyalty Cash Engine
                      </span>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#065f46" }}>
                        Customer ({loyaltyPhone}): 150 Points = Rs. 150 off
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setLoyaltyApplied(!loyaltyApplied);
                        playChime();
                      }}
                      style={{
                        background: loyaltyApplied ? "#047857" : "#ffffff",
                        color: loyaltyApplied ? "#ffffff" : "#047857",
                        border: "1px solid #047857",
                        padding: "4px 8px",
                        borderRadius: 3,
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      {loyaltyApplied ? "✓ Applied" : "+ Redeem"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Cart Footer Total & Checkout */}
            <div
              style={{
                borderTop: "2px solid #09090b",
                padding: "16px 20px",
                background: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                <span>Subtotal:</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>
              {appliedDiscount && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#ea580c", fontWeight: 800, marginBottom: 4 }}>
                  <span>Promo ({appliedDiscount.code}):</span>
                  <span>-Rs. {discountAmount.toLocaleString()}</span>
                </div>
              )}
              {loyaltyApplied && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#047857", fontWeight: 800, marginBottom: 4 }}>
                  <span>Loyalty Cash Points:</span>
                  <span>-Rs. 150</span>
                </div>
              )}
              {orderType === "delivery" && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                  <span>Delivery Charge:</span>
                  <span>+Rs. 150</span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 18,
                  fontWeight: 900,
                  color: "#09090b",
                  borderTop: "1.5px dashed #cbd5e1",
                  paddingTop: 8,
                  marginBottom: 14,
                }}
              >
                <span>Final Total:</span>
                <span style={{ color: "#ea580c" }}>Rs. {finalTotal.toLocaleString()}</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={cart.length === 0}
                style={{
                  width: "100%",
                  background: cart.length > 0 ? "#ea580c" : "#94a3b8",
                  color: "#ffffff",
                  border: "2px solid #09090b",
                  borderRadius: 4,
                  padding: "14px",
                  fontSize: 14,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  cursor: cart.length > 0 ? "pointer" : "not-allowed",
                  boxShadow: "0 4px 0 #09090b",
                }}
              >
                Place Demo Order (Instant Test) ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ORDER PLACED SUCCESS MODAL ─────────────────────────────── */}
      {orderPlacedSuccess && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            zIndex: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "3px solid #09090b",
              borderRadius: 8,
              maxWidth: 480,
              width: "100%",
              padding: "30px 24px",
              textAlign: "center",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#22c55e",
                color: "#ffffff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                marginBottom: 16,
                boxShadow: "0 4px 12px rgba(34, 197, 94, 0.4)",
              }}
            >
              ✓
            </div>

            <h3 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 6px", color: "#09090b" }}>
              Demo Order Placed Successfully!
            </h3>
            <p style={{ fontSize: 14, color: "#16a34a", fontWeight: 800, margin: "0 0 16px" }}>
              Order Reference: #PZ-8492
            </p>

            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                padding: "12px",
                fontSize: 12,
                color: "#475569",
                marginBottom: 20,
                textAlign: "left",
                lineHeight: 1.5,
              }}
            >
              <div>• <strong>Customer:</strong> Usman Khan (0333-4867615)</div>
              <div>• <strong>Bill Total:</strong> Rs. {finalTotal.toLocaleString()} (Cash On Delivery)</div>
              <div>• <strong>WhatsApp Engine:</strong> Automated receipt &amp; rider alert dispatched</div>
              <div>• <strong>Kitchen Status:</strong> Ticket sent to KDS display screen</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link
                href="/demo/track"
                style={{
                  background: "#ea580c",
                  color: "#ffffff",
                  border: "2px solid #09090b",
                  borderRadius: 4,
                  padding: "12px",
                  fontSize: 13,
                  fontWeight: 900,
                  textDecoration: "none",
                  textTransform: "uppercase",
                  boxShadow: "0 3px 0 #09090b",
                }}
              >
                Track Live Order in Tracker Demo ➔
              </Link>

              <Link
                href="/demo/pos"
                style={{
                  background: "#09090b",
                  color: "#ffffff",
                  border: "2px solid #09090b",
                  borderRadius: 4,
                  padding: "12px",
                  fontSize: 13,
                  fontWeight: 900,
                  textDecoration: "none",
                  textTransform: "uppercase",
                }}
              >
                View in Branch Admin POS Demo ➔
              </Link>

              <button
                onClick={() => {
                  setOrderPlacedSuccess(false);
                  setIsCartOpen(false);
                }}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: 4,
                  padding: "10px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#64748b",
                  cursor: "pointer",
                }}
              >
                Stay on Menu Demo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
