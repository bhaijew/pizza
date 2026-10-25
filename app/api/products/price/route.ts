import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import { invalidateAllMenuCaches } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

// Standard CORS headers for POS & external terminals
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * Universal Price Update API Endpoint
 * Enables ANY system (FloDesktop POS, external script, barcode terminal, or web)
 * to update product prices and instantly trigger real-time menu cache invalidation.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json(
        { error: "Database write permission denied: service role not configured." },
        { status: 503, headers: CORS_HEADERS }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const productId = body.productId ?? body.id;
    const price = typeof body.price === "number" ? body.price : parseFloat(body.price);

    if (!productId || isNaN(price) || price < 0) {
      return NextResponse.json(
        { error: "productId and a valid non-negative price are required." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const db = createAdminClient();

    const updates: Record<string, any> = {
      price,
      updated_at: new Date().toISOString(),
    };

    if (body.variations !== undefined) {
      updates.variations = body.variations;
    }

    if (typeof body.isAvailable === "boolean") {
      updates.is_available = body.isAvailable;
    } else if (typeof body.is_available === "boolean") {
      updates.is_available = body.is_available;
    }

    let query = db.from("products").update(updates).eq("id", productId);

    if (body.shopId) {
      query = query.eq("shop_id", body.shopId);
    }

    const { data, error } = await query.select("id, name, price, is_available, shop_id, updated_at").maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: `Product #${productId} not found.` },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // ─── Instant Cache Invalidation ──────────────────────────────────
    // Clears DB memory cache and flushes Next.js layout cache immediately
    await invalidateAllMenuCaches();

    return NextResponse.json(
      {
        success: true,
        message: `Product price successfully updated to ${price}`,
        product: data,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
