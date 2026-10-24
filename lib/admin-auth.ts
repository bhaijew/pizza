/**
 * Admin authentication helpers.
 * Uses Web Crypto (edge-compatible) for HMAC-based session tokens.
 * Session token = HMAC-SHA256(ADMIN_PASSWORD, "pizza-admin-v1")
 * This is deterministic — no session storage needed.
 */

export const ADMIN_COOKIE = "pizza_admin_session";
export const ADMIN_SHOP_COOKIE = "pizza_admin_shop_id";
export const ADMIN_SHOP_NAME_COOKIE = "pizza_admin_shop_name";
export const ADMIN_SHOP_SLUG_COOKIE = "pizza_admin_shop_slug";
export const ADMIN_ROLE_COOKIE = "pizza_admin_role"; // "admin" | "sub_admin" | "staff"
export const ADMIN_STAFF_NAME_COOKIE = "pizza_admin_staff_name";
export const ADMIN_STAFF_ID_COOKIE = "pizza_admin_staff_id";
export const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

export interface AdminSessionClaims {
  isMaster: boolean;
  shopId: number | null;
  shopName: string;
  shopSlug: string | null;
  role: "admin" | "sub_admin" | "staff";
  staffName: string;
  staffId: string | null;
  issuedAt: number;
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

/** Generate a signed session token containing tamper-proof branch & role claims */
export async function signAdminSession(claims: AdminSessionClaims): Promise<string> {
  const secret = process.env.ADMIN_PASSWORD ?? "changeme";
  const payloadStr = JSON.stringify(claims);
  const payloadB64 = Buffer.from(payloadStr, "utf-8").toString("base64url");
  const signature = await hmacHex(secret, payloadB64);
  return `${payloadB64}.${signature}`;
}

/** Verify and extract claims from a signed admin session token */
export async function verifyAdminSession(token: string): Promise<AdminSessionClaims | null> {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  const secret = process.env.ADMIN_PASSWORD ?? "changeme";

  // Signed claims token format: payload.signature
  if (parts.length === 2) {
    const [payloadB64, signature] = parts;
    const expectedSig = await hmacHex(secret, payloadB64);

    if (!timingSafeEqual(signature, expectedSig)) {
      return null;
    }

    try {
      const decodedJson = Buffer.from(payloadB64, "base64url").toString("utf-8");
      const claims = JSON.parse(decodedJson) as AdminSessionClaims;

      // Verify token age (must not exceed COOKIE_MAX_AGE)
      const now = Date.now();
      if (!claims.issuedAt || now - claims.issuedAt > COOKIE_MAX_AGE * 1000) {
        return null;
      }

      return claims;
    } catch {
      return null;
    }
  }

  // Backwards compatibility with legacy static tokens
  const isLegacyValid = await verifySessionToken(token);
  if (isLegacyValid) {
    return {
      isMaster: true,
      shopId: null,
      shopName: "Master Store",
      shopSlug: null,
      role: "admin",
      staffName: "Shop Admin",
      staffId: null,
      issuedAt: Date.now(),
    };
  }

  return null;
}

/** Generate legacy session token (kept for backward compatibility) */
export async function generateSessionToken(): Promise<string> {
  const password = process.env.ADMIN_PASSWORD ?? "changeme";
  return hmacHex(password, "pizza-admin-v1");
}

/** Verify a cookie value against the expected token */
export async function verifySessionToken(token: string): Promise<boolean> {
  if (!token || typeof token !== "string") return false;

  // If token is signed claims format, delegate to verifyAdminSession
  if (token.includes(".")) {
    const claims = await verifyAdminSession(token);
    return claims !== null;
  }

  const expected = await generateSessionToken();
  return timingSafeEqual(token, expected);
}

