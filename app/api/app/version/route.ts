import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      version: "1.0.20",
      version_code: 20,
      download_url: "https://solewhat.store/pizza-admin.apk",
      release_notes:
        "SoleWhat Admin App v1.0.20 with multi-tenant branch isolation, real-time live order sync, and staff PIN authentication.",
      min_supported_version: "1.0.18",
      force_update: false,
      published_at: "2026-11-17T11:30:00Z",
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    }
  );
}
