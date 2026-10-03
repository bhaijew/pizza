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
  let currencySymbol = "Rs.";
  let shopName = "Pizza Shop";

  try {
    let prodQuery = db.from("products").select("id", { count: "exact", head: true });
    let catQuery = db.from("categories").select("id", { count: "exact", head: true });
    let orderQuery = db.from("orders").select("id, status");
    let recentQuery = db.from("orders").select("*").order("created_at", { ascending: false }).limit(6);

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
    currencySymbol = settings.currency_symbol || "Rs.";

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

  const statusColors: Record<string, { bg: string; text: string; border: string; label: string; dot: string }> = {
    pending: { bg: "#fefce8", text: "#ca8a04", border: "#fde047", label: "Pending", dot: "#eab308" },
    confirmed: { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe", label: "Confirmed", dot: "#3b82f6" },
    preparing: { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa", label: "In Kitchen", dot: "#f97316" },
    ready: { bg: "#faf5ff", text: "#9333ea", border: "#e9d5ff", label: "Ready", dot: "#a855f7" },
    delivered: { bg: "#ecfdf5", text: "#059669", border: "#a7f3d0", label: "Delivered", dot: "#10b981" },
    cancelled: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca", label: "Cancelled", dot: "#ef4444" },
  };

  return (
    <div style={{ maxWidth: 1300, margin: "0 auto" }}>
      {/* ─── Warning if Service Role missing ─── */}
      {!serviceRoleOk && (
        <div
          style={{
            marginBottom: 24,
            padding: "16px 20px",
            borderRadius: 8,
            background: "#fffbeb",
            border: "1.5px solid #fde68a",
            color: "#92400e",
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            boxShadow: "0 2px 8px rgba(245, 158, 11, 0.1)",
          }}
        >
          <span style={{ fontSize: 22 }}>⚠️</span>
          <div>
            <strong style={{ display: "block", fontSize: 14, color: "#78350f" }}>
              Configuration Required: SUPABASE_SERVICE_ROLE_KEY is missing
            </strong>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#92400e", lineHeight: 1.5 }}>
              To enable database writes, copy your <code>service_role</code> secret from your Supabase Dashboard into <code>.env.local</code>.
            </p>
          </div>
        </div>
      )}

      {/* ─── Top Command Center Banner ─── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderRadius: 12,
          padding: "26px 30px",
          color: "#ffffff",
          marginBottom: 28,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 10px #10b981",
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 800, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Live Operations Terminal
            </span>
          </div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              margin: "0 0 6px",
            }}
          >
            {shopName} Dashboard
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
            Real-time kitchen display, live incoming customer orders, and store management.
          </p>
        </div>

        {/* Quick Executive Shortcuts */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link
            href="/admin/orders"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 6,
              background: "#ea580c",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: 13,
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(234, 88, 12, 0.35)",
              border: "none",
            }}
          >
            <span>📋</span>
            <span>Live Order Board</span>
            {pendingOrders > 0 && (
              <span
                style={{
                  background: "#ffffff",
                  color: "#ea580c",
                  padding: "1px 7px",
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                {pendingOrders}
              </span>
            )}
          </Link>

          <Link
            href="/admin/kitchen"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 6,
              background: "rgba(255, 255, 255, 0.1)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <span>🔥</span>
            <span>Kitchen KDS</span>
          </Link>

          <Link
            href="/admin/products?action=new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 16px",
              borderRadius: 6,
              background: "rgba(255, 255, 255, 0.06)",
              color: "#cbd5e1",
              fontWeight: 600,
              fontSize: 13,
              textDecoration: "none",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            <span>＋ Add Pizza</span>
          </Link>
        </div>
      </div>

      {/* ─── Metric KPI Cards Grid ─── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 18,
          marginBottom: 28,
        }}
      >
        {/* KPI 1: Active Orders */}
        <Link
          href="/admin/orders"
          style={{
            textDecoration: "none",
            background: pendingOrders > 0
              ? "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)"
              : "#ffffff",
            border: pendingOrders > 0 ? "1.5px solid #fdba74" : "1px solid #e2e8f0",
            borderRadius: 10,
            padding: 22,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: pendingOrders > 0
              ? "0 8px 20px rgba(234, 88, 12, 0.12)"
              : "0 2px 8px rgba(0, 0, 0, 0.03)",
            transition: "transform 0.15s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: pendingOrders > 0 ? "#9a3412" : "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Active Orders
            </span>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: pendingOrders > 0 ? "#ea580c" : "#f1f5f9",
                color: pendingOrders > 0 ? "#ffffff" : "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              🔥
            </div>
          </div>
          <div style={{ margin: "14px 0 6px" }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: pendingOrders > 0 ? "#c2410c" : "#0f172a" }}>
              {pendingOrders}
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: pendingOrders > 0 ? "#ea580c" : "#64748b", fontWeight: 600 }}>
              {pendingOrders > 0 ? "Needs kitchen preparation" : "All orders caught up"}
            </p>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#ea580c", display: "flex", alignItems: "center", gap: 4 }}>
            <span>Open live order board</span>
            <span>→</span>
          </div>
        </Link>

        {/* KPI 2: Products */}
        <Link
          href="/admin/products"
          style={{
            textDecoration: "none",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: 22,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Menu Products
            </span>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: "#fef2f2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              🍕
            </div>
          </div>
          <div style={{ margin: "14px 0 6px" }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#0f172a" }}>
              {productCount}
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
              Across {categoryCount} food categories
            </p>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", display: "flex", alignItems: "center", gap: 4 }}>
            <span>Manage food items</span>
            <span>→</span>
          </div>
        </Link>

        {/* KPI 3: Total Orders */}
        <Link
          href="/admin/orders"
          style={{
            textDecoration: "none",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: 22,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Orders
            </span>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              📦
            </div>
          </div>
          <div style={{ margin: "14px 0 6px" }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#0f172a" }}>
              {orderCount}
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
              All-time completed orders
            </p>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", display: "flex", alignItems: "center", gap: 4 }}>
            <span>View order history</span>
            <span>→</span>
          </div>
        </Link>

        {/* KPI 4: Promos & Loyalty */}
        <Link
          href="/admin/promos"
          style={{
            textDecoration: "none",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: 22,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Promos &amp; Loyalty
            </span>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              🪙
            </div>
          </div>
          <div style={{ margin: "14px 0 6px" }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#059669" }}>
              VIP Cash Engine
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
              1 pt per Rs. 50 (2% Cashback)
            </p>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#059669", display: "flex", alignItems: "center", gap: 4 }}>
            <span>Manage coupons &amp; points</span>
            <span>→</span>
          </div>
        </Link>
      </div>

      {/* ─── Operations Grid: Recent Orders + Quick Management ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 24 }}>
        {/* LEFT: Live Order Stream */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: 24,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 8px #10b981",
                }}
              />
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#0f172a" }}>
                Recent Incoming Orders
              </h2>
            </div>
            <Link
              href="/admin/orders"
              style={{ fontSize: 13, color: "#ea580c", textDecoration: "none", fontWeight: 700 }}
            >
              Live Order Board →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div
              style={{
                padding: "48px 20px",
                textAlign: "center",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>🍕</div>
              <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#0f172a" }}>
                No active orders yet
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
                When customers place Dine-In, Delivery, or Takeaway orders, they will stream here live with sound alerts.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentOrders.map((order) => {
                const s = statusColors[order.status] || {
                  bg: "#f1f5f9",
                  text: "#334155",
                  border: "#e2e8f0",
                  label: order.status,
                  dot: "#64748b",
                };

                return (
                  <div
                    key={order.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      background: "#f8fafc",
                      border: "1px solid #f1f5f9",
                      borderRadius: 8,
                      gap: 12,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 800,
                            fontSize: 13,
                            color: "#0f172a",
                          }}
                        >
                          #{order.order_number}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: "1px 6px",
                            borderRadius: 4,
                            background:
                              order.order_type === "delivery"
                                ? "#eff6ff"
                                : order.order_type === "dine_in"
                                ? "#fff7ed"
                                : "#fefce8",
                            color:
                              order.order_type === "delivery"
                                ? "#1d4ed8"
                                : order.order_type === "dine_in"
                                ? "#c2410c"
                                : "#a16207",
                            textTransform: "uppercase",
                          }}
                        >
                          {order.order_type === "dine_in"
                            ? `Table ${order.table_number || "—"}`
                            : order.order_type === "delivery"
                            ? "Delivery"
                            : "Takeaway"}
                        </span>
                      </div>

                      <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 8 }}>
                        <span>{order.customer_name || "Guest"}</span>
                        <span>•</span>
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>
                          {currencySymbol} {Number(order.total).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          background: s.bg,
                          color: s.text,
                          border: `1px solid ${s.border}`,
                        }}
                      >
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot }} />
                        <span>{s.label}</span>
                      </span>

                      <Link
                        href={`/track/${order.order_number}`}
                        target="_blank"
                        style={{
                          padding: "4px 8px",
                          borderRadius: 4,
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          color: "#334155",
                          fontSize: 11,
                          fontWeight: 700,
                          textDecoration: "none",
                        }}
                        title="Track Order Live Status"
                      >
                        Track ↗
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Quick Launch Controls & System Readiness */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Quick Shortcuts Matrix */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: 24,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px", color: "#0f172a" }}>
              Quick Management Shortcuts
            </h2>
            <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 16px" }}>
              One-click access to core store operations and daily workflows.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { title: "Table QR Codes", desc: "Generate & print table QRs", href: "/admin/tables", icon: "🖨️" },
                { title: "Coupons & Promos", desc: "Set discount voucher codes", href: "/admin/promos", icon: "🎟️" },
                { title: "Daily Cash Closing", desc: "End of day financial report", href: "/admin/closing", icon: "📊" },
                { title: "Menu Settings", desc: "Branding, SEO & currency", href: "/admin/settings", icon: "⚙️" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    padding: "14px",
                    borderRadius: 8,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    textDecoration: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>{item.title}</span>
                  <span style={{ fontSize: 11, color: "#64748b" }}>{item.desc}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* System & Hardware Readiness Card */}
          <div
            style={{
              background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
              border: "1px solid #a7f3d0",
              borderRadius: 10,
              padding: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>⚡</span>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: "#065f46" }}>
                  Operational System Status
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#047857" }}>
                  All store services and live engines are healthy.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#065f46" }}>• Kitchen Audio Engine:</span>
                <span style={{ fontWeight: 800, color: "#047857" }}>Web Audio API (Online)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#065f46" }}>• WhatsApp Multi-Tenancy:</span>
                <span style={{ fontWeight: 800, color: "#047857" }}>Shop-Isolated Gateway</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#065f46" }}>• Customer Live Tracker:</span>
                <span style={{ fontWeight: 800, color: "#047857" }}>/track/[orderNumber] Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
