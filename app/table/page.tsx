import Link from "next/link";
import { fetchSettings, fetchRestaurantTables } from "@/lib/menu-data";

export const dynamic = "force-dynamic";

export default async function TableIndexPage() {
  const [settings, tables] = await Promise.all([
    fetchSettings(),
    fetchRestaurantTables(),
  ]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #fffdfa 0%, #fff7ed 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#ffffff",
          borderRadius: 6,
          border: "2px solid #fed7aa",
          boxShadow: "0 8px 30px rgba(234, 88, 12, 0.08)",
          padding: "32px 24px",
          textAlign: "center",
        }}
      >
        {/* Brand Emblem */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 4,
            background: "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
            color: "#fde047",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
            boxShadow: "0 2px 8px rgba(220, 38, 38, 0.25)",
            fontSize: 22,
          }}
        >
          🍕
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 24,
            color: "#0f172a",
            margin: "0 0 6px",
            letterSpacing: "-0.02em",
          }}
        >
          {settings.shop_name} &bull; Dine-In
        </h1>

        <p style={{ fontSize: 13, color: "#9a3412", margin: "0 0 24px", fontWeight: 500 }}>
          Please select your table or scan the QR code located on your table tent card.
        </p>

        {/* Dynamic Registered Tables Grid */}
        {tables.length === 0 ? (
          <div
            style={{
              padding: "24px 16px",
              background: "#fff7ed",
              borderRadius: 6,
              border: "1px dashed #fed7aa",
              marginBottom: 24,
            }}
          >
            <p style={{ fontSize: 13, color: "#9a3412", fontWeight: 600, margin: "0 0 8px" }}>
              No dine-in tables registered yet.
            </p>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
              Tables can be created from the Admin Panel under &ldquo;Table QR Codes&rdquo;.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
              gap: 12,
              marginBottom: 28,
            }}
          >
            {tables.map((t) => (
              <Link
                key={t.id}
                href={`/table/${encodeURIComponent(t.table_number)}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "14px 8px",
                  borderRadius: 5,
                  border: "1.5px solid #fed7aa",
                  background: "#fff7ed",
                  color: "#7c2d12",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                  boxShadow: "0 2px 4px rgba(234, 88, 12, 0.04)",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "#c2410c",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: 2,
                  }}
                >
                  Table
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    fontSize: 20,
                    color: "#dc2626",
                    lineHeight: 1.1,
                  }}
                >
                  {t.table_number}
                </span>
                {t.table_name && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#9a3412",
                      marginTop: 4,
                      maxWidth: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.table_name}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Or go to general menu */}
        <div style={{ borderTop: "1px solid #fed7aa", paddingTop: 16 }}>
          <Link
            href="/"
            style={{
              fontSize: 13,
              color: "#c2410c",
              textDecoration: "none",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>&larr;</span>
            <span>Go to Standard / Takeaway Menu</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
