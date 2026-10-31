import { NextRequest, NextResponse } from "next/server";
import { sbGet, sbPatch } from "@/lib/server/supabaseAdmin";
import { syncBankTransactions } from "@/lib/server/bankSync";

const MAX_SYNCS_PER_RUN = 200;

/** Same guard as /api/reminders/run — Vercel Cron sends Bearer $CRON_SECRET. */
function authorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const query = req.nextUrl.searchParams.get("secret") ?? "";
  return bearer === secret || query === secret;
}

/**
 * GET /api/banking/run — Vercel cron (daily, see vercel.json).
 * Pulls transactions for every active connection and flags expired consent.
 */
export async function GET(req: NextRequest) {
  if (!authorised(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conns = await sbGet<{ id: number; user_key: string; consent_expires_at: string | null }>(
    "bank_connections",
    "status=eq.active&select=id,user_key,consent_expires_at"
  );

  const now = Date.now();
  let synced = 0, expired = 0;
  for (const conn of conns.slice(0, MAX_SYNCS_PER_RUN)) {
    if (conn.consent_expires_at && new Date(conn.consent_expires_at).getTime() < now) {
      await sbPatch("bank_connections", `id=eq.${conn.id}`, {
        status: "expired",
        updated_at: new Date().toISOString(),
      });
      expired++;
      continue;
    }
    try {
      await syncBankTransactions(conn.user_key);
      synced++;
    } catch { /* next run retries */ }
  }
  return NextResponse.json({ ok: true, connections: conns.length, synced, expired });
}

export const runtime = "nodejs";
export const maxDuration = 60;
