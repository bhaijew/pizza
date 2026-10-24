"use client";

import { useState, useEffect, useMemo, useTransition, useCallback } from "react";
import type { Order } from "@/types/menu";
import { updateOrderStatus, assignOrderRider, triggerRiderWhatsAppAlert, deleteOrder } from "@/lib/admin-actions";
import { createClient } from "@/utils/supabase/client";
import { isOrderInTodayShift } from "@/lib/business-hours";
import {
  Search,
  Bike,
  UtensilsCrossed,
  ShoppingBag,
  Clock,
  ArrowRight,
  ExternalLink,
  Flame,
  CheckCircle2,
  XCircle,
  Key,
  MapPin,
  Phone,
  User,
  Volume2,
  VolumeX,
  RefreshCw,
  TrendingUp,
  X,
  Printer,
  Copy,
  Check,
  Trash2,
} from "lucide-react";
import OrderRecreateModal from "@/components/admin/OrderRecreateModal";
import ThermalDualPrintModal from "@/components/admin/ThermalDualPrintModal";
import type { DeliveryRider } from "@/lib/admin-actions";
import AudioNotificationController, {
  playAlertChime,
  SOUND_VOLUME_KEY,
  SOUND_MUTED_KEY,
} from "@/components/admin/AudioNotificationController";

interface OrdersLiveBoardProps {
  initialOrders: Order[];
  initialRiders?: DeliveryRider[];
  currencySymbol?: string;
  shopId?: number | null;
  shopSlug?: string | null;
  shopName?: string;
  shopAddress?: string | null;
  shopPhone?: string | null;
  availableProducts?: {
    id: number;
    name: string;
    price: number;
    category_name?: string;
    is_available?: boolean;
  }[];
  userRole?: "admin" | "sub_admin" | "staff";
  canCancelOrders?: boolean;
  openingTime?: string;
  closingTime?: string;
  lastClosedAt?: string | null;
  activeBusinessDate?: string;
}


type FilterTab = "active" | "today" | "all" | "delivery" | "tables" | "tokens" | "pending" | "preparing" | "ready" | "delivered" | "cancelled";

function getOrderServiceInfo(order: Order) {
  let tableNumber = order.table_number || null;
  let tokenNumber = order.token_number || null;
  let deliveryAddress = order.delivery_address || null;
  let deliveryFee: number | null = null;
  let riderName = order.delivery_rider_name || null;
  let riderPhone = order.delivery_rider_phone || null;

  if (order.notes?.includes("[DELIVERY:")) {
    const match = order.notes.match(/\[DELIVERY:\s*Address:\s*([^|]+)/i);
    if (match) deliveryAddress = match[1].trim();
    const feeMatch = order.notes.match(/Fee:\s*([0-9.]+)/i);
    if (feeMatch) deliveryFee = parseFloat(feeMatch[1]);
  }
  if (!riderName && order.notes?.includes("[RIDER:")) {
    const rMatch = order.notes.match(/\[RIDER:\s*([^|]+)/i);
    if (rMatch) riderName = rMatch[1].trim();
    const pMatch = order.notes.match(/Phone:\s*([^\]]+)/i);
    if (pMatch) riderPhone = pMatch[1].trim();
  }
  if (!tableNumber && order.notes?.includes("[DINE-IN:")) {
    const match = order.notes.match(/\[DINE-IN:\s*Table\s*([0-9A-Za-z]+)/i) || order.notes.match(/\[DINE-IN:\s*([^\]|]+)/i);
    if (match) tableNumber = match[1].trim();
  }
  if (!tokenNumber && order.notes?.includes("TOKEN:")) {
    const match = order.notes.match(/TOKEN:\s*([A-Za-z0-9-]+)/i);
    if (match) tokenNumber = match[1].trim();
  }

  const isDelivery = order.order_type === "delivery" || !!deliveryAddress;
  const isDineIn = !isDelivery && (order.order_type === "dine_in" || !!tableNumber);

  return {
    type: isDelivery ? ("delivery" as const) : isDineIn ? ("dine_in" as const) : ("takeaway" as const),
    tableNumber,
    tokenNumber,
    deliveryAddress,
    deliveryFee,
    riderName,
    riderPhone,
    label: isDelivery ? "Delivery" : isDineIn ? (tableNumber ? `Table #${tableNumber}` : "Dine-In") : (tokenNumber ? `Token ${tokenNumber}` : "Takeaway"),
  };
}

function getCleanCustomerNote(notes?: string | null) {
  if (!notes) return "";
  return notes
    .replace(/\[DELIVERY:[^\]]*\]/gi, "")
    .replace(/\[RIDER:[^\]]*\]/gi, "")
    .replace(/\[RECREATED:[^\]]*\]/gi, "")
    .replace(/\[DINE-IN:[^\]]*\]/gi, "")
    .replace(/TOKEN:\s*[A-Za-z0-9-]+/gi, "")
    .trim();
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; nextStatus?: string; nextLabel?: string }
> = {
  pending: {
    label: "Pending Approval",
    color: "#ca8a04",
    bg: "#fefce8",
    border: "#fef08a",
    nextStatus: "confirmed",
    nextLabel: "Confirm Order →",
  },
  confirmed: {
    label: "Confirmed",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
    nextStatus: "preparing",
    nextLabel: "Send to Kitchen →",
  },
  preparing: {
    label: "In Oven / Preparing",
    color: "#ea580c",
    bg: "#fff7ed",
    border: "#fed7aa",
    nextStatus: "ready",
    nextLabel: "Mark as Ready →",
  },
  ready: {
    label: "Ready for Pickup",
    color: "#9333ea",
    bg: "#faf5ff",
    border: "#e9d5ff",
    nextStatus: "delivered",
    nextLabel: "Mark Delivered ✓",
  },
  delivered: {
    label: "Delivered / Completed",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
  },
  cancelled: {
    label: "Cancelled",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
  },
};

export default function OrdersLiveBoard({
  initialOrders,
  initialRiders = [],
  currencySymbol = "$",
  shopId,
  shopSlug,
  shopName = "Pizza Restaurant",
  shopAddress,
  shopPhone,
  availableProducts = [],
  userRole = "admin",
  canCancelOrders = true,
  openingTime = "11:00",
  closingTime = "01:00",
  lastClosedAt = null,
  activeBusinessDate = "",
}: OrdersLiveBoardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [currentLastClosedAt, setCurrentLastClosedAt] = useState<string | null>(lastClosedAt || null);
  const [currentActiveDate, setCurrentActiveDate] = useState<string>(activeBusinessDate || "");
  const [savedRiders, setSavedRiders] = useState<DeliveryRider[]>(initialRiders);
  const [activeTab, setActiveTab] = useState<FilterTab>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [realtimeActive, setRealtimeActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recreatingOrder, setRecreatingOrder] = useState<Order | null>(null);

  // Keep saved delivery riders fresh
  useEffect(() => {
    fetch(`/api/riders${shopId ? `?shopId=${shopId}` : ""}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.riders)) {
          setSavedRiders(data.riders);
        }
      })
      .catch(() => {});
  }, [shopId]);

  // Thermal Printing state
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [printTab, setPrintTab] = useState<"counter" | "kitchen" | "dual">("dual");
  const [copiedKdsLink, setCopiedKdsLink] = useState(false);
  const [editingFeeOrderId, setEditingFeeOrderId] = useState<number | null>(null);
  const [feeInput, setFeeInput] = useState<string>("");
  const [savingFeeId, setSavingFeeId] = useState<number | null>(null);

  const handleCopyKdsLink = () => {
    if (typeof window !== "undefined") {
      const kdsUrl = shopSlug
        ? `${window.location.origin}/${shopSlug}/kitchen`
        : `${window.location.origin}/kitchen${shopId ? `?shop=${shopId}` : ""}`;
      navigator.clipboard.writeText(kdsUrl);
      setCopiedKdsLink(true);
      setTimeout(() => setCopiedKdsLink(false), 2500);
    }
  };


  // Today's shift orders (Filtered strictly to exclude any orders prior to last daily closing)
  const todayOrders = useMemo(() => {
    return orders.filter((o) => {
      if (currentLastClosedAt && new Date(o.created_at).getTime() <= new Date(currentLastClosedAt).getTime()) {
        return false;
      }
      return true;
    });
  }, [orders, currentLastClosedAt]);

  // Real-Time live sales metrics updated via Supabase websocket stream
  const salesStats = useMemo(() => {
    const validToday = todayOrders.filter((o) => o.status !== "cancelled");
    const netSales = validToday.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    let deliveryCount = 0;
    let dineInCount = 0;
    let takeawayCount = 0;

    validToday.forEach((o) => {
      const info = getOrderServiceInfo(o);
      if (info.type === "delivery") deliveryCount++;
      else if (info.type === "dine_in") dineInCount++;
      else takeawayCount++;
    });

    const activeInKitchen = todayOrders.filter((o) => o.status === "pending" || o.status === "preparing").length;
    const readyCount = todayOrders.filter((o) => o.status === "ready").length;
    const deliveredCount = todayOrders.filter((o) => o.status === "delivered").length;
    const cancelledCount = todayOrders.filter((o) => o.status === "cancelled").length;

    return {
      netSales,
      totalCount: validToday.length,
      deliveryCount,
      dineInCount,
      takeawayCount,
      activeInKitchen,
      readyCount,
      deliveredCount,
      cancelledCount,
    };
  }, [todayOrders]);

  // Play crisp enterprise POS alert chime with user-selected volume
  const playPosOrderChime = useCallback(() => {
    let vol = 80;
    let muted = false;
    try {
      const savedVol = localStorage.getItem(SOUND_VOLUME_KEY);
      const savedMuted = localStorage.getItem(SOUND_MUTED_KEY);
      if (savedVol !== null) vol = parseInt(savedVol, 10);
      if (savedMuted !== null) muted = savedMuted === "true";
    } catch {}
    playAlertChime(vol, muted, "pos");
  }, []);

  // Feature 8: Rider assignment & Round-Robin auto-rotation
  const [assigningRiderOrderId, setAssigningRiderOrderId] = useState<number | null>(null);
  const [riderNameInput, setRiderNameInput] = useState("");
  const [riderPhoneInput, setRiderPhoneInput] = useState("");
  const [sendingRiderWaId, setSendingRiderWaId] = useState<number | null>(null);
  const [riderWaSentId, setRiderWaSentId] = useState<number | null>(null);

  // Active on-duty saved riders
  const activeSavedRiders = useMemo(() => {
    return (savedRiders || []).filter((r) => r.is_active);
  }, [savedRiders]);

  // Find the last assigned rider among delivery orders to determine rotation sequence
  const lastAssignedRider = useMemo(() => {
    const deliveryWithRider = orders
      .filter((o) => {
        const info = getOrderServiceInfo(o);
        return info.type === "delivery" && (info.riderName || o.delivery_rider_name);
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (deliveryWithRider.length === 0) return null;
    const latest = deliveryWithRider[0];
    const info = getOrderServiceInfo(latest);
    return {
      name: info.riderName || latest.delivery_rider_name || "",
      phone: info.riderPhone || latest.delivery_rider_phone || "",
    };
  }, [orders]);

  // Next round-robin rider: automatically rotates to the next active on-duty rider
  const nextRoundRobinRider = useMemo(() => {
    if (activeSavedRiders.length === 0) return null;
    if (!lastAssignedRider) return activeSavedRiders[0];

    const lastClean = (lastAssignedRider.phone || "").replace(/\D/g, "");
    const lastNameLower = (lastAssignedRider.name || "").toLowerCase().trim();

    const foundIdx = activeSavedRiders.findIndex((r) => {
      const rClean = (r.phone || "").replace(/\D/g, "");
      const rName = (r.name || "").toLowerCase().trim();
      return (
        (lastClean && rClean && (lastClean === rClean || lastClean.endsWith(rClean) || rClean.endsWith(lastClean))) ||
        (lastNameLower && rName === lastNameLower)
      );
    });

    if (foundIdx === -1) {
      return activeSavedRiders[0];
    }

    const nextIdx = (foundIdx + 1) % activeSavedRiders.length;
    return activeSavedRiders[nextIdx];
  }, [activeSavedRiders, lastAssignedRider]);

  const handleAssignRiderSubmit = (orderId: number, overrideName?: string, overridePhone?: string) => {
    const assignedName = (overrideName !== undefined ? overrideName : riderNameInput).trim();
    const assignedPhone = (overridePhone !== undefined ? overridePhone : riderPhoneInput).trim();
    if (!assignedName) return;

    // Do NOT open WhatsApp in a new tab upon assigning. Background alert or manual 💬 WA button is available.
    startTransition(async () => {
      await assignOrderRider(orderId, assignedName, assignedPhone);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                delivery_rider_name: assignedName,
                delivery_rider_phone: assignedPhone || null,
                status: "ready",
              }
            : o
        )
      );
      setAssigningRiderOrderId(null);
    });
  };

  const handleSendRiderWhatsApp = async (orderId: number) => {
    setSendingRiderWaId(orderId);
    try {
      const res = await triggerRiderWhatsAppAlert(orderId);
      if (res.success) {
        setRiderWaSentId(orderId);
        setTimeout(() => setRiderWaSentId(null), 4000);
      } else {
        alert(res.error || "Failed to dispatch WhatsApp alert to rider.");
      }
    } catch (err: any) {
      alert(err?.message || "WhatsApp dispatch error.");
    } finally {
      setSendingRiderWaId(null);
    }
  };

  // Enterprise Multi-Tenant Realtime WebSocket Subscription + 3s Auto-Sync Engine
  useEffect(() => {
    const supabase = createClient();
    const channelName = `pos-live-orders-${shopId || "all"}-${Math.random().toString(36).substring(2, 7)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as Order;
            if (shopId && newOrder.shop_id != null && Number(newOrder.shop_id) !== Number(shopId)) {
              return;
            }
            setOrders((prev) =>
              [newOrder, ...prev.filter((o) => o.id !== newOrder.id)].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )
            );
            if (soundEnabled) {
              playPosOrderChime();
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Order;
            if (shopId && updated.shop_id != null && Number(updated.shop_id) !== Number(shopId)) {
              setOrders((prev) => prev.filter((o) => o.id !== updated.id));
              return;
            }
            setOrders((prev) => {
              const updatedList = prev.map((o) => (o.id === updated.id ? updated : o));
              return updatedList.sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );
            });
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((o) => o.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeActive(true);
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setRealtimeActive(false);
        }
      });

    // 3-second live sync engine via server API (bypasses RLS, zero screen reloads needed)
    const syncInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/live?shopId=${shopId || ""}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          if (json.lastClosedAt !== undefined && json.lastClosedAt !== currentLastClosedAt) {
            setCurrentLastClosedAt(json.lastClosedAt);
          }
          if (json.activeBusinessDate && json.activeBusinessDate !== currentActiveDate) {
            setCurrentActiveDate(json.activeBusinessDate);
          }
          if (json.orders && Array.isArray(json.orders)) {
            const data = json.orders as Order[];
            setOrders((prev) => {
              const prevIds = new Set(prev.map((o) => o.id));
              const hasBrandNew = data.some((o) => !prevIds.has(o.id));
              if (hasBrandNew && soundEnabled) {
                playPosOrderChime();
              }

              const prevSign = prev.map((o) => `${o.id}-${o.status}`).join(",");
              const newSign = data.map((o) => `${o.id}-${o.status}`).join(",");
              if (prevSign !== newSign) {
                return data;
              }
              return prev;
            });
            setRealtimeActive(true);
          }
        }
      } catch {
        // network blink safe
      }
    }, 3000);

    return () => {
      clearInterval(syncInterval);
      supabase.removeChannel(channel);
    };
  }, [shopId, soundEnabled, playPosOrderChime]);

  const handleStatusChange = (orderId: number, nextStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus as any } : o))
    );

    startTransition(async () => {
      const res = await updateOrderStatus(orderId, nextStatus);
      if (res?.error) {
        alert(res.error);
        window.location.reload();
      }
    });
  };

  const handleDeleteOrder = (orderId: number, orderNum: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete order ${orderNum}? This will remove it completely.`)) {
      return;
    }
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    startTransition(async () => {
      const res = await deleteOrder(orderId);
      if (res?.error) {
        alert(res.error);
        window.location.reload();
      }
    });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Exclude orders from closed previous shifts
      if (currentLastClosedAt && new Date(order.created_at).getTime() <= new Date(currentLastClosedAt).getTime()) {
        return false;
      }

      const info = getOrderServiceInfo(order);

      if (activeTab === "active") {
        if (order.status === "delivered" || order.status === "cancelled") return false;
      } else if (activeTab === "today") {
        return true;
      } else if (activeTab === "delivery") {
        if (info.type !== "delivery") return false;
      } else if (activeTab === "tables") {
        if (info.type !== "dine_in") return false;
      } else if (activeTab === "tokens") {
        if (info.type !== "takeaway") return false;
      } else if (activeTab !== "all" && order.status !== activeTab) {
        return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const cleanDigits = q.replace(/[^0-9]/g, "");
        const rawClean = q.replace(/^[#\s]+/, "");

        const orderNumLower = (order.order_number || "").toLowerCase();
        const matchNumber =
          orderNumLower.includes(q) ||
          orderNumLower.includes(rawClean) ||
          orderNumLower.replace(/^ord-/, "").includes(rawClean) ||
          String(order.id) === rawClean;

        const matchCustomer = (order.customer_name || "").toLowerCase().includes(q);

        const custPhoneClean = (order.customer_phone || "").replace(/[^0-9]/g, "");
        const matchPhone =
          (order.customer_phone || "").toLowerCase().includes(q) ||
          (cleanDigits.length >= 3 && custPhoneClean.includes(cleanDigits));

        const matchLabel = (info.label || "").toLowerCase().includes(q);
        const matchTable = (order.table_number || "").toLowerCase().includes(rawClean);
        const matchToken = (order.token_number || "").toLowerCase().includes(rawClean);
        const matchRider = (info.riderName || "").toLowerCase().includes(q);
        const matchAddress = (info.deliveryAddress || "").toLowerCase().includes(q);

        return matchNumber || matchCustomer || matchPhone || matchLabel || matchTable || matchToken || !!matchRider || !!matchAddress;
      }

      return true;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, activeTab, searchQuery, openingTime, closingTime]);

  const activeCount = orders.filter(
    (o) => o.status !== "delivered" && o.status !== "cancelled"
  ).length;

  return (
    <div>
      {/* ─── REAL-TIME SALES & SHIFT SUMMARY STRIP ────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        {/* Real-time Net Sales */}
        <div
          style={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#ffffff",
            padding: "14px 18px",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(16, 185, 129, 0.2)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.9 }}>
                Today&apos;s Net Sales
              </span>
              <div style={{ fontSize: "22px", fontWeight: 800, marginTop: "4px", letterSpacing: "-0.02em" }}>
                {currencySymbol}{salesStats.netSales.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>
            <div style={{ background: "rgba(255, 255, 255, 0.2)", padding: "6px", borderRadius: "8px" }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: "11px", marginTop: "6px", opacity: 0.92, display: "flex", alignItems: "center", gap: "4px" }}>
            <span>🕒 Operating Shift:</span>
            <strong>{openingTime} – {closingTime}</strong>
          </div>
        </div>

        {/* Today's Shift Orders */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            padding: "14px 18px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>
                Today&apos;s Orders
              </span>
              <div style={{ fontSize: "22px", fontWeight: 800, marginTop: "4px", color: "#0f172a" }}>
                {salesStats.totalCount} <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>Orders</span>
              </div>
            </div>
            <div style={{ background: "#f1f5f9", padding: "6px", borderRadius: "8px", color: "#334155" }}>
              <ShoppingBag size={18} />
            </div>
          </div>
          <div style={{ fontSize: "11px", marginTop: "6px", color: "#64748b", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span>🛵 {salesStats.deliveryCount} Deliv</span>
            <span>🍽️ {salesStats.dineInCount} Dine-In</span>
            <span>🛍️ {salesStats.takeawayCount} Takeaway</span>
          </div>
        </div>

        {/* In Kitchen Active */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #fed7aa",
            padding: "14px 18px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#ea580c" }}>
                Active in Kitchen
              </span>
              <div style={{ fontSize: "22px", fontWeight: 800, marginTop: "4px", color: "#c2410c" }}>
                {salesStats.activeInKitchen} <span style={{ fontSize: "13px", fontWeight: 600, color: "#9a3412" }}>in progress</span>
              </div>
            </div>
            <div style={{ background: "#fff7ed", padding: "6px", borderRadius: "8px", color: "#ea580c" }}>
              <Flame size={18} />
            </div>
          </div>
          <div style={{ fontSize: "11px", marginTop: "6px", color: "#9a3412" }}>
            {orders.filter(o => o.status === "pending").length} Pending • {orders.filter(o => o.status === "preparing").length} In Oven
          </div>
        </div>

        {/* Completed & Delivered */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #bbf7d0",
            padding: "14px 18px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#16a34a" }}>
                Completed / Out
              </span>
              <div style={{ fontSize: "22px", fontWeight: 800, marginTop: "4px", color: "#15803d" }}>
                {salesStats.deliveredCount} <span style={{ fontSize: "13px", fontWeight: 600, color: "#166534" }}>Delivered</span>
              </div>
            </div>
            <div style={{ background: "#f0fdf4", padding: "6px", borderRadius: "8px", color: "#16a34a" }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: "11px", marginTop: "6px", color: "#166534" }}>
            {salesStats.readyCount} Ready for pickup • {salesStats.cancelledCount} Cancelled
          </div>
        </div>
      </div>

      {/* ─── LIVE HEADER ────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Kitchen &amp; Order Live Board
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "3px 8px",
                borderRadius: "5px",
                fontSize: "11px",
                fontWeight: 700,
                background: realtimeActive ? "#f0fdf4" : "#fefce8",
                color: realtimeActive ? "#16a34a" : "#ca8a04",
                border: realtimeActive ? "1px solid #bbf7d0" : "1px solid #fef08a",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "5px",
                  background: realtimeActive ? "#16a34a" : "#ca8a04",
                }}
              ></span>
              {realtimeActive ? "REALTIME LIVE" : "CONNECTING..."}
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
            Incoming customer orders update here instantly without refreshing.
          </p>
        </div>

        {/* Sound Alert Controller, KDS & Search */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <AudioNotificationController
            soundType="pos"
            onVolumeChange={(_vol, isMuted) => setSoundEnabled(!isMuted)}
          />

          {/* Standalone KDS Screen Tablet Link */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <button
              type="button"
              onClick={handleCopyKdsLink}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "8px 12px",
                borderRadius: "6px",
                border: copiedKdsLink ? "1px solid #86efac" : "1px solid #cbd5e1",
                background: copiedKdsLink ? "#f0fdf4" : "#ffffff",
                color: copiedKdsLink ? "#15803d" : "#334155",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Copy direct KDS link to open on any kitchen display/tablet"
            >
              {copiedKdsLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copiedKdsLink ? "KDS Link Copied!" : "📋 KDS Link"}</span>
            </button>

            <a
              href={shopSlug ? `/${shopSlug}/kitchen` : `/kitchen${shopId ? `?shop=${shopId}` : ""}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "8px 12px",
                borderRadius: "5px",
                background: "#dc2626",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 1px 3px rgba(220, 38, 38, 0.25)",
              }}
              title="Open Standalone Kitchen Display System in new window"
            >
              <span>🖥️ KDS Screen</span>
              <ExternalLink size={12} />
            </a>
          </div>


          {/* Sahi Search input with clear button */}
          <div style={{ position: "relative" }} className="w-full sm:w-[280px]">
            <input
              type="text"
              placeholder="Search #1, 001, phone, name, table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 34px 9px 34px",
                borderRadius: "6px",
                border: searchQuery ? "1px solid #10b981" : "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
                boxShadow: searchQuery ? "0 0 0 2px rgba(16, 185, 129, 0.15)" : "none",
              }}
            />
            <Search
              size={15}
              style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: searchQuery ? "#10b981" : "#64748b" }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Search Result Pill */}
      {searchQuery && (
        <div
          style={{
            padding: "8px 14px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "6px",
            marginBottom: "16px",
            fontSize: "12px",
            color: "#166534",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>
            🔍 Found <strong>{filteredOrders.length}</strong> matching orders for <strong>&quot;{searchQuery}&quot;</strong>
          </span>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            style={{
              background: "transparent",
              border: "none",
              color: "#16a34a",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "11px",
              textDecoration: "underline",
            }}
          >
            Clear Search
          </button>
        </div>
      )}

      {/* ─── STATUS FILTER TABS ──────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "20px",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "12px",
        }}
      >
        {/* Active tab */}
        <button
          onClick={() => setActiveTab("active")}
          style={{
            padding: "7px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeTab === "active" ? "1px solid #fed7aa" : "1px solid #e2e8f0",
            background: activeTab === "active" ? "#fff7ed" : "#ffffff",
            color: activeTab === "active" ? "#ea580c" : "#64748b",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.15s ease",
          }}
        >
          <Flame size={14} className={activeTab === "active" ? "text-orange-500" : ""} />
          <span>Active ({activeCount})</span>
        </button>

        {/* Today's Orders (Shift-based) */}
        <button
          onClick={() => setActiveTab("today")}
          style={{
            padding: "7px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeTab === "today" ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
            background: activeTab === "today" ? "#f0fdf4" : "#ffffff",
            color: activeTab === "today" ? "#16a34a" : "#64748b",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.15s ease",
          }}
        >
          <Clock size={14} className={activeTab === "today" ? "text-emerald-500" : ""} />
          <span>Today ({todayOrders.length})</span>
        </button>

        {/* Delivery tab */}
        <button
          onClick={() => setActiveTab("delivery")}
          style={{
            padding: "7px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeTab === "delivery" ? "1px solid #a7f3d0" : "1px solid #e2e8f0",
            background: activeTab === "delivery" ? "#ecfdf5" : "#ffffff",
            color: activeTab === "delivery" ? "#065f46" : "#64748b",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.15s ease",
          }}
        >
          <Bike size={14} />
          <span>Delivery ({orders.filter((o) => getOrderServiceInfo(o).type === "delivery").length})</span>
        </button>

        {/* All Orders tab */}
        <button
          onClick={() => setActiveTab("all")}
          style={{
            padding: "7px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeTab === "all" ? "1px solid #cbd5e1" : "1px solid #e2e8f0",
            background: activeTab === "all" ? "#f1f5f9" : "#ffffff",
            color: activeTab === "all" ? "#0f172a" : "#64748b",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.15s ease",
          }}
        >
          <ShoppingBag size={14} />
          <span>All Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("tables")}
          style={{
            padding: "7px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeTab === "tables" ? "1px solid #fde68a" : "1px solid #e2e8f0",
            background: activeTab === "tables" ? "#fef3c7" : "#ffffff",
            color: activeTab === "tables" ? "#92400e" : "#64748b",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.15s ease",
          }}
        >
          <UtensilsCrossed size={14} />
          <span>Tables ({orders.filter(o => getOrderServiceInfo(o).type === "dine_in").length})</span>
        </button>

        <button
          onClick={() => setActiveTab("tokens")}
          style={{
            padding: "7px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeTab === "tokens" ? "1px solid #fed7aa" : "1px solid #e2e8f0",
            background: activeTab === "tokens" ? "#fff7ed" : "#ffffff",
            color: activeTab === "tokens" ? "#c2410c" : "#64748b",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.15s ease",
          }}
        >
          <Key size={14} />
          <span>Tokens ({orders.filter(o => getOrderServiceInfo(o).type === "takeaway").length})</span>
        </button>

        <button
          onClick={() => setActiveTab("pending")}
          style={{
            padding: "7px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeTab === "pending" ? "1px solid #fef08a" : "1px solid #e2e8f0",
            background: activeTab === "pending" ? "#fefce8" : "#ffffff",
            color: activeTab === "pending" ? "#ca8a04" : "#64748b",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.15s ease",
          }}
        >
          <Clock size={13} />
          <span>Pending</span>
        </button>

        <button
          onClick={() => setActiveTab("preparing")}
          style={{
            padding: "7px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeTab === "preparing" ? "1px solid #fed7aa" : "1px solid #e2e8f0",
            background: activeTab === "preparing" ? "#fff7ed" : "#ffffff",
            color: activeTab === "preparing" ? "#ea580c" : "#64748b",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.15s ease",
          }}
        >
          <Flame size={13} />
          <span>In Kitchen</span>
        </button>

        <button
          onClick={() => setActiveTab("ready")}
          style={{
            padding: "7px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeTab === "ready" ? "1px solid #e9d5ff" : "1px solid #e2e8f0",
            background: activeTab === "ready" ? "#faf5ff" : "#ffffff",
            color: activeTab === "ready" ? "#9333ea" : "#64748b",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.15s ease",
          }}
        >
          <CheckCircle2 size={13} />
          <span>Ready</span>
        </button>

        <button
          onClick={() => setActiveTab("delivered")}
          style={{
            padding: "7px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeTab === "delivered" ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
            background: activeTab === "delivered" ? "#f0fdf4" : "#ffffff",
            color: activeTab === "delivered" ? "#16a34a" : "#64748b",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.15s ease",
          }}
        >
          <CheckCircle2 size={13} />
          <span>Delivered</span>
        </button>
      </div>

      {/* ─── ORDERS GRID ────────────────────────────────────── */}
      {filteredOrders.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            border: "1px dashed #cbd5e1",
            borderRadius: "5px",
            padding: "60px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px", color: "#94a3b8" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="21" r="1"></circle>
              <circle cx="19" cy="21" r="1"></circle>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
            </svg>
          </div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px", color: "#0f172a" }}>
            {orders.length === 0
              ? `New Shift Active (${currentActiveDate || "Next Day"})`
              : "No orders found in this view"}
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            {orders.length === 0
              ? "Previous shift has been closed. Ready for new incoming orders."
              : "No orders match your selected filter or search query."}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
            gap: "12px",
          }}
        >
          {filteredOrders.map((order) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const items = Array.isArray(order.items) ? order.items : [];

            return (
              <div
                key={order.id}
                style={{
                  background: "#ffffff",
                  border: `1px solid ${cfg.border}`,
                  borderRadius: "8px",
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.05)",
                }}
                className="admin-card-hover"
              >
                <div>
                  {/* Top Bar: Service Mode Badge (Table # / Token #) & Status Badge */}
                  {(() => {
                    const info = getOrderServiceInfo(order);
                    return (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "6px",
                          flexWrap: "wrap",
                          gap: "5px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "2px 7px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 800,
                              background: info.type === "delivery" ? "#ecfdf5" : info.type === "dine_in" ? "#fef3c7" : "#fff7ed",
                              color: info.type === "delivery" ? "#065f46" : info.type === "dine_in" ? "#92400e" : "#c2410c",
                              border: info.type === "delivery" ? "1px solid #a7f3d0" : info.type === "dine_in" ? "1px solid #fde68a" : "1px solid #fed7aa",
                            }}
                          >
                            {info.type === "delivery" ? (
                              <Bike size={12} />
                            ) : info.type === "dine_in" ? (
                              <UtensilsCrossed size={12} />
                            ) : (
                              <ShoppingBag size={12} />
                            )}
                            <span>{info.label}</span>
                          </span>

                          {info.tokenNumber && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "10px",
                                fontWeight: 800,
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                border: "1px solid #bfdbfe",
                              }}
                            >
                              <span>🔑</span>
                              <span style={{ fontFamily: "monospace" }}>{info.tokenNumber}</span>
                            </span>
                          )}
                        </div>

                        <span
                          style={{
                            padding: "2px 7px",
                            borderRadius: "4px",
                            fontSize: "10.5px",
                            fontWeight: 700,
                            background: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${cfg.border}`,
                          }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Order Number & Timestamp */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "13.5px",
                          fontWeight: 800,
                          color: "#0f172a",
                          letterSpacing: "-0.2px",
                        }}
                      >
                        {order.order_number}
                      </span>
                      {order.notes?.includes("[RECREATED") && (
                        <span
                          style={{
                            padding: "1px 5px",
                            borderRadius: "3px",
                            fontSize: "9.5px",
                            fontWeight: 800,
                            background: "#fff7ed",
                            color: "#ea580c",
                            border: "1px solid #fed7aa",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                          title="This order was recreated/modified while keeping the exact same Order ID"
                        >
                          <RefreshCw size={9} />
                          <span>RECREATED</span>
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "10.5px", color: "#64748b" }}>
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Customer Info (Compact single row) */}
                  {(order.customer_name || order.customer_phone) && (
                    <div
                      style={{
                        background: "#f8fafc",
                        padding: "4px 8px",
                        borderRadius: "5px",
                        fontSize: "11px",
                        marginBottom: "6px",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "4px",
                      }}
                    >
                      <div style={{ fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: "5px" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#64748b", flexShrink: 0 }}>
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>{order.customer_name || "Guest Customer"}</span>
                      </div>
                      {order.customer_phone && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ color: "#64748b", fontSize: "10.5px", display: "flex", alignItems: "center", gap: "4px", fontFamily: "monospace", fontWeight: 600 }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#94a3b8", flexShrink: 0 }}>
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                            <span>{order.customer_phone}</span>
                          </div>
                          {(() => {
                            const cleanCust = order.customer_phone.replace(/\D/g, "");
                            const custOrigin =
                              typeof window !== "undefined" && !window.location.origin.includes("localhost") && !window.location.origin.includes("127.0.0.1")
                                ? window.location.origin
                                : "https://pizza-murex-three.vercel.app";
                            const custTrackLink = `${custOrigin}/track/${order.order_number}`;
                            const custWaMsg = `Salam ${order.customer_name || "Valued Customer"}! 🎉\nYour order #${order.order_number} is being processed.\n\n📍 Live Status Tracker:\n${custTrackLink}\n\nThank you for choosing us!`;
                            const custWaUrl = `https://wa.me/${cleanCust.startsWith("03") ? "92" + cleanCust.slice(1) : cleanCust}?text=${encodeURIComponent(custWaMsg)}`;
                            return (
                              <a
                                href={custWaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Send live order tracking link to customer on WhatsApp"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  background: "#25d366",
                                  color: "#ffffff",
                                  fontSize: "9.5px",
                                  fontWeight: 700,
                                  textDecoration: "none",
                                }}
                              >
                                <span>💬 Track</span>
                              </a>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Delivery Destination & Rider Info (Unified Compact Box) */}
                  {(() => {
                    const info = getOrderServiceInfo(order);
                    if (info.type !== "delivery") return null;

                    return (
                      <div
                        style={{
                          marginBottom: "6px",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "5px",
                          padding: "5px 8px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "5px",
                        }}
                      >
                        {info.deliveryAddress && (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: 0 }}>
                              <span style={{ fontSize: "9px", fontWeight: 800, color: "#065f46", background: "#d1fae5", border: "1px solid #a7f3d0", padding: "1px 5px", borderRadius: "3px", textTransform: "uppercase", flexShrink: 0 }}>
                                📍 Delivery
                              </span>
                              <span style={{ fontSize: "11px", color: "#0f172a", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {info.deliveryAddress}
                              </span>
                            </div>
                            {info.deliveryFee !== null && (
                              <span style={{ fontSize: "10px", color: "#047857", fontWeight: 700, flexShrink: 0, background: "#ecfdf5", padding: "1px 5px", borderRadius: "3px" }}>
                                Fee: {currencySymbol}{info.deliveryFee}
                              </span>
                            )}
                          </div>
                        )}

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "4px",
                            borderTop: info.deliveryAddress ? "1px dashed #e2e8f0" : "none",
                            paddingTop: info.deliveryAddress ? "4px" : "0",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                              Rider:
                            </span>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: info.riderName ? "#0f172a" : "#dc2626" }}>
                              {info.riderName ? `${info.riderName} (${info.riderPhone || "No phone"})` : "Not Assigned"}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
                            {!info.riderName && nextRoundRobinRider && (
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleAssignRiderSubmit(order.id, nextRoundRobinRider.name, nextRoundRobinRider.phone)}
                                title={`Auto-assign to next rider in turn: ${nextRoundRobinRider.name} (${nextRoundRobinRider.phone})`}
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  background: "#ecfdf5",
                                  border: "1px solid #10b981",
                                  color: "#065f46",
                                  fontSize: "10px",
                                  fontWeight: 800,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                              >
                                <span>⚡ Assign {nextRoundRobinRider.name}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setAssigningRiderOrderId(order.id);
                                if (info.riderName) {
                                  setRiderNameInput(info.riderName);
                                  setRiderPhoneInput(info.riderPhone || "");
                                } else if (nextRoundRobinRider) {
                                  setRiderNameInput(nextRoundRobinRider.name);
                                  setRiderPhoneInput(nextRoundRobinRider.phone || "");
                                } else {
                                  setRiderNameInput("");
                                  setRiderPhoneInput("");
                                }
                              }}
                              style={{
                                padding: "2px 8px",
                                borderRadius: "4px",
                                background: "#ffffff",
                                border: "1px solid #cbd5e1",
                                color: "#0f172a",
                                fontSize: "10px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              {info.riderName ? "Change" : "Pick Rider"}
                            </button>

                            {info.riderPhone && (
                              <button
                                type="button"
                                disabled={sendingRiderWaId === order.id}
                                onClick={() => handleSendRiderWhatsApp(order.id)}
                                title="Send / Re-send WhatsApp dispatch alert to rider"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                  padding: "2px 7px",
                                  borderRadius: "4px",
                                  background: riderWaSentId === order.id ? "#15803d" : "#25d366",
                                  color: "#ffffff",
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  border: "none",
                                  cursor: sendingRiderWaId === order.id ? "not-allowed" : "pointer",
                                }}
                              >
                                <span>{riderWaSentId === order.id ? "Sent ✓" : "💬 WA"}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Delivery Charges Info & Quick Admin Adjuster */}
                        <div style={{ marginTop: 4, background: "#f8fafc", padding: "4px 7px", borderRadius: "4px", border: "1px dashed #cbd5e1" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "10.5px" }}>
                            <span style={{ color: "#065f46", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                              <span>🛵 Delivery Fee:</span>
                              <strong style={{ color: Number(order.delivery_fee || 0) > 0 ? "#059669" : "#16a34a" }}>
                                {Number(order.delivery_fee || 0) > 0 ? `${currencySymbol}${Number(order.delivery_fee).toFixed(0)}` : "Free (Rs. 0)"}
                              </strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (editingFeeOrderId === order.id) {
                                  setEditingFeeOrderId(null);
                                } else {
                                  setEditingFeeOrderId(order.id);
                                  setFeeInput(Number(order.delivery_fee || 0) > 0 ? String(order.delivery_fee) : "");
                                }
                              }}
                              style={{
                                padding: "1px 7px",
                                borderRadius: "3px",
                                background: "#ecfdf5",
                                border: "1px solid #a7f3d0",
                                color: "#065f46",
                                fontSize: "10px",
                                fontWeight: 800,
                                cursor: "pointer",
                              }}
                              title="Admin: Edit delivery fee and recalculate order total"
                            >
                              {editingFeeOrderId === order.id ? "Close ✕" : "✏️ Add/Change Fee"}
                            </button>
                          </div>

                          {/* Inline Delivery Fee Editor for Admin */}
                          {editingFeeOrderId === order.id && (
                            <div style={{ marginTop: 6, paddingTop: 5, borderTop: "1px solid #e2e8f0" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 5 }}>
                                <span style={{ fontSize: "11px", fontWeight: 700, color: "#065f46" }}>Rs.</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="10"
                                  placeholder="0 (Free Delivery)"
                                  value={feeInput}
                                  onChange={(e) => setFeeInput(e.target.value)}
                                  style={{
                                    flex: 1,
                                    height: "26px",
                                    padding: "0 6px",
                                    fontSize: "11.5px",
                                    fontWeight: 700,
                                    border: "1px solid #10b981",
                                    borderRadius: "3px",
                                    background: "#ffffff",
                                  }}
                                />
                                <button
                                  type="button"
                                  disabled={savingFeeId === order.id}
                                  onClick={async () => {
                                    setSavingFeeId(order.id);
                                    const safeFee = Math.max(0, Number(feeInput) || 0);
                                    try {
                                      const { updateOrderDeliveryDetails } = await import("@/lib/admin-actions");
                                      const res = await updateOrderDeliveryDetails(order.id, safeFee);
                                      if (res.success) {
                                        setOrders((prev) =>
                                          prev.map((o) =>
                                            o.id === order.id
                                              ? {
                                                  ...o,
                                                  delivery_fee: safeFee,
                                                  total: Math.max(0, Number((Number(o.total || 0) - Number(o.delivery_fee || 0) + safeFee).toFixed(2))),
                                                }
                                              : o
                                          )
                                        );
                                        setEditingFeeOrderId(null);
                                      } else {
                                        alert(res.error || "Failed to update fee");
                                      }
                                    } catch (err: any) {
                                      alert(err?.message || "Error updating fee");
                                    } finally {
                                      setSavingFeeId(null);
                                    }
                                  }}
                                  style={{
                                    height: "26px",
                                    padding: "0 10px",
                                    borderRadius: "3px",
                                    background: "#059669",
                                    color: "#ffffff",
                                    fontSize: "10.5px",
                                    fontWeight: 800,
                                    border: "none",
                                    cursor: "pointer",
                                  }}
                                >
                                  {savingFeeId === order.id ? "Saving..." : "Save ✓"}
                                </button>
                              </div>

                              {/* Quick Presets: 0 Free, 50, 100, 150, 200 */}
                              <div style={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center" }}>
                                <span style={{ fontSize: "9px", color: "#64748b", fontWeight: 700 }}>Quick:</span>
                                {[0, 50, 100, 150, 200].map((fee) => (
                                  <button
                                    key={fee}
                                    type="button"
                                    onClick={() => setFeeInput(fee === 0 ? "0" : String(fee))}
                                    style={{
                                      padding: "1px 5px",
                                      borderRadius: "2px",
                                      fontSize: "9px",
                                      fontWeight: 700,
                                      border: "1px solid #cbd5e1",
                                      background: "#ffffff",
                                      color: "#0f172a",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {fee === 0 ? "Free" : `Rs. ${fee}`}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Modal/Inline Form to Assign Rider */}
                        {assigningRiderOrderId === order.id && (
                          <div style={{ marginTop: 6, padding: 8, background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                              <p style={{ margin: 0, fontSize: "10.5px", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 3 }}>
                                <span>🛵</span>
                                <span>Assign Delivery Rider</span>
                              </p>
                              <a
                                href="/admin/riders"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: "10px", color: "#0284c7", fontWeight: 700, textDecoration: "none" }}
                                title="Open Rider Directory in new tab"
                              >
                                Manage Riders ↗
                              </a>
                            </div>

                            {/* Quick Select from Saved Active Riders */}
                            {savedRiders && savedRiders.filter((r) => r.is_active).length > 0 && (
                              <div style={{ marginBottom: 6 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                                  <span style={{ fontSize: "9px", fontWeight: 700, color: "#64748b" }}>
                                    ⚡ Quick Pick Saved Rider:
                                  </span>
                                  {nextRoundRobinRider && (
                                    <span style={{ fontSize: "8.5px", fontWeight: 700, color: "#059669" }}>
                                      Next in rotation: <b>{nextRoundRobinRider.name}</b>
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                                  {savedRiders
                                    .filter((r) => r.is_active)
                                    .map((r) => {
                                      const isSelected = riderNameInput === r.name;
                                      const isNextInTurn = nextRoundRobinRider?.id === r.id;
                                      return (
                                        <button
                                          key={r.id}
                                          type="button"
                                          onClick={() => {
                                            setRiderNameInput(r.name);
                                            setRiderPhoneInput(r.phone);
                                          }}
                                          style={{
                                            padding: "2px 7px",
                                            borderRadius: "3px",
                                            background: isSelected ? "#059669" : isNextInTurn ? "#ecfdf5" : "#f1f5f9",
                                            color: isSelected ? "#ffffff" : isNextInTurn ? "#065f46" : "#0f172a",
                                            border: "1px solid " + (isSelected ? "#047857" : isNextInTurn ? "#10b981" : "#cbd5e1"),
                                            fontSize: "9.5px",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 2,
                                          }}
                                          title={isNextInTurn ? "Next rider in round-robin rotation" : undefined}
                                        >
                                          <span>{isSelected ? "✓" : isNextInTurn ? "⚡" : "🛵"}</span>
                                          <span>{r.name}</span>
                                          {isNextInTurn && !isSelected && (
                                            <span style={{ fontSize: "8px", background: "#dcfce7", color: "#15803d", padding: "0 3px", borderRadius: 2 }}>
                                              Next
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })}
                                </div>
                              </div>
                            )}

                            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 6 }}>
                              <input
                                type="text"
                                placeholder="Rider Name (e.g. Tariq)"
                                value={riderNameInput}
                                onChange={(e) => setRiderNameInput(e.target.value)}
                                style={{ height: 26, padding: "0 6px", fontSize: 11, border: "1px solid #cbd5e1", borderRadius: 3 }}
                              />
                              <input
                                type="tel"
                                placeholder="Rider WhatsApp (e.g. 03001234567)"
                                value={riderPhoneInput}
                                onChange={(e) => setRiderPhoneInput(e.target.value)}
                                style={{ height: 26, padding: "0 6px", fontSize: 11, border: "1px solid #cbd5e1", borderRadius: 3, fontFamily: "monospace" }}
                              />
                            </div>
                            <div style={{ display: "flex", gap: 5 }}>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleAssignRiderSubmit(order.id)}
                                style={{ padding: "4px 12px", background: "#059669", color: "#fff", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                              >
                                Assign Rider ✓
                              </button>
                              <button
                                type="button"
                                onClick={() => setAssigningRiderOrderId(null)}
                                style={{ padding: "3px 8px", background: "#f1f5f9", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: 3, fontSize: 10.5, fontWeight: 700, cursor: "pointer" }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Order Items List */}
                  <div
                    style={{
                      borderTop: "1px solid #f1f5f9",
                      borderBottom: "1px solid #f1f5f9",
                      padding: "6px 0",
                      marginBottom: "6px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                    }}
                  >
                    {items.length === 0 ? (
                      <span style={{ fontSize: "11px", color: "#64748b" }}>Order items details</span>
                    ) : (
                      items.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "11.5px",
                            color: "#334155",
                          }}
                        >
                          <div>
                            <strong style={{ color: "#dc2626", marginRight: "5px" }}>
                              {item.quantity || item.qty || 1}x
                            </strong>
                            <span>{item.name || item.product?.name || "Pizza"}</span>
                            {item.selected_variation && (
                              <span style={{ marginLeft: 3, fontSize: 9.5, background: "#fee2e2", color: "#dc2626", padding: "1px 4px", borderRadius: 3, fontWeight: 700 }}>
                                {item.selected_variation.name}
                              </span>
                            )}
                            {item.selected_toppings && item.selected_toppings.length > 0 && (
                              <div style={{ fontSize: 9.5, color: "#64748b", marginLeft: 14 }}>
                                + {item.selected_toppings.map((t: any) => t.name).join(", ")}
                              </div>
                            )}
                          </div>
                          <span style={{ color: "#64748b", fontWeight: 600 }}>
                            {currencySymbol}{((item.price || item.product?.price || 0) * (item.quantity || item.qty || 1)).toFixed(2)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Real Customer Notes if any */}
                  {(() => {
                    const cleanNote = getCleanCustomerNote(order.notes);
                    if (!cleanNote) return null;
                    return (
                      <div
                        style={{
                          fontSize: "10.5px",
                          color: "#92400e",
                          background: "#fefce8",
                          border: "1px solid #fef08a",
                          padding: "3px 7px",
                          borderRadius: "4px",
                          marginBottom: "6px",
                          lineHeight: 1.3,
                        }}
                      >
                        <strong>Note:</strong> {cleanNote}
                      </div>
                    );
                  })()}
                </div>

                {/* Bottom Total & Status Progress Buttons */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "6px",
                    }}
                  >
                    <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 600 }}>Total Amount</span>
                    <span style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                      {currencySymbol}{Number(order.total).toFixed(2)}
                    </span>
                  </div>

                  {/* Action Buttons: 2-Row Modern Grid Layout */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {/* ROW 1: Primary Order Status Workflow */}
                    <div style={{ display: "flex", gap: "5px", width: "100%" }}>
                      {order.status === "delivered" ? (
                        <div
                          style={{
                            width: "100%",
                            height: "32px",
                            padding: "0 8px",
                            borderRadius: "6px",
                            background: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            color: "#166534",
                            fontSize: "11.5px",
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "5px",
                          }}
                        >
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                          <span>
                            {getOrderServiceInfo(order).tableNumber
                              ? `Delivered & Verified at Table #${getOrderServiceInfo(order).tableNumber} ✓`
                              : "Delivered & Verified ✓"}
                          </span>
                        </div>
                      ) : order.status === "cancelled" ? (
                        <div
                          style={{
                            width: "100%",
                            height: "30px",
                            padding: "0 8px",
                            borderRadius: "6px",
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            color: "#dc2626",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "5px",
                          }}
                        >
                          <X size={13} className="text-red-500 shrink-0" />
                          <span>Order Cancelled</span>
                        </div>
                      ) : (
                        <>
                          {/* BUTTON 1: Confirm Order / In Kitchen */}
                          {order.status === "pending" ? (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(order.id, "confirmed")}
                              style={{
                                flex: 1,
                                height: "32px",
                                borderRadius: "6px",
                                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                                color: "#ffffff",
                                fontSize: "11.5px",
                                fontWeight: 800,
                                border: "none",
                                cursor: "pointer",
                                boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                                whiteSpace: "nowrap",
                                padding: "0 6px",
                                transition: "all 0.15s ease",
                              }}
                              className="hover:brightness-110 active:scale-[0.98]"
                              title="Confirm order & auto-send to Kitchen Screen (KDS)"
                            >
                              <Check size={13} style={{ flexShrink: 0 }} />
                              <span>Confirm Order</span>
                              <ArrowRight size={12} style={{ flexShrink: 0, opacity: 0.8 }} />
                            </button>
                          ) : (
                            <div
                              style={{
                                flex: 1,
                                height: "32px",
                                borderRadius: "6px",
                                background: "#eff6ff",
                                border: "1px solid #bfdbfe",
                                color: "#1d4ed8",
                                fontSize: "11px",
                                fontWeight: 800,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                                whiteSpace: "nowrap",
                                padding: "0 6px",
                              }}
                            >
                              <CheckCircle2 size={12} className="text-blue-600 shrink-0" />
                              <span>In Kitchen</span>
                            </div>
                          )}

                          {/* BUTTON 2: Mark Delivered */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(order.id, "delivered")}
                            style={{
                              flex: 1,
                              height: "32px",
                              borderRadius: "6px",
                              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                              color: "#ffffff",
                              fontSize: "11.5px",
                              fontWeight: 800,
                              border: "none",
                              cursor: "pointer",
                              boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "4px",
                              whiteSpace: "nowrap",
                              padding: "0 6px",
                              transition: "all 0.15s ease",
                            }}
                            className="hover:brightness-110 active:scale-[0.98]"
                            title="Mark order as delivered & completed"
                          >
                            <CheckCircle2 size={13} style={{ flexShrink: 0 }} />
                            <span>Mark Delivered</span>
                          </button>
                        </>
                      )}
                    </div>

                    {/* ROW 2: Utility Toolbelt (Recreate, Cancel, Delete) */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          canCancelOrders
                            ? order.status !== "cancelled" && order.status !== "delivered"
                              ? "repeat(3, 1fr)"
                              : "repeat(2, 1fr)"
                            : order.status !== "cancelled" && order.status !== "delivered"
                            ? "repeat(2, 1fr)"
                            : "1fr",
                        gap: "5px",
                        width: "100%",
                      }}
                    >
                      {/* Recreate / Modify Order Button */}
                      <button
                        type="button"
                        onClick={() => setRecreatingOrder(order)}
                        style={{
                          height: "28px",
                          borderRadius: "5px",
                          background: "#fff7ed",
                          color: "#ea580c",
                          fontSize: "11px",
                          fontWeight: 700,
                          border: "1px solid #fed7aa",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                          whiteSpace: "nowrap",
                          padding: "0 4px",
                          transition: "all 0.15s ease",
                        }}
                        className="hover:bg-orange-100 hover:border-orange-300"
                        title="Recreate order (keep same Order ID, add burger/pizza, refresh time to now)"
                      >
                        <RefreshCw size={12} style={{ flexShrink: 0 }} />
                        <span>Recreate</span>
                      </button>

                      {/* Cancel Order Button */}
                      {order.status !== "cancelled" && order.status !== "delivered" && (
                        canCancelOrders ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Cancel order ${order.order_number}?`)) {
                                handleStatusChange(order.id, "cancelled");
                              }
                            }}
                            style={{
                              height: "28px",
                              borderRadius: "5px",
                              background: "#fef2f2",
                              color: "#dc2626",
                              fontSize: "11px",
                              fontWeight: 700,
                              border: "1px solid #fecaca",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "3px",
                              whiteSpace: "nowrap",
                              padding: "0 4px",
                              transition: "all 0.15s ease",
                            }}
                            className="hover:bg-red-100 hover:border-red-300"
                            title="Cancel this order"
                          >
                            <X size={12} style={{ flexShrink: 0 }} />
                            <span>Cancel</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            style={{
                              height: "28px",
                              borderRadius: "5px",
                              background: "#f8fafc",
                              color: "#94a3b8",
                              fontSize: "10.5px",
                              fontWeight: 600,
                              border: "1px solid #e2e8f0",
                              cursor: "not-allowed",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "3px",
                              whiteSpace: "nowrap",
                              padding: "0 3px",
                            }}
                            title="Cancellation restricted: Only Shop Admin can cancel orders"
                          >
                            <span>🔒 Cancel</span>
                          </button>
                        )
                      )}

                      {/* Delete / Remove Fake Order Button (Admin Only) */}
                      {canCancelOrders && (
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(order.id, order.order_number)}
                          style={{
                            height: "28px",
                            borderRadius: "5px",
                            background: "#fff1f2",
                            color: "#e11d48",
                            fontSize: "11px",
                            fontWeight: 700,
                            border: "1px solid #fecdd3",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "3px",
                            whiteSpace: "nowrap",
                            padding: "0 4px",
                            transition: "all 0.15s ease",
                          }}
                          className="hover:bg-rose-100 hover:border-rose-300"
                          title="Permanently remove / delete this fake or test order from database"
                        >
                          <Trash2 size={12} style={{ flexShrink: 0 }} />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* ─── ORDER RECREATE MODAL ───────────────────────────── */}
      <OrderRecreateModal
        isOpen={!!recreatingOrder}
        onClose={() => setRecreatingOrder(null)}
        order={recreatingOrder}
        currencySymbol={currencySymbol}
        shopId={shopId}
        initialProducts={availableProducts}
        onSuccess={(updatedOrder) => {
          setOrders((prev) => {
            const list = prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
            return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          });
          playPosOrderChime();
        }}
      />

      {/* ─── THERMAL DUAL PRINT MODAL (COUNTER RECEIPT + KITCHEN KOT) ── */}
      {printingOrder && (
        <ThermalDualPrintModal
          order={printingOrder}
          shopInfo={{
            name: shopName,
            address: shopAddress,
            phone: shopPhone,
            currencySymbol: currencySymbol,
          }}
          defaultTab={printTab}
          onOrderUpdated={(updated) => {
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
          }}
          onClose={() => setPrintingOrder(null)}
        />
      )}
    </div>
  );
}

