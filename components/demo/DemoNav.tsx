"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface DemoNavProps {
  currentModule: "menu" | "pos" | "kitchen" | "track";
}

export default function DemoNav({ currentModule }: DemoNavProps) {
  const pathname = usePathname();

  const modules = [
    { id: "menu", label: "🍕 Customer Menu", href: "/demo/menu", desc: "Storefront & Cart" },
    { id: "pos", label: "🖥️ Admin POS", href: "/demo/pos", desc: "Order Management" },
    { id: "kitchen", label: "🔥 Kitchen KDS", href: "/demo/kitchen", desc: "Chef Display Screen" },
    { id: "track", label: "📍 Live Tracker", href: "/demo/track", desc: "Customer Tracking" },
  ];

  return (
    <div
      style={{
        background: "#09090b",
        borderBottom: "2px solid #ea580c",
        padding: "10px 16px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {/* Left: Badge & Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 800,
              color: "#ffffff",
              background: "#ea580c",
              padding: "6px 12px",
              borderRadius: 4,
              textDecoration: "none",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
              boxShadow: "0 2px 0 #9a3412",
            }}
          >
            <span>←</span>
            <span>Back to Home</span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 8px #22c55e",
                animation: "pulse 2s infinite",
              }}
            />
            <span
              style={{
                color: "#ffedd5",
                fontSize: 12,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Interactive Demo Sandbox
            </span>
            <span
              style={{
                background: "rgba(234, 88, 12, 0.2)",
                color: "#fb923c",
                border: "1px solid #ea580c",
                fontSize: 10,
                fontWeight: 800,
                padding: "2px 6px",
                borderRadius: 3,
              }}
            >
              Zero Login Required
            </span>
          </div>
        </div>

        {/* Right: Quick Module Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#a1a1aa", fontWeight: 700, marginRight: 4 }}>
            Switch Module:
          </span>
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
                  padding: "6px 10px",
                  borderRadius: 4,
                  transition: "all 0.15s ease",
                  background: isActive ? "#ffffff" : "#18181b",
                  color: isActive ? "#09090b" : "#e4e4e7",
                  border: isActive ? "1.5px solid #ffffff" : "1.5px solid #27272a",
                  boxShadow: isActive ? "0 2px 0 #ea580c" : "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span>{m.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
