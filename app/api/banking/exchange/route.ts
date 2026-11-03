import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/server/jwt";
import { requireFeatureAccess, accessError } from "@/lib/server/gate";
import { sbGet, sbInsert, sbPatch, sbUpsert } from "@/lib/server/supabaseAdmin";
import {
  exchangePublicToken, getAccounts, getInstitution, getItem,
} from "@/lib/server/plaid";
import { bankingUnlockCheckout } from "@/lib/server/checkout";
import { bankingPriceLabel, OPEN_BANKING_FEE_USD } from "@/lib/pricing";
import { syncBankTransactions } from "@/lib/server/bankSync";

/**
 * POST /api/banking/exchange?uid=<uuid>   Body: { publicToken, institutionName? }
 * Finalises a completed Link session: exchanges the public token, stores the
 * connection + accounts, runs the first sync, then reports whether the
 * connection is usable — paid/corporate roles and already-unlocked banks go
 * straight to the feed; free users get { needsUnlock, checkoutUrl } so the
 * $1-per-bank paywall can fire (their consent stays saved — paying just flips
 * the feed on).
 */
export async function POST(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "";
  const session = requireSession(req, uid);
  if ("error" in session) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  const body = await req.json().catch(() => ({}));
  const publicToken = String(body.publicToken ?? "");
  if (!publicToken) {
    return NextResponse.json({ error: "Missing publicToken" }, { status: 400 });
  }

  try {
    const { access_token, item_id } = await exchangePublicToken(publicToken);

    // Authoritative institution identity comes from the item, not the client.
    let institutionId = "";
    let institutionName = String(body.institutionName ?? "");
    try {
      const item = await getItem(access_token);
      institutionId = item.item.institution_id ?? "";
    } catch { /* name/id best-effort */ }
    if (institutionId) {
      try {
        const inst = await getInstitution(institutionId);
        institutionName = inst.institution.name || institutionName;
      } catch { /* keep client-provided name */ }
    }

    // One connection per user (matches the existing schema/UI).
    const existing = await sbGet<{ id: number }>(
      "bank_connections",
      `user_key=eq.${encodeURIComponent(uid)}&select=id&limit=1`
    );
    const patch = {
      provider: "plaid",
      requisition_id: item_id,
      access_token,
      institution_id: institutionId,
      institution_name: institutionName || "Your bank",
      link_ref: null,
      status: "active",
      consent_expires_at: null, // Plaid items persist until revoked
      plaid_cursor: null,
      updated_at: new Date().toISOString(),
    };
    const saved = existing.length
      ? await sbPatch("bank_connections", `id=eq.${existing[0].id}`, patch)
      : !!(await sbInsert("bank_connections", { user_key: uid, ...patch }));
    if (!saved) {
      return NextResponse.json({ error: "Could not save connection" }, { status: 500 });
    }

    const accounts = await getAccounts(access_token).catch(() => ({ accounts: [] }));
    for (const a of accounts.accounts ?? []) {
      await sbUpsert(
        "bank_accounts",
        [{
          user_key: uid,
          connection_id: existing[0]?.id ?? null,
          external_account_id: a.account_id,
          name: a.official_name ?? a.name ?? null,
          iban: a.mask ?? null,
          currency: a.balances?.iso_currency_code ?? null,
        }],
        "external_account_id"
      );
    }

    const synced = await syncBankTransactions(uid).catch(() => 0);

    // Access: paid plans & corporate roles get the feed free; free users need
    // the $1-per-institution unlock for THIS bank.
    const access = await requireFeatureAccess(uid);
    let unlocked = "ok" in access;
    if (!("ok" in access) && access.status === 402) {
      const rows = await sbGet<{ id: number }>(
        "banking_unlocks",
        `user_key=eq.${encodeURIComponent(uid)}&institution_id=eq.${encodeURIComponent(institutionId)}&select=id&limit=1`
      );
      unlocked = rows.length > 0;
    } else if (!unlocked) {
      return accessError(access);
    }

    if (!unlocked) {
      const checkoutUrl = await bankingUnlockCheckout({
        origin: req.nextUrl.origin, uid, institutionId, institutionName,
      });
      return NextResponse.json({
        connected: true,
        synced,
        institutionId,
        institutionName,
        needsUnlock: true,
        checkoutUrl,
        priceLabel: bankingPriceLabel("stripe"),
        providerFeeUsd: OPEN_BANKING_FEE_USD.gb ?? 0,
      });
    }

    return NextResponse.json({ connected: true, synced, institutionId, institutionName });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not finalise bank connection" },
      { status: 502 }
    );
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;
