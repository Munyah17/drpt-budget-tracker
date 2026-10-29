"use client";

/**
 * WellSpend Wallet — per-user stored-value account plus issued cards.
 *
 * localStorage store shared across portals (same pattern as corpStore):
 * the employee's Early Pay payout can land in the wallet, and the
 * corporate disbursements page can push salaries into it. Swap for
 * ledger tables + issuer-processor APIs when the backend is ready.
 */
import { useSyncExternalStore } from "react";

const KEY = "drpt-wallet";

export type CardNetwork = "ZimSwitch" | "Visa" | "Mastercard";
export type CardKind = "virtual" | "physical";
export type CardStatus = "Active" | "Frozen" | "Ordered";
export type Rail = "ZIPIT" | "RTGS" | "Internal" | "EWA" | "Card" | "TopUp";

export interface WalletCard {
  id: string;
  network: CardNetwork;
  kind: CardKind;
  last4: string;
  holder: string;
  expiry: string; // MM/YY
  status: CardStatus;
  /** What funds the card spends from */
  source: "Wallet" | "Early Pay";
}

export interface WalletTxn {
  id: string;
  direction: "in" | "out";
  rail: Rail;
  label: string;
  counterparty?: string;
  amount: number;
  date: string; // ISO
  status: "Done" | "Processing" | "Failed";
}

export interface WalletStore {
  opened: boolean;
  balance: number;
  accountNo: string;
  openedAt: string | null;
  cards: WalletCard[];
  txns: WalletTxn[];
}

const empty = (): WalletStore => ({
  opened: false,
  balance: 0,
  accountNo: "",
  openedAt: null,
  cards: [],
  txns: [],
});

// ---------- persistence ----------
let cache: WalletStore | null = null;
const listeners = new Set<() => void>();

function load(): WalletStore {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      cache = { ...empty(), ...(JSON.parse(raw) as Partial<WalletStore>) };
      return cache;
    }
  } catch { /* fresh */ }
  cache = empty();
  return cache;
}

function save(next: WalletStore) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* quota */ }
  listeners.forEach((l) => l());
}

export function updateWallet(fn: (s: WalletStore) => WalletStore) {
  save(fn(load()));
}

const wid = (p: string) => `${p}-${Date.now().toString(36)}${Math.floor(Math.random() * 999)}`;

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { cache = null; cb(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(cb); window.removeEventListener("storage", onStorage); };
}

const EMPTY_SNAPSHOT = empty();
export function useWallet(): WalletStore {
  return useSyncExternalStore(subscribe, load, () => EMPTY_SNAPSHOT);
}

// ---------- operations ----------

export function openWallet(): void {
  updateWallet((s) =>
    s.opened
      ? s
      : {
          ...s,
          opened: true,
          accountNo: "WS " + String(Math.floor(Math.random() * 9e8) + 1e8).replace(/(\d{3})(?=\d)/g, "$1 "),
          openedAt: new Date().toISOString().slice(0, 10),
        }
  );
}

export function walletTxn(txn: Omit<WalletTxn, "id" | "date" | "status"> & { status?: WalletTxn["status"] }): void {
  const t: WalletTxn = {
    ...txn,
    id: wid("TXN"),
    date: new Date().toISOString().slice(0, 10),
    status: txn.status ?? "Done",
  };
  updateWallet((s) => ({ ...s, txns: [t, ...s.txns] }));
}

export function walletCredit(amount: number, label: string, rail: Rail, counterparty?: string): void {
  updateWallet((s) => ({ ...s, balance: Math.round((s.balance + amount) * 100) / 100 }));
  walletTxn({ direction: "in", rail, label, counterparty, amount });
}

/** Returns false when funds are insufficient — caller shows the error. */
export function walletDebit(amount: number, label: string, rail: Rail, counterparty?: string): boolean {
  const s = load();
  if (!s.opened || s.balance < amount) return false;
  updateWallet((w) => ({ ...w, balance: Math.round((w.balance - amount) * 100) / 100 }));
  walletTxn({ direction: "out", rail, label, counterparty, amount, status: rail === "RTGS" ? "Processing" : "Done" });
  return true;
}

export function issueCard(network: CardNetwork, kind: CardKind, holder: string, source: WalletCard["source"]): void {
  const exp = new Date();
  exp.setFullYear(exp.getFullYear() + 3);
  const card: WalletCard = {
    id: wid("CARD"),
    network,
    kind,
    last4: String(Math.floor(1000 + Math.random() * 9000)),
    holder: holder.toUpperCase(),
    expiry: `${String(exp.getMonth() + 1).padStart(2, "0")}/${String(exp.getFullYear()).slice(2)}`,
    status: kind === "virtual" ? "Active" : "Ordered",
    source,
  };
  updateWallet((s) => ({ ...s, cards: [card, ...s.cards] }));
}

export function setCardStatus(id: string, status: CardStatus): void {
  updateWallet((s) => ({ ...s, cards: s.cards.map((c) => (c.id === id ? { ...c, status } : c)) }));
}
