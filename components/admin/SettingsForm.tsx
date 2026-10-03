"use client";

import { useActionState, useState } from "react";
import { updateSettings } from "@/lib/admin-actions";
import type { ShopSettings } from "@/lib/menu-data";

interface SettingsFormProps {
  initialSettings: ShopSettings;
}

const CURRENCY_PRESETS = [
  { label: "$ (USD / Dollar)", symbol: "$" },
  { label: "Rs. (PKR / Rupee)", symbol: "Rs. " },
  { label: "₹ (INR / Rupee)", symbol: "₹" },
  { label: "€ (EUR / Euro)", symbol: "€" },
  { label: "£ (GBP / Pound)", symbol: "£" },
  { label: "AED (Dirham)", symbol: "AED " },
  { label: "SAR (Riyal)", symbol: "SAR " },
  { label: "C$ (CAD / Dollar)", symbol: "C$" },
];

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateSettings, {
    error: null,
    success: false,
  });

  const [shopName, setShopName] = useState(initialSettings.shop_name);
  const [menuTitle, setMenuTitle] = useState(initialSettings.menu_title);
  const [metaTitle, setMetaTitle] = useState(initialSettings.meta_title);
  const [metaDescription, setMetaDescription] = useState(initialSettings.meta_description);
  const [currencySymbol, setCurrencySymbol] = useState(initialSettings.currency_symbol || "$");
  const [whatsappSessionId, setWhatsappSessionId] = useState(initialSettings.whatsapp_session_id || "");
  const [whatsappApiKey, setWhatsappApiKey] = useState(initialSettings.whatsapp_api_key || "");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px" }}>
      {/* ─── SETTINGS FORM ───────────────────────────── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "5px",
          padding: "24px",
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>
          Shop, Currency &amp; Menu Branding
        </h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>
          Customize store name, menu title, currency symbol, and Google SEO metadata.
        </p>

        {state.success && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "5px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#16a34a",
              fontSize: "13px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: 600,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Settings saved successfully! Changes are now live on the customer menu.</span>
          </div>
        )}

        {state.error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "5px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: "13px",
              marginBottom: "18px",
            }}
          >
            {state.error}
          </div>
        )}

        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Shop Name */}
          <div>
            <label
              htmlFor="shop_name"
              style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "5px" }}
            >
              Shop Name (Logo &amp; Brand)
            </label>
            <input
              id="shop_name"
              name="shop_name"
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. Luigi's Woodfired Pizza"
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "5px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b" }}>
              Displayed on the header navbar and browser tab.
            </p>
          </div>

          {/* Currency Selection */}
          <div>
            <label
              htmlFor="currency_symbol"
              style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "5px" }}
            >
              Currency Symbol / Prefix *
            </label>

            {/* Quick preset buttons */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
              {CURRENCY_PRESETS.map((p) => {
                const isSelected = currencySymbol.trim() === p.symbol.trim();
                return (
                  <button
                    key={p.symbol}
                    type="button"
                    onClick={() => setCurrencySymbol(p.symbol)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: "5px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: isSelected ? "1px solid #fecaca" : "1px solid #e2e8f0",
                      background: isSelected ? "#fef2f2" : "#f8fafc",
                      color: isSelected ? "#dc2626" : "#475569",
                    }}
                  >
                    {p.symbol.trim()} ({p.label.split(" ")[0]})
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                id="currency_symbol"
                name="currency_symbol"
                type="text"
                required
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder="e.g. $, Rs. , €, £, AED"
                style={{
                  width: "120px",
                  padding: "9px 12px",
                  borderRadius: "5px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontSize: "14px",
                  fontWeight: 700,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Preview price: <strong style={{ color: "#dc2626" }}>{currencySymbol}14.99</strong>
              </span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b" }}>
              Shown in front of all product prices, cart totals, and customer orders.
            </p>
          </div>

          {/* Menu Title */}
          <div>
            <label
              htmlFor="menu_title"
              style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "5px" }}
            >
              Menu Section Heading
            </label>
            <input
              id="menu_title"
              name="menu_title"
              type="text"
              required
              value={menuTitle}
              onChange={(e) => setMenuTitle(e.target.value)}
              placeholder="e.g. Handcrafted Pizza Menu"
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "5px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b" }}>
              The main headline above the category tabs and product list.
            </p>
          </div>

          {/* Meta Title */}
          <div>
            <label
              htmlFor="meta_title"
              style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "5px" }}
            >
              SEO / Browser Meta Title Tag
            </label>
            <input
              id="meta_title"
              name="meta_title"
              type="text"
              required
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="e.g. Luigi's Pizza | Fresh Woodfired Pizzas"
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "5px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b" }}>
              Shown in browser tabs and Google search engine results.
            </p>
          </div>

          {/* Meta Description */}
          <div>
            <label
              htmlFor="meta_description"
              style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "5px" }}
            >
              SEO Meta Description
            </label>
            <textarea
              id="meta_description"
              name="meta_description"
              rows={3}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="e.g. Order hot, crispy pizzas crafted with organic sourdough and artisan cheeses."
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "5px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />
          </div>

          {/* WhatsApp Order Alerts */}
          <div style={{ marginTop: "6px", padding: "16px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "16px" }}>📱</span>
              <div>
                <h3 style={{ fontSize: "13px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                  WhatsApp Order Alerts (Railway Gateway)
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
                  Sends instant WhatsApp order confirmations to customers.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
              <div>
                <label
                  htmlFor="whatsapp_session_id"
                  style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}
                >
                  WhatsApp Session ID
                </label>
                <input
                  id="whatsapp_session_id"
                  name="whatsapp_session_id"
                  type="text"
                  value={whatsappSessionId}
                  onChange={(e) => setWhatsappSessionId(e.target.value)}
                  placeholder="e.g. rhs5o"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "5px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#0f172a",
                    fontSize: "13px",
                    fontFamily: "monospace",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b" }}>
                  Your Railway device session ID. Endpoint: <code>/api/messages/{whatsappSessionId || "{sessionId}"}/send</code>
                </p>
              </div>

              <div>
                <label
                  htmlFor="whatsapp_api_key"
                  style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}
                >
                  WhatsApp Gateway API Key (Optional)
                </label>
                <input
                  id="whatsapp_api_key"
                  name="whatsapp_api_key"
                  type="password"
                  value={whatsappApiKey}
                  onChange={(e) => setWhatsappApiKey(e.target.value)}
                  placeholder="Leave empty to use system default key"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "5px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#0f172a",
                    fontSize: "13px",
                    fontFamily: "monospace",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b" }}>
                  Optional custom x-api-key for this branch shop.
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            style={{
              padding: "11px 18px",
              borderRadius: "5px",
              background: "#ef4444",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              border: "none",
              cursor: isPending ? "not-allowed" : "pointer",
              opacity: isPending ? 0.7 : 1,
              marginTop: "6px",
              boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
            }}
          >
            {isPending ? "Saving Changes..." : "Save Settings & Update Menu"}
          </button>
        </form>
      </div>

      {/* ─── LIVE PREVIEW CARD ───────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Customer Header Preview */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            padding: "20px",
          }}
        >
          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", fontWeight: 700, marginBottom: "12px" }}>
            Customer Menu Header &amp; Pricing Preview
          </div>

          <div
            style={{
              background: "#ffffff",
              borderRadius: "5px",
              padding: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
            }}
          >
            {/* Header simulation */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "5px", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m2 16 20 6-6-20A20 20 0 0 0 2 16Z"></path>
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "14px", color: "#0f172a", lineHeight: 1.1 }}>
                    {shopName || "Pizza Shop"}
                  </div>
                  <div style={{ fontSize: "10px", color: "#64748b" }}>Fresh &amp; Delicious</div>
                </div>
              </div>
              <div style={{ fontSize: "11px", padding: "3px 8px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "5px", color: "#475569", fontWeight: 600 }}>
                Cart ({currencySymbol}0.00)
              </div>
            </div>

            {/* Menu heading simulation */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", marginBottom: "2px" }}>
                {menuTitle || "Our Menu"}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>
                Items available from our kitchen
              </div>
            </div>

            {/* Sample product card simulation showing chosen currency */}
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "5px",
                padding: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f8fafc",
              }}
            >
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>Margherita Speciale</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>Fresh basil, mozzarella, pomodoro</div>
              </div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#dc2626" }}>
                {currencySymbol}12.99
              </div>
            </div>
          </div>
        </div>

        {/* Browser Tab Preview */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            padding: "20px",
          }}
        >
          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", fontWeight: 700, marginBottom: "12px" }}>
            Browser Tab &amp; Google Search Preview
          </div>

          <div
            style={{
              background: "#f8fafc",
              borderRadius: "5px",
              padding: "14px 16px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <div style={{ width: "16px", height: "16px", color: "#ef4444" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m2 16 20 6-6-20A20 20 0 0 0 2 16Z"></path>
                </svg>
              </div>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#1d4ed8" }}>
                {metaTitle || "Pizza Shop"}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "#16a34a", marginBottom: "4px" }}>
              https://yourpizzashop.com
            </div>
            <div style={{ fontSize: "12px", color: "#475569", lineHeight: 1.4 }}>
              {metaDescription || "Fresh, made-to-order pizzas."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
