"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { adminLogout, switchAdminStaffRole } from "@/lib/admin-actions";
import LiveOrderNotifier from "@/components/admin/LiveOrderNotifier";
import BrandLogo from "@/components/BrandLogo";
import {
  LayoutDashboard,
  ShoppingBag,
  ChefHat,
  Pizza,
  Tags,
  QrCode,
  TicketPercent,
  FileText,
  Coins,
  BarChart3,
  Boxes,
  Settings,
  Sun,
  Moon,
  LogOut,
  ExternalLink,
  Copy,
  Check,
  Volume2,
  ShieldCheck,
  Store,
  Flame,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  Clock,
  MessageSquare,
  Users,
  Lock,
  Search,
  Download,
  Bike,
} from "lucide-react";
import NavigationProgressBar from "@/components/admin/NavigationProgressBar";
import SoleWhatLogo from "@/components/SoleWhatLogo";
import { BusinessType, BUSINESS_THEMES, BusinessTheme } from "@/lib/business-themes";

const LayoutIcon = ({ className, size = 16 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M3 9h18" />
    <path d="M9 21V9" />
  </svg>
);

const Palette = ({ className, size = 16 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
);

const SoleWhatNavIcon = ({ className, size = 18 }: { className?: string; size?: number }) => (
  <SoleWhatLogo size={size} variant="shield" showGlow={false} className={className} />
);

interface AdminShellProps {
  children: React.ReactNode;
  shopName?: string;
  shopStatus?: "active" | "suspended" | "master";
  ownerName?: string;
  shopSlug?: string;
  shopId?: number | null;
  availableShops?: { id: number; name: string; slug: string }[];
  userRole?: "admin" | "sub_admin" | "staff";
  staffName?: string;
  canCancelOrders?: boolean;
  logoUrl?: string | null;
  businessType?: BusinessType;
}

interface NavItem {
  label: string;
  href: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
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
        icon: LayoutDashboard,
      },
      {
        label: "Live Orders",
        href: "/admin/orders",
        badge: "LIVE",
        badgeColor: "#ef4444",
        icon: ShoppingBag,
      },
      {
        label: "Kitchen Display (KDS)",
        href: "/admin/kitchen",
        badge: "KDS",
        badgeColor: "#f97316",
        icon: ChefHat,
      },
      {
        label: "Sole-What",
        href: "/admin/sole-what",
        badge: "WA BOT",
        badgeColor: "#10b981",
        icon: SoleWhatNavIcon,
      },
      {
        label: "Delivery Riders",
        href: "/admin/riders",
        badge: "RIDERS",
        badgeColor: "#059669",
        icon: Bike,
      },
    ],
  },
  {
    groupTitle: "Menu & Store",
    items: [
      {
        label: "Products",
        href: "/admin/products",
        icon: Pizza,
      },
      {
        label: "Categories",
        href: "/admin/categories",
        icon: Tags,
      },
      {
        label: "Special Deals",
        href: "/admin/deals",
        badge: "DEALS",
        badgeColor: "#ea580c",
        icon: Sparkles,
      },
      {
        label: "Table QR Codes",
        href: "/admin/tables",
        icon: QrCode,
      },
      {
        label: "Coupons & Loyalty",
        href: "/admin/promos",
        badge: "PROMOS",
        badgeColor: "#10b981",
        icon: TicketPercent,
      },
      {
        label: "Menu UI & Theme",
        href: "/admin/menu-ui",
        badge: "UI",
        badgeColor: "#7c3aed",
        icon: Palette,
      },
      {
        label: "Store Logo & Branding",
        href: "/admin/menu-layout",
        badge: "LOGO",
        badgeColor: "#ec4899",
        icon: LayoutIcon,
      },
    ],
  },
  {
    groupTitle: "Finance & Records",
    items: [
      {
        label: "Daily Closing",
        href: "/admin/closing",
        icon: FileText,
      },
      {
        label: "Order Lookup",
        href: "/admin/order-lookup",
        badge: "ORD-",
        badgeColor: "#0284c7",
        icon: Search,
      },
      {
        label: "Expenses",
        href: "/admin/expenses",
        icon: Coins,
      },
      {
        label: "Sales Analytics",
        href: "/admin/analytics",
        icon: BarChart3,
      },
      {
        label: "Recipe & Inventory",
        href: "/admin/inventory",
        badge: "BOM",
        badgeColor: "#8b5cf6",
        icon: Boxes,
      },
      {
        label: "Staff & Sub-Admins",
        href: "/admin/staff",
        badge: "ROLES",
        badgeColor: "#3b82f6",
        icon: Users,
      },
      {
        label: "Shop & Settings",
        href: "/admin/settings",
        icon: Settings,
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
  userRole = "admin",
  staffName = "Shop Admin",
  canCancelOrders = true,
  logoUrl,
  businessType = "fast_food",
}: AdminShellProps) {
  const theme: BusinessTheme =
    BUSINESS_THEMES[businessType || "fast_food"] || BUSINESS_THEMES.fast_food;
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeBranch, setActiveBranch] = useState<string>(shopName || "Pizza Admin");
  const [copiedLink, setCopiedLink] = useState(false);
  const [sidebarTheme, setSidebarTheme] = useState<"dark" | "light">("dark");
  const [roleSwitching, setRoleSwitching] = useState(false);
  const [navigatingHref, setNavigatingHref] = useState<string | null>(null);

  // Clear link loading state when route transition completes
  useEffect(() => {
    setNavigatingHref(null);
  }, [pathname]);

  const isAdmin = userRole === "admin";

  // Restrict Finance & Records to Super Admin / Shop Admin only (hidden from sub_admin & staff)
  const visibleNavGroups: NavGroup[] = useMemo(() => {
    return NAV_GROUPS.filter((group) => {
      if (group.groupTitle === "Finance & Records" && userRole !== "admin") {
        return false;
      }
      return true;
    });
  }, [userRole]);

  const handleRoleSwitch = async (targetRole: "admin" | "sub_admin" | "staff") => {
    setRoleSwitching(true);
    try {
      await switchAdminStaffRole(targetRole);
      window.location.reload();
    } catch {
      setRoleSwitching(false);
    }
  };

  const customerMenuUrl = shopSlug ? `/${shopSlug}` : "/";
  const kdsUrl = shopSlug ? `/${shopSlug}/kitchen` : "/kitchen";

  const [pakistanTime, setPakistanTime] = useState<string>("");
  const [pakistanDate, setPakistanDate] = useState<string>("");

  useEffect(() => {
    const updatePKTime = () => {
      const now = new Date();
      setPakistanTime(
        now.toLocaleTimeString("en-US", {
          timeZone: "Asia/Karachi",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setPakistanDate(
        now.toLocaleDateString("en-US", {
          timeZone: "Asia/Karachi",
          weekday: "short",
          day: "numeric",
          month: "short",
        })
      );
    };

    updatePKTime();
    const interval = setInterval(updatePKTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyMenu = () => {
    let fullUrl = `${window.location.origin}${customerMenuUrl}`;
    if (shopSlug && typeof window !== "undefined" && window.location.hostname.includes("solewhat.store")) {
      fullUrl = `https://${shopSlug}.solewhat.store`;
    }
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

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
    <>
      <NavigationProgressBar />
      <div
      className="admin-shell-root min-h-screen w-full flex flex-col md:flex-row"
      style={{
        minHeight: "100vh",
        background: isLight
          ? isAdmin
            ? "#fffdf8"
            : "#f8fafc"
          : isAdmin
          ? "#0b0e17"
          : "#070e17",
        color: isLight ? "#0f172a" : "#f8fafc",
        borderTop: `3px solid ${theme.primary}`,
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
        transition: "background 0.25s ease",
      }}
    >
      <style>{`
        :root {
          --admin-theme-primary: ${theme.primary};
          --admin-theme-hover: ${theme.primaryHover};
          --admin-theme-glow: ${theme.primaryGlow};
          --admin-theme-light: ${theme.primaryLight};
          --admin-theme-border: ${theme.primaryBorder};
          --admin-theme-dark: ${theme.primaryDark};
          --admin-theme-gradient: ${theme.gradient};
          --admin-theme-badge-bg: ${theme.badgeBg};
          --admin-theme-badge-text: ${theme.badgeText};
          --admin-theme-badge-border: ${theme.badgeBorder};
          --admin-theme-sidebar-active: ${theme.sidebarActiveBg};
        }

        @media (max-width: 767px) {
          .admin-desktop-sidebar {
            display: none !important;
          }
          .admin-desktop-header {
            display: none !important;
          }
          .admin-mobile-header {
            display: flex !important;
          }
          .admin-shell-root {
            min-height: 100vh !important;
            min-height: 100dvh !important;
          }
          .admin-main-wrapper {
            min-height: 100vh !important;
            min-height: 100dvh !important;
          }
        }
        @media (min-width: 768px) {
          .admin-desktop-sidebar {
            display: grid !important;
            grid-template-rows: auto 1fr auto !important;
            height: 125vh !important;
            max-height: 125vh !important;
            position: sticky !important;
            top: 0 !important;
            overflow: hidden !important;
          }
          .admin-desktop-header {
            display: flex !important;
          }
          .admin-mobile-header {
            display: none !important;
          }
          .admin-shell-root {
            min-height: 100vh !important;
          }
          .admin-main-wrapper {
            min-height: 100vh !important;
          }
        }

        .admin-nav-link {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 12px;
          border-radius: 5px;
          font-size: 13px;
          text-decoration: none;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .admin-nav-dark-default {
          color: #94a3b8;
        }
        .admin-nav-dark-default:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.06);
          transform: translateX(3px);
        }
        .admin-nav-dark-default:hover .nav-icon {
          color: var(--admin-theme-hover) !important;
          transform: scale(1.08);
        }
        .admin-nav-dark-active {
          color: #ffffff !important;
          background: var(--admin-theme-sidebar-active) !important;
          font-weight: 700;
          box-shadow: inset 0 0 0 1px var(--admin-theme-badge-border) !important;
        }
        .admin-nav-dark-active::before {
          content: "";
          position: absolute;
          left: 0;
          top: 6px;
          bottom: 6px;
          width: 3px;
          border-radius: 4px;
          background: var(--admin-theme-primary) !important;
          box-shadow: 0 0 8px var(--admin-theme-primary) !important;
        }

        .admin-nav-light-default {
          color: #475569;
        }
        .admin-nav-light-default:hover {
          color: #0f172a;
          background: #f1f5f9;
          transform: translateX(3px);
        }
        .admin-nav-light-default:hover .nav-icon {
          color: var(--admin-theme-primary) !important;
          transform: scale(1.08);
        }
        .admin-nav-light-active {
          color: var(--admin-theme-primary) !important;
          background: var(--admin-theme-light) !important;
          font-weight: 700;
          box-shadow: inset 0 0 0 1px var(--admin-theme-border) !important;
        }
        .admin-nav-light-active::before {
          content: "";
          position: absolute;
          left: 0;
          top: 6px;
          bottom: 6px;
          width: 3px;
          border-radius: 4px;
          background: var(--admin-theme-primary) !important;
        }

        .nav-icon {
          transition: transform 0.18s ease, color 0.18s ease;
        }
      `}</style>

      {/* ─── SIDEBAR (Desktop Only) ────────────────────────────── */}
      <aside
        style={{
          width: "264px",
          background: isLight
            ? "#ffffff"
            : "linear-gradient(180deg, #0e1526 0%, #090d18 100%)",
          borderRight: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)",
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "125vh",
          maxHeight: "125vh",
          overflow: "hidden",
          zIndex: 40,
          boxShadow: isLight ? "2px 0 16px rgba(0, 0, 0, 0.03)" : "4px 0 28px rgba(0, 0, 0, 0.45)",
          transition: "background 0.25s ease, border-color 0.25s ease",
        }}
        className="admin-desktop-sidebar hidden md:flex"
      >
        {/* Brand Header */}
        <div
          style={{
            padding: "16px 16px",
            borderBottom: isLight ? "1px solid #f1f5f9" : "1px solid rgba(255, 255, 255, 0.07)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={activeBranch}
              style={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                objectFit: "cover",
                border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255, 255, 255, 0.18)",
                background: "#ffffff",
                flexShrink: 0,
                boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
              }}
            />
          ) : (
            <BrandLogo size={36} variant="iconOnly" />
          )}

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: "13px",
                color: isLight ? "#0f172a" : "#ffffff",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {activeBranch}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: 700,
                marginTop: "3px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#10b981",
                    display: "inline-block",
                  }}
                  className="admin-pulse-green"
                />
                <span>Live Terminal</span>
              </div>

              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 900,
                  padding: "1px 6px",
                  borderRadius: "5px",
                  background: isAdmin ? "rgba(245, 158, 11, 0.2)" : "rgba(16, 185, 129, 0.2)",
                  color: isAdmin ? "#fde047" : "#6ee7b7",
                  border: `1px solid ${isAdmin ? "rgba(245, 158, 11, 0.4)" : "rgba(16, 185, 129, 0.4)"}`,
                  letterSpacing: "0.03em",
                }}
              >
                {isAdmin ? "👑 ADMIN" : "👤 STAFF"}
              </span>
            </div>

            <div style={{ marginTop: "5px" }}>
              <span
                style={{
                  fontSize: "9.5px",
                  fontWeight: 800,
                  padding: "2px 7px",
                  borderRadius: "4px",
                  background: theme.badgeBg,
                  color: theme.badgeText,
                  border: `1px solid ${theme.badgeBorder}`,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  letterSpacing: "0.02em",
                }}
              >
                <span>{theme.accentEmoji}</span>
                <span>{theme.name}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Grouped Navigation */}
        <nav
          style={{
            padding: "16px 12px",
            minHeight: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
          className="admin-sidebar-scroll"
        >
          {visibleNavGroups.map((group) => (
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

              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href));
                  const isNavigating = navigatingHref === item.href;
                  const IconComponent = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        if (item.href !== pathname) {
                          setNavigatingHref(item.href);
                        }
                      }}
                      className={`admin-nav-link ${
                        isActive
                          ? isLight
                            ? "admin-nav-light-active"
                            : "admin-nav-dark-active"
                          : isLight
                          ? "admin-nav-light-default"
                          : "admin-nav-dark-default"
                      } ${isNavigating ? "opacity-80 scale-[0.98]" : ""}`}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span
                          className="nav-icon"
                          style={{
                            color: isActive
                              ? isLight
                                ? theme.primary
                                : theme.primaryHover
                              : isLight
                              ? "#64748b"
                              : "#94a3b8",
                            display: "flex",
                          }}
                        >
                          <IconComponent size={18} />
                        </span>
                        <span>{item.label}</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {isNavigating && (
                          <span className="nav-link-spinner shrink-0" title="Loading..." />
                        )}
                        {item.badge && !isNavigating && (
                          <span
                            style={{
                              fontSize: "9px",
                              fontWeight: 800,
                              padding: "2px 6px",
                              borderRadius: "5px",
                              background: item.badgeColor
                                ? isLight
                                  ? `${item.badgeColor}18`
                                  : `${item.badgeColor}22`
                                : isLight
                                ? "#f1f5f9"
                                : "rgba(255, 255, 255, 0.1)",
                              color: item.badgeColor || (isLight ? "#475569" : "#ffffff"),
                              border: `1px solid ${
                                item.badgeColor || (isLight ? "#cbd5e1" : "rgba(255,255,255,0.2)")
                              }`,
                              letterSpacing: "0.04em",
                            }}
                            className={item.badge === "LIVE" ? "admin-badge-live" : ""}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
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
            padding: "8px 10px 0",
            borderTop: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            background: isLight ? "#f8fafc" : "rgba(0, 0, 0, 0.22)",
          }}
        >
          {/* Direct POS App Download (No Popup) */}
          <a
            href="/release/Sole%20What%20Setup%201.6.2.exe"
            download="Sole What Setup 1.6.2.exe"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "7px 10px",
              borderRadius: "6px",
              background: isLight ? "#f0fdf4" : "rgba(16, 185, 129, 0.15)",
              border: isLight ? "1px solid #bbf7d0" : "1px solid rgba(16, 185, 129, 0.35)",
              color: isLight ? "#16a34a" : "#34d399",
              fontSize: "11px",
              fontWeight: 800,
              textDecoration: "none",
              transition: "all 0.15s ease",
            }}
            className="hover:opacity-90"
            title="Download FloDesktop POS Setup 1.6.2.exe (Direct Download)"
          >
            <Download size={13} />
            <span>Download POS App (1.6.2)</span>
          </a>

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleSidebarTheme}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "7px 10px",
              borderRadius: "6px",
              background: isLight ? "#ffffff" : "rgba(255, 255, 255, 0.06)",
              border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255, 255, 255, 0.12)",
              color: isLight ? "#0f172a" : "#f8fafc",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Toggle Dark / Light Theme"
          >
            {isLight ? <Moon size={13} className="text-amber-500" /> : <Sun size={13} className="text-amber-400" />}
            <span>{isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}</span>
          </button>

          {/* Small Logout Button */}
          <form action={adminLogout} style={{ width: "100%", margin: 0, padding: 0 }}>
            <button
              type="submit"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "6px 10px",
                borderRadius: "6px",
                background: isLight ? "#fef2f2" : "rgba(239, 68, 68, 0.1)",
                color: "#dc2626",
                fontSize: "11px",
                fontWeight: 700,
                border: isLight ? "1px solid #fecaca" : "1px solid rgba(239, 68, 68, 0.25)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              className="hover:opacity-90"
              title="Sign Out Terminal"
            >
              <LogOut size={12} />
              <span>Sign Out Terminal</span>
            </button>
          </form>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ────────────────────────────── */}
      <div className="admin-main-wrapper w-full min-w-0 flex-1 flex flex-col" style={{ minWidth: 0, minHeight: "100vh" }}>
        {/* Desktop Top Header Bar */}
        <header
          style={{
            height: "54px",
            minHeight: "54px",
            background: isLight ? "rgba(255, 255, 255, 0.92)" : "rgba(14, 21, 38, 0.88)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)",
            display: "none",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            position: "sticky",
            top: 0,
            zIndex: 30,
            boxShadow: isLight ? "0 1px 3px rgba(0, 0, 0, 0.03)" : "0 4px 16px rgba(0, 0, 0, 0.25)",
            transition: "all 0.2s ease",
          }}
          className="admin-desktop-header md:flex"
        >
          {/* Breadcrumb & Section Name */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "nowrap", overflow: "hidden", minWidth: 0 }}>
            <span
              style={{
                fontSize: "12.5px",
                color: isLight ? "#64748b" : "#94a3b8",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "5px",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <Store size={13} />
              Admin Portal
            </span>
            <ChevronRight size={13} style={{ color: isLight ? "#cbd5e1" : "#475569", flexShrink: 0 }} />
            <span
              style={{
                fontSize: "13.5px",
                fontWeight: 800,
                color: isLight ? "#0f172a" : "#ffffff",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {currentPageTitle}
            </span>

            {shopName && (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: isLight ? "#1d4ed8" : "#93c5fd",
                  background: isLight ? "#eff6ff" : "rgba(59, 130, 246, 0.15)",
                  border: isLight ? "1px solid #bfdbfe" : "1px solid rgba(59, 130, 246, 0.35)",
                  borderRadius: "6px",
                  padding: "2px 7px",
                  marginLeft: "6px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "160px",
                  flexShrink: 0,
                }}
              >
                <Store size={11} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {shopName}
                </span>
              </span>
            )}

            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: theme.badgeText,
                background: theme.badgeBg,
                border: `1px solid ${theme.badgeBorder}`,
                borderRadius: "6px",
                padding: "2px 8px",
                marginLeft: "6px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <span>{theme.accentEmoji}</span>
              <span>{theme.name}</span>
            </span>
          </div>

          {/* Quick Actions & Status Tools */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexShrink: 0,
              flexWrap: "nowrap",
            }}
          >
            {/* Live Pakistan Standard Time (PKT) Widget */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "5px 12px",
                borderRadius: "20px",
                background: isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.06)",
                border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255, 255, 255, 0.12)",
                color: isLight ? "#0f172a" : "#ffffff",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
              title="Live Pakistan Standard Time (PKT / UTC+5, Asia/Karachi)"
            >
              <div
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 8px #10b981",
                  flexShrink: 0,
                }}
              />
              <Clock size={13} className="text-emerald-500" style={{ flexShrink: 0 }} />
              <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
                <span style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 800, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
                  {pakistanTime || "Loading..."}
                </span>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                    color: "#ffffff",
                    padding: "2px 5px",
                    borderRadius: "4px",
                    letterSpacing: "0.05em",
                    whiteSpace: "nowrap",
                  }}
                >
                  PKT
                </span>
              </div>
            </div>

            {/* Live Audio Status Pill */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 10px",
                borderRadius: "5px",
                background: isLight ? "#f0fdf4" : "rgba(16, 185, 129, 0.12)",
                border: isLight ? "1px solid #bbf7d0" : "1px solid rgba(16, 185, 129, 0.3)",
                fontSize: "11.5px",
                fontWeight: 700,
                color: isLight ? "#16a34a" : "#34d399",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
              title="Real-time order sound alerts active"
            >
              <Volume2 size={13} className="text-emerald-500" style={{ flexShrink: 0 }} />
              <span>Audio Active</span>
            </div>

            {/* Direct Download FloDesktop POS Setup Button (No Popup) */}
            <a
              href="/release/Sole%20What%20Setup%201.6.2.exe"
              download="Sole What Setup 1.6.2.exe"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 11px",
                borderRadius: "5px",
                background: isLight ? "#f0fdf4" : "rgba(16, 185, 129, 0.15)",
                border: isLight ? "1px solid #bbf7d0" : "1px solid rgba(16, 185, 129, 0.35)",
                fontSize: "11.5px",
                fontWeight: 800,
                color: isLight ? "#16a34a" : "#34d399",
                textDecoration: "none",
                transition: "all 0.15s ease",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
              className="hover:scale-105"
              title="Download FloDesktop POS Setup 1.6.2.exe (Direct Download)"
            >
              <Download size={13} style={{ flexShrink: 0 }} />
              <span>Download POS</span>
            </a>

            {/* Quick Kitchen Display button */}
            <Link
              href={kdsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 11px",
                borderRadius: "5px",
                background: isLight ? "#fff7ed" : "rgba(249, 115, 22, 0.15)",
                border: isLight ? "1px solid #fed7aa" : "1px solid rgba(249, 115, 22, 0.3)",
                fontSize: "11.5px",
                fontWeight: 700,
                color: isLight ? "#c2410c" : "#fdba74",
                textDecoration: "none",
                transition: "all 0.15s ease",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
              className="hover:scale-105"
              title="Open Live Kitchen Display Screen (KDS) in New Tab"
            >
              <ChefHat size={13} style={{ flexShrink: 0 }} />
              <span>Kitchen KDS</span>
              <ExternalLink size={10} style={{ opacity: 0.7 }} />
            </Link>

            {/* Preview Live Menu button */}
            <Link
              href={customerMenuUrl}
              target="_blank"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 12px",
                borderRadius: "5px",
                background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
                color: "#ffffff",
                fontSize: "11.5px",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
                transition: "transform 0.15s ease",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
              className="hover:scale-105"
            >
              <Store size={13} style={{ flexShrink: 0 }} />
              <span>Customer Menu</span>
              <ExternalLink size={11} style={{ flexShrink: 0 }} />
            </Link>

            {/* ─── ROLE SELECTOR (Admin only) & ACTIVE PROFILE BADGE ─── */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
              {/* Quick Role Switcher for Admin preview (Hidden for Staff/Cashier) */}
              {isAdmin && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    background: isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.08)",
                    padding: "2px",
                    borderRadius: "8px",
                    border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255, 255, 255, 0.12)",
                    flexShrink: 0,
                  }}
                  title="Switch between Shop Master Admin and Staff / Sub-Admin view"
                >
                  <button
                    type="button"
                    disabled={roleSwitching}
                    onClick={() => handleRoleSwitch("admin")}
                    style={{
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 800,
                      cursor: "pointer",
                      border: "none",
                      background: isAdmin ? "linear-gradient(135deg, #f59e0b, #d97706)" : "transparent",
                      color: isAdmin ? "#ffffff" : isLight ? "#64748b" : "#94a3b8",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                      boxShadow: isAdmin ? "0 1px 4px rgba(245, 158, 11, 0.3)" : "none",
                      whiteSpace: "nowrap",
                    }}
                    title="👑 Master Admin mode (Full access, Order cancel allowed)"
                  >
                    <span>👑 Admin</span>
                  </button>
                  <button
                    type="button"
                    disabled={roleSwitching}
                    onClick={() => handleRoleSwitch("staff")}
                    style={{
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 800,
                      cursor: "pointer",
                      border: "none",
                      background: !isAdmin ? "linear-gradient(135deg, #10b981, #059669)" : "transparent",
                      color: !isAdmin ? "#ffffff" : isLight ? "#64748b" : "#94a3b8",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                      boxShadow: !isAdmin ? "0 1px 4px rgba(16, 185, 129, 0.3)" : "none",
                      whiteSpace: "nowrap",
                    }}
                    title="👤 Staff / Sub-Admin mode (Order cancellation restricted)"
                  >
                    <span>👤 Staff</span>
                  </button>
                </div>
              )}

              {/* User Profile Pill */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "4px 10px 4px 4px",
                  borderRadius: "20px",
                  background: isAdmin
                    ? isLight ? "#fffbeb" : "rgba(245, 158, 11, 0.12)"
                    : isLight ? "#ecfdf5" : "rgba(16, 185, 129, 0.12)",
                  border: isAdmin
                    ? isLight ? "1px solid #fde68a" : "1px solid rgba(245, 158, 11, 0.35)"
                    : isLight ? "1px solid #a7f3d0" : "1px solid rgba(16, 185, 129, 0.35)",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                <div
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    background: isAdmin
                      ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                      : "linear-gradient(135deg, #10b981 0%, #047857 100%)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: isAdmin
                      ? "0 2px 6px rgba(245, 158, 11, 0.4)"
                      : "0 2px 6px rgba(16, 185, 129, 0.4)",
                    fontSize: "12px",
                    flexShrink: 0,
                  }}
                >
                  {isAdmin ? "👑" : "👤"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", lineHeight: "1.15", whiteSpace: "nowrap" }}>
                  <span
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 800,
                      color: isAdmin ? (isLight ? "#92400e" : "#fef08a") : (isLight ? "#065f46" : "#6ee7b7"),
                      letterSpacing: "0.02em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isAdmin ? "SHOP ADMIN" : staffName || "STAFF MEMBER"}
                  </span>
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      color: isAdmin ? (isLight ? "#b45309" : "#fde047") : (isLight ? "#047857" : "#a7f3d0"),
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isAdmin ? "Cancel: Allowed ✓" : "Cancel: Admin Only 🔒"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Top Header */}
        <header
          style={{
            height: "56px",
            borderBottom: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)",
            background: isLight ? "#ffffff" : "#0e1526",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 14px",
            position: "sticky",
            top: 0,
            zIndex: 30,
          }}
          className="admin-mobile-header md:hidden"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
            <BrandLogo size={32} variant="iconOnly" />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: "13px",
                  color: isLight ? "#0f172a" : "#ffffff",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "140px",
                }}
              >
                {activeBranch}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: isLight ? "#64748b" : "#94a3b8",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "140px",
                }}
              >
                {currentPageTitle}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {/* Live Pakistan Standard Time (PKT) for Mobile */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 8px",
                borderRadius: "14px",
                background: isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.08)",
                border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255, 255, 255, 0.14)",
                color: isLight ? "#0f172a" : "#ffffff",
              }}
              title="Current Pakistan Standard Time (PKT)"
            >
              <div
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 6px #10b981",
                  flexShrink: 0,
                }}
              />
              <Clock size={11} className="text-emerald-500" />
              <span style={{ fontFamily: "monospace", fontSize: "11px", fontWeight: 800 }}>
                {pakistanTime ? pakistanTime.replace(/:\d\d\s/, " ") : "--:--"}
              </span>
              <span
                style={{
                  fontSize: "8px",
                  fontWeight: 900,
                  background: "#059669",
                  color: "#ffffff",
                  padding: "1px 4px",
                  borderRadius: "3px",
                  letterSpacing: "0.03em",
                }}
              >
                PKT
              </span>
            </div>

            {/* Mobile Direct POS Download Button */}
            <a
              href="/release/Sole%20What%20Setup%201.6.2.exe"
              download="Sole What Setup 1.6.2.exe"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "5px 9px",
                borderRadius: "6px",
                background: isLight ? "#f0fdf4" : "rgba(16, 185, 129, 0.15)",
                border: isLight ? "1px solid #bbf7d0" : "1px solid rgba(16, 185, 129, 0.35)",
                color: isLight ? "#16a34a" : "#34d399",
                fontSize: "11px",
                fontWeight: 800,
                textDecoration: "none",
              }}
              title="Download FloDesktop POS Setup 1.6.2.exe"
            >
              <Download size={13} />
              <span>POS</span>
            </a>

            {/* Mobile Slider / Menu Open Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              style={{
                background: isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.08)",
                border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255, 255, 255, 0.15)",
                color: isLight ? "#0f172a" : "#ffffff",
                padding: "6px 8px",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Open Navigation Slider"
            >
              <Menu size={18} />
            </button>
          </div>
        </header>

        {/* ─── MOBILE SLIDER / DRAWER (Off-Canvas Overlay) ─── */}
        {/* Backdrop overlay */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.65)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              zIndex: 49,
            }}
            className="md:hidden transition-opacity duration-300"
            aria-hidden="true"
          />
        )}

        {/* Slide-out Drawer Panel */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-[295px] max-w-[85vw] flex flex-col md:hidden transition-transform duration-300 ease-in-out shadow-2xl ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
          }`}
          style={{
            background: isLight
              ? "#ffffff"
              : "linear-gradient(180deg, #0e1526 0%, #090d18 100%)",
            borderRight: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.12)",
          }}
        >
          {/* Drawer Header with Close Button */}
          <div
            style={{
              padding: "16px 14px",
              borderBottom: isLight ? "1px solid #f1f5f9" : "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={activeBranch}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "8px",
                    objectFit: "cover",
                    border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255, 255, 255, 0.18)",
                    background: "#ffffff",
                    flexShrink: 0,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                  }}
                />
              ) : (
                <BrandLogo size={36} variant="iconOnly" />
              )}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 900,
                    fontSize: "14px",
                    color: isLight ? "#0f172a" : "#ffffff",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "160px",
                  }}
                >
                  {activeBranch}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#16a34a",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontWeight: 700,
                  }}
                >
                  <span
                    style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }}
                    className="admin-pulse-green"
                  />
                  <span>Live Terminal</span>
                </div>
                <div style={{ marginTop: "3px" }}>
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 800,
                      padding: "1px 6px",
                      borderRadius: "4px",
                      background: theme.badgeBg,
                      color: theme.badgeText,
                      border: `1px solid ${theme.badgeBorder}`,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    <span>{theme.accentEmoji}</span>
                    <span>{theme.name}</span>
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255, 255, 255, 0.12)",
                background: isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.06)",
                color: isLight ? "#0f172a" : "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              aria-label="Close navigation drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Navigation List */}
          <nav
            style={{
              padding: "14px 12px",
              flex: "1 1 auto",
              minHeight: 0,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              WebkitOverflowScrolling: "touch",
            }}
            className="admin-sidebar-scroll"
          >
            {visibleNavGroups.map((group) => (
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

                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/admin" && pathname.startsWith(item.href));
                    const isNavigating = navigatingHref === item.href;
                    const IconComponent = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          if (item.href !== pathname) {
                            setNavigatingHref(item.href);
                          }
                        }}
                        className={`admin-nav-link ${
                          isActive
                            ? isLight
                              ? "admin-nav-light-active"
                              : "admin-nav-dark-active"
                            : isLight
                            ? "admin-nav-light-default"
                            : "admin-nav-dark-default"
                        } ${isNavigating ? "opacity-80 scale-[0.98]" : ""}`}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span
                            className="nav-icon"
                            style={{
                              color: isActive
                                ? isLight
                                  ? theme.primary
                                  : theme.primaryHover
                                : isLight
                                ? "#64748b"
                                : "#94a3b8",
                              display: "flex",
                            }}
                          >
                            <IconComponent size={18} />
                          </span>
                          <span>{item.label}</span>
                        </div>

                                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {isNavigating && (
                            <span className="nav-link-spinner shrink-0" title="Loading..." />
                          )}
                          {item.badge && !isNavigating && (
                            <span
                              style={{
                                fontSize: "9px",
                                fontWeight: 800,
                                padding: "2px 6px",
                                borderRadius: "5px",
                                background: item.badgeColor
                                  ? isLight
                                    ? `${item.badgeColor}18`
                                    : `${item.badgeColor}22`
                                  : isLight
                                  ? "#f1f5f9"
                                  : "rgba(255, 255, 255, 0.1)",
                                color: item.badgeColor || (isLight ? "#475569" : "#ffffff"),
                                border: `1px solid ${
                                  item.badgeColor || (isLight ? "#cbd5e1" : "rgba(255,255,255,0.2)")
                                }`,
                                letterSpacing: "0.04em",
                              }}
                              className={item.badge === "LIVE" ? "admin-badge-live" : ""}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Drawer Bottom Actions */}
          <div
            style={{
              marginTop: "auto",
              padding: "8px 10px 0",
              borderTop: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              background: isLight ? "#f8fafc" : "rgba(0, 0, 0, 0.25)",
              flexShrink: 0,
            }}
          >
            {/* Direct POS App Download (No Popup) */}
            <a
              href="/release/Sole%20What%20Setup%201.6.2.exe"
              download="Sole What Setup 1.6.2.exe"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "7px 10px",
                borderRadius: "6px",
                background: isLight ? "#f0fdf4" : "rgba(16, 185, 129, 0.15)",
                border: isLight ? "1px solid #bbf7d0" : "1px solid rgba(16, 185, 129, 0.35)",
                color: isLight ? "#16a34a" : "#34d399",
                fontSize: "11px",
                fontWeight: 800,
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
              className="hover:opacity-90"
              title="Download FloDesktop POS Setup 1.6.2.exe"
            >
              <Download size={13} />
              <span>Download POS App (1.6.2)</span>
            </a>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleSidebarTheme}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "7px 10px",
                borderRadius: "6px",
                background: isLight ? "#ffffff" : "rgba(255, 255, 255, 0.06)",
                border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255, 255, 255, 0.12)",
                color: isLight ? "#0f172a" : "#f8fafc",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Toggle Dark / Light Theme"
            >
              {isLight ? <Moon size={13} className="text-amber-500" /> : <Sun size={13} className="text-amber-400" />}
              <span>{isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}</span>
            </button>

            {/* Small Logout Button */}
            <form action={adminLogout} style={{ width: "100%", margin: 0, padding: 0 }}>
              <button
                type="submit"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  background: isLight ? "#fef2f2" : "rgba(239, 68, 68, 0.1)",
                  color: "#dc2626",
                  fontSize: "11px",
                  fontWeight: 700,
                  border: isLight ? "1px solid #fecaca" : "1px solid rgba(239, 68, 68, 0.25)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                title="Sign Out Terminal"
              >
                <LogOut size={12} />
                <span>Sign Out Terminal</span>
              </button>
            </form>
          </div>
        </div>

        {/* Realtime Live Order Notifications */}
        <LiveOrderNotifier shopId={shopId} />



        {/* Content Body with Mobile Responsive Padding */}
        <main
          style={{
            flex: 1,
            maxWidth: "1440px",
            width: "100%",
            margin: "0 auto",
            boxSizing: "border-box",
          }}
          className="p-3.5 sm:p-5 md:p-7 max-w-[1440px] w-full mx-auto box-border"
        >
          <div key={pathname} className="admin-page-transition w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
    </>
  );
}
