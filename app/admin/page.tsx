import Link from "next/link";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import { fetchSettings } from "@/lib/menu-data";
import { getActiveShopContext } from "@/lib/admin-actions";
import type { Order } from "@/types/menu";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const serviceRoleOk = isServiceRoleConfigured();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  let productCount = 0;
  let categoryCount = 0;
  let orderCount = 0;
  let pendingOrders = 0;
  let recentOrders: Order[] = [];
  let currencySymbol = "$";
  let shopName = "Pizza Shop";

  try {
    let prodQuery = db.from("products").select("id", { count: "exact", head: true });
    let catQuery = db.from("categories").select("id", { count: "exact", head: true });
    let orderQuery = db.from("orders").select("id, status");
    let recentQuery = db.from("orders").select("*").order("created_at", { ascending: false }).limit(5);

    if (activeShop.shopId) {
      prodQuery = prodQuery.eq("shop_id", activeShop.shopId);
      catQuery = catQuery.eq("shop_id", activeShop.shopId);
      orderQuery = orderQuery.eq("shop_id", activeShop.shopId);
      recentQuery = recentQuery.eq("shop_id", activeShop.shopId);
    } else {
      prodQuery = prodQuery.is("shop_id", null);
      catQuery = catQuery.is("shop_id", null);
      orderQuery = orderQuery.is("shop_id", null);
      recentQuery = recentQuery.is("shop_id", null);
    }

    const [prodRes, catRes, orderRes, recentRes, settings] = await Promise.all([
      prodQuery,
      catQuery,
      orderQuery,
      recentQuery,
      fetchSettings(),
    ]);

    shopName = settings.shop_name || "Pizza Shop";
    currencySymbol = settings.currency_symbol || "$";

    productCount = prodRes.count ?? 0;
    categoryCount = catRes.count ?? 0;

    if (orderRes.data) {
      orderCount = orderRes.data.length;
      pendingOrders = orderRes.data.filter(
        (o) => o.status === "pending" || o.status === "preparing"
      ).length;
    }

    if (recentRes.data) {
      recentOrders = recentRes.data as Order[];
    }
  } catch (_) {}

  const statusColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
    pending: { bg: "#fefce8", text: "#ca8a04", border: "#fef08a", label: "Pending" },
    confirmed: { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe", label: "Confirmed" },
    preparing: { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa", label: "Preparing" },
    ready: { bg: "#faf5ff", text: "#9333ea", border: "#e9d5ff", label: "Ready" },
    delivered: { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0", label: "Delivered" },
    cancelled: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca", label: "Cancelled" },
  };

  return (
    <div>
      {/* ─── Top Banner if service role key is missing ─── */}
      {!serviceRoleOk && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 18px",
            borderRadius: "5px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            color: "#92400e",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }}>
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <div style={{ flex: 1 }}>
            <strong style={{ display: "block", fontSize: "13px", color: "#78350f" }}>
              Action Needed: SUPABASE_SERVICE_ROLE_KEY is not configured
            </strong>
            <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#92400e", lineHeight: 1.5 }}>
              To add products, categories, or update shop title, copy your <code>service_role</code> secret
              from <strong>Supabase Dashboard → Project Settings → API</strong> into <code>.env.local</code>.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              {shopName} Dashboard
            </h1>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "4px",
                background: "#ecfdf5",
                color: "#16a34a",
                border: "1px solid #bbf7d0",
              }}
            >
              ● Live Branch
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            Real-time status of your store, menu items, and incoming customer orders for {shopName}.
          </p>
        </div>

        {/* Quick action shortcuts */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Link
            href="/admin/products?action=new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              borderRadius: "5px",
              background: "#ef4444",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "13px",
              textDecoration: "none",
              boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add Product</span>
          </Link>

          <Link
            href="/admin/orders"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              borderRadius: "5px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#1e293b",
              fontWeight: 600,
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="21" r="1"></circle>
              <circle cx="19" cy="21" r="1"></circle>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
            </svg>
            <span>Live Order Board</span>
          </Link>
        </div>
      </div>

      {/* ─── Metric Cards Grid ────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        {/* Products Stat */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Products
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "5px", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path>
                <path d="M12 22V12"></path>
                <path d="m3.3 7 8.7 5 8.7-5"></path>
                <path d="m12 12 8.5-5"></path>
              </svg>
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a" }}>
            {productCount}
          </div>
          <Link
            href="/admin/products"
            style={{ fontSize: "12px", color: "#dc2626", textDecoration: "none", fontWeight: 600 }}
          >
            Manage Products →
          </Link>
        </div>

        {/* Categories Stat */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Categories
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "5px", background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#0284c7" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path>
                <path d="M7 7h.01"></path>
              </svg>
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a" }}>
            {categoryCount}
          </div>
          <Link
            href="/admin/categories"
            style={{ fontSize: "12px", color: "#0284c7", textDecoration: "none", fontWeight: 600 }}
          >
            Manage Categories →
          </Link>
        </div>

        {/* Pending Orders Stat */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Active Orders
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "5px", background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center", color: "#ea580c" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
              </svg>
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: pendingOrders > 0 ? "#ea580c" : "#0f172a" }}>
            {pendingOrders}
          </div>
          <Link
            href="/admin/orders"
            style={{ fontSize: "12px", color: "#ea580c", textDecoration: "none", fontWeight: 600 }}
          >
            Kitchen Live Board →
          </Link>
        </div>

        {/* Total Orders Stat */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Orders
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "5px", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="21" r="1"></circle>
                <circle cx="19" cy="21" r="1"></circle>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
              </svg>
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a" }}>
            {orderCount}
          </div>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            All-time customer orders
          </span>
        </div>
      </div>

      {/* ─── Recent Orders & Quick Jump ───────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px" }}>
        {/* Recent Orders Section */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            padding: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
              Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              style={{ fontSize: "12px", color: "#0284c7", textDecoration: "none", fontWeight: 600 }}
            >
              View All Orders →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div
              style={{
                padding: "36px 16px",
                textAlign: "center",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px", color: "#94a3b8" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="21" r="1"></circle>
                  <circle cx="19" cy="21" r="1"></circle>
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                </svg>
              </div>
              No orders placed yet. Orders made by customers will show up here live!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {recentOrders.map((order) => {
                const s = statusColors[order.status] || {
                  bg: "#f1f5f9",
                  text: "#334155",
                  border: "#e2e8f0",
                  label: order.status,
                };
                return (
                  <div
                    key={order.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "5px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "13px", color: "#0f172a" }}>
                        {order.order_number}
                        {order.customer_name && (
                          <span style={{ fontWeight: 400, color: "#64748b", marginLeft: "6px" }}>
                            ({order.customer_name})
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                        {currencySymbol}{Number(order.total).toFixed(2)} • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "5px",
                        fontSize: "11px",
                        fontWeight: 600,
                        background: s.bg,
                        color: s.text,
                        border: `1px solid ${s.border}`,
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Management Shortcuts */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 8px", color: "#0f172a" }}>
              Quick Settings &amp; Customization
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.5, margin: "0 0 16px" }}>
              Manage your pizza shop brand name, change the menu heading, update SEO meta tags, and configure products all in one place.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Link
                href="/admin/settings"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "11px 14px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "5px",
                  color: "#1e293b",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#64748b" }}>
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span>Edit Shop Name &amp; Menu Title</span>
                </div>
                <span style={{ color: "#94a3b8" }}>→</span>
              </Link>

              <Link
                href="/admin/categories"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "11px 14px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "5px",
                  color: "#1e293b",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#64748b" }}>
                    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path>
                    <path d="M7 7h.01"></path>
                  </svg>
                  <span>Manage Categories</span>
                </div>
                <span style={{ color: "#94a3b8" }}>→</span>
              </Link>

              <Link
                href="/admin/products"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "11px 14px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "5px",
                  color: "#1e293b",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#64748b" }}>
                    <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path>
                    <path d="M12 22V12"></path>
                    <path d="m3.3 7 8.7 5 8.7-5"></path>
                    <path d="m12 12 8.5-5"></path>
                  </svg>
                  <span>Full Products Catalog</span>
                </div>
                <span style={{ color: "#94a3b8" }}>→</span>
              </Link>
            </div>
          </div>

          <div
            style={{
              marginTop: "16px",
              padding: "10px 12px",
              borderRadius: "5px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#16a34a",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: 600,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Database Connected &amp; Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}
