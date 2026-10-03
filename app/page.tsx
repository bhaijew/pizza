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
      border: "#fed7aa",
      bg: "#fff7ed",
      badgeColor: "#c2410c",
    },
    {
      code: "MOD-02",
      icon: "💬",
      title: "Automated WhatsApp Gateway",
      desc: "Instantly sends branded WhatsApp receipts to customers and dispatch alerts to delivery riders with destination address, customer phone, and cash to collect.",
      badge: "AUTOMATION",
      border: "#bbf7d0",
      bg: "#f0fdf4",
      badgeColor: "#15803d",
    },
    {
      code: "MOD-03",
      icon: "📍",
      title: "Real-Time Live Order Tracker",
      desc: "Dedicated tracking URL (/track/[orderId]) featuring a 4-stage kitchen-to-doorstep timeline, dynamic elapsed timers, and synthetic Web Audio chimes.",
      badge: "LIVE TRACKING",
      border: "#bfdbfe",
      bg: "#eff6ff",
      badgeColor: "#1d4ed8",
    },
    {
      code: "MOD-04",
      icon: "🎟️",
      title: "Promo Codes & Discount Engine",
      desc: "Create percentage or flat discount voucher codes (e.g. WELCOME20, FLAT100, PIZZA500) with minimum order values, expiry dates, and usage limits.",
      badge: "MARKETING",
      border: "#ddd6fe",
      bg: "#f5f3ff",
      badgeColor: "#6d28d9",
    },
    {
      code: "MOD-05",
      icon: "🪙",
      title: "Customer Loyalty Cash Engine",
      desc: "Automatic repeat customer phone lookup. Customers earn 1 cash point per Rs. 50 spent (2% cashback) with 1-click bill deduction.",
      badge: "RETENTION",
      border: "#fde68a",
      bg: "#fffbeb",
      badgeColor: "#b45309",
    },
    {
      code: "MOD-06",
      icon: "👨‍🍳",
      title: "Chef Kitchen Display System (KDS)",
      desc: "Live kitchen display for cooks with cooking stages, preparation timers, and instant synthetic audio chimes on new incoming orders.",
      badge: "KITCHEN KDS",
      border: "#fed7aa",
      bg: "#fff7ed",
      badgeColor: "#c2410c",
    },
    {
      code: "MOD-07",
      icon: "🛵",
      title: "Delivery Rider Dispatch System",
      desc: "1-click rider assignment on live order cards with automated WhatsApp dispatch messages containing destination, customer contact, and bill total.",
      badge: "DISPATCH",
      border: "#bfdbfe",
      bg: "#eff6ff",
      badgeColor: "#1d4ed8",
    },
    {
      code: "MOD-08",
      icon: "🖨️",
      title: "Table QR Code Dine-In Ordering",
      desc: "Generates digital QR codes for dine-in tables with anti-fraud token verification and dedicated dedicated table-locked checkout links.",
      badge: "TABLE POS",
      border: "#a7f3d0",
      bg: "#ecfdf5",
      badgeColor: "#047857",
    },
    {
      code: "MOD-09",
      icon: "📊",
      title: "Daily Register Closing & Expenses",
      desc: "End-of-day register closing summaries, categorized expense tracking, dine-in vs delivery revenue breakdown, and net profit calculations.",
      badge: "FINANCIALS",
      border: "#e2e8f0",
      bg: "#f8fafc",
      badgeColor: "#334155",
    },
    {
      code: "MOD-10",
      icon: "🏢",
      title: "Multi-Branch & Tenant Architecture",
      desc: "One single platform deployment can host unlimited branches or separate pizza brands with independent menus, settings, and staff credentials.",
      badge: "MULTI-BRANCH",
      border: "#fecaca",
      bg: "#fef2f2",
      badgeColor: "#b91c1c",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        color: "#0f172a",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
        lineHeight: 1.5,
      }}
    >
      {/* ─── SQUARE NAVBAR ────────────────────────────────────────── */}
      <header
        style={{
          borderBottom: "1.5px solid #0f172a",
          background: "#ffffff",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 3,
                background: "#0f172a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: 18,
              }}
            >
              🍕
            </div>
            <div>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em", display: "block" }}>
                PIZZA POS &amp; CLOUD SUITE
              </span>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                By Syed Zeeshan Haider
              </span>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <a
              href={phoneCallUrl}
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#0f172a",
                textDecoration: "none",
                padding: "8px 12px",
                borderRadius: 3,
                background: "#f8fafc",
                border: "1.5px solid #cbd5e1",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>📞</span>
              <span>{formattedPhone}</span>
            </a>

            <Link
              href="/admin/login"
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#0f172a",
                textDecoration: "none",
                padding: "8px 14px",
                borderRadius: 3,
                background: "#ffffff",
                border: "1.5px solid #0f172a",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              Branch POS Login
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
                borderRadius: 3,
                background: "#15803d",
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 800,
                textDecoration: "none",
                border: "1.5px solid #166534",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              <span>💬</span>
              <span>WhatsApp: {formattedPhone}</span>
            </a>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION (SQUARE ARCHITECTURAL UI) ───────────────── */}
      <section
        style={{
          background: "#ffffff",
          borderBottom: "1.5px solid #e2e8f0",
          padding: "60px 20px 54px",
        }}
      >
        <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
          {/* Square Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 12px",
              borderRadius: 3,
              background: "#0f172a",
              color: "#ffffff",
              fontSize: 11,
              fontWeight: 800,
              marginBottom: 20,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            <span>■</span>
            <span>ENTERPRISE RESTAURANT &amp; PIZZA SOFTWARE SUITE</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(30px, 5.4vw, 52px)",
              fontWeight: 900,
              color: "#0f172a",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              margin: "0 auto 18px",
            }}
          >
            Complete Pizza POS, Online Ordering &amp; WhatsApp Automation System
          </h1>

          <p
            style={{
              fontSize: "clamp(15px, 2.2vw, 18px)",
              color: "#475569",
              maxWidth: 760,
              margin: "0 auto 34px",
              lineHeight: 1.6,
            }}
          >
            A high-performance digital ordering and POS platform built for pizza outlets, burger joints, and cloud kitchens.
            Equipped with automated WhatsApp receipts, rider dispatch alerts, real-time live order tracking, chef kitchen display (KDS), table QR codes, and loyalty cash rewards.
          </p>

          {/* Primary Action Buttons (Square UI) */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 40,
            }}
          >
            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 26px",
                borderRadius: 4,
                background: "#15803d",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 800,
                textDecoration: "none",
                border: "1.5px solid #166534",
                boxShadow: "0 4px 0 #14532d",
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
                padding: "14px 24px",
                borderRadius: 4,
                background: "#0f172a",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 800,
                textDecoration: "none",
                border: "1.5px solid #000000",
                boxShadow: "0 4px 0 #334155",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              <span>📞</span>
              <span>Direct Call: {formattedPhone}</span>
            </a>

            <Link
              href="/admin/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 22px",
                borderRadius: 4,
                background: "#ffffff",
                color: "#0f172a",
                fontSize: 14,
                fontWeight: 800,
                textDecoration: "none",
                border: "1.5px solid #0f172a",
                boxShadow: "0 4px 0 #cbd5e1",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              <span>🖥️</span>
              <span>Live POS Demo ➔</span>
            </Link>
          </div>

          {/* Architectural Metrics Bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              maxWidth: 880,
              margin: "0 auto",
            }}
          >
            {[
              { label: "Turnkey Codebase", value: "Ready to Deploy" },
              { label: "Architecture", value: "Multi-Tenant Cloud" },
              { label: "Mobile Experience", value: "100% Responsive" },
              { label: "Database Engine", value: "Supabase Postgres" },
            ].map((m) => (
              <div
                key={m.label}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: 3,
                  padding: "10px 14px",
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>
                  {m.label}
                </span>
                <span style={{ fontSize: 13, fontWeight: 900, color: "#0f172a", marginTop: 2, display: "block" }}>
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LIVE SYSTEM SANDBOX (4 SQUARE TILES) ──────────────────── */}
      <section
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          padding: "48px 20px 24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#ea580c", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              ■ LIVE FUNCTIONAL MODULES
            </span>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: "4px 0 0" }}>
              Interactive Live System Sandbox
            </h2>
          </div>
          <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
            Click any tile to test live system
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {/* Tile 1: Customer Online Menu */}
          <Link
            href="/menu/main"
            style={{
              background: "#ffffff",
              border: "1.5px solid #0f172a",
              borderRadius: 4,
              padding: "20px 18px",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 4px 0 #0f172a",
              minHeight: 160,
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 24 }}>🍕</span>
                <span style={{ fontSize: 10, fontWeight: 800, background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa", padding: "2px 6px", borderRadius: 2 }}>
                  STOREFRONT
                </span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: "0 0 6px" }}>
                Customer Online Menu
              </h3>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.4 }}>
                Interactive menu with pizza toppings, cart drawer, promo code input, and loyalty cash points.
              </p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 900, color: "#ea580c", marginTop: 12, textTransform: "uppercase" }}>
              Open Customer Menu ➔
            </span>
          </Link>

          {/* Tile 2: Branch Admin POS */}
          <Link
            href="/admin/login"
            style={{
              background: "#ffffff",
              border: "1.5px solid #0f172a",
              borderRadius: 4,
              padding: "20px 18px",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 4px 0 #0f172a",
              minHeight: 160,
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 24 }}>🖥️</span>
                <span style={{ fontSize: 10, fontWeight: 800, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", padding: "2px 6px", borderRadius: 2 }}>
                  ADMIN POS
                </span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: "0 0 6px" }}>
                Branch Admin POS
              </h3>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.4 }}>
                Full live order board, audio synthesizer chime alerts, menu pricing manager, and daily cash closing.
              </p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 900, color: "#0284c7", marginTop: 12, textTransform: "uppercase" }}>
              Open Admin POS ➔
            </span>
          </Link>

          {/* Tile 3: Kitchen Display System (KDS) */}
          <Link
            href="/kitchen"
            style={{
              background: "#ffffff",
              border: "1.5px solid #0f172a",
              borderRadius: 4,
              padding: "20px 18px",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 4px 0 #0f172a",
              minHeight: 160,
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 24 }}>🔥</span>
                <span style={{ fontSize: 10, fontWeight: 800, background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa", padding: "2px 6px", borderRadius: 2 }}>
                  KITCHEN KDS
                </span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: "0 0 6px" }}>
                Kitchen Display (KDS)
              </h3>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.4 }}>
                Real-time kitchen display for chefs with stage transitions, live cooking timers, and audio notifications.
              </p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 900, color: "#ea580c", marginTop: 12, textTransform: "uppercase" }}>
              Open Kitchen KDS ➔
            </span>
          </Link>

          {/* Tile 4: Live Order Tracker */}
          <Link
            href="/track"
            style={{
              background: "#ffffff",
              border: "1.5px solid #0f172a",
              borderRadius: 4,
              padding: "20px 18px",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 4px 0 #0f172a",
              minHeight: 160,
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 24 }}>📍</span>
                <span style={{ fontSize: 10, fontWeight: 800, background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", padding: "2px 6px", borderRadius: 2 }}>
                  TRACKER
                </span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: "0 0 6px" }}>
                Live Order Tracker
              </h3>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.4 }}>
                Live customer tracking screen showing preparation timeline, rider details, and real-time audio chimes.
              </p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 900, color: "#059669", marginTop: 12, textTransform: "uppercase" }}>
              Open Order Tracker ➔
            </span>
          </Link>
        </div>
      </section>

      {/* ─── FULL FEATURE MODULES (SQUARE UI GRID) ──────────────── */}
      <section
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          padding: "40px 20px 60px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            ■ COMPLETE ARCHITECTURE BREAKDOWN
          </span>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 900, color: "#0f172a", margin: "4px 0 8px" }}>
            Enterprise Modules Included in System
          </h2>
          <p style={{ fontSize: 14, color: "#64748b", maxWidth: 640, margin: "0 auto" }}>
            Replaces expensive aggregator commissions with direct online ordering, automated WhatsApp dispatching, and full POS control.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {coreFeatures.map((f) => (
            <div
              key={f.title}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 4,
                padding: "22px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 24 }}>{f.icon}</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontFamily: "monospace", color: "#64748b", fontWeight: 700 }}>
                      {f.code}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 900,
                        padding: "2px 6px",
                        borderRadius: 2,
                        background: f.bg,
                        color: f.badgeColor,
                        border: `1px solid ${f.border}`,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {f.badge}
                    </span>
                  </div>
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", margin: "0 0 6px" }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── DEVELOPER CREDENTIALS & SALES CARD ─────────────────── */}
      <section
        style={{
          maxWidth: 960,
          margin: "0 auto 70px",
          padding: "0 20px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "2px solid #0f172a",
            borderRadius: 4,
            padding: "44px 30px",
            textAlign: "center",
            boxShadow: "0 8px 0 #0f172a",
          }}
        >
          {/* Monogram Badge */}
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 4,
              background: "#0f172a",
              color: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 900,
              marginBottom: 16,
              letterSpacing: "0.05em",
            }}
          >
            ZH
          </div>

          <h3 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Want This Full POS &amp; Online Ordering System Setup for Your Brand?
          </h3>
          <p style={{ fontSize: 16, fontWeight: 800, color: "#ea580c", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Engineered &amp; Sold by: Syed Zeeshan Haider
          </p>

          <p
            style={{
              fontSize: 14,
              color: "#475569",
              maxWidth: 640,
              margin: "0 auto 24px",
              lineHeight: 1.6,
            }}
          >
            Complete commercial software handover is available. Includes custom pizza shop branding, custom domain connection, automated WhatsApp API gateway setup, menu configuration, and technical training.
          </p>

          {/* Square Phone Highlight Box */}
          <div
            style={{
              display: "inline-flex",
              flexDirection: "column",
              gap: 4,
              background: "#f8fafc",
              border: "1.5px solid #cbd5e1",
              borderRadius: 4,
              padding: "12px 24px",
              marginBottom: 28,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Direct Phone / WhatsApp Contact
            </span>
            <span style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", letterSpacing: "0.02em" }}>
              {formattedPhone} &nbsp;•&nbsp; {internationalPhone}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
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
                padding: "14px 30px",
                borderRadius: 4,
                background: "#15803d",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 900,
                textDecoration: "none",
                border: "1.5px solid #166534",
                boxShadow: "0 4px 0 #14532d",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              <span style={{ fontSize: 18 }}>💬</span>
              <span>WhatsApp: {formattedPhone}</span>
            </a>

            <a
              href={phoneCallUrl}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 28px",
                borderRadius: 4,
                background: "#0f172a",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 900,
                textDecoration: "none",
                border: "1.5px solid #000000",
                boxShadow: "0 4px 0 #334155",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              <span style={{ fontSize: 18 }}>📞</span>
              <span>Direct Call: {formattedPhone}</span>
            </a>
          </div>
        </div>
      </section>

      {/* ─── SQUARE FOOTER ──────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1.5px solid #0f172a",
          background: "#ffffff",
          padding: "32px 20px",
          textAlign: "center",
          fontSize: 12,
          color: "#475569",
        }}
      >
        <p style={{ margin: "0 0 6px", fontWeight: 800, color: "#0f172a", fontSize: 13 }}>
          © {new Date().getFullYear()} Pizza POS &amp; Cloud Kitchen System. Developed &amp; Sold by <strong>Syed Zeeshan Haider</strong>.
        </p>
        <p style={{ margin: "0 0 10px", fontWeight: 700, color: "#15803d" }}>
          Direct Contact / WhatsApp:{" "}
          <a
            href={whatsappInquiryUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#15803d", textDecoration: "underline" }}
          >
            {formattedPhone}
          </a>{" "}
          ({internationalPhone})
        </p>
        <p style={{ margin: 0, color: "#94a3b8", fontSize: 11 }}>
          Next.js • Supabase Postgres • Railway WhatsApp Gateway • Realtime KDS • Web Audio Synthesizer
        </p>
      </footer>
    </div>
  );
}
