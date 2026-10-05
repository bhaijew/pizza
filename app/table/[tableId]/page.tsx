/**
 * Dedicated Table QR Menu Page — Route: /table/[tableId]
 * Protected with 60-Minute Live Table Scan Session.
 * Automatically expires after 60 minutes to prevent orders from home.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  fetchCategories,
  fetchProducts,
  fetchSettings,
} from "@/lib/menu-data";
import { getTableScanSession } from "@/lib/table-session";
import MenuClient from "@/components/menu/MenuClient";
import MenuSkeleton from "@/components/menu/MenuSkeleton";

export const dynamic = "force-dynamic";

interface TablePageProps {
  params: Promise<{ tableId: string }>;
  searchParams: Promise<{ token?: string; key?: string; invalid_scan?: string; shop?: string }>;
}

export async function generateMetadata({ params, searchParams }: TablePageProps): Promise<Metadata> {
  const { tableId } = await params;
  const { shop } = await searchParams;
  const shopId = shop ? parseInt(shop, 10) : undefined;
  const settings = await fetchSettings(shopId);
  const cleanTable = decodeURIComponent(tableId);

  return {
    title: `Table #${cleanTable} Menu — ${settings.shop_name}`,
    description: `Order fresh stone-baked pizza directly from Table #${cleanTable}.`,
  };
}

export default async function DedicatedTablePage({ params, searchParams }: TablePageProps) {
  const { tableId } = await params;
  const { token, key, invalid_scan, shop } = await searchParams;
  const cleanTable = decodeURIComponent(tableId);

  // If a live scan token was passed in query params, route via /scan/[tableId] to establish 60-min session
  const rawToken = token || key;
  if (rawToken) {
    redirect(`/scan/${encodeURIComponent(cleanTable)}?token=${encodeURIComponent(rawToken)}${shop ? `&shop=${encodeURIComponent(shop)}` : ""}`);
  }

  // Check active 60-minute table scan session cookie
  const sessionCheck = await getTableScanSession(cleanTable);

  // If session is expired or not active, block ordering from home
  if (!sessionCheck.valid) {
    const isExpired = sessionCheck.reason === "EXPIRED";
    const isInvalidScan = invalid_scan === "true";

    return (
      <div
        style={{
          minHeight: "125vh",
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
            maxWidth: 440,
            background: "#ffffff",
            borderRadius: 6,
            border: "2px solid #fed7aa",
            boxShadow: "0 10px 30px rgba(220, 38, 38, 0.08)",
            padding: "32px 24px",
            textAlign: "center",
          }}
        >
          {/* Status Badge */}
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 6,
              background: isExpired ? "#fef3c7" : "#fef2f2",
              border: isExpired ? "1.5px solid #fde68a" : "1.5px solid #fecaca",
              color: isExpired ? "#b45309" : "#dc2626",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              fontSize: 26,
            }}
          >
            {isExpired ? "⏳" : "🛡️"}
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              fontSize: 20,
              color: "#0f172a",
              margin: "0 0 8px",
            }}
          >
            {isExpired
              ? `Table #${cleanTable} Session Expired`
              : isInvalidScan
              ? "Invalid Table QR Scan"
              : `Table #${cleanTable} Scan Required`}
          </h1>

          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px", lineHeight: 1.5 }}>
            {isExpired
              ? `Your 60-minute table ordering session for Table #${cleanTable} has ended. To prevent orders after leaving the restaurant, dine-in ordering requires scanning the live QR code.`
              : `To protect against unauthorized orders from outside the restaurant, dine-in ordering requires scanning the official QR code physically placed on Table #${cleanTable}.`}
          </p>

          <div
            style={{
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: 4,
              padding: "12px",
              marginBottom: 20,
              textAlign: "left",
            }}
          >
            <p style={{ fontSize: 12, fontWeight: 700, color: "#9a3412", margin: "0 0 4px" }}>
              Are you seated at Table #{cleanTable}?
            </p>
            <p style={{ fontSize: 11, color: "#b45309", margin: 0 }}>
              Point your phone camera at the tent card QR code on Table #{cleanTable} to unlock your 60-minute dine-in session.
            </p>
          </div>

          {/* Staff Manual Token Unlock Form */}
          <form
            action={`/scan/${encodeURIComponent(cleanTable)}`}
            method="GET"
            style={{
              marginBottom: 20,
              padding: "12px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 4,
            }}
          >
            <label
              htmlFor="table-token-input"
              style={{
                display: "block",
                fontSize: 10,
                fontWeight: 800,
                color: "#475569",
                textTransform: "uppercase",
                marginBottom: 6,
                letterSpacing: "0.04em",
              }}
            >
              Staff / Table Verification Code:
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                id="table-token-input"
                name="token"
                type="text"
                placeholder="e.g. PH-106"
                style={{
                  flex: 1,
                  height: 36,
                  padding: "0 10px",
                  borderRadius: 4,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  fontWeight: 700,
                  outline: "none",
                  textTransform: "uppercase",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "0 14px",
                  borderRadius: 4,
                  background: "#0f172a",
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Unlock
              </button>
            </div>
          </form>

          {/* Or Go to Takeaway */}
          <Link
            href="/"
            style={{
              display: "inline-block",
              width: "100%",
              padding: "10px",
              borderRadius: 4,
              background: "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
              color: "#ffffff",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 800,
              boxShadow: "0 2px 6px rgba(220, 38, 38, 0.2)",
            }}
          >
            Order Takeaway / Counter Pickup &rarr;
          </Link>
        </div>
      </div>
    );
  }

  // 60-Minute Session is Active & Verified!
  const targetShopId = sessionCheck.session?.shopId ?? (shop ? parseInt(shop, 10) : undefined);

  const [categoriesResult, productsResult, settings] = await Promise.all([
    fetchCategories(targetShopId),
    fetchProducts(null, targetShopId),
    fetchSettings(targetShopId),
  ]);

  return (
    <Suspense
      fallback={
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 16px" }}>
          <MenuSkeleton />
        </div>
      }
    >
      <MenuClient
        categories={categoriesResult.data ?? []}
        products={productsResult.data ?? []}
        categoriesError={categoriesResult.error}
        productsError={productsResult.error}
        categoriesTableMissing={categoriesResult.tableMissing}
        productsTableMissing={productsResult.tableMissing}
        settings={settings}
        initialTableNumber={cleanTable}
        verifiedTable={cleanTable}
        initialOrderType="dine_in"
        isDedicatedTableRoute={true}
      />
    </Suspense>
  );
}
