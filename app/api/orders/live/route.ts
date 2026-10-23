import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import { checkAndPerformAutoClosing, getShopActiveShiftBoundary } from "@/lib/admin-actions";
import type { Order } from "@/types/menu";

export const dynamic = "force-dynamic";

let lastAutoCloseCheckMs = 0;

/**
 * GET /api/orders/live
 * Fast, unblocked real-time order polling endpoint.
 * Runs with service_role to guarantee zero RLS drops and instant updates for Admin & KDS.
 * Excludes orders from previous shifts that were already closed in the daily register.
 */
export async function GET(request: NextRequest) {
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ orders: [], error: "Service role key missing" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const shopIdParam = searchParams.get("shopId");
  const isKitchen = searchParams.get("kitchen") === "true";

  const parsedShopId =
    shopIdParam && shopIdParam !== "null" && shopIdParam !== "all" && shopIdParam !== "undefined" && !isNaN(Number(shopIdParam))
      ? Number(shopIdParam)
      : null;

  // Periodically verify if previous business shift has ended and needs automated daily closing
  const nowMs = Date.now();
  if (nowMs - lastAutoCloseCheckMs > 60000) {
    lastAutoCloseCheckMs = nowMs;
    checkAndPerformAutoClosing(parsedShopId).catch((err) => {
      console.error("[Background auto-closing check error]", err);
    });
  }

  const shiftBoundary = await getShopActiveShiftBoundary(parsedShopId);
  const db = createAdminClient();

  let query = db.from("orders").select("*");

  // Only show orders belonging to current active shift (after previous shift closing)
  if (shiftBoundary.activeShiftStartUtc) {
    query = query.gte("created_at", shiftBoundary.activeShiftStartUtc);
  }

  if (isKitchen) {
    // Kitchen shows pending (new tickets), confirmed, and preparing orders
    query = query.in("status", ["pending", "confirmed", "preparing"]);
  } else {
    // Admin orders board: recent active pipeline orders for the shift
    query = query.order("created_at", { ascending: false }).limit(100);
  }

  if (parsedShopId !== null) {
    query = query.eq("shop_id", parsedShopId);
  }

  query = query.order("created_at", { ascending: isKitchen ? true : false });

  const { data: orders, error } = await query;

  if (error) {
    return NextResponse.json({ orders: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      orders: (orders as Order[]) || [],
      activeBusinessDate: shiftBoundary.activeBusinessDate,
      lastClosedAt: shiftBoundary.lastClosedAt,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
      },
    }
  );
}
