import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pizza POS & Online Ordering Suite | By Syed Zeeshan Haider",
  description:
    "Enterprise-grade restaurant & pizza POS system with automated WhatsApp notifications, live customer tracking, chef kitchen display (KDS), loyalty cash rewards, and multi-branch management. Built by Syed Zeeshan Haider.",
};

export default function MobileResponsivePizzaLanding() {
  const phoneNumber = "03334867615";
  const internationalPhone = "+92 333 4867615";
  const formattedPhone = "0333-4867615";
  const whatsappInquiryUrl =
    "https://wa.me/923334867615?text=Salam%20Syed%20Zeeshan%20Haider,%20I%20am%20interested%20in%20purchasing%20the%20Pizza%20POS%20and%20Online%20Ordering%20System.";
  const phoneCallUrl = "tel:+923334867615";

  const coreFeatures = [
    {
      code: "MOD-01",
      icon: "🍕",
      title: "Interactive Menu & Storefront",
      desc: "Fast, mobile-first ordering menu with pizza crust sizes, customizable toppings, special kitchen notes, and instant checkout drawer.",
      badge: "STOREFRONT",
      demoHref: "/demo/menu",
    },
    {
      code: "MOD-02",
      icon: "💬",
      title: "Automated WhatsApp Gateway",
      desc: "Instantly sends branded WhatsApp receipts to customers and dispatch alerts to delivery riders with destination address, customer phone, and cash to collect.",
      badge: "AUTOMATION",
      demoHref: "/demo/pos",
    },
    {
      code: "MOD-03",
      icon: "📍",
      title: "Real-Time Live Order Tracker",
      desc: "Dedicated tracking URL (/track/[orderId]) featuring a 4-stage kitchen-to-doorstep timeline, dynamic elapsed timers, and synthetic Web Audio chimes.",
      badge: "LIVE TRACKING",
      demoHref: "/demo/track",
    },
    {
      code: "MOD-04",
      icon: "🎟️",
      title: "Promo Codes & Discount Engine",
      desc: "Create percentage or flat discount voucher codes (e.g. WELCOME20, FLAT100, PIZZA500) with minimum order values, expiry dates, and usage limits.",
      badge: "MARKETING",
      demoHref: "/demo/menu",
    },
    {
      code: "MOD-05",
      icon: "🪙",
      title: "Customer Loyalty Cash Engine",
      desc: "Automatic repeat customer phone lookup. Customers earn 1 cash point per Rs. 50 spent (2% cashback) with 1-click bill deduction.",
      badge: "RETENTION",
      demoHref: "/demo/menu",
    },
    {
      code: "MOD-06",
      icon: "👨‍🍳",
      title: "Chef Kitchen Display System (KDS)",
      desc: "Live kitchen display for cooks with cooking stages, preparation timers, and instant synthetic audio chimes on new incoming orders.",
      badge: "KITCHEN KDS",
      demoHref: "/demo/kitchen",
    },
    {
      code: "MOD-07",
      icon: "🛵",
      title: "Delivery Rider Dispatch System",
      desc: "1-click rider assignment on live order cards with automated WhatsApp dispatch messages containing destination, customer contact, and bill total.",
      badge: "DISPATCH",
      demoHref: "/demo/pos",
    },
    {
      code: "MOD-08",
      icon: "🖨️",
      title: "Table QR Code Dine-In Ordering",
      desc: "Generates digital QR codes for dine-in tables with anti-fraud token verification and dedicated table-locked checkout links.",
      badge: "TABLE POS",
      demoHref: "/demo/menu",
    },
    {
      code: "MOD-09",
      icon: "📊",
      title: "Daily Register Closing & Expenses",
      desc: "End-of-day register closing summaries, categorized expense tracking, dine-in vs delivery revenue breakdown, and net profit calculations.",
      badge: "FINANCIALS",
      demoHref: "/demo/pos",
    },
    {
      code: "MOD-10",
      icon: "🏢",
      title: "Multi-Branch & Tenant Architecture",
      desc: "One single platform deployment can host unlimited branches or separate pizza brands with independent menus, categories, and staff credentials.",
      badge: "MULTI-BRANCH",
      demoHref: "/demo/pos",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#09090b",
        color: "#ffffff",
        fontFamily: "var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
        lineHeight: 1.5,
        overflowX: "hidden",
        width: "100%",
        maxWidth: "100%",
      }}
      className="pb-20 md:pb-0"
    >
      {/* ─── TOP NOTICE BANNER (RESPONSIVE) ───────────────────────── */}
      <div
        style={{
          background: "#ea580c",
          color: "#ffffff",
          borderBottom: "1px solid #c2410c",
        }}
        className="px-3 py-2 text-center text-xs font-extrabold flex items-center justify-center gap-2 flex-wrap"
      >
        <span className="flex items-center gap-1.5">
          <span>⚡</span>
          <span>LIVE SANDBOX: Test Storefront, POS, KDS &amp; Tracker without login!</span>
        </span>
        <Link
          href="#sandbox-modules"
          style={{
            background: "#09090b",
            color: "#ffffff",
            borderRadius: 3,
            textDecoration: "none",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
          className="px-2 py-0.5 text-[11px] font-black uppercase inline-block whitespace-nowrap"
        >
          Explore Demos ↓
        </Link>
      </div>

      {/* ─── ORANGE / WHITE / BLACK NAVBAR (RESPONSIVE) ───────────── */}
      <header
        style={{
          borderBottom: "2px solid #ea580c",
          background: "#000000",
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo & Identity */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 text-decoration-none">
            <div
              style={{
                background: "#ea580c",
                boxShadow: "0 2px 10px rgba(234, 88, 12, 0.5)",
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-md flex items-center justify-center text-xl sm:text-2xl text-white flex-shrink-0"
            >
              🍕
            </div>
            <div>
              <span className="text-sm sm:text-base md:text-lg font-black text-white tracking-tight block leading-tight">
                PIZZA POS &amp; CLOUD SUITE
              </span>
              <span className="text-[10px] sm:text-xs text-orange-500 font-extrabold uppercase tracking-wider block">
                By Syed Zeeshan Haider
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-2.5 flex-wrap">
            <Link
              href="#sandbox-modules"
              style={{
                background: "rgba(234, 88, 12, 0.15)",
                border: "1px solid #ea580c",
              }}
              className="text-xs font-bold text-orange-200 px-3 py-2 rounded no-underline inline-flex items-center gap-1.5 hover:bg-orange-600/30 transition-colors"
            >
              <span>🎮</span>
              <span>Live Demos</span>
            </Link>

            <a
              href={phoneCallUrl}
              style={{
                boxShadow: "0 2px 0 #cbd5e1",
              }}
              className="text-xs font-extrabold text-black bg-white px-3 py-2 rounded no-underline inline-flex items-center gap-1.5"
            >
              <span>📞</span>
              <span>{formattedPhone}</span>
            </a>

            <Link
              href="/demo/pos"
              style={{
                background: "#ea580c",
                boxShadow: "0 2px 0 #9a3412",
              }}
              className="text-xs font-black text-white px-3.5 py-2 rounded no-underline uppercase tracking-wide inline-flex items-center gap-1"
            >
              <span>POS Demo ➔</span>
            </Link>

            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#15803d",
                boxShadow: "0 2px 0 #14532d",
              }}
              className="text-xs font-extrabold text-white px-3.5 py-2 rounded no-underline uppercase tracking-wide inline-flex items-center gap-1.5"
            >
              <span>💬</span>
              <span>WhatsApp: {formattedPhone}</span>
            </a>
          </div>

          {/* Mobile Fast Action Buttons (Header) */}
          <div className="flex md:hidden items-center gap-2">
            <a
              href={phoneCallUrl}
              className="bg-white text-black px-2.5 py-1.5 rounded text-xs font-black no-underline inline-flex items-center gap-1"
            >
              <span>📞</span>
              <span>Call</span>
            </a>

            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 text-white px-2.5 py-1.5 rounded text-xs font-black no-underline inline-flex items-center gap-1"
            >
              <span>💬</span>
              <span>Chat</span>
            </a>

            <Link
              href="#sandbox-modules"
              className="bg-orange-600 text-white px-2.5 py-1.5 rounded text-xs font-black no-underline inline-flex items-center"
            >
              <span>Demo</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION (RESPONSIVE) ────────────────────────────── */}
      <section
        style={{
          background: "radial-gradient(ellipse at top, rgba(234, 88, 12, 0.22) 0%, rgba(9, 9, 11, 1) 68%)",
          borderBottom: "2px solid #27272a",
        }}
        className="px-4 py-10 sm:px-6 sm:py-16 md:py-20 text-center relative overflow-hidden"
      >
        <div className="max-w-4xl mx-auto relative z-10">
          {/* Square Badge */}
          <div
            style={{
              background: "rgba(234, 88, 12, 0.15)",
              border: "1.5px solid #ea580c",
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-orange-400 text-[11px] sm:text-xs font-black uppercase tracking-wider mb-5"
          >
            <span>■</span>
            <span>ENTERPRISE RESTAURANT &amp; PIZZA SOFTWARE SUITE</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] mb-4 sm:mb-5">
            Complete Pizza POS,{" "}
            <span style={{ color: "#ea580c", textDecoration: "underline", textDecorationColor: "rgba(234,88,12,0.4)" }}>
              Online Ordering
            </span>{" "}
            &amp; WhatsApp Automation System
          </h1>

          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-zinc-300 max-w-2xl mx-auto mb-7 sm:mb-9 leading-relaxed">
            A high-performance digital ordering and POS platform built for pizza outlets, burger joints, and cloud kitchens.
            Equipped with automated WhatsApp receipts, rider dispatch alerts, real-time live order tracking, chef kitchen display (KDS), table QR codes, and loyalty cash rewards.
          </p>

          {/* Primary Action Buttons (Responsive Grid/Flex) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12 w-full">
            <Link
              href="#sandbox-modules"
              style={{
                background: "#ea580c",
                border: "2px solid #ffffff",
                boxShadow: "4px 4px 0 #000000",
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-md text-white text-xs sm:text-sm font-black no-underline uppercase tracking-wide inline-flex items-center justify-center gap-2"
            >
              <span>🍕</span>
              <span>Launch Live Demo Sandbox ➔</span>
            </Link>

            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#ffffff",
                border: "2px solid #000000",
                boxShadow: "4px 4px 0 #ea580c",
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-md text-black text-xs sm:text-sm font-black no-underline uppercase tracking-wide inline-flex items-center justify-center gap-2"
            >
              <span>💬</span>
              <span>WhatsApp: {formattedPhone}</span>
            </a>

            <a
              href={phoneCallUrl}
              style={{
                background: "#18181b",
                border: "2px solid #3f3f46",
                boxShadow: "4px 4px 0 #000000",
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-md text-white text-xs sm:text-sm font-extrabold no-underline uppercase tracking-wide inline-flex items-center justify-center gap-2"
            >
              <span>📞</span>
              <span>Direct Call: {formattedPhone}</span>
            </a>
          </div>

          {/* Architectural Metrics Bar (Responsive 2x2 grid on mobile) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 max-w-3xl mx-auto">
            {[
              { label: "Turnkey Codebase", value: "Ready to Deploy", color: "#fb923c" },
              { label: "Architecture", value: "Multi-Tenant Cloud", color: "#ffffff" },
              { label: "Mobile Experience", value: "100% Responsive", color: "#fb923c" },
              { label: "Database Engine", value: "Supabase Postgres", color: "#ffffff" },
            ].map((m) => (
              <div
                key={m.label}
                style={{
                  background: "#18181b",
                  border: "1.5px solid #27272a",
                }}
                className="rounded-md p-3 sm:p-3.5 text-center"
              >
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                  {m.label}
                </span>
                <span
                  style={{ color: m.color }}
                  className="text-xs sm:text-sm font-black mt-1 block leading-tight"
                >
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LIVE SYSTEM SANDBOX (4 INTERACTIVE FAKE DEMO TILES) ──── */}
      <section
        id="sandbox-modules"
        style={{
          background: "#ffffff",
          color: "#09090b",
          borderBottom: "3px solid #ea580c",
        }}
        className="px-4 py-10 sm:px-6 sm:py-14 md:py-16"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8 border-b-2 border-zinc-900 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black text-orange-600 uppercase tracking-wider">
                  ■ LIVE FUNCTIONAL MODULES
                </span>
                <span className="bg-orange-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                  NO LOGIN NEEDED
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 m-0">
                Interactive Live System Sandbox
              </h2>
            </div>
            <span className="text-xs sm:text-sm text-orange-600 font-extrabold">
              ⚡ Click any tile to test live simulated system:
            </span>
          </div>

          {/* Cards Grid: 1 col on mobile, 2 cols on tablet, 4 cols on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Tile 1: Customer Online Menu -> /demo/menu */}
            <Link
              href="/demo/menu"
              style={{
                background: "#ffffff",
                border: "2.5px solid #09090b",
                boxShadow: "4px 4px 0 #ea580c",
              }}
              className="rounded-lg p-5 sm:p-6 no-underline flex flex-col justify-between min-h-[190px] transition-transform active:scale-[0.98]"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">🍕</span>
                  <span
                    style={{
                      background: "#fff7ed",
                      color: "#c2410c",
                      border: "1.5px solid #fed7aa",
                    }}
                    className="text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider"
                  >
                    STOREFRONT DEMO
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-zinc-950 mb-1.5">
                  Customer Online Menu
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed m-0">
                  Interactive menu with pizza toppings, cart drawer, promo code input, and loyalty cash points.
                </p>
              </div>
              <div className="text-xs sm:text-sm font-black text-orange-600 uppercase mt-4 flex items-center justify-between">
                <span>OPEN CUSTOMER MENU</span>
                <span className="text-base">➔</span>
              </div>
            </Link>

            {/* Tile 2: Branch Admin POS -> /demo/pos */}
            <Link
              href="/demo/pos"
              style={{
                background: "#ffffff",
                border: "2.5px solid #09090b",
                boxShadow: "4px 4px 0 #09090b",
              }}
              className="rounded-lg p-5 sm:p-6 no-underline flex flex-col justify-between min-h-[190px] transition-transform active:scale-[0.98]"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">🖥️</span>
                  <span
                    style={{
                      background: "#f1f5f9",
                      color: "#0f172a",
                      border: "1.5px solid #cbd5e1",
                    }}
                    className="text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider"
                  >
                    ADMIN POS DEMO
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-zinc-950 mb-1.5">
                  Branch Admin POS
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed m-0">
                  Full live order board, audio synthesizer chime alerts, menu pricing manager, and daily cash closing.
                </p>
              </div>
              <div className="text-xs sm:text-sm font-black text-zinc-950 uppercase mt-4 flex items-center justify-between">
                <span>OPEN ADMIN POS</span>
                <span className="text-base">➔</span>
              </div>
            </Link>

            {/* Tile 3: Kitchen Display (KDS) -> /demo/kitchen */}
            <Link
              href="/demo/kitchen"
              style={{
                background: "#ffffff",
                border: "2.5px solid #09090b",
                boxShadow: "4px 4px 0 #ea580c",
              }}
              className="rounded-lg p-5 sm:p-6 no-underline flex flex-col justify-between min-h-[190px] transition-transform active:scale-[0.98]"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">🔥</span>
                  <span
                    style={{
                      background: "#fff7ed",
                      color: "#ea580c",
                      border: "1.5px solid #fed7aa",
                    }}
                    className="text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider"
                  >
                    KITCHEN KDS DEMO
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-zinc-950 mb-1.5">
                  Kitchen Display (KDS)
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed m-0">
                  Real-time kitchen display for chefs with stage transitions, live cooking timers, and audio notifications.
                </p>
              </div>
              <div className="text-xs sm:text-sm font-black text-orange-600 uppercase mt-4 flex items-center justify-between">
                <span>OPEN KITCHEN KDS</span>
                <span className="text-base">➔</span>
              </div>
            </Link>

            {/* Tile 4: Live Order Tracker -> /demo/track */}
            <Link
              href="/demo/track"
              style={{
                background: "#ffffff",
                border: "2.5px solid #09090b",
                boxShadow: "4px 4px 0 #09090b",
              }}
              className="rounded-lg p-5 sm:p-6 no-underline flex flex-col justify-between min-h-[190px] transition-transform active:scale-[0.98]"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">📍</span>
                  <span
                    style={{
                      background: "#f0fdf4",
                      color: "#166534",
                      border: "1.5px solid #bbf7d0",
                    }}
                    className="text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider"
                  >
                    TRACKER DEMO
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-zinc-950 mb-1.5">
                  Live Order Tracker
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed m-0">
                  Live customer tracking screen showing preparation timeline, rider details, and real-time audio chimes.
                </p>
              </div>
              <div className="text-xs sm:text-sm font-black text-emerald-700 uppercase mt-4 flex items-center justify-between">
                <span>OPEN ORDER TRACKER</span>
                <span className="text-base">➔</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FULL FEATURE MODULES (RESPONSIVE) ───────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-12 sm:px-6 sm:py-16 md:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <span className="text-xs font-black text-orange-500 uppercase tracking-widest block mb-2">
            ■ COMPLETE ARCHITECTURE BREAKDOWN
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 sm:mb-3">
            Enterprise Modules Included in System
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-zinc-400 max-w-2xl mx-auto">
            Replaces expensive aggregator commissions with direct online ordering, automated WhatsApp dispatching, and full POS control.
          </p>
        </div>

        {/* 1 col on mobile, 2 cols on tablet, 3 cols on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {coreFeatures.map((f) => (
            <div
              key={f.title}
              style={{
                background: "#18181b",
                border: "1.5px solid #27272a",
              }}
              className="rounded-lg p-5 sm:p-6 flex flex-col justify-between gap-3 sm:gap-4 shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl sm:text-3xl">{f.icon}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-zinc-400 font-bold">
                      {f.code}
                    </span>
                    <span
                      style={{
                        background: "rgba(234, 88, 12, 0.15)",
                        border: "1px solid #ea580c",
                      }}
                      className="text-[9px] font-black px-2 py-0.5 rounded text-orange-400 uppercase tracking-wider"
                    >
                      {f.badge}
                    </span>
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-black text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed m-0">
                  {f.desc}
                </p>
              </div>

              <div className="border-t border-zinc-800 pt-3">
                <Link
                  href={f.demoHref}
                  className="text-xs font-extrabold text-orange-500 no-underline inline-flex items-center gap-1 hover:text-orange-400"
                >
                  <span>Test in Sandbox</span>
                  <span>➔</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── DEVELOPER CREDENTIALS & SALES CARD (RESPONSIVE) ──────── */}
      <section className="max-w-4xl mx-auto px-4 pb-16 sm:pb-20">
        <div
          style={{
            background: "#18181b",
            border: "2.5px solid #ea580c",
            boxShadow: "0 10px 30px rgba(234, 88, 12, 0.2)",
          }}
          className="rounded-xl p-6 sm:p-10 md:p-12 text-center"
        >
          {/* Monogram Badge */}
          <div
            style={{
              background: "#ea580c",
              boxShadow: "0 4px 14px rgba(234, 88, 12, 0.4)",
            }}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl text-white inline-flex items-center justify-center text-xl sm:text-2xl font-black mb-4"
          >
            ZH
          </div>

          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
            Want This Full POS &amp; Online Ordering System Setup for Your Brand?
          </h3>
          <p className="text-sm sm:text-base font-black text-orange-500 uppercase tracking-wider mb-4 sm:mb-5">
            Engineered &amp; Sold by: Syed Zeeshan Haider
          </p>

          <p className="text-xs sm:text-sm text-zinc-300 max-w-xl mx-auto mb-6 sm:mb-8 leading-relaxed">
            Complete commercial software handover is available. Includes custom pizza shop branding, custom domain connection, automated WhatsApp API gateway setup, menu configuration, and technical training.
          </p>

          {/* Phone Highlight Box */}
          <div
            style={{
              background: "#09090b",
              border: "1.5px solid #3f3f46",
            }}
            className="inline-flex flex-col gap-1 px-5 py-3 sm:px-7 sm:py-3.5 rounded-lg mb-6 sm:mb-8 max-w-full"
          >
            <span className="text-[10px] sm:text-xs font-extrabold text-orange-500 uppercase tracking-wider">
              Direct Phone / WhatsApp Contact
            </span>
            <span className="text-base sm:text-xl font-black text-white tracking-wide break-words">
              {formattedPhone} &nbsp;•&nbsp; {internationalPhone}
            </span>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full">
            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#ea580c",
                border: "2px solid #ffffff",
                boxShadow: "4px 4px 0 #000000",
              }}
              className="w-full sm:w-auto px-7 py-3.5 rounded-md text-white text-xs sm:text-sm font-black no-underline uppercase tracking-wide inline-flex items-center justify-center gap-2"
            >
              <span className="text-lg">💬</span>
              <span>WhatsApp: {formattedPhone}</span>
            </a>

            <a
              href={phoneCallUrl}
              style={{
                background: "#ffffff",
                border: "2px solid #000000",
                boxShadow: "4px 4px 0 #ea580c",
              }}
              className="w-full sm:w-auto px-7 py-3.5 rounded-md text-black text-xs sm:text-sm font-black no-underline uppercase tracking-wide inline-flex items-center justify-center gap-2"
            >
              <span className="text-lg">📞</span>
              <span>Direct Call: {formattedPhone}</span>
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER (RESPONSIVE) ─────────────────────────────────── */}
      <footer
        style={{
          borderTop: "2px solid #ea580c",
          background: "#000000",
        }}
        className="px-4 py-8 text-center text-xs sm:text-sm text-zinc-400"
      >
        <p className="font-extrabold text-white text-xs sm:text-sm mb-2">
          © {new Date().getFullYear()} Pizza POS &amp; Cloud Kitchen System. Developed &amp; Sold by{" "}
          <strong className="text-orange-500">Syed Zeeshan Haider</strong>.
        </p>
        <p className="font-bold text-orange-400 mb-3">
          Direct Contact / WhatsApp:{" "}
          <a
            href={whatsappInquiryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white underline"
          >
            {formattedPhone}
          </a>{" "}
          ({internationalPhone})
        </p>
        <p className="text-[11px] text-zinc-500 m-0">
          Next.js • Supabase Postgres • Railway WhatsApp Gateway • Realtime KDS • Web Audio Synthesizer
        </p>
      </footer>

      {/* ─── MOBILE STICKY FLOATING QUICK ACTION BAR (SMARTPHONE ONLY) ─── */}
      <div
        style={{
          background: "#09090b",
          borderTop: "2.5px solid #ea580c",
          boxShadow: "0 -4px 15px rgba(0,0,0,0.5)",
        }}
        className="fixed bottom-0 inset-x-0 z-50 md:hidden px-3 py-2 flex items-center justify-around gap-2"
      >
        <Link
          href="#sandbox-modules"
          className="flex-1 bg-zinc-800 text-white border border-zinc-700 py-2 rounded text-xs font-black text-center no-underline inline-flex items-center justify-center gap-1"
        >
          <span>🍕</span>
          <span>Demos</span>
        </Link>

        <a
          href={whatsappInquiryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-emerald-600 text-white py-2 rounded text-xs font-black text-center no-underline inline-flex items-center justify-center gap-1"
        >
          <span>💬</span>
          <span>WhatsApp</span>
        </a>

        <a
          href={phoneCallUrl}
          className="flex-1 bg-orange-600 text-white py-2 rounded text-xs font-black text-center no-underline inline-flex items-center justify-center gap-1"
        >
          <span>📞</span>
          <span>Call Now</span>
        </a>
      </div>
    </div>
  );
}
