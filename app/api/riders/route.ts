import { NextResponse } from "next/server";
import { fetchDeliveryRiders } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shopIdParam = searchParams.get("shopId");
    const shopId = shopIdParam ? Number(shopIdParam) : undefined;

    const riders = await fetchDeliveryRiders(shopId);
    return NextResponse.json({ success: true, riders });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, riders: [], error: err.message },
      { status: 500 }
    );
  }
}
