import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/server/jwt";
import { sbDelete } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";

/**
 * POST /api/account/delete?uid=<uuid> — permanently delete the caller's own
 * account: Supabase auth user + profiles row. Requires the caller's own
 * Supabase access token (Bearer) matching `uid`, so nobody can delete
 * another user's account. Used when an unpaid account's grace period lapses.
 */
export async function POST(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const session = requireSession(req, uid);
  if ("error" in session) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  // Delete the auth user first (cascades to profiles via FK if configured);
  // then explicitly remove the profile row in case the FK isn't cascading.
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${uid}`, {
    method: "DELETE",
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  await sbDelete("profiles", `id=eq.${encodeURIComponent(uid)}`);

  if (!authRes.ok && authRes.status !== 404) {
    return NextResponse.json({ error: "Delete failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
