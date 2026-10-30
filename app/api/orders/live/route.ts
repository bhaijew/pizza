import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import { getShopActiveShiftBoundary } from "@/lib/admin-actions";
import type { Order } from "@/types/menu";

export const dynamic = "force-dynamic";

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

  const shiftBoundary = await getShopActiveShiftBoundary(parsedShopId);
  const db = createAdminClient();

  let query = db.from("orders").select("*");

  if (isKitchen) {
    // Kitchen shows active tickets for current open shift
    if (shiftBoundary.activeShiftStartUtc) {
      query = query.gte("created_at", shiftBoundary.activeShiftStartUtc);
    }
    query = query.in("status", ["pending", "confirmed", "preparing"]).order("created_at", { ascending: true });
  } else {
    // Admin orders board: fetch current open shift orders
    if (shiftBoundary.activeShiftStartUtc) {
      query = query.gte("created_at", shiftBoundary.activeShiftStartUtc);
    }
    query = query.order("created_at", { ascending: false }).limit(120);
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
