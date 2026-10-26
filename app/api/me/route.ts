import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";

const b64url = (s: string) =>
  Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");

/** Verify a Supabase (HS256) access token. Returns the payload or null. */
function verifySupabaseJwt(token: string, secret: string): Record<string, unknown> | null {
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

/**
 * GET /api/me?uid=<uuid> — returns the authoritative profile fields
 * (is_paid, role, name, currency) straight from the database via the
 * service role. Requires the caller's own Supabase access token as a
 * Bearer header — the JWT must be valid AND its `sub` must match `uid`,
 * so nobody can query (or spoof) another user's paid status.
 */
export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;

  // Only ever answer for well-formed Supabase uuids
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid)) {
    return NextResponse.json({ error: "Invalid uid" }, { status: 400 });
  }
  if (!serviceKey || !jwtSecret) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const claims = token ? verifySupabaseJwt(token, jwtSecret) : null;
  if (!claims || claims.sub !== uid || claims.aud !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(uid)}&select=is_paid,role,name,currency`,
      {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        cache: "no-store",
      }
    );
    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!res.ok || !row) {
      return NextResponse.json({ paid: false, found: false });
    }
    return NextResponse.json({
      paid: row.is_paid === true,
      found: true,
      role: row.role ?? "user",
      name: row.name ?? "",
      currency: row.currency ?? "USD",
    });
  } catch {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}

export const runtime = "nodejs";
