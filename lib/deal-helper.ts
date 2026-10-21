import type { Product } from "@/types/menu";

/**
 * Extracts included combo/deal items from a product.
 * Supports:
 * 1. Structured items_included array on Product/Deal
 * 2. JSON or comma-separated string items_included
 * 3. Formatted description (bullet separated "•", newlines "\n", plus "+", commas)
 */
export function getDealItems(product: Product | null | undefined): string[] {
  if (!product) return [];

  // 1. Direct items_included array
  if (Array.isArray(product.items_included) && product.items_included.length > 0) {
    return product.items_included
      .map((s) => String(s).trim())
      .filter((s) => s.length > 0);
  }

  // 2. Direct items_included string (JSON or comma separated)
  if (typeof (product as any).items_included === "string" && (product as any).items_included.trim()) {
    try {
      const parsed = JSON.parse((product as any).items_included);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((s) => String(s).trim()).filter((s) => s.length > 0);
      }
    } catch {
      const parts = (product as any).items_included
        .split(",")
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
      if (parts.length > 0) return parts;
    }
  }

  // 3. Check if product is marked as a deal or categorized under Deals
  const isDeal =
    product.is_deal === true ||
    product.category?.name?.toLowerCase().includes("deal") ||
    product.category?.slug?.toLowerCase().includes("deal") ||
    product.name?.toLowerCase().includes("deal") ||
    product.name?.toLowerCase().includes("combo") ||
    product.name?.toLowerCase().includes("pack");

  // 4. Parse from description
  if (product.description) {
    const desc = product.description.trim();

    // Bullet points "•" or "·"
    if (desc.includes("•") || desc.includes("·")) {
      const sep = desc.includes("•") ? "•" : "·";
      const parts = desc
        .split(sep)
        .map((s) => s.replace(/^[•\-\*✓\d+\.]\s*/, "").trim())
        .filter(Boolean);
      if (parts.length > 1 || (isDeal && parts.length > 0)) {
        return parts;
      }
    }

    // Newlines
    if (desc.includes("\n")) {
      const lines = desc
        .split("\n")
        .map((s) => s.replace(/^[•\-\*✓\d+\.]\s*/, "").trim())
        .filter(Boolean);
      if (lines.length > 1) {
        return lines;
      }
    }

    // Plus separated (e.g. "1 Regular Pizza + 1 Garlic Bread + 1 Drink")
    if (desc.includes("+")) {
      const parts = desc.split("+").map((s) => s.trim()).filter(Boolean);
      if (parts.length > 1) {
        return parts;
      }
    }

    // Comma separated if it's explicitly a deal
    if (isDeal && desc.includes(",")) {
      const parts = desc.split(",").map((s) => s.trim()).filter(Boolean);
      if (parts.length > 1) {
        return parts;
      }
    }
  }

  return [];
}
