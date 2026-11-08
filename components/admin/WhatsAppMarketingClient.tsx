"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import type { MarketingCustomer, MarketingOverview, WhatsAppBotConfig } from "@/lib/marketing-actions";
import {
  sendMarketingWhatsAppMessage,
  saveWhatsAppBotConfig,
} from "@/lib/marketing-actions";
import {
  MessageSquare,
  Sparkles,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Check,
  ChevronRight,
  ExternalLink,
  ImageIcon,
  RefreshCw,
  Store,
  Flame,
  TicketPercent,
  Copy,
} from "@/components/admin/AdminIcons";

interface WhatsAppMarketingClientProps {
  overview: MarketingOverview;
  initialBotConfig: WhatsAppBotConfig;
  shopId: number | null;
}

type CustomerSegmentFilter = "all" | "inactive" | "vip" | "new";

interface SendLogItem {
  phone: string;
  customerName: string;
  status: "idle" | "waiting_delay" | "sending" | "sent" | "error";
  errorMsg?: string;
  timestamp?: string;
}

const PRESET_TEMPLATES = [
  {
    id: "winback",
    title: "🎯 Win-Back (20+ Days Inactive)",
    badge: "20+ Days Inactive",
    badgeColor: "#ea580c",
    text: `Salam {customer_name}! We miss you at {shop_name} 🍕.\n\nIt has been a while since your last pizza feast! As a special welcome back, here is an exclusive 20% discount code just for you:\n\n🎟️ Promo Code: *PIZZA20*\n\nOrder online now for oven-hot doorstep delivery:\n🔗 {menu_url}\n\nValid for the next 48 hours. See you soon!`,
  },
  {
    id: "deal",
    title: "🔥 Weekend Mega Combo Alert",
    badge: "New Deals",
    badgeColor: "#dc2626",
    text: `Salam {customer_name}! 🎉 Hot deal alert from {shop_name}!\n\nCraving fresh stone-baked pizza? Check out our newly launched Saver Combos with free drinks & dips.\n\nOrder fresh from the oven:\n🔗 {menu_url}\n\nReply "MENU" to see all today's active deals!`,
  },
  {
    id: "vip",
    title: "⭐ VIP Loyalty Reward",
    badge: "VIP Customers",
    badgeColor: "#7c3aed",
    text: `Salam {customer_name}! ⭐ As one of our most valued regular customers at {shop_name}, we appreciate your loyalty.\n\nEnjoy complimentary cheesy garlic bread on your next order today with code *VIPFREESHIP*!\n\nOrder here:\n🔗 {menu_url}\n\nThank you for choosing us!`,
  },
  {
    id: "custom",
    title: "✍️ Custom Announcement",
    badge: "Custom",
    badgeColor: "#2563eb",
    text: `Salam {customer_name}! Announcement from {shop_name}:\n\nWe have updated our special pizza menu with exciting new flavors and artisan crusts.\n\nVisit our live menu:\n🔗 {menu_url}`,
  },
];

export default function WhatsAppMarketingClient({
  overview,
  initialBotConfig,
  shopId,
}: WhatsAppMarketingClientProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"broadcast" | "bot_config">("broadcast");

  // Segment Filter & Search
  const [segmentFilter, setSegmentFilter] = useState<CustomerSegmentFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Customer Selection
  const [selectedPhones, setSelectedPhones] = useState<Set<string>>(new Set());

  // Message Composer
  const [selectedTemplateId, setSelectedTemplateId] = useState("winback");
  const [messageText, setMessageText] = useState(PRESET_TEMPLATES[0].text);
  const [dealImageUrl, setDealImageUrl] = useState<string>("");

  // Sender Queue State
  const [queueState, setQueueState] = useState<"idle" | "running" | "paused" | "completed" | "cancelled">("idle");
  const [currentSendingPhone, setCurrentSendingPhone] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
  const [sendLogs, setSendLogs] = useState<Record<string, SendLogItem>>({});

  // Bot Config State
  const [botConfig, setBotConfig] = useState<WhatsAppBotConfig>(initialBotConfig);
  const [savingBotConfig, setSavingBotConfig] = useState(false);
  const [botConfigSavedNotice, setBotConfigSavedNotice] = useState(false);
  const [botTestPhone, setBotTestPhone] = useState("");
  const [testingBot, setTestingBot] = useState(false);
  const [botTestResult, setBotTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Single test send modal
  const [testModalPhone, setTestModalPhone] = useState<string | null>(null);
  const [singleSending, setSingleSending] = useState(false);
  const [singleNotice, setSingleNotice] = useState<string | null>(null);

  const abortControllerRef = useRef<boolean>(false);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    let list = overview.customers;

    // Apply Segment Filter
    if (segmentFilter === "inactive") {
      list = list.filter((c) => c.daysSinceLastOrder >= 20);
    } else if (segmentFilter === "vip") {
      list = list.filter((c) => c.totalOrders >= 5);
    } else if (segmentFilter === "new") {
      list = list.filter((c) => c.totalOrders <= 1);
    }

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.customerName.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.deliveryAddress.toLowerCase().includes(q)
      );
    }

    return list;
  }, [overview.customers, segmentFilter, searchQuery]);

  // Handle template selection
  const handleTemplateChange = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = PRESET_TEMPLATES.find((t) => t.id === tplId);
    if (tpl) {
      setMessageText(tpl.text);
    }
    // Auto-select corresponding segment
    if (tplId === "winback") {
      setSegmentFilter("inactive");
    } else if (tplId === "vip") {
      setSegmentFilter("vip");
    }
  };

  // Toggle single customer selection
  const toggleSelectCustomer = (phone: string) => {
    setSelectedPhones((prev) => {
      const next = new Set(prev);
      if (next.has(phone)) {
        next.delete(phone);
      } else {
        next.add(phone);
      }
      return next;
    });
  };

  // Select all filtered customers
  const selectAllFiltered = () => {
    setSelectedPhones((prev) => {
      const next = new Set(prev);
      filteredCustomers.forEach((c) => next.add(c.phone));
      return next;
    });
  };

  // Deselect all
  const clearSelection = () => {
    setSelectedPhones(new Set());
  };

  // Quick: Select only 20+ Days Inactive
  const selectAllInactive = () => {
    setSegmentFilter("inactive");
    const inactives = overview.customers.filter((c) => c.daysSinceLastOrder >= 20);
    const newSet = new Set<string>();
    inactives.forEach((c) => newSet.add(c.phone));
    setSelectedPhones(newSet);
  };

  // Insert variable into composer
  const insertVariable = (varName: string) => {
    setMessageText((prev) => `${prev} ${varName} `);
  };

  // ─── 15-SECOND DELAY SAFE BROADCAST QUEUE RUNNER ───────────────────────────
  const startBroadcast = async () => {
    if (selectedPhones.size === 0) return;

    abortControllerRef.current = false;
    setQueueState("running");

    // Initialize logs
    const initialLogMap: Record<string, SendLogItem> = {};
    const selectedCustomers = overview.customers.filter((c) => selectedPhones.has(c.phone));

    selectedCustomers.forEach((c) => {
      initialLogMap[c.phone] = {
        phone: c.phone,
        customerName: c.customerName,
        status: "idle",
      };
    });
    setSendLogs(initialLogMap);

    for (let i = 0; i < selectedCustomers.length; i++) {
      if (abortControllerRef.current) {
        setQueueState("cancelled");
        break;
      }

      const customer = selectedCustomers[i];
      setCurrentSendingPhone(customer.phone);

      // Update status to sending
      setSendLogs((prev) => ({
        ...prev,
        [customer.phone]: {
          ...prev[customer.phone],
          status: "sending",
        },
      }));

      // Send WhatsApp message
      const res = await sendMarketingWhatsAppMessage({
        phone: customer.phone,
        customerName: customer.customerName,
        messageText,
        imageUrl: dealImageUrl || null,
        shopId,
      });

      // Update status to sent or error
      setSendLogs((prev) => ({
        ...prev,
        [customer.phone]: {
          ...prev[customer.phone],
          status: res.success ? "sent" : "error",
          errorMsg: res.error,
          timestamp: new Date().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" }),
        },
      }));

      // If more customers remain and not cancelled, enforce strict 15-second delay
      if (i < selectedCustomers.length - 1 && !abortControllerRef.current) {
        setSendLogs((prev) => {
          const nextCustomer = selectedCustomers[i + 1];
          return {
            ...prev,
            [nextCustomer.phone]: {
              ...prev[nextCustomer.phone],
              status: "waiting_delay",
            },
          };
        });

        // 15-second countdown ticker
        for (let sec = 15; sec > 0; sec--) {
          if (abortControllerRef.current) break;
          setCountdownSeconds(sec);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        setCountdownSeconds(0);
      }
    }

    if (!abortControllerRef.current) {
      setQueueState("completed");
      setCurrentSendingPhone(null);
    }
  };

  const cancelBroadcast = () => {
    abortControllerRef.current = true;
    setQueueState("cancelled");
    setCountdownSeconds(0);
    setCurrentSendingPhone(null);
  };

  // Single test send
  const handleSendSingleTest = async (cust: MarketingCustomer) => {
    setSingleSending(true);
    setSingleNotice(null);
    const res = await sendMarketingWhatsAppMessage({
      phone: cust.phone,
      customerName: cust.customerName,
      messageText,
      imageUrl: dealImageUrl || null,
      shopId,
    });
    setSingleSending(false);
    if (res.success) {
      setSingleNotice(`✅ Successfully sent to ${cust.customerName} (${cust.phone})!`);
      setTimeout(() => setSingleNotice(null), 4000);
    } else {
      setSingleNotice(`❌ Error: ${res.error || "Failed to send"}`);
    }
  };

  // Save Bot Auto-Reply Config
  const handleSaveBotConfig = async () => {
    setSavingBotConfig(true);
    const res = await saveWhatsAppBotConfig(botConfig, shopId);
    setSavingBotConfig(false);
    if (res.success) {
      setBotConfigSavedNotice(true);
      setTimeout(() => setBotConfigSavedNotice(false), 3500);
    } else {
      alert(res.error || "Failed to save configuration.");
    }
  };

  // Test Bot Greeting to Admin Number
  const handleTestBot = async () => {
    if (!botTestPhone.trim()) {
      alert("Please enter a phone number to test.");
      return;
    }
    setTestingBot(true);
    setBotTestResult(null);

    const res = await sendMarketingWhatsAppMessage({
      phone: botTestPhone,
      customerName: "Admin",
      messageText: botConfig.greetingText,
      imageUrl: null,
      shopId,
    });

    setTestingBot(false);
    if (res.success) {
      setBotTestResult({ success: true, msg: "Test message sent successfully to your WhatsApp!" });
    } else {
      setBotTestResult({ success: false, msg: res.error || "Failed to send test message." });
    }
  };

  // Quick stats computed
  const selectedCount = selectedPhones.size;
  const sentCount = Object.values(sendLogs).filter((l) => l.status === "sent").length;
  const errorCount = Object.values(sendLogs).filter((l) => l.status === "error").length;

  return (
    <div style={{ maxWidth: 1320, margin: "0 auto", paddingBottom: 60, fontFamily: "var(--font-poppins), system-ui, sans-serif" }}>
      {/* ─── TOP EXECUTIVE BANNER (Orange Bordered 5px Design) ─── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 5,
          border: "2px solid #ea580c",
          padding: "20px 24px",
          marginBottom: 24,
          boxShadow: "0 4px 16px rgba(234, 88, 12, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 5,
              background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(234, 88, 12, 0.35)",
              flexShrink: 0,
            }}
          >
            <MessageSquare size={24} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
                WhatsApp Marketing &amp; Re-Engagement Hub
              </h1>
              <span
                style={{
                  background: "#edfcf2",
                  color: "#059669",
                  border: "1px solid #a7f3d0",
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: 3,
                  textTransform: "uppercase",
                }}
              >
                15s Safe Delay Enabled
              </span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b", fontWeight: 500 }}>
              Re-engage inactive customers who haven&apos;t ordered in 20+ days, broadcast special deal posters, and configure interactive bot auto-replies.
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div style={{ display: "inline-flex", background: "#f1f5f9", padding: 3, borderRadius: 5, border: "1px solid #e2e8f0" }}>
          <button
            type="button"
            onClick={() => setActiveTab("broadcast")}
            style={{
              padding: "8px 16px",
              borderRadius: 4,
              border: "none",
              fontSize: 12.5,
              fontWeight: 800,
              cursor: "pointer",
              background: "#0f172a",
              color: "#ffffff",
              transition: "all 0.15s ease",
            }}
          >
            📢 Broadcast &amp; Win-Back
          </button>
        </div>
      </div>

      {activeTab === "broadcast" ? (
        <>
          {/* ─── 4 SUMMARY KPI CARDS (Segment Filter Triggers) ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Card 1: All Customers */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSegmentFilter("all")}
              style={{
                background: segmentFilter === "all" ? "#f8fafc" : "#ffffff",
                border: segmentFilter === "all" ? "2px solid #0f172a" : "1px solid #e2e8f0",
                borderRadius: 5,
                padding: "16px 18px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                transition: "all 0.15s ease",
              }}
              className="hover:shadow-md"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                  All CRM Contacts
                </span>
                <Users size={16} className="text-slate-500" />
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>
                {overview.totalCustomers.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, fontWeight: 600 }}>
                Total lifetime customers in database
              </div>
            </div>

            {/* Card 2: 20+ Days Inactive (WIN-BACK TARGET) */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSegmentFilter("inactive")}
              style={{
                background: segmentFilter === "inactive" ? "#fff7ed" : "#ffffff",
                border: segmentFilter === "inactive" ? "2px solid #ea580c" : "1.5px solid #fed7aa",
                borderRadius: 5,
                padding: "16px 18px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(234, 88, 12, 0.08)",
                transition: "all 0.15s ease",
              }}
              className="hover:shadow-md"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#c2410c", textTransform: "uppercase" }}>
                  ⚠️ Inactive (20+ Days)
                </span>
                <Flame size={16} className="text-orange-500" />
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#ea580c", marginTop: 4 }}>
                {overview.inactiveCount.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: "#c2410c", marginTop: 2, fontWeight: 700 }}>
                Ready for Win-Back Coupon (PIZZA20)
              </div>
            </div>

            {/* Card 3: VIP Customers */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSegmentFilter("vip")}
              style={{
                background: segmentFilter === "vip" ? "#faf5ff" : "#ffffff",
                border: segmentFilter === "vip" ? "2px solid #7c3aed" : "1px solid #e2e8f0",
                borderRadius: 5,
                padding: "16px 18px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                transition: "all 0.15s ease",
              }}
              className="hover:shadow-md"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#7c3aed", textTransform: "uppercase" }}>
                  ⭐ VIP Loyalty (5+ Orders)
                </span>
                <Sparkles size={16} className="text-purple-600" />
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#7c3aed", marginTop: 4 }}>
                {overview.vipCount.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: "#7c3aed", marginTop: 2, fontWeight: 600 }}>
                Top repeat spenders &amp; loyalists
              </div>
            </div>

            {/* Card 4: New Customers */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSegmentFilter("new")}
              style={{
                background: segmentFilter === "new" ? "#eff6ff" : "#ffffff",
                border: segmentFilter === "new" ? "2px solid #2563eb" : "1px solid #e2e8f0",
                borderRadius: 5,
                padding: "16px 18px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                transition: "all 0.15s ease",
              }}
              className="hover:shadow-md"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#2563eb", textTransform: "uppercase" }}>
                  ✨ New (1 Order)
                </span>
                <TicketPercent size={16} className="text-blue-600" />
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#2563eb", marginTop: 4 }}>
                {overview.newCount.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: "#2563eb", marginTop: 2, fontWeight: 600 }}>
                Ready for 2nd order welcome prompt
              </div>
            </div>
          </div>

          {/* ─── MAIN 2-COLUMN LAYOUT: Left (Message Composer) & Right (Customer Queue) ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            {/* ─── COLUMN 1: MESSAGE COMPOSER & POSTER ATTACHMENT (5 Cols) ─── */}
            <div className="lg:col-span-5" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 5,
                  border: "1px solid #e2e8f0",
                  padding: "20px",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                    1. Compose WhatsApp Message
                  </h2>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#ea580c", background: "#fff7ed", padding: "2px 8px", borderRadius: 3 }}>
                    Template
                  </span>
                </div>

                {/* Template Selector Pills */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  {PRESET_TEMPLATES.map((tpl) => {
                    const active = selectedTemplateId === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleTemplateChange(tpl.id)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 4,
                          fontSize: 11.5,
                          fontWeight: active ? 800 : 700,
                          cursor: "pointer",
                          border: active ? "1.5px solid #0f172a" : "1px solid #e2e8f0",
                          background: active ? "#0f172a" : "#f8fafc",
                          color: active ? "#ffffff" : "#475569",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {tpl.title}
                      </button>
                    );
                  })}
                </div>

                {/* Variable Pills */}
                <div style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>
                    Click to insert personalized variables:
                  </span>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[
                      { code: "{customer_name}", label: "👤 Customer Name" },
                      { code: "{shop_name}", label: "🍕 Shop Name" },
                      { code: "{discount_code}", label: "🎟️ Promo Code" },
                      { code: "{menu_url}", label: "🔗 Menu Link" },
                    ].map((v) => (
                      <button
                        key={v.code}
                        type="button"
                        onClick={() => insertVariable(v.code)}
                        style={{
                          padding: "3px 8px",
                          borderRadius: 3,
                          fontSize: 11,
                          fontWeight: 700,
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          color: "#1d4ed8",
                          cursor: "pointer",
                        }}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea */}
                <div style={{ marginBottom: 16 }}>
                  <textarea
                    rows={8}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Enter your WhatsApp message here..."
                    style={{
                      width: "100%",
                      borderRadius: 4,
                      border: "1.5px solid #cbd5e1",
                      padding: "12px",
                      fontSize: 13,
                      fontFamily: "monospace",
                      lineHeight: 1.5,
                      color: "#0f172a",
                      resize: "vertical",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Deal Image URL / Attachment */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                      <ImageIcon size={14} className="text-orange-600" />
                      <span>Deal Poster / Image URL (Optional):</span>
                    </label>
                    {dealImageUrl && (
                      <button
                        type="button"
                        onClick={() => setDealImageUrl("")}
                        style={{ fontSize: 11, color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    value={dealImageUrl}
                    onChange={(e) => setDealImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... or paste poster image link"
                    style={{
                      width: "100%",
                      borderRadius: 4,
                      border: "1px solid #cbd5e1",
                      padding: "9px 12px",
                      fontSize: 12,
                      outline: "none",
                    }}
                  />

                  {/* Preset Active Deals Picker */}
                  {overview.deals.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b" }}>
                        Or pick from today&apos;s active deal posters:
                      </span>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                        {overview.deals.map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => {
                              if (d.image_url) setDealImageUrl(d.image_url);
                              setMessageText(
                                `Salam {customer_name}! 🍕 Special Deal from {shop_name}:\n\n*${d.title}* — Rs. ${Number(d.deal_price).toLocaleString()}\n${d.description || ""}\n\nOrder online fresh from oven:\n🔗 {menu_url}`
                              );
                            }}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 3,
                              fontSize: 10.5,
                              fontWeight: 700,
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              color: "#0f172a",
                              cursor: "pointer",
                            }}
                          >
                            🎁 {d.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Image Live Preview */}
                  {dealImageUrl && (
                    <div
                      style={{
                        marginTop: 10,
                        height: 120,
                        borderRadius: 4,
                        border: "1px solid #e2e8f0",
                        overflow: "hidden",
                        position: "relative",
                        background: "#0f172a",
                      }}
                    >
                      <img
                        src={dealImageUrl}
                        alt="Deal Poster Preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          bottom: 4,
                          right: 6,
                          background: "rgba(0,0,0,0.65)",
                          color: "#ffffff",
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 2,
                        }}
                      >
                        Poster Attached
                      </div>
                    </div>
                  )}
                </div>

                {/* WhatsApp Chat Simulator Preview Box */}
                <div
                  style={{
                    background: "#0b141a",
                    borderRadius: 5,
                    padding: "16px",
                    color: "#ffffff",
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#8696a0", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                    Customer Phone Preview
                  </div>
                  <div
                    style={{
                      background: "#005c4b",
                      borderRadius: "7.5px 7.5px 0 7.5px",
                      padding: "10px 12px",
                      maxWidth: "92%",
                      fontSize: 12,
                      lineHeight: 1.45,
                      color: "#e9edef",
                      whiteSpace: "pre-wrap",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                      marginLeft: "auto",
                    }}
                  >
                    {dealImageUrl && (
                      <div style={{ marginBottom: 8, borderRadius: 4, overflow: "hidden", background: "#000000" }}>
                        <img src={dealImageUrl} alt="Poster" style={{ width: "100%", maxHeight: 140, objectFit: "cover" }} />
                      </div>
                    )}
                    {messageText
                      .replace(/{customer_name}/gi, "Muhammad Ali")
                      .replace(/{shop_name}/gi, overview.shopName)
                      .replace(/{menu_url}/gi, `https://.../${overview.shopSlug || ""}`)
                      .replace(/{discount_code}/gi, "PIZZA20")}
                    <div style={{ textAlign: "right", fontSize: 9.5, color: "#8696a0", marginTop: 4 }}>
                      12:00 PM ✓✓
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── COLUMN 2: CUSTOMER DIRECTORY & 15s SENDER QUEUE (7 Cols) ─── */}
            <div className="lg:col-span-7" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Broadcast Execution & Safety Control Panel */}
              <div
                style={{
                  background: queueState === "running" ? "#fff7ed" : "#ffffff",
                  borderRadius: 5,
                  border: queueState === "running" ? "2px solid #ea580c" : "1px solid #e2e8f0",
                  padding: "18px 20px",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                      2. Broadcast Control &amp; 15s Delay Queue
                    </h2>
                    <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                      {selectedCount} customer{selectedCount !== 1 ? "s" : ""} selected • Est. time: ~{Math.ceil((selectedCount * 15) / 60)} min
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {queueState === "idle" || queueState === "completed" || queueState === "cancelled" ? (
                      <button
                        type="button"
                        disabled={selectedCount === 0}
                        onClick={startBroadcast}
                        style={{
                          padding: "10px 18px",
                          borderRadius: 4,
                          background: selectedCount > 0 ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "#cbd5e1",
                          color: "#ffffff",
                          fontSize: 13,
                          fontWeight: 800,
                          border: "none",
                          cursor: selectedCount > 0 ? "pointer" : "not-allowed",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          boxShadow: selectedCount > 0 ? "0 4px 12px rgba(16, 185, 129, 0.35)" : "none",
                        }}
                      >
                        <span>🚀 Start Safe Broadcast ({selectedCount})</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={cancelBroadcast}
                        style={{
                          padding: "10px 18px",
                          borderRadius: 4,
                          background: "#dc2626",
                          color: "#ffffff",
                          fontSize: 13,
                          fontWeight: 800,
                          border: "none",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span>⏹️ Stop Broadcast</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Running Progress & 15-Second Countdown Banner */}
                {queueState === "running" && (
                  <div
                    style={{
                      marginTop: 14,
                      padding: "12px 16px",
                      borderRadius: 4,
                      background: "#ffffff",
                      border: "1.5px solid #fed7aa",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#ea580c" }}>
                        ⚡ Dispatching: {sentCount} sent, {errorCount} failed out of {selectedCount}
                      </span>
                      {countdownSeconds > 0 && (
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 900,
                            color: "#dc2626",
                            background: "#fee2e2",
                            padding: "2px 8px",
                            borderRadius: 3,
                          }}
                        >
                          ⏳ Waiting {countdownSeconds}s anti-ban delay...
                        </span>
                      )}
                    </div>
                    {/* Progress Bar */}
                    <div style={{ width: "100%", height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${selectedCount > 0 ? ((sentCount + errorCount) / selectedCount) * 100 : 0}%`,
                          background: "linear-gradient(90deg, #f59e0b, #10b981)",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                )}

                {queueState === "completed" && (
                  <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 4, background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", fontSize: 12.5, fontWeight: 700 }}>
                    🎉 Broadcast completed! {sentCount} messages successfully sent with 15-second anti-ban intervals.
                  </div>
                )}
              </div>

              {/* Customer Directory Table with Checkboxes */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 5,
                  border: "1px solid #e2e8f0",
                  padding: "16px 20px",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                }}
              >
                {/* Search Bar + Quick Selection Buttons */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 220 }}>
                    <div style={{ position: "relative", width: "100%" }}>
                      <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: "#94a3b8" }} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by customer name, phone, or address..."
                        style={{
                          width: "100%",
                          padding: "7px 10px 7px 32px",
                          borderRadius: 4,
                          border: "1px solid #cbd5e1",
                          fontSize: 12,
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      onClick={selectAllInactive}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 3,
                        background: "#fff7ed",
                        border: "1px solid #fed7aa",
                        color: "#ea580c",
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      🎯 Select All 20+ Days Inactive ({overview.inactiveCount})
                    </button>
                    <button
                      type="button"
                      onClick={selectAllFiltered}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 3,
                        background: "#f1f5f9",
                        border: "1px solid #cbd5e1",
                        color: "#0f172a",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Select All Filtered ({filteredCustomers.length})
                    </button>
                    {selectedPhones.size > 0 && (
                      <button
                        type="button"
                        onClick={clearSelection}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 3,
                          background: "#fee2e2",
                          border: "1px solid #fecaca",
                          color: "#dc2626",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {singleNotice && (
                  <div style={{ marginBottom: 10, padding: "8px 12px", borderRadius: 3, background: "#f8fafc", border: "1px solid #cbd5e1", fontSize: 12, fontWeight: 700 }}>
                    {singleNotice}
                  </div>
                )}

                {/* Table */}
                <div style={{ overflowX: "auto", maxHeight: 460, overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", textAlign: "left" }}>
                        <th style={{ padding: "8px 10px", width: 36 }}>
                          <input
                            type="checkbox"
                            checked={filteredCustomers.length > 0 && filteredCustomers.every((c) => selectedPhones.has(c.phone))}
                            onChange={(e) => {
                              if (e.target.checked) selectAllFiltered();
                              else clearSelection();
                            }}
                          />
                        </th>
                        <th style={{ padding: "8px 10px", color: "#475569", fontWeight: 800 }}>Customer Name</th>
                        <th style={{ padding: "8px 10px", color: "#475569", fontWeight: 800 }}>Phone</th>
                        <th style={{ padding: "8px 10px", color: "#475569", fontWeight: 800 }}>Orders / Spent</th>
                        <th style={{ padding: "8px 10px", color: "#475569", fontWeight: 800 }}>Last Order (Days Ago)</th>
                        <th style={{ padding: "8px 10px", color: "#475569", fontWeight: 800, textAlign: "right" }}>Queue Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: "30px 10px", textAlign: "center", color: "#94a3b8" }}>
                            No customers found in this segment.
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map((c) => {
                          const isSelected = selectedPhones.has(c.phone);
                          const log = sendLogs[c.phone];
                          const isInactive = c.daysSinceLastOrder >= 20;

                          return (
                            <tr
                              key={c.phone}
                              style={{
                                borderBottom: "1px solid #f1f5f9",
                                background: isSelected ? "rgba(234, 88, 12, 0.04)" : "#ffffff",
                              }}
                            >
                              <td style={{ padding: "8px 10px" }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectCustomer(c.phone)}
                                />
                              </td>
                              <td style={{ padding: "8px 10px", fontWeight: 700, color: "#0f172a" }}>
                                {c.customerName || "Customer"}
                                {c.totalOrders >= 5 && (
                                  <span style={{ marginLeft: 6, fontSize: 9.5, fontWeight: 900, color: "#7c3aed", background: "#f3e8ff", padding: "1px 5px", borderRadius: 2 }}>
                                    VIP
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: "8px 10px", fontFamily: "monospace", color: "#334155" }}>
                                {c.phone}
                              </td>
                              <td style={{ padding: "8px 10px", color: "#334155" }}>
                                <strong>{c.totalOrders}</strong> orders • Rs. {c.totalSpent.toLocaleString()}
                              </td>
                              <td style={{ padding: "8px 10px" }}>
                                {isInactive ? (
                                  <span style={{ fontSize: 11, fontWeight: 800, color: "#ea580c", background: "#fff7ed", padding: "2px 7px", borderRadius: 3, border: "1px solid #fed7aa" }}>
                                    ⚠️ {c.daysSinceLastOrder} days ago (Win-Back)
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 11, fontWeight: 600, color: "#059669" }}>
                                    {c.daysSinceLastOrder} days ago
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: "8px 10px", textAlign: "right" }}>
                                {log?.status === "sent" ? (
                                  <span style={{ fontSize: 11, fontWeight: 800, color: "#059669" }}>
                                    ✅ Sent ({log.timestamp})
                                  </span>
                                ) : log?.status === "error" ? (
                                  <span style={{ fontSize: 11, fontWeight: 800, color: "#dc2626" }} title={log.errorMsg}>
                                    ❌ Failed
                                  </span>
                                ) : log?.status === "sending" ? (
                                  <span style={{ fontSize: 11, fontWeight: 800, color: "#2563eb" }}>
                                    ⚡ Sending...
                                  </span>
                                ) : log?.status === "waiting_delay" ? (
                                  <span style={{ fontSize: 11, fontWeight: 700, color: "#ea580c" }}>
                                    ⏳ Waiting {countdownSeconds}s...
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={singleSending}
                                    onClick={() => handleSendSingleTest(c)}
                                    style={{
                                      padding: "3px 8px",
                                      borderRadius: 3,
                                      background: "#f1f5f9",
                                      border: "1px solid #cbd5e1",
                                      fontSize: 10.5,
                                      fontWeight: 700,
                                      color: "#0f172a",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Test Send
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ─── TAB 2: INTERACTIVE WHATSAPP BOT & AUTO-REPLY MENU CONFIGURATION ─── */
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div
            style={{
              background: "#ffffff",
              borderRadius: 5,
              border: "1px solid #e2e8f0",
              padding: "24px 28px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                  🤖 WhatsApp Interactive Menu &amp; Auto-Reply Bot
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                  When customer writes &quot;Hi&quot;, &quot;Menu&quot;, &quot;Salam&quot;, or &quot;Deals&quot; to your WhatsApp number, the bot automatically replies with your interactive digital menu and today&apos;s deals.
                </p>
              </div>

              {/* Master Toggle */}
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: botConfig.autoReplyEnabled ? "#059669" : "#64748b" }}>
                  {botConfig.autoReplyEnabled ? "Active ✓" : "Disabled"}
                </span>
                <input
                  type="checkbox"
                  checked={botConfig.autoReplyEnabled}
                  onChange={(e) => setBotConfig({ ...botConfig, autoReplyEnabled: e.target.checked })}
                  style={{ width: 20, height: 20, accentColor: "#10b981", cursor: "pointer" }}
                />
              </label>
            </div>

            {botConfigSavedNotice && (
              <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 4, background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", fontSize: 13, fontWeight: 700 }}>
                ✅ Bot auto-reply configuration saved successfully!
              </div>
            )}

            {/* Trigger Keywords */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
                Trigger Keywords (Comma-separated):
              </label>
              <input
                type="text"
                value={botConfig.triggerKeywords.join(", ")}
                onChange={(e) =>
                  setBotConfig({
                    ...botConfig,
                    triggerKeywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
                placeholder="hi, salam, menu, deals, offer, pizza, order"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 4,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <span style={{ fontSize: 11, color: "#64748b", marginTop: 4, display: "block" }}>
                When any incoming message contains one of these words, the bot will auto-reply immediately.
              </span>
            </div>

            {/* Auto-Reply Greeting Text */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
                Bot Auto-Reply Message:
              </label>
              <textarea
                rows={7}
                value={botConfig.greetingText}
                onChange={(e) => setBotConfig({ ...botConfig, greetingText: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 4,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  fontFamily: "monospace",
                  lineHeight: 1.5,
                  outline: "none",
                }}
              />
            </div>

            {/* Include Today's Top Deals Checkbox */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={botConfig.includeDeals}
                  onChange={(e) => setBotConfig({ ...botConfig, includeDeals: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: "#ea580c" }}
                />
                <div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", display: "block" }}>
                    Automatically append today&apos;s top active deals &amp; prices
                  </span>
                  <span style={{ fontSize: 11, color: "#64748b" }}>
                    Fetches real deals directly from your Deals manager and includes them at the bottom of the reply.
                  </span>
                </div>
              </label>
            </div>

            {/* Save Bot Settings Button */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
              <button
                type="button"
                disabled={savingBotConfig}
                onClick={handleSaveBotConfig}
                style={{
                  padding: "10px 20px",
                  borderRadius: 4,
                  background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 800,
                  border: "none",
                  cursor: savingBotConfig ? "wait" : "pointer",
                  boxShadow: "0 4px 12px rgba(234, 88, 12, 0.35)",
                }}
              >
                {savingBotConfig ? "Saving..." : "Save Bot Configuration"}
              </button>
            </div>
          </div>

          {/* Test Bot Message Box */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 5,
              border: "1px solid #e2e8f0",
              padding: "20px 24px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", margin: "0 0 8px" }}>
              📲 Test Interactive Bot Reply to Your WhatsApp
            </h3>
            <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "#64748b" }}>
              Enter your mobile number to test the exact automated bot greeting and live online menu link.
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                type="tel"
                value={botTestPhone}
                onChange={(e) => setBotTestPhone(e.target.value)}
                placeholder="e.g. 03331234567 or 923331234567"
                style={{
                  flex: 1,
                  minWidth: 220,
                  padding: "9px 12px",
                  borderRadius: 4,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <button
                type="button"
                disabled={testingBot}
                onClick={handleTestBot}
                style={{
                  padding: "9px 18px",
                  borderRadius: 4,
                  background: "#0f172a",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 800,
                  border: "none",
                  cursor: testingBot ? "wait" : "pointer",
                }}
              >
                {testingBot ? "Sending Test..." : "Send Test Auto-Reply"}
              </button>
            </div>

            {botTestResult && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 14px",
                  borderRadius: 4,
                  background: botTestResult.success ? "#ecfdf5" : "#fef2f2",
                  border: botTestResult.success ? "1px solid #a7f3d0" : "1px solid #fecaca",
                  color: botTestResult.success ? "#065f46" : "#dc2626",
                  fontSize: 12.5,
                  fontWeight: 700,
                }}
              >
                {botTestResult.msg}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
