/**
 * Server-only bank transaction sync — shared by the connect finalise step,
 * the manual sync endpoint and the cron runner.
 * Plaid's /transactions/sync is item-level: one call returns changes for
 * every account on the connection. Never import this from client components.
 */
import { sbGet, sbPatch, sbUpsert } from "./supabaseAdmin";
import { syncTransactions, PlaidTransaction } from "./plaid";

interface BankAccountRow {
  id: number;
  external_account_id: string;
}

interface BankConnectionRow {
  id: number;
  user_key: string;
  access_token: string | null;
  plaid_cursor: string | null;
}

function toRow(
  uid: string,
  accountMap: Map<string, number>,
  t: PlaidTransaction
) {
  const bankAccountId = accountMap.get(t.account_id);
  if (!bankAccountId || !t.transaction_id || !t.date) return null;
  // Our convention: negative = expense (money out). Plaid's is the opposite.
  const amount = -t.amount;
  const counterparty = t.merchant_name ?? t.name ?? "Bank transaction";
  return {
    user_key: uid,
    bank_account_id: bankAccountId,
    external_id: t.transaction_id.slice(0, 200),
    booked_at: t.date.slice(0, 10),
    amount,
    currency: (t.iso_currency_code ?? "GBP").toUpperCase(),
    counterparty: counterparty.slice(0, 160),
    description: (t.name ?? "").slice(0, 500),
  };
}

/**
 * Pull transaction changes for the user's active Plaid connection.
 * Dedupes on (bank_account_id, external_id) — safe to run repeatedly.
 * Returns the number of rows upserted.
 */
export async function syncBankTransactions(uid: string): Promise<number> {
  const conns = await sbGet<BankConnectionRow>(
    "bank_connections",
    `user_key=eq.${encodeURIComponent(uid)}&status=eq.active&select=id,user_key,access_token,plaid_cursor&limit=1`
  );
  const conn = conns[0];
  if (!conn?.access_token) return 0;

  const accounts = await sbGet<BankAccountRow>(
    "bank_accounts",
    `user_key=eq.${encodeURIComponent(uid)}&select=id,external_account_id`
  );
  const accountMap = new Map(accounts.map((a) => [a.external_account_id, a.id]));

  // Page through the whole change set — has_more until exhausted.
  let cursor = conn.plaid_cursor;
  let written = 0;
  let guard = 0;
  let nextCursor = cursor;
  while (guard++ < 25) {
    const page = await syncTransactions(conn.access_token, cursor);
    nextCursor = page.next_cursor;
    const rows = page.added
      .map((t) => toRow(uid, accountMap, t))
      .filter((r): r is NonNullable<typeof r> => r !== null);
    if (rows.length && (await sbUpsert("bank_transactions", rows, "bank_account_id,external_id"))) {
      written += rows.length;
    }
    cursor = page.next_cursor;
    if (!page.has_more) break;
  }
  if (nextCursor && nextCursor !== conn.plaid_cursor) {
    await sbPatch("bank_connections", `id=eq.${conn.id}`, {
      plaid_cursor: nextCursor,
      updated_at: new Date().toISOString(),
    });
  }
  return written;
}
