import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pizza POS & Online Ordering Suite | By Syed Zeeshan Haider",
  description:
    "Enterprise-grade restaurant & pizza POS system with automated WhatsApp notifications, live customer tracking, chef kitchen display (KDS), loyalty cash rewards, and multi-branch management. Built by Syed Zeeshan Haider.",
};

export default function SquareUIProfessionalPage() {
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
      }}
    >
      {/* ─── TOP NOTICE BANNER ────────────────────────────────────── */}
      <div
        style={{
          background: "#ea580c",
          color: "#ffffff",
          padding: "8px 16px",
          textAlign: "center",
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "0.04em",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <span>⚡ INTERACTIVE SANDBOX DEMO LIVE:</span>
        <span style={{ textDecoration: "underline" }}>
          Test Customer Storefront, Branch POS, Kitchen KDS, and Live Tracker instantly without login!
        </span>
        <Link
          href="#sandbox-modules"
          style={{
            background: "#09090b",
            color: "#ffffff",
            padding: "2px 8px",
            borderRadius: 3,
            fontSize: 11,
            textDecoration: "none",
            fontWeight: 900,
            textTransform: "uppercase",
          }}
        >
          Explore Sandbox ↓
        </Link>
      </div>

      {/* ─── ORANGE / WHITE / BLACK NAVBAR ────────────────────────── */}
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
        <div
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {/* Logo & Identity */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 6,
                background: "#ea580c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: 22,
                boxShadow: "0 2px 10px rgba(234, 88, 12, 0.5)",
              }}
            >
              🍕
            </div>
            <div>
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 900,
                  color: "#ffffff",
                  letterSpacing: "-0.02em",
                  display: "block",
                }}
              >
                PIZZA POS &amp; CLOUD SUITE
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "#ea580c",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                By Syed Zeeshan Haider
              </span>
            </div>
          </Link>

          {/* Quick Header Navigation Links & Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="#sandbox-modules"
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#ffedd5",
                textDecoration: "none",
                padding: "8px 12px",
                borderRadius: 4,
                background: "rgba(234, 88, 12, 0.15)",
                border: "1px solid #ea580c",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span>🎮</span>
              <span>Live Demos</span>
            </Link>

            <a
              href={phoneCallUrl}
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#000000",
                textDecoration: "none",
                padding: "8px 12px",
                borderRadius: 4,
                background: "#ffffff",
                border: "1.5px solid #ffffff",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 2px 0 #cbd5e1",
              }}
            >
              <span>📞</span>
              <span>{formattedPhone}</span>
            </a>

            <Link
              href="/demo/pos"
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: "#ffffff",
                textDecoration: "none",
                padding: "8px 14px",
                borderRadius: 4,
                background: "#ea580c",
                border: "1.5px solid #ea580c",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                boxShadow: "0 2px 0 #9a3412",
              }}
            >
              Interactive POS Demo ➔
            </Link>

            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 4,
                background: "#15803d",
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 800,
                textDecoration: "none",
                border: "1.5px solid #166534",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                boxShadow: "0 2px 0 #14532d",
              }}
            >
              <span>💬</span>
              <span>WhatsApp: {formattedPhone}</span>
            </a>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION (HIGH IMPACT ORANGE / WHITE / BLACK) ────── */}
      <section
        style={{
          background: "radial-gradient(ellipse at top, rgba(234, 88, 12, 0.22) 0%, rgba(9, 9, 11, 1) 68%)",
          borderBottom: "2px solid #27272a",
          padding: "70px 20px 60px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: 1040, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 2 }}>
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 99,
              background: "rgba(234, 88, 12, 0.15)",
              border: "1.5px solid #ea580c",
              color: "#fb923c",
              fontSize: 11,
              fontWeight: 900,
              marginBottom: 24,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <span>■</span>
            <span>ENTERPRISE RESTAURANT &amp; PIZZA SOFTWARE SUITE</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(32px, 5.8vw, 56px)",
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              margin: "0 auto 20px",
            }}
          >
            Complete Pizza POS,{" "}
            <span style={{ color: "#ea580c", textDecoration: "underline", textDecorationColor: "rgba(234,88,12,0.4)" }}>
              Online Ordering
            </span>{" "}
            &amp; WhatsApp Automation System
          </h1>

          <p
            style={{
              fontSize: "clamp(15px, 2.2vw, 18px)",
              color: "#d4d4d8",
              maxWidth: 780,
              margin: "0 auto 36px",
              lineHeight: 1.6,
            }}
          >
            A high-performance digital ordering and POS platform built for pizza outlets, burger joints, and cloud kitchens.
            Equipped with automated WhatsApp receipts, rider dispatch alerts, real-time live order tracking, chef kitchen display (KDS), table QR codes, and loyalty cash rewards.
          </p>

          {/* Primary Action Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 14,
              flexWrap: "wrap",
              marginBottom: 44,
            }}
          >
            <Link
              href="#sandbox-modules"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "15px 28px",
                borderRadius: 6,
                background: "#ea580c",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 900,
                textDecoration: "none",
                border: "2px solid #ffffff",
                boxShadow: "4px 4px 0 #000000",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              <span>🍕</span>
              <span>Launch Live Demo Sandbox ➔</span>
            </Link>

            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "15px 26px",
                borderRadius: 6,
                background: "#ffffff",
                color: "#000000",
                fontSize: 14,
                fontWeight: 900,
                textDecoration: "none",
                border: "2px solid #000000",
                boxShadow: "4px 4px 0 #ea580c",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              <span>💬</span>
              <span>WhatsApp Syed Zeeshan ({formattedPhone})</span>
            </a>

            <a
              href={phoneCallUrl}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "15px 24px",
                borderRadius: 6,
                background: "#18181b",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 800,
                textDecoration: "none",
                border: "2px solid #3f3f46",
                boxShadow: "4px 4px 0 #000000",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              <span>📞</span>
              <span>Direct Call: {formattedPhone}</span>
            </a>
          </div>

          {/* Architectural Metrics Bar (Orange & Black High Contrast) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              maxWidth: 920,
              margin: "0 auto",
            }}
          >
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
                  borderRadius: 6,
                  padding: "12px 14px",
                  textAlign: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "#a1a1aa",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                  }}
                >
                  {m.label}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 900,
                    color: m.color,
                    marginTop: 3,
                    display: "block",
                  }}
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
          padding: "54px 20px 60px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: 26,
              flexWrap: "wrap",
              gap: 14,
              borderBottom: "2px solid #09090b",
              paddingBottom: 16,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: "#ea580c", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  ■ LIVE FUNCTIONAL MODULES
                </span>
                <span
                  style={{
                    background: "#ea580c",
                    color: "#ffffff",
                    fontSize: 10,
                    fontWeight: 900,
                    padding: "2px 6px",
                    borderRadius: 3,
                  }}
                >
                  NO LOGIN NEEDED
                </span>
              </div>
              <h2 style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 900, color: "#09090b", margin: "4px 0 0" }}>
                Interactive Live System Sandbox
              </h2>
            </div>
            <span style={{ fontSize: 13, color: "#ea580c", fontWeight: 800 }}>
              ⚡ Click any tile below to launch live simulated demo:
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 20,
            }}
          >
            {/* Tile 1: Customer Online Menu -> /demo/menu */}
            <Link
              href="/demo/menu"
              style={{
                background: "#ffffff",
                border: "2.5px solid #09090b",
                borderRadius: 6,
                padding: "22px 20px",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "5px 5px 0 #ea580c",
                minHeight: 180,
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 30 }}>🍕</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 900,
                      background: "#fff7ed",
                      color: "#c2410c",
                      border: "1.5px solid #fed7aa",
                      padding: "3px 8px",
                      borderRadius: 3,
                      letterSpacing: "0.04em",
                    }}
                  >
                    STOREFRONT DEMO
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: "#09090b", margin: "0 0 8px" }}>
                  Customer Online Menu
                </h3>
                <p style={{ fontSize: 13, color: "#475569", margin: 0, lineHeight: 1.5 }}>
                  Interactive menu with pizza toppings, cart drawer, promo code input, and loyalty cash points.
                </p>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: "#ea580c",
                  marginTop: 18,
                  textTransform: "uppercase",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>OPEN CUSTOMER MENU</span>
                <span style={{ fontSize: 16 }}>➔</span>
              </div>
            </Link>

            {/* Tile 2: Branch Admin POS -> /demo/pos */}
            <Link
              href="/demo/pos"
              style={{
                background: "#ffffff",
                border: "2.5px solid #09090b",
                borderRadius: 6,
                padding: "22px 20px",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "5px 5px 0 #09090b",
                minHeight: 180,
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 30 }}>🖥️</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 900,
                      background: "#f1f5f9",
                      color: "#0f172a",
                      border: "1.5px solid #cbd5e1",
                      padding: "3px 8px",
                      borderRadius: 3,
                      letterSpacing: "0.04em",
                    }}
                  >
                    ADMIN POS DEMO
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: "#09090b", margin: "0 0 8px" }}>
                  Branch Admin POS
                </h3>
                <p style={{ fontSize: 13, color: "#475569", margin: 0, lineHeight: 1.5 }}>
                  Full live order board, audio synthesizer chime alerts, menu pricing manager, and daily cash closing.
                </p>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: "#09090b",
                  marginTop: 18,
                  textTransform: "uppercase",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>OPEN ADMIN POS</span>
                <span style={{ fontSize: 16 }}>➔</span>
              </div>
            </Link>

            {/* Tile 3: Kitchen Display (KDS) -> /demo/kitchen */}
            <Link
              href="/demo/kitchen"
              style={{
                background: "#ffffff",
                border: "2.5px solid #09090b",
                borderRadius: 6,
                padding: "22px 20px",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "5px 5px 0 #ea580c",
                minHeight: 180,
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 30 }}>🔥</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 900,
                      background: "#fff7ed",
                      color: "#ea580c",
                      border: "1.5px solid #fed7aa",
                      padding: "3px 8px",
                      borderRadius: 3,
                      letterSpacing: "0.04em",
                    }}
                  >
                    KITCHEN KDS DEMO
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: "#09090b", margin: "0 0 8px" }}>
                  Kitchen Display (KDS)
                </h3>
                <p style={{ fontSize: 13, color: "#475569", margin: 0, lineHeight: 1.5 }}>
                  Real-time kitchen display for chefs with stage transitions, live cooking timers, and audio notifications.
                </p>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: "#ea580c",
                  marginTop: 18,
                  textTransform: "uppercase",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>OPEN KITCHEN KDS</span>
                <span style={{ fontSize: 16 }}>➔</span>
              </div>
            </Link>

            {/* Tile 4: Live Order Tracker -> /demo/track */}
            <Link
              href="/demo/track"
              style={{
                background: "#ffffff",
                border: "2.5px solid #09090b",
                borderRadius: 6,
                padding: "22px 20px",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "5px 5px 0 #09090b",
                minHeight: 180,
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 30 }}>📍</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 900,
                      background: "#f0fdf4",
                      color: "#166534",
                      border: "1.5px solid #bbf7d0",
                      padding: "3px 8px",
                      borderRadius: 3,
                      letterSpacing: "0.04em",
                    }}
                  >
                    TRACKER DEMO
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: "#09090b", margin: "0 0 8px" }}>
                  Live Order Tracker
                </h3>
                <p style={{ fontSize: 13, color: "#475569", margin: 0, lineHeight: 1.5 }}>
                  Live customer tracking screen showing preparation timeline, rider details, and real-time audio chimes.
                </p>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: "#166534",
                  marginTop: 18,
                  textTransform: "uppercase",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>OPEN ORDER TRACKER</span>
                <span style={{ fontSize: 16 }}>➔</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FULL FEATURE MODULES (ORANGE / BLACK / WHITE) ───────── */}
      <section
        style={{
          background: "#09090b",
          color: "#ffffff",
          maxWidth: 1240,
          margin: "0 auto",
          padding: "60px 20px 70px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: "#ea580c", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            ■ COMPLETE ARCHITECTURE BREAKDOWN
          </span>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 900, color: "#ffffff", margin: "6px 0 10px" }}>
            Enterprise Modules Included in System
          </h2>
          <p style={{ fontSize: 15, color: "#a1a1aa", maxWidth: 680, margin: "0 auto" }}>
            Replaces expensive aggregator commissions with direct online ordering, automated WhatsApp dispatching, and full POS control.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 18,
          }}
        >
          {coreFeatures.map((f) => (
            <div
              key={f.title}
              style={{
                background: "#18181b",
                border: "1.5px solid #27272a",
                borderRadius: 6,
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 14,
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 28 }}>{f.icon}</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontFamily: "monospace", color: "#a1a1aa", fontWeight: 700 }}>
                      {f.code}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 900,
                        padding: "3px 8px",
                        borderRadius: 3,
                        background: "rgba(234, 88, 12, 0.15)",
                        color: "#fb923c",
                        border: "1px solid #ea580c",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {f.badge}
                    </span>
                  </div>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 900, color: "#ffffff", margin: "0 0 8px" }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6, margin: 0 }}>
                  {f.desc}
                </p>
              </div>

              <div style={{ borderTop: "1px solid #27272a", paddingTop: 12 }}>
                <Link
                  href={f.demoHref}
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#ea580c",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span>Test in Sandbox</span>
                  <span>➔</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── DEVELOPER CREDENTIALS & SALES CARD ─────────────────── */}
      <section
        style={{
          background: "#09090b",
          maxWidth: 1000,
          margin: "0 auto 80px",
          padding: "0 20px",
        }}
      >
        <div
          style={{
            background: "#18181b",
            border: "2.5px solid #ea580c",
            borderRadius: 8,
            padding: "48px 30px",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(234, 88, 12, 0.2)",
          }}
        >
          {/* Monogram Badge */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 8,
              background: "#ea580c",
              color: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 900,
              marginBottom: 18,
              boxShadow: "0 4px 14px rgba(234, 88, 12, 0.4)",
            }}
          >
            ZH
          </div>

          <h3 style={{ fontSize: "clamp(22px, 3.5vw, 30px)", fontWeight: 900, color: "#ffffff", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Want This Full POS &amp; Online Ordering System Setup for Your Brand?
          </h3>
          <p style={{ fontSize: 16, fontWeight: 900, color: "#ea580c", margin: "0 0 18px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Engineered &amp; Sold by: Syed Zeeshan Haider
          </p>

          <p
            style={{
              fontSize: 14,
              color: "#d4d4d8",
              maxWidth: 680,
              margin: "0 auto 28px",
              lineHeight: 1.6,
            }}
          >
            Complete commercial software handover is available. Includes custom pizza shop branding, custom domain connection, automated WhatsApp API gateway setup, menu configuration, and technical training.
          </p>

          {/* Phone Highlight Box */}
          <div
            style={{
              display: "inline-flex",
              flexDirection: "column",
              gap: 4,
              background: "#09090b",
              border: "1.5px solid #3f3f46",
              borderRadius: 6,
              padding: "14px 28px",
              marginBottom: 32,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 800, color: "#ea580c", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Direct Phone / WhatsApp Contact
            </span>
            <span style={{ fontSize: 22, fontWeight: 900, color: "#ffffff", letterSpacing: "0.02em" }}>
              {formattedPhone} &nbsp;•&nbsp; {internationalPhone}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 32px",
                borderRadius: 6,
                background: "#ea580c",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 900,
                textDecoration: "none",
                border: "2px solid #ffffff",
                boxShadow: "4px 4px 0 #000000",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              <span style={{ fontSize: 20 }}>💬</span>
              <span>WhatsApp: {formattedPhone}</span>
            </a>

            <a
              href={phoneCallUrl}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 30px",
                borderRadius: 6,
                background: "#ffffff",
                color: "#000000",
                fontSize: 14,
                fontWeight: 900,
                textDecoration: "none",
                border: "2px solid #000000",
                boxShadow: "4px 4px 0 #ea580c",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              <span style={{ fontSize: 20 }}>📞</span>
              <span>Direct Call: {formattedPhone}</span>
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER (ORANGE / BLACK / WHITE) ────────────────────── */}
      <footer
        style={{
          borderTop: "2px solid #ea580c",
          background: "#000000",
          padding: "36px 20px",
          textAlign: "center",
          fontSize: 12,
          color: "#a1a1aa",
        }}
      >
        <p style={{ margin: "0 0 8px", fontWeight: 800, color: "#ffffff", fontSize: 14 }}>
          © {new Date().getFullYear()} Pizza POS &amp; Cloud Kitchen System. Developed &amp; Sold by{" "}
          <strong style={{ color: "#ea580c" }}>Syed Zeeshan Haider</strong>.
        </p>
        <p style={{ margin: "0 0 12px", fontWeight: 700, color: "#fb923c" }}>
          Direct Contact / WhatsApp:{" "}
          <a
            href={whatsappInquiryUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#ffffff", textDecoration: "underline" }}
          >
            {formattedPhone}
          </a>{" "}
          ({internationalPhone})
        </p>
        <p style={{ margin: 0, color: "#71717a", fontSize: 11 }}>
          Next.js • Supabase Postgres • Railway WhatsApp Gateway • Realtime KDS • Web Audio Synthesizer
        </p>
      </footer>
    </div>
  );
}
