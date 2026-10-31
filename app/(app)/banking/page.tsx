"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Capacitor } from "@capacitor/core";
import Icon from "@/components/Icon";
import { useAppData } from "@/lib/AppDataContext";
import { authedFetch } from "@/lib/clientApi";
import { trackEvent } from "@/lib/analytics";
import { suggestMatch, BankTxn } from "@/lib/matching";
import { EXPENSE_CATS, INCOME_CATEGORIES } from "@/lib/data";
import { fmt, ukDate } from "@/lib/format";

interface Connection {
  id: number;
  status: string;
  institution_name: string | null;
  consent_expires_at: string | null;
}
interface Institution { id: string; name: string; logo: string | null }
interface Feed {
  connection: Connection | null;
  accounts: { id: number; name: string | null; iban: string | null; currency: string | null }[];
  transactions: BankTxn[];
}

const COUNTRIES: { code: string; name: string }[] = [
  { code: "gb", name: "United Kingdom" }, { code: "ie", name: "Ireland" },
  { code: "fr", name: "France" }, { code: "de", name: "Germany" },
  { code: "es", name: "Spain" }, { code: "pt", name: "Portugal" },
  { code: "it", name: "Italy" }, { code: "nl", name: "Netherlands" },
  { code: "be", name: "Belgium" }, { code: "at", name: "Austria" },
  { code: "pl", name: "Poland" }, { code: "se", name: "Sweden" },
  { code: "no", name: "Norway" }, { code: "dk", name: "Denmark" },
  { code: "fi", name: "Finland" }, { code: "cz", name: "Czechia" },
  { code: "lt", name: "Lithuania" }, { code: "lv", name: "Latvia" },
  { code: "ee", name: "Estonia" }, { code: "ro", name: "Romania" },
  { code: "hu", name: "Hungary" }, { code: "gr", name: "Greece" },
];

const REAUTH_DAYS_WARN = 14;
/** sessionStorage key holding the bank the user was paying to unlock. */
const PENDING_KEY = "drpt-banking-pending";

export default function BankingPage() {
  return (
    <Suspense fallback={null}>
      <BankingPageInner />
    </Suspense>
  );
}

function BankingPageInner() {
  const t = useTranslations("Pages.banking");
  const { user, expenses, addExpense, addIncome, accounts, toast } = useAppData();
  const params = useSearchParams();
  const native = typeof window !== "undefined" && Capacitor.isNativePlatform();

  const [feed, setFeed] = useState<Feed | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState("gb");
  const [institutions, setInstitutions] = useState<Institution[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const browserListener = useRef<{ remove: () => void } | null>(null);

  const loadFeed = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authedFetch(user.id, "/api/banking/feed");
      const data = await res.json();
      const f: Feed = res.ok ? data : { connection: null, accounts: [], transactions: [] };
      setFeed(f);
      setDaysLeft(
        f.connection?.consent_expires_at
          ? Math.ceil((new Date(f.connection.consent_expires_at).getTime() - Date.now()) / 86_400_000)
          : null
      );
    } catch {
      setFeed({ connection: null, accounts: [], transactions: [] });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // First load + results of the bank consent redirect (?connected / ?error)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time data load on mount
    void loadFeed();
    const err = params.get("error");
    if (params.get("connected")) {
      toast(t("toastConnected"), "check-circle");
      trackEvent("bank_connected");
    }
    // Returned from the unlock checkout — resume the bank connect flow.
    if (params.get("unlocked")) {
      toast(t("toastUnlocked"), "check-circle");
      trackEvent("bank_unlock_paid");
      try {
        const raw = sessionStorage.getItem(PENDING_KEY);
        if (raw) {
          sessionStorage.removeItem(PENDING_KEY);
          void connect(JSON.parse(raw) as Institution);
        }
      } catch { /* no pending bank — user can tap it again */ }
    }
    if (err) {
      const key = `errConnect_${err}`;
      toast(t.has(key) ? t(key) : t("errConnect_generic"), "alert-triangle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On native, the consent happens in the system browser — refresh when it closes
  useEffect(() => {
    return () => { browserListener.current?.remove(); };
  }, []);

  async function loadInstitutions(code: string) {
    if (!user) return;
    setInstitutions(null);
    try {
      const res = await authedFetch(user.id, `/api/banking/institutions?country=${code}`);
      const data = await res.json();
      setInstitutions(Array.isArray(data.institutions) ? data.institutions : []);
    } catch {
      setInstitutions([]);
    }
  }

  async function connect(inst: Institution) {
    if (!user || busy) return;
    setBusy(true);
    try {
      const res = await authedFetch(user.id, "/api/banking/connect", {
        method: "POST",
        body: JSON.stringify({ institutionId: inst.id, institutionName: inst.name, country }),
      });
      const data = await res.json();
      trackEvent("bank_connect_start", { institution: inst.id, country });

      // Free-tier paywall: one-off unlock per bank — hosted Stripe checkout.
      if (res.status === 402 && data.requiresPayment) {
        trackEvent("bank_paywall", { institution: inst.id, price: data.priceLabel });
        if (!data.checkoutUrl) {
          toast(t("errCheckout"), "alert-triangle");
          return;
        }
        sessionStorage.setItem(PENDING_KEY, JSON.stringify(inst));
        toast(t("paywallLine", { bank: inst.name, price: data.priceLabel ?? "" }), "credit-card");
        if (native) {
          const { Browser } = await import("@capacitor/browser");
          browserListener.current = await Browser.addListener("browserFinished", () => {
            browserListener.current?.remove();
            browserListener.current = null;
            setLoading(true);
            void loadFeed();
          });
          await Browser.open({ url: data.checkoutUrl });
        } else {
          window.location.href = data.checkoutUrl;
        }
        return;
      }

      if (!res.ok || !data.link) {
        toast(data.error ?? t("errConnect_generic"), "alert-triangle");
        return;
      }
      if (native) {
        const { Browser } = await import("@capacitor/browser");
        browserListener.current = await Browser.addListener("browserFinished", () => {
          browserListener.current?.remove();
          browserListener.current = null;
          setLoading(true);
          void loadFeed();
        });
        await Browser.open({ url: data.link });
      } else {
        window.location.href = data.link; // full redirect — callback bounces back in
      }
    } finally {
      setBusy(false);
    }
  }

  async function syncNow() {
    if (!user || busy) return;
    setBusy(true);
    try {
      const res = await authedFetch(user.id, "/api/banking/sync", { method: "POST" });
      const data = await res.json();
      toast(t("toastSynced", { count: data.synced ?? 0 }), "refresh-cw");
      trackEvent("bank_sync", { count: data.synced ?? 0 });
      await loadFeed();
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    if (!user) return;
    await authedFetch(user.id, "/api/banking/disconnect", { method: "POST" }).catch(() => {});
    setConfirmDisconnect(false);
    setFeed({ connection: null, accounts: [], transactions: [] });
    toast(t("toastDisconnected"), "trash-2");
  }

  async function resolve(txnId: number, action: "imported" | "dismissed", expenseId?: number) {
    if (!user) return;
    trackEvent(
      action === "imported" ? (expenseId ? "bank_txn_linked" : "bank_txn_imported") : "bank_txn_dismissed"
    );
    await authedFetch(user.id, "/api/banking/resolve", {
      method: "POST",
      body: JSON.stringify({ transactionId: txnId, action, expenseId }),
    }).catch(() => {});
    setFeed((f) => f ? { ...f, transactions: f.transactions.filter((x) => x.id !== txnId) } : f);
  }

  function importTxn(txn: BankTxn) {
    const isIncome = txn.amount > 0;
    if (isIncome) {
      addIncome({
        source: txn.counterparty || t("fallbackIncome"),
        category: INCOME_CATEGORIES[0],
        date: txn.booked_at,
        amount: Math.abs(txn.amount),
        recurring: "None",
      });
    } else {
      addExpense({
        merchant: txn.counterparty || t("fallbackExpense"),
        category: "Other" as (typeof EXPENSE_CATS)[number],
        date: txn.booked_at,
        amount: Math.abs(txn.amount),
        account: accounts[0]?.name ?? "Bank",
        method: "Bank Transfer",
        tags: ["bank-feed"],
        recurring: false,
      });
    }
    void resolve(txn.id, "imported");
    toast(t("toastImported"), "check-circle");
  }

  const conn = feed?.connection ?? null;
  const active = conn?.status === "active";

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("sub")}</p>
        </div>
        {active && (
          <button className="btn btn-ghost" onClick={syncNow} disabled={busy}>
            <Icon name="refresh-cw" size={16} /> {t("syncBtn")}
          </button>
        )}
      </div>

      {active && daysLeft !== null && daysLeft <= REAUTH_DAYS_WARN && (
        <div className="glass-card card-pad" style={{ marginBottom: 20, borderLeft: "3px solid var(--amber)" }}>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink-700)" }}>
            <Icon name="alert-triangle" size={14} style={{ color: "var(--amber)", marginRight: 6 }} />
            {t("consentExpiring", { days: Math.max(0, daysLeft) })}
          </p>
        </div>
      )}

      {!loading && !active && (
        <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Icon name="landmark" size={18} style={{ color: "var(--rose-600)" }} />
            <h3 style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>{t("connectTitle")}</h3>
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 14 }}>{t("connectDesc")}</p>

          {conn?.status === "pending" && (
            <p style={{ fontSize: 13, color: "var(--amber)", marginBottom: 12 }}>{t("pendingNote")}</p>
          )}
          {conn?.status === "expired" && (
            <p style={{ fontSize: 13, color: "var(--amber)", marginBottom: 12 }}>{t("expiredNote")}</p>
          )}

          <div className="field" style={{ maxWidth: 280 }}>
            <label>{t("countryLabel")}</label>
            <select
              className="settings-select" style={{ width: "100%" }}
              value={country}
              onChange={(e) => { setCountry(e.target.value); void loadInstitutions(e.target.value); }}
            >
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          {!institutions && (
            <button className="btn btn-primary" onClick={() => loadInstitutions(country)}>
              <Icon name="search" size={15} style={{ marginRight: 6 }} />{t("findBanksBtn")}
            </button>
          )}
          {institutions && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12, maxHeight: 320, overflowY: "auto" }}>
              {institutions.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--ink-500)" }}>{t("noBanks")}</p>
              )}
              {institutions.map((inst) => (
                <button
                  key={inst.id}
                  className="btn btn-ghost"
                  style={{ justifyContent: "flex-start", textAlign: "left" }}
                  disabled={busy}
                  onClick={() => void connect(inst)}
                >
                  {inst.logo && (
                    // eslint-disable-next-line @next/next/no-img-element -- bank logos from provider
                    <img src={inst.logo} alt="" width={22} height={22} style={{ borderRadius: 4, marginRight: 8 }} />
                  )}
                  {inst.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {active && (
        <>
          <div className="glass-card card-pad" style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{conn.institution_name ?? t("yourBank")}</div>
              <div style={{ fontSize: 12, color: "var(--ink-500)" }}>
                {t("consentUntil", { date: conn.consent_expires_at ? ukDate(conn.consent_expires_at.slice(0, 10)) : "—" })}
                {" · "}{feed?.accounts.length ?? 0} {t("accounts")}
              </div>
            </div>
            {confirmDisconnect ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12.5, color: "var(--ink-500)" }}>{t("disconnectSure")}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDisconnect(false)}>{t("cancel")}</button>
                <button className="btn btn-primary btn-sm" onClick={disconnect}>{t("disconnectConfirm")}</button>
              </div>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDisconnect(true)}>
                <Icon name="x" size={14} style={{ marginRight: 4 }} />{t("disconnectBtn")}
              </button>
            )}
          </div>

          <div className="glass-card card-pad">
            <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>{t("feedTitle")}</h3>
            {!feed?.transactions.length && (
              <p style={{ fontSize: 13.5, color: "var(--ink-500)", textAlign: "center", padding: "20px 0" }}>
                {t("feedEmpty")}
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {feed?.transactions.map((txn) => {
                const match = suggestMatch(txn, expenses);
                const isIncome = txn.amount > 0;
                return (
                  <div key={txn.id} className="glass-card" style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {txn.counterparty}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{ukDate(txn.booked_at)}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className={isIncome ? "amt-pos" : "amt-neg"} style={{ fontWeight: 700 }}>
                          {isIncome ? "+" : "-"}{fmt(Math.abs(txn.amount))}
                        </span>
                        <button className="btn btn-primary btn-sm" onClick={() => importTxn(txn)}>
                          <Icon name="plus" size={13} style={{ marginRight: 4 }} />{t("addTxn")}
                        </button>
                        <button className="btn btn-ghost btn-sm" data-tip={t("dismissTip")} onClick={() => void resolve(txn.id, "dismissed")}>
                          <Icon name="x" size={13} />
                        </button>
                      </div>
                    </div>
                    {match && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 8, paddingTop: 8, borderTop: "1px dashed var(--card-border)" }}>
                        <span style={{ fontSize: 12.5, color: "var(--ink-500)" }}>
                          <Icon name="sparkles" size={12} style={{ color: "var(--green)", marginRight: 5 }} />
                          {t("matchHint", { merchant: match.merchant })}
                        </span>
                        <button className="btn btn-ghost btn-sm" onClick={() => void resolve(txn.id, "imported", match.expenseId)}>
                          <Icon name="link" size={12} style={{ marginRight: 4 }} />{t("matchLink")}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {loading && (
        <div className="glass-card card-pad" style={{ textAlign: "center", color: "var(--ink-500)", fontSize: 14 }}>
          {t("loading")}
        </div>
      )}
    </>
  );
}
