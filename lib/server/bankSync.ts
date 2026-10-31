/**
 * Server-only bank transaction sync — shared by the connect callback, the
 * manual sync endpoint and the cron runner.
 * Never import this from client components.
 */
import { sbGet, sbUpsert } from "./supabaseAdmin";
import { getTransactions, GcTransaction } from "./gocardless";

interface BankAccountRow {
  id: number;
  user_key: string;
  external_account_id: string;
}

function toRow(uid: string, account: BankAccountRow, t: GcTransaction) {
  const externalId = t.internalTransactionId ?? t.transactionId;
  const amount = Number(t.transactionAmount?.amount ?? "");
  const bookedAt = t.bookingDate;
  if (!externalId || !Number.isFinite(amount) || !bookedAt) return null;
  const counterparty = amount < 0 ? t.creditorName : t.debtorName;
  const memo = Array.isArray(t.remittanceInformationUnstructuredArray)
    ? t.remittanceInformationUnstructuredArray.join(" ")
    : t.remittanceInformationUnstructured;
  return {
    user_key: uid,
    bank_account_id: account.id,
    external_id: externalId.slice(0, 200),
    booked_at: bookedAt.slice(0, 10),
    amount,
    currency: (t.transactionAmount?.currency ?? "GBP").toUpperCase(),
    counterparty: (counterparty ?? memo ?? "Bank transaction").slice(0, 160),
    description: (memo ?? "").slice(0, 500),
  };
}

/**
 * Pull booked transactions for every account on the user's connection.
 * Dedupes on (bank_account_id, external_id) — safe to run repeatedly.
 * Returns the number of rows upserted.
 */
export async function syncBankTransactions(uid: string): Promise<number> {
  const accounts = await sbGet<BankAccountRow>(
    "bank_accounts",
    `user_key=eq.${encodeURIComponent(uid)}&select=id,user_key,external_account_id`
  );
  let written = 0;
  for (const account of accounts) {
    try {
      const txns = await getTransactions(account.external_account_id);
      const rows = txns
        .map((t) => toRow(uid, account, t))
        .filter((r): r is NonNullable<typeof r> => r !== null);
      if (await sbUpsert("bank_transactions", rows, "bank_account_id,external_id")) {
        written += rows.length;
      }
    } catch {
      // One bad account shouldn't block the rest — cron will retry next run.
    }
  }
  return written;
}
