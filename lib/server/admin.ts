/**
 * Server-only admin verification — shared by all /api/admin routes.
 * Never import this from client components.
 */
import crypto from "crypto";
import { NextRequest } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";

// Same hardcoded admin identity the client login uses — that account has no
// Supabase session, so it proves itself with this header instead of a JWT.
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "munyamuzvidziwa19@gmail.com").toLowerCase();

const b64url = (s: string) =>
  Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");

function verifySupabaseJwt(token: string, secret: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, sig] = parts;
  const expect = crypto.createHmac("sha256", secret).update(`${h}.${p}`).digest();
  const got = Buffer.from(sig.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  if (expect.length !== got.length || !crypto.timingSafeEqual(expect, got)) return null;
  try {
    const payload = JSON.parse(b64url(p)) as Record<string, unknown>;
    const exp = typeof payload.exp === "number" ? payload.exp : 0;
    if (exp && exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Returns true when the request comes from an admin — either the hardcoded
 * local admin (x-admin-email header) or a Supabase user whose profile role
 * is 'admin' (verified by their Bearer JWT + a service-role profile lookup).
 */
export async function isAdminRequest(req: NextRequest, serviceKey: string): Promise<boolean> {
  const headerEmail = (req.headers.get("x-admin-email") ?? "").toLowerCase();
  if (headerEmail && headerEmail === ADMIN_EMAIL) return true;

  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!token || !jwtSecret) return false;
  const claims = verifySupabaseJwt(token, jwtSecret);
  if (!claims || claims.aud !== "authenticated" || typeof claims.sub !== "string") return false;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(claims.sub)}&select=role,email`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: "no-store" }
    );
    const rows = await res.json();
    const role = rows?.[0]?.role;
    const email = typeof rows?.[0]?.email === "string" ? rows[0].email.toLowerCase() : "";
    return role === "admin" || role === "super_admin" || email === ADMIN_EMAIL;
  } catch {
    return false;
  }
}

/**
 * Super-admin gate for /api/super-admin/* routes. True only for the founder:
 * profile role 'super_admin' or the hardcoded ADMIN_EMAIL identity.
 */
export async function isSuperAdminRequest(req: NextRequest, serviceKey: string): Promise<boolean> {
  // No x-admin-email shortcut here — that header is client-supplied and
  // spoofable. Super admin requires a verified Supabase JWT.
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!token || !jwtSecret) return false;
  const claims = verifySupabaseJwt(token, jwtSecret);
  if (!claims || claims.aud !== "authenticated" || typeof claims.sub !== "string") return false;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(claims.sub)}&select=role,email`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: "no-store" }
    );
    const rows = await res.json();
    const role = rows?.[0]?.role;
    const email = typeof rows?.[0]?.email === "string" ? rows[0].email.toLowerCase() : "";
    return role === "super_admin" || email === ADMIN_EMAIL;
  } catch {
    return false;
  }
}
