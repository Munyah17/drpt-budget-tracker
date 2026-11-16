"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { adminHeaders } from "@/lib/adminClient";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import BarChart from "@/components/charts/BarChart";
import CountUp from "@/components/CountUp";

interface PaymentRow {
  id: number;
  user_id: string | null;
  user_email: string | null;
  provider: string;
  method: string | null;
  amount: number | null;
  currency: string;
  reference: string | null;
  status: string;
  paid_at: string;
  created_at: string;
}

interface DayStat {
  date: string;
  label: string;
  total: number;
  paynow: number;
  stripe: number;
  other: number;
}

interface PaymentStats {
  totalRevenue: number;
  paidCount: number;
  pendingCount: number;
  pendingTotal: number;
  byProvider: Record<string, { count: number; total: number }>;
  byCurrency: Record<string, number>;
  days: DayStat[];
}

const PROVIDER_COLORS: Record<string, string> = {
  paynow: "#1a9c6d",
  stripe: "#635bff",
  ecocash: "#d98c0e",
  bank: "#1E40AF",
  admin: "#e91e63",
  manual: "#64748b",
};

function money(amount: number | null, currency: string) {
  if (amount == null) return "—";
  return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
}

export default function AdminPaymentsPage() {
  const t = useTranslations("Pages.adm_finance_payments");
  const { user, toast } = useAppData();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [viewing, setViewing] = useState<PaymentRow | null>(null);
  const [showRecord, setShowRecord] = useState(false);

  const [fEmail, setFEmail] = useState("");
  const [fAmount, setFAmount] = useState("");
  const [fCurrency, setFCurrency] = useState("usd");
  const [fProvider, setFProvider] = useState("manual");
  const [fMethod, setFMethod] = useState("");
  const [fReference, setFReference] = useState("");
  const [fMarkPaid, setFMarkPaid] = useState(false);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/payments", { headers: await adminHeaders(user?.email) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setPayments(data?.payments ?? []);
      setStats(data?.stats ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [user?.email, t]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const providers = useMemo(
    () => [...new Set(payments.map((p) => p.provider))].sort(),
    [payments]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return payments.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (providerFilter && p.provider !== providerFilter) return false;
      if (!q) return true;
      return [p.reference, p.user_email, p.provider, p.method]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [payments, search, statusFilter, providerFilter]);

  const revenueLabel = useMemo(() => {
    if (!stats) return "—";
    const entries = Object.entries(stats.byCurrency);
    if (!entries.length) return "0.00";
    return entries.map(([cur, total]) => `${cur.toUpperCase()} ${total.toFixed(2)}`).join(" · ");
  }, [stats]);

  const paynowLabel = useMemo(() => {
    if (!stats?.byProvider?.paynow) return "—";
    const entries = Object.entries(stats.byCurrency);
    if (!entries.length) return stats.byProvider.paynow.total.toFixed(2);
    return entries.map(([cur]) => `${cur.toUpperCase()} ${stats.byProvider.paynow.total.toFixed(2)}`).join(" · ");
  }, [stats]);

  async function submitPayment() {
    const amount = Number(fAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast(t("amountRequired"), "x");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await adminHeaders(user?.email)) },
        body: JSON.stringify({
          userEmail: fEmail,
          amount,
          currency: fCurrency,
          provider: fProvider,
          method: fMethod || undefined,
          reference: fReference || undefined,
          markPaid: fMarkPaid,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      toast(t("paymentRecorded"), "check-circle");
      setShowRecord(false);
      setFEmail(""); setFAmount(""); setFMethod(""); setFReference(""); setFMarkPaid(false);
      await refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("recordFailed"), "x");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--card-border)",
    background: "transparent",
    color: "inherit",
    fontSize: 14,
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowRecord(true)}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          {t("recordPayment")}
        </button>
      </div>

      {error && (
        <div className="glass-card card-pad" style={{ marginBottom: 20, color: "var(--ink-500)", fontSize: 13 }}>
          {t("loadError", { error })}
        </div>
      )}

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">{t("kpiRevenue")}</span>
            <div className="stat-icon" style={{ background: "rgba(26,156,109,.12)", color: "var(--green)" }}>
              <Icon name="dollar-sign" size={17} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: 20 }}>{revenueLabel}</div>
          <span className="stat-delta" style={{ color: "var(--ink-500)" }}>{t("kpiRevenueHint")}</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">{t("kpiPaid")}</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--rose-600)" }}>
              <Icon name="check-circle" size={17} />
            </div>
          </div>
          <div className="stat-value"><CountUp end={stats?.paidCount ?? 0} decimals={0} /></div>
          <span className="stat-delta" style={{ color: "var(--ink-500)" }}>{t("kpiPaidHint")}</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">{t("kpiPaynow")}</span>
            <div className="stat-icon" style={{ background: "rgba(26,156,109,.12)", color: "var(--green)" }}>
              <Icon name="smartphone" size={17} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: 20 }}>{paynowLabel}</div>
          <span className="stat-delta" style={{ color: "var(--ink-500)" }}>
            {t("kpiPaynowHint", { count: stats?.byProvider?.paynow?.count ?? 0 })}
          </span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">{t("kpiPending")}</span>
            <div className="stat-icon" style={{ background: "rgba(217,140,14,.12)", color: "var(--amber)" }}>
              <Icon name="clock" size={17} />
            </div>
          </div>
          <div className="stat-value"><CountUp end={stats?.pendingCount ?? 0} decimals={0} /></div>
          <span className="stat-delta" style={{ color: "var(--ink-500)" }}>{t("kpiPendingHint")}</span>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.6fr 1fr", marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("revenueChart")}</h3>
            <span className="chip">14d</span>
          </div>
          {loading ? (
            <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "48px 0", textAlign: "center" }}>{t("loading")}</p>
          ) : stats && stats.days.some((d) => d.total > 0) ? (
            <BarChart
              labels={stats.days.map((d) => d.label)}
              series={[
                { name: "Paynow", color: PROVIDER_COLORS.paynow, data: stats.days.map((d) => d.paynow) },
                { name: "Stripe", color: PROVIDER_COLORS.stripe, data: stats.days.map((d) => d.stripe) },
                { name: t("seriesOther"), color: "#64748b", data: stats.days.map((d) => d.other) },
              ]}
            />
          ) : (
            <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "48px 0", textAlign: "center" }}>{t("noPayments")}</p>
          )}
        </div>

        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("byProvider")}</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {stats && Object.keys(stats.byProvider).length > 0 ? (
              Object.entries(stats.byProvider)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([provider, agg]) => (
                  <div key={provider} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: PROVIDER_COLORS[provider] ?? "#64748b" }} />
                      <span style={{ fontWeight: 600, fontSize: 13.5, textTransform: "capitalize" }}>{provider}</span>
                      <span style={{ fontSize: 12, color: "var(--ink-500)" }}>{t("paymentsCount", { count: agg.count })}</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{agg.total.toFixed(2)}</span>
                  </div>
                ))
            ) : (
              <p style={{ color: "var(--ink-500)", fontSize: 13 }}>{t("noProviderData")}</p>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <div className="card-head" style={{ flexWrap: "wrap", gap: 12 }}>
          <h3>{t("ledger")}</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              style={{ ...inputStyle, width: 220 }}
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
              <option value="">{t("allStatuses")}</option>
              <option value="paid">{t("statusPaid")}</option>
              <option value="pending">{t("statusPending")}</option>
            </select>
            <select value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
              <option value="">{t("allProviders")}</option>
              {providers.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thReference")}</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thCustomer")}</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thProvider")}</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thAmount")}</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thStatus")}</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thDate")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                    {loading ? t("loading") : t("emptyState")}
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  style={{ borderBottom: "1px solid var(--card-border)", cursor: "pointer" }}
                  onClick={() => setViewing(p)}
                >
                  <td style={{ padding: "12px 8px", fontSize: 13, fontFamily: "monospace" }}>{p.reference || `#${p.id}`}</td>
                  <td style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{p.user_email || "—"}</td>
                  <td style={{ padding: "12px 8px", fontSize: 13, textTransform: "capitalize" }}>
                    {p.provider}{p.method ? ` · ${p.method}` : ""}
                  </td>
                  <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>{money(p.amount, p.currency)}</td>
                  <td style={{ padding: "12px 8px" }}>
                    <span className={`badge ${p.status === "paid" ? "badge-green" : "badge-amber"}`}>
                      {p.status === "paid" ? t("statusPaid") : t("statusPending")}
                    </span>
                  </td>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>{new Date(p.paid_at).toLocaleString("en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewing && (
        <Modal title={t("paymentDetails")} onClose={() => setViewing(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
            {[
              [t("thReference"), viewing.reference || `#${viewing.id}`],
              [t("thCustomer"), viewing.user_email || "—"],
              [t("thProvider"), `${viewing.provider}${viewing.method ? ` (${viewing.method})` : ""}`],
              [t("thAmount"), money(viewing.amount, viewing.currency)],
              [t("thStatus"), viewing.status],
              [t("thDate"), new Date(viewing.paid_at).toLocaleString("en-GB")],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <span style={{ color: "var(--ink-500)" }}>{k}</span>
                <span style={{ fontWeight: 600, textAlign: "right" }}>{v}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {showRecord && (
        <Modal title={t("recordPayment")} onClose={() => setShowRecord(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              {t("fCustomerEmail")}
              <input style={{ ...inputStyle, marginTop: 6 }} value={fEmail} onChange={(e) => setFEmail(e.target.value)} placeholder="client@example.com" />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                {t("fAmount")}
                <input style={{ ...inputStyle, marginTop: 6 }} type="number" min="0" step="0.01" value={fAmount} onChange={(e) => setFAmount(e.target.value)} />
              </label>
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                {t("fCurrency")}
                <select style={{ ...inputStyle, marginTop: 6 }} value={fCurrency} onChange={(e) => setFCurrency(e.target.value)}>
                  <option value="usd">USD</option>
                  <option value="zwg">ZWG</option>
                  <option value="zar">ZAR</option>
                  <option value="eur">EUR</option>
                </select>
              </label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                {t("fProvider")}
                <select style={{ ...inputStyle, marginTop: 6 }} value={fProvider} onChange={(e) => setFProvider(e.target.value)}>
                  <option value="manual">{t("provManual")}</option>
                  <option value="bank">{t("provBank")}</option>
                  <option value="admin">{t("provAdmin")}</option>
                  <option value="paynow">Paynow</option>
                  <option value="ecocash">EcoCash</option>
                  <option value="stripe">Stripe</option>
                </select>
              </label>
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                {t("fMethod")}
                <input style={{ ...inputStyle, marginTop: 6 }} value={fMethod} onChange={(e) => setFMethod(e.target.value)} placeholder={t("fMethodPh")} />
              </label>
            </div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              {t("fReference")}
              <input style={{ ...inputStyle, marginTop: 6 }} value={fReference} onChange={(e) => setFReference(e.target.value)} placeholder={t("fReferencePh")} />
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
              <input type="checkbox" checked={fMarkPaid} onChange={(e) => setFMarkPaid(e.target.checked)} />
              {t("fMarkPaid")}
            </label>
            <button className="btn btn-primary" onClick={submitPayment} disabled={saving}>
              {saving ? t("saving") : t("savePayment")}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
