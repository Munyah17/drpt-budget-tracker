import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/server/jwt";
import { sbDelete, sbGet } from "@/lib/server/supabaseAdmin";
import { removeItem } from "@/lib/server/plaid";

/**
 * POST /api/banking/disconnect?uid=<uuid>
 * Revokes the Plaid item (best effort) and deletes every stored row —
 * connection, accounts and transactions all go.
 */
export async function POST(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "";
  const session = requireSession(req, uid);
  if ("error" in session) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  const conns = await sbGet<{ id: number; access_token: string | null }>(
    "bank_connections",
    `user_key=eq.${encodeURIComponent(uid)}&select=id,access_token`
  );
  const conn = conns[0];
  if (!conn) return NextResponse.json({ ok: true, already: true });

  if (conn.access_token) {
    try { await removeItem(conn.access_token); } catch { /* best effort */ }
  }
  // Cascades to bank_accounts → bank_transactions.
  await sbDelete("bank_connections", `id=eq.${conn.id}`);
  return NextResponse.json({ ok: true });
}

export const runtime = "nodejs";
