"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { adminLogout } from "@/lib/admin-actions";

interface AdminShellProps {
  children: React.ReactNode;
  shopName?: string;
  shopStatus?: "active" | "suspended" | "master";
  ownerName?: string;
  shopSlug?: string;
  shopId?: number | null;
}

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1"></rect>
        <rect width="7" height="5" x="14" y="3" rx="1"></rect>
        <rect width="7" height="9" x="14" y="12" rx="1"></rect>
        <rect width="7" height="5" x="3" y="16" rx="1"></rect>
      </svg>
    ),
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path>
        <path d="M12 22V12"></path>
        <path d="m3.3 7 8.7 5 8.7-5"></path>
        <path d="m12 12 8.5-5"></path>
      </svg>
    ),
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path>
        <path d="M7 7h.01"></path>
      </svg>
    ),
  },
  {
    label: "Live Orders",
    href: "/admin/orders",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="21" r="1"></circle>
        <circle cx="19" cy="21" r="1"></circle>
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
      </svg>
    ),
  },
  {
    label: "Kitchen Display (KDS)",
    href: "/admin/kitchen",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path>
        <line x1="6" y1="17" x2="18" y2="17"></line>
      </svg>
    ),
  },
  {
    label: "Table QR Codes",
    href: "/admin/tables",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="5" height="5" x="3" y="3" rx="1"></rect>
        <rect width="5" height="5" x="16" y="3" rx="1"></rect>
        <rect width="5" height="5" x="3" y="16" rx="1"></rect>
        <path d="M21 16h-3a2 2 0 0 0-2 2v3"></path>
        <path d="M21 21v.01"></path>
        <path d="M12 7v3a2 2 0 0 1-2 2H7"></path>
        <path d="M3 12h.01"></path>
        <path d="M12 3h.01"></path>
        <path d="M12 16v.01"></path>
        <path d="M16 12h1"></path>
        <path d="M21 12v.01"></path>
        <path d="M12 21v-1"></path>
      </svg>
    ),
  },
  {
    label: "Daily Closing",
    href: "/admin/closing",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2"></rect>
        <path d="m9 12 2 2 4-4"></path>
        <path d="M3 7h18"></path>
      </svg>
    ),
  },
  {
    label: "Expenses",
    href: "/admin/expenses",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
      </svg>
    ),
  },
  {
    label: "Sales Analytics",
    href: "/admin/analytics",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
    ),
  },
  {
    label: "Inventory & Stock",
    href: "/admin/inventory",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
        <path d="m3.3 7 8.7 5 8.7-5"></path>
        <path d="M12 12v10"></path>
      </svg>
    ),
  },
  {
    label: "Shop & Menu Title",
    href: "/admin/settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    ),
  },
];

export default function AdminShell({
  children,
  shopName,
  shopStatus = "active",
  ownerName,
  shopSlug,
  shopId,
}: AdminShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeBranch, setActiveBranch] = useState<string>(shopName || "Pizza Admin");
  const [copiedLink, setCopiedLink] = useState(false);

  const customerMenuUrl = shopSlug ? `/${shopSlug}` : "/";

  const handleCopyMenu = () => {
    const fullUrl = `${window.location.origin}${customerMenuUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
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

  return (
    <div
      style={{
        zoom: 0.8,
        display: "flex",
        minHeight: "125vh",
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
      }}
    >
      {/* ─── SIDEBAR (Desktop) ────────────────────────────── */}
      <aside
        style={{
          width: "250px",
          background: "#ffffff",
          borderRight: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
        className="hidden md:flex"
      >
        {/* Brand */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "5px",
              background: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 2px 6px rgba(239, 68, 68, 0.25)",
            }}
          >
            {/* Real SVG Logo Icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 11h.01"></path>
              <path d="M11 15h.01"></path>
              <path d="M16 16h.01"></path>
              <path d="m2 16 20 6-6-20A20 20 0 0 0 2 16Z"></path>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "15px", color: "#0f172a", letterSpacing: "-0.01em" }}>
              {activeBranch}
            </div>
            <div style={{ fontSize: "11px", color: "#16a34a", display: "flex", alignItems: "center", gap: "5px", fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: "5px", background: "#16a34a", display: "inline-block" }}></span>
              {activeBranch !== "Pizza Admin" ? "Branch Online" : "Live & Connected"}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: "16px 10px", flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "5px",
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 500,
                  textDecoration: "none",
                  color: isActive ? "#dc2626" : "#475569",
                  background: isActive ? "#fef2f2" : "transparent",
                  border: isActive ? "1px solid #fecaca" : "1px solid transparent",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ color: isActive ? "#dc2626" : "#64748b" }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div
          style={{
            padding: "16px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {/* Dedicated Customer Menu Link Box */}
          <div
            style={{
              padding: "10px 12px",
              background: "#f0fdf4",
              borderRadius: "5px",
              border: "1px solid #bbf7d0",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#16a34a", textTransform: "uppercase" }}>
                Customer Menu Link
              </span>
              <button
                type="button"
                onClick={handleCopyMenu}
                style={{
                  background: "transparent",
                  border: "none",
                  color: copiedLink ? "#16a34a" : "#15803d",
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
                {copiedLink ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <Link
              href={customerMenuUrl}
              target="_blank"
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#15803d",
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
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
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
                padding: "9px 12px",
                borderRadius: "5px",
                background: "#fef2f2",
                color: "#dc2626",
                fontSize: "12px",
                fontWeight: 600,
                border: "1px solid #fecaca",
                cursor: "pointer",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Mobile Header */}
        <header
          style={{
            height: "56px",
            borderBottom: "1px solid #e2e8f0",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
          }}
          className="md:hidden"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "5px",
                background: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 16 20 6-6-20A20 20 0 0 0 2 16Z"></path>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>{activeBranch}</span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              color: "#334155",
              padding: "6px 8px",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            aria-label="Toggle Navigation Menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </header>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div
            style={{
              background: "#ffffff",
              borderBottom: "1px solid #e2e8f0",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
            className="md:hidden"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "9px 12px",
                    borderRadius: "5px",
                    textDecoration: "none",
                    color: isActive ? "#dc2626" : "#475569",
                    background: isActive ? "#fef2f2" : "transparent",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div style={{ paddingTop: "8px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "8px" }}>
              <Link
                href={customerMenuUrl}
                target="_blank"
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "8px",
                  borderRadius: "5px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#16a34a",
                  fontSize: "12px",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                View Live Menu ({customerMenuUrl})
              </Link>
              <form action={adminLogout} style={{ flex: 1 }}>
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "5px",
                    background: "#fef2f2",
                    color: "#dc2626",
                    fontSize: "12px",
                    border: "1px solid #fecaca",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Content Body */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "28px 24px",
            maxWidth: "1400px",
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
