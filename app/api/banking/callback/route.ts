import { NextRequest, NextResponse } from "next/server";
import { sbGet, sbPatch, sbUpsert } from "@/lib/server/supabaseAdmin";
import { getAccountDetails, getRequisition } from "@/lib/server/gocardless";
import { syncBankTransactions } from "@/lib/server/bankSync";

/**
 * GET /api/banking/callback?ref=<link_ref>
 * The bank redirects the user here after consent — no session header, so the
 * single-use link_ref is the capability that identifies the connection.
 * Finalises accounts, runs the first sync, then bounces to /banking.
 */
export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref") ?? "";
  const home = new URL("/banking", req.nextUrl.origin);

  if (!ref) {
    home.searchParams.set("error", "missing-ref");
    return NextResponse.redirect(home);
  }

  const rows = await sbGet<{ id: number; user_key: string; requisition_id: string }>(
    "bank_connections",
    `link_ref=eq.${encodeURIComponent(ref)}&select=id,user_key,requisition_id`
  );
  const conn = rows[0];
  if (!conn) {
    home.searchParams.set("error", "not-found");
    return NextResponse.redirect(home);
  }

  try {
    const req2 = await getRequisition(conn.requisition_id);
    if (req2.status !== "LN" || !req2.accounts?.length) {
      await sbPatch("bank_connections", `id=eq.${conn.id}`, {
        status: "pending",
        updated_at: new Date().toISOString(),
      });
      home.searchParams.set("error", "incomplete");
      return NextResponse.redirect(home);
    }

    // 90-day consent window starts now.
    const expires = new Date(Date.now() + 89 * 24 * 60 * 60 * 1000).toISOString();
    await sbPatch("bank_connections", `id=eq.${conn.id}`, {
      status: "active",
      link_ref: null, // single-use — prevents replay
      consent_expires_at: expires,
      updated_at: new Date().toISOString(),
    });

    for (const accountId of req2.accounts) {
      let name: string | null = null, iban: string | null = null, currency: string | null = null;
      try {
        const details = await getAccountDetails(accountId);
        name = details.account?.name ?? details.account?.product ?? null;
        iban = details.account?.iban ?? null;
        currency = details.account?.currency ?? null;
      } catch { /* details are nice-to-have */ }
      await sbUpsert(
        "bank_accounts",
        [{
          user_key: conn.user_key,
          connection_id: conn.id,
          external_account_id: accountId,
          name,
          iban,
          currency,
        }],
        "external_account_id"
      );
    }

    await syncBankTransactions(conn.user_key);
    home.searchParams.set("connected", "1");
    return NextResponse.redirect(home);
  } catch {
    home.searchParams.set("error", "finalize");
    return NextResponse.redirect(home);
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;
