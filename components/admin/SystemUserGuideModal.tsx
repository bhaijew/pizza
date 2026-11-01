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
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "14px 16px",
        fontFamily: "var(--font-poppins, system-ui, sans-serif)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Full Page Guide Modal Window */}
      <div
        style={{
          width: "calc(100vw - 32px)",
          maxWidth: "calc(100vw - 32px)",
          height: "calc(100vh - 28px)",
          maxHeight: "calc(100vh - 28px)",
          background: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #cbd5e1",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.45)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── MODAL HEADER ─── */}
        <div
          style={{
            padding: "16px 24px",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
            borderBottom: "1px solid #334155",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.35)",
              }}
            >
              <BookOpen size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 900, letterSpacing: "-0.3px" }}>
                  {shopName} — Operations & Features User Manual
                </h2>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    background: "rgba(245, 158, 11, 0.2)",
                    color: "#fbbf24",
                    border: "1px solid rgba(245, 158, 11, 0.4)",
                    padding: "2px 8px",
                    borderRadius: "4px",
                  }}
                >
                  SYSTEM GUIDE v2.0
                </span>
              </div>
              <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                Complete step-by-step master guide for Cashiers, Managers, Kitchen Chefs, and Delivery Dispatchers.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Search Box */}
            <div style={{ position: "relative", width: "220px" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="Search guide (e.g. print, rider)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  height: "34px",
                  paddingLeft: "30px",
                  paddingRight: "10px",
                  borderRadius: "6px",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#ffffff",
                  fontSize: "12px",
                  outline: "none",
                }}
              />
            </div>

            {/* Language Switcher */}
            <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.08)", padding: "2px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.15)" }}>
              <button
                type="button"
                onClick={() => setLanguage("both")}
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  border: "none",
                  borderRadius: "4px",
                  background: language === "both" ? "#ef4444" : "transparent",
                  color: "#ffffff",
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
                  fontWeight: 700,
                  border: "none",
                  borderRadius: "4px",
                  background: language === "urdu" ? "#ef4444" : "transparent",
                  color: "#ffffff",
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
                  fontWeight: 700,
                  border: "none",
                  borderRadius: "4px",
                  background: language === "english" ? "#ef4444" : "transparent",
                  color: "#ffffff",
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
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                width: "34px",
                height: "34px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              title="Close Guide (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ─── MODAL BODY: TWO COLUMN LAYOUT ─── */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "340px 1fr", minHeight: 0, overflow: "hidden" }}>
          {/* Left Column: Topics Navigation */}
          <div
            style={{
              background: "#f8fafc",
              borderRight: "1px solid #e2e8f0",
              overflowY: "auto",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
            className="admin-sidebar-scroll"
          >
            <div style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", padding: "4px 8px 6px" }}>
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
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: isSelected ? "1.5px solid #ef4444" : "1px solid transparent",
                    background: isSelected ? "#ffffff" : "transparent",
                    boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "6px",
                      background: isSelected ? "#fef2f2" : "#ffffff",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isSelected ? "#ef4444" : "#64748b",
                      flexShrink: 0,
                      marginTop: "1px",
                    }}
                  >
                    <IconComp size={16} />
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                      <span
                        style={{
                          fontSize: "8.5px",
                          fontWeight: 800,
                          padding: "1px 5px",
                          borderRadius: "3px",
                          background: `${topic.tagColor}15`,
                          color: topic.tagColor,
                          border: `1px solid ${topic.tagColor}30`,
                        }}
                      >
                        {topic.tag}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: isSelected ? 800 : 600,
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
                        fontSize: "13.5px",
                        fontWeight: 800,
                        lineHeight: "1.5",
                        color: isSelected ? "#dc2626" : "#475569",
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
              padding: "24px 32px",
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
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: "18px",
                marginBottom: "24px",
              }}
            >
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: `${currentTopic.tagColor}15`,
                      color: currentTopic.tagColor,
                      border: `1px solid ${currentTopic.tagColor}35`,
                      textTransform: "uppercase",
                    }}
                  >
                    {currentTopic.tag}
                  </span>
                </div>
                <h1 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: 900, color: "#0f172a" }}>
                  {currentTopic.title}
                </h1>
                <div style={{ fontSize: "19px", color: "#dc2626", fontWeight: 800, direction: "rtl", textAlign: "left", lineHeight: "1.6" }}>
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
                  gap: "8px",
                  background: "#0f172a",
                  color: "#ffffff",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  padding: "9px 16px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  boxShadow: "0 2px 6px rgba(15, 23, 42, 0.2)",
                }}
              >
                <span>{currentTopic.actionText}</span>
                <ArrowRight size={14} />
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
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        padding: "20px 22px",
        marginBottom: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "16.5px", fontWeight: 800, color: "#0f172a" }}>{title}</h3>
          {titleUrdu && (
            <div
              style={{
                fontSize: "16px",
                fontWeight: 800,
                color: "#dc2626",
                marginTop: "4px",
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
          <span style={{ fontSize: "10px", fontWeight: 800, background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: "4px" }}>
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
    <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "16px" }}>
      <div
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: "#ef4444",
          color: "#ffffff",
          fontWeight: 800,
          fontSize: "13px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "2px",
          boxShadow: "0 2px 5px rgba(239, 68, 68, 0.3)",
        }}
      >
        {num}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>{title}</div>
        <p style={{ margin: "3px 0 6px", fontSize: "13px", color: "#475569", lineHeight: "1.55" }}>{desc}</p>
        <div
          style={{
            fontSize: "15px",
            color: "#065f46",
            fontWeight: 800,
            direction: "rtl",
            textAlign: "right",
            lineHeight: "1.75",
            background: "#ecfdf5",
            padding: "8px 14px",
            borderRadius: "6px",
            borderRight: "4px solid #10b981",
            border: "1px solid #d1fae5",
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
      {/* Visual Workflow Architecture Diagram */}
      <SectionBox title="🚀 Complete End-to-End Restaurant Automation Workflow" titleUrdu="آٹو سسٹم کا مکمل لائیو سائیکل">
        <div
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#ffffff",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "12px" }}>
              <div style={{ fontSize: "11px", color: "#fbbf24", fontWeight: 800 }}>STEP 1: ORDER ENTRY</div>
              <div style={{ fontSize: "14px", fontWeight: 800, marginTop: "4px" }}>Online / QR / POS</div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Customer or Counter</div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "12px" }}>
              <div style={{ fontSize: "11px", color: "#38bdf8", fontWeight: 800 }}>STEP 2: VERIFICATION</div>
              <div style={{ fontSize: "14px", fontWeight: 800, marginTop: "4px" }}>Fraud Check</div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Prevents fake prank orders</div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "12px" }}>
              <div style={{ fontSize: "11px", color: "#ea580c", fontWeight: 800 }}>STEP 3: KITCHEN KDS</div>
              <div style={{ fontSize: "14px", fontWeight: 800, marginTop: "4px" }}>Chefs Cooking</div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Live countdown timer</div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "12px" }}>
              <div style={{ fontSize: "11px", color: "#34d399", fontWeight: 800 }}>STEP 4: AUTO PRINT</div>
              <div style={{ fontSize: "14px", fontWeight: 800, marginTop: "4px" }}>Dual Thermal Slips</div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Counter + Kitchen KOT</div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "12px" }}>
              <div style={{ fontSize: "11px", color: "#a855f7", fontWeight: 800 }}>STEP 5: BOM DEDUCT</div>
              <div style={{ fontSize: "14px", fontWeight: 800, marginTop: "4px" }}>Auto Raw Materials</div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Meat, cheese, boxes minus</div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "12px" }}>
              <div style={{ fontSize: "11px", color: "#10b981", fontWeight: 800 }}>STEP 6: DISPATCH</div>
              <div style={{ fontSize: "14px", fontWeight: 800, marginTop: "4px" }}>Rider WhatsApp</div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Map & Contact via WA</div>
            </div>
          </div>
        </div>

        <p style={{ fontSize: "13px", color: "#334155", lineHeight: "1.6" }}>
          Sole What features a 100% interconnected real-time pipeline. Whether an order comes from the QR table sticker, customer mobile website, or cashier counter, the kitchen, printers, inventory stock, and riders are synchronized instantaneously.
        </p>
      </SectionBox>

      <SectionBox title="📌 4 Core Golden Rules for Every Restaurant Admin" titleUrdu="ایڈمن کیلئے 4 بنیادی سنہری اصول">
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
      <SectionBox title="🛡️ Why Order Verification Exists & How to Use It" titleUrdu="ویریفائی ٹرمینل کیوں ضروری ہے اور اسے کیسے چلائیں؟">
        <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "8px", padding: "14px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#92400e", fontWeight: 800, fontSize: "13px" }}>
            <AlertTriangle size={16} />
            <span>Problem it Solves (مسئلہ جس کا حل ہے):</span>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: "12.5px", color: "#78350f", lineHeight: "1.5" }}>
            In Pakistan, pranksters often place fake delivery orders with wrong numbers. If the kitchen cooks the pizza immediately, the restaurant loses money on cheese, chicken, electricity, and paper.
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
          desc="Click the green WhatsApp button or Call button directly on the card to confirm the order with customer: 'Assalam-o-Alaikum, are you confirming your order of 1 Large Tikka?'"
          descUrdu="کارڈ پر موجود واٹس ایپ یا کال بٹن دبا کر کسٹمر سے کنفرم کریں کہ کیا آپ نے ہی آرڈر کیا ہے۔"
        />
        <StepRow
          num={3}
          title="Click 'Verify & Print Slip' (سبز بٹن)"
          desc="Once confirmed, click 'Verify & Send to Kitchen'. In 1 second: order pushes to Kitchen KDS, thermal printer prints customer bill, and order moves to Live Orders board!"
          descUrdu="کنفرم ہونے پر ویریفائی بٹن دبائیں۔ ایک سیکنڈ میں کچن اسکرین پر آرڈر چلا جائے گا اور تھرمل سلپ پرنٹ ہو جائے گی۔"
        />
        <StepRow
          num={4}
          title="Click 'Reject / Prank' if Fake (سرخ بٹن)"
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
      <SectionBox title="🍕 Live POS Orders Board Master Controls" titleUrdu="پی او ایس کاؤنٹر لائیو آرڈرز کنٹرول">
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
          title="Delivery Fee Adjuster (✏️ Add/Change Fee)"
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
      <SectionBox title="👨‍🍳 Kitchen Display Screen (KDS) for Chefs" titleUrdu="شیف کیلئے کچن ڈیجیٹل اسکرین">
        <p style={{ fontSize: "13px", color: "#334155", lineHeight: "1.6", marginBottom: "16px" }}>
          Open <code>/admin/kitchen</code> or <code>/kitchen</code> on a tablet, TV, or monitor placed above the pizza oven.
        </p>

        <StepRow
          num={1}
          title="Crisp Audio Chime on New Orders"
          desc="Whenever a new order is verified or entered at the counter, the kitchen screen rings an ascending chime so the chef turns around even with loud ovens running."
          descUrdu="نیا آرڈر آتے ہی کچن میں لاؤڈ گھنٹی بجے گی تا کہ شیف کو پتہ چل سکے۔"
        />
        <StepRow
          num={2}
          title="Visual Preparation Countdown Timers"
          desc="Tickets have color-coded timer badges: Green (0-10 min), Yellow (10-20 min), and Flashing Red (Over 20 min) to prevent customer delays."
          descUrdu="ٹکٹ پر ٹائمر چلتا ہے: 10 منٹ سے زیادہ ہونے پر پیلا اور 20 منٹ سے اوپر ہونے پر لال ہو جاتا ہے۔"
        />
        <StepRow
          num={3}
          title="Special Prep Notes Highlighted"
          desc="Crucial customer customizations like 'No Mayo', 'Extra Spicy', 'Less Cheese' are highlighted in bold red badges so the kitchen never makes mistakes."
          descUrdu="گاہک کی خاص ہدایات (مثلاً زیادہ اسپائسی یا بغیر پیاز) نمایاں نظر آتی ہیں۔"
        />
        <StepRow
          num={4}
          title="One-Tap 'Bump to Ready' (کھانا تیار ہے)"
          desc="When the pizza is boxed and out of oven, chef clicks 'Mark as Ready'. Counter cashiers and riders are immediately notified."
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
      <SectionBox title="🛵 Rider Dispatch & WhatsApp Automation" titleUrdu="ڈلیوری رائیڈر اور واٹس ایپ الرٹس">
        <StepRow
          num={1}
          title="Select Rider (Change / Pick Rider)"
          desc="On any delivery order card, click 'Pick Rider' or 'Change'. Select your active delivery boy from dropdown or click Round-Robin for fair order distribution."
          descUrdu="آرڈر کارڈ پر 'Pick Rider' کلک کر کے رائیڈر کا نام منتخب کریں۔"
        />
        <StepRow
          num={2}
          title="Click WhatsApp Button ('💬 WA')"
          desc="Clicking the green WhatsApp button opens WhatsApp with pre-filled dispatch details: Order Number, Customer Name, Mobile Number, Delivery Address, Bill Amount, and clickable Google Map location link!"
          descUrdu="سبز 'WA' بٹن دبانے سے رائیڈر کے واٹس ایپ پر کسٹمر کا ایڈریس، فون، گوگل میپ لوکیشن اور بل میسج چلا جاتا ہے۔"
        />
        <StepRow
          num={3}
          title="Manage Riders Roster (/admin/riders)"
          desc="Go to /admin/riders to add your delivery riders (Name, Phone, Bike Number, Active/Inactive status). You can track how many orders each rider delivered today."
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
      <SectionBox title="🖨️ Dual Thermal Receipts (Counter Bill & Kitchen KOT)" titleUrdu="تھرمل رسید اور کچن سلپ سیٹ اپ">
        <StepRow
          num={1}
          title="Dual Printing Logic Explained"
          desc="When an order is taken: 1) Customer Receipt prints on counter printer with Shop Name, Bill, Payment Info, and Complaint WhatsApp. 2) Kitchen Order Ticket (KOT) prints only food items and prep notes for chef."
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
          desc="To avoid Windows print popups, use FloDesktop app. It communicates directly with Rongta, Xprinter, Epson, and Black Copper printers via Windows Spooler."
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
      <SectionBox title="📦 Recipe Builder & Automatic Stock Deduction (BOM)" titleUrdu="ریسپی بلڈر اور آٹو کٹوتی کا طریقہ">
        <StepRow
          num={1}
          title="Step 1: Check Raw Materials in Tab 1"
          desc="Go to /admin/inventory. Tab 1 shows all raw materials (Chicken Tikka, Cheese, Dough, Sauces, Boxes). We have already seeded 14 standard ingredients for you!"
          descUrdu="پہلے ٹیب 1 میں را مٹیریل دیکھیں۔ ہم نے چکن، چیز، آٹا، ساس اور ڈبے پہلے سے ایڈ کر دیے ہیں۔"
        />
        <StepRow
          num={2}
          title="Step 2: Select Menu Item in Tab 2 (Recipe BOM)"
          desc="Switch to Tab 2. On the left side, search and select your pizza or burger (e.g. Crown Crust or Tikka Pizza). A green badge 'BOM ✓' indicates recipe is already set."
          descUrdu="ٹیب 2 میں جا کر بائیں طرف سے پیزا سلیکٹ کریں۔ گرین 'BOM' بیج بتاتا ہے کہ ریسپی سیو ہے۔"
        />
        <StepRow
          num={3}
          title="Step 3: Click '🍕 Auto-Fill Pizza Formula' or Add Lines"
          desc="Click the auto-fill pizza template button to load standard ingredients (0.5kg chicken, 100g cheese, dough base, sauce, box). Adjust quantities as per your kitchen."
          descUrdu="آٹو فل پیزا فارمولا کا بٹن دبائیں۔ چکن، چیز، ڈو اور ڈبہ خود بخود ایڈ ہو جائے گا۔"
        />
        <StepRow
          num={4}
          title="Step 4: Click '⚡ Auto-Scale to All Sizes' (Small, Medium, Large, XL)"
          desc="Clicking Auto-Scale calculates exact quantities for Small, Big, Large, and XL sizes and saves all 4 recipes in 1 second!"
          descUrdu="آٹو اسکیل کا بٹن دبانے سے اسمال، میڈیم، لارج اور ایکسٹرا لارج کے تمام سائزز کی ریسپی ایک کلک پر سیو ہو جاتی ہے۔"
        />
        <StepRow
          num={5}
          title="Step 5: Watch Stock Auto-Deduct on Every Sale!"
          desc="Now, whenever a customer buys 1 Large Pizza, the system automatically minuses 0.5kg chicken, 150g cheese, and 1 box from your stock warehouse. Zero manual bookkeeping!"
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
      <SectionBox title="🗑️ Chef Wastage & Monthly Theft Variance Audit" titleUrdu="کچن ضیاع اور چوری پکڑنے کا نظام">
        <StepRow
          num={1}
          title="Log Kitchen Wastage (جلی یا خراب اشیاء کا اندراج)"
          desc="Go to /admin/inventory -> Tab 4 (Wastage). If a chef burns dough or cheese expires, log the quantity and reason. This keeps food costs transparent."
          descUrdu="اگر کچن میں کوئی پیزا جل جائے یا دودھ خراب ہو تو ویسٹیج لاگ میں درج کریں۔"
        />
        <StepRow
          num={2}
          title="Run Monthly Stock Audit in Tab 3"
          desc="At month end, enter your physical counted stock (e.g. 18 kg chicken left in freezer). System compares it with expected stock based on orders sold."
          descUrdu="مہینے کے اختتام پر فریزر میں موجود چکن اور چیز کی گنتی کر کے انٹر کریں۔"
        />
        <StepRow
          num={3}
          title="Identify Kitchen Variance & Theft"
          desc="If system calculated you should have 25 kg chicken, but freezer only has 18 kg, the audit flags a RED alert of -7 kg shortage (Chef theft or unrecorded wastage)."
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
      <SectionBox title="💵 Daily Shift Register Closing & Permanent Z-Report" titleUrdu="روزانہ شفٹ کلوزنگ اور زیڈ رپورٹ">
        <StepRow
          num={1}
          title="Open /admin/closing at Night"
          desc="When the restaurant closes, open the Register Closing terminal. The screen displays total cash sales, card payments, online orders, and delivery fees."
          descUrdu="رات کو کاؤنٹر کلوزنگ پیج کھولیں۔ آج کا کل کیش، کارڈ اور ڈلیوری فیس کا ٹوٹل نظر آئے گا۔"
        />
        <StepRow
          num={2}
          title="Count Cash in Drawer (کیش دراز گنیں)"
          desc="Count physical currency notes in the cash till and enter the amount in 'Actual Cash in Drawer' field."
          descUrdu="دراز میں موجود نوٹ گن کر انٹر کریں۔ سسٹم بتائے گا کیش برابر ہے یا شارٹ۔"
        />
        <StepRow
          num={3}
          title="Click 'Finalize Shift & Print Z-Report'"
          desc="Clicking Close Shift locks today's orders and prints the permanent official Z-Report slip. Tomorrow morning starts with a fresh 0 balance."
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
      <SectionBox title="💻 FloDesktop Windows Native Application" titleUrdu="فلو ڈیسک ٹاپ ونڈوز پی او ایس ایپ">
        <StepRow
          num={1}
          title="Why Use Desktop App Instead of Browser?"
          desc="FloDesktop is built for cashier counters: 1) Instant silent thermal printing via Windows Spooler. 2) No browser address bar distractions. 3) Offline resilience if internet drops."
          descUrdu="ڈیسک ٹاپ ایپ کاؤنٹر کیلئے ہے: بنا کسی رکاوٹ کے پرنٹنگ، تیز رفتار اور انٹرنیٹ منقطع ہونے پر بھی کام۔"
        />
        <StepRow
          num={2}
          title="Real-time Cloud Sync"
          desc="Orders entered in FloDesktop immediately show on the web admin and Kitchen KDS. And online orders verified on web admin sync to FloDesktop instantly."
          descUrdu="ڈیسک ٹاپ ایپ اور ویب ایڈمن ہر سیکنڈ ایک دوسرے کے ساتھ سنک رہتے ہیں۔"
        />
        <StepRow
          num={3}
          title="Automatic Background Updates"
          desc="Whenever we release new features or bug fixes, FloDesktop downloads the update silently in the background and restarts in 2 seconds with the latest version."
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
      <SectionBox title="📱 QR Code Table Ordering System" titleUrdu="کیو آر ٹیبل آرڈرنگ سسٹم">
        <StepRow
          num={1}
          title="Generate Table QR Codes (/admin/tables)"
          desc="Go to /admin/tables. You can create tables (Table 1, Table 2, Family Cabin, Terrace). Click 'Print QR' to print acrylic stickers."
          descUrdu="ٹیبلز پیج پر جا کر ٹیبلز بنائیں اور ان کے کیو آر کوڈز پرنٹ کر کے میزوں پر چپکائیں۔"
        />
        <StepRow
          num={2}
          title="Customer Scans With Phone Camera"
          desc="When guests sit down, they scan the QR code with their iPhone or Android camera. Your restaurant menu opens instantly without downloading any app!"
          descUrdu="گاہک موبائل کیمرے سے اسکین کرتے ہیں تو بغیر کوئی ایپ ڈاؤن لوڈ کیے مینو کھل جاتا ہے۔"
        />
        <StepRow
          num={3}
          title="Order Arrives with Table Token Number"
          desc="When they hit order, it arrives with `[DINE-IN: Table 4 | VERIFY TOKEN: TK-02]`. Cashier confirms and sends it to kitchen!"
          descUrdu="آرڈر ٹیبل نمبر کے ساتھ ایڈمن پر آ جاتا ہے تا کہ کھانا سیدھا اسی ٹیبل پر سرو کیا جا سکے۔"
        />
      </SectionBox>
    </div>
  );
}

