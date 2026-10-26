"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { useCashFlow } from "@/lib/CashFlowContext";
import {
  detectRecurring,
  EXPENSE_KINDS,
  INCOME_KINDS,
  KIND_ICONS,
  KIND_TO_BUDGET_CAT,
  kindColor,
  leaderboard,
  monthSpendByKind,
  statementRows,
  streakDays,
  STREAK_BADGES,
  totalsFor,
  usedCurrencies,
} from "@/lib/cashflow";
import { downloadCsv, downloadXls } from "@/lib/download";
import { formatCurrency } from "@/lib/format";
import { CURRENCIES } from "@/lib/data";
import { Currency } from "@/lib/types";
import Icon from "@/components/Icon";

const STATEMENT_KEY = "drpt-statement";

type Tab = "statement" | "leaderboard" | "coach";
type LeaderBy = "payee" | "category";

interface AdviceCard {
  type: "warn" | "tip" | "praise" | "action";
  title: string;
  text: string;
}

const ADVICE_STYLE: Record<AdviceCard["type"], { icon: string; color: string; bg: string; label: string }> = {
  warn: { icon: "zap", color: "var(--red)", bg: "var(--pink-100)", label: "Cut back" },
  tip: { icon: "sparkles", color: "var(--amber)", bg: "var(--pink-100)", label: "Tip" },
  praise: { icon: "check-circle", color: "var(--green)", bg: "var(--pink-100)", label: "Well done" },
  action: { icon: "target", color: "var(--rose-600)", bg: "var(--pink-100)", label: "Do this" },
};

const monthKey = (iso: string) => iso.slice(0, 7); // yyyy-mm
const MONTH_ALL = "all";

export default function CashFlowPage() {
  const { user, currency, toast, isDemo, budgets } = useAppData();
  const {
    entries, addEntry, deleteEntry, syncing, lastSync, syncNow,
    wallets, activeWalletId, setActiveWalletId, createWallet, joinWallet,
  } = useCashFlow();

  /* ---------- quick add form ---------- */
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [entryCurrency, setEntryCurrency] = useState<Currency>(currency);
  const [category, setCategory] = useState<string>("Person");
  const [payee, setPayee] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [receipt, setReceipt] = useState<string | undefined>(undefined);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [walletName, setWalletName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [walletBusy, setWalletBusy] = useState(false);
  const [dismissedRecurring, setDismissedRecurring] = useState<Set<string>>(new Set());
  const [digest, setDigest] = useState<string | null>(null);
  const [digestLoading, setDigestLoading] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const kinds = type === "expense" ? EXPENSE_KINDS : INCOME_KINDS;

  /* ---------- receipt photo (downscaled JPEG dataURL) ---------- */
  function handleReceiptFile(file: File | undefined) {
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 900;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      setReceipt(canvas.toDataURL("image/jpeg", 0.72));
      toast("Receipt attached", "check-circle");
    };
    img.onerror = () => { URL.revokeObjectURL(url); toast("Could not read that image", "x"); };
    img.src = url;
  }

  /* ---------- voice quick-add ---------- */
  interface SpeechRec {
    lang: string;
    interimResults: boolean;
    onresult: ((e: Event) => void) | null;
    onend: (() => void) | null;
    onerror: (() => void) | null;
    start: () => void;
  }
  function startVoice() {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRec;
      webkitSpeechRecognition?: new () => SpeechRec;
    };
    const Rec = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Rec) {
      toast("Voice input isn't supported in this browser", "x");
      return;
    }
    const rec = new Rec();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = async (e: Event) => {
      const transcript = (e as unknown as { results: { 0: { 0: { transcript: string } } } }).results[0][0].transcript;
      toast(`Heard: “${transcript}”`, "sparkles");
      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "parse", messages: [{ role: "user", content: transcript }] }),
        });
        const data = await res.json();
        const p = data.entry;
        if (p) {
          if (p.type === "income" || p.type === "expense") {
            setType(p.type);
            setCategory(p.category || "Other");
          }
          if (p.category) setCategory(p.category);
          if (p.amount) setAmount(String(p.amount));
          if (p.payee) setPayee(p.payee);
          if (p.note) setNote(p.note);
          toast("Voice entry filled — check and save", "check-circle");
        }
      } catch {
        toast("Couldn't parse that — fill it in manually", "x");
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => { setListening(false); toast("Voice capture failed", "x"); };
    setListening(true);
    rec.start();
  }

  /* ---------- shared wallets ---------- */
  async function handleCreateWallet() {
    setWalletBusy(true);
    const w = await createWallet(walletName);
    setWalletBusy(false);
    if (w) {
      setWalletName("");
      toast(`Wallet created — share code ${w.code} with your people`, "users");
    } else {
      toast("Couldn't create wallet (cloud tables needed)", "x");
    }
  }

  async function handleJoinWallet() {
    if (!joinCode.trim()) return;
    setWalletBusy(true);
    const w = await joinWallet(joinCode);
    setWalletBusy(false);
    if (w) {
      setJoinCode("");
      toast(`Joined “${w.name}”`, "users");
    } else {
      toast("No wallet found with that code", "x");
    }
  }

  /* ---------- weekly digest ---------- */
  const weekKey = useMemo(() => {
    const d = new Date();
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${week}`;
  }, []);

  async function getDigest() {
    setDigestLoading(true);
    try {
      const cached = isDemo ? null : localStorage.getItem(`drpt-digest-${user?.id}-${weekKey}`);
      if (cached) {
        setDigest(cached);
        return;
      }
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const weekEntries = entries.filter((e) => new Date(e.date) >= weekStart);
      const context = JSON.stringify({
        currency: activeCurrency,
        weekTotals: totalsFor(weekEntries, activeCurrency),
        topCategories: leaderboard(weekEntries, activeCurrency, "category").slice(0, 5),
        topPayees: leaderboard(weekEntries, activeCurrency, "payee").slice(0, 5),
        entryCount: weekEntries.length,
        userName: user?.name,
      });
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "digest", context }),
      });
      const data = await res.json();
      const text = res.ok ? data.reply : "Couldn't generate the digest right now.";
      setDigest(text);
      if (res.ok && !isDemo) {
        try { localStorage.setItem(`drpt-digest-${user?.id}-${weekKey}`, text); } catch { /* fine */ }
      }
    } catch {
      setDigest("Couldn't generate the digest right now — check your connection.");
    } finally {
      setDigestLoading(false);
    }
  }

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!n || n <= 0) {
      toast("Enter an amount first", "x");
      amountRef.current?.focus();
      return;
    }
    if (!payee.trim()) {
      toast(type === "expense" ? "Who was the money for?" : "Where did it come from?", "x");
      return;
    }
    const saved = addEntry({
      type,
      amount: n,
      currency: entryCurrency,
      category,
      payee: payee.trim(),
      note: note.trim() || undefined,
      receipt,
      wallet_id: activeWalletId ?? undefined,
      date: new Date(date + "T" + new Date().toTimeString().slice(0, 8)).toISOString(),
    });
    toast(`${type === "expense" ? "Spent" : "Received"} ${formatCurrency(n, entryCurrency)} — saved`, "check-circle");

    // Budget alerts: warn at 80% and 100% of the mapped planner budget
    if (type === "expense") {
      const budgetCat = KIND_TO_BUDGET_CAT[category];
      const b = budgetCat ? budgets.find((x) => x.category === budgetCat && x.budget > 0) : undefined;
      if (b) {
        const spent = monthSpendByKind([saved, ...entries], category, entryCurrency);
        const pct = (spent / b.budget) * 100;
        if (pct >= 100) {
          toast(`${budgetCat} budget exceeded (${Math.round(pct)}%) — ease off this category`, "zap");
        } else if (pct >= 80) {
          toast(`${budgetCat} budget at ${Math.round(pct)}% — watch it`, "zap");
        }
      }
    }

    setAmount("");
    setNote("");
    setReceipt(undefined);
    if (fileRef.current) fileRef.current.value = "";
    // keep payee blank for next quick entry; keep type+category for speed
    setPayee("");
    amountRef.current?.focus();
  }

  /* ---------- wallet ---------- */
  const currencies = useMemo(() => usedCurrencies(entries), [entries]);
  const [viewCurrency, setViewCurrency] = useState<Currency | null>(null);
  const activeCurrency = viewCurrency ?? currency;
  const totals = useMemo(() => totalsFor(entries, activeCurrency), [entries, activeCurrency]);
  const cf = (n: number) => formatCurrency(n, activeCurrency);

  /* ---------- tabs ---------- */
  const [tab, setTab] = useState<Tab>("statement");

  /* ---------- statement ---------- */
  const months = useMemo(() => {
    const set = new Set(entries.filter((e) => e.currency === activeCurrency).map((e) => monthKey(e.date)));
    return [...set].sort().reverse();
  }, [entries, activeCurrency]);
  const [monthFilter, setMonthFilter] = useState(MONTH_ALL);
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    let r = statementRows(entries, activeCurrency);
    if (monthFilter !== MONTH_ALL) r = r.filter((x) => monthKey(x.entry.date) === monthFilter);
    const q = search.trim().toLowerCase();
    if (q) r = r.filter((x) => `${x.entry.payee} ${x.entry.category} ${x.entry.note ?? ""}`.toLowerCase().includes(q));
    return r;
  }, [entries, activeCurrency, monthFilter, search]);

  const monthLabel = (mk: string) =>
    new Date(mk + "-02").toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  function exportCsv() {
    downloadCsv(`cash-statement-${activeCurrency}-${monthFilter}.csv`,
      rows.map(({ entry: e, balance }) => ({
        Date: new Date(e.date).toLocaleDateString("en-GB"),
        Type: e.type,
        Description: e.payee,
        Category: e.category,
        Note: e.note ?? "",
        "Money In": e.type === "income" ? e.amount.toFixed(2) : "",
        "Money Out": e.type === "expense" ? e.amount.toFixed(2) : "",
        [`Balance ${activeCurrency}`]: balance.toFixed(2),
      })));
    toast("CSV downloaded", "download");
  }

  function exportXls() {
    downloadXls(
      `cash-statement-${activeCurrency}-${monthFilter}.xls`,
      `Cash Statement — ${user?.name ?? ""} (${activeCurrency})`,
      ["Date", "Type", "Description", "Category", "Note", `In ${activeCurrency}`, `Out ${activeCurrency}`, "Balance"],
      rows.map(({ entry: e, balance }) => [
        new Date(e.date).toLocaleDateString("en-GB"),
        e.type,
        e.payee,
        e.category,
        e.note ?? "",
        e.type === "income" ? e.amount.toFixed(2) : "",
        e.type === "expense" ? e.amount.toFixed(2) : "",
        balance.toFixed(2),
      ])
    );
    toast("Excel file downloaded", "download");
  }

  function exportPdf() {
    const doc = {
      title: "Cash Statement",
      accountName: `${user?.name ?? ""} · ${user?.email ?? ""}`,
      currency: activeCurrency,
      period: monthFilter === MONTH_ALL ? "All time" : monthLabel(monthFilter),
      generated: new Date().toLocaleString("en-GB"),
      opening: "",
      totalIn: cf(rows.reduce((s, { entry: e }) => s + (e.type === "income" ? e.amount : 0), 0)),
      totalOut: cf(rows.reduce((s, { entry: e }) => s + (e.type === "expense" ? e.amount : 0), 0)),
      closing: cf(rows.length ? rows[rows.length - 1].balance : 0),
      rows: rows.map(({ entry: e, balance }) => ({
        date: new Date(e.date).toLocaleDateString("en-GB"),
        payee: e.payee,
        category: e.category,
        note: e.note,
        in: e.type === "income" ? e.amount.toFixed(2) : "",
        out: e.type === "expense" ? e.amount.toFixed(2) : "",
        balance: balance.toFixed(2),
      })),
    };
    sessionStorage.setItem(STATEMENT_KEY, JSON.stringify(doc));
    window.open("/print/statement", "_blank");
  }

  /* ---------- leaderboard ---------- */
  const [leaderBy, setLeaderBy] = useState<LeaderBy>("payee");
  const leaders = useMemo(
    () => leaderboard(entries, activeCurrency, leaderBy),
    [entries, activeCurrency, leaderBy]
  );
  const leaderMax = leaders[0]?.total || 1;
  const medals = ["#FFD700", "#C0C0C0", "#CD7F32"];

  /* ---------- streak + recurring ---------- */
  const streak = useMemo(() => streakDays(entries), [entries]);
  const recurringHits = useMemo(
    () =>
      detectRecurring(entries)
        .filter((h) => !dismissedRecurring.has(h.payee.toLowerCase()))
        .slice(0, 4),
    [entries, dismissedRecurring]
  );

  /* ---------- AI coach ---------- */
  const [advice, setAdvice] = useState<AdviceCard[] | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState("");

  async function getAdvice() {
    setAdviceLoading(true);
    setAdviceError("");
    try {
      const summary = {
        currency: activeCurrency,
        totals: totalsFor(entries, activeCurrency),
        topPayees: leaderboard(entries, activeCurrency, "payee").slice(0, 8),
        topCategories: leaderboard(entries, activeCurrency, "category").slice(0, 8),
        recentEntries: entries.slice(0, 25).map((e) => ({
          type: e.type, amount: e.amount, currency: e.currency,
          category: e.category, payee: e.payee, date: e.date.slice(0, 10),
        })),
        entryCount: entries.length,
      };
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "advice", context: JSON.stringify(summary) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI unavailable");
      setAdvice(data.cards as AdviceCard[]);
    } catch (err) {
      setAdviceError(err instanceof Error ? err.message : "Could not load advice");
    } finally {
      setAdviceLoading(false);
    }
  }

  /* ---------- recent for delete ---------- */
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <>
      {/* header */}
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Cash Flow</h2>
          <p className="section-sub">
            Log every cent in and out — works offline, syncs to the cloud
            {lastSync ? ` · synced ${new Date(lastSync).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : ""}
            {isDemo ? " · demo (not saved)" : ""}
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={syncNow} disabled={syncing}>
          <Icon name="refresh-cw" size={15} /> {syncing ? "Syncing…" : "Sync now"}
        </button>
      </div>

      {/* quick add */}
      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <form onSubmit={handleAdd}>
          <div className="cash-add-grid">
            <div>
              <label className="field-label">Type</label>
              <div className="cash-type-toggle">
                <button
                  type="button"
                  className={"cash-type-btn out" + (type === "expense" ? " active" : "")}
                  onClick={() => { setType("expense"); setCategory("Person"); }}
                >
                  <Icon name="arrow-up-right" size={15} /> Money out
                </button>
                <button
                  type="button"
                  className={"cash-type-btn in" + (type === "income" ? " active" : "")}
                  onClick={() => { setType("income"); setCategory("Salary"); }}
                >
                  <Icon name="arrow-down-left" size={15} /> Money in
                </button>
              </div>
            </div>
            <div>
              <label className="field-label">Amount</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  ref={amountRef}
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ flex: 1, fontSize: 17, fontWeight: 700 }}
                  autoFocus
                />
                <select
                  value={entryCurrency}
                  onChange={(e) => setEntryCurrency(e.target.value as Currency)}
                  style={{ width: 92 }}
                  aria-label="Currency"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="field-label">{type === "expense" ? "To whom / what for?" : "From whom / what source?"}</label>
              <input
                type="text"
                placeholder={type === "expense" ? "e.g. Mai Dube, OK Mart, Netflix…" : "e.g. Employer, John, client…"}
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="cash-kinds">
            {kinds.map((k) => (
              <button
                key={k}
                type="button"
                className={"kind-chip" + (category === k ? " active" : "")}
                onClick={() => setCategory(k)}
              >
                <Icon name={KIND_ICONS[k] ?? "more-horizontal"} size={14} /> {k}
              </button>
            ))}
          </div>

          <div className="cash-add-footer">
            <input
              type="text"
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ flex: 1, minWidth: 140 }}
            />
            <input
              type="date"
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: 150 }}
              aria-label="Date"
            />
            <button
              type="button"
              className={"icon-btn" + (listening ? " mic-live" : "")}
              title="Voice quick-add"
              onClick={startVoice}
            >
              <Icon name="radio" size={16} style={listening ? { color: "var(--red)" } : undefined} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={(e) => handleReceiptFile(e.target.files?.[0])}
            />
            <button
              type="button"
              className="icon-btn"
              title={receipt ? "Receipt attached — tap to replace" : "Attach receipt"}
              onClick={() => fileRef.current?.click()}
            >
              <Icon name={receipt ? "check-circle" : "receipt"} size={16} style={receipt ? { color: "var(--green)" } : undefined} />
            </button>
            <button type="submit" className="btn btn-primary">
              <Icon name="plus" size={16} /> Save entry
            </button>
          </div>
        </form>
      </div>

      {/* wallet */}
      <div className="wallet-row" style={{ marginBottom: 20 }}>
        <div className="glass-card wallet-card">
          <div className="w-label"><Icon name="arrow-down-left" size={15} style={{ color: "var(--green)" }} /> Money in</div>
          <div className="w-value" style={{ color: "var(--green)" }}>{cf(totals.income)}</div>
          <div className="w-sub">{activeCurrency} · all time</div>
        </div>
        <div className="glass-card wallet-card">
          <div className="w-label"><Icon name="arrow-up-right" size={15} style={{ color: "var(--rose-600)" }} /> Money out</div>
          <div className="w-value" style={{ color: "var(--rose-600)" }}>{cf(totals.expense)}</div>
          <div className="w-sub">{activeCurrency} · all time</div>
        </div>
        <div className="glass-card wallet-card">
          <div className="w-label"><Icon name="wallet" size={15} style={{ color: "var(--rose-600)" }} /> In your pocket</div>
          <div className="w-value">{cf(totals.balance)}</div>
          <div className="w-sub">
            {currencies.length > 1
              ? currencies.map((c) => (
                  <button
                    key={c}
                    className={"cur-chip" + (c === activeCurrency ? " active" : "")}
                    onClick={() => setViewCurrency(c)}
                  >
                    {c}
                  </button>
                ))
              : `${activeCurrency} · balance`}
          </div>
        </div>
        <div className="glass-card wallet-card">
          <div className="w-label"><Icon name="zap" size={15} style={{ color: "var(--amber)" }} /> Logging streak</div>
          <div className="w-value">
            {streak === 0 ? "—" : `${streak} day${streak === 1 ? "" : "s"}`}
            {streak > 0 && <span style={{ fontSize: 20, marginLeft: 6 }}>🔥</span>}
          </div>
          <div className="w-sub" style={{ gap: 4 }}>
            {STREAK_BADGES.map((b) => (
              <span
                key={b}
                className={"badge-chip" + (streak >= b ? " earned" : "")}
                title={`${b}-day badge`}
              >
                {b}d
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* shared wallet */}
      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div className="st-toolbar" style={{ marginBottom: wallets.length ? 12 : 0 }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>
            <Icon name="users" size={16} style={{ color: "var(--rose-600)", verticalAlign: "-2px" }} /> Shared wallet
          </h3>
          {wallets.length > 0 && (
            <div className="st-exports">
              <button
                className={"cur-chip" + (!activeWalletId ? " active" : "")}
                onClick={() => setActiveWalletId(null)}
              >
                Personal
              </button>
              {wallets.map((w) => (
                <button
                  key={w.id}
                  className={"cur-chip" + (activeWalletId === w.id ? " active" : "")}
                  onClick={() => setActiveWalletId(w.id)}
                  title={`Share code: ${w.code}`}
                >
                  {w.name} · {w.code}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="New wallet name (e.g. Home)"
            value={walletName}
            onChange={(e) => setWalletName(e.target.value)}
            style={{ flex: "1 1 170px", border: "1.5px solid var(--card-border)", borderRadius: 12, padding: "10px 13px", fontSize: 13.5, background: "var(--card-solid)", color: "var(--ink-900)" }}
          />
          <button className="btn btn-ghost btn-sm" onClick={handleCreateWallet} disabled={walletBusy}>
            <Icon name="plus" size={14} /> Create
          </button>
          <input
            type="text"
            placeholder="Join code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            style={{ width: 110, border: "1.5px solid var(--card-border)", borderRadius: 12, padding: "10px 13px", fontSize: 13.5, background: "var(--card-solid)", color: "var(--ink-900)", textTransform: "uppercase" }}
          />
          <button className="btn btn-ghost btn-sm" onClick={handleJoinWallet} disabled={walletBusy || !joinCode.trim()}>
            Join
          </button>
        </div>
        {activeWalletId && (
          <p style={{ fontSize: 12, color: "var(--ink-500)", margin: "10px 0 0" }}>
            New entries are logged to <b>{wallets.find((w) => w.id === activeWalletId)?.name}</b> —
            everyone with the code sees them in real time.
          </p>
        )}
      </div>

      {/* tabs */}
      <div className="tabs" style={{ marginBottom: 18 }}>
        {([["statement", "Cash Statement"], ["leaderboard", "Leaderboard"], ["coach", "AI Coach"]] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            className={"tab-btn" + (tab === id ? " active" : "")}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ---------- STATEMENT ---------- */}
      {tab === "statement" && (
        <div className="glass-card card-pad">
          <div className="st-toolbar">
            <div className="st-filters">
              <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} aria-label="Month">
                <option value={MONTH_ALL}>All time</option>
                {months.map((m) => (
                  <option key={m} value={m}>{monthLabel(m)}</option>
                ))}
              </select>
              <div style={{ position: "relative", flex: 1, minWidth: 140 }}>
                <input
                  type="search"
                  placeholder="Search payee, category, note…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: "100%", paddingLeft: 34 }}
                />
                <Icon name="search" size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--ink-500)" }} />
              </div>
            </div>
            <div className="st-exports">
              <button className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={!rows.length}>
                <Icon name="file-down" size={14} /> CSV
              </button>
              <button className="btn btn-ghost btn-sm" onClick={exportXls} disabled={!rows.length}>
                <Icon name="file-down" size={14} /> Excel
              </button>
              <button className="btn btn-ghost btn-sm" onClick={exportPdf} disabled={!rows.length}>
                <Icon name="printer" size={14} /> PDF
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th style={{ textAlign: "right" }}>In</th>
                  <th style={{ textAlign: "right" }}>Out</th>
                  <th style={{ textAlign: "right" }}>Balance</th>
                  <th style={{ width: 44 }}></th>
                </tr>
              </thead>
              <tbody>
                {[...rows].reverse().map(({ entry: e, balance }) => (
                  <tr key={e.id}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {new Date(e.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                      <div style={{ fontSize: 10.5, color: "var(--ink-500)" }}>
                        {new Date(e.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {e.payee}
                        {e.receipt && (
                          <button
                            className="receipt-btn"
                            title="View receipt"
                            onClick={() => setReceiptPreview(e.receipt!)}
                          >
                            <Icon name="receipt" size={13} />
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--ink-500)" }}>
                        {e.category}{e.note ? ` · ${e.note}` : ""}{e.wallet_id ? ` · ${wallets.find((w) => w.id === e.wallet_id)?.name ?? "shared"}` : ""}{e.currency !== activeCurrency ? ` · ${e.currency} ${e.amount.toFixed(2)}` : ""}
                      </div>
                    </td>
                    <td style={{ textAlign: "right", color: "var(--green)", fontWeight: 600 }}>
                      {e.type === "income" ? cf(e.amount) : ""}
                    </td>
                    <td style={{ textAlign: "right", color: "var(--rose-600)", fontWeight: 600 }}>
                      {e.type === "expense" ? cf(e.amount) : ""}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{cf(balance)}</td>
                    <td>
                      {confirmDelete === e.id ? (
                        <button
                          className="icon-btn"
                          title="Confirm delete"
                          onClick={() => { deleteEntry(e.id); setConfirmDelete(null); toast("Entry deleted", "trash-2"); }}
                        >
                          <Icon name="check" size={15} style={{ color: "var(--red)" }} />
                        </button>
                      ) : (
                        <button className="icon-btn" title="Delete" onClick={() => setConfirmDelete(e.id)}>
                          <Icon name="trash-2" size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 36, color: "var(--ink-500)" }}>
                      Nothing here yet — add your first entry above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------- LEADERBOARD ---------- */}
      {tab === "leaderboard" && (
        <div className="glass-card card-pad">
          <div className="st-toolbar" style={{ marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>
              <Icon name="star" size={16} style={{ color: "var(--amber)", verticalAlign: "-2px" }} /> Spending table
            </h3>
            <div className="st-exports">
              {([["payee", "By who"], ["category", "By category"]] as [LeaderBy, string][]).map(([id, label]) => (
                <button
                  key={id}
                  className={"cur-chip" + (leaderBy === id ? " active" : "")}
                  onClick={() => setLeaderBy(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {leaders.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--ink-500)", padding: "30px 0" }}>
              No expenses yet — your league table appears once you start logging.
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {leaders.map((row, i) => (
              <div key={row.name} className="leader-row">
                <div
                  className="leader-rank"
                  style={i < 3 ? { background: medals[i], color: i === 0 ? "#5c4000" : "#3d3d3d" } : undefined}
                >
                  {i + 1}
                </div>
                <div className="leader-info">
                  <div className="leader-name">
                    <Icon name={KIND_ICONS[row.name] ?? "tag"} size={14} style={{ color: kindColor(i), verticalAlign: "-2px" }} />{" "}
                    {row.name}
                    <span className="leader-count">{row.count}×</span>
                  </div>
                  <div className="leader-bar-track">
                    <div
                      className="leader-bar"
                      style={{ width: `${Math.max(3, (row.total / leaderMax) * 100)}%`, background: kindColor(i) }}
                    />
                  </div>
                </div>
                <div className="leader-total">{cf(row.total)}</div>
              </div>
            ))}
          </div>
          {leaders.length > 0 && (
            <p style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 12, marginBottom: 0 }}>
              Ranked by total spent in {activeCurrency} — the higher the rank, the more that payee/category eats.
            </p>
          )}
        </div>
      )}

      {/* receipt lightbox */}
      {receiptPreview && (
        <div className="receipt-lightbox" onClick={() => setReceiptPreview(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- dataURL receipt preview */}
          <img src={receiptPreview} alt="Receipt" />
          <div className="receipt-hint">Tap anywhere to close</div>
        </div>
      )}

      {/* ---------- AI COACH ---------- */}
      {tab === "coach" && (
        <div className="glass-card card-pad">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>
              <Icon name="sparkles" size={16} style={{ color: "var(--rose-500)", verticalAlign: "-2px" }} /> Your money coach
            </h3>
            <button className="btn btn-primary btn-sm" onClick={getAdvice} disabled={adviceLoading}>
              {adviceLoading ? "Thinking…" : advice ? "Refresh advice" : "Analyse my money"}
            </button>
          </div>

          {adviceError && <p style={{ color: "var(--red)", fontSize: 13 }}>{adviceError}</p>}

          {!advice && !adviceLoading && !adviceError && (
            <p style={{ color: "var(--ink-500)", fontSize: 13.5, margin: 0 }}>
              Tap the button and your AI coach will study your entries — what to cut back,
              where money is leaking, and concrete ways to save more. Powered by Groq.
            </p>
          )}

          {adviceLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="advice-skeleton" />
              ))}
            </div>
          )}

          {advice && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {advice.map((c, i) => {
                const s = ADVICE_STYLE[c.type] ?? ADVICE_STYLE.tip;
                return (
                  <div key={i} className="advice-card" style={{ borderLeftColor: s.color }}>
                    <div className="advice-kind" style={{ color: s.color }}>
                      <Icon name={s.icon} size={13} /> {s.label}
                    </div>
                    <div className="advice-title">{c.title}</div>
                    <div className="advice-text">{c.text}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* recurring detection */}
          {recurringHits.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{ margin: "0 0 10px", fontSize: 14 }}>
                <Icon name="repeat" size={15} style={{ color: "var(--rose-500)", verticalAlign: "-2px" }} /> Looks recurring
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recurringHits.map((h) => (
                  <div key={h.payee} className="recurring-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b>{h.payee}</b> hits you ~every {h.avgGapDays} days ({h.count}× logged)
                      <div style={{ fontSize: 12, color: "var(--ink-500)" }}>
                        ~{formatCurrency(h.avgAmount, h.currency)} each · ~{formatCurrency(h.avgAmount * (30 / Math.max(h.avgGapDays, 1)), h.currency)}/month
                      </div>
                    </div>
                    <button
                      className="icon-btn"
                      title="Dismiss"
                      onClick={() => setDismissedRecurring((prev) => new Set(prev).add(h.payee.toLowerCase()))}
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* weekly digest */}
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--card-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
              <h4 style={{ margin: 0, fontSize: 14 }}>
                <Icon name="file-text" size={15} style={{ color: "var(--rose-500)", verticalAlign: "-2px" }} /> Weekly digest · {weekKey}
              </h4>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={getDigest} disabled={digestLoading}>
                  {digestLoading ? "Writing…" : digest ? "Regenerate" : "Generate digest"}
                </button>
                {digest && (
                  <a
                    className="btn btn-ghost btn-sm"
                    style={{ textDecoration: "none" }}
                    href={`https://wa.me/?text=${encodeURIComponent(digest.replace(/<[^>]+>/g, " "))}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Icon name="send" size={13} /> Share
                  </a>
                )}
              </div>
            </div>
            {digest && (
              <div className="digest-body" dangerouslySetInnerHTML={{ __html: digest }} />
            )}
            {!digest && !digestLoading && (
              <p style={{ fontSize: 12.5, color: "var(--ink-500)", margin: 0 }}>
                Your AI-written weekly money recap — generated fresh each week, shareable on WhatsApp.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
