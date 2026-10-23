"use client";

import { useState, useTransition, useMemo } from "react";
import { Order } from "@/types/menu";
import { searchAdminOrders } from "@/lib/admin-actions";
import ThermalDualPrintModal from "@/components/admin/ThermalDualPrintModal";
import {
  Search,
  X,
  ExternalLink,
  Printer,
  Phone,
  MessageSquare,
  Clock,
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  CheckCircle2,
  Copy,
  Check,
  Receipt,
  FileText,
  MapPin,
  CreditCard,
  User,
} from "lucide-react";

interface OrderSearchLookupProps {
  initialOrders: Order[];
  currencySymbol: string;
  shopName: string;
  shopSlug?: string | null;
  shopId?: number | null;
  shopAddress?: string;
  shopPhone?: string;
}

export default function OrderSearchLookup({
  initialOrders,
  currencySymbol = "Rs.",
  shopName,
  shopSlug,
  shopId,
  shopAddress = "Food Street, Main Boulevard",
  shopPhone = "0300-1234567",
}: OrderSearchLookupProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(
    initialOrders.length > 0 ? initialOrders[0] : null
  );
  const [isSearching, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [printTab, setPrintTab] = useState<"counter" | "kitchen" | "dual">("counter");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Trigger search with server action
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    startTransition(async () => {
      const res = await searchAdminOrders(term);
      if (res.success && res.orders) {
        setOrders(res.orders as Order[]);
        // If results found and current selected not in results, select first
        if (res.orders.length > 0) {
          const stillThere = res.orders.find((o) => o.id === selectedOrder?.id);
          if (!stillThere) {
            setSelectedOrder(res.orders[0] as Order);
          }
        } else {
          setSelectedOrder(null);
        }
      }
    });
  };

  const handleQuickPrefix = (prefix: string) => {
    const next = prefix;
    handleSearch(next);
  };

  const handleClear = () => {
    setSearchTerm("");
    handleSearch("");
  };

  // Filter orders by status pill
  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  // Safe item parser
  const getOrderItems = (order: Order | null): any[] => {
    if (!order) return [];
    if (Array.isArray(order.items)) return order.items;
    if (typeof order.items === "string") {
      try {
        return JSON.parse(order.items);
      } catch {
        return [];
      }
    }
    return [];
  };

  // Helper to safely extract string variation label even if stored as object { id, name, price }
  const getVariationLabel = (item: any): string | null => {
    const raw = item?.selectedVariation || item?.selected_variation;
    if (!raw) return null;
    if (typeof raw === "string") return raw;
    if (typeof raw === "object") {
      return raw.name || raw.label || raw.title || null;
    }
    return String(raw);
  };

  // Helper to safely extract toppings names even if stored as objects
  const getToppingsList = (item: any): string[] => {
    const raw = item?.selectedToppings;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((t: any) => {
        if (!t) return "";
        if (typeof t === "string") return t;
        if (typeof t === "object") return t.name || t.label || "";
        return String(t);
      })
      .filter(Boolean);
  };

  const formatPKDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("en-PK", {
        timeZone: "Asia/Karachi",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
      case "completed":
        return { bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46", label: "Delivered" };
      case "preparing":
        return { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c", label: "Preparing" };
      case "confirmed":
        return { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", label: "Confirmed" };
      case "ready":
        return { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", label: "Ready" };
      case "cancelled":
        return { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", label: "Cancelled" };
      default:
        return { bg: "#fefce8", border: "#fef08a", text: "#854d0e", label: "Pending" };
    }
  };

  const getLiveBaseUrl = () => {
    if (typeof window !== "undefined" && !window.location.origin.includes("localhost") && !window.location.origin.includes("127.0.0.1")) {
      return window.location.origin;
    }
    return "https://pizza-murex-three.vercel.app";
  };

  const handleCopySummary = (order: Order) => {
    const items = getOrderItems(order);
    const liveBase = getLiveBaseUrl();
    const lines = [
      `🍕 *${shopName} — Order Invoice*`,
      `Order: #${order.order_number || order.id}`,
      `Date: ${formatPKDate(order.created_at)}`,
      `Customer: ${order.customer_name || "Valued Customer"} (${order.customer_phone || "N/A"})`,
      `Type: ${order.order_type?.toUpperCase() || "TAKEAWAY"}`,
      order.table_number ? `Table: #${order.table_number}` : null,
      order.token_number ? `Token: #${order.token_number}` : null,
      order.delivery_address ? `Address: ${order.delivery_address}` : null,
      `-----------------------------`,
      `*Items:*`,
      ...items.map((it: any) => {
        const v = getVariationLabel(it);
        const qty = it.quantity || it.qty || 1;
        const lineTotal = Number(it.price || 0) * Number(qty);
        return `- ${qty}x ${it.name} ${v ? `(${v})` : ""}: ${currencySymbol} ${lineTotal.toLocaleString()}`;
      }),
      `-----------------------------`,
      `*Total: ${currencySymbol} ${Number(order.total).toLocaleString()}*`,
      `Payment: ${order.payment_method?.toUpperCase() || "CASH"} (${order.payment_status?.toUpperCase() || "PAID"})`,
      `Track: ${liveBase}/track/${order.order_number}`,
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(lines);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleCopyTrackingLink = (order: Order) => {
    const liveBase = getLiveBaseUrl();
    const url = `${liveBase}/track/${order.order_number}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* ─── TOP HEADER ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-gray-200 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔍</span>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight uppercase">
              Finance & Order Lookup
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Search orders by order number (e.g. <span className="font-mono font-bold text-gray-700">ORD-</span>), customer phone, ID, or token to see full financial invoice details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-[5px]">
            Branch: {shopName}
          </span>
        </div>
      </div>

      {/* ─── SEARCH INPUT & FAST PREFIX PILLS ──────────────────── */}
      <div className="bg-white border border-gray-200 rounded-[5px] p-3.5 sm:p-4 shadow-sm space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search order number (e.g. ORD-5-003, ORD-, 003, phone, customer name...)"
            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-[5px] text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-red-500 focus:bg-white font-mono transition-colors"
            autoFocus
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-[5px]"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Quick Helper Chips */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-gray-500 font-medium mr-1">Quick Search:</span>
            <button
              type="button"
              onClick={() => handleQuickPrefix("ORD-")}
              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-[5px] font-mono font-bold transition-colors"
            >
              + ORD-
            </button>
            {shopId && (
              <button
                type="button"
                onClick={() => handleQuickPrefix(`ORD-${shopId}-`)}
                className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 rounded-[5px] font-mono font-bold transition-colors"
              >
                + ORD-{shopId}-
              </button>
            )}
            <button
              type="button"
              onClick={() => handleQuickPrefix("")}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-[5px] transition-colors"
            >
              Recent 30
            </button>
          </div>

          <div className="flex items-center gap-1 text-gray-500 font-medium">
            {isSearching ? (
              <span className="text-amber-600 font-semibold flex items-center gap-1">
                <span className="animate-spin inline-block w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full" />
                Searching...
              </span>
            ) : (
              <span>Found {filteredOrders.length} orders</span>
            )}
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-gray-100">
          {[
            { id: "all", label: "All Statuses" },
            { id: "confirmed", label: "Confirmed" },
            { id: "preparing", label: "Preparing" },
            { id: "ready", label: "Ready" },
            { id: "delivered", label: "Delivered" },
            { id: "cancelled", label: "Cancelled" },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setStatusFilter(pill.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-[5px] whitespace-nowrap transition-colors ${
                statusFilter === pill.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── MAIN CONTENT: SPLIT VIEW (LIST + DETAIL) ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Matching Orders List */}
        <div className="lg:col-span-5 space-y-2">
          {filteredOrders.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-[5px] p-8 text-center text-gray-500">
              <Search size={32} className="mx-auto text-gray-400 mb-2 opacity-60" />
              <p className="font-bold text-gray-700 text-sm">No Orders Found</p>
              <p className="text-xs text-gray-500 mt-1">
                Try searching with &quot;ORD-&quot; or another order number.
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isSelected = selectedOrder?.id === order.id;
              const statusBadge = getStatusColor(order.status);
              const items = getOrderItems(order);

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-3.5 rounded-[5px] border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-amber-50/60 border-amber-500 ring-1 ring-amber-400 shadow-sm"
                      : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/60 shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-gray-900">
                          #{order.order_number || order.id}
                        </span>
                        <span
                          style={{
                            backgroundColor: statusBadge.bg,
                            borderColor: statusBadge.border,
                            color: statusBadge.text,
                          }}
                          className="px-2 py-0.5 text-[10.5px] font-bold rounded-[5px] border uppercase tracking-wider"
                        >
                          {statusBadge.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 font-medium">
                        {order.customer_name || "Guest Customer"}
                        {order.customer_phone ? ` • ${order.customer_phone}` : ""}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-black text-sm text-gray-900">
                        {currencySymbol} {Number(order.total || 0).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-gray-500 capitalize">
                        {order.order_type || "Takeaway"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock size={11} className="text-gray-400" />
                      {formatPKDate(order.created_at)}
                    </span>
                    <span className="text-gray-400">
                      {items.length} {items.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Order Detail View ("see detail") */}
        <div className="lg:col-span-7">
          {selectedOrder ? (
            <div className="bg-white border border-gray-200 rounded-[5px] p-5 shadow-sm space-y-5">
              {/* Detail Header */}
              <div className="flex items-start justify-between pb-4 border-b border-gray-200 flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 font-mono tracking-tight">
                      #{selectedOrder.order_number || selectedOrder.id}
                    </h2>
                    {(() => {
                      const st = getStatusColor(selectedOrder.status);
                      return (
                        <span
                          style={{
                            backgroundColor: st.bg,
                            borderColor: st.border,
                            color: st.text,
                          }}
                          className="px-2.5 py-0.5 text-xs font-bold rounded-[5px] border uppercase tracking-wider"
                        >
                          {st.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                    <span>Database ID: #{selectedOrder.id}</span>
                    <span>•</span>
                    <span>Placed: {formatPKDate(selectedOrder.created_at)}</span>
                  </p>
                </div>

                {/* Print & Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPrintTab("counter");
                      setPrintingOrder(selectedOrder);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-[5px] flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Printer size={13} />
                    <span>Print Bill</span>
                  </button>
                  <a
                    href={`/track/${selectedOrder.order_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-[5px] flex items-center gap-1.5 transition-colors"
                    title="Open live customer track screen"
                  >
                    <ExternalLink size={13} />
                    <span>Live Track</span>
                  </a>
                </div>
              </div>

              {/* Order Meta Badges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 bg-gray-50 rounded-[5px] border border-gray-200">
                  <span className="text-gray-500 block text-[10.5px] uppercase font-bold tracking-wider">
                    Order Type
                  </span>
                  <span className="font-bold text-gray-900 capitalize flex items-center gap-1.5 mt-0.5">
                    {selectedOrder.order_type === "dine_in" ? (
                      <UtensilsCrossed size={12} className="text-amber-600" />
                    ) : selectedOrder.order_type === "delivery" ? (
                      <Bike size={12} className="text-blue-600" />
                    ) : (
                      <ShoppingBag size={12} className="text-emerald-600" />
                    )}
                    {selectedOrder.order_type || "Takeaway"}
                  </span>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-[5px] border border-gray-200">
                  <span className="text-gray-500 block text-[10.5px] uppercase font-bold tracking-wider">
                    Table / Token
                  </span>
                  <span className="font-bold text-gray-900 mt-0.5 block font-mono">
                    {selectedOrder.table_number
                      ? `Table #${selectedOrder.table_number}`
                      : selectedOrder.token_number
                      ? `Token #${selectedOrder.token_number}`
                      : "Counter Pick"}
                  </span>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-[5px] border border-gray-200">
                  <span className="text-gray-500 block text-[10.5px] uppercase font-bold tracking-wider">
                    Payment Method
                  </span>
                  <span className="font-bold text-gray-900 capitalize mt-0.5 block">
                    {selectedOrder.payment_method || "Cash on Delivery"}
                  </span>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-[5px] border border-gray-200">
                  <span className="text-gray-500 block text-[10.5px] uppercase font-bold tracking-wider">
                    Payment Status
                  </span>
                  <span
                    className={`font-bold mt-0.5 block capitalize ${
                      selectedOrder.payment_status === "paid" || selectedOrder.status === "delivered"
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
                  >
                    {selectedOrder.payment_status || "Paid / Handled"}
                  </span>
                </div>
              </div>

              {/* Customer & Delivery Card */}
              <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-[5px] text-xs space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <User size={13} className="text-slate-600" />
                    <span>Customer Details</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedOrder.customer_phone && (
                      <>
                        <a
                          href={`https://wa.me/${selectedOrder.customer_phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                            `Salam ${selectedOrder.customer_name || "Valued Customer"}! Regarding your ${shopName} order #${selectedOrder.order_number || selectedOrder.id}.\n\nTrack your order live here:\n${getLiveBaseUrl()}/track/${selectedOrder.order_number || selectedOrder.id}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[5px] font-bold text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <MessageSquare size={11} />
                          <span>WhatsApp</span>
                        </a>
                        <a
                          href={`tel:${selectedOrder.customer_phone}`}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-[5px] font-bold text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <Phone size={11} />
                          <span>Call</span>
                        </a>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 pt-1">
                  <div>
                    <span className="text-slate-500">Name: </span>
                    <strong className="text-slate-900">{selectedOrder.customer_name || "Walk-in Guest"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Phone: </span>
                    <strong className="text-slate-900 font-mono">
                      {selectedOrder.customer_phone || "Not specified"}
                    </strong>
                  </div>
                  {selectedOrder.delivery_address && (
                    <div className="sm:col-span-2 flex items-start gap-1">
                      <MapPin size={12} className="text-slate-500 mt-0.5 shrink-0" />
                      <span>{selectedOrder.delivery_address}</span>
                    </div>
                  )}
                  {selectedOrder.notes && (
                    <div className="sm:col-span-2 p-2 bg-amber-50/70 border border-amber-200/60 rounded-[5px] text-amber-900">
                      <strong>Notes: </strong>
                      <span>{selectedOrder.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Itemized Food Bill */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Ordered Items
                  </h3>
                  <span className="text-xs text-gray-500">
                    {getOrderItems(selectedOrder).length} products
                  </span>
                </div>

                <div className="border border-gray-200 rounded-[5px] overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                        <th className="py-2 px-3 text-left">Item</th>
                        <th className="py-2 px-3 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Price</th>
                        <th className="py-2 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {getOrderItems(selectedOrder).map((item: any, idx: number) => {
                        const qty = Number(item.quantity || item.qty || 1);
                        const price = Number(item.price || 0);
                        const lineTotal = qty * price;
                        const variationName = getVariationLabel(item);
                        const toppings = getToppingsList(item);

                        return (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="py-2 px-3">
                              <div className="font-bold text-gray-900">{item.name}</div>
                              {variationName && (
                                <div className="text-[11px] text-amber-800 font-medium">
                                  Size/Crust: {variationName}
                                </div>
                              )}
                              {toppings.length > 0 && (
                                <div className="text-[10.5px] text-gray-500">
                                  +{toppings.join(", ")}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-bold text-gray-800">
                              {qty}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-gray-600">
                              {currencySymbol} {price.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">
                              {currencySymbol} {lineTotal.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation Summary */}
              <div className="bg-slate-900 text-white p-4 rounded-[5px] space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Subtotal</span>
                  <span className="font-mono">
                    {currencySymbol}{" "}
                    {Number(
                      selectedOrder.subtotal || selectedOrder.total || 0
                    ).toLocaleString()}
                  </span>
                </div>

                {selectedOrder.discount ? (
                  <div className="flex justify-between text-xs text-emerald-400">
                    <span>Discount Applied</span>
                    <span className="font-mono">
                      -{currencySymbol} {Number(selectedOrder.discount).toLocaleString()}
                    </span>
                  </div>
                ) : null}

                {selectedOrder.delivery_fee ? (
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Delivery Fee</span>
                    <span className="font-mono">
                      +{currencySymbol} {Number(selectedOrder.delivery_fee).toLocaleString()}
                    </span>
                  </div>
                ) : null}

                <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                  <span className="font-bold text-sm uppercase tracking-wide">
                    Grand Total
                  </span>
                  <span className="text-xl font-black font-mono text-amber-400">
                    {currencySymbol} {Number(selectedOrder.total || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Footer Quick Utility Actions */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-gray-100 text-xs">
                <button
                  type="button"
                  onClick={() => handleCopySummary(selectedOrder)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-[5px] flex items-center gap-1.5 transition-colors"
                >
                  {copiedSummary ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copiedSummary ? "Copied Invoice!" : "Copy Order Summary"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyTrackingLink(selectedOrder)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-[5px] flex items-center gap-1.5 transition-colors"
                >
                  {copiedLink ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copiedLink ? "Link Copied!" : "Copy Track URL"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-[5px] p-12 text-center text-gray-400">
              <FileText size={36} className="mx-auto mb-2 opacity-50" />
              <p className="font-bold text-gray-700 text-sm">Select an order</p>
              <p className="text-xs text-gray-500 mt-1">
                Choose an order from the list on the left to see full details.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── THERMAL PRINTER DUAL MODAL ───────────────────────── */}
      {printingOrder && (
        <ThermalDualPrintModal
          order={printingOrder}
          onClose={() => setPrintingOrder(null)}
          shopInfo={{
            name: shopName,
            address: shopAddress,
            phone: shopPhone,
            currencySymbol: currencySymbol,
          }}
          defaultTab={printTab}
        />
      )}
    </div>
  );
}
