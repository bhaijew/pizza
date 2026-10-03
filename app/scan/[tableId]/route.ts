import { NextResponse } from "next/server";
import { verifyTableScan } from "@/lib/menu-data";
import { TABLE_SESSION_COOKIE, TABLE_SESSION_DURATION_MS } from "@/lib/table-session";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tableId: string }> }
) {
  const { tableId } = await params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") || searchParams.get("key");
  const shopParam = searchParams.get("shop");
  const shopId = shopParam ? parseInt(shopParam, 10) : undefined;
  const cleanTable = decodeURIComponent(tableId);

  const verifyResult = await verifyTableScan(cleanTable, token || undefined, shopId);

  if (!verifyResult.isValid) {
    return NextResponse.redirect(new URL(`/table/${cleanTable}?invalid_scan=true${shopId ? `&shop=${shopId}` : ""}`, request.url));
  }

  // Set 60-minute session cookie and redirect to /table/[cleanTable]
  const now = Date.now();
  const sessionData = {
    tableNumber: cleanTable,
    tokenCode: verifyResult.table?.token_code || "PH-001",
    scannedAt: now,
    expiresAt: now + TABLE_SESSION_DURATION_MS,
    shopId: verifyResult.table?.shop_id || shopId || null,
  };

  const redirectUrl = `/table/${cleanTable}${shopId ? `?shop=${shopId}` : ""}`;
  const response = NextResponse.redirect(new URL(redirectUrl, request.url));
  response.cookies.set(TABLE_SESSION_COOKIE, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 3600, // 60 minutes in seconds
    path: "/",
  });

  return response;
}
