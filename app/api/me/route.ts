import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/server/jwt";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";

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

  const session = requireSession(req, uid);
  if ("error" in session) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }
  if (!serviceKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
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
