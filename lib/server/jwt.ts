/**
 * Server-only Supabase access-token verification.
 * Never import this from client components.
 */
import crypto from "crypto";

const b64url = (s: string) =>
  Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");

/** Verify a Supabase (HS256) access token. Returns the payload or null. */
export function verifySupabaseJwt(token: string, secret: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, sig] = parts;
  const expect = crypto
    .createHmac("sha256", secret)
    .update(`${h}.${p}`)
    .digest();
  const got = Buffer.from(sig.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  if (expect.length !== got.length || !crypto.timingSafeEqual(expect, got)) return null;
  try {
    const payload = JSON.parse(b64url(p)) as Record<string, unknown>;
    const exp = typeof payload.exp === "number" ? payload.exp : 0;
    if (exp && exp * 1000 < Date.now()) return null; // expired
    return payload;
  } catch {
    return null;
  }
}

export type SessionCheck = { claims: Record<string, unknown> } | { error: string; status: number };

/**
 * Require a valid Supabase session for `uid`.
 * Returns `{ claims }` on success, or `{ error, status }` to forward as a response.
 */
export function requireSession(req: Request, uid: string): SessionCheck {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!jwtSecret) return { error: "Not configured", status: 500 };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid)) {
    return { error: "Invalid uid", status: 400 };
  }
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const claims = token ? verifySupabaseJwt(token, jwtSecret) : null;
  if (!claims || claims.sub !== uid || claims.aud !== "authenticated") {
    return { error: "Unauthorized", status: 401 };
  }
  return { claims };
}
