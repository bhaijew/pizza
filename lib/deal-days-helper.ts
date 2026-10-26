/**
 * Deal Days Helper — Monday to Sunday Day Deals parsing and filtering.
 */
export type WeekDay = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface DayInfo {
  key: WeekDay;
  label: string;
  short: string;
  emoji: string;
  tagline: string;
}

export const WEEK_DAYS: DayInfo[] = [
  { key: "monday", label: "Monday", short: "Mon", emoji: "🍕", tagline: "Monday Madness Specials" },
  { key: "tuesday", label: "Tuesday", short: "Tue", emoji: "🍔", tagline: "Tuesday Zinger Craves" },
  { key: "wednesday", label: "Wednesday", short: "Wed", emoji: "🌯", tagline: "Wednesday Midweek Feast" },
  { key: "thursday", label: "Thursday", short: "Thu", emoji: "🍗", tagline: "Thursday Tikka Treat" },
  { key: "friday", label: "Friday", short: "Fri", emoji: "🍟", tagline: "Friday Family Fiesta" },
  { key: "saturday", label: "Saturday", short: "Sat", emoji: "🎉", tagline: "Saturday Super Weekend" },
  { key: "sunday", label: "Sunday", short: "Sun", emoji: "👨‍👩‍👧", tagline: "Sunday Mega Saver" },
];

export function getTodayDay(): WeekDay {
  const days: WeekDay[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const now = new Date();
  return days[now.getDay()];
}

export function parseDealDays(dealOrProduct?: {
  badge?: string | null;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  items_included?: any;
} | null): WeekDay[] | "all" {
  if (!dealOrProduct) return "all";

  const itemsText = Array.isArray(dealOrProduct.items_included)
    ? dealOrProduct.items_included.join(" ")
    : typeof dealOrProduct.items_included === "string"
    ? dealOrProduct.items_included
    : "";

  const text = [
    dealOrProduct.badge || "",
    dealOrProduct.title || "",
    dealOrProduct.name || "",
    dealOrProduct.description || "",
    itemsText,
  ]
    .join(" ")
    .toLowerCase();

  // 1. Explicit tag: e.g. [days:mon,tue] or [days:all]
  const tagMatch = text.match(/\[days?:([^\]]+)\]/);
  if (tagMatch) {
    const raw = tagMatch[1].toLowerCase();
    if (raw.includes("all") || raw.includes("everyday")) return "all";
    const matched: WeekDay[] = [];
    if (raw.includes("mon")) matched.push("monday");
    if (raw.includes("tue")) matched.push("tuesday");
    if (raw.includes("wed")) matched.push("wednesday");
    if (raw.includes("thu")) matched.push("thursday");
    if (raw.includes("fri")) matched.push("friday");
    if (raw.includes("sat")) matched.push("saturday");
    if (raw.includes("sun")) matched.push("sunday");
    if (matched.length > 0) return matched;
  }

  // 2. Keyword detection
  const matchedDays: WeekDay[] = [];
  if (text.includes("monday") || text.includes("mon deal")) matchedDays.push("monday");
  if (text.includes("tuesday") || text.includes("tue deal")) matchedDays.push("tuesday");
  if (text.includes("wednesday") || text.includes("wed deal")) matchedDays.push("wednesday");
  if (text.includes("thursday") || text.includes("thu deal")) matchedDays.push("thursday");
  if (text.includes("friday") || text.includes("fri deal")) matchedDays.push("friday");
  if (text.includes("saturday") || text.includes("sat deal")) matchedDays.push("saturday");
  if (text.includes("sunday") || text.includes("sun deal")) matchedDays.push("sunday");

  if (text.includes("weekend")) {
    if (!matchedDays.includes("saturday")) matchedDays.push("saturday");
    if (!matchedDays.includes("sunday")) matchedDays.push("sunday");
  }

  if (matchedDays.length > 0) {
    return matchedDays;
  }

  // 3. Fallback: Available every day
  return "all";
}

export function isDealAvailableOnDay(dealOrProduct: any, targetDay: WeekDay | "all"): boolean {
  if (targetDay === "all") return true;
  const days = parseDealDays(dealOrProduct);
  if (days === "all") return true;
  return days.includes(targetDay);
}

export function formatDealDaysBadge(days: WeekDay[] | "all"): string {
  if (days === "all") return "Everyday";
  if (days.length === 7) return "Everyday";
  if (days.length === 1) {
    const d = WEEK_DAYS.find((w) => w.key === days[0]);
    return d ? `${d.label} Special` : "Day Deal";
  }
  return days.map((k) => WEEK_DAYS.find((w) => w.key === k)?.short || k).join(" • ");
}
