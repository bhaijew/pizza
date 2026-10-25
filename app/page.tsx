"use client";

import { useState } from "react";
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
} from "lucide-react";

export default function HomePage() {
  const phoneNumber = "0302-5260958";
  const intlPhone = "+92 302 5260958";
  const rawPhone = "03025260958";
  const whatsappUrl = `https://wa.me/923025260958?text=${encodeURIComponent(
    "Salam Syed Zeeshan Haider, I am interested in SoleWhat Cloud POS & Multi-Store Ordering System."
  )}`;
  const callUrl = `tel:+923025260958`;

  const [copied, setCopied] = useState(false);
  const [selectedType, setSelectedType] = useState<BusinessType>("pizza");

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
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
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
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/85 border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <SoleWhatLogo size={42} variant="badge" showGlow={false} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-950 font-heading">
                  SoleWhat
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                  Cloud OS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Universal Business & POS Operating System
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-orange-600 transition-colors">
              Features
            </a>
            <a href="#business-types" className="hover:text-orange-600 transition-colors">
              Industries
            </a>
            <a href="#live-demos" className="hover:text-orange-600 transition-colors">
              Live Demos
            </a>
            <a href="#contact" className="hover:text-orange-600 transition-colors">
              Contact & Sales
            </a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/demo/pos"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm"
            >
              <Laptop size={14} className="text-orange-600" />
              <span>POS Demo</span>
            </Link>

            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm hover:shadow"
            >
              <span>Admin Login</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO SECTION
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold mb-6 shadow-xs animate-fade-in">
            <Sparkles size={14} className="text-orange-500 animate-pulse" />
            <span>Powering Multi-Store Brands Across Pakistan & Worldwide</span>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <span className="font-extrabold text-slate-900">v2.4 Live</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-950 max-w-5xl mx-auto leading-[1.12]">
            The Universal Cloud POS & Ordering OS Built For{" "}
            <span className="bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 bg-clip-text text-transparent">
              High-Growth Businesses
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
            Run your restaurants, pizzerias, cafes, bakeries, and retail marts on one seamless
            high-speed cloud platform with instant price updates, KDS kitchen dispatch, WhatsApp
            receipts, and direct shop subdomains.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://pizza-mafia.solewhat.store"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 transition-all shadow-md hover:shadow-orange-200 hover:shadow-lg transform active:scale-98"
            >
              <Store size={18} />
              <span>Explore Live Store Menu</span>
              <ExternalLink size={14} className="opacity-75" />
            </a>

            <Link
              href="/demo/pos"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow-md hover:shadow-lg transform active:scale-98"
            >
              <Laptop size={18} className="text-orange-400" />
              <span>Launch Live POS Demo</span>
            </Link>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold text-sm transition-all shadow-xs"
            >
              <MessageSquare size={18} className="text-emerald-600" />
              <span>WhatsApp Sales</span>
            </a>
          </div>

          {/* Key Value Prop Badges */}
          <div className="mt-14 pt-8 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <Zap size={20} />
              </div>
              <div>
                <div className="text-sm font-extrabold text-slate-900">0.2s Dispatch</div>
                <div className="text-xs text-slate-500">Real-Time Kitchen Sync</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <Globe size={20} />
              </div>
              <div>
                <div className="text-sm font-extrabold text-slate-900">Wildcard URLs</div>
                <div className="text-xs text-slate-500">Direct Shop Subdomains</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <Printer size={20} />
              </div>
              <div>
                <div className="text-sm font-extrabold text-slate-900">Thermal + ESC/POS</div>
                <div className="text-xs text-slate-500">Kitchen & Bar Printing</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="text-sm font-extrabold text-slate-900">Multi-Tenant</div>
                <div className="text-xs text-slate-500">Unlimited Store Branches</div>
              </div>
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
              One Engine, Customized For Every Business Model
            </h2>
            <p className="mt-3 text-slate-600 text-base">
              Click any industry preset below to see how SoleWhat adapts features, workflows, and
              pricing structures dynamically.
            </p>
          </div>

          {/* Industry Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
            {businessTypesList.map((item) => {
              const isSelected = selectedType === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedType(item.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
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
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{activeTheme.accentEmoji}</span>
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-950">
                      {activePreset.title}
                    </h3>
                    <p className="text-sm font-medium text-slate-500">
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
                      <span>Rider Dispatch</span>
                    </div>

                    <div
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold ${
                        activePreset.features.enable_deals
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
                      }`}
                    >
                      <Sparkles size={15} />
                      <span>Combo Deals Engine</span>
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
                        activePreset.features.enable_weight_pricing
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
                      }`}
                    >
                      <TrendingUp size={15} />
                      <span>Weight / Loose Price</span>
                    </div>
                  </div>
                </div>

                {/* Portion Templates Preview */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Default Serving Labels ({activePreset.features.default_portion_label}):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activePreset.portion_templates.map((p, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200"
                      >
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Theme Color & Direct Subdomain Preview */}
              <div className="lg:col-span-5 bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Branded Experience
                </div>

                <div
                  className="p-4 rounded-xl text-white space-y-2 shadow-sm"
                  style={{ background: activeTheme.gradient }}
                >
                  <div className="text-xs uppercase tracking-wider font-extrabold opacity-90">
                    Active Brand Accent
                  </div>
                  <div className="text-xl font-black">{activeTheme.name} Theme</div>
                  <div className="text-xs opacity-80">
                    Injected across Admin Sidebar, Order Badges, POS Highlights & Print Slips.
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>Direct Web Subdomain</span>
                    <span className="text-emerald-600 font-extrabold">Active</span>
                  </div>
                  <code className="block text-xs font-mono font-extrabold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 truncate">
                    https://{selectedType}-branch.solewhat.store
                  </code>
                  <p className="text-[11px] text-slate-500">
                    Each branch gets an isolated high-speed web address without page-load delays.
                  </p>
                </div>

                <Link
                  href="/admin/login"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all"
                >
                  <span>Open {activeTheme.name} Management</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          CORE FEATURES GRID
          ══════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full">
              Full-Stack Capabilities
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Engineered For Speed, Reliability & Precision
            </h2>
            <p className="mt-3 text-slate-600 text-base">
              From front-of-house customer ordering to back-of-house kitchen firing and offline
              counter billing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-950 mb-2">
                Instant Price & Catalog Sync
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Update prices or item availability from your phone or POS, and watch every live
                customer menu update instantaneously with Supabase Realtime—zero refresh required.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Globe size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-950 mb-2">
                Wildcard Branch Subdomains
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Every shop gets its own branded domain like{" "}
                <code className="text-blue-600 font-bold">pizza-mafia.solewhat.store</code>.
                Isolated menus, custom hero banners, and dedicated order dispatch.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ChefHat size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-950 mb-2">
                Live Kitchen Display System (KDS)
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Replace noisy paper slips with digital touch screens. Kitchen staff mark items as
                cooking, ready, or collected with audio chime alerts and preparation timers.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Laptop size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-950 mb-2">
                Offline-Ready Cashier Terminal
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Counter billing continues uninterrupted even if local internet drops. One-click
                offline backup and instant re-sync when connectivity restores.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-red-300 hover:shadow-lg hover:shadow-red-500/5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Bike size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-950 mb-2">
                Live Rider Dispatch & Tracking
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Assign orders to delivery riders, calculate cash-on-delivery reconciliations, and
                give customers live order progression from baking to doorstep delivery.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-teal-300 hover:shadow-lg hover:shadow-teal-500/5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-950 mb-2">
                Automated WhatsApp Receipts
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Send professional digital itemized invoices and order status updates straight to
                your customer’s WhatsApp with your store branding and tracking links.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          LIVE INTERACTIVE DEMOS SECTION
          ══════════════════════════════════════════════════════════════════════ */}
      <section id="live-demos" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-600 bg-slate-200/70 border border-slate-300 px-3 py-1 rounded-full">
              Test It Yourself
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Launch Any Live Demo With One Click
            </h2>
            <p className="mt-3 text-slate-600 text-base">
              Try out the cashier POS, kitchen display, live branch menu, and rider tracker
              directly in your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Demo 1: Pizza Mafia Live Store */}
            <a
              href="https://pizza-mafia.solewhat.store"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white p-6 rounded-xl border border-slate-200 hover:border-orange-400 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold mb-4">
                  <Store size={20} />
                </div>
                <div className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">
                  Live Subdomain
                </div>
                <h4 className="text-base font-extrabold text-slate-950 mb-2">
                  Pizza Mafia Store
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Experience customer online ordering with stone-baked pizzas, cart modifiers, and
                  checkout.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 group-hover:gap-2.5 transition-all">
                <span>Open Storefront</span>
                <ArrowRight size={13} />
              </div>
            </a>

            {/* Demo 2: Cashier POS */}
            <Link
              href="/demo/pos"
              className="bg-white p-6 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-4">
                  <Laptop size={20} />
                </div>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                  High-Speed Terminal
                </div>
                <h4 className="text-base font-extrabold text-slate-950 mb-2">
                  POS Cashier Screen
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Fast counter order punching, modifiers selection, cash calculations, and receipt
                  slips.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 group-hover:gap-2.5 transition-all">
                <span>Test POS Terminal</span>
                <ArrowRight size={13} />
              </div>
            </Link>

            {/* Demo 3: Kitchen KDS */}
            <Link
              href="/demo/kitchen"
              className="bg-white p-6 rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-4">
                  <ChefHat size={20} />
                </div>
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                  Kitchen Operations
                </div>
                <h4 className="text-base font-extrabold text-slate-950 mb-2">
                  Kitchen Display (KDS)
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Real-time ticket board for chef and cook dispatch with order status updates.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 group-hover:gap-2.5 transition-all">
                <span>View Kitchen Board</span>
                <ArrowRight size={13} />
              </div>
            </Link>

            {/* Demo 4: Rider Tracker */}
            <Link
              href="/demo/track"
              className="bg-white p-6 rounded-xl border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold mb-4">
                  <Bike size={20} />
                </div>
                <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
                  Customer Experience
                </div>
                <h4 className="text-base font-extrabold text-slate-950 mb-2">
                  Live Order Tracking
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Visual order lifecycle stepper from baking to rider assignment and delivery.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 group-hover:gap-2.5 transition-all">
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
      <section id="contact" className="py-24 bg-white relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl p-8 sm:p-14 text-white text-center relative overflow-hidden shadow-2xl">
            {/* Background Accent Gradients */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-orange-400 border border-white/10 text-xs font-bold">
                <Sparkles size={14} />
                <span>Ready To Transform Your Food Business?</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                Launch SoleWhat For Your Restaurant or Retail Chain
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Get full hardware setup, thermal printer configuration, multi-branch subdomains,
                and staff training. Talk directly to our technical lead.
              </p>

              {/* Direct Contact Buttons */}
              <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm transition-all shadow-lg hover:shadow-emerald-500/25 transform active:scale-98"
                >
                  <MessageSquare size={18} />
                  <span>Chat On WhatsApp</span>
                </a>

                <a
                  href={callUrl}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-extrabold text-sm transition-all shadow-lg transform active:scale-98"
                >
                  <Phone size={18} className="text-orange-600" />
                  <span>Call: {phoneNumber}</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/15 transition-all"
                >
                  {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  <span>{copied ? "Number Copied!" : "Copy Number"}</span>
                </button>
              </div>

              {/* Founder Tag */}
              <div className="pt-6 border-t border-white/10 text-xs text-slate-400">
                Founder & Technical Lead:{" "}
                <span className="font-extrabold text-white">Syed Zeeshan Haider</span> • Direct
                Support & Custom Integrations
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-12 bg-white border-t border-slate-100 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <SoleWhatLogo size={28} variant="shield" showGlow={false} />
            <span className="font-extrabold text-slate-900 text-sm">SoleWhat.store</span>
            <span className="text-slate-300">|</span>
            <span>Universal Cloud POS & Store Operating System</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <Link href="/pizza-mafia" className="hover:text-slate-900 transition-colors">
              Pizza Mafia Store
            </Link>
            <Link href="/demo/pos" className="hover:text-slate-900 transition-colors">
              POS Terminal
            </Link>
            <Link href="/admin/login" className="hover:text-slate-900 transition-colors">
              Store Admin
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
