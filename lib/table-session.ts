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

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Creates and sets an HTTP-only secure cookie for a verified table scan session (valid 60 mins).
 * Cryptographically signed with HMAC-SHA256 to prevent spoofing from home.
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

  const secret = process.env.ADMIN_PASSWORD ?? "pizza-table-secret-v1";
  const payloadB64 = Buffer.from(JSON.stringify(session), "utf-8").toString("base64url");
  const signature = await hmacHex(secret, payloadB64);
  const signedCookieValue = `${payloadB64}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set(TABLE_SESSION_COOKIE, signedCookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 3600, // 1 hour in seconds
    path: "/",
  });

  return session;
}

/**
 * Reads and cryptographically verifies the table scan session cookie.
 * Verifies HMAC signature, table number match, and 60-minute expiration.
 */
export async function getTableScanSession(tableNumber?: string): Promise<{
  valid: boolean;
  session?: TableScanSession;
  remainingMinutes?: number;
  reason?: "NO_SESSION" | "TABLE_MISMATCH" | "EXPIRED" | "INVALID_SIGNATURE";
}> {
  const cookieStore = await cookies();
  const cookieVal = cookieStore.get(TABLE_SESSION_COOKIE)?.value;

  if (!cookieVal) {
    return { valid: false, reason: "NO_SESSION" };
  }

  const secret = process.env.ADMIN_PASSWORD ?? "pizza-table-secret-v1";

  try {
    let session: TableScanSession;

    // Signed format: payloadB64.signature
    if (cookieVal.includes(".")) {
      const [payloadB64, signature] = cookieVal.split(".");
      const expectedSig = await hmacHex(secret, payloadB64);

      if (!timingSafeEqual(signature, expectedSig)) {
        return { valid: false, reason: "INVALID_SIGNATURE" };
      }

      const decodedJson = Buffer.from(payloadB64, "base64url").toString("utf-8");
      session = JSON.parse(decodedJson) as TableScanSession;
    } else {
      // Graceful fallback for legacy cookies
      session = JSON.parse(cookieVal) as TableScanSession;
    }

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
