"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useTransition } from "react";
import { adminLogout, switchAdminBranch } from "@/lib/admin-actions";
import LiveOrderNotifier from "@/components/admin/LiveOrderNotifier";

interface AdminShellProps {
  children: React.ReactNode;
  shopName?: string;
  shopStatus?: "active" | "suspended" | "master";
  ownerName?: string;
  shopSlug?: string;
  shopId?: number | null;
  availableShops?: { id: number; name: string; slug: string }[];
}

interface NavItem {
  label: string;
  href: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ReactNode;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    groupTitle: "Operations",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="16" rx="1" />
          </svg>
        ),
      },
      {
        label: "Live Orders",
        href: "/admin/orders",
        badge: "LIVE",
        badgeColor: "#ef4444",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
        ),
      },
      {
        label: "Kitchen Display (KDS)",
        href: "/admin/kitchen",
        badge: "KDS",
        badgeColor: "#f97316",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
            <line x1="6" y1="17" x2="18" y2="17" />
          </svg>
        ),
      },
    ],
  },
  {
    groupTitle: "Menu & Store",
    items: [
      {
        label: "Products",
        href: "/admin/products",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
            <path d="M12 22V12" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="m12 12 8.5-5" />
          </svg>
        ),
      },
      {
        label: "Categories",
        href: "/admin/categories",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
            <path d="M7 7h.01" />
          </svg>
        ),
      },
      {
        label: "Table QR Codes",
        href: "/admin/tables",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="5" height="5" x="3" y="3" rx="1" />
            <rect width="5" height="5" x="16" y="3" rx="1" />
            <rect width="5" height="5" x="3" y="16" rx="1" />
            <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
            <path d="M21 21v.01" />
            <path d="M12 7v3a2 2 0 0 1-2 2H7" />
            <path d="M3 12h.01" />
            <path d="M12 3h.01" />
            <path d="M12 16v.01" />
            <path d="M16 12h1" />
            <path d="M21 12v.01" />
            <path d="M12 21v-1" />
          </svg>
        ),
      },
      {
        label: "Coupons & Loyalty",
        href: "/admin/promos",
        badge: "PROMOS",
        badgeColor: "#10b981",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
            <path d="M13 5v2" />
            <path d="M13 17v2" />
            <path d="M13 11v2" />
          </svg>
        ),
      },
    ],
  },
  {
    groupTitle: "Finance & Records",
    items: [
      {
        label: "Daily Closing",
        href: "/admin/closing",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="m9 12 2 2 4-4" />
            <path d="M3 7h18" />
          </svg>
        ),
      },
      {
        label: "Expenses",
        href: "/admin/expenses",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        ),
      },
      {
        label: "Sales Analytics",
        href: "/admin/analytics",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        ),
      },
      {
        label: "Inventory & Stock",
        href: "/admin/inventory",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 12v10" />
          </svg>
        ),
      },
      {
        label: "Shop & Settings",
        href: "/admin/settings",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        ),
      },
    ],
  },
];

export default function AdminShell({
  children,
  shopName,
  shopStatus = "active",
  ownerName,
  shopSlug,
  shopId,
  availableShops = [],
}: AdminShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeBranch, setActiveBranch] = useState<string>(shopName || "Pizza Admin");
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSwitchingBranch, startBranchTransition] = useTransition();

  const handleSelectBranch = (targetShopId: number | null) => {
    startBranchTransition(async () => {
      await switchAdminBranch(targetShopId);
      window.location.reload();
    });
  };

  // Sidebar theme state: "dark" (Obsidian) vs "light" (White)
  const [sidebarTheme, setSidebarTheme] = useState<"dark" | "light">("dark");

  const customerMenuUrl = shopSlug ? `/${shopSlug}` : "/";

  const handleCopyMenu = () => {
    const fullUrl = `${window.location.origin}${customerMenuUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Load saved sidebar theme from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pizza_admin_sidebar_theme");
      if (saved === "light" || saved === "dark") {
        setSidebarTheme(saved);
      }
    } catch {}
  }, []);

  const toggleSidebarTheme = () => {
    const next = sidebarTheme === "dark" ? "light" : "dark";
    setSidebarTheme(next);
    try {
      localStorage.setItem("pizza_admin_sidebar_theme", next);
    } catch {}
  };

  useEffect(() => {
    if (shopName) {
      setActiveBranch(shopName);
      return;
    }
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/pizza_admin_shop_name=([^;]+)/);
      if (match && match[1]) {
        try {
          setActiveBranch(decodeURIComponent(match[1]));
        } catch {
          setActiveBranch(match[1]);
        }
      }
    }
  }, [shopName]);

  // If on login page, render without dashboard sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Derive page heading for top breadcrumb
  let currentPageTitle = "Dashboard Overview";
  for (const group of NAV_GROUPS) {
    const found = group.items.find((i) => i.href === pathname);
    if (found) {
      currentPageTitle = found.label;
      break;
    }
  }

  const isLight = sidebarTheme === "light";

  return (
    <div
      style={{
        zoom: 0.8,
        display: "flex",
        minHeight: "125vh",
        background: "#f1f5f9",
        color: "#0f172a",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
      }}
    >
      <style>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        @keyframes subtleGlow {
          0%, 100% { box-shadow: 0 0 12px rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.7); }
        }
        .admin-nav-item-dark:hover {
          background: rgba(255, 255, 255, 0.06) !important;
          color: #ffffff !important;
        }
        .admin-nav-item-dark:hover svg {
          color: #fb923c !important;
        }
        .admin-nav-item-light:hover {
          background: #f1f5f9 !important;
          color: #0f172a !important;
        }
        .admin-nav-item-light:hover svg {
          color: #ea580c !important;
        }
      `}</style>

      {/* ─── SIDEBAR (Desktop: Dark Obsidian or Light White) ────────────────────────────── */}
      <aside
        style={{
          width: "260px",
          background: isLight ? "#ffffff" : "linear-gradient(180deg, #0b0f19 0%, #080c14 100%)",
          borderRight: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.07)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "125vh",
          zIndex: 40,
          boxShadow: isLight ? "2px 0 10px rgba(0, 0, 0, 0.04)" : "4px 0 24px rgba(0, 0, 0, 0.35)",
          transition: "background 0.25s ease, border-color 0.25s ease",
        }}
        className="hidden md:flex"
      >
        {/* Brand Header */}
        <div
          style={{
            padding: "20px 18px",
            borderBottom: isLight ? "1px solid #f1f5f9" : "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 4px 14px rgba(239, 68, 68, 0.45)",
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 11h.01" />
              <path d="M11 15h.01" />
              <path d="M16 16h.01" />
              <path d="m2 16 20 6-6-20A20 20 0 0 0 2 16Z" />
            </svg>
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontWeight: 900,
                fontSize: "15px",
                color: isLight ? "#0f172a" : "#ffffff",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {activeBranch}
            </div>
            <div style={{ fontSize: "11px", color: "#16a34a", display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, marginTop: "2px" }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#16a34a",
                  display: "inline-block",
                  boxShadow: "0 0 8px #16a34a",
                  animation: "pulseDot 2s infinite ease-in-out",
                }}
              />
              <span>Live Terminal</span>
            </div>

            {availableShops.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <select
                  value={shopId ? String(shopId) : ""}
                  disabled={isSwitchingBranch}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleSelectBranch(val ? parseInt(val, 10) : null);
                  }}
                  style={{
                    width: "100%",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    background: isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.08)",
                    color: isLight ? "#0f172a" : "#f8fafc",
                    border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255, 255, 255, 0.15)",
                    fontSize: "11px",
                    fontWeight: 700,
                    outline: "none",
                    cursor: "pointer",
                  }}
                  title="Switch Active Store Branch"
                >
                  <option value="" style={{ color: "#0f172a", background: "#fff" }}>🌐 Master Store (All / Global)</option>
                  {availableShops.map((s) => (
                    <option key={s.id} value={s.id} style={{ color: "#0f172a", background: "#fff" }}>
                      🏪 {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Grouped Navigation */}
        <nav
          style={{
            padding: "16px 12px",
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {NAV_GROUPS.map((group) => (
            <div key={group.groupTitle}>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: isLight ? "#94a3b8" : "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "0 10px 6px",
                }}
              >
                {group.groupTitle}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={isLight ? "admin-nav-item-light" : "admin-nav-item-dark"}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "9px 12px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: isActive ? 700 : 500,
                        textDecoration: "none",
                        color: isActive
                          ? isLight ? "#dc2626" : "#ffffff"
                          : isLight ? "#475569" : "#94a3b8",
                        background: isActive
                          ? isLight
                            ? "#fef2f2"
                            : "linear-gradient(90deg, rgba(239, 68, 68, 0.22) 0%, rgba(249, 115, 22, 0.1) 100%)"
                          : "transparent",
                        borderLeft: isActive
                          ? "3px solid #ef4444"
                          : "3px solid transparent",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span
                          style={{
                            color: isActive
                              ? isLight ? "#dc2626" : "#f97316"
                              : isLight ? "#64748b" : "#64748b",
                            display: "flex",
                          }}
                        >
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: item.badgeColor
                              ? isLight ? `${item.badgeColor}18` : `${item.badgeColor}22`
                              : isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.1)",
                            color: item.badgeColor || (isLight ? "#475569" : "#ffffff"),
                            border: `1px solid ${item.badgeColor || (isLight ? "#cbd5e1" : "rgba(255,255,255,0.2)")}`,
                            letterSpacing: "0.04em",
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Actions Widget */}
        <div
          style={{
            padding: "14px 14px",
            borderTop: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            background: isLight ? "#f8fafc" : "rgba(0, 0, 0, 0.2)",
          }}
        >
          {/* Theme Toggle Pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 10px",
              borderRadius: "6px",
              background: isLight ? "#ffffff" : "rgba(255, 255, 255, 0.05)",
              border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 700, color: isLight ? "#64748b" : "#94a3b8" }}>
              Sidebar Theme
            </span>
            <button
              type="button"
              onClick={toggleSidebarTheme}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 9px",
                borderRadius: "4px",
                background: isLight ? "#0f172a" : "#ffffff",
                color: isLight ? "#ffffff" : "#0f172a",
                fontSize: "11px",
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
              }}
            >
              <span>{isLight ? "☀️ White" : "🌙 Dark"}</span>
              <span style={{ fontSize: "9px", opacity: 0.7 }}>Toggle</span>
            </button>
          </div>

          {/* Customer Menu Link Card */}
          <div
            style={{
              padding: "10px 12px",
              background: isLight ? "#f0fdf4" : "rgba(16, 185, 129, 0.08)",
              borderRadius: "6px",
              border: isLight ? "1px solid #bbf7d0" : "1px solid rgba(16, 185, 129, 0.25)",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: isLight ? "#16a34a" : "#34d399",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Live Customer Menu
              </span>
              <button
                type="button"
                onClick={handleCopyMenu}
                style={{
                  background: "transparent",
                  border: "none",
                  color: copiedLink
                    ? isLight ? "#16a34a" : "#34d399"
                    : isLight ? "#15803d" : "#6ee7b7",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  padding: 0,
                }}
                title="Copy live customer menu link"
              >
                {copiedLink ? "✓ Copied!" : "Copy Link"}
              </button>
            </div>

            <Link
              href={customerMenuUrl}
              target="_blank"
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: isLight ? "#15803d" : "#a7f3d0",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "4px",
              }}
              title="Open shop customer menu in new tab"
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {customerMenuUrl}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </Link>
          </div>

          <form action={adminLogout}>
            <button
              type="submit"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "8px 12px",
                borderRadius: "6px",
                background: isLight ? "#fef2f2" : "rgba(239, 68, 68, 0.12)",
                color: "#dc2626",
                fontSize: "12px",
                fontWeight: 700,
                border: isLight ? "1px solid #fecaca" : "1px solid rgba(239, 68, 68, 0.3)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign Out Terminal</span>
            </button>
          </form>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: "125vh" }}>
        {/* Desktop Top Header Bar */}
        <header
          style={{
            height: "60px",
            background: "#ffffff",
            borderBottom: "1px solid #e2e8f0",
            display: "none",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            position: "sticky",
            top: 0,
            zIndex: 30,
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          }}
          className="md:flex"
        >
          {/* Breadcrumb & Section Name */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>Admin Portal</span>
            <span style={{ color: "#cbd5e1", fontSize: "14px" }}>/</span>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
              {currentPageTitle}
            </span>

            {/* Quick Branch Switcher in Top Bar */}
            {availableShops.length > 0 && (
              <div style={{ position: "relative", marginLeft: "10px" }}>
                <select
                  value={shopId ? String(shopId) : ""}
                  disabled={isSwitchingBranch}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleSelectBranch(val ? parseInt(val, 10) : null);
                  }}
                  style={{
                    padding: "4px 26px 4px 10px",
                    borderRadius: "16px",
                    background: shopId ? "#eff6ff" : "#f1f5f9",
                    color: shopId ? "#1d4ed8" : "#334155",
                    border: shopId ? "1.5px solid #bfdbfe" : "1.5px solid #cbd5e1",
                    fontSize: "12px",
                    fontWeight: 700,
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none",
                  }}
                  title="Switch Active Store Branch"
                >
                  <option value="">🌐 Master Store (All Branches)</option>
                  {availableShops.map((s) => (
                    <option key={s.id} value={s.id}>
                      🏪 {s.name} (#{s.id})
                    </option>
                  ))}
                </select>
                <div style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: shopId ? "#3b82f6" : "#64748b" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions & Status Tools */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Quick Sidebar Theme Toggle in Top Bar */}
            <button
              type="button"
              onClick={toggleSidebarTheme}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                borderRadius: "20px",
                background: isLight ? "#f1f5f9" : "#0f172a",
                color: isLight ? "#0f172a" : "#ffffff",
                border: "1px solid #cbd5e1",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Toggle sidebar white/dark theme"
            >
              <span>{isLight ? "☀️ White Sidebar" : "🌙 Dark Sidebar"}</span>
              <span style={{ fontSize: "10px", opacity: 0.6 }}>Switch</span>
            </button>

            {/* Live Audio Status Pill */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 10px",
                borderRadius: "20px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                fontSize: "11px",
                fontWeight: 700,
                color: "#16a34a",
              }}
              title="Real-time order sound alerts active"
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#16a34a",
                  boxShadow: "0 0 6px #16a34a",
                }}
              />
              <span>Audio Chime Active</span>
            </div>

            {/* Quick Kitchen Display button */}
            <Link
              href="/admin/kitchen"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "5px",
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                fontSize: "12px",
                fontWeight: 700,
                color: "#c2410c",
                textDecoration: "none",
              }}
            >
              <span>🔥</span>
              <span>Kitchen KDS</span>
            </Link>

            {/* Preview Live Menu button */}
            <Link
              href={customerMenuUrl}
              target="_blank"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "5px",
                background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 2px 6px rgba(239, 68, 68, 0.25)",
              }}
            >
              <span>🌐</span>
              <span>Open Customer Menu</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </Link>

            {/* User Profile Pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 8px 4px 4px",
                borderRadius: "20px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "#0f172a",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 800,
                }}
              >
                POS
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>
                Manager
              </span>
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header
          style={{
            height: "56px",
            borderBottom: isLight ? "1px solid #e2e8f0" : "1px solid #1e293b",
            background: isLight ? "#ffffff" : "#0b0f19",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
          }}
          className="md:hidden"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 16 20 6-6-20A20 20 0 0 0 2 16Z" />
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: "14px", color: isLight ? "#0f172a" : "#ffffff" }}>
              {activeBranch}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              onClick={toggleSidebarTheme}
              style={{
                background: isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.1)",
                border: "none",
                fontSize: "14px",
                padding: "6px 8px",
                borderRadius: "5px",
                cursor: "pointer",
              }}
              title="Toggle Theme"
            >
              {isLight ? "🌙" : "☀️"}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.08)",
                border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255, 255, 255, 0.15)",
                color: isLight ? "#0f172a" : "#ffffff",
                padding: "6px 8px",
                borderRadius: "5px",
                cursor: "pointer",
              }}
              aria-label="Toggle Navigation Menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </header>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div
            style={{
              background: isLight ? "#ffffff" : "#0b0f19",
              borderBottom: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.1)",
              padding: "16px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            className="md:hidden"
          >
            {NAV_GROUPS.flatMap((g) => g.items).map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    color: isActive
                      ? isLight ? "#dc2626" : "#ffffff"
                      : isLight ? "#475569" : "#94a3b8",
                    background: isActive
                      ? isLight ? "#fef2f2" : "rgba(239, 68, 68, 0.2)"
                      : "transparent",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 800,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: item.badgeColor ? `${item.badgeColor}22` : "rgba(255, 255, 255, 0.1)",
                        color: item.badgeColor || (isLight ? "#475569" : "#ffffff"),
                        border: `1px solid ${item.badgeColor || "rgba(255,255,255,0.2)"}`,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <div style={{ paddingTop: "12px", borderTop: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.1)", display: "flex", gap: "8px" }}>
              <Link
                href={customerMenuUrl}
                target="_blank"
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "9px",
                  borderRadius: "5px",
                  background: isLight ? "#f0fdf4" : "rgba(16, 185, 129, 0.15)",
                  border: isLight ? "1px solid #bbf7d0" : "1px solid rgba(16, 185, 129, 0.3)",
                  color: isLight ? "#16a34a" : "#34d399",
                  fontSize: "12px",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                Open Live Menu
              </Link>
              <form action={adminLogout} style={{ flex: 1 }}>
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "9px",
                    borderRadius: "5px",
                    background: isLight ? "#fef2f2" : "rgba(239, 68, 68, 0.15)",
                    color: "#dc2626",
                    fontSize: "12px",
                    border: isLight ? "1px solid #fecaca" : "1px solid rgba(239, 68, 68, 0.3)",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Realtime Live Order Notifications */}
        <LiveOrderNotifier shopId={shopId} />

        {/* Content Body */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "32px 36px",
            maxWidth: "1440px",
            width: "100%",
            margin: "0 auto",
            boxSizing: "border-box",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
