import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/server/jwt";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";

function dbHeaders(serviceKey: string) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
}

/** Fetch the caller's profile row (service role). */
async function getProfile(uid: string, serviceKey: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(uid)}&select=is_paid`,
    { headers: dbHeaders(serviceKey), cache: "no-store" }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

/**
 * GET /api/sync?uid=<uuid> — pull the user's stored data snapshot.
 * Returns { data: {...} } or { data: null } when nothing saved yet.
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
      `${SUPABASE_URL}/rest/v1/user_data?user_id=eq.${encodeURIComponent(uid)}&select=payload,updated_at`,
      { headers: dbHeaders(serviceKey), cache: "no-store" }
    );
    if (!res.ok) return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    return NextResponse.json({ data: row?.payload ?? null, updatedAt: row?.updated_at ?? null });
  } catch {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}

/**
 * POST /api/sync?uid=<uuid> — upsert the user's data snapshot.
 * Paid accounts only: unpaid users never get server-side persistence.
 * Body: { data: { accounts, income, expenses, goals, bills, budgets } }
 */
export async function POST(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const session = requireSession(req, uid);
  if ("error" in session) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }
  if (!serviceKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  let body: { data?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad body" }, { status: 400 });
  }
  if (!body || typeof body.data !== "object" || body.data === null) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  try {
    // Free accounts get no persistence — payment gate lives here too
    const profile = await getProfile(uid, serviceKey);
    if (!profile || profile.is_paid !== true) {
      return NextResponse.json({ error: "Payment required" }, { status: 402 });
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/user_data`,
      {
        method: "POST",
        headers: {
          ...dbHeaders(serviceKey),
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({
          user_id: uid,
          payload: body.data,
          updated_at: new Date().toISOString(),
        }),
      }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("sync upsert failed:", res.status, text.slice(0, 200));
      return NextResponse.json({ error: "Save failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}

export const runtime = "nodejs";
