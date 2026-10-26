import { Currency } from "./types";

/**
 * A single cash movement — money in or money out.
 * Kept minimal on purpose so logging an entry takes seconds.
 */
export interface CashEntry {
  id: string;
  type: "income" | "expense";
  amount: number;
  currency: Currency;
  /** Broad bucket: Person, Shop, Bills, Food… */
  category: string;
  /** Free-text: who was paid / where it came from — anything */
  payee: string;
  note?: string;
  /** ISO datetime */
  date: string;
  /** receipt photo — dataURL stored locally only */
  receipt?: string;
  /** storage path once the receipt is uploaded to Supabase */
  receipt_path?: string;
  /** set when the entry belongs to a shared wallet */
  wallet_id?: string;
  /** pushed to Supabase */
  synced: boolean;
  /** tombstone — kept locally until the cloud delete succeeds */
  deleted?: boolean;
}

export const EXPENSE_KINDS = [
  "Person",
  "Shop",
  "Bills",
  "Food",
  "Transport",
  "Subscriptions",
  "Gift",
  "Health",
  "Fun",
  "Other",
] as const;

export const INCOME_KINDS = [
  "Salary",
  "Business",
  "Gift",
  "Refund",
  "Interest",
  "Side Hustle",
  "Other",
] as const;

export const KIND_ICONS: Record<string, string> = {
  Person: "user",
  Shop: "shopping-bag",
  Bills: "receipt",
  Food: "shopping-cart",
  Transport: "fuel",
  Subscriptions: "repeat",
  Gift: "gift",
  Health: "heart-pulse",
  Fun: "tv",
  Salary: "briefcase",
  Business: "building-2",
  Refund: "arrow-down-left",
  Interest: "trending-up",
  "Side Hustle": "zap",
  Other: "more-horizontal",
};

const LEADER_PALETTE = [
  "#c81457", "#e91e63", "#f0568d", "#f9a8c9", "#a3134f",
  "#5c0a2b", "#ff8fab", "#d9b8c6", "#8f1d4e", "#e5a4bd",
];
export const kindColor = (i: number) => LEADER_PALETTE[i % LEADER_PALETTE.length];

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const storageKey = (userId: string) => `drpt-cash-${userId}`;

export const live = (entries: CashEntry[]) => entries.filter((e) => !e.deleted);

/** Sum income/expense/balance for one currency */
export function totalsFor(entries: CashEntry[], currency?: Currency) {
  let inSum = 0;
  let outSum = 0;
  for (const e of live(entries)) {
    if (currency && e.currency !== currency) continue;
    if (e.type === "income") inSum += e.amount;
    else outSum += e.amount;
  }
  return { income: inSum, expense: outSum, balance: inSum - outSum };
}

/** Distinct currencies used across entries */
export const usedCurrencies = (entries: CashEntry[]) =>
  [...new Set(live(entries).map((e) => e.currency))];

export interface LeaderRow {
  name: string;
  total: number;
  count: number;
}

/** Ranked spending — by category or by payee (the "sports table") */
export function leaderboard(entries: CashEntry[], currency: Currency, by: "category" | "payee"): LeaderRow[] {
  const map = new Map<string, LeaderRow>();
  for (const e of live(entries)) {
    if (e.type !== "expense" || e.currency !== currency) continue;
    const key = (by === "category" ? e.category : e.payee) || "Other";
    const row = map.get(key) ?? { name: key, total: 0, count: 0 };
    row.total += e.amount;
    row.count += 1;
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

/** Bank-statement style rows, oldest → newest with running balance */
export function statementRows(entries: CashEntry[], currency: Currency) {
  const rows = live(entries)
    .filter((e) => e.currency === currency)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let balance = 0;
  return rows.map((e) => {
    balance += e.type === "income" ? e.amount : -e.amount;
    return { entry: e, balance };
  });
}

/* ==================== STREAKS ==================== */

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** Consecutive days with at least one logged entry, ending today or yesterday */
export function streakDays(entries: CashEntry[]): number {
  const days = new Set(live(entries).map((e) => e.date.slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  // Allow the streak to count from today or yesterday (today may be early)
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export const STREAK_BADGES = [3, 7, 14, 30, 60, 100];

/* ==================== RECURRING DETECTION ==================== */

export interface RecurringHit {
  payee: string;
  category: string;
  count: number;
  avgAmount: number;
  currency: string;
  /** average gap between occurrences, in days */
  avgGapDays: number;
}

/** Payees that keep coming back roughly every ~month (or other regular gap) */
export function detectRecurring(entries: CashEntry[]): RecurringHit[] {
  const byPayee = new Map<string, CashEntry[]>();
  for (const e of live(entries)) {
    if (e.type !== "expense") continue;
    const key = e.payee.trim().toLowerCase();
    if (!key) continue;
    const arr = byPayee.get(key) ?? [];
    arr.push(e);
    byPayee.set(key, arr);
  }
  const hits: RecurringHit[] = [];
  for (const arr of byPayee.values()) {
    if (arr.length < 2) continue;
    const sorted = [...arr].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push((new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) / 86400000);
    }
    const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    // Regular rhythm: between 3 and 40 days — covers weekly & monthly bills
    if (avgGap < 3 || avgGap > 40) continue;
    hits.push({
      payee: sorted[0].payee,
      category: sorted[0].category,
      count: arr.length,
      avgAmount: arr.reduce((s, e) => s + e.amount, 0) / arr.length,
      currency: arr[0].currency,
      avgGapDays: Math.round(avgGap),
    });
  }
  return hits.sort((a, b) => b.avgAmount * (30 / Math.max(b.avgGapDays, 1)) - a.avgAmount * (30 / Math.max(a.avgGapDays, 1)) || b.count - a.count);
}

/* ==================== BUDGET ALERTS ==================== */

/** Cash Flow kind → Budget Planner category (approximate mapping) */
export const KIND_TO_BUDGET_CAT: Record<string, string> = {
  Person: "Personal",
  Shop: "Shopping",
  Bills: "Utilities",
  Food: "Food",
  Transport: "Transport",
  Subscriptions: "Subscriptions",
  Gift: "Personal",
  Health: "Health",
  Fun: "Entertainment",
  Other: "Other",
};

/** This-month spend in a budget category (active currency only) */
export function monthSpendByKind(entries: CashEntry[], kind: string, currency: Currency): number {
  const now = new Date().toISOString().slice(0, 7);
  let sum = 0;
  for (const e of live(entries)) {
    if (e.type !== "expense" || e.currency !== currency) continue;
    if (e.category !== kind || !e.date.startsWith(now)) continue;
    sum += e.amount;
  }
  return sum;
}
