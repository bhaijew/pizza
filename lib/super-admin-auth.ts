/**
 * Super Admin authentication helpers.
 * Uses Web Crypto (edge-compatible) for HMAC-based session tokens.
 * Session token = HMAC-SHA256(SUPER_ADMIN_PASSWORD, "pizza-super-admin-v1")
 */

export const SUPER_ADMIN_COOKIE = "pizza_super_admin_session";
export const SUPER_ADMIN_COOKIE_MAX_AGE = 60 * 60 * 12; // 12 hours

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

/** Generate the expected session token from env SUPER_ADMIN_PASSWORD */
export async function generateSuperAdminSessionToken(): Promise<string> {
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "superadmin123";
  return hmacHex(password, "pizza-super-admin-v1");
}

/** Verify a cookie value against the expected token */
export async function verifySuperAdminSessionToken(token: string): Promise<boolean> {
  const expected = await generateSuperAdminSessionToken();
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
