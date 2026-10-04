"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface DemoNavProps {
  currentModule: "menu" | "pos" | "kitchen" | "track";
}

export default function DemoNav({ currentModule }: DemoNavProps) {
  const pathname = usePathname();

  const modules = [
    { id: "menu", label: "🍕 Menu", fullLabel: "🍕 Customer Menu", href: "/demo/menu" },
    { id: "pos", label: "🖥️ POS", fullLabel: "🖥️ Admin POS", href: "/demo/pos" },
    { id: "kitchen", label: "🔥 KDS", fullLabel: "🔥 Kitchen KDS", href: "/demo/kitchen" },
    { id: "track", label: "📍 Tracker", fullLabel: "📍 Live Tracker", href: "/demo/track" },
  ];

  return (
    <div
      style={{
        background: "#09090b",
        borderBottom: "2px solid #ea580c",
        padding: "8px 12px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {/* Left: Home Button & Sandbox Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: 900,
              color: "#ffffff",
              background: "#ea580c",
              padding: "5px 10px",
              borderRadius: 4,
              textDecoration: "none",
              textTransform: "uppercase",
              boxShadow: "0 2px 0 #9a3412",
              whiteSpace: "nowrap",
            }}
          >
            <span>←</span>
            <span>Home</span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span
              style={{
                display: "inline-block",
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 6px #22c55e",
              }}
            />
            <span
              style={{
                color: "#ffedd5",
                fontSize: 11,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
              }}
            >
              Demo Sandbox
            </span>
          </div>
        </div>

        {/* Right: Quick Module Switcher (Horizontal scroll on mobile) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            paddingBottom: 2,
            maxWidth: "100%",
          }}
        >
          {modules.map((m) => {
            const isActive = currentModule === m.id || pathname === m.href;
            return (
              <Link
                key={m.id}
                href={m.href}
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textDecoration: "none",
                  padding: "5px 9px",
                  borderRadius: 4,
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  background: isActive ? "#ffffff" : "#18181b",
                  color: isActive ? "#09090b" : "#e4e4e7",
                  border: isActive ? "1.5px solid #ffffff" : "1.5px solid #27272a",
                  boxShadow: isActive ? "0 2px 0 #ea580c" : "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span>{m.fullLabel}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
