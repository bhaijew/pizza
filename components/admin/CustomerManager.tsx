"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  MapPin,
  Phone,
  MessageSquare,
  Plus,
  Edit2,
  Trash2,
  ShoppingBag,
  Download,
  RefreshCw,
  Check,
  X,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  FileText,
} from "lucide-react";
import {
  CustomerRecord,
  upsertAdminCustomer,
  deleteAdminCustomer,
  syncAllOrdersToCustomers,
  fetchAdminCustomers,
} from "@/lib/customer-actions";

interface CustomerManagerProps {
  initialCustomers: CustomerRecord[];
  shopId?: number | null;
  shopName?: string;
}

export default function CustomerManager({
  initialCustomers,
  shopId,
  shopName = "Store",
}: CustomerManagerProps) {
  const [customers, setCustomers] = useState<CustomerRecord[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "with_address" | "repeat" | "recent">("all");
  const [syncing, setSyncing] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Add / Edit Modal State
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formPoints, setFormPoints] = useState("0");
  const [saving, setSaving] = useState(false);

  // Order History Modal State
  const [viewingCustomer, setViewingCustomer] = useState<CustomerRecord | null>(null);

  // Delete confirmation state
  const [deletingPhone, setDeletingPhone] = useState<string | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const refreshList = async () => {
    const fresh = await fetchAdminCustomers(shopId);
    setCustomers(fresh);
  };

  const handleSyncOrders = async () => {
    setSyncing(true);
    try {
      const res = await syncAllOrdersToCustomers(shopId);
      if (res.success) {
        await refreshList();
        showToast("success", `Synced ${res.syncedCount} customer records from orders!`);
      } else {
        showToast("error", res.error || "Failed to sync orders.");
      }
    } catch {
      showToast("error", "Error syncing customer records.");
    } finally {
      setSyncing(false);
    }
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormName("");
    setFormPhone("");
    setFormAddress("");
    setFormNotes("");
    setFormPoints("0");
    setIsAddModalOpen(true);
  };

  const openEditModal = (cust: CustomerRecord) => {
    setEditingCustomer(cust);
    setFormName(cust.customerName === "Valued Customer" ? "" : cust.customerName);
    setFormPhone(cust.phone);
    setFormAddress(cust.deliveryAddress || "");
    setFormNotes(cust.notes || "");
    setFormPoints(String(cust.pointsBalance || 0));
    setIsAddModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPhone.trim()) {
      showToast("error", "Customer phone number is required.");
      return;
    }

    setSaving(true);
    try {
      const res = await upsertAdminCustomer({
        phone: formPhone.trim(),
        originalPhone: editingCustomer?.phone,
        customerName: formName.trim() || "Valued Customer",
        deliveryAddress: formAddress.trim(),
        notes: formNotes.trim(),
        pointsBalance: parseInt(formPoints, 10) || 0,
        shopId,
      });

      if (res.success) {
        await refreshList();
        setIsAddModalOpen(false);
        showToast(
          "success",
          editingCustomer
            ? "Customer details updated across CRM & orders!"
            : "New customer saved to directory!"
        );
      } else {
        showToast("error", res.error || "Failed to save customer.");
      }
    } catch {
      showToast("error", "Unexpected error saving customer.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async (phone: string) => {
    setDeletingPhone(phone);
    try {
      const res = await deleteAdminCustomer(phone, shopId);
      if (res.success) {
        setCustomers((prev) => prev.filter((c) => c.phone !== phone));
        showToast("success", "Customer record removed.");
      } else {
        showToast("error", res.error || "Failed to delete customer.");
      }
    } catch {
      showToast("error", "Failed to delete customer.");
    } finally {
      setDeletingPhone(null);
    }
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const formatWhatsAppUrl = (phone: string, name: string) => {
    const digits = phone.replace(/\D/g, "");
    const intl = digits.startsWith("0") ? "92" + digits.slice(1) : digits;
    const greeting = encodeURIComponent(
      `Assalam-o-Alaikum ${name && name !== "Valued Customer" ? name : "Sir/Madam"}! Thank you for ordering from ${shopName}.`
    );
    return `https://wa.me/${intl}?text=${greeting}`;
  };

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return customers.filter((c) => {
      if (activeFilter === "with_address" && !c.deliveryAddress.trim()) return false;
      if (activeFilter === "repeat" && c.totalOrders < 2) return false;
      if (activeFilter === "recent") {
        if (!c.lastOrderAt) return false;
        if (new Date(c.lastOrderAt).getTime() < sevenDaysAgo) return false;
      }

      if (!q) return true;

      const matchName = c.customerName.toLowerCase().includes(q);
      const matchPhone = c.phone.toLowerCase().includes(q);
      const matchAddr =
        c.deliveryAddress.toLowerCase().includes(q) ||
        c.alternateAddresses.some((a) => a.toLowerCase().includes(q));
      const matchNotes = c.notes.toLowerCase().includes(q);
      const matchOrder = c.orders.some((o) => o.orderNumber.toLowerCase().includes(q));

      return matchName || matchPhone || matchAddr || matchNotes || matchOrder;
    });
  }, [customers, searchQuery, activeFilter]);

  // KPI metrics
  const stats = useMemo(() => {
    const total = customers.length;
    const withAddress = customers.filter((c) => Boolean(c.deliveryAddress?.trim())).length;
    const repeat = customers.filter((c) => c.totalOrders >= 2).length;
    const totalRevenue = customers.reduce((sum, c) => sum + (Number(c.totalSpent) || 0), 0);
    return { total, withAddress, repeat, totalRevenue };
  }, [customers]);

  const handleExportCSV = () => {
    const headers = [
      "Customer Name",
      "Phone Number",
      "Delivery Address",
      "Alternate Addresses",
      "Total Orders",
      "Total Spent (Rs)",
      "Loyalty Points",
      "Last Order #",
      "Last Order Date",
      "Notes",
    ];

    const escapeCsv = (val: string | number | null | undefined) => {
      const str = String(val ?? "").replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredCustomers.map((c) => [
      escapeCsv(c.customerName),
      escapeCsv(c.phone),
      escapeCsv(c.deliveryAddress),
      escapeCsv(c.alternateAddresses.join(" | ")),
      escapeCsv(c.totalOrders),
      escapeCsv(c.totalSpent),
      escapeCsv(c.pointsBalance),
      escapeCsv(c.lastOrderNumber || ""),
      escapeCsv(c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleString() : ""),
      escapeCsv(c.notes),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers_info_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold transition-all ${
            toast.type === "success"
              ? "bg-emerald-950/95 border-emerald-500/40 text-emerald-200"
              : "bg-red-950/95 border-red-500/40 text-red-200"
          }`}
        >
          {toast.type === "success" ? <Check size={16} className="text-emerald-400" /> : <X size={16} className="text-red-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white shadow-md shrink-0">
            <Users size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                Customer Info & CRM Directory
              </h1>
              <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                Auto-Synced with Orders
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Har order ka Customer Name, Phone Number aur Delivery Address yahan automatically save hota hai. Aap kisi bhi customer ka data edit ya add bhi kar sakte hain.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSyncOrders}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs sm:text-sm font-semibold transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={15} className={syncing ? "animate-spin text-orange-600" : "text-gray-500"} />
            <span>{syncing ? "Syncing..." : "Sync Past Orders"}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold transition cursor-pointer"
          >
            <Download size={15} className="text-gray-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Customers</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">Unique phone numbers saved</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Saved Addresses</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <MapPin size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">{stats.withAddress}</p>
          <p className="text-xs text-gray-500 mt-1">Delivery locations on file</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Repeat Buyers</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">{stats.repeat}</p>
          <p className="text-xs text-gray-500 mt-1">Ordered 2 or more times</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Customer Spend</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingBag size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">
            Rs. {stats.totalRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">Lifetime tracked order value</p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone (03XX...), delivery address, or order #..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all", label: `All (${customers.length})` },
            { id: "with_address", label: `With Address (${stats.withAddress})` },
            { id: "repeat", label: `Repeat (${stats.repeat})` },
            { id: "recent", label: "Last 7 Days" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                activeFilter === tab.id
                  ? "bg-gray-900 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <Users size={26} />
            </div>
            <h3 className="text-base font-bold text-gray-900">No customers found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              {searchQuery
                ? `No customer matched "${searchQuery}". Try another name, phone number, or address.`
                : "Customer details will appear here automatically as orders are placed, or click 'Add Customer' to add one manually."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Delivery Address</th>
                  <th className="py-3.5 px-4">Orders & Spend</th>
                  <th className="py-3.5 px-4">Last Order</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredCustomers.map((cust) => {
                  const initial = (cust.customerName || "C").trim().charAt(0).toUpperCase();
                  const isMissingName =
                    !cust.customerName ||
                    cust.customerName === "Valued Customer" ||
                    cust.customerName.toLowerCase() === "customer";

                  return (
                    <tr key={cust.phone} className="hover:bg-orange-50/30 transition-colors">
                      {/* 1. Customer Name */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                              isMissingName
                                ? "bg-gray-100 text-gray-600"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {initial}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`font-bold ${
                                  isMissingName ? "text-gray-500 italic" : "text-gray-900"
                                }`}
                              >
                                {isMissingName ? "Name Not Set" : cust.customerName}
                              </span>
                              {cust.totalOrders >= 2 && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full">
                                  Repeat ({cust.totalOrders}x)
                                </span>
                              )}
                            </div>
                            {cust.notes && (
                              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md mt-1 inline-block">
                                Note: {cust.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Phone Number + Quick Call / WhatsApp */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-gray-900 text-sm">
                              {cust.phone}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyPhone(cust.phone)}
                              title="Copy Phone Number"
                              className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                            >
                              {copiedPhone === cust.phone ? (
                                <Check size={13} className="text-emerald-600" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${cust.phone}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold transition"
                            >
                              <Phone size={11} />
                              <span>Call</span>
                            </a>
                            <a
                              href={formatWhatsAppUrl(cust.phone, cust.customerName)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold transition"
                            >
                              <MessageSquare size={11} />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* 3. Delivery Address */}
                      <td className="py-3.5 px-4 align-top max-w-xs">
                        {cust.deliveryAddress ? (
                          <div>
                            <div className="flex items-start gap-1.5 text-gray-800 font-medium text-xs sm:text-sm">
                              <MapPin size={14} className="text-orange-600 shrink-0 mt-0.5" />
                              <span className="break-words">{cust.deliveryAddress}</span>
                            </div>
                            {cust.alternateAddresses.length > 0 && (
                              <p className="text-[11px] text-gray-400 mt-1 pl-5">
                                Also ordered to: {cust.alternateAddresses.join("; ")}
                              </p>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openEditModal(cust)}
                            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-orange-600 italic transition cursor-pointer"
                          >
                            <MapPin size={12} />
                            <span>+ Add delivery address</span>
                          </button>
                        )}
                      </td>

                      {/* 4. Orders & Spend */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">
                              Rs. {cust.totalSpent.toLocaleString()}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-semibold">
                              {cust.totalOrders} {cust.totalOrders === 1 ? "order" : "orders"}
                            </span>
                          </div>
                          {cust.pointsBalance > 0 && (
                            <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                              <Sparkles size={12} />
                              <span>{cust.pointsBalance} Loyalty Pts</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 5. Last Order */}
                      <td className="py-3.5 px-4 align-top text-xs text-gray-600">
                        {cust.lastOrderAt ? (
                          <div>
                            {cust.lastOrderNumber && (
                              <span className="font-mono font-bold text-gray-800 block">
                                {cust.lastOrderNumber}
                              </span>
                            )}
                            <span className="text-gray-500">
                              {new Date(cust.lastOrderAt).toLocaleDateString("en-PK", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* 6. Actions */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingCustomer(cust)}
                            title="View Customer Orders"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition cursor-pointer"
                          >
                            <ShoppingBag size={13} />
                            <span className="hidden sm:inline">Orders ({cust.orders.length})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(cust)}
                            title="Edit Customer Name, Phone & Address"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition cursor-pointer"
                          >
                            <Edit2 size={13} />
                            <span className="hidden sm:inline">Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(cust.phone)}
                            disabled={deletingPhone === cust.phone}
                            title="Remove Customer Record"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    {editingCustomer ? "Edit Customer Info" : "Add New Customer"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Customer Name, Phone Number & Delivery Address
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/60"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Syed Zeeshan Haider / Raja Awais"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Phone / WhatsApp Number *
                </label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="e.g. 03334867615"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Delivery Address
                </label>
                <textarea
                  rows={2}
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="e.g. Near Gulzar-e-Rehmat Masjid, New Abadi Sohawa"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Loyalty Points Balance
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formPoints}
                    onChange={(e) => setFormPoints(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Customer Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g. VIP, Extra spicy, Landmark"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs sm:text-sm font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? <RefreshCw size={15} className="animate-spin" /> : <Check size={15} />}
                  <span>{saving ? "Saving..." : "Save Customer Info"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Order History Modal */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <span>{viewingCustomer.customerName}</span>
                  <span className="font-mono text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-md">
                    {viewingCustomer.phone}
                  </span>
                </h3>
                {viewingCustomer.deliveryAddress && (
                  <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                    <MapPin size={12} className="text-orange-600" />
                    <span>{viewingCustomer.deliveryAddress}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setViewingCustomer(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/60"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {viewingCustomer.orders.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No orders recorded for this customer yet.
                </p>
              ) : (
                viewingCustomer.orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="rounded-xl border border-gray-200 p-4 hover:border-orange-300 transition bg-gray-50/40"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-gray-900">
                          {ord.orderNumber}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-orange-100 text-orange-700">
                          {ord.orderType.replace("_", " ")}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-gray-200 text-gray-700">
                          {ord.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-sm text-gray-900">
                          Rs. {ord.total.toLocaleString()}
                        </span>
                        <span className="block text-[11px] text-gray-400">
                          {new Date(ord.createdAt).toLocaleString("en-PK", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {ord.deliveryAddress && (
                      <div className="mt-2 text-xs text-gray-600 flex items-center gap-1.5">
                        <MapPin size={12} className="text-orange-500 shrink-0" />
                        <span>Address: {ord.deliveryAddress}</span>
                      </div>
                    )}

                    {ord.items && ord.items.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {ord.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-xs text-gray-700 font-medium"
                          >
                            {item.qty}x {item.name}
                            {item.detail ? ` (${item.detail})` : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-600">
                Total Lifetime Spend: Rs. {viewingCustomer.totalSpent.toLocaleString()} ({viewingCustomer.totalOrders} orders)
              </span>
              <button
                type="button"
                onClick={() => {
                  const target = viewingCustomer;
                  setViewingCustomer(null);
                  openEditModal(target);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 cursor-pointer"
              >
                <Edit2 size={13} />
                <span>Edit Customer Info</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

