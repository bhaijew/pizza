import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * API Route: /api/download-pos
 * Redirects the client directly to the static POS installer executable in /public/release.
 * This avoids dynamic Node.js filesystem tracing during Turbopack builds and avoids
 * Vercel Serverless Function 50MB payload bundle limits.
 */
export async function GET(request: NextRequest) {
  const downloadUrl = new URL(
    "/release/Sole%20What%20Setup%201.6.2.exe",
    request.url
  );
  return NextResponse.redirect(downloadUrl, 307);
}
