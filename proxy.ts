import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";
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
    const valid = token ? await verifySessionToken(token) : false;

    if (!valid) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Wildcard Subdomain Routing
  // Extracts shop slug from subdomains like:
  // - pizza-mafia.solewhat.store -> rewrites internally to /pizza-mafia
  // - pizza-mafia.localhost:3000 -> rewrites internally to /pizza-mafia
  const rawHost = request.headers.get("host")?.toLowerCase() || "";
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

  if (subdomain) {
    const isReserved =
      pathname.startsWith("/api") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/super-admin") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/favicon.ico") ||
      pathname.startsWith("/robots.txt") ||
      pathname.startsWith("/sitemap.xml");

    if (!isReserved) {
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
