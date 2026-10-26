"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CashEntry, live, newId, storageKey } from "./cashflow";
import { supabase } from "./supabase";
import { useAppData } from "./AppDataContext";

const SYNC_INTERVAL_MS = 30 * 60 * 1000; // cloud sync every 30 minutes
const TABLE = "cash_entries";
const RECEIPT_BUCKET = "receipts";

export interface SharedWallet {
  id: string;
  name: string;
  code: string;
  owner_id: string;
}

interface CashFlowContextValue {
  entries: CashEntry[];
  /** true while a cloud sync round-trip is in flight */
  syncing: boolean;
  /** epoch ms of last successful sync, or null if never */
  lastSync: number | null;
  addEntry: (input: Omit<CashEntry, "id" | "synced" | "deleted">) => CashEntry;
  updateEntry: (id: string, patch: Partial<CashEntry>) => void;
  deleteEntry: (id: string) => void;
  /** force a sync round now */
  syncNow: () => Promise<void>;

  /** wallets the user belongs to (cloud feature — empty until SQL is run) */
  wallets: SharedWallet[];
  /** when set, new entries are logged to that shared wallet */
  activeWalletId: string | null;
  setActiveWalletId: (id: string | null) => void;
  createWallet: (name: string) => Promise<SharedWallet | null>;
  joinWallet: (code: string) => Promise<SharedWallet | null>;
}

const CashFlowContext = createContext<CashFlowContextValue | null>(null);

function loadLocal(userId: string): CashEntry[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CashEntry[]) : [];
  } catch {
    return [];
  }
}

function saveLocal(userId: string, entries: CashEntry[]) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(entries));
  } catch {
    /* storage full/blocked — entries still live in memory */
  }
}

export function CashFlowProvider({ children }: { children: ReactNode }) {
  const { user, isDemo, isAuthenticated } = useAppData();
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [wallets, setWallets] = useState<SharedWallet[]>([]);
  const [activeWalletId, setActiveWalletIdState] = useState<string | null>(null);
  const syncingRef = useRef(false);
  const entriesRef = useRef<CashEntry[]>([]);
  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);
  const userId = user?.id ?? null;

  /* ---------- load from localStorage when the user changes ---------- */
  useEffect(() => {
    if (!isAuthenticated || !userId || isDemo) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset store on logout/switch
      setEntries([]);
       
      setLastSync(null);
      return;
    }
     
    setEntries(loadLocal(userId));
     
    setLastSync(null);
  }, [userId, isAuthenticated, isDemo]);

  /* ---------- persist locally (never for the demo session) ---------- */
  const firstLoad = useRef(true);
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    if (!isDemo && userId) {
      saveLocal(userId, entries);
      try {
        localStorage.setItem(`drpt-wallets-${userId}`, JSON.stringify({ wallets, activeWalletId }));
      } catch { /* best effort */ }
    }
  }, [entries, wallets, activeWalletId, isDemo, userId]);

  // Restore wallet memberships alongside entries
  useEffect(() => {
    if (!isAuthenticated || !userId || isDemo) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on logout/switch
      setWallets([]);
       
      setActiveWalletIdState(null);
      return;
    }
    try {
      const raw = localStorage.getItem(`drpt-wallets-${userId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
         
        if (Array.isArray(parsed.wallets)) setWallets(parsed.wallets);
         
        setActiveWalletIdState(parsed.activeWalletId ?? null);
      }
    } catch { /* ignore */ }
  }, [userId, isAuthenticated, isDemo]);

  const setActiveWalletId = useCallback((id: string | null) => {
    setActiveWalletIdState(id);
  }, []);

  /* ---------- cloud sync ---------- */
  const pushPending = useCallback(async (uid: string, list: CashEntry[]) => {
    const toInsert = list.filter((e) => !e.synced && !e.deleted);
    const toDelete = list.filter((e) => e.synced && e.deleted);

    if (toInsert.length) {
      // Upload any pending receipt photos first so rows carry receipt_path
      for (const e of toInsert) {
        if (e.receipt && !e.receipt_path) {
          try {
            const blob = await (await fetch(e.receipt)).blob();
            const path = `${uid}/${e.id}.jpg`;
            const { error: upErr } = await supabase.storage
              .from(RECEIPT_BUCKET)
              .upload(path, blob, { contentType: "image/jpeg", upsert: true });
            if (!upErr) {
              e.receipt_path = path;
              setEntries((prev) => prev.map((x) => (x.id === e.id ? { ...x, receipt_path: path } : x)));
            }
          } catch { /* bucket may not exist yet — keep the local copy */ }
        }
      }
      const rows = toInsert.map((e) => ({
        id: e.id,
        user_id: uid,
        type: e.type,
        amount: e.amount,
        currency: e.currency,
        category: e.category,
        payee: e.payee,
        note: e.note ?? null,
        occurred_at: e.date,
        wallet_id: e.wallet_id ?? null,
        receipt_path: e.receipt_path ?? null,
      }));
      const { error } = await supabase.from(TABLE).upsert(rows);
      if (!error) {
        const done = new Set(toInsert.map((e) => e.id));
        setEntries((prev) => prev.map((e) => (done.has(e.id) ? { ...e, synced: true } : e)));
      }
    }

    for (const e of toDelete) {
      const { error } = await supabase.from(TABLE).delete().eq("id", e.id);
      if (!error) setEntries((prev) => prev.filter((x) => x.id !== e.id));
    }
  }, []);

  const pullRemote = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("user_id", uid)
      .order("occurred_at", { ascending: false })
      .limit(2000);
    if (!error && data) {
      setEntries((prev) => {
        const map = new Map(prev.map((e) => [e.id, e]));
        for (const r of data as Record<string, unknown>[]) {
          const id = String(r.id);
          const existing = map.get(id);
          // Local unsynced edits (incl. tombstones) win until pushed
          if (existing && (!existing.synced || existing.deleted)) continue;
          map.set(id, {
            id,
            type: r.type === "income" ? "income" : "expense",
            amount: Number(r.amount) || 0,
            currency: String(r.currency || "USD"),
            category: String(r.category || "Other"),
            payee: String(r.payee || ""),
            note: (r.note as string) || undefined,
            receipt_path: (r.receipt_path as string) || undefined,
            wallet_id: (r.wallet_id as string) || undefined,
            date: String(r.occurred_at || r.created_at || new Date().toISOString()),
            synced: true,
          });
        }
        return [...map.values()];
      });
    }

    /* ---- shared wallets: refresh memberships, then pull wallet entries ---- */
    try {
      const { data: memberships } = await supabase
        .from("wallet_members")
        .select("wallet_id")
        .eq("user_id", uid);
      const ids = (memberships ?? []).map((m) => String(m.wallet_id));
      if (!ids.length) return;

      const { data: walletRows } = await supabase.from("wallets").select("*").in("id", ids);
      if (walletRows) setWallets(walletRows as SharedWallet[]);

      const { data: sharedRows } = await supabase
        .from(TABLE)
        .select("*")
        .in("wallet_id", ids)
        .order("occurred_at", { ascending: false })
        .limit(2000);
      if (!sharedRows) return;
      setEntries((prev) => {
        const map = new Map(prev.map((e) => [e.id, e]));
        for (const r of sharedRows as Record<string, unknown>[]) {
          const id = String(r.id);
          const existing = map.get(id);
          if (existing && (!existing.synced || existing.deleted)) continue;
          map.set(id, {
            id,
            type: r.type === "income" ? "income" : "expense",
            amount: Number(r.amount) || 0,
            currency: String(r.currency || "USD"),
            category: String(r.category || "Other"),
            payee: String(r.payee || ""),
            note: (r.note as string) || undefined,
            receipt_path: (r.receipt_path as string) || undefined,
            wallet_id: (r.wallet_id as string) || undefined,
            date: String(r.occurred_at || r.created_at || new Date().toISOString()),
            synced: true,
          });
        }
        return [...map.values()];
      });
    } catch { /* wallet tables may not exist yet */ }
  }, []);

  const syncNow = useCallback(async () => {
    if (!userId || isDemo || syncingRef.current) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      // Only Supabase-authenticated sessions can reach the table (RLS)
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        await pushPending(userId, entriesRef.current);
        await pullRemote(userId);
      }
      setLastSync(Date.now());
    } catch {
      /* offline / table missing — stay local, retry next tick */
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [userId, isDemo, pushPending, pullRemote]);

  // Scheduled + reconnect syncs
  useEffect(() => {
    if (!isAuthenticated || !userId || isDemo) return;
    const kickoff = setTimeout(syncNow, 0); // defer out of the effect body
    const timer = setInterval(syncNow, SYNC_INTERVAL_MS);
    const onOnline = () => syncNow();
    window.addEventListener("online", onOnline);
    return () => {
      clearTimeout(kickoff);
      clearInterval(timer);
      window.removeEventListener("online", onOnline);
    };
  }, [isAuthenticated, userId, isDemo, syncNow]);

  /* ---------- mutations ---------- */
  const addEntry = useCallback((input: Omit<CashEntry, "id" | "synced" | "deleted">) => {
    const entry: CashEntry = { ...input, id: newId(), synced: false };
    setEntries((prev) => [entry, ...prev]);
    return entry;
  }, []);

  const updateEntry = useCallback((id: string, patch: Partial<CashEntry>) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch, synced: false } : e))
    );
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, deleted: true } : e))
    );
  }, []);

  /* ---------- shared wallets ---------- */
  const genCode = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    return [...bytes].map((b) => chars[b % chars.length]).join("");
  };

  const createWallet = useCallback(async (name: string): Promise<SharedWallet | null> => {
    if (!userId || isDemo) return null;
    try {
      const wallet: SharedWallet = { id: newId(), name: name.trim() || "Shared wallet", code: genCode(), owner_id: userId };
      const { error } = await supabase.from("wallets").insert(wallet);
      if (error) return null;
      await supabase.from("wallet_members").insert({ wallet_id: wallet.id, user_id: userId });
      setWallets((prev) => [...prev, wallet]);
      setActiveWalletIdState(wallet.id);
      return wallet;
    } catch {
      return null;
    }
  }, [userId, isDemo]);

  const joinWallet = useCallback(async (code: string): Promise<SharedWallet | null> => {
    if (!userId || isDemo) return null;
    try {
      // Security-definer RPC finds the wallet by code and adds membership in one step
      const { data: wid, error } = await supabase.rpc("join_wallet", {
        join_code: code.trim().toUpperCase(),
      });
      if (error || !wid) return null;
      const { data } = await supabase.from("wallets").select("*").eq("id", wid).maybeSingle();
      if (!data) return null;
      const wallet = data as SharedWallet;
      setWallets((prev) => (prev.some((w) => w.id === wallet.id) ? prev : [...prev, wallet]));
      setActiveWalletIdState(wallet.id);
      await syncNow();
      return wallet;
    } catch {
      return null;
    }
  }, [userId, isDemo, syncNow]);

  const value = useMemo<CashFlowContextValue>(
    () => ({
      entries: live(entries),
      syncing,
      lastSync,
      addEntry,
      updateEntry,
      deleteEntry,
      syncNow,
      wallets,
      activeWalletId,
      setActiveWalletId,
      createWallet,
      joinWallet,
    }),
    [entries, syncing, lastSync, addEntry, updateEntry, deleteEntry, syncNow, wallets, activeWalletId, setActiveWalletId, createWallet, joinWallet]
  );

  return <CashFlowContext.Provider value={value}>{children}</CashFlowContext.Provider>;
}

export function useCashFlow() {
  const ctx = useContext(CashFlowContext);
  if (!ctx) throw new Error("useCashFlow must be used within CashFlowProvider");
  return ctx;
}
