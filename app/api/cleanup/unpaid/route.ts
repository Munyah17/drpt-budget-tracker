import { NextRequest, NextResponse } from "next/server";
import { sbGet, sbDelete } from "@/lib/server/supabaseAdmin";
import { paidActive } from "@/lib/paid";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";

const DAY_MS = 24 * 60 * 60 * 1000;
const GRACE_DAYS = (() => {
  const n = Number(process.env.UNPAID_GRACE_DAYS ?? process.env.NEXT_PUBLIC_UNPAID_GRACE_DAYS);
  return Number.isFinite(n) && n > 0 ? n : 7;
})();
const MAX_PER_RUN = 200;

/**
 * Cron guard — same pattern as /api/reminders/run. Vercel Cron sends
 * `Authorization: Bearer $CRON_SECRET` when configured.
 */
function authorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const query = req.nextUrl.searchParams.get("secret") ?? "";
  return bearer === secret || query === secret;
}

interface ProfileRow {
  id: string;
  email: string | null;
  is_paid: boolean | null;
  paid_until: string | null;
  created_at: string | null;
}

/**
 * GET /api/cleanup/unpaid — discard unpaid accounts older than the grace
 * window. Unpaid accounts are temporary (they exist only while the user
 * arranges payment); once the window lapses with no payment, the account is
 * deleted so no stale unpaid profile lingers.
 */
export async function GET(req: NextRequest) {
  if (!authorised(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const cutoff = new Date(Date.now() - GRACE_DAYS * DAY_MS).toISOString();
  // Candidates: unpaid-or-unknown, created before the cutoff. paidActive() is
  // applied below as the authoritative check (handles paid_until expiry).
  const rows = await sbGet<ProfileRow>(
    "profiles",
    `created_at=lt.${encodeURIComponent(cutoff)}&select=id,email,is_paid,paid_until,created_at&limit=${MAX_PER_RUN * 2}`
  );

  const stale = rows.filter((r) => !paidActive(r));
  const targets = stale.slice(0, MAX_PER_RUN);

  let deleted = 0;
  const failures: string[] = [];
  for (const p of targets) {
    // Delete the auth user (cascades to profiles when the FK is set up);
    // explicitly remove the profile row too in case it isn't.
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${p.id}`, {
      method: "DELETE",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    await sbDelete("profiles", `id=eq.${encodeURIComponent(p.id)}`);
    if (authRes.ok || authRes.status === 404) deleted++;
    else failures.push(p.id);
  }

  return NextResponse.json({
    ok: true,
    graceDays: GRACE_DAYS,
    cutoff,
    scanned: rows.length,
    stale: stale.length,
    deleted,
    failures: failures.length,
  });
}
