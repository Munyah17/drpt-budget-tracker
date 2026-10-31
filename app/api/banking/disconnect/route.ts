import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/server/jwt";
import { requireBankingAccess, accessError } from "@/lib/server/gate";
import { sbDelete, sbGet } from "@/lib/server/supabaseAdmin";
import { deleteRequisition } from "@/lib/server/gocardless";

/**
 * POST /api/banking/disconnect?uid=<uuid>
 * Revokes the requisition at the provider (best effort) and deletes every
 * stored row — connection, accounts and transactions all go.
 */
export async function POST(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "";
  const session = requireSession(req, uid);
  if ("error" in session) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }
  const access = await requireBankingAccess(uid);
  if (!("ok" in access)) return accessError(access);

  const conns = await sbGet<{ id: number; requisition_id: string | null }>(
    "bank_connections",
    `user_key=eq.${encodeURIComponent(uid)}&select=id,requisition_id`
  );
  const conn = conns[0];
  if (!conn) return NextResponse.json({ ok: true, already: true });

  if (conn.requisition_id) {
    try { await deleteRequisition(conn.requisition_id); } catch { /* best effort */ }
  }
  // Cascades to bank_accounts → bank_transactions.
  await sbDelete("bank_connections", `id=eq.${conn.id}`);
  return NextResponse.json({ ok: true });
}

export const runtime = "nodejs";
