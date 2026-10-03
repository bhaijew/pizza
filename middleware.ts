import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";
import { SUPER_ADMIN_COOKIE, verifySuperAdminSessionToken } from "@/lib/super-admin-auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/super-admin/:path*"],
};
