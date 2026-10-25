import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
export * from "./business-themes";
import { BusinessType, BusinessFeatureFlags, BUSINESS_PRESETS } from "./business-themes";

export interface ShopBusinessProfile {
  business_type: BusinessType;
  features: BusinessFeatureFlags;
  updated_at?: string;
}

// Resilient memory cache
const inMemoryConfigStore: Record<string, ShopBusinessProfile> = {};

function readLocalBusinessConfig(): Record<string, ShopBusinessProfile> {
  return inMemoryConfigStore;
}

function writeLocalBusinessConfig(data: Record<string, ShopBusinessProfile>) {
  Object.assign(inMemoryConfigStore, data);
}

/**
 * Get business configuration and feature flags for a shop
 */
export async function getShopBusinessProfile(
  shopId: number | string | null | undefined
): Promise<ShopBusinessProfile> {
  const targetKey = shopId ? String(shopId) : "main";
  const localStore = readLocalBusinessConfig();
  const localRecord = localStore[targetKey];

  // Fallback defaults to fast_food preset
  const defaultProfile: ShopBusinessProfile = {
    business_type: "fast_food",
    features: { ...BUSINESS_PRESETS.fast_food.features },
  };

  if (isServiceRoleConfigured()) {
    try {
      const db = createAdminClient();
      if (shopId) {
        const { data } = await db
          .from("shops")
          .select("business_type, feature_flags, notes")
          .eq("id", shopId)
          .maybeSingle();

        // 1. Direct business_type column from migration 027
        if (data?.business_type) {
          const bType = data.business_type as BusinessType;
          return {
            business_type: bType,
            features: {
              ...BUSINESS_PRESETS[bType]?.features,
              ...(data.feature_flags || {}),
            },
          };
        }

        // 2. Check if business profile was stored in JSON block within notes
        if (data?.notes && data.notes.includes("[BIZ_PROFILE:")) {
          const match = data.notes.match(/\[BIZ_PROFILE:\s*({[^\]]+})\]/);
          if (match) {
            const parsed = JSON.parse(match[1]);
            return {
              business_type: parsed.business_type || "fast_food",
              features: {
                ...BUSINESS_PRESETS[parsed.business_type as BusinessType]?.features,
                ...(parsed.features || {}),
              },
            };
          }
        }
      }
    } catch {
      // Fall through to local record
    }
  }

  if (localRecord) {
    return localRecord;
  }

  return defaultProfile;
}

/**
 * Save business configuration and feature flags for a shop
 */
export async function saveShopBusinessProfile(
  shopId: number | string | null | undefined,
  businessType: BusinessType,
  featureOverrides?: Partial<BusinessFeatureFlags>
): Promise<{ success: boolean; data: ShopBusinessProfile; error?: string }> {
  const targetKey = shopId ? String(shopId) : "main";
  const preset = BUSINESS_PRESETS[businessType] || BUSINESS_PRESETS.fast_food;

  const updatedProfile: ShopBusinessProfile = {
    business_type: businessType,
    features: {
      ...preset.features,
      ...(featureOverrides || {}),
    },
    updated_at: new Date().toISOString(),
  };

  // 1. Save to in-memory store
  const localStore = readLocalBusinessConfig();
  localStore[targetKey] = updatedProfile;
  writeLocalBusinessConfig(localStore);

  // 2. Persist to Supabase shop notes block seamlessly
  if (isServiceRoleConfigured() && shopId) {
    try {
      const db = createAdminClient();
      const { data: existingShop } = await db
        .from("shops")
        .select("notes")
        .eq("id", shopId)
        .maybeSingle();

      let currentNotes = existingShop?.notes || "";
      const profileJson = JSON.stringify({
        business_type: updatedProfile.business_type,
        features: updatedProfile.features,
      });
      const tag = `[BIZ_PROFILE: ${profileJson}]`;

      if (currentNotes.includes("[BIZ_PROFILE:")) {
        currentNotes = currentNotes.replace(/\[BIZ_PROFILE:[^\]]+\]/, tag);
      } else {
        currentNotes = currentNotes ? `${currentNotes} | ${tag}` : tag;
      }

      await db.from("shops").update({ notes: currentNotes }).eq("id", shopId);
    } catch (err) {
      console.warn("[business-config] Supabase shop notes update skipped:", err);
    }
  }

  return { success: true, data: updatedProfile };
}
