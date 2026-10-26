import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";

/**
 * GET /api/me?uid=<uuid> — returns the authoritative profile fields
 * (is_paid, role, name, currency) straight from the database via the
 * service role. The client uses this to sync the paywall so a locally
 * tampered profile can't fake access.
 */
export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Only ever answer for well-formed Supabase uuids
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid)) {
    return NextResponse.json({ error: "Invalid uid" }, { status: 400 });
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
