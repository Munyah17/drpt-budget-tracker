import { ExpenseEntry } from "./types";

export interface BankTxn {
  id: number;
  booked_at: string;
  amount: number;
  currency: string;
  counterparty: string;
}

export interface MatchSuggestion {
  expenseId: number;
  merchant: string;
  score: number; // 0..1
}

/** Lowercase, strip card-ref noise and punctuation. */
function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b(?:ltd|limited|plc|inc|gmbh|sarl|sa|bv|oy|ab)\b\.?/g, "")
    .replace(/[*#]+\w*/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Token-containment similarity, 0..1: shared tokens over the smaller set, so
 * "Tesco" fully inside "TESCO STORES 3291" scores 1 — bank counterparties are
 * long and noisy while logged merchants are short. Amount+date still gate.
 */
function similarity(a: string, b: string): number {
  const ta = new Set(normalise(a).split(" ").filter(Boolean));
  const tb = new Set(normalise(b).split(" ").filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  let hit = 0;
  ta.forEach((t) => { if (tb.has(t)) hit++; });
  return hit / Math.min(ta.size, tb.size);
}

const DAY_MS = 86_400_000;
const MAX_DATE_GAP_DAYS = 3;

/**
 * Suggest expense entries that may already cover a bank transaction.
 * Needs: same amount (±1p), date within 3 days, merchant text overlap.
 * Returns the best suggestion above threshold, or null.
 */
export function suggestMatch(txn: BankTxn, expenses: ExpenseEntry[]): MatchSuggestion | null {
  const spent = Math.abs(txn.amount);
  const txnTime = new Date(txn.booked_at).getTime();
  if (!spent || Number.isNaN(txnTime)) return null;

  let best: MatchSuggestion | null = null;
  for (const e of expenses) {
    if (Math.abs(e.amount - spent) > 0.01) continue;
    const gap = Math.abs(new Date(e.date).getTime() - txnTime) / DAY_MS;
    if (gap > MAX_DATE_GAP_DAYS) continue;
    const sim = similarity(e.merchant, txn.counterparty);
    const score = sim * 0.6 + (1 - gap / (MAX_DATE_GAP_DAYS + 1)) * 0.4;
    if (sim >= 0.5 && (!best || score > best.score)) {
      best = { expenseId: e.id, merchant: e.merchant, score };
    }
  }
  return best;
}
