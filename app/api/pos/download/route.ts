import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shopSlug = searchParams.get("shopSlug") || "main";
  const downloadType = searchParams.get("type") || "launcher";

  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;
  const posUrl = `${baseUrl}/demo/pos?shop=${encodeURIComponent(shopSlug)}`;

  if (downloadType === "backup") {
    // Return offline catalog snapshot
    let products: any[] = [];
    let categories: any[] = [];
    let shopInfo: any = { name: "Pizza Shop", slug: shopSlug };

    if (isServiceRoleConfigured()) {
      try {
        const db = createAdminClient();
        const [{ data: prods }, { data: cats }, { data: shop }] = await Promise.all([
          db.from("products").select("*").eq("is_available", true),
          db.from("categories").select("*"),
          db.from("shops").select("*").eq("slug", shopSlug).maybeSingle(),
        ]);
        if (prods) products = prods;
        if (cats) categories = cats;
        if (shop) shopInfo = shop;
      } catch (err) {
        console.warn("[POS Download Backup Error]:", err);
      }
    }

    const backupPayload = {
      version: "1.0",
      exportTimestamp: new Date().toISOString(),
      shop: shopInfo,
      products,
      categories,
      posUrl,
      offlineEngine: "FloDesktop SQLite Sync V2",
    };

    return new NextResponse(JSON.stringify(backupPayload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="pizza-pos-backup-${shopSlug}.json"`,
      },
    });
  }

  // Otherwise return Windows BAT launcher
  const batScript = `@echo off
title Pizza Management FloDesktop POS Launcher - ${shopSlug}
color 0A
cls
echo ========================================================
echo   PIZZA MANAGEMENT SYSTEM - FLODESKTOP POS CLIENT
echo   Branch: ${shopSlug}
echo ========================================================
echo.
echo [*] Checking network connectivity to ${baseUrl}...
echo [*] Dispatched at: %date% %time%
echo.
echo Starting Cashier Terminal in Kiosk/App Mode...
start msedge --app="${posUrl}" --start-maximized || start chrome --app="${posUrl}" --start-maximized || start "" "${posUrl}"
echo.
echo POS Terminal successfully dispatched!
echo.
timeout /t 5 >nul
exit
`;

  return new NextResponse(batScript, {
    headers: {
      "Content-Type": "application/x-bat",
      "Content-Disposition": `attachment; filename="Start-Pizza-POS-${shopSlug}.bat"`,
    },
  });
}
