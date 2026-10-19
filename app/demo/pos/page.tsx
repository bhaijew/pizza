"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import DemoNav from "@/components/demo/DemoNav";
import { createClient } from "@/utils/supabase/client";
import OrderRecreateModal from "@/components/admin/OrderRecreateModal";
import type { Order } from "@/types/menu";

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
  paymentMethod: string;
  notes?: string;
  shopId?: number | null;
}

interface ShopInfo {
  id: number;
  name: string;
  slug: string;
  address?: string | null;
  phone?: string | null;
}

function timeAgoFormatted(dateStr?: string | null): string {
  if (!dateStr) return "Just now";
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  } catch {
    return "Just now";
  }
}

function mapCloudOrderToPOS(raw: any): POSOrder {
  let parsedItems: any[] = [];
  if (Array.isArray(raw.items)) {
    parsedItems = raw.items;
  } else if (typeof raw.items === "string") {
    try {
      parsedItems = JSON.parse(raw.items);
    } catch {
      parsedItems = [];
    }
  }

  const items = (parsedItems && parsedItems.length > 0)
    ? parsedItems.map((it: any) => ({
        name: it.name || it.title || it.product_name || "Pizza Item",
        qty: Number(it.qty || it.quantity) || 1,
        detail: it.selected_variation
          ? typeof it.selected_variation === "object"
            ? it.selected_variation.name
            : String(it.selected_variation)
          : it.variant_selection || undefined,
        price: Number(it.subtotal || it.price || it.unit_price) || 0,
      }))
    : [{ name: "Standard Pizza Meal", qty: 1, price: Number(raw.total) || 0 }];

  let status: POSOrder["status"] = "pending";
  const rawStatus = (raw.status || "pending").toLowerCase();
  if (rawStatus === "preparing" || rawStatus === "confirmed" || rawStatus === "cooking") {
    status = "preparing";
  } else if (rawStatus === "ready") {
    status = "ready";
  } else if (rawStatus === "dispatched" || rawStatus === "on_way" || rawStatus === "out_for_delivery") {
    status = "dispatched";
  } else if (rawStatus === "delivered" || rawStatus === "completed" || rawStatus === "served") {
    status = "delivered";
  } else {
    status = "pending";
  }

  const orderType: POSOrder["orderType"] =
    raw.order_type === "delivery"
      ? "delivery"
      : raw.order_type === "dine_in" || raw.table_number
      ? "dine_in"
      : "takeaway";

  return {
    id: String(raw.id),
    orderNumber: raw.order_number || `ORD-${raw.id}`,
    customerName: raw.customer_name || "Counter Customer",
    customerPhone: raw.customer_phone || "0300-0000000",
    orderType,
    tableNumber: raw.table_number ? `Table #${raw.table_number}` : undefined,
    address: raw.delivery_address || undefined,
    riderName: raw.delivery_rider_name || undefined,
    items,
    total: Number(raw.total) || 0,
    status,
    timeAgo: timeAgoFormatted(raw.created_at),
    paymentMethod: raw.payment_method || (orderType === "delivery" ? "Cash On Delivery" : "Counter Cash"),
    notes: raw.notes || undefined,
    shopId: raw.shop_id ? Number(raw.shop_id) : null,
  };
}

function POSContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopParam = searchParams.get("shop");
  const shopIdParam = searchParams.get("shopId");

  const [shops, setShops] = useState<ShopInfo[]>([]);
  const [activeShop, setActiveShop] = useState<ShopInfo | null>(null);
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<string>("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<POSOrder | null>(null);
  const [whatsappModalOrder, setWhatsappModalOrder] = useState<POSOrder | null>(null);
  const [recreatingOrder, setRecreatingOrder] = useState<Order | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleOpenRecreate = (ord: POSOrder) => {
    const rawOrder: Order = {
      id: Number(ord.id),
      order_number: ord.orderNumber,
      customer_name: ord.customerName,
      customer_phone: ord.customerPhone,
      order_type: ord.orderType,
      table_number: ord.tableNumber ? ord.tableNumber.replace("Table #", "").trim() : null,
      delivery_address: ord.address || null,
      delivery_rider_name: ord.riderName || null,
      items: ord.items.map((it) => ({
        name: it.name,
        price: it.price,
        qty: it.qty,
        quantity: it.qty,
        detail: it.detail,
      })) as any,
      total: ord.total,
      status: ord.status as any,
      notes: ord.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      shop_id: ord.shopId || activeShop?.id || null,
    };
    setRecreatingOrder(rawOrder);
  };

  const supabase = useMemo(() => createClient(), []);

  // 1. Fetch available shops
  useEffect(() => {
    async function loadShops() {
      try {
        const { data, error } = await supabase
          .from("shops")
          .select("id, name, slug, address, phone")
          .eq("status", "active")
          .order("id", { ascending: true });

        if (!error && data && data.length > 0) {
          setShops(data as ShopInfo[]);

          // Match active shop from searchParam slug or ID
          let matched: ShopInfo | undefined;
          if (shopParam) {
            matched = data.find((s) => s.slug === shopParam || s.slug?.toLowerCase() === shopParam.toLowerCase());
          }
          if (!matched && shopIdParam) {
            matched = data.find((s) => String(s.id) === shopIdParam);
          }
          if (!matched) {
            // Default to first active shop
            matched = data[0];
          }
          setActiveShop(matched);
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
      }
    }
    loadShops();
  }, [supabase, shopParam, shopIdParam]);

  // Audio Chime synthesizer
  const playChime = useCallback((highPitch = false) => {
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
  }, [soundEnabled]);

  // 2. Fetch orders strictly for the active shop & subscribe to realtime
  useEffect(() => {
    if (!activeShop) return;

    let isMounted = true;
    setLoading(true);

    async function loadBranchOrders() {
      try {
        // Query strictly for the active shop's orders
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("shop_id", activeShop!.id)
          .order("id", { ascending: false })
          .limit(80);

        if (!error && data && isMounted) {
          const mapped = data.map(mapCloudOrderToPOS);
          setOrders(mapped);
        }
      } catch (err) {
        console.error("Error loading branch orders:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBranchOrders();

    // Enterprise Realtime WebSocket Subscription with strict branch isolation
    const channelName = `pos-orders-branch-${activeShop.id}-${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `shop_id=eq.${activeShop.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const raw = payload.new;
            // Strict branch isolation guard: never accept other shop orders
            if (!raw || Number(raw.shop_id) !== Number(activeShop.id)) return;

            const newPosOrder = mapCloudOrderToPOS(raw);
            setOrders((prev) => [newPosOrder, ...prev.filter((o) => o.id !== newPosOrder.id)]);
            playChime(true);
          } else if (payload.eventType === "UPDATE") {
            const raw = payload.new;
            if (!raw) return;

            if (Number(raw.shop_id) !== Number(activeShop.id)) {
              // If order was moved to another branch, remove it from this terminal
              setOrders((prev) => prev.filter((o) => o.id !== String(raw.id)));
              return;
            }

            const updatedOrder = mapCloudOrderToPOS(raw);
            setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
          } else if (payload.eventType === "DELETE") {
            const oldId = String((payload.old as any)?.id);
            if (oldId) {
              setOrders((prev) => prev.filter((o) => o.id !== oldId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [activeShop, supabase, playChime]);

  // Handle switching active branch
  const handleSwitchBranch = (selectedShopId: number) => {
    const s = shops.find((sh) => sh.id === selectedShopId);
    if (s) {
      setActiveShop(s);
      router.push(`/demo/pos?shop=${encodeURIComponent(s.slug)}`);
    }
  };

  // Simulate new incoming order directly for active shop in Supabase
  const simulateIncomingOrder = async () => {
    if (!activeShop || isSimulating) return;
    setIsSimulating(true);

    try {
      const nextSeq = orders.length + 1;
      const orderSeqStr = String(nextSeq).padStart(3, "0");
      const seqOrderNum = `ORD-${activeShop.id ? activeShop.id + "-" : ""}${orderSeqStr}`;
      const sampleCustomerNames = ["Hamza Tariq", "Zahid Qureshi", "Ayesha Malik", "Usman Khan", "Bilal Sheikh"];
      const randomName = sampleCustomerNames[Math.floor(Math.random() * sampleCustomerNames.length)];
      const sampleItems = [
        { name: "Chicken Tikka Supreme (Large 13\")", qty: 1, price: 2350, selected_variation: { name: "Stuffed Crust" } },
        { name: "Crispy Peri Peri Wings (6 Pcs)", qty: 1, price: 540 },
        { name: "Coca Cola Bottle 1.5L", qty: 1, price: 220 },
      ];
      const totalAmount = 3110;

      const payload = {
        order_number: seqOrderNum,
        shop_id: activeShop.id,
        customer_name: randomName,
        customer_phone: "0300-8889922",
        order_type: "delivery",
        delivery_address: `${activeShop.name} Delivery Zone, Street 4, Sector B`,
        status: "pending",
        total: totalAmount,
        subtotal: totalAmount - 150,
        delivery_fee: 150,
        items: sampleItems,
        notes: `Simulated POS Test Order for ${activeShop.name}`,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from("orders").insert(payload).select().single();

      if (!error && data) {
        const mapped = mapCloudOrderToPOS(data);
        setOrders((prev) => [mapped, ...prev.filter((o) => o.id !== mapped.id)]);
        playChime(true);
      }
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Update order status in Supabase
  const updateOrderStatus = async (orderId: string, newStatus: POSOrder["status"]) => {
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    playChime();

    try {
      const cloudStatus =
        newStatus === "delivered" ? "delivered" : newStatus === "ready" ? "ready" : newStatus === "preparing" ? "preparing" : newStatus;

      await supabase
        .from("orders")
        .update({
          status: cloudStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);
    } catch (err) {
      console.error("Failed to update status in cloud:", err);
    }
  };

  // Filter orders by status tab
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (filterTab === "all") return true;
      if (filterTab === "pending") return o.status === "pending";
      if (filterTab === "preparing") return o.status === "preparing";
      if (filterTab === "ready") return o.status === "ready" || o.status === "dispatched";
      if (filterTab === "delivered") return o.status === "delivered";
      return true;
    });
  }, [orders, filterTab]);

  const totalSales = useMemo(() => {
    return orders.reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const kitchenCount = orders.filter((o) => o.status === "preparing").length;
  const readyCount = orders.filter((o) => o.status === "ready" || o.status === "dispatched").length;

  return (
    <div style={{ minHeight: "125vh", background: "#09090b", color: "#ffffff" }}>
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
          {/* Left: Terminal & Active Branch Info */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                background: "#ea580c",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 900,
                boxShadow: "0 0 12px rgba(234, 88, 12, 0.4)",
              }}
            >
              🖥️
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em" }}>
                  BRANCH POS TERMINAL
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
                  LIVE SYNC ACTIVE
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                <span style={{ fontSize: 13, color: "#f97316", fontWeight: 800 }}>
                  📍 {activeShop ? activeShop.name : "Loading branch..."}
                </span>
                <span style={{ fontSize: 12, color: "#71717a" }}>
                  (Shop ID: #{activeShop?.id ?? "—"}) • Cashier Terminal #01
                </span>
              </div>
            </div>
          </div>

          {/* Center/Right: Branch Switcher & Quick Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Branch Switcher Dropdown */}
            {shops.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#27272a", padding: "4px 10px", borderRadius: 6, border: "1px solid #3f3f46" }}>
                <span style={{ fontSize: 11, color: "#a1a1aa", fontWeight: 700 }}>SWITCH BRANCH:</span>
                <select
                  value={activeShop?.id || ""}
                  onChange={(e) => handleSwitchBranch(Number(e.target.value))}
                  style={{
                    background: "#18181b",
                    color: "#ffffff",
                    border: "1px solid #ea580c",
                    borderRadius: 4,
                    padding: "4px 8px",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Branch #{s.id})
                    </option>
                  ))}
                </select>
              </div>
            )}

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
              title="Toggle audio alert for new branch orders"
            >
              <span>{soundEnabled ? "🔊 Sound: ON" : "🔇 Sound: MUTED"}</span>
            </button>

            <button
              onClick={simulateIncomingOrder}
              disabled={isSimulating}
              style={{
                background: isSimulating ? "#78350f" : "#ea580c",
                color: "#ffffff",
                border: "2px solid #ffffff",
                borderRadius: 4,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 900,
                cursor: isSimulating ? "not-allowed" : "pointer",
                textTransform: "uppercase",
                boxShadow: "0 3px 0 #9a3412",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{isSimulating ? "⏳ Creating..." : "➕ Simulate Branch Order"}</span>
            </button>

            <Link
              href={activeShop ? `/demo/kitchen?shop=${encodeURIComponent(activeShop.slug)}` : "/demo/kitchen"}
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
              Kitchen KDS ➔
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
            {
              label: `${activeShop?.name || "Branch"} Total Sales`,
              value: `Rs. ${totalSales.toLocaleString()}`,
              color: "#22c55e",
              sub: `${orders.length} Branch Orders Processed`,
            },
            {
              label: "New Incoming Queue",
              value: `${pendingCount} Orders`,
              color: "#ea580c",
              sub: "Needs POS Confirmation",
            },
            {
              label: "Currently In Kitchen",
              value: `${kitchenCount} Orders`,
              color: "#38bdf8",
              sub: "Baking in branch oven",
            },
            {
              label: "Out For Delivery / Ready",
              value: `${readyCount} Orders`,
              color: "#eab308",
              sub: "Dispatched with branch riders",
            },
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
              <span
                style={{
                  fontSize: 11,
                  color: "#a1a1aa",
                  textTransform: "uppercase",
                  fontWeight: 800,
                  display: "block",
                }}
              >
                {stat.label}
              </span>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: stat.color,
                  margin: "4px 0 2px",
                }}
              >
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
              { id: "all", label: `All ${activeShop?.name || ""} Orders (${orders.length})` },
              { id: "pending", label: `⚡ New / Received (${pendingCount})` },
              { id: "preparing", label: `🔥 In Kitchen (${kitchenCount})` },
              { id: "ready", label: `🛵 Dispatched / Ready (${readyCount})` },
              { id: "delivered", label: `✓ Completed (${orders.filter((o) => o.status === "delivered").length})` },
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
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span style={{ fontSize: 12, color: "#a1a1aa" }}>
            🔒 Showing exclusively orders for <strong>{activeShop?.name || "Active Branch"}</strong>
          </span>
        </div>

        {/* Orders Table / Cards List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#a1a1aa" }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>⏳</div>
            <div style={{ fontWeight: 800 }}>Connecting live to {activeShop?.name || "branch"} order stream...</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div
            style={{
              background: "#18181b",
              border: "1.5px dashed #27272a",
              borderRadius: 8,
              padding: "60px 20px",
              textAlign: "center",
              color: "#a1a1aa",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>🍕</div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: "#ffffff", marginBottom: 6 }}>
              No Orders Found for {activeShop?.name}
            </h3>
            <p style={{ fontSize: 13, maxWidth: 450, margin: "0 auto 20px", color: "#71717a" }}>
              New orders placed on the storefront or counter for this branch will appear here in real time.
            </p>
            <button
              onClick={simulateIncomingOrder}
              style={{
                background: "#ea580c",
                color: "#ffffff",
                border: "none",
                borderRadius: 4,
                padding: "10px 20px",
                fontSize: 12,
                fontWeight: 900,
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              ➕ Create Test Order for {activeShop?.name}
            </button>
          </div>
        ) : (
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
                        {ord.orderType === "dine_in"
                          ? `🍽️ ${ord.tableNumber || "Dine-In"}`
                          : ord.orderType === "delivery"
                          ? "🛵 Delivery"
                          : "🥡 Takeaway"}
                      </span>
                      <span style={{ fontSize: 12, color: "#a1a1aa" }}>• {ord.timeAgo}</span>
                      {ord.notes?.includes("[RECREATED") && (
                        <span
                          style={{
                            background: "#ea580c",
                            color: "#ffffff",
                            fontSize: 10,
                            fontWeight: 900,
                            padding: "2px 6px",
                            borderRadius: 3,
                            letterSpacing: "0.02em",
                          }}
                        >
                          🔄 RECREATED
                        </span>
                      )}
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
                          Assign Rider &amp; Dispatch ➔
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

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        onClick={() => handleOpenRecreate(ord)}
                        style={{
                          background: "#ea580c",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: 4,
                          padding: "6px 12px",
                          fontSize: 11,
                          fontWeight: 900,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          boxShadow: "0 1px 3px rgba(234, 88, 12, 0.4)",
                        }}
                        title="Recreate order: add burger/items, refresh time to now, keep same Order ID"
                      >
                        🔄 Recreate Order
                      </button>
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
                        href={`/track/${ord.orderNumber}`}
                        target="_blank"
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
        )}
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
              <div style={{ fontSize: 16, fontWeight: 900 }}>{activeShop?.name?.toUpperCase() || "PIZZA SHOP"}</div>
              <div style={{ fontSize: 11 }}>{activeShop?.address || "Main Branch, Pakistan"}</div>
              <div style={{ fontSize: 11 }}>Tel: {activeShop?.phone || "0300-1234567"}</div>
              <div style={{ fontSize: 12, fontWeight: 900, marginTop: 6 }}>
                ORDER #{viewingReceiptOrder.orderNumber}
              </div>
            </div>

            <div style={{ fontSize: 11, marginBottom: 10, lineHeight: 1.4 }}>
              <div>Branch: {activeShop?.name} (ID: #{activeShop?.id})</div>
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
                  <span>Rs. {item.price.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 13, fontWeight: 900, display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <span>NET TOTAL:</span>
              <span>Rs. {viewingReceiptOrder.total.toLocaleString()}</span>
            </div>

            <div style={{ textAlign: "center", fontSize: 10, borderTop: "1px dashed #000", paddingTop: 8, marginBottom: 16 }}>
              <div>*** THANK YOU FOR YOUR ORDER ***</div>
              <div>Powered by Pizza Management POS</div>
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
              🍕 *{activeShop?.name?.toUpperCase() || "PIZZA SHOP"}*<br />
              Order *#{whatsappModalOrder.orderNumber}* Confirmed!<br />
              ------------------------<br />
              Customer: {whatsappModalOrder.customerName}<br />
              Total Amount: Rs. {whatsappModalOrder.total.toLocaleString()} ({whatsappModalOrder.paymentMethod})<br />
              Status: {whatsappModalOrder.status.toUpperCase()}<br />
              Branch: {activeShop?.name}<br />
              ------------------------<br />
              Thank you for ordering with us!
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  alert(`Branded WhatsApp receipt dispatched for Order #${whatsappModalOrder.orderNumber}!`);
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
                Send WhatsApp Alert ✓
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

      {/* ─── ORDER RECREATE MODAL ───────────────────────────── */}
      <OrderRecreateModal
        isOpen={!!recreatingOrder}
        onClose={() => setRecreatingOrder(null)}
        order={recreatingOrder}
        currencySymbol="Rs."
        shopId={activeShop?.id}
        onSuccess={(updatedOrder) => {
          const mapped = mapCloudOrderToPOS(updatedOrder);
          setOrders((prev) => [mapped, ...prev.filter((o) => o.id !== mapped.id)]);
          playChime(true);
        }}
      />
    </div>
  );
}

export default function DemoPOSPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", background: "#09090b", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🖥️</div>
            <div style={{ fontWeight: 800 }}>Loading POS Terminal...</div>
          </div>
        </div>
      }
    >
      <POSContent />
    </Suspense>
  );
}
