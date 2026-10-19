/**
 * Utility functions for Pizza Shop Operating Hours & Cross-Midnight Business Shifts.
 *
 * Example:
 * Shop opens at 11:00 AM and closes at 01:00 AM (next morning).
 * An order placed at 12:30 AM (midnight) belongs to that night's business shift,
 * NOT the next calendar day!
 *
 * All conversions strictly respect Pakistan Standard Time (PKT / UTC+5).
 */

const PKT_OFFSET_HOURS = 5; // Asia/Karachi UTC+5

export interface ShopOperatingHours {
  openingTime: string; // e.g. "11:00"
  closingTime: string; // e.g. "01:00"
}

/**
 * Parses "HH:mm" into hours and minutes
 */
function parseTime(timeStr?: string): { hours: number; minutes: number } {
  if (!timeStr || !timeStr.includes(":")) {
    return { hours: 11, minutes: 0 };
  }
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return {
    hours: isNaN(hours) ? 11 : Math.max(0, Math.min(23, hours)),
    minutes: isNaN(minutes) ? 0 : Math.max(0, Math.min(59, minutes)),
  };
}

/**
 * Returns the current date in Pakistan Time (YYYY-MM-DD)
 */
export function getPakistanNow(): Date {
  const now = new Date();
  // Get time in UTC milliseconds and add PKT offset (+5 hours)
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + PKT_OFFSET_HOURS * 3600000);
}

/**
 * Returns formatted YYYY-MM-DD string for a given Date
 */
export function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Determines the current active business date (YYYY-MM-DD).
 * If the shop opens at 11:00 and closes at 01:00:
 * At 00:30 AM (after midnight), the active business date is YESTERDAY.
 * Between 01:00 AM and 11:00 AM (closed hours before morning opening),
 * it also maintains yesterday's report until the new shift opens at 11:00 AM.
 */
export function getCurrentBusinessDate(
  openingTime = "11:00",
  closingTime = "01:00"
): string {
  const pktNow = getPakistanNow();
  const { hours: openH, minutes: openM } = parseTime(openingTime);
  const currentTotalMins = pktNow.getHours() * 60 + pktNow.getMinutes();
  const openTotalMins = openH * 60 + openM;

  // If current PKT time is before the shop's opening time (e.g. 12:30 AM night or 9:00 AM morning),
  // then we are still in yesterday's operational cycle / shift!
  if (currentTotalMins < openTotalMins) {
    const yesterday = new Date(pktNow.getTime() - 24 * 3600000);
    return formatDateStr(yesterday);
  }

  return formatDateStr(pktNow);
}

/**
 * Calculates the exact UTC ISO start and end timestamp for a given business day.
 *
 * For dateStr = "2026-10-19", opening = "11:00", closing = "01:00":
 * Start PKT: 2026-10-19 11:00:00 (UTC: 2026-10-19 06:00:00Z)
 * End PKT:   2026-10-20 01:00:00 + grace (UTC: 2026-10-19 20:00:00Z + buffer until next opening)
 */
export function getBusinessShiftUtcRange(
  businessDateStr: string,
  openingTime = "11:00",
  closingTime = "01:00"
): { startUtc: string; endUtc: string; label: string } {
  const { hours: openH, minutes: openM } = parseTime(openingTime);
  const { hours: closeH, minutes: closeM } = parseTime(closingTime);

  const [yearStr, monthStr, dayStr] = businessDateStr.split("-");
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10) - 1;
  const d = parseInt(dayStr, 10);

  // Construct start time in PKT
  // UTC Date: year, month, day, openH - 5, openM
  const startEpoch = Date.UTC(y, m, d, openH - PKT_OFFSET_HOURS, openM, 0, 0);
  const startDate = new Date(startEpoch);

  // If closing hour <= opening hour, closing extends past midnight into the next day
  const isCrossMidnight = closeH < openH || (closeH === openH && closeM <= openM);
  const closingDay = isCrossMidnight ? d + 1 : d;

  // Buffer: Give a 59-minute closing buffer or extend until next opening so last-minute orders are never lost
  const endEpoch = Date.UTC(y, m, closingDay, closeH - PKT_OFFSET_HOURS, closeM, 59, 999);
  const endDate = new Date(endEpoch);

  return {
    startUtc: startDate.toISOString(),
    endUtc: endDate.toISOString(),
    label: `${openingTime} to ${closingTime}${isCrossMidnight ? " (Next Day)" : ""}`,
  };
}

/**
 * Checks if a specific order's created_at timestamp falls within today's business shift
 */
export function isOrderInTodayShift(
  orderCreatedAt: string,
  openingTime = "11:00",
  closingTime = "01:00"
): boolean {
  if (!orderCreatedAt) return false;
  const currentBusinessDate = getCurrentBusinessDate(openingTime, closingTime);
  const { startUtc, endUtc } = getBusinessShiftUtcRange(
    currentBusinessDate,
    openingTime,
    closingTime
  );

  const orderTime = new Date(orderCreatedAt).getTime();
  const startTime = new Date(startUtc).getTime();
  const endTime = new Date(endUtc).getTime();

  return orderTime >= startTime && orderTime <= endTime;
}
