import { cookies } from "next/headers";

/**
 * Table Scan Session System — 60-Minute Expiry Protection.
 * Protects restaurant against fake orders from home / old saved QR links.
 */
export const TABLE_SESSION_COOKIE = "pizza_table_session";
export const TABLE_SESSION_DURATION_MS = 60 * 60 * 1000; // 60 minutes in milliseconds

export interface TableScanSession {
  tableNumber: string;
  tokenCode: string;
  scannedAt: number;
  expiresAt: number;
  shopId?: number | null;
}

/**
 * Creates and sets an HTTP-only secure cookie for a verified table scan session (valid 60 mins).
 */
export async function setTableScanSessionCookie(
  tableNumber: string,
  tokenCode: string,
  shopId?: number | null
): Promise<TableScanSession> {
  const now = Date.now();
  const session: TableScanSession = {
    tableNumber,
    tokenCode,
    scannedAt: now,
    expiresAt: now + TABLE_SESSION_DURATION_MS,
    shopId: shopId || null,
  };

  const cookieStore = await cookies();
  cookieStore.set(TABLE_SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 3600, // 1 hour in seconds
    path: "/",
  });

  return session;
}

/**
 * Reads and verifies the table scan session cookie.
 * Verifies that the table number matches and current time is within 60 minutes.
 */
export async function getTableScanSession(tableNumber?: string): Promise<{
  valid: boolean;
  session?: TableScanSession;
  remainingMinutes?: number;
  reason?: "NO_SESSION" | "TABLE_MISMATCH" | "EXPIRED";
}> {
  const cookieStore = await cookies();
  const cookieVal = cookieStore.get(TABLE_SESSION_COOKIE)?.value;

  if (!cookieVal) {
    return { valid: false, reason: "NO_SESSION" };
  }

  try {
    const session = JSON.parse(cookieVal) as TableScanSession;
    const now = Date.now();

    // Check expiration (60 minutes)
    if (now >= session.expiresAt) {
      return { valid: false, session, reason: "EXPIRED" };
    }

    // Check table number matching if requested
    if (tableNumber && session.tableNumber.toLowerCase() !== tableNumber.toLowerCase()) {
      return { valid: false, session, reason: "TABLE_MISMATCH" };
    }

    const remainingMs = Math.max(0, session.expiresAt - now);
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

    return {
      valid: true,
      session,
      remainingMinutes,
    };
  } catch {
    return { valid: false, reason: "NO_SESSION" };
  }
}
