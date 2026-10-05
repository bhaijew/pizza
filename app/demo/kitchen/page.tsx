"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DemoNav from "@/components/demo/DemoNav";

interface KitchenTicket {
  id: string;
  orderNumber: string;
  orderType: "dine_in" | "takeaway" | "delivery";
  tableNumber?: string;
  startedAtMinutesAgo: number;
  stage: "prep" | "oven" | "ready";
  items: {
    name: string;
    qty: number;
    customizations?: string[];
    completed?: boolean;
  }[];
  notes?: string;
}

const INITIAL_TICKETS: KitchenTicket[] = [
  {
    id: "k-1",
    orderNumber: "PZ-8492",
    orderType: "delivery",
    startedAtMinutesAgo: 6,
    stage: "oven",
    items: [
      {
        name: "Chicken Tikka Supreme (Large 13\")",
        qty: 1,
        customizations: ["Cheesy Stuffed Crust", "Extra Mozzarella", "Jalapenos"],
        completed: false,
      },
      {
        name: "Cheesy Garlic Herb Bread (4 Pcs)",
        qty: 1,
        customizations: ["Extra Garlic Butter"],
        completed: true,
      },
    ],
    notes: "Bake crust extra crispy please!",
  },
  {
    id: "k-2",
    orderNumber: "PZ-8490",
    orderType: "dine_in",
    tableNumber: "Table #04",
    startedAtMinutesAgo: 2,
    stage: "prep",
    items: [
      {
        name: "Gourmet Beef Smashed Burger",
        qty: 2,
        customizations: ["Double Smash Patty", "Extra Cheddar", "Brioche Bun"],
        completed: false,
      },
      {
        name: "Crispy Peri Peri Wings (6 Pcs)",
        qty: 1,
        customizations: ["Tossed in Extra Peri Dip"],
        completed: false,
      },
    ],
    notes: "Serve wings first if ready early.",
  },
  {
    id: "k-3",
    orderNumber: "PZ-8493",
    orderType: "takeaway",
    startedAtMinutesAgo: 14,
    stage: "oven",
    items: [
      {
        name: "Pepperoni Passion Feast (Medium 10\")",
        qty: 1,
        customizations: ["Garlic Butter Crust Edge", "Double Pepperoni"],
        completed: false,
      },
    ],
  },
  {
    id: "k-4",
    orderNumber: "PZ-8494",
    orderType: "dine_in",
    tableNumber: "Table #02",
    startedAtMinutesAgo: 18,
    stage: "prep",
    items: [
      {
        name: "Fajita Sensation Grill (Large 13\")",
        qty: 1,
        customizations: ["Cream Cheese Drizzle", "Sweet Corn"],
        completed: false,
      },
      {
        name: "Seasoned Curly Fries",
        qty: 2,
        completed: false,
      },
    ],
    notes: "Rush order - table waiting 15 mins",
  },
];

export default function DemoKitchenPage() {
  const [tickets, setTickets] = useState<KitchenTicket[]>(INITIAL_TICKETS);
  const [filterMode, setFilterMode] = useState<"all" | "dine_in" | "takeaway_delivery">("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const playKitchenChime = (type: "new" | "ready") => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";

      if (type === "new") {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
      }

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  const simulateIncomingKitchenOrder = () => {
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const newTicket: KitchenTicket = {
      id: "k-" + Date.now(),
      orderNumber: `PZ-${randNum}`,
      orderType: "delivery",
      startedAtMinutesAgo: 0,
      stage: "prep",
      items: [
        {
          name: "Chicken Tikka Supreme (Large 13\")",
          qty: 1,
          customizations: ["Thin Crust", "Extra Mozzarella"],
          completed: false,
        },
        {
          name: "Cheesy Garlic Herb Bread",
          qty: 1,
          completed: false,
        },
      ],
      notes: "Simulated order from customer menu demo!",
    };

    setTickets([newTicket, ...tickets]);
    playKitchenChime("new");
  };

  const toggleItemCompleted = (ticketId: string, itemIdx: number) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const updatedItems = [...t.items];
          updatedItems[itemIdx] = {
            ...updatedItems[itemIdx],
            completed: !updatedItems[itemIdx].completed,
          };
          return { ...t, items: updatedItems };
        }
        return t;
      })
    );
  };

  const advanceStage = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          if (t.stage === "prep") return { ...t, stage: "oven" };
          if (t.stage === "oven") {
            playKitchenChime("ready");
            return { ...t, stage: "ready" };
          }
        }
        return t;
      })
    );
  };

  const dismissReadyTicket = (ticketId: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    playKitchenChime("ready");
  };

  const filteredTickets = tickets.filter((t) => {
    if (filterMode === "dine_in") return t.orderType === "dine_in";
    if (filterMode === "takeaway_delivery") return t.orderType !== "dine_in";
    return true;
  });

  return (
    <div style={{ minHeight: "125vh", background: "#09090b", color: "#ffffff" }}>
      {/* Universal Top Demo Bar */}
      <DemoNav currentModule="kitchen" />

      {/* KDS Header */}
      <header
        style={{
          background: "#18181b",
          borderBottom: "3px solid #ea580c",
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
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                background: "#ea580c",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
              }}
            >
              🔥
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em" }}>
                  KITCHEN DISPLAY SCREEN (KDS)
                </span>
                <span
                  style={{
                    background: "#ea580c",
                    color: "#ffffff",
                    fontSize: 10,
                    fontWeight: 900,
                    padding: "2px 6px",
                    borderRadius: 3,
                  }}
                >
                  STONE OVEN STATION
                </span>
              </div>
              <span style={{ fontSize: 12, color: "#a1a1aa" }}>
                Active Kitchen Tickets: {tickets.length} • Real-time Cooking Timers Active
              </span>
            </div>
          </div>

          {/* Action Tools */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                playKitchenChime("new");
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
              }}
            >
              {soundEnabled ? "🔊 Chime: ON" : "🔇 Chime: OFF"}
            </button>

            <button
              onClick={simulateIncomingKitchenOrder}
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
              }}
            >
              ➕ Simulate Kitchen Ticket
            </button>

            <Link
              href="/demo/pos"
              style={{
                background: "#ffffff",
                color: "#09090b",
                border: "none",
                borderRadius: 4,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 900,
                textDecoration: "none",
              }}
            >
              Open POS Demo ➔
            </Link>
          </div>
        </div>
      </header>

      {/* Main KDS Workspace */}
      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "20px" }}>
        {/* Filter Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 20,
            background: "#18181b",
            padding: "12px 16px",
            borderRadius: 6,
            border: "1px solid #27272a",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { id: "all", label: `All Tickets (${tickets.length})` },
              { id: "dine_in", label: "🍽️ Dine-In Tables" },
              { id: "takeaway_delivery", label: "🛵 Takeaway & Delivery" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterMode(f.id as any)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  border: filterMode === f.id ? "1.5px solid #ea580c" : "1px solid #3f3f46",
                  background: filterMode === f.id ? "#ea580c" : "#27272a",
                  color: filterMode === f.id ? "#ffffff" : "#d4d4d8",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <span style={{ fontSize: 12, color: "#a1a1aa" }}>
            💡 Click items to check them off • Click stage button to advance from Prep ➔ Oven ➔ Ready
          </span>
        </div>

        {/* Tickets Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {filteredTickets.map((t) => {
            const currentElapsedMinutes = t.startedAtMinutesAgo + Math.floor(elapsedSeconds / 60);
            const currentElapsedSecondsRem = elapsedSeconds % 60;
            const timeString = `${String(currentElapsedMinutes).padStart(2, "0")}:${String(currentElapsedSecondsRem).padStart(2, "0")}`;

            const isUrgent = currentElapsedMinutes >= 15;
            const isMedium = currentElapsedMinutes >= 10 && currentElapsedMinutes < 15;
            const isPrep = t.stage === "prep";
            const isOven = t.stage === "oven";
            const isReady = t.stage === "ready";

            return (
              <div
                key={t.id}
                style={{
                  background: "#ffffff",
                  color: "#000000",
                  border: isUrgent ? "3px solid #dc2626" : "2.5px solid #09090b",
                  borderRadius: 6,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: isUrgent ? "0 4px 15px rgba(220, 38, 38, 0.3)" : "0 4px 0 #09090b",
                  overflow: "hidden",
                }}
              >
                {/* Ticket Top Header Bar */}
                <div
                  style={{
                    background: isReady ? "#22c55e" : isOven ? "#ea580c" : "#09090b",
                    color: "#ffffff",
                    padding: "10px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 900 }}>
                      {t.orderType === "dine_in" ? t.tableNumber : `#${t.orderNumber}`}
                    </span>
                    <span
                      style={{
                        background: "rgba(255,255,255,0.2)",
                        fontSize: 10,
                        fontWeight: 900,
                        padding: "2px 6px",
                        borderRadius: 3,
                        textTransform: "uppercase",
                      }}
                    >
                      {t.orderType.replace("_", "-")}
                    </span>
                  </div>

                  {/* Elapsed Timer */}
                  <div
                    style={{
                      background: isUrgent ? "#b91c1c" : isMedium ? "#b45309" : "rgba(0,0,0,0.3)",
                      color: "#ffffff",
                      fontSize: 12,
                      fontWeight: 900,
                      fontFamily: "monospace",
                      padding: "2px 8px",
                      borderRadius: 3,
                    }}
                  >
                    ⏱️ {timeString}
                  </div>
                </div>

                {/* Ticket Body: Items & Checkboxes */}
                <div style={{ padding: "14px", flex: 1 }}>
                  {/* Current Stage Badge */}
                  <div style={{ marginBottom: 12 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: isReady ? "#16a34a" : isOven ? "#c2410c" : "#475569",
                        background: isReady ? "#dcfce7" : isOven ? "#fff7ed" : "#f1f5f9",
                        padding: "3px 8px",
                        borderRadius: 4,
                        border: isReady ? "1px solid #86efac" : isOven ? "1px solid #fed7aa" : "1px solid #cbd5e1",
                      }}
                    >
                      {isReady ? "✓ Cooked & Ready for Counter" : isOven ? "🔥 In Stone Oven Baking" : "🥣 Prepping Dough & Sauce"}
                    </span>
                  </div>

                  {/* Items List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {t.items.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleItemCompleted(t.id, idx)}
                        style={{
                          cursor: "pointer",
                          padding: "8px",
                          borderRadius: 4,
                          background: item.completed ? "#f8fafc" : "#fafafa",
                          border: item.completed ? "1px solid #cbd5e1" : "1.5px solid #09090b",
                          opacity: item.completed ? 0.6 : 1,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={!!item.completed}
                            onChange={() => {}}
                            style={{ marginTop: 3 }}
                          />
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 900,
                                textDecoration: item.completed ? "line-through" : "none",
                              }}
                            >
                              {item.qty}x {item.name}
                            </div>
                            {item.customizations && item.customizations.length > 0 && (
                              <div style={{ fontSize: 11, color: "#ea580c", fontWeight: 700, marginTop: 2 }}>
                                {item.customizations.map((c) => `• ${c}`).join(" ")}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cooking Note */}
                  {t.notes && (
                    <div
                      style={{
                        marginTop: 12,
                        background: "#fffbeb",
                        border: "1px solid #fde68a",
                        borderRadius: 4,
                        padding: "8px 10px",
                        fontSize: 11,
                        color: "#92400e",
                        fontWeight: 700,
                      }}
                    >
                      ⚠️ <em>{t.notes}</em>
                    </div>
                  )}
                </div>

                {/* Ticket Action Button */}
                <div style={{ padding: "10px 14px", background: "#f8fafc", borderTop: "1.5px solid #e2e8f0" }}>
                  {isPrep && (
                    <button
                      onClick={() => advanceStage(t.id)}
                      style={{
                        width: "100%",
                        background: "#ea580c",
                        color: "#ffffff",
                        border: "2px solid #09090b",
                        borderRadius: 4,
                        padding: "10px",
                        fontSize: 12,
                        fontWeight: 900,
                        cursor: "pointer",
                        textTransform: "uppercase",
                        boxShadow: "0 2px 0 #09090b",
                      }}
                    >
                      Send to Oven (Bake) ➔
                    </button>
                  )}

                  {isOven && (
                    <button
                      onClick={() => advanceStage(t.id)}
                      style={{
                        width: "100%",
                        background: "#22c55e",
                        color: "#000000",
                        border: "2px solid #09090b",
                        borderRadius: 4,
                        padding: "10px",
                        fontSize: 12,
                        fontWeight: 900,
                        cursor: "pointer",
                        textTransform: "uppercase",
                        boxShadow: "0 2px 0 #09090b",
                      }}
                    >
                      Mark Cooked &amp; Ready ✓
                    </button>
                  )}

                  {isReady && (
                    <button
                      onClick={() => dismissReadyTicket(t.id)}
                      style={{
                        width: "100%",
                        background: "#09090b",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 4,
                        padding: "10px",
                        fontSize: 12,
                        fontWeight: 900,
                        cursor: "pointer",
                        textTransform: "uppercase",
                      }}
                    >
                      Clear Completed Ticket
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
