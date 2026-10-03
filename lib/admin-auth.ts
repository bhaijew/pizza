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
export const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

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

/** Generate the expected session token from env ADMIN_PASSWORD */
export async function generateSessionToken(): Promise<string> {
  const password = process.env.ADMIN_PASSWORD ?? "changeme";
  return hmacHex(password, "pizza-admin-v1");
}

/** Verify a cookie value against the expected token */
export async function verifySessionToken(token: string): Promise<boolean> {
  const expected = await generateSessionToken();
  // Constant-time comparison via string length + char comparison
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
