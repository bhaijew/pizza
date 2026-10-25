import { NextRequest, NextResponse } from "next/server";
import { getShopBusinessProfile, BUSINESS_PRESETS, BusinessType } from "@/lib/business-config";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopIdParam = searchParams.get("shopId");
    const shopId = shopIdParam ? parseInt(shopIdParam, 10) : null;

    const profile = await getShopBusinessProfile(shopId);
    const preset = BUSINESS_PRESETS[profile.business_type as BusinessType] || BUSINESS_PRESETS.fast_food;

    return NextResponse.json({
      success: true,
      shop_id: shopId,
      business_type: profile.business_type,
      features: profile.features,
      preset: {
        title: preset.title,
        tagline: preset.tagline,
        badge: preset.badge,
        icon: preset.icon,
        default_portion_label: preset.features.default_portion_label,
        portion_templates: preset.portion_templates,
        modifier_templates: preset.modifier_templates,
      },
    });
  } catch (error: any) {
    console.error("[api/shop-config] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch shop config" },
      { status: 500 }
    );
  }
}
