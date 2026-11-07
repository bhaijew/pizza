import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import { SUPER_ADMIN_COOKIE, verifySuperAdminSessionToken } from "@/lib/super-admin-auth";

/**
 * Next.js 16 Proxy Convention (replaces deprecated middleware.js)
 * Handles:
 * 1. Super Admin & Store Manager auth session guards
 * 2. Wildcard Subdomain Routing (e.g. pizza-mafia.solewhat.store -> /[shopSlug])
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Refresh Supabase session cookies
  const supabaseResponse = createClient(request);

  // Extract shop slug from subdomain (if applicable)
  const rawHost = (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    ""
  ).toLowerCase();
  const host = rawHost.split(":")[0]; // strip port

  let subdomain: string | null = null;
  if (host.endsWith(".solewhat.store")) {
    const part = host.replace(".solewhat.store", "").trim();
    if (part && part !== "www") {
      subdomain = part;
    }
  } else if (host.endsWith(".localhost")) {
    const part = host.replace(".localhost", "").trim();
    if (part && part !== "www") {
      subdomain = part;
    }
  }

  // 1. Guard Super Admin routes (not login)
  if (pathname.startsWith("/super-admin") && !pathname.startsWith("/super-admin/login")) {
    const token = request.cookies.get(SUPER_ADMIN_COOKIE)?.value;
    const valid = token ? await verifySuperAdminSessionToken(token) : false;

    if (!valid) {
      const loginUrl = new URL("/super-admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Guard Store Manager Admin routes (not login)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    const session = token ? await verifyAdminSession(token) : null;

    if (!session) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Tenant Boundary Guard: If visiting a specific shop subdomain (e.g. demo.solewhat.store/admin),
    // ensure session belongs to this shop (or is Master Admin).
    // An admin of "pizza-mafia" cannot access "demo.solewhat.store/admin".
    if (
      subdomain &&
      !session.isMaster &&
      session.shopSlug &&
      session.shopSlug.toLowerCase() !== subdomain.toLowerCase()
    ) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Path-based shop prefix normalization for global utility routes
  // e.g. /pizza-mafia/scan/T1 -> /scan/T1?shopSlug=pizza-mafia
  // e.g. /pizza-mafia/table/T1 -> /table/T1?shopSlug=pizza-mafia
  // e.g. /pizza-mafia/display -> /display?shopSlug=pizza-mafia
  // e.g. /pizza-mafia/review/ORD-001 -> /review/ORD-001?shopSlug=pizza-mafia
  const prefixedGlobalMatch = pathname.match(
    /^\/([^/]+)\/(scan|table|track|delivery|display|review)(\/.*)?$/i
  );
  if (prefixedGlobalMatch) {
    const possibleSlug = prefixedGlobalMatch[1].toLowerCase();
    const globalRoute = prefixedGlobalMatch[2].toLowerCase();
    const restPath = prefixedGlobalMatch[3] || "";
    const topLevelReserved = new Set([
      "api",
      "_next",
      "super-admin",
      "admin",
      "scan",
      "table",
      "track",
      "delivery",
      "display",
      "review",
      "menu",
      "menu2",
      "shop",
      "demo",
      "todos",
      "kitchen",
    ]);
    if (!topLevelReserved.has(possibleSlug)) {
      const targetUrl = new URL(`/${globalRoute}${restPath}${search}`, request.url);
      if (!targetUrl.searchParams.has("shopSlug")) {
        targetUrl.searchParams.set("shopSlug", possibleSlug);
      }
      return NextResponse.rewrite(targetUrl, {
        headers: supabaseResponse.headers,
      });
    }
  }

  // 4. Wildcard Subdomain Routing
  // (Uses subdomain resolved at the start of proxy)
  if (subdomain) {
    const isSystemReserved =
      pathname.startsWith("/api") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/super-admin") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/favicon.ico") ||
      pathname.startsWith("/robots.txt") ||
      pathname.startsWith("/sitemap.xml");

    // Global customer routes that live at root app/ level (/scan, /table, /track, /delivery, /display, /review, /menu2, /demo, /todos)
    const isGlobalCustomerRoute =
      pathname === "/scan" ||
      pathname.startsWith("/scan/") ||
      pathname === "/table" ||
      pathname.startsWith("/table/") ||
      pathname === "/track" ||
      pathname.startsWith("/track/") ||
      pathname === "/delivery" ||
      pathname.startsWith("/delivery/") ||
      pathname === "/display" ||
      pathname.startsWith("/display/") ||
      pathname === "/review" ||
      pathname.startsWith("/review/") ||
      pathname === "/menu2" ||
      pathname.startsWith("/menu2/") ||
      pathname === "/demo" ||
      pathname.startsWith("/demo/") ||
      pathname === "/todos" ||
      pathname.startsWith("/todos/");

    if (isGlobalCustomerRoute) {
      // Keep global route path intact (/scan/T1, /table/T1, etc.) and pass subdomain as shopSlug if not present
      const targetUrl = new URL(`${pathname}${search}`, request.url);
      if (!targetUrl.searchParams.has("shopSlug")) {
        targetUrl.searchParams.set("shopSlug", subdomain);
      }
      return NextResponse.rewrite(targetUrl, {
        headers: supabaseResponse.headers,
      });
    }

    if (!isSystemReserved) {
      if (!pathname.startsWith(`/${subdomain}`)) {
        const rewriteTarget = `/${subdomain}${pathname === "/" ? "" : pathname}${search}`;
        return NextResponse.rewrite(new URL(rewriteTarget, request.url), {
          headers: supabaseResponse.headers,
        });
      }
    }
  }

  return supabaseResponse;
}

// Backward compatibility export
export const middleware = proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public asset extensions (.png, .jpg, .svg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
