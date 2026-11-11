"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Capacitor } from "@capacitor/core";
import { usePlaidLink, PlaidLinkOnSuccessMetadata } from "react-plaid-link";
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
interface Feed {
  connection: Connection | null;
  locked?: boolean;
  accounts: { id: number; name: string | null; iban: string | null; currency: string | null }[];
  transactions: BankTxn[];
}

/** sessionStorage keys — pending bank paywall + live link token. */
const PENDING_KEY = "drpt-banking-pending";
const TOKEN_KEY = "drpt-plaid-link-token";
const REAUTH_DAYS_WARN = 14;

export default function BankingPage() {
  return (
    <Suspense fallback={null}>
      <BankingPageInner />
    </Suspense>
  );
}

/** Auto-opens Plaid Link once the token is ready. */
function PlaidLauncher({
  token,
  receivedRedirectUri,
  onSuccess,
  onDone,
}: {
  token: string;
  receivedRedirectUri?: string;
  onSuccess: (publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => void;
  onDone: () => void;
}) {
  const { open, ready } = usePlaidLink({
    token,
    ...(receivedRedirectUri ? { receivedRedirectUri } : {}),
    onSuccess: (public_token, metadata) => { if (public_token) onSuccess(public_token, metadata); },
    onExit: () => onDone(),
  });
  useEffect(() => {
    if (ready) open();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  return null;
}

function BankingPageInner() {
  const t = useTranslations("Pages.banking");
  const { user, expenses, addExpense, addIncome, accounts, toast } = useAppData();
  const params = useSearchParams();
  const native = typeof window !== "undefined" && Capacitor.isNativePlatform();

  const [feed, setFeed] = useState<Feed | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [oauthReturn, setOauthReturn] = useState(false);
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

  // First load + result of Link consent (?connected) or unlock checkout (?unlocked)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time data load on mount
    void loadFeed();
    if (params.get("connected")) {
      toast(t("toastConnected"), "check-circle");
      trackEvent("bank_connected");
    }
    if (params.get("unlocked")) {
      toast(t("toastUnlocked"), "check-circle");
      trackEvent("bank_unlock_paid");
      void loadFeed();
    }
    // OAuth-bank redirect: reopen Link where the consent left off.
    if (params.get("oauth_state_id")) {
      const token = sessionStorage.getItem(TOKEN_KEY);
      if (token) {
        setOauthReturn(true);
        setLinkToken(token);
      }
    }
    const err = params.get("error");
    if (err) {
      const key = `errConnect_${err}`;
      toast(t.has(key) ? t(key) : t("errConnect_generic"), "alert-triangle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => { browserListener.current?.remove(); };
  }, []);

  async function connect() {
    if (!user || busy) return;
    setBusy(true);
    try {
      const res = await authedFetch(user.id, "/api/banking/connect", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.linkToken) {
        toast(data.error ?? t("errConnect_generic"), "alert-triangle");
        return;
      }
      trackEvent("bank_connect_start");
      sessionStorage.setItem(TOKEN_KEY, data.linkToken);
      if (native && data.hostedLinkUrl) {
        const { Browser } = await import("@capacitor/browser");
        browserListener.current = await Browser.addListener("browserFinished", () => {
          browserListener.current?.remove();
          browserListener.current = null;
          void finishHosted(data.linkToken);
        });
        await Browser.open({ url: data.hostedLinkUrl });
      } else {
        setLinkToken(data.linkToken); // PlaidLauncher opens Link
      }
    } catch {
      toast(t("errConnect_generic"), "alert-triangle");
    } finally {
      setBusy(false);
    }
  }

  /** Native: pull the public token out of the finished hosted session. */
  async function finishHosted(token: string) {
    if (!user) return;
    setLoading(true);
    try {
      const res = await authedFetch(user.id, `/api/banking/link-session?linkToken=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (data.publicToken) await exchange(data.publicToken);
      else await loadFeed(); // user closed early — nothing to finalise
    } catch {
      await loadFeed();
    }
  }

  /** public_token → server exchange → feed or $1 paywall. */
  async function exchange(publicToken: string) {
    if (!user) return;
    sessionStorage.removeItem(TOKEN_KEY);
    setLoading(true);
    try {
      const res = await authedFetch(user.id, "/api/banking/exchange", {
        method: "POST",
        body: JSON.stringify({ publicToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.connected) {
        toast(data.error ?? t("errConnect_generic"), "alert-triangle");
        await loadFeed();
        return;
      }
      trackEvent("bank_connected", { institution: data.institutionId });
      if (data.needsUnlock) {
        // Consent is stored — paying flips the feed on; no re-link needed.
        trackEvent("bank_paywall", { institution: data.institutionId, price: data.priceLabel });
        toast(t("paywallLine", { bank: data.institutionName, price: data.priceLabel ?? "" }), "credit-card");
        if (data.checkoutUrl) {
          sessionStorage.setItem(PENDING_KEY, JSON.stringify({ institutionId: data.institutionId }));
          if (native) {
            const { Browser } = await import("@capacitor/browser");
            browserListener.current = await Browser.addListener("browserFinished", () => {
              browserListener.current?.remove();
              browserListener.current = null;
              void loadFeed();
            });
            await Browser.open({ url: data.checkoutUrl });
          } else {
            window.location.href = data.checkoutUrl;
            return;
          }
        }
        await loadFeed();
        return;
      }
      toast(t("toastConnected"), "check-circle");
      await loadFeed();
    } catch {
      toast(t("errConnect_generic"), "alert-triangle");
      await loadFeed();
    }
  }

  /** Locked connection → start the $1 checkout for the connected bank. */
  async function unlock() {
    if (!user || busy) return;
    setBusy(true);
    try {
      const res = await authedFetch(user.id, "/api/banking/unlock", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (data.unlocked) {
        await loadFeed();
        return;
      }
      if (!data.checkoutUrl) {
        toast(data.error ?? t("errCheckout"), "alert-triangle");
        return;
      }
      if (native) {
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url: data.checkoutUrl });
      } else {
        window.location.href = data.checkoutUrl;
      }
    } catch {
      toast(t("errCheckout"), "alert-triangle");
    } finally {
      setBusy(false);
    }
  }

  async function syncNow() {
    if (!user || busy) return;
    setBusy(true);
    try {
      const res = await authedFetch(user.id, "/api/banking/sync", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      toast(t("toastSynced", { count: data.synced ?? 0 }), "refresh-cw");
      trackEvent("bank_sync", { count: data.synced ?? 0 });
      await loadFeed();
    } catch {
      toast(t("errConnect_generic"), "alert-triangle");
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
  const locked = feed?.locked === true;

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("sub")}</p>
        </div>
        {active && !locked && (
          <button className="btn btn-ghost" onClick={syncNow} disabled={busy}>
            <Icon name="refresh-cw" size={16} /> {t("syncBtn")}
          </button>
        )}
      </div>

      {linkToken && (
        <PlaidLauncher
          token={linkToken}
          receivedRedirectUri={oauthReturn ? window.location.href : undefined}
          onSuccess={(publicToken) => void exchange(publicToken)}
          onDone={() => { setLinkToken(null); setOauthReturn(false); }}
        />
      )}

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
          <button className="btn btn-primary" onClick={connect} disabled={busy}>
            <Icon name="link" size={15} style={{ marginRight: 6 }} />{t("findBanksBtn")}
          </button>
        </div>
      )}

      {active && (
        <div className="glass-card card-pad" style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{conn.institution_name ?? t("yourBank")}</div>
            <div style={{ fontSize: 12, color: "var(--ink-500)" }}>
              {feed?.accounts.length ?? 0} {t("accounts")}
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
      )}

      {active && locked && (
        <div className="glass-card card-pad" style={{ marginBottom: 20, borderLeft: "3px solid var(--amber)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Icon name="lock" size={16} style={{ color: "var(--amber)" }} />
            <h3 style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>{conn.institution_name ?? t("yourBank")}</h3>
          </div>
          <p style={{ fontSize: 13.5, color: "var(--ink-500)", marginBottom: 14 }}>{t("lockedNote")}</p>
          <button className="btn btn-primary" onClick={unlock} disabled={busy}>
            <Icon name="credit-card" size={15} style={{ marginRight: 6 }} />{t("unlockBtn")}
          </button>
        </div>
      )}

      {active && !locked && (
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
      )}

      {loading && (
        <div className="glass-card card-pad" style={{ textAlign: "center", color: "var(--ink-500)", fontSize: 14 }}>
          {t("loading")}
        </div>
      )}
    </>
  );
}
