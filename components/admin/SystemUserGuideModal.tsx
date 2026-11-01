"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  X,
  Search,
  ShieldCheck,
  ChefHat,
  Bike,
  Boxes,
  Sliders,
  Laptop,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Store,
  Layers,
  FileText,
  MessageSquare,
  Clock,
} from "@/components/admin/AdminIcons";

const BookOpen = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);
const HelpCircle = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const DollarSign = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const RotateCcw = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);
const Printer = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);
const ArrowRight = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
const MapPin = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const Phone = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

interface SystemUserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopName?: string;
  currencySymbol?: string;
}

export default function SystemUserGuideModal({
  isOpen,
  onClose,
  shopName = "Sole What Pizza",
  currencySymbol = "Rs.",
}: SystemUserGuideModalProps) {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState<"both" | "urdu" | "english">("both");

  // Guide Topics Data
  const guideTopics = [
    {
      id: "overview",
      icon: Sparkles,
      title: "System Auto-Workflow",
      titleUrdu: "مکمل آٹو سسٹم کا طریقہ کار",
      tag: "CORE ARCHITECTURE",
      tagColor: "#8b5cf6",
      summary: "Understand how orders flow automatically from online menu to kitchen, slip printers, rider WhatsApp, and inventory deduction.",
      summaryUrdu: "آن لائن آرڈر سے لے کر کچن، پرنٹر سلپ، رائیڈر واٹس ایپ اور انوینٹری آٹو کٹوتی کا مکمل آٹومیٹڈ فلو سمجھیں۔",
      href: "/admin/orders",
      actionText: "Open Live Orders Board",
    },
    {
      id: "verify",
      icon: ShieldCheck,
      title: "Order Verification Terminal",
      titleUrdu: "آن لائن آرڈر ویریفائی ٹرمینل",
      tag: "FRAUD PREVENT",
      tagColor: "#f59e0b",
      summary: "Stop prank calls and wasted food. Review customer phone & address before releasing orders to the kitchen.",
      summaryUrdu: "جعلی آرڈرز اور را مٹیریل کے ضیاع سے بچاؤ۔ کچن میں بھیجنے سے پہلے کسٹمر کی تفصیلات چیک اور کنفرم کریں۔",
      href: "/admin/verify",
      actionText: "Open Verify Terminal",
    },
    {
      id: "orders",
      icon: Store,
      title: "Live POS Orders Board",
      titleUrdu: "لائیو پی او ایس آرڈرز بورڈ",
      tag: "FRONT COUNTER",
      tagColor: "#ef4444",
      summary: "Take dine-in, takeaway, and delivery orders. Track status, edit items, collect cash, and handle refunds.",
      summaryUrdu: "کاؤنٹر، ڈائن اِن، ٹیک اوے اور ڈلیوری آرڈرز لائیو لیں۔ پیمنٹ وصول کریں اور آرڈر اسٹیٹس تبدیل کریں۔",
      href: "/admin/orders",
      actionText: "Go to Live Orders",
    },
    {
      id: "kitchen",
      icon: ChefHat,
      title: "Kitchen Display Screen (KDS)",
      titleUrdu: "کچن ڈیجیٹل اسکرین (KDS)",
      tag: "PAPERLESS CHEF",
      tagColor: "#ea580c",
      summary: "Paperless kitchen display for chefs with audio alerts, prep timers, item notes, and 1-tap Ready bump.",
      summaryUrdu: "شیف کیلئے ڈیجیٹل اسکرین، آڈیو الرٹ، تیاری کا ٹائمر اور ریڈی کرنے کا ون ٹیپ بٹن۔",
      href: "/admin/kitchen",
      actionText: "Launch Kitchen KDS",
    },
    {
      id: "riders",
      icon: Bike,
      title: "Rider Dispatch & 1-Click WhatsApp",
      titleUrdu: "رائیڈر ڈسپیچ اور واٹس ایپ الرٹ",
      tag: "DELIVERY AUTOMATION",
      tagColor: "#10b981",
      summary: "Assign delivery boys, add/adjust delivery charges, and dispatch address & Google Map location via WhatsApp in 1 second.",
      summaryUrdu: "ڈلیوری بوائے منتخب کریں، ڈلیوری فیس ایڈجسٹ کریں اور ایک سیکنڈ میں واٹس ایپ پر کسٹمر لوکیشن اور بل بھیجیں۔",
      href: "/admin/riders",
      actionText: "Manage Delivery Riders",
    },
    {
      id: "printing",
      icon: Printer,
      title: "Thermal Receipts & KOT Dual Printing",
      titleUrdu: "تھرمل رسید اور کچن سلپ پرنٹنگ",
      tag: "DUAL ESC/POS",
      tagColor: "#0284c7",
      summary: "Print customer receipt on counter printer and KOT on kitchen printer. Supports 80mm & 58mm USB/LAN thermal printers.",
      summaryUrdu: "کاؤنٹر کیلئے کسٹمر بل اور کچن کیلئے KOT سلپ آٹو پرنٹنگ۔ 80mm اور 58mm ریسیٹ پرنٹرز کی مکمل سپورٹ۔",
      href: "/admin/orders",
      actionText: "Test Receipt Printing",
    },
    {
      id: "inventory",
      icon: Boxes,
      title: "Recipe Builder & Auto Stock BOM",
      titleUrdu: "ریسپی بلڈر اور آٹو اسٹاک کٹوتی (BOM)",
      tag: "AUTO DEDUCTION",
      tagColor: "#8b5cf6",
      summary: "Link cheese, dough, chicken, and boxes to menu items. Every time an order sells, stock automatically deducts!",
      summaryUrdu: "پیزا، برگر اور ڈیلز کے ساتھ چکن، چیز، آٹا اور ڈبہ لنک کریں۔ آرڈر بک ہوتے ہی کچا مال آٹو مائنس ہو جاتا ہے۔",
      href: "/admin/inventory?tab=recipes",
      actionText: "Open Recipe BOM Builder",
    },
    {
      id: "audit",
      icon: Sliders,
      title: "Chef Wastage & Theft Audit",
      titleUrdu: "کچن ضیاع اور چوری کی جانچ پڑتال",
      tag: "LOSS PREVENTION",
      tagColor: "#dc2626",
      summary: "Track burnt or expired food logs. Compare theoretical recipe consumption with actual kitchen stock to catch theft.",
      summaryUrdu: "جلی ہوئی یا ضائع خوراک کا اندراج۔ بکنگ کے مطابق اسٹاک اور موجود اسٹاک کا موازنہ کر کے چوری پکڑیں۔",
      href: "/admin/inventory?tab=audit",
      actionText: "View Stock Audit",
    },
    {
      id: "closing",
      icon: DollarSign,
      title: "Daily Register Shift Closing",
      titleUrdu: "روزانہ کاؤنٹر کلوزنگ اور زیڈ رپورٹ",
      tag: "CASH RECONCILIATION",
      tagColor: "#059669",
      summary: "End of day cash drawer audit. Reconcile cash, card, and online collections. Print permanent Z-Report.",
      summaryUrdu: "دن کے اختتام پر کیش دراز کی گنتی، کل آمدن، ڈلیوری فیس اور پرنٹ ہونے والی مکمل Z-رپورٹ۔",
      href: "/admin/closing",
      actionText: "Open Shift Closing",
    },
    {
      id: "flodesktop",
      icon: Laptop,
      title: "FloDesktop Windows POS App",
      titleUrdu: "فلو ڈیسک ٹاپ ونڈوز ایپ",
      tag: "OFFLINE RESILIENT",
      tagColor: "#4f46e5",
      summary: "Dedicated Windows POS app for cashiers with silent thermal printing, offline resilience, and auto-update.",
      summaryUrdu: "کاؤنٹر کیشئیر کیلئے فاسٹ ونڈوز ایپ، ڈائریکٹ سائلنٹ تھرمل پرنٹنگ اور بیک گراؤنڈ لائیو کلاؤڈ سنک۔",
      href: "/api/download-pos",
      actionText: "Download FloDesktop POS",
    },
    {
      id: "qr",
      icon: QrCode,
      title: "QR Table Ordering & Menu",
      titleUrdu: "کیو آر ٹیبل آرڈرنگ سسٹم",
      tag: "SELF SERVICE",
      tagColor: "#0ea5e9",
      summary: "Generate QR codes for restaurant dining tables. Customers scan with their phone camera to order food without waiting.",
      summaryUrdu: "ہر ٹیبل کیلئے منفرد کیو آر کوڈ۔ گاہک اپنے موبائل کیمرے سے اسکین کر کے ویٹر کا انتظار کیے بغیر آرڈر بھیجیں۔",
      href: "/admin/tables",
      actionText: "Manage Dine-In Tables",
    },
  ];

  // Filter topics by search query
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return guideTopics;
    const q = searchQuery.toLowerCase().trim();
    return guideTopics.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.titleUrdu.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.summaryUrdu.toLowerCase().includes(q) ||
        t.tag.toLowerCase().includes(q)
    );
  }, [guideTopics, searchQuery]);

  const currentTopic = guideTopics.find((t) => t.id === activeTab) || guideTopics[0];

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.72)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px 10px",
        fontFamily: "var(--font-poppins, system-ui, sans-serif)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Full Page Guide Modal Window */}
      <div
        style={{
          width: "calc(100vw - 16px)",
          maxWidth: "100%",
          height: "calc(100vh - 16px)",
          maxHeight: "100%",
          background: "#ffffff",
          borderRadius: "8px",
          border: "1px solid #cbd5e1",
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.4)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── MODAL HEADER ─── */}
        <div
          style={{
            padding: "14px 22px",
            background: "#090d16",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            borderBottom: "1px solid #1e293b",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "#1e293b",
                border: "1px solid #334155",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#f8fafc",
              }}
            >
              <BookOpen size={18} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, letterSpacing: "-0.2px", color: "#f8fafc" }}>
                  {shopName} Standard Operating Procedures
                </h2>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    background: "#1e293b",
                    color: "#94a3b8",
                    border: "1px solid #334155",
                    padding: "1px 6px",
                    borderRadius: "4px",
                    letterSpacing: "0.5px",
                  }}
                >
                  SYSTEM MANUAL
                </span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "#94a3b8" }}>
                Operational documentation for Cashiers, Kitchen Line, Riders & Inventory Management.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Search Box */}
            <div style={{ position: "relative", width: "220px" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                placeholder="Search manual (e.g. print, rider)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  height: "32px",
                  paddingLeft: "30px",
                  paddingRight: "10px",
                  borderRadius: "6px",
                  background: "#1e293b",
                  border: "1px solid #334155",
                  color: "#ffffff",
                  fontSize: "12px",
                  outline: "none",
                }}
              />
            </div>

            {/* Language Switcher */}
            <div style={{ display: "flex", background: "#1e293b", padding: "2px", borderRadius: "6px", border: "1px solid #334155" }}>
              <button
                type="button"
                onClick={() => setLanguage("both")}
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontWeight: 600,
                  border: "none",
                  borderRadius: "4px",
                  background: language === "both" ? "#334155" : "transparent",
                  color: language === "both" ? "#ffffff" : "#94a3b8",
                  cursor: "pointer",
                }}
              >
                Both (Eng + اردو)
              </button>
              <button
                type="button"
                onClick={() => setLanguage("urdu")}
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontWeight: 600,
                  border: "none",
                  borderRadius: "4px",
                  background: language === "urdu" ? "#334155" : "transparent",
                  color: language === "urdu" ? "#ffffff" : "#94a3b8",
                  cursor: "pointer",
                }}
              >
                اردو
              </button>
              <button
                type="button"
                onClick={() => setLanguage("english")}
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontWeight: 600,
                  border: "none",
                  borderRadius: "4px",
                  background: language === "english" ? "#334155" : "transparent",
                  color: language === "english" ? "#ffffff" : "#94a3b8",
                  cursor: "pointer",
                }}
              >
                English
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "#1e293b",
                border: "1px solid #334155",
                color: "#cbd5e1",
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              title="Close Guide (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ─── MODAL BODY: TWO COLUMN LAYOUT ─── */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "330px 1fr", minHeight: 0, overflow: "hidden" }}>
          {/* Left Column: Topics Navigation */}
          <div
            style={{
              background: "#f8fafc",
              borderRight: "1px solid #e2e8f0",
              overflowY: "auto",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
            className="admin-sidebar-scroll"
          >
            <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", padding: "4px 8px 6px" }}>
              Table of Contents ({filteredTopics.length})
            </div>

            {filteredTopics.map((topic) => {
              const isSelected = topic.id === activeTab;
              const IconComp = topic.icon;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setActiveTab(topic.id)}
                  style={{
                    textAlign: "left",
                    padding: "9px 12px",
                    borderRadius: "6px",
                    border: isSelected ? "1px solid #cbd5e1" : "1px solid transparent",
                    background: isSelected ? "#ffffff" : "transparent",
                    boxShadow: isSelected ? "0 1px 3px rgba(0,0,0,0.04)" : "none",
                    borderLeft: isSelected ? "3px solid #0f172a" : "3px solid transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    transition: "all 0.12s ease",
                  }}
                >
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "6px",
                      background: isSelected ? "#0f172a" : "#ffffff",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isSelected ? "#ffffff" : "#64748b",
                      flexShrink: 0,
                      marginTop: "1px",
                    }}
                  >
                    <IconComp size={15} />
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                      <span
                        style={{
                          fontSize: "8.5px",
                          fontWeight: 700,
                          padding: "1px 5px",
                          borderRadius: "3px",
                          background: "#f1f5f9",
                          color: "#475569",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {topic.tag}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? "#0f172a" : "#334155",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {topic.title}
                    </div>

                    <div
                      style={{
                        fontSize: "12.5px",
                        fontWeight: isSelected ? 600 : 500,
                        lineHeight: "1.5",
                        color: isSelected ? "#0f172a" : "#64748b",
                        direction: "rtl",
                        textAlign: "right",
                        marginTop: "2px",
                      }}
                    >
                      {topic.titleUrdu}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Detailed Topic Content */}
          <div
            style={{
              padding: "22px 28px",
              overflowY: "auto",
              background: "#ffffff",
            }}
            className="admin-sidebar-scroll"
          >
            {/* Topic Header Strip */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "14px",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "16px",
                marginBottom: "20px",
              }}
            >
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: "4px",
                      background: "#f1f5f9",
                      color: "#475569",
                      border: "1px solid #e2e8f0",
                      textTransform: "uppercase",
                    }}
                  >
                    {currentTopic.tag}
                  </span>
                </div>
                <h1 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.2px" }}>
                  {currentTopic.title}
                </h1>
                <div style={{ fontSize: "15px", color: "#475569", fontWeight: 600, direction: "rtl", textAlign: "left", lineHeight: "1.6" }}>
                  {currentTopic.titleUrdu}
                </div>
              </div>

              {/* Direct Link to that page in Admin */}
              <Link
                href={currentTopic.href}
                onClick={onClose}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#0f172a",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "8px 14px",
                  borderRadius: "6px",
                  textDecoration: "none",
                }}
              >
                <span>{currentTopic.actionText}</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* ─── TOPIC-SPECIFIC CONTENT ─── */}
            {activeTab === "overview" && (
              <OverviewGuideContent language={language} currencySymbol={currencySymbol} />
            )}
            {activeTab === "verify" && (
              <VerifyGuideContent language={language} currencySymbol={currencySymbol} />
            )}
            {activeTab === "orders" && (
              <OrdersGuideContent language={language} currencySymbol={currencySymbol} />
            )}
            {activeTab === "kitchen" && (
              <KitchenGuideContent language={language} currencySymbol={currencySymbol} />
            )}
            {activeTab === "riders" && (
              <RidersGuideContent language={language} currencySymbol={currencySymbol} />
            )}
            {activeTab === "printing" && (
              <PrintingGuideContent language={language} currencySymbol={currencySymbol} />
            )}
            {activeTab === "inventory" && (
              <InventoryGuideContent language={language} currencySymbol={currencySymbol} />
            )}
            {activeTab === "audit" && (
              <AuditGuideContent language={language} currencySymbol={currencySymbol} />
            )}
            {activeTab === "closing" && (
              <ClosingGuideContent language={language} currencySymbol={currencySymbol} />
            )}
            {activeTab === "flodesktop" && (
              <FloDesktopGuideContent language={language} currencySymbol={currencySymbol} />
            )}
            {activeTab === "qr" && (
              <QrGuideContent language={language} currencySymbol={currencySymbol} />
            )}
          </div>
        </div>

        {/* ─── MODAL FOOTER ─── */}
        <div
          style={{
            padding: "12px 24px",
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
            color: "#64748b",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
            <span>Sole What Automated Restaurant Ecosystem — Active & Synchronized</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>Need urgent tech support? WhatsApp: 0312-8314521</span>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                padding: "6px 14px",
                borderRadius: "5px",
                fontWeight: 700,
                fontSize: "12px",
                color: "#334155",
                cursor: "pointer",
              }}
            >
              Close Manual
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DETAILED CONTENT COMPONENTS FOR EACH TOPIC
// ─────────────────────────────────────────────────────────────────────────────

function SectionBox({
  title,
  titleUrdu,
  children,
  badge,
}: {
  title: string;
  titleUrdu?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
        padding: "18px 20px",
        marginBottom: "18px",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{title}</h3>
          {titleUrdu && (
            <div
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#475569",
                marginTop: "3px",
                direction: "rtl",
                textAlign: "left",
                lineHeight: "1.5",
              }}
            >
              {titleUrdu}
            </div>
          )}
        </div>
        {badge && (
          <span style={{ fontSize: "10px", fontWeight: 700, background: "#f1f5f9", color: "#475569", padding: "2px 7px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function StepRow({
  num,
  title,
  desc,
  descUrdu,
}: {
  num: number;
  title: string;
  desc: string;
  descUrdu: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "14px" }}>
      <div
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "6px",
          background: "#f1f5f9",
          border: "1px solid #cbd5e1",
          color: "#0f172a",
          fontWeight: 700,
          fontSize: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "2px",
        }}
      >
        {num}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a" }}>{title}</div>
        <p style={{ margin: "3px 0 6px", fontSize: "13px", color: "#475569", lineHeight: "1.55" }}>{desc}</p>
        <div
          style={{
            fontSize: "14px",
            color: "#1e293b",
            fontWeight: 600,
            direction: "rtl",
            textAlign: "right",
            lineHeight: "1.7",
            background: "#f8fafc",
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
          }}
        >
          {descUrdu}
        </div>
      </div>
    </div>
  );
}

// 1. Overview Guide Content
function OverviewGuideContent({ language, currencySymbol }: { language: string; currencySymbol: string }) {
  return (
    <div>
      {/* Clean Enterprise Workflow Pipeline */}
      <SectionBox title="End-to-End Restaurant Automation Workflow" titleUrdu="آٹو سسٹم کا مکمل لائیو سائیکل">
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
            {[
              { step: "01", name: "Order Capture", detail: "Online / QR / POS Counter" },
              { step: "02", name: "Verification", detail: "Fraud & Prank Filtering" },
              { step: "03", name: "Kitchen KDS", detail: "Chef Countdown Timer" },
              { step: "04", name: "Auto Print", detail: "Dual Counter & KOT Slips" },
              { step: "05", name: "BOM Depletion", detail: "Realtime Raw Material Minus" },
              { step: "06", name: "Rider Dispatch", detail: "1-Click WhatsApp & Maps" },
            ].map((s) => (
              <div
                key={s.step}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  padding: "10px 12px",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.5px" }}>
                  STEP {s.step}
                </div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginTop: "3px" }}>
                  {s.name}
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                  {s.detail}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.6", margin: "0 0 10px" }}>
          Sole What features a 100% interconnected real-time pipeline. Whether an order comes from the QR table sticker, customer mobile website, or cashier counter, the kitchen, printers, inventory stock, and riders are synchronized instantaneously.
        </p>
      </SectionBox>

      <SectionBox title="Core Operational Guidelines for Store Managers" titleUrdu="ایڈمن کیلئے بنیادی سنہری اصول">
        <StepRow
          num={1}
          title="Always Verify Online Orders First"
          desc="Never cook an online pizza before verifying it on /admin/verify. Verification ensures customer phone number is valid and address is reachable."
          descUrdu="آن لائن آرڈر کو ہمیشہ پہلے ویریفائی کریں۔ ویریفیکیشن سے جعلی کالز اور پیزا ضائع ہونے سے 100 فیصد بچاؤ ہوتا ہے۔"
        />
        <StepRow
          num={2}
          title="Keep FloDesktop Running for Silent Printing"
          desc="The FloDesktop Windows app prints thermal receipts in 0.5 seconds without opening Windows print dialog popups. Keep it open on counter PC."
          descUrdu="کاؤنٹر کمپیوٹر پر فلو ڈیسک ٹاپ ایپ اوپن رکھیں۔ یہ بنا کسی پاپ اپ کے خود بخود تھرمل سلپ پرنٹ کر دیتی ہے۔"
        />
        <StepRow
          num={3}
          title="Set Up Recipes (BOM) Once for Life"
          desc="In Recipe & Inventory, link raw materials (e.g. 0.5kg chicken, 100g cheese, 1 box) to each product. The system then automatically tracks kitchen stock."
          descUrdu="ریسپی بلڈر میں ہر پیزا کے ساتھ را مٹیریل لنک کر دیں۔ اس کے بعد ہر آرڈر بک ہوتے ہی اسٹاک خود بخود کم ہو جائے گا۔"
        />
        <StepRow
          num={4}
          title="Close Shift Daily on /admin/closing"
          desc="At night closing, audit the cash drawer and hit Close Shift. This locks daily sales records and prints the permanent Z-Report."
          descUrdu="رات کو دکان بند کرتے وقت رجسٹر کلوز کریں اور Z-رپورٹ نکالیں تا کہ کیش کی رقم 100 فیصد درست مل سکے۔"
        />
      </SectionBox>
    </div>
  );
}

// 2. Verify Guide Content
function VerifyGuideContent({ language, currencySymbol }: { language: string; currencySymbol: string }) {
  return (
    <div>
      <SectionBox title="Order Verification Workflow & Fraud Shield" titleUrdu="ویریفائی ٹرمینل کیوں ضروری ہے اور اسے کیسے چلائیں؟">
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0f172a", fontWeight: 700, fontSize: "12.5px" }}>
            <AlertTriangle size={15} style={{ color: "#ea580c" }} />
            <span>Problem Solved: Elimination of Prank Orders (مسئلہ جس کا حل ہے)</span>
          </div>
          <p style={{ margin: "5px 0 0", fontSize: "12px", color: "#475569", lineHeight: "1.5" }}>
            Prevents fake delivery requests and wrong phone numbers. By holding online orders in verification state before cooking, food, cheese, and delivery fuel wastage is eliminated completely.
          </p>
        </div>

        <StepRow
          num={1}
          title="Customer Places Order on Online Menu"
          desc="When an order is submitted online, it is placed in 'Pending Verification' state. It does NOT print on thermal printer yet and does NOT show on Kitchen KDS."
          descUrdu="جب گاہک آن لائن آرڈر کرتا ہے، تو یہ صرف ویریفائی پیج پر آتا ہے، کچن یا پرنٹر پر خود بخود نہیں جاتا۔"
        />
        <StepRow
          num={2}
          title="Call Customer via WhatsApp or Phone"
          desc="Click the WhatsApp or Call action on the card to confirm the order with customer: 'Assalam-o-Alaikum, are you confirming your order of 1 Large Pizza?'"
          descUrdu="کارڈ پر موجود واٹس ایپ یا کال بٹن دبا کر کسٹمر سے کنفرم کریں کہ کیا آپ نے ہی آرڈر کیا ہے۔"
        />
        <StepRow
          num={3}
          title="Click 'Verify & Print Slip'"
          desc="Once confirmed, click 'Verify & Send to Kitchen'. In 1 second: order pushes to Kitchen KDS, thermal printer prints customer bill, and order moves to Live Orders board!"
          descUrdu="کنفرم ہونے پر ویریفائی بٹن دبائیں۔ ایک سیکنڈ میں کچن اسکرین پر آرڈر چلا جائے گا اور تھرمل سلپ پرنٹ ہو جائے گی۔"
        />
        <StepRow
          num={4}
          title="Click 'Reject / Prank' if Fake"
          desc="If customer says 'I didn't order' or phone is switched off, click Reject. Select reason (Fake/Prank Call). Zero paper and zero food wasted!"
          descUrdu="اگر نمبر بند ہو یا کال جعلی ہو تو ریجیکٹ کر دیں۔ کوئی پیزا ضائع نہیں ہو گا۔"
        />
      </SectionBox>
    </div>
  );
}

// 3. Orders Guide Content
function OrdersGuideContent({ language, currencySymbol }: { language: string; currencySymbol: string }) {
  return (
    <div>
      <SectionBox title="Live Counter & POS Orders Board Management" titleUrdu="پی او ایس کاؤنٹر لائیو آرڈرز کنٹرول">
        <StepRow
          num={1}
          title="New Counter Order (Takeaway / Dine-in / Delivery)"
          desc="Click '+ New POS Order' button in header or open FloDesktop POS. Select items, size (Small, Medium, Large), toppings, and enter customer name & phone."
          descUrdu="نیو آرڈر بٹن دبائیں۔ پیزا یا برگر منتخب کریں، سائز چنیں اور کسٹمر کا نام اور موبائل نمبر لکھ کر سیو کریں۔"
        />
        <StepRow
          num={2}
          title="Changing Order Status (Pending -> Preparing -> Ready -> Delivered)"
          desc="Order cards have colored status dropdowns. Change status to keep front counter and delivery riders updated."
          descUrdu="آرڈر کا اسٹیٹس کچن میں تیاری کے ساتھ ساتھ تبدیل کریں۔ جب پیزا بیک ہو جائے تو اسٹیٹس ریڈی کر دیں۔"
        />
        <StepRow
          num={3}
          title="Delivery Fee Adjuster (Add / Change Fee)"
          desc="On delivery cards, click 'Add/Change Fee' to set delivery charges (e.g. Rs. 150). Total order bill automatically recalculates!"
          descUrdu="ڈلیوری کارڈ پر Add/Change Fee کلک کر کے ڈلیوری کے چارجز سیٹ کریں۔ بل میں خود بخود جمع ہو جائیں گے۔"
        />
        <StepRow
          num={4}
          title="Order Re-Print & Thermal Preview"
          desc="Click the printer icon on any order card at any time to re-print duplicate receipt or reprint Kitchen Order Ticket (KOT)."
          descUrdu="کسی بھی وقت سلپ دوبارہ نکالنے کیلئے پرنٹر آئیکن دبائیں۔"
        />
      </SectionBox>
    </div>
  );
}

// 4. Kitchen Guide Content
function KitchenGuideContent({ language, currencySymbol }: { language: string; currencySymbol: string }) {
  return (
    <div>
      <SectionBox title="Kitchen Display Screen (KDS) Chef Terminal" titleUrdu="شیف کیلئے کچن ڈیجیٹل اسکرین">
        <p style={{ fontSize: "12.5px", color: "#64748b", lineHeight: "1.6", marginBottom: "14px" }}>
          Access <code>/admin/kitchen</code> or <code>/kitchen</code> on a dedicated tablet or HDMI display placed above the prep line.
        </p>

        <StepRow
          num={1}
          title="Audio Chime on Incoming Orders"
          desc="Whenever a new order is verified or entered at the counter, the kitchen screen plays an ascending notification tone to alert prep staff."
          descUrdu="نیا آرڈر آتے ہی کچن میں لاؤڈ گھنٹی بجے گی تا کہ شیف کو پتہ چل سکے۔"
        />
        <StepRow
          num={2}
          title="Visual Preparation Countdown Timers"
          desc="Tickets have color-coded timer badges: Green (0-10 min), Yellow (10-20 min), and Red (Over 20 min) to prevent order delays."
          descUrdu="ٹکٹ پر ٹائمر چلتا ہے: 10 منٹ سے زیادہ ہونے پر پیلا اور 20 منٹ سے اوپر ہونے پر لال ہو جاتا ہے۔"
        />
        <StepRow
          num={3}
          title="Special Prep Notes Highlighted"
          desc="Crucial customer customizations like 'No Mayo', 'Extra Spicy', 'Less Cheese' are highlighted in prominent badges so chefs never miss modifications."
          descUrdu="گاہک کی خاص ہدایات (مثلاً زیادہ اسپائسی یا بغیر پیاز) نمایاں نظر آتی ہیں۔"
        />
        <StepRow
          num={4}
          title="One-Tap 'Bump to Ready'"
          desc="When the food item is boxed and ready, chef taps 'Mark as Ready'. Front desk cashiers and dispatch riders are instantly notified."
          descUrdu="جب کھانا اوون سے نکل آئے تو شیف 'ریڈی' بٹن دباتا ہے جس سے کاؤنٹر کو پتہ چل جاتا ہے کھانا تیار ہے۔"
        />
      </SectionBox>
    </div>
  );
}

// 5. Riders Guide Content
function RidersGuideContent({ language, currencySymbol }: { language: string; currencySymbol: string }) {
  return (
    <div>
      <SectionBox title="Rider Roster & WhatsApp Dispatch Engine" titleUrdu="ڈلیوری رائیڈر اور واٹس ایپ الرٹس">
        <StepRow
          num={1}
          title="Select Rider (Change / Assign Rider)"
          desc="On any delivery order card, click 'Pick Rider'. Select an active delivery boy from dropdown or click Round-Robin for fair order distribution."
          descUrdu="آرڈر کارڈ پر 'Pick Rider' کلک کر کے رائیڈر کا نام منتخب کریں۔"
        />
        <StepRow
          num={2}
          title="Click WhatsApp Action ('WA')"
          desc="Clicking the WhatsApp button opens WhatsApp with pre-formatted dispatch text: Order Number, Customer Name, Mobile Number, Delivery Address, Bill Amount, and clickable Google Map location link."
          descUrdu="سبز 'WA' بٹن دبانے سے رائیڈر کے واٹس ایپ پر کسٹمر کا ایڈریس، فون، گوگل میپ لوکیشن اور بل میسج چلا جاتا ہے۔"
        />
        <StepRow
          num={3}
          title="Manage Riders Roster (/admin/riders)"
          desc="Go to /admin/riders to add delivery personnel (Name, Phone, Bike Number, Active status). Monitor daily delivery counts per driver."
          descUrdu="رائیڈرز پیج پر جا کر نئے رائیڈرز ایڈ کریں اور دیکھیں کس رائیڈر نے آج کتنے آرڈر ڈلیور کیے۔"
        />
      </SectionBox>
    </div>
  );
}

// 6. Printing Guide Content
function PrintingGuideContent({ language, currencySymbol }: { language: string; currencySymbol: string }) {
  return (
    <div>
      <SectionBox title="Thermal Receipt & Kitchen KOT Dual Printing Engine" titleUrdu="تھرمل رسید اور کچن سلپ سیٹ اپ">
        <StepRow
          num={1}
          title="Dual Printing Architecture"
          desc="When an order is created: 1) Customer Receipt prints on counter printer with Shop Name, Bill, Payment Info, and Complaint WhatsApp. 2) Kitchen Order Ticket (KOT) prints only food items and prep notes for chef."
          descUrdu="کاؤنٹر پر کسٹمر کیلئے بل نکلتا ہے اور کچن میں صرف کھانے کی سلپ (KOT) نکلتی ہے۔"
        />
        <StepRow
          num={2}
          title="Setting Paper Size (80mm vs 58mm)"
          desc="In FloDesktop Settings or Admin Settings, choose 80mm (Standard 3-inch roll) or 58mm (Small 2-inch roll). The layout automatically adjusts font sizes and columns."
          descUrdu="سیٹنگز میں 80mm یا 58mm رول منتخب کریں۔ لے آؤٹ خود بخود فٹ ہو جائے گا۔"
        />
        <StepRow
          num={3}
          title="Silent Thermal Printing via FloDesktop"
          desc="To eliminate browser print popups, use FloDesktop app. It communicates directly with Rongta, Xprinter, Epson, and Black Copper printers via Windows Spooler."
          descUrdu="ونڈوز کے پرنٹ ڈائیلاگ سے بچنے کیلئے فلو ڈیسک ٹاپ ایپ استعمال کریں۔ یہ ڈائریکٹ سائلنٹ پرنٹ کرتی ہے۔"
        />
      </SectionBox>
    </div>
  );
}

// 7. Inventory Guide Content
function InventoryGuideContent({ language, currencySymbol }: { language: string; currencySymbol: string }) {
  return (
    <div>
      <SectionBox title="Recipe BOM Management & Automated Stock Depletion" titleUrdu="ریسپی بلڈر اور آٹو کٹوتی کا طریقہ">
        <StepRow
          num={1}
          title="Step 1: Check Raw Materials in Tab 1"
          desc="Go to /admin/inventory. Tab 1 displays all warehouse raw materials (Chicken Tikka, Cheese, Dough, Sauces, Boxes) with current stock levels."
          descUrdu="پہلے ٹیب 1 میں را مٹیریل دیکھیں۔ ہم نے چکن، چیز، آٹا، ساس اور ڈبے پہلے سے ایڈ کر دیے ہیں۔"
        />
        <StepRow
          num={2}
          title="Step 2: Select Menu Item in Tab 2 (Recipe BOM)"
          desc="Switch to Tab 2. In the list, search and click your target product (e.g. Crown Crust or Tikka Pizza). A clean 'BOM ✓' indicator confirms when recipe is configured."
          descUrdu="ٹیب 2 میں جا کر بائیں طرف سے پیزا سلیکٹ کریں۔ گرین 'BOM' بیج بتاتا ہے کہ ریسپی سیو ہے۔"
        />
        <StepRow
          num={3}
          title="Step 3: Auto-Fill Standard Recipe Formula"
          desc="Click the auto-fill pizza template button to populate standard baseline ingredients (dough, cheese, meat, sauce, box). Adjust exact grams as per kitchen standards."
          descUrdu="آٹو فل پیزا فارمولا کا بٹن دبائیں۔ چکن، چیز، ڈو اور ڈبہ خود بخود ایڈ ہو جائے گا۔"
        />
        <StepRow
          num={4}
          title="Step 4: Auto-Scale to All Sizes (Small, Medium, Large, XL)"
          desc="Clicking Auto-Scale computes proportional ingredient weights for all pizza variants simultaneously and persists all recipes in one click."
          descUrdu="آٹو اسکیل کا بٹن دبانے سے اسمال، میڈیم، لارج اور ایکسٹرا لارج کے تمام سائزز کی ریسپی ایک کلک پر سیو ہو جاتی ہے۔"
        />
        <StepRow
          num={5}
          title="Step 5: Automated Realtime Stock Depletion"
          desc="Every time an order is confirmed, the recipe engine decrements warehouse raw materials automatically. Manual stock tallying is completely eliminated."
          descUrdu="اب جب بھی پیزا بکے گا، چکن اور چیز خود بخود اسٹاک سے مائنس ہو جائیں گے۔ حساب کتاب کی فکر ختم!"
        />
      </SectionBox>
    </div>
  );
}

// 8. Audit Guide Content
function AuditGuideContent({ language, currencySymbol }: { language: string; currencySymbol: string }) {
  return (
    <div>
      <SectionBox title="Kitchen Wastage Logging & Variance Audit Controls" titleUrdu="کچن ضیاع اور چوری پکڑنے کا نظام">
        <StepRow
          num={1}
          title="Log Kitchen Wastage"
          desc="Under /admin/inventory -> Wastage tab, log burnt crusts or expired ingredients with quantity and reason to maintain food cost accuracy."
          descUrdu="اگر کچن میں کوئی پیزا جل جائے یا دودھ خراب ہو تو ویسٹیج لاگ میں درج کریں۔"
        />
        <StepRow
          num={2}
          title="Run Periodic Stock Audit"
          desc="At week or month close, record physical counted inventory in freezer. The system automatically benchmarks physical counts against theoretical sales consumption."
          descUrdu="مہینے کے اختتام پر فریزر میں موجود چکن اور چیز کی گنتی کر کے انٹر کریں۔"
        />
        <StepRow
          num={3}
          title="Variance & Theft Alerts"
          desc="If expected stock differs from physical inventory, the audit flags negative variances immediately to prevent untracked shrinkage."
          descUrdu="اگر سسٹم 25 کلو بتائے لیکن فریزر میں 18 کلو نکلے، تو سسٹم لال الرٹ دے گا کہ 7 کلو چکن غائب ہے۔"
        />
      </SectionBox>
    </div>
  );
}

// 9. Closing Guide Content
function ClosingGuideContent({ language, currencySymbol }: { language: string; currencySymbol: string }) {
  return (
    <div>
      <SectionBox title="Shift Register Reconciliation & Z-Report" titleUrdu="روزانہ شفٹ کلوزنگ اور زیڈ رپورٹ">
        <StepRow
          num={1}
          title="Open /admin/closing at End of Day"
          desc="At shift termination, access Register Closing. The screen displays total cash sales, card payments, online collections, and delivery surcharges."
          descUrdu="رات کو کاؤنٹر کلوزنگ پیج کھولیں۔ آج کا کل کیش، کارڈ اور ڈلیوری فیس کا ٹوٹل نظر آئے گا۔"
        />
        <StepRow
          num={2}
          title="Count Physical Cash in Drawer"
          desc="Count physical currency in register till and enter sum into 'Actual Cash in Drawer' field. System flags surplus or shortage immediately."
          descUrdu="دراز میں موجود نوٹ گن کر انٹر کریں۔ سسٹم بتائے گا کیش برابر ہے یا شارٹ۔"
        />
        <StepRow
          num={3}
          title="Finalize Shift & Print Permanent Z-Report"
          desc="Closing the shift locks daily sales transactions and dispatches the immutable Z-Report to the thermal printer."
          descUrdu="کلوز شفٹ دبانے سے دن کا ریکارڈ لاک ہو جائے گا اور پرنٹر سے مکمل Z-رپورٹ نکل آئے گی۔"
        />
      </SectionBox>
    </div>
  );
}

// 10. FloDesktop Guide Content
function FloDesktopGuideContent({ language, currencySymbol }: { language: string; currencySymbol: string }) {
  return (
    <div>
      <SectionBox title="FloDesktop Native Windows POS Architecture" titleUrdu="فلو ڈیسک ٹاپ ونڈوز پی او ایس ایپ">
        <StepRow
          num={1}
          title="Dedicated Front-Counter Performance"
          desc="FloDesktop delivers zero-latency silent thermal printing via Windows Spooler without browser dialog interruptions and provides offline caching."
          descUrdu="ڈیسک ٹاپ ایپ کاؤنٹر کیلئے ہے: بنا کسی رکاوٹ کے پرنٹنگ، تیز رفتار اور انٹرنیٹ منقطع ہونے پر بھی کام۔"
        />
        <StepRow
          num={2}
          title="Realtime Cloud Synchronization"
          desc="Orders entered on FloDesktop instantly populate the Web Admin and Kitchen KDS. Online customer orders verified on web admin sync back to desktop immediately."
          descUrdu="ڈیسک ٹاپ ایپ اور ویب ایڈمن ہر سیکنڈ ایک دوسرے کے ساتھ سنک رہتے ہیں۔"
        />
        <StepRow
          num={3}
          title="Seamless Background Upgrades"
          desc="New features and software improvements download in the background and reload rapidly with zero cashier friction."
          descUrdu="نئی اپ ڈیٹ خود بخود بیک گراؤنڈ میں ڈاؤن لوڈ ہو کر 2 سیکنڈ میں ری اسٹارٹ ہو جاتی ہے۔"
        />
      </SectionBox>
    </div>
  );
}

// 11. QR Guide Content
function QrGuideContent({ language, currencySymbol }: { language: string; currencySymbol: string }) {
  return (
    <div>
      <SectionBox title="Dine-In Table QR Code Ordering System" titleUrdu="کیو آر ٹیبل آرڈرنگ سسٹم">
        <StepRow
          num={1}
          title="Generate Table QR Codes (/admin/tables)"
          desc="Under /admin/tables, create dining sections (Table 1, Table 2, Family Cabins). Click 'Print QR' to generate table stickers."
          descUrdu="ٹیبلز پیج پر جا کر ٹیبلز بنائیں اور ان کے کیو آر کوڈز پرنٹ کر کے میزوں پر چپکائیں۔"
        />
        <StepRow
          num={2}
          title="Guests Scan with Smartphone Camera"
          desc="Guests scan the table QR code with iOS or Android camera to browse the live storefront menu without installing an app."
          descUrdu="گاہک موبائل کیمرے سے اسکین کرتے ہیں تو بغیر کوئی ایپ ڈاؤن لوڈ کیے مینو کھل جاتا ہے۔"
        />
        <StepRow
          num={3}
          title="Order Ingestion with Table Token"
          desc="Orders arrive on counter terminal with table attribution (e.g. Table 4 | Token TK-02) for swift verification and kitchen routing."
          descUrdu="آرڈر ٹیبل نمبر کے ساتھ ایڈمن پر آ جاتا ہے تا کہ کھانا سیدھا اسی ٹیبل پر سرو کیا جا سکے۔"
        />
      </SectionBox>
    </div>
  );
}

