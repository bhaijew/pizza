import { NextResponse } from "next/server";
import { verifyTableScan, fetchShopBySlugOrId } from "@/lib/menu-data";
import { TABLE_SESSION_COOKIE, TABLE_SESSION_DURATION_MS } from "@/lib/table-session";

export const dynamic = "force-dynamic";

function buildPublicOrigin(request: Request): string {
  const reqUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedHost) {
    const proto = forwardedProto ? forwardedProto.split(",")[0].trim() : reqUrl.protocol.replace(":", "");
    return `${proto}://${forwardedHost.split(",")[0].trim()}`;
  }
  return reqUrl.origin;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tableId: string }> }
) {
  const { tableId } = await params;
  const reqUrl = new URL(request.url);
  const { searchParams } = reqUrl;
  const token = searchParams.get("token") || searchParams.get("key");
  const shopParam = searchParams.get("shop");
  const shopSlugParam = searchParams.get("shopSlug");
  const cleanTable = decodeURIComponent(tableId).trim();

  let shopId: number | undefined = shopParam ? parseInt(shopParam, 10) : undefined;

  // If shopId not explicitly passed in ?shop=, resolve from ?shopSlug= or subdomain
  if (!shopId || isNaN(shopId)) {
    let candidateSlug = shopSlugParam || "";
    if (!candidateSlug) {
      const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "")
        .toLowerCase()
        .split(":")[0];
      if (host.endsWith(".solewhat.store")) {
        const sub = host.replace(".solewhat.store", "").trim();
        if (sub && sub !== "www") candidateSlug = sub;
      } else if (host.endsWith(".localhost")) {
        const sub = host.replace(".localhost", "").trim();
        if (sub && sub !== "www") candidateSlug = sub;
      }
    }

    if (candidateSlug) {
      const resolvedShop = await fetchShopBySlugOrId(candidateSlug);
      if (resolvedShop?.id) {
        shopId = Number(resolvedShop.id);
      }
    }
  }

  const publicOrigin = buildPublicOrigin(request);
  const verifyResult = await verifyTableScan(cleanTable, token || undefined, shopId);

  const finalShopId = verifyResult.table?.shop_id || shopId || null;

  if (!verifyResult.isValid) {
    const invalidUrl = new URL(
      `/table/${encodeURIComponent(cleanTable)}?invalid_scan=true${finalShopId ? `&shop=${finalShopId}` : ""}`,
      publicOrigin
    );
    return NextResponse.redirect(invalidUrl);
  }

  // Set 60-minute session cookie and redirect to /table/[cleanTable]
  const now = Date.now();
  const sessionData = {
    tableNumber: cleanTable,
    tokenCode: verifyResult.table?.token_code || token || "PH-001",
    scannedAt: now,
    expiresAt: now + TABLE_SESSION_DURATION_MS,
    shopId: finalShopId,
  };

  const redirectUrl = new URL(
    `/table/${encodeURIComponent(cleanTable)}${finalShopId ? `?shop=${finalShopId}` : ""}`,
    publicOrigin
  );
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(TABLE_SESSION_COOKIE, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 3600, // 60 minutes in seconds
    path: "/",
  });

  return response;
}
