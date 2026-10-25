export type BusinessType =
  | "fast_food"
  | "pizza"
  | "restaurant"
  | "cafe"
  | "bakery"
  | "retail";

export interface BusinessFeatureFlags {
  enable_kot: boolean;
  enable_tables: boolean;
  enable_riders: boolean;
  enable_deals: boolean;
  enable_barcodes: boolean;
  enable_weight_pricing: boolean;
  enable_bar_printer: boolean;
  enable_service_charges: boolean;
  default_portion_label: string;
}

export interface ModifierOptionTemplate {
  name: string;
  price_offset: number;
  is_default?: boolean;
}

export interface ModifierGroupTemplate {
  title: string;
  selection_type: "single" | "multiple";
  is_required: boolean;
  options: ModifierOptionTemplate[];
}

export interface BusinessPreset {
  id: BusinessType;
  title: string;
  tagline: string;
  badge: string;
  icon: string;
  features: BusinessFeatureFlags;
  portion_templates: { name: string; multiplier?: number }[];
  modifier_templates: ModifierGroupTemplate[];
}

export interface BusinessTheme {
  id: BusinessType;
  name: string;
  primary: string;           // Main theme color
  primaryHover: string;      // Hover / bright shade
  primaryGlow: string;       // Translucent glow
  primaryLight: string;      // Soft background tint
  primaryBorder: string;     // Border tint
  primaryDark: string;       // Darker accent
  gradient: string;          // Linear gradient
  accentEmoji: string;       // Icon / Emoji
  badgeBg: string;           // Badge background
  badgeText: string;         // Badge text color
  badgeBorder: string;       // Badge border
  sidebarActiveBg: string;   // Active nav link background
}

export const BUSINESS_THEMES: Record<BusinessType, BusinessTheme> = {
  fast_food: {
    id: "fast_food",
    name: "Fast Food",
    primary: "#ea580c",
    primaryHover: "#f97316",
    primaryGlow: "rgba(234, 88, 12, 0.28)",
    primaryLight: "#fff7ed",
    primaryBorder: "#fdba74",
    primaryDark: "#c2410c",
    gradient: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
    accentEmoji: "🍔",
    badgeBg: "rgba(234, 88, 12, 0.14)",
    badgeText: "#ea580c",
    badgeBorder: "rgba(234, 88, 12, 0.35)",
    sidebarActiveBg: "linear-gradient(90deg, rgba(234, 88, 12, 0.22) 0%, rgba(249, 115, 22, 0.08) 100%)",
  },
  pizza: {
    id: "pizza",
    name: "Pizzeria",
    primary: "#dc2626",
    primaryHover: "#ef4444",
    primaryGlow: "rgba(220, 38, 38, 0.28)",
    primaryLight: "#fef2f2",
    primaryBorder: "#fca5a5",
    primaryDark: "#b91c1c",
    gradient: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
    accentEmoji: "🍕",
    badgeBg: "rgba(220, 38, 38, 0.14)",
    badgeText: "#dc2626",
    badgeBorder: "rgba(220, 38, 38, 0.35)",
    sidebarActiveBg: "linear-gradient(90deg, rgba(220, 38, 38, 0.22) 0%, rgba(239, 68, 68, 0.08) 100%)",
  },
  restaurant: {
    id: "restaurant",
    name: "Restaurant",
    primary: "#059669",
    primaryHover: "#10b981",
    primaryGlow: "rgba(5, 150, 105, 0.28)",
    primaryLight: "#ecfdf5",
    primaryBorder: "#6ee7b7",
    primaryDark: "#047857",
    gradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    accentEmoji: "🍲",
    badgeBg: "rgba(5, 150, 105, 0.14)",
    badgeText: "#059669",
    badgeBorder: "rgba(5, 150, 105, 0.35)",
    sidebarActiveBg: "linear-gradient(90deg, rgba(5, 150, 105, 0.22) 0%, rgba(16, 185, 129, 0.08) 100%)",
  },
  cafe: {
    id: "cafe",
    name: "Cafe & Coffee",
    primary: "#d97706",
    primaryHover: "#f59e0b",
    primaryGlow: "rgba(217, 119, 6, 0.28)",
    primaryLight: "#fffbeb",
    primaryBorder: "#fcd34d",
    primaryDark: "#b45309",
    gradient: "linear-gradient(135deg, #b45309 0%, #d97706 100%)",
    accentEmoji: "☕",
    badgeBg: "rgba(217, 119, 6, 0.14)",
    badgeText: "#b45309",
    badgeBorder: "rgba(217, 119, 6, 0.35)",
    sidebarActiveBg: "linear-gradient(90deg, rgba(217, 119, 6, 0.22) 0%, rgba(245, 158, 11, 0.08) 100%)",
  },
  bakery: {
    id: "bakery",
    name: "Bakery & Sweets",
    primary: "#e11d48",
    primaryHover: "#f43f5e",
    primaryGlow: "rgba(225, 29, 72, 0.28)",
    primaryLight: "#fff1f2",
    primaryBorder: "#fda4af",
    primaryDark: "#be185d",
    gradient: "linear-gradient(135deg, #e11d48 0%, #fb7185 100%)",
    accentEmoji: "🎂",
    badgeBg: "rgba(225, 29, 72, 0.14)",
    badgeText: "#e11d48",
    badgeBorder: "rgba(225, 29, 72, 0.35)",
    sidebarActiveBg: "linear-gradient(90deg, rgba(225, 29, 72, 0.22) 0%, rgba(244, 63, 94, 0.08) 100%)",
  },
  retail: {
    id: "retail",
    name: "Retail & Mart",
    primary: "#4f46e5",
    primaryHover: "#6366f1",
    primaryGlow: "rgba(79, 70, 229, 0.28)",
    primaryLight: "#eef2ff",
    primaryBorder: "#a5b4fc",
    primaryDark: "#3730a3",
    gradient: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
    accentEmoji: "🛒",
    badgeBg: "rgba(79, 70, 229, 0.14)",
    badgeText: "#4f46e5",
    badgeBorder: "rgba(79, 70, 229, 0.35)",
    sidebarActiveBg: "linear-gradient(90deg, rgba(79, 70, 229, 0.22) 0%, rgba(99, 102, 241, 0.08) 100%)",
  },
};

export const BUSINESS_PRESETS: Record<BusinessType, BusinessPreset> = {
  fast_food: {
    id: "fast_food",
    title: "Fast Food, Burgers & Fried Chicken",
    tagline: "High-speed counter ordering, combos, modifiers & kitchen dispatch",
    badge: "Fast Food",
    icon: "Flame",
    features: {
      enable_kot: true,
      enable_tables: false,
      enable_riders: true,
      enable_deals: true,
      enable_barcodes: false,
      enable_weight_pricing: false,
      enable_bar_printer: false,
      enable_service_charges: false,
      default_portion_label: "Size / Combo",
    },
    portion_templates: [
      { name: "Single / Regular" },
      { name: "Double / Large" },
      { name: "Meal Deal (Burger + Fries + Drink)" },
    ],
    modifier_templates: [
      {
        title: "Patty & Cooking Style",
        selection_type: "single",
        is_required: false,
        options: [
          { name: "Crispy Fried", price_offset: 0, is_default: true },
          { name: "Double Patty", price_offset: 150 },
          { name: "Grilled Breast", price_offset: 50 },
        ],
      },
      {
        title: "Cheese & Add-ons",
        selection_type: "multiple",
        is_required: false,
        options: [
          { name: "Extra Mozzarella Slice", price_offset: 50 },
          { name: "Spicy Jalapenos", price_offset: 40 },
          { name: "Garlic Mayo Dip", price_offset: 50 },
          { name: "Chipotle Sauce", price_offset: 50 },
        ],
      },
      {
        title: "Spice Level",
        selection_type: "single",
        is_required: false,
        options: [
          { name: "Normal / Mild", price_offset: 0, is_default: true },
          { name: "Spicy Hot", price_offset: 0 },
          { name: "Extra Atomic Hot", price_offset: 30 },
        ],
      },
    ],
  },

  pizza: {
    id: "pizza",
    title: "Pizzeria & Artisan Oven",
    tagline: "Stone-baked pizza crusts, multi-size pans, extra cheese & toppings",
    badge: "Pizzeria",
    icon: "Pizza",
    features: {
      enable_kot: true,
      enable_tables: true,
      enable_riders: true,
      enable_deals: true,
      enable_barcodes: false,
      enable_weight_pricing: false,
      enable_bar_printer: false,
      enable_service_charges: false,
      default_portion_label: "Pizza Size",
    },
    portion_templates: [
      { name: "Small (7-8 Inch)" },
      { name: "Medium (10-11 Inch)" },
      { name: "Large (13-14 Inch)" },
      { name: "Extra Large (16 Inch)" },
    ],
    modifier_templates: [
      {
        title: "Crust Style",
        selection_type: "single",
        is_required: false,
        options: [
          { name: "Classic Thin Crust", price_offset: 0, is_default: true },
          { name: "Deep Pan / Thick Crust", price_offset: 0 },
          { name: "Cheese Stuffed Crust", price_offset: 150 },
          { name: "Crown Crust / Kabab Crust", price_offset: 200 },
        ],
      },
      {
        title: "Extra Toppings",
        selection_type: "multiple",
        is_required: false,
        options: [
          { name: "Extra Mozzarella Cheese", price_offset: 120 },
          { name: "Black Olives", price_offset: 80 },
          { name: "Fresh Mushrooms", price_offset: 100 },
          { name: "Grilled Chicken Chunks", price_offset: 150 },
        ],
      },
    ],
  },

  restaurant: {
    id: "restaurant",
    title: "Dine-In Restaurant, Karahi & BBQ",
    tagline: "Table floor maps, family portions, handi/karahi weights & guest bills",
    badge: "Dine-In Restaurant",
    icon: "UtensilsCrossed",
    features: {
      enable_kot: true,
      enable_tables: true,
      enable_riders: true,
      enable_deals: true,
      enable_barcodes: false,
      enable_weight_pricing: true,
      enable_bar_printer: false,
      enable_service_charges: true,
      default_portion_label: "Portion Size",
    },
    portion_templates: [
      { name: "Single Plate" },
      { name: "Double Plate" },
      { name: "Half Portion (0.5 Kg)" },
      { name: "Full Portion (1.0 Kg)" },
      { name: "Family Pack" },
    ],
    modifier_templates: [
      {
        title: "Cooking Style & Gravy",
        selection_type: "single",
        is_required: false,
        options: [
          { name: "Desi Ghee / Butter", price_offset: 200 },
          { name: "Normal Cooking Oil", price_offset: 0, is_default: true },
          { name: "Dry Roasted / Bhuna", price_offset: 0 },
        ],
      },
      {
        title: "Sides & Accompaniments",
        selection_type: "multiple",
        is_required: false,
        options: [
          { name: "Zeera Raita", price_offset: 60 },
          { name: "Fresh Kachumber Salad", price_offset: 70 },
          { name: "Roghni Naan", price_offset: 70 },
          { name: "Garlic Butter Naan", price_offset: 90 },
        ],
      },
    ],
  },

  cafe: {
    id: "cafe",
    title: "Cafe, Chai Bar, Shakes & Dessert",
    tagline: "Rapid beverage tokens, barista modifiers, sugar/milk adjustments",
    badge: "Cafe & Chai",
    icon: "Coffee",
    features: {
      enable_kot: false,
      enable_tables: true,
      enable_riders: false,
      enable_deals: true,
      enable_barcodes: false,
      enable_weight_pricing: false,
      enable_bar_printer: true,
      enable_service_charges: false,
      default_portion_label: "Serving Size",
    },
    portion_templates: [
      { name: "Regular Cup" },
      { name: "Large Mug" },
      { name: "Matka / Clay Pot" },
    ],
    modifier_templates: [
      {
        title: "Sweetness & Sugar",
        selection_type: "single",
        is_required: false,
        options: [
          { name: "Regular Sugar", price_offset: 0, is_default: true },
          { name: "Less Sugar (Phati Hui)", price_offset: 0 },
          { name: "Zero Sugar / Sugar-Free", price_offset: 0 },
          { name: "Shakkar / Gurr (Jaggery)", price_offset: 30 },
        ],
      },
      {
        title: "Milk & Base",
        selection_type: "single",
        is_required: false,
        options: [
          { name: "Fresh Buffalo Milk", price_offset: 0, is_default: true },
          { name: "Cardamom / Elaichi Infused", price_offset: 30 },
          { name: "Almond Milk", price_offset: 100 },
        ],
      },
      {
        title: "Cafe Add-ons & Toppings",
        selection_type: "multiple",
        is_required: false,
        options: [
          { name: "Extra Malai / Cream", price_offset: 40 },
          { name: "Vanilla Ice Cream Scoop", price_offset: 100 },
          { name: "Caramel Drizzle", price_offset: 50 },
        ],
      },
    ],
  },

  bakery: {
    id: "bakery",
    title: "Bakery, Sweets & Cake Boutique",
    tagline: "Weight-based pastry/mithai pricing, custom advance cakes & gift boxes",
    badge: "Bakery & Sweets",
    icon: "Cake",
    features: {
      enable_kot: false,
      enable_tables: false,
      enable_riders: true,
      enable_deals: false,
      enable_barcodes: true,
      enable_weight_pricing: true,
      enable_bar_printer: false,
      enable_service_charges: false,
      default_portion_label: "Weight / Pack",
    },
    portion_templates: [
      { name: "1/2 Pound" },
      { name: "1 Pound" },
      { name: "2 Pound" },
      { name: "0.5 Kg (Half Kg)" },
      { name: "1.0 Kg (One Kg)" },
    ],
    modifier_templates: [
      {
        title: "Packaging & Presentation",
        selection_type: "single",
        is_required: false,
        options: [
          { name: "Standard Bakery Box", price_offset: 0, is_default: true },
          { name: "Luxury Gift Box & Ribbon", price_offset: 150 },
          { name: "Mithai Tin Container", price_offset: 200 },
        ],
      },
      {
        title: "Birthday & Celebration Kit",
        selection_type: "multiple",
        is_required: false,
        options: [
          { name: "Sparkler Candle Set", price_offset: 120 },
          { name: "Custom Name Tag Plaque", price_offset: 80 },
          { name: "Cutting Knife & Paper Plates", price_offset: 60 },
        ],
      },
    ],
  },

  retail: {
    id: "retail",
    title: "Retail Mart, Grocery & Mini Supermarket",
    tagline: "Barcode scanner integration, instant item lookup & quick checkout",
    badge: "Retail Mart",
    icon: "ShoppingBag",
    features: {
      enable_kot: false,
      enable_tables: false,
      enable_riders: false,
      enable_deals: false,
      enable_barcodes: true,
      enable_weight_pricing: true,
      enable_bar_printer: false,
      enable_service_charges: false,
      default_portion_label: "Packaging Unit",
    },
    portion_templates: [
      { name: "Per Piece / Single Unit" },
      { name: "Pack of 6" },
      { name: "Carton / Box of 12" },
      { name: "Per Kg Loose" },
    ],
    modifier_templates: [
      {
        title: "Pricing Tier",
        selection_type: "single",
        is_required: false,
        options: [
          { name: "Retail Price", price_offset: 0, is_default: true },
          { name: "Wholesale Rate (Bulk)", price_offset: -50 },
        ],
      },
    ],
  },
};
