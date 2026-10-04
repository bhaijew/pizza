"use client";

import { useState } from "react";
import Link from "next/link";
import DemoNav from "@/components/demo/DemoNav";

interface POSOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  orderType: "delivery" | "takeaway" | "dine_in";
  tableNumber?: string;
  address?: string;
  riderName?: string;
  items: { name: string; qty: number; detail?: string; price: number }[];
  total: number;
  status: "pending" | "preparing" | "ready" | "dispatched" | "delivered";
  timeAgo: string;
  paymentMethod: "Cash On Delivery" | "Card POS" | "Unpaid";
  notes?: string;
}

const INITIAL_ORDERS: POSOrder[] = [
  {
    id: "ord-1",
    orderNumber: "PZ-8492",
    customerName: "Usman Khan",
    customerPhone: "0333-1234567",
    orderType: "delivery",
    address: "House 42, Block B, Model Town, Lahore",
    riderName: "Tariq Mahmood",
    items: [
      { name: "Chicken Tikka Supreme (Large 13\")", qty: 1, detail: "Cheesy Stuffed Crust, Jalapenos", price: 2440 },
      { name: "Cheesy Garlic Herb Bread (4 Pcs)", qty: 1, price: 390 },
    ],
    total: 2830,
    status: "preparing",
    timeAgo: "6 mins ago",
    paymentMethod: "Cash On Delivery",
    notes: "Make crust extra crispy please!",
  },
  {
    id: "ord-2",
    orderNumber: "PZ-8491",
    customerName: "Ayesha Malik",
    customerPhone: "0321-7654321",
    orderType: "takeaway",
    items: [
      { name: "Fajita Sensation Grill (Medium 10\")", qty: 1, price: 1590 },
      { name: "Coca Cola Bottle 1.5L", qty: 1, price: 220 },
    ],
    total: 1810,
    status: "ready",
    timeAgo: "14 mins ago",
    paymentMethod: "Card POS",
  },
  {
    id: "ord-3",
    orderNumber: "PZ-8490",
    customerName: "Dine-In Customer",
    customerPhone: "0300-8887766",
    orderType: "dine_in",
    tableNumber: "Table #04",
    items: [
      { name: "Gourmet Beef Smashed Burger", qty: 2, detail: "Double Smash + Fries", price: 1960 },
      { name: "Crispy Peri Peri Wings (6 Pcs)", qty: 1, price: 540 },
    ],
    total: 2500,
    status: "pending",
    timeAgo: "1 min ago",
    paymentMethod: "Unpaid",
  },
  {
    id: "ord-4",
    orderNumber: "PZ-8489",
    customerName: "Hamza Tariq",
    customerPhone: "0300-9876543",
    orderType: "delivery",
    address: "Apartment 12-A, Gulberg Heights",
    riderName: "Sajid Ali (Honda 125)",
    items: [
      { name: "Pepperoni Passion Feast (Large 13\")", qty: 1, detail: "Extra Pepperoni, Garlic Edge", price: 2610 },
    ],
    total: 2610,
    status: "dispatched",
    timeAgo: "22 mins ago",
    paymentMethod: "Cash On Delivery",
  },
  {
    id: "ord-5",
    orderNumber: "PZ-8488",
    customerName: "Bilal Sheikh",
    customerPhone: "0345-1122334",
    orderType: "takeaway",
    items: [{ name: "Chicken Tikka Supreme (Small 8\")", qty: 2, price: 1900 }],
    total: 1900,
    status: "delivered",
    timeAgo: "45 mins ago",
    paymentMethod: "Cash On Delivery",
  },
];

export default function DemoPOSPage() {
  const [orders, setOrders] = useState<POSOrder[]>(INITIAL_ORDERS);
  const [filterTab, setFilterTab] = useState<string>("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<POSOrder | null>(null);
  const [whatsappModalOrder, setWhatsappModalOrder] = useState<POSOrder | null>(null);

  const playChime = (highPitch = false) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const freq = highPitch ? 880 : 587.33;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(highPitch ? 1174 : 880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  const simulateIncomingOrder = () => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const newOrder: POSOrder = {
      id: "ord-" + Date.now(),
      orderNumber: `PZ-${randomId}`,
      customerName: "Zahid Qureshi",
      customerPhone: "0333-7766554",
      orderType: "delivery",
      address: "Phase 5, DHA, Sector G, Street 9",
      items: [
        { name: "Chicken Tikka Supreme (Large 13\")", qty: 1, detail: "Extra Mozzarella Cheese", price: 2370 },
        { name: "Crispy Peri Wings (6 Pcs)", qty: 1, price: 540 },
        { name: "Coca Cola Bottle 1.5L", qty: 1, price: 220 },
      ],
      total: 3130,
      status: "pending",
      timeAgo: "Just now",
      paymentMethod: "Cash On Delivery",
      notes: "Ring bell twice upon arrival.",
    };

    setOrders([newOrder, ...orders]);
    playChime(true);
  };

  const updateOrderStatus = (orderId: string, newStatus: POSOrder["status"]) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    playChime();
  };

  const filteredOrders = orders.filter((o) => {
    if (filterTab === "all") return true;
    if (filterTab === "pending") return o.status === "pending";
    if (filterTab === "preparing") return o.status === "preparing";
    if (filterTab === "ready") return o.status === "ready" || o.status === "dispatched";
    if (filterTab === "delivered") return o.status === "delivered";
    return true;
  });

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0) + 48200;
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const kitchenCount = orders.filter((o) => o.status === "preparing").length;
  const readyCount = orders.filter((o) => o.status === "ready" || o.status === "dispatched").length;

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "#ffffff" }}>
      {/* Universal Top Demo Bar */}
      <DemoNav currentModule="pos" />

      {/* POS Top Navigation Bar */}
      <header
        style={{
          background: "#18181b",
          borderBottom: "2px solid #ea580c",
          padding: "16px 20px",
        }}
      >
        <div
          style={{
            maxWidth: 1300,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                background: "#ea580c",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              🖥️
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em" }}>
                  BRANCH ADMIN POS &amp; LIVE ORDER BOARD
                </span>
                <span
                  style={{
                    background: "#22c55e",
                    color: "#000000",
                    fontSize: 10,
                    fontWeight: 900,
                    padding: "2px 6px",
                    borderRadius: 3,
                  }}
                >
                  LIVE SYSTEM
                </span>
              </div>
              <span style={{ fontSize: 12, color: "#a1a1aa" }}>
                Terminal #01 • Main Gulberg Branch • Cashier: Admin Cashier
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                playChime();
              }}
              style={{
                background: soundEnabled ? "#27272a" : "#3f3f46",
                color: soundEnabled ? "#22c55e" : "#a1a1aa",
                border: "1px solid #3f3f46",
                borderRadius: 4,
                padding: "8px 12px",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{soundEnabled ? "🔊 Sound: ON" : "🔇 Sound: MUTED"}</span>
            </button>

            <button
              onClick={simulateIncomingOrder}
              style={{
                background: "#ea580c",
                color: "#ffffff",
                border: "2px solid #ffffff",
                borderRadius: 4,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 900,
                cursor: "pointer",
                textTransform: "uppercase",
                boxShadow: "0 3px 0 #9a3412",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>➕ Simulate Incoming Order</span>
            </button>

            <Link
              href="/demo/kitchen"
              style={{
                background: "#ffffff",
                color: "#09090b",
                border: "2px solid #09090b",
                borderRadius: 4,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 900,
                textDecoration: "none",
                textTransform: "uppercase",
              }}
            >
              Open KDS Display ➔
            </Link>
          </div>
        </div>
      </header>

      {/* Main POS Container */}
      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "24px 20px" }}>
        {/* Metric Cards Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
            marginBottom: 24,
          }}
        >
          {[
            { label: "Today's Gross Sales", value: `Rs. ${totalSales.toLocaleString()}`, color: "#22c55e", sub: "38 Orders Recorded" },
            { label: "New Incoming Queue", value: `${pendingCount} Orders`, color: "#ea580c", sub: "Needs POS Confirmation" },
            { label: "Currently In Kitchen", value: `${kitchenCount} Orders`, color: "#38bdf8", sub: "Baking in stone oven" },
            { label: "Out For Delivery / Ready", value: `${readyCount} Orders`, color: "#eab308", sub: "Dispatched with riders" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "#18181b",
                border: "1.5px solid #27272a",
                borderRadius: 6,
                padding: "16px 18px",
              }}
            >
              <span style={{ fontSize: 11, color: "#a1a1aa", textTransform: "uppercase", fontWeight: 800, display: "block" }}>
                {stat.label}
              </span>
              <div style={{ fontSize: 24, fontWeight: 900, color: stat.color, margin: "4px 0 2px" }}>
                {stat.value}
              </div>
              <span style={{ fontSize: 11, color: "#71717a" }}>{stat.sub}</span>
            </div>
          ))}
        </div>

        {/* Filter Tabs & Order Board */}
        <div
          style={{
            background: "#18181b",
            border: "1.5px solid #27272a",
            borderRadius: 6,
            padding: "16px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { id: "all", label: `All Orders (${orders.length})` },
              { id: "pending", label: `⚡ New / Received (${pendingCount})` },
              { id: "preparing", label: `🔥 In Kitchen (${kitchenCount})` },
              { id: "ready", label: `🛵 Dispatched / Ready (${readyCount})` },
              { id: "delivered", label: "✓ Completed" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  border: filterTab === tab.id ? "1.5px solid #ea580c" : "1px solid #3f3f46",
                  background: filterTab === tab.id ? "#ea580c" : "#27272a",
                  color: filterTab === tab.id ? "#ffffff" : "#d4d4d8",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span style={{ fontSize: 12, color: "#a1a1aa" }}>
            💡 Click any status button to simulate live order progression
          </span>
        </div>

        {/* Orders Table / Cards List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filteredOrders.map((ord) => {
            const isPending = ord.status === "pending";
            const isCooking = ord.status === "preparing";
            const isReady = ord.status === "ready";
            const isDispatched = ord.status === "dispatched";
            const isDone = ord.status === "delivered";

            return (
              <div
                key={ord.id}
                style={{
                  background: "#18181b",
                  border: isPending ? "2px solid #ea580c" : "1.5px solid #27272a",
                  borderRadius: 6,
                  padding: "18px 20px",
                  boxShadow: isPending ? "0 0 15px rgba(234, 88, 12, 0.2)" : "none",
                }}
              >
                {/* Header Row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 12,
                    borderBottom: "1px solid #27272a",
                    paddingBottom: 12,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: "#ffffff" }}>
                      #{ord.orderNumber}
                    </span>
                    <span
                      style={{
                        background:
                          ord.orderType === "delivery"
                            ? "rgba(56, 189, 248, 0.15)"
                            : ord.orderType === "dine_in"
                            ? "rgba(168, 85, 247, 0.15)"
                            : "rgba(34, 197, 94, 0.15)",
                        color:
                          ord.orderType === "delivery"
                            ? "#38bdf8"
                            : ord.orderType === "dine_in"
                            ? "#c084fc"
                            : "#4ade80",
                        fontSize: 11,
                        fontWeight: 900,
                        padding: "3px 8px",
                        borderRadius: 3,
                        textTransform: "uppercase",
                      }}
                    >
                      {ord.orderType === "dine_in" ? `🍽️ ${ord.tableNumber}` : ord.orderType === "delivery" ? "🛵 Delivery" : "🥡 Takeaway"}
                    </span>
                    <span style={{ fontSize: 12, color: "#a1a1aa" }}>• {ord.timeAgo}</span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span
                      style={{
                        background: isPending
                          ? "#ea580c"
                          : isCooking
                          ? "#eab308"
                          : isReady || isDispatched
                          ? "#38bdf8"
                          : "#22c55e",
                        color: isCooking ? "#000000" : "#ffffff",
                        fontSize: 11,
                        fontWeight: 900,
                        padding: "4px 10px",
                        borderRadius: 4,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {isPending
                        ? "⚡ New Order Received"
                        : isCooking
                        ? "🔥 In Kitchen Cooking"
                        : isDispatched
                        ? `🛵 Dispatched (${ord.riderName || "Rider"})`
                        : isReady
                        ? "📦 Ready for Pickup"
                        : "✓ Completed & Paid"}
                    </span>
                  </div>
                </div>

                {/* Details Row: Customer & Order Items */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: 16,
                    marginBottom: 16,
                  }}
                >
                  {/* Left Column: Customer & Delivery */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff", marginBottom: 2 }}>
                      👤 {ord.customerName} &nbsp;
                      <span style={{ color: "#38bdf8", fontWeight: 700 }}>({ord.customerPhone})</span>
                    </div>
                    {ord.address && (
                      <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4 }}>
                        📍 <strong>Destination:</strong> {ord.address}
                      </div>
                    )}
                    {ord.notes && (
                      <div style={{ fontSize: 12, color: "#fbbf24", marginTop: 6, fontStyle: "italic" }}>
                        💬 Kitchen Note: &quot;{ord.notes}&quot;
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
                      💳 Payment: <strong>{ord.paymentMethod}</strong>
                    </div>
                  </div>

                  {/* Right Column: Ordered Items Breakdown */}
                  <div style={{ background: "#27272a", borderRadius: 4, padding: "10px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#a1a1aa", textTransform: "uppercase", marginBottom: 6 }}>
                      Ordered Items:
                    </div>
                    {ord.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12,
                          color: "#ffffff",
                          marginBottom: 4,
                        }}
                      >
                        <div>
                          <strong>{item.qty}x</strong> {item.name}
                          {item.detail && (
                            <div style={{ fontSize: 11, color: "#ea580c" }}>{item.detail}</div>
                          )}
                        </div>
                        <span style={{ fontWeight: 800 }}>Rs. {item.price.toLocaleString()}</span>
                      </div>
                    ))}
                    <div
                      style={{
                        borderTop: "1px solid #3f3f46",
                        marginTop: 8,
                        paddingTop: 6,
                        display: "flex",
                        justifyContent: "space-between",
                        fontWeight: 900,
                        fontSize: 13,
                        color: "#ea580c",
                      }}
                    >
                      <span>Bill Total:</span>
                      <span>Rs. {ord.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Action Bar Row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 10,
                    borderTop: "1px solid #27272a",
                    paddingTop: 12,
                  }}
                >
                  {/* Status Progression Buttons */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {isPending && (
                      <button
                        onClick={() => updateOrderStatus(ord.id, "preparing")}
                        style={{
                          background: "#ea580c",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: 4,
                          padding: "8px 14px",
                          fontSize: 12,
                          fontWeight: 900,
                          cursor: "pointer",
                          textTransform: "uppercase",
                        }}
                      >
                        Accept &amp; Send to Kitchen ➔
                      </button>
                    )}

                    {isCooking && (
                      <button
                        onClick={() => updateOrderStatus(ord.id, "ready")}
                        style={{
                          background: "#eab308",
                          color: "#000000",
                          border: "none",
                          borderRadius: 4,
                          padding: "8px 14px",
                          fontSize: 12,
                          fontWeight: 900,
                          cursor: "pointer",
                          textTransform: "uppercase",
                        }}
                      >
                        Mark Ready for Dispatch ➔
                      </button>
                    )}

                    {isReady && ord.orderType === "delivery" && (
                      <button
                        onClick={() => updateOrderStatus(ord.id, "dispatched")}
                        style={{
                          background: "#38bdf8",
                          color: "#000000",
                          border: "none",
                          borderRadius: 4,
                          padding: "8px 14px",
                          fontSize: 12,
                          fontWeight: 900,
                          cursor: "pointer",
                          textTransform: "uppercase",
                        }}
                      >
                        Assign Rider Tariq &amp; Dispatch ➔
                      </button>
                    )}

                    {(isDispatched || (isReady && ord.orderType !== "delivery")) && (
                      <button
                        onClick={() => updateOrderStatus(ord.id, "delivered")}
                        style={{
                          background: "#22c55e",
                          color: "#000000",
                          border: "none",
                          borderRadius: 4,
                          padding: "8px 14px",
                          fontSize: 12,
                          fontWeight: 900,
                          cursor: "pointer",
                          textTransform: "uppercase",
                        }}
                      >
                        Mark Completed &amp; Collected ✓
                      </button>
                    )}

                    {isDone && (
                      <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 800 }}>
                        ✓ Order Settled &amp; Paid
                      </span>
                    )}
                  </div>

                  {/* Secondary Tools: Print & WhatsApp */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setViewingReceiptOrder(ord)}
                      style={{
                        background: "#27272a",
                        color: "#ffffff",
                        border: "1px solid #3f3f46",
                        borderRadius: 4,
                        padding: "6px 12px",
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      🖨️ Thermal Receipt
                    </button>

                    <button
                      onClick={() => setWhatsappModalOrder(ord)}
                      style={{
                        background: "#15803d",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 4,
                        padding: "6px 12px",
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      💬 WhatsApp Alert
                    </button>

                    <Link
                      href={`/demo/track`}
                      style={{
                        background: "#ffffff",
                        color: "#09090b",
                        borderRadius: 4,
                        padding: "6px 12px",
                        fontSize: 11,
                        fontWeight: 900,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      📍 Track
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── THERMAL RECEIPT MODAL ──────────────────────────────────── */}
      {viewingReceiptOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            zIndex: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              color: "#000000",
              fontFamily: "monospace",
              borderRadius: 6,
              maxWidth: 340,
              width: "100%",
              padding: "24px 20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ textAlign: "center", borderBottom: "1px dashed #000", paddingBottom: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 900 }}>SLICE MASTER PIZZA</div>
              <div style={{ fontSize: 11 }}>Main Boulevard, Gulberg, Lahore</div>
              <div style={{ fontSize: 11 }}>Tel: 0333-4867615</div>
              <div style={{ fontSize: 12, fontWeight: 900, marginTop: 6 }}>
                ORDER #{viewingReceiptOrder.orderNumber}
              </div>
            </div>

            <div style={{ fontSize: 11, marginBottom: 10, lineHeight: 1.4 }}>
              <div>Customer: {viewingReceiptOrder.customerName}</div>
              <div>Phone: {viewingReceiptOrder.customerPhone}</div>
              <div>Type: {viewingReceiptOrder.orderType.toUpperCase()}</div>
              {viewingReceiptOrder.tableNumber && <div>Table: {viewingReceiptOrder.tableNumber}</div>}
              <div>Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
            </div>

            <div style={{ borderTop: "1px dashed #000", borderBottom: "1px dashed #000", padding: "8px 0", marginBottom: 10 }}>
              {viewingReceiptOrder.items.map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                  <span>{item.qty}x {item.name}</span>
                  <span>Rs. {item.price}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 13, fontWeight: 900, display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <span>NET TOTAL:</span>
              <span>Rs. {viewingReceiptOrder.total.toLocaleString()}</span>
            </div>

            <div style={{ textAlign: "center", fontSize: 10, borderTop: "1px dashed #000", paddingTop: 8, marginBottom: 16 }}>
              <div>*** THANK YOU FOR YOUR ORDER ***</div>
              <div>Track live: /track/{viewingReceiptOrder.orderNumber}</div>
            </div>

            <button
              onClick={() => setViewingReceiptOrder(null)}
              style={{
                width: "100%",
                background: "#09090b",
                color: "#ffffff",
                border: "none",
                borderRadius: 4,
                padding: "8px",
                fontSize: 12,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

      {/* ─── WHATSAPP ALERT PREVIEW MODAL ──────────────────────────── */}
      {whatsappModalOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            zIndex: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#065f46",
              color: "#ffffff",
              borderRadius: 8,
              maxWidth: 420,
              width: "100%",
              padding: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 24 }}>💬</span>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>WhatsApp Automated Gateway</h3>
                <span style={{ fontSize: 11, color: "#a7f3d0" }}>Ready to send to {whatsappModalOrder.customerPhone}</span>
              </div>
            </div>

            <div
              style={{
                background: "#044e39",
                borderRadius: 6,
                padding: "14px",
                fontSize: 12,
                lineHeight: 1.6,
                fontFamily: "monospace",
                color: "#d1fae5",
                marginBottom: 16,
                border: "1px solid #059669",
              }}
            >
              🍕 *SLICE MASTER PIZZA*<br />
              Order *#{whatsappModalOrder.orderNumber}* Confirmed!<br />
              ------------------------<br />
              Customer: {whatsappModalOrder.customerName}<br />
              Total Amount: Rs. {whatsappModalOrder.total.toLocaleString()} (COD)<br />
              Status: {whatsappModalOrder.status.toUpperCase()}<br />
              ------------------------<br />
              Track your pizza live on doorstep GPS:<br />
              https://slicepizza.com/track/{whatsappModalOrder.orderNumber}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  alert("Simulated: Branded WhatsApp receipt sent via Railway Gateway!");
                  setWhatsappModalOrder(null);
                }}
                style={{
                  flex: 1,
                  background: "#22c55e",
                  color: "#000000",
                  border: "none",
                  borderRadius: 4,
                  padding: "10px",
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Simulate Send WhatsApp ✓
              </button>
              <button
                onClick={() => setWhatsappModalOrder(null)}
                style={{
                  background: "#044e39",
                  color: "#ffffff",
                  border: "1px solid #059669",
                  borderRadius: 4,
                  padding: "10px 14px",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
