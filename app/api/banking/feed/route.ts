import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/server/jwt";
import { requireFeatureAccess, accessError } from "@/lib/server/gate";
import { sbGet } from "@/lib/server/supabaseAdmin";

/**
 * GET /api/banking/feed?uid=<uuid>
 * Connection status + unimported bank transactions for the feed UI.
 * Free-tier users only see transactions when the connection's institution
 * has a banking_unlock row — otherwise the response is {locked: true} so
 * the page can show the paywall card. Matching against expenses happens
 * client-side (expenses live in the user's synced blob, not in tables).
 */
export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "";
  const session = requireSession(req, uid);
  if ("error" in session) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  const conns = await sbGet<{
    id: number; status: string; institution_id: string | null;
    institution_name: string | null; consent_expires_at: string | null;
  }>("bank_connections", `user_key=eq.${encodeURIComponent(uid)}&select=id,status,institution_id,institution_name,consent_expires_at`);
  const conn = conns[0] ?? null;

  if (!conn || conn.status !== "active") {
    return NextResponse.json({ connection: conn, accounts: [], transactions: [] });
  }

  // Access: paid plans & corporate roles see everything; free users need a
  // per-institution unlock matching the CONNECTED bank.
  const access = await requireFeatureAccess(uid);
  let unlocked = "ok" in access;
  if (!("ok" in access) && access.status === 402) {
    const rows = await sbGet<{ id: number }>(
      "banking_unlocks",
      `user_key=eq.${encodeURIComponent(uid)}&institution_id=eq.${encodeURIComponent(conn.institution_id ?? "")}&select=id&limit=1`
    );
    unlocked = rows.length > 0;
  } else if (!unlocked) {
    return accessError(access);
  }

  if (!unlocked) {
    return NextResponse.json({ connection: conn, accounts: [], transactions: [], locked: true });
  }

  const accounts = await sbGet<{
    id: number; name: string | null; iban: string | null; currency: string | null;
  }>("bank_accounts", `user_key=eq.${encodeURIComponent(uid)}&select=id,name,iban,currency`);

  const txns = await sbGet<{
    id: number; booked_at: string; amount: number; currency: string;
    counterparty: string; description: string; bank_account_id: number;
  }>(
    "bank_transactions",
    `user_key=eq.${encodeURIComponent(uid)}&dismissed=eq.false&imported_expense_id=is.null&order=booked_at.desc&limit=200`
  );

  return NextResponse.json({ connection: conn, accounts, transactions: txns });
}

export const runtime = "nodejs";
