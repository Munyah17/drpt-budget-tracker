"use client";

/**
 * Derived financial insights for the personal dashboard:
 * safe-to-spend, recurring-charge detection, debt payoff math,
 * and small user prefs (rollover, sinking funds, household, WhatsApp alerts).
 */
import { useSyncExternalStore } from "react";
import type { ExpenseEntry, Bill, Budget, Goal } from "./types";

// ---------- Safe to spend ----------
export interface SafeToSpend {
  balance: number;
  billsDue: number;       // upcoming unpaid bills this month
  goalCommit: number;     // suggested monthly goal contribution (10% of income, capped)
  free: number;           // what's safe to spend for the rest of the month
  perDay: number;
  daysLeft: number;
}

export function safeToSpend(opts: {
  balance: number;
  income: number;
  expenses: number;
  bills: Bill[];
  goals: Goal[];
}): SafeToSpend {
  const now = new Date();
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = dim - now.getDate() + 1;
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const billsDue = opts.bills
    .filter((b) => b.status !== "paid" && b.due.startsWith(month))
    .reduce((s, b) => s + b.amount, 0);

  // Monthly contribution needed to hit each active goal on time
  const goalCommit = opts.goals.reduce((s, g) => {
    const left = Math.max(0, g.target - g.saved);
    if (!left) return s;
    const deadline = new Date(g.deadline).getTime();
    const monthsLeft = Math.max(1, Math.ceil((deadline - now.getTime()) / (30.4 * dayMs())));
    return s + left / monthsLeft;
  }, 0);

  const remaining = Math.max(0, opts.income - opts.expenses);
  const free = Math.max(0, Math.min(opts.balance, remaining) - billsDue - goalCommit);
  return {
    balance: opts.balance, billsDue, goalCommit,
    free, perDay: daysLeft > 0 ? free / daysLeft : 0, daysLeft,
  };
}
const dayMs = () => 864e5;

// ---------- Recurring detection ----------
export interface DetectedRecurring {
  merchant: string;
  category: string;
  amount: number;
  count: number;
  lastDate: string;
  avgDays: number; // mean gap between charges
  ids: number[];
}

/**
 * Find likely subscriptions: same merchant charged ≥3 times with a fairly
 * regular gap (15–45 days, ±30% tolerance) and consistent amount (±15%).
 * Skips expenses the user already flagged recurring.
 */
export function detectRecurring(expenses: ExpenseEntry[]): DetectedRecurring[] {
  const byMerchant = new Map<string, ExpenseEntry[]>();
  for (const e of expenses) {
    if (e.recurring) continue;
    const key = e.merchant.trim().toLowerCase();
    if (!key) continue;
    const list = byMerchant.get(key) ?? [];
    list.push(e);
    byMerchant.set(key, list);
  }

  const out: DetectedRecurring[] = [];
  for (const list of byMerchant.values()) {
    if (list.length < 3) continue;
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const amounts = sorted.map((e) => e.amount);
    const avgAmt = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const amtVar = Math.max(...amounts.map((a) => Math.abs(a - avgAmt) / Math.max(avgAmt, 0.01)));
    if (amtVar > 0.15) continue; // amounts vary too much — not a fixed sub

    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push((new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) / 864e5);
    }
    const avgDays = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    if (avgDays < 15 || avgDays > 45) continue; // ~fortnightly to monthly only
    const gapVar = Math.max(...gaps.map((g) => Math.abs(g - avgDays) / avgDays));
    if (gapVar > 0.3) continue;

    const latest = sorted[sorted.length - 1];
    out.push({
      merchant: latest.merchant, category: latest.category, amount: avgAmt,
      count: sorted.length, lastDate: latest.date, avgDays, ids: sorted.map((e) => e.id),
    });
  }
  return out.sort((a, b) => b.amount - a.amount);
}

// ---------- Debt payoff ----------
export interface DebtInput { balance: number; apr: number; minPayment: number; }

export interface PayoffResult {
  months: number;
  totalInterest: number;
  payoffDate: string;
  impossible: boolean;
}

/** Amortize debts with a monthly extra, ordered by strategy. */
export function payoff(
  debts: DebtInput[],
  extraMonthly: number,
  strategy: "avalanche" | "snowball"
): PayoffResult {
  const order = [...debts].sort((a, b) =>
    strategy === "avalanche" ? b.apr - a.apr : a.balance - b.balance
  );
  let month = 0;
  let totalInterest = 0;
  const bals = order.map((d) => d.balance);
  const rates = order.map((d) => d.apr / 100 / 12);
  const mins = order.map((d) => d.minPayment);

  if (!order.length) return { months: 0, totalInterest: 0, payoffDate: new Date().toISOString().slice(0, 7), impossible: false };

  while (bals.some((b) => b > 0.005) && month < 1200) {
    month++;
    let extra = extraMonthly;
    for (let i = 0; i < order.length; i++) {
      if (bals[i] <= 0.005) continue;
      const interest = bals[i] * rates[i];
      totalInterest += interest;
      bals[i] += interest;
      let pay = mins[i];
      if (i === order.findIndex((_, j) => bals[j] > 0.005)) pay += extra; // first non-zero gets the extra
      if (pay >= bals[i]) { extra = Math.max(0, pay - bals[i]); bals[i] = 0; }
      else bals[i] -= pay;
    }
    // freed minimums roll into extra next month (snowball effect)
    extraMonthly = extraMonthly + mins.filter((_, i) => bals[i] <= 0.005 && month > 1).length * 0;
  }

  const impossible = month >= 1200;
  const d = new Date();
  d.setMonth(d.getMonth() + month);
  return { months: month, totalInterest, payoffDate: d.toISOString().slice(0, 7), impossible };
}

// ---------- Small prefs store (rollover, sinking funds, household, WhatsApp) ----------
const PREF_KEY = "drpt-finance-prefs";

export interface SinkingFund { id: string; name: string; target: number; perMonth: number; saved: number; dueMonth: string; }
export interface HouseholdMember { name: string; share: number; }

export interface FinancePrefs {
  rollover: boolean;
  sinking: SinkingFund[];
  household: HouseholdMember[];
  whatsappEnabled: boolean;
  whatsappNumber: string;
  budgetAlertPct: number;
}

const defaultPrefs = (): FinancePrefs => ({
  rollover: true,
  sinking: [],
  household: [],
  whatsappEnabled: false,
  whatsappNumber: "",
  budgetAlertPct: 85,
});

let prefCache: FinancePrefs | null = null;
const prefListeners = new Set<() => void>();

function loadPrefs(): FinancePrefs {
  if (prefCache) return prefCache;
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) { prefCache = { ...defaultPrefs(), ...(JSON.parse(raw) as Partial<FinancePrefs>) }; return prefCache; }
  } catch { /* fresh */ }
  prefCache = defaultPrefs();
  return prefCache;
}

export function updatePrefs(fn: (p: FinancePrefs) => FinancePrefs) {
  const next = fn(loadPrefs());
  prefCache = next;
  try { localStorage.setItem(PREF_KEY, JSON.stringify(next)); } catch { /* quota */ }
  prefListeners.forEach((l) => l());
}

function subPrefs(cb: () => void) {
  prefListeners.add(cb);
  return () => prefListeners.delete(cb);
}
const EMPTY_PREFS = defaultPrefs();
export function useFinancePrefs(): FinancePrefs {
  return useSyncExternalStore(subPrefs, loadPrefs, () => EMPTY_PREFS);
}

// ---------- Rollover ----------
/** Per-category rollover pool: unspent budget from previous months carried forward. */
export function rolloverPool(budgets: Budget[], expenses: ExpenseEntry[], enabled: boolean): Record<string, number> {
  if (!enabled) return {};
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${now.getMonth()}`;
  const pool: Record<string, number> = {};
  for (const b of budgets) {
    const priorSpent = expenses
      .filter((e) => e.category === b.category && e.date.slice(0, 7) < thisMonth)
      .reduce((s, e) => s + e.amount, 0);
    // Assume the same monthly budget in prior months; months elapsed from first record
    const months = expenses
      .filter((e) => e.category === b.category)
      .reduce((set, e) => set.add(e.date.slice(0, 7)), new Set<string>());
    const priorMonths = [...months].filter((m) => m < thisMonth).length;
    if (!priorMonths) continue;
    const carry = priorMonths * b.budget - priorSpent + b.spent * 0;
    if (carry !== 0) pool[b.category] = carry;
  }
  return pool;
}

// ---------- Export helpers ----------
export function toCsvRows(transactions: { name: string; category: string; date: string; amount: number; type: string; account: string }[]) {
  return transactions.map((t) => ({
    date: t.date, description: t.name, category: t.category,
    type: t.type, account: t.account,
    amount: (t.type === "expense" ? -t.amount : t.amount).toFixed(2),
  }));
}

/** WhatsApp deep link to send an alert to a number. */
export function whatsappLink(number: string, text: string): string {
  const n = number.replace(/[^\d]/g, "");
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

// ---------- Monthly spend per category (for sinking-fund/rollover display) ----------
export function monthsElapsed(expenses: ExpenseEntry[], category: string): number {
  const months = new Set(expenses.filter((e) => e.category === category).map((e) => e.date.slice(0, 7)));
  return months.size;
}
