"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SoleWhatLogo from "@/components/SoleWhatLogo";
import { BUSINESS_THEMES, BUSINESS_PRESETS, BusinessType } from "@/lib/business-themes";
import {
  Sparkles,
  ArrowRight,
  Laptop,
  ChefHat,
  Bike,
  Store,
  Layers,
  Phone,
  MessageSquare,
  Copy,
  Check,
  Flame,
  UtensilsCrossed,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  Printer,
  ChevronRight,
  TrendingUp,
  Receipt,
  QrCode,
  Lock,
  KeyRound,
  Smartphone,
  CheckCircle2,
  Menu as MenuIcon,
  X as CloseIcon,
} from "lucide-react";

function Bot({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}

function Calendar({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

export default function HomePage() {
  const phoneNumber = "0302-5260958";
  const intlPhone = "+92 302 5260958";
  const rawPhone = "03025260958";
  const whatsappUrl = `https://wa.me/923025260958?text=${encodeURIComponent(
    "Salam Syed Zeeshan Haider, I am interested in SoleWhat Cloud POS, WhatsApp Automation & Multi-Store Ordering System."
  )}`;
  const callUrl = `tel:+923025260958`;

  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<BusinessType>("pizza");

  useEffect(() => {
    document.title = "SoleWhat — All-in-One Restaurant & Retail POS, WhatsApp AI Automation & Cloud Menus";
  }, []);

  const handleCopyPhone = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(rawPhone);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = rawPhone;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2200);
    } catch {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2200);
    }
  };

  const handleCopyDemoPass = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText("demo");
      }
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2200);
    } catch {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2200);
    }
  };

  const businessTypesList: { id: BusinessType; name: string; icon: any; emoji: string }[] = [
    { id: "pizza", name: "Pizzeria", icon: Store, emoji: "🍕" },
    { id: "fast_food", name: "Fast Food & Burgers", icon: Flame, emoji: "🍔" },
    { id: "restaurant", name: "Dine-In Restaurant", icon: UtensilsCrossed, emoji: "🍲" },
    { id: "cafe", name: "Cafe & Chai Bar", icon: Flame, emoji: "☕" },
    { id: "bakery", name: "Bakery & Sweets", icon: Sparkles, emoji: "🎂" },
    { id: "retail", name: "Retail & Mart", icon: ShoppingBag, emoji: "🛒" },
  ];

  const activeTheme = BUSINESS_THEMES[selectedType];
  const activePreset = BUSINESS_PRESETS[selectedType];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-orange-500 selection:text-white">
      {/* ─── Schema.org Structured Data for SEO ─── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "SoftwareApplication",
                "name": "SoleWhat",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web, Windows, Android, iOS",
                "url": "https://www.solewhat.store",
                "description":
                  "SoleWhat is the modern all-in-one restaurant and retail POS platform with automated WhatsApp AI ordering, KDS, thermal receipt printing, and multi-branch management.",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "PKR",
                },
              },
              {
                "@type": "Organization",
                "name": "SoleWhat",
                "url": "https://www.solewhat.store",
                "logo": "https://www.solewhat.store/images/solewhat-logo.png",
                "contactPoint": {
                  "@type": "ContactPoint",
                  "telephone": "+92-302-5260958",
                  "contactType": "sales",
                  "availableLanguage": ["English", "Urdu"],
                },
              },
            ],
          }),
        }}
      />

      {/* ─── Top Ambient Light Gradients ─── */}
      <div className="absolute top-0 inset-x-0 h-96 overflow-hidden pointer-events-none -z-10">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] blur-[120px] opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(234,88,12,0.18) 0%, rgba(99,102,241,0.12) 50%, transparent 75%)",
          }}
        />
      </div>

      {/* ─── Modern Sticky Header ─── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <SoleWhatLogo size={44} variant="badge" showGlow={false} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-slate-950 font-heading">
                  SoleWhat
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                  Cloud OS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Smart Restaurant POS &amp; WhatsApp AI Platform
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <a href="#demo-spotlight" className="hover:text-orange-600 transition-colors">
              Live Demo
            </a>
            <a href="#whatsapp-automation" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>WhatsApp AI</span>
            </a>
            <a href="#pos-features" className="hover:text-orange-600 transition-colors">
              Desktop POS
            </a>
            <a href="#business-types" className="hover:text-orange-600 transition-colors">
              Industries
            </a>
            <a href="#contact" className="hover:text-orange-600 transition-colors">
              Contact &amp; Sales
            </a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="https://demo.solewhat.store"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 transition-all shadow-xs"
            >
              <Store size={14} className="text-orange-600" />
              <span>Demo Store</span>
            </a>

            <a
              href="https://demo.solewhat.store/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm hover:shadow"
            >
              <Lock size={12} className="text-orange-400" />
              <span>Demo Admin</span>
            </a>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white/98 backdrop-blur-md px-4 py-4 space-y-3 shadow-lg">
            <a
              href="#demo-spotlight"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-bold text-slate-800 rounded-md hover:bg-orange-50 hover:text-orange-600"
            >
              🌟 Try Live Demo &amp; Admin
            </a>
            <a
              href="#whatsapp-automation"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-bold text-emerald-700 rounded-md hover:bg-emerald-50"
            >
              🤖 WhatsApp AI Automation
            </a>
            <a
              href="#pos-features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-bold text-slate-800 rounded-md hover:bg-orange-50 hover:text-orange-600"
            >
              🖥️ Desktop POS &amp; Thermal Printing
            </a>
            <a
              href="#business-types"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-bold text-slate-800 rounded-md hover:bg-orange-50 hover:text-orange-600"
            >
              🍕 Industry Business Presets
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-bold text-slate-800 rounded-md hover:bg-orange-50 hover:text-orange-600"
            >
              📞 Contact &amp; Sales (WhatsApp)
            </a>
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <a
                href="https://demo.solewhat.store"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-2 text-xs font-bold rounded-lg bg-orange-600 text-white"
              >
                Customer Storefront
              </a>
              <a
                href="https://demo.solewhat.store/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-2 text-xs font-bold rounded-lg bg-slate-900 text-white"
              >
                Admin (Pass: demo)
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO SECTION
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative pt-10 pb-16 md:pt-16 md:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold mb-6 shadow-xs animate-fade-in flex-wrap justify-center">
            <Sparkles size={14} className="text-orange-500 animate-pulse" />
            <span>Powering Multi-Branch Food Brands Across Pakistan</span>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 hidden sm:inline-block" />
            <span className="font-extrabold text-slate-900 hidden sm:inline-block">v2.5 Live</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-950 max-w-5xl mx-auto leading-[1.12]">
            Universal Cloud POS, WhatsApp AI &amp; Ordering OS For{" "}
            <span className="bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 bg-clip-text text-transparent">
              High-Growth Restaurants
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
            Run your restaurants, pizzerias, fast-food counters, and cafes with ultra-fast offline
            POS, automatic ESC/POS thermal printing, WhatsApp AI order-taking, and live branch
            subdomains.
          </p>

          {/* ─── LIVE DEMO CREDENTIALS HERO CARD ─── */}
          <div
            id="demo-spotlight"
            className="mt-8 max-w-2xl mx-auto p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/80 to-white border-2 border-orange-300 shadow-xl shadow-orange-500/10 text-left"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-orange-200/80">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  ✨
                </span>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    Live Demo Store &amp; Admin Panel Ready
                  </h2>
                  <p className="text-xs text-orange-900 font-medium">
                    Test customer ordering and administrative backoffice in real time.
                  </p>
                </div>
              </div>

              {/* Password Pill with 1-Click Copy */}
              <button
                type="button"
                onClick={handleCopyDemoPass}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-orange-300 text-xs font-bold text-slate-900 hover:border-orange-500 hover:shadow-xs transition-all cursor-pointer"
                title="Click to copy demo password"
              >
                <KeyRound size={13} className="text-orange-600" />
                <span>Admin Password:</span>
                <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-mono font-extrabold text-xs">
                  demo
                </span>
                {copiedPass ? (
                  <span className="text-emerald-600 font-extrabold flex items-center gap-0.5">
                    <Check size={12} /> Copied!
                  </span>
                ) : (
                  <Copy size={12} className="text-slate-400" />
                )}
              </button>
            </div>

            {/* Demo CTAs */}
            <div className="pt-3.5 flex flex-wrap items-center gap-2.5">
              <a
                href="https://demo.solewhat.store"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 text-white font-extrabold text-xs sm:text-sm hover:bg-orange-700 transition-all shadow-md shadow-orange-200"
              >
                <Store size={16} />
                <span>Open Demo Storefront</span>
                <ExternalLink size={13} className="opacity-80" />
              </a>

              <a
                href="https://demo.solewhat.store/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 text-white font-extrabold text-xs sm:text-sm hover:bg-slate-800 transition-all shadow-md"
              >
                <Lock size={15} className="text-orange-400" />
                <span>Open Demo Admin (Pass: demo)</span>
                <ArrowRight size={13} />
              </a>

              <a
                href="https://pizza-mafia.solewhat.store"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-orange-600 hover:border-orange-300 font-bold text-xs transition-all"
              >
                <span>Pizza Mafia Live</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Contact / WhatsApp Quick Strip */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold text-sm transition-all shadow-xs"
            >
              <MessageSquare size={17} className="text-emerald-600" />
              <span>Instant WhatsApp Sales &amp; Hardware Demo</span>
            </a>

            <a
              href={callUrl}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-800 bg-white hover:bg-slate-50 font-bold text-sm transition-all shadow-xs"
            >
              <Phone size={17} className="text-orange-600" />
              <span>Call: {phoneNumber}</span>
            </a>
          </div>

          {/* Key Value Prop Badges */}
          <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto text-left">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0">
                <Zap size={20} />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900">0.2s Dispatch</div>
                <div className="text-[11px] text-slate-500">Real-Time Kitchen Sync</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                <Globe size={20} />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900">Subdomains</div>
                <div className="text-[11px] text-slate-500">shop.solewhat.store</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                <Printer size={20} />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900">Thermal ESC/POS</div>
                <div className="text-[11px] text-slate-500">80mm Kitchen &amp; Counter</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold shrink-0">
                <Bot size={20} />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900">WhatsApp AI</div>
                <div className="text-[11px] text-slate-500">24/7 Automated Orders</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          NEW: WHATSAPP AI AUTOMATION & AUTO-RESPONDER SECTION
          ══════════════════════════════════════════════════════════════════════ */}
      <section id="whatsapp-automation" className="py-20 bg-gradient-to-b from-emerald-50/40 via-white to-slate-50 border-t border-emerald-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold border border-emerald-200 mb-3">
              <Bot size={14} className="text-emerald-600" />
              <span>Next-Gen WhatsApp Commerce Engine</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
              Turn WhatsApp Into Your Highest-Grossing Sales Counter
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
              Never miss a customer message again. Our built-in WhatsApp AI Auto-Responder takes orders,
              sends live kitchen KOT receipts, alerts delivery riders, and sends daily closing PDF
              summaries directly to the restaurant owner.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: 24/7 AI Order Taking Bot */}
            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-emerald-200/90 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-5">
                <Bot size={26} />
              </div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 mb-1">
                Natural AI Conversation
              </div>
              <h3 className="text-lg font-extrabold text-slate-950 mb-2">
                24/7 AI Order-Taking Assistant
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Handles text &amp; voice messages in Roman Urdu &amp; English. Shows current deals,
                customizes pizza sizes, captures delivery address, and creates confirmed orders
                directly into POS.
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 size={15} />
                <span>Zero Human Delay on WhatsApp</span>
              </div>
            </div>

            {/* Card 2: Instant Itemized WhatsApp Receipt */}
            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-emerald-200/90 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-5">
                <Receipt size={26} />
              </div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 mb-1">
                Automated Customer Invoicing
              </div>
              <h3 className="text-lg font-extrabold text-slate-950 mb-2">
                Live WhatsApp Receipts &amp; Tracking
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Customers receive a digital invoice on WhatsApp with itemized prices, applied
                discounts, estimated prep time, and an interactive real-time order tracker link.
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 size={15} />
                <span>Instant Customer Trust &amp; Loyalty</span>
              </div>
            </div>

            {/* Card 3: Automated Rider Dispatch */}
            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-emerald-200/90 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-5">
                <Bike size={26} />
              </div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 mb-1">
                Smart Fleet Coordination
              </div>
              <h3 className="text-lg font-extrabold text-slate-950 mb-2">
                Automated Rider WhatsApp Alerts
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                The moment food is marked ready in the kitchen KDS, assigned riders receive
                WhatsApp messages with customer name, phone number, address, and 1-tap Google Maps
                pin.
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 size={15} />
                <span>Faster Hot Food Delivery</span>
              </div>
            </div>

            {/* Card 4: Nightly Shift Closing to Owner */}
            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-emerald-200/90 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-5">
                <TrendingUp size={26} />
              </div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 mb-1">
                Owner Peace of Mind
              </div>
              <h3 className="text-lg font-extrabold text-slate-950 mb-2">
                Nightly Shift Closing WhatsApp Report
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                When the shift manager closes the register, the platform automatically sends an
                audited sales report directly to the owner’s private WhatsApp—including total cash
                collected, online payments, discounts, and expenses.
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 size={15} />
                <span>Zero Cash Leakage &amp; Full Transparency</span>
              </div>
            </div>

            {/* Card 5: 1-Click QR Code Pairing */}
            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-emerald-200/90 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-5">
                <QrCode size={26} />
              </div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 mb-1">
                Zero API Hassle
              </div>
              <h3 className="text-lg font-extrabold text-slate-950 mb-2">
                1-Click WhatsApp QR Web Pairing
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                No complex Meta developer verification required. Just scan the pairing QR code from
                your Store Admin Settings using your restaurant’s official WhatsApp, and your auto-responder
                is live in 5 seconds.
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 size={15} />
                <span>Works on Any Android or iPhone</span>
              </div>
            </div>

            {/* Card 6: WhatsApp Marketing & Promo Blasts */}
            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-emerald-200/90 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-5">
                <Smartphone size={26} />
              </div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 mb-1">
                Repeat Customer Re-engagement
              </div>
              <h3 className="text-lg font-extrabold text-slate-950 mb-2">
                Promo Broadcasts &amp; Friday Deals
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Broadcast weekly Friday specials, discount coupons, or newly added seasonal deals to
                your past customers on WhatsApp with high open rates.
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 size={15} />
                <span>98% Message Read Rate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          DEEP DIVE: COMPLETE POS & COUNTER CAPABILITIES
          ══════════════════════════════════════════════════════════════════════ */}
      <section id="pos-features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-extrabold border border-orange-200 mb-3">
              <Laptop size={14} className="text-orange-600" />
              <span>Full-Stack Counter &amp; Kitchen Suite</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
              Everything Your Counter &amp; Kitchen Need
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
              Designed for high-speed rush hours with zero lag, instant thermal slip firing, and
              bulletproof offline security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* POS Feature 1 */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-orange-300 hover:bg-white hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold mb-5 group-hover:scale-110 transition-transform">
                <Laptop size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-950 mb-2">
                Windows Native POS App (FloDesktop)
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                Available as a dedicated Windows Desktop App with fast keyboard shortcuts (F1–F12),
                instant barcode / item search, and background printer spooling without browser print popups.
              </p>
              <div className="text-xs font-bold text-orange-600">Built for 1-Second Rush Punching</div>
            </div>

            {/* POS Feature 2 */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-orange-300 hover:bg-white hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-5 group-hover:scale-110 transition-transform">
                <Printer size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-950 mb-2">
                Raw Thermal Printing (ESC/POS)
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                Supports all standard 80mm &amp; 58mm thermal printers (Xprinter, Black Copper,
                Epson, Rongta) with automatic paper cut, cash drawer kick, and duplicate kitchen KOT slips.
              </p>
              <div className="text-xs font-bold text-blue-600">Silent Direct Windows Spooler</div>
            </div>

            {/* POS Feature 3 */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-orange-300 hover:bg-white hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-5 group-hover:scale-110 transition-transform">
                <Calendar size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-950 mb-2">
                Monday to Sunday Day Deals Scheduler
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                Schedule Monday Madness, Friday Family Fiesta, or Weekend Specials. The customer
                storefront automatically detects today’s day and showcases deals prominently at the top.
              </p>
              <div className="text-xs font-bold text-emerald-600">Automated Revenue Boost</div>
            </div>

            {/* POS Feature 4 */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-orange-300 hover:bg-white hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold mb-5 group-hover:scale-110 transition-transform">
                <QrCode size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-950 mb-2">
                Dine-In Table QR Tokens &amp; Takeaway
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                Unique tamper-proof QR codes for each table prevent prank orders. Customers scan and
                order from their phones, and kitchen tickets print directly with Table # and Token #.
              </p>
              <div className="text-xs font-bold text-purple-600">Anti-Fake Order Verification</div>
            </div>

            {/* POS Feature 5 */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-orange-300 hover:bg-white hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold mb-5 group-hover:scale-110 transition-transform">
                <ChefHat size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-950 mb-2">
                Live Kitchen KDS Screen with Chimes
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                Digital kitchen display with color-coded preparation timers, loud audio chime alerts
                when new orders arrive, and 1-tap &ldquo;Ready for Delivery&rdquo; status toggle.
              </p>
              <div className="text-xs font-bold text-red-600">No Lost Paper Tickets</div>
            </div>

            {/* POS Feature 6 */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-orange-300 hover:bg-white hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold mb-5 group-hover:scale-110 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-950 mb-2">
                Multi-Branch Super Admin Backoffice
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                Launch and oversee unlimited franchise branches. Manage staff PINs, cashier roles,
                daily closing audits, live gross sales, and inventory deductions from one master portal.
              </p>
              <div className="text-xs font-bold text-amber-600">Multi-Shop Centralized Governance</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          INTERACTIVE BUSINESS TYPES SECTION
          ══════════════════════════════════════════════════════════════════════ */}
      <section id="business-types" className="py-20 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-orange-600 bg-orange-100/70 border border-orange-200 px-3 py-1 rounded-full">
              Tailored Architecture
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              One Engine, Customized For Every Food &amp; Retail Model
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Click any industry preset below to see how SoleWhat adapts features, workflows, and
              pricing structures dynamically.
            </p>
          </div>

          {/* Industry Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {businessTypesList.map((item) => {
              const isSelected = selectedType === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedType(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-950 text-white shadow-md shadow-slate-950/15 scale-102"
                      : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-100/70"
                  }`}
                >
                  <span className="text-base">{item.emoji}</span>
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Preset Showcase Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-10 transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Preset Overview */}
              <div className="lg:col-span-7 space-y-5">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{activeTheme.accentEmoji}</span>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-950">
                      {activePreset.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-slate-500">
                      {activePreset.tagline}
                    </p>
                  </div>
                </div>

                {/* Enabled Feature Badges */}
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Active System Capabilities:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold ${
                        activePreset.features.enable_kot
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
                      }`}
                    >
                      <ChefHat size={15} />
                      <span>Kitchen KOT / KDS</span>
                    </div>

                    <div
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold ${
                        activePreset.features.enable_tables
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
                      }`}
                    >
                      <QrCode size={15} />
                      <span>Dine-In Tables</span>
                    </div>

                    <div
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold ${
                        activePreset.features.enable_riders
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
                      }`}
                    >
                      <Bike size={15} />
                      <span>Delivery Riders</span>
                    </div>

                    <div
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold ${
                        activePreset.features.enable_deals
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
                      }`}
                    >
                      <Sparkles size={15} />
                      <span>Deals &amp; Combos</span>
                    </div>

                    <div
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold ${
                        activePreset.features.enable_barcodes
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
                      }`}
                    >
                      <Receipt size={15} />
                      <span>Barcode Scanner</span>
                    </div>

                    <div
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold ${
                        activePreset.features.enable_service_charges
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
                      }`}
                    >
                      <TrendingUp size={15} />
                      <span>Service Charges</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Default Portion Mode</div>
                    <div className="text-sm font-extrabold text-slate-900">
                      {activePreset.features.default_portion_label}
                    </div>
                  </div>
                  <a
                    href="https://demo.solewhat.store"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-all shadow-xs"
                  >
                    <span>Test on Live Store</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* Right Column: Visual Preview */}
              <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Terminal Mockup
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-orange-400 font-bold">
                    SoleWhat {selectedType.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-slate-400 text-[10px]">ORDER #1042 — DINE-IN TABLE 04</div>
                    <div className="text-white font-bold mt-1">2x Chicken Supreme Pizza (Large)</div>
                    <div className="text-orange-400 text-[11px]">+ Cheesy Stuffed Crust</div>
                    <div className="text-slate-300 text-[11px] mt-1">1x 1.5L Chilled Drink</div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-white/10 text-sm font-bold">
                    <span className="text-slate-400">TOTAL BILL:</span>
                    <span className="text-emerald-400 text-base">Rs. 3,850</span>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <div className="flex-1 py-1.5 text-center rounded bg-emerald-600 text-white text-[11px] font-bold">
                      ✓ Thermal Printed
                    </div>
                    <div className="flex-1 py-1.5 text-center rounded bg-blue-600 text-white text-[11px] font-bold">
                      ✓ WhatsApp Sent
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          LIVE INTERACTIVE DEMOS SECTION
          ══════════════════════════════════════════════════════════════════════ */}
      <section id="live-demos" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-orange-600 bg-orange-100/70 border border-orange-200 px-3 py-1 rounded-full">
              Interactive Test Drives
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
              Test Every Module Directly in Your Browser
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Try the customer storefront, full administrative backoffice, cashier POS terminal,
              and kitchen display system.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Demo 1: Demo Customer Storefront */}
            <a
              href="https://demo.solewhat.store"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white p-6 rounded-2xl border-2 border-orange-300 hover:border-orange-500 hover:shadow-xl transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                    <Store size={24} />
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    LIVE SUBDOMAIN
                  </span>
                </div>
                <div className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">
                  Customer Ordering
                </div>
                <h4 className="text-lg font-extrabold text-slate-950 mb-2">
                  Demo Storefront (Online Menu)
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  Experience customer mobile ordering on dedicated subdomain{" "}
                  <code className="text-orange-700 font-bold">demo.solewhat.store</code> with cart,
                  size modifiers, and dine-in/takeaway checkout.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-orange-600 group-hover:gap-2.5 transition-all">
                <span>Launch Demo Storefront</span>
                <ArrowRight size={13} />
              </div>
            </a>

            {/* Demo 2: Demo Store Admin Panel */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-md hover:shadow-xl transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 text-white flex items-center justify-center font-bold">
                    <Lock size={22} className="text-orange-400" />
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200">
                    ADMIN BACKOFFICE
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Store Management
                </div>
                <h4 className="text-lg font-extrabold text-slate-950 mb-2">
                  Demo Store Admin Panel
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  Manage orders, inventory, Monday–Sunday deals, kitchen staff, closing reports, and
                  settings.
                </p>

                {/* Password box */}
                <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-200 mb-4 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-slate-500 font-medium">Password: </span>
                    <strong className="text-slate-950 font-mono text-sm bg-white px-2 py-0.5 rounded border border-orange-200">
                      demo
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyDemoPass}
                    className="text-xs font-bold text-orange-700 hover:text-orange-800 flex items-center gap-1"
                  >
                    {copiedPass ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copiedPass ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              <a
                href="https://demo.solewhat.store/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-950 text-white font-extrabold text-xs hover:bg-slate-800 transition-all shadow-sm"
              >
                <Lock size={13} className="text-orange-400" />
                <span>Login to Demo Admin (Pass: demo)</span>
                <ArrowRight size={13} />
              </a>
            </div>

            {/* Demo 3: WhatsApp AI Order Automation */}
            <a
              href="#whatsapp-automation"
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                    <MessageSquare size={24} />
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    24/7 AI BOT
                  </span>
                </div>
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                  WhatsApp Automation
                </div>
                <h4 className="text-lg font-extrabold text-slate-950 mb-2">
                  AI Order Taking & Invoicing
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  Autonomous conversational bot that captures customer food orders on WhatsApp, sends PDF
                  invoices with live tracking links, and routes directly to POS.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 group-hover:gap-2.5 transition-all">
                <span>Explore WhatsApp Automation</span>
                <ArrowRight size={13} />
              </div>
            </a>

            {/* Demo 4: Cashier POS Terminal */}
            <Link
              href="/demo/pos"
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-4">
                  <Laptop size={24} />
                </div>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                  Counter Terminal
                </div>
                <h4 className="text-lg font-extrabold text-slate-950 mb-2">
                  High-Speed POS Cashier
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  Interactive counter order punching, modifiers selection, cash calculations, and
                  thermal receipt preview.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-600 group-hover:gap-2.5 transition-all">
                <span>Test POS Terminal</span>
                <ArrowRight size={13} />
              </div>
            </Link>

            {/* Demo 5: Kitchen KDS Board */}
            <Link
              href="/demo/kitchen"
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-4">
                  <ChefHat size={24} />
                </div>
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                  Kitchen Display
                </div>
                <h4 className="text-lg font-extrabold text-slate-950 mb-2">
                  Kitchen KDS Ticket Board
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  Real-time ticket board for chef and cook dispatch with order status updates and
                  audible alert chimes.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 group-hover:gap-2.5 transition-all">
                <span>View Kitchen Board</span>
                <ArrowRight size={13} />
              </div>
            </Link>

            {/* Demo 6: Rider Tracker */}
            <Link
              href="/demo/track"
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-purple-400 hover:shadow-lg transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold mb-4">
                  <Bike size={24} />
                </div>
                <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
                  Customer Experience
                </div>
                <h4 className="text-lg font-extrabold text-slate-950 mb-2">
                  Live Order Tracker
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  Visual order lifecycle stepper from baking to rider assignment and doorstep
                  delivery.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-purple-600 group-hover:gap-2.5 transition-all">
                <span>Track Order Demo</span>
                <ArrowRight size={13} />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          CONTACT & DIRECT SALES SECTION
          ══════════════════════════════════════════════════════════════════════ */}
      <section id="contact" className="py-20 bg-slate-50 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl p-7 sm:p-14 text-white text-center relative overflow-hidden shadow-2xl">
            {/* Background Accent Gradients */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-orange-400 border border-white/10 text-xs font-bold">
                <Sparkles size={14} />
                <span>Ready To Transform Your Food Business?</span>
              </div>

              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight">
                Launch SoleWhat For Your Restaurant or Retail Chain
              </h2>

              <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed">
                Get full hardware setup, thermal printer configuration, multi-branch subdomains,
                WhatsApp AI auto-responder, and staff training. Talk directly to our technical lead.
              </p>

              {/* Direct Contact Buttons */}
              <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs sm:text-sm transition-all shadow-lg hover:shadow-emerald-500/25"
                >
                  <MessageSquare size={17} />
                  <span>Chat On WhatsApp</span>
                </a>

                <a
                  href={callUrl}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-extrabold text-xs sm:text-sm transition-all shadow-lg"
                >
                  <Phone size={17} className="text-orange-600" />
                  <span>Call: {phoneNumber}</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm border border-white/15 transition-all cursor-pointer"
                >
                  {copiedPhone ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  <span>{copiedPhone ? "Number Copied!" : "Copy Number"}</span>
                </button>
              </div>

              {/* Founder Tag */}
              <div className="pt-6 border-t border-white/10 text-xs text-slate-400 leading-relaxed">
                Founder &amp; Technical Lead:{" "}
                <span className="font-extrabold text-white">Syed Zeeshan Haider</span> • Direct
                Support &amp; Custom Branch Deployments
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-12 bg-white border-t border-slate-100 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-2.5">
            <SoleWhatLogo size={28} variant="shield" showGlow={false} />
            <span className="font-extrabold text-slate-900 text-sm">SoleWhat.store</span>
            <span className="text-slate-300">|</span>
            <span>Universal Cloud POS &amp; Store Operating System</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-semibold">
            <a
              href="https://demo.solewhat.store"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-orange-600 transition-colors"
            >
              Demo Store
            </a>
            <a
              href="https://demo.solewhat.store/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-orange-600 transition-colors"
            >
              Demo Admin (Pass: demo)
            </a>
            <a
              href="https://pizza-mafia.solewhat.store"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-orange-600 transition-colors"
            >
              Pizza Mafia Store
            </a>
            <Link href="/demo/pos" className="hover:text-slate-900 transition-colors">
              POS Terminal
            </Link>
            <Link href="/super-admin/login" className="hover:text-slate-900 transition-colors">
              Super Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
