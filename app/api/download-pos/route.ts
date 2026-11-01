import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * API Route: /api/download-pos
 * Redirects the client directly to the static POS installer executable in /public/release.
 * This avoids dynamic Node.js filesystem tracing during Turbopack builds and avoids
 * Vercel Serverless Function 50MB payload bundle limits.
 */
export async function GET(request: NextRequest) {
  // Direct download from GitHub Releases latest version (v1.8.4)
  const githubReleaseUrl = "https://github.com/bhaijew/sole/releases/download/v1.8.4/Sole-What-Setup-1.8.4.exe";
  return NextResponse.redirect(githubReleaseUrl, 307);
}
