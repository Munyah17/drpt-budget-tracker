"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { adminHeaders } from "@/lib/adminClient";
import CountUp from "@/components/CountUp";
import Icon from "@/components/Icon";
import BarChart from "@/components/charts/BarChart";

interface AnalyticsTotals {
  views14d: number;
  visitors14d: number;
  activeUsers14d: number;
  signups14d: number;
  payments14d: number;
  demos14d: number;
  logins14d: number;
  registeredUsers: number;
  paidUsers: number;
}

interface AnalyticsDay {
  date: string;
  label: string;
  views: number;
  signups: number;
  payments: number;
  demos: number;
}

interface AnalyticsRecent {
  event: string;
  path: string | null;
  visitor_id: string | null;
  user_id: string | null;
  user_email: string | null;
  created_at: string;
}

interface AnalyticsData {
  totals: AnalyticsTotals;
  days: AnalyticsDay[];
  topPages: { path: string; views: number }[];
  recent: AnalyticsRecent[];
}

interface ProfileRow {
  id: string;
  name: string;
  email: string;
  role: string;
  is_paid: boolean;
  paid_until: string | null;
  created_at: string;
}

const DAY = 24 * 60 * 60 * 1000;

export default function CommandCentrePage() {
  const t = useTranslations("SuperAdmin");
  const { user } = useAppData();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await adminHeaders(user?.email);
      const [analyticsRes, usersRes] = await Promise.all([
        fetch("/api/admin/analytics", { headers, cache: "no-store" }),
        fetch("/api/admin/users", { headers, cache: "no-store" }),
      ]);
      const analyticsJson = await analyticsRes.json();
      if (!analyticsRes.ok) throw new Error(analyticsJson.error || `HTTP ${analyticsRes.status}`);
      setData(analyticsJson);
      const usersJson = await usersRes.json().catch(() => null);
      if (usersRes.ok && Array.isArray(usersJson?.users)) setProfiles(usersJson.users);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failedToLoad"));
    } finally {
      setLoading(false);
    }
  }, [user?.email, t]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const totals = data?.totals;
  const signupRate = totals && totals.visitors14d > 0 ? Math.round((totals.signups14d / totals.visitors14d) * 100) : 0;
  const paymentRate = totals && totals.signups14d > 0 ? Math.round((totals.payments14d / totals.signups14d) * 100) : 0;

  // Subscriptions expiring within 30 days (paid users only)
  const now = Date.now();
  const expiring = profiles
    .filter((p) => p.is_paid && p.paid_until)
    .map((p) => ({ ...p, daysLeft: Math.ceil((new Date(p.paid_until!).getTime() - now) / DAY) }))
    .filter((p) => p.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 8);

  const eventLabels: Record<string, string> = {
    page_view: t("eventPageView"),
    landing_view: t("eventLandingVisit"),
    signup: t("eventSignup"),
    payment: t("eventPayment"),
    demo_start: t("eventDemoStart"),
    login: t("eventLogin"),
  };

  function timeAgo(iso: string) {
    // eslint-disable-next-line react-hooks/purity -- relative-time labels need the current time at render
    const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
    if (mins < 1) return t("justNow");
    if (mins < 60) return t("minutesAgo", { mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t("hoursAgo", { hrs });
    return t("daysAgo", { days: Math.floor(hrs / 24) });
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => void load()} disabled={loading}>
          <Icon name="refresh-cw" size={14} /> {t("refresh")}
        </button>
      </div>

      {error && (
        <div className="glass-card card-pad" style={{ marginBottom: 20, borderColor: "var(--red)" }}>
          <span style={{ color: "var(--red)", fontWeight: 600 }}>{error}</span>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">{t("statRegistered")}</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--rose-600)" }}>
              <Icon name="users" size={17} />
            </div>
          </div>
          <div className="stat-value"><CountUp end={totals?.registeredUsers ?? 0} decimals={0} /></div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>{t("statRegisteredSub")}</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">{t("statPaid")}</span>
            <div className="stat-icon" style={{ background: "rgba(26,156,109,.12)", color: "var(--green)" }}>
              <Icon name="credit-card" size={17} />
            </div>
          </div>
          <div className="stat-value"><CountUp end={totals?.paidUsers ?? 0} decimals={0} /></div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>{t("statPaidSub")}</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">{t("statSignups")}</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--rose-600)" }}>
              <Icon name="user-plus" size={17} />
            </div>
          </div>
          <div className="stat-value"><CountUp end={totals?.signups14d ?? 0} decimals={0} /></div>
          <span className="stat-delta" style={{ color: "var(--ink-500)" }}>{t("statSignupsSub", { rate: signupRate })}</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">{t("statPayments")}</span>
            <div className="stat-icon" style={{ background: "rgba(26,156,109,.12)", color: "var(--green)" }}>
              <Icon name="banknote" size={17} />
            </div>
          </div>
          <div className="stat-value"><CountUp end={totals?.payments14d ?? 0} decimals={0} /></div>
          <span className="stat-delta" style={{ color: "var(--ink-500)" }}>{t("statPaymentsSub", { rate: paymentRate })}</span>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.6fr 1fr", marginBottom: 20 }}>
        {/* 14-day activity chart */}
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("chartTitle")}</h3>
            <span className="chip">{t("last14d")}</span>
          </div>
          {data && data.days.length > 0 ? (
            <BarChart
              labels={data.days.map((d) => d.label)}
              series={[
                { name: t("seriesSignups"), color: "#c81057", data: data.days.map((d) => d.signups) },
                { name: t("seriesPayments"), color: "#1a9c6d", data: data.days.map((d) => d.payments) },
                { name: t("seriesDemos"), color: "#d97706", data: data.days.map((d) => d.demos) },
              ]}
            />
          ) : (
            <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "40px 0", textAlign: "center" }}>{t("chartEmpty")}</p>
          )}
        </div>

        {/* Expiring subscriptions */}
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("expiringTitle")}</h3>
            <span className="chip">{t("next30d")}</span>
          </div>
          {expiring.length === 0 && (
            <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "16px 0" }}>{t("expiringEmpty")}</p>
          )}
          {expiring.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--card-border)" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-500)" }}>{p.email}</div>
              </div>
              <span className={"badge " + (p.daysLeft <= 7 ? "badge-red" : "badge-amber")}>
                {p.daysLeft <= 0 ? t("expired") : t("daysLeft", { count: p.daysLeft })}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-2">
        {/* Top pages */}
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("topPagesTitle")}</h3>
          </div>
          {(data?.topPages ?? []).length === 0 && (
            <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "16px 0" }}>{t("topPagesEmpty")}</p>
          )}
          {(data?.topPages ?? []).slice(0, 8).map((p, i) => (
            <div key={p.path} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--card-border)" }}>
              <span style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <span style={{ color: "var(--ink-500)", marginRight: 8 }}>{i + 1}.</span>
                {p.path}
              </span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{p.views}</span>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("activityTitle")}</h3>
          </div>
          {(data?.recent ?? []).length === 0 && (
            <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "16px 0" }}>{t("activityEmpty")}</p>
          )}
          {(data?.recent ?? []).slice(0, 10).map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--card-border)" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{eventLabels[r.event] ?? r.event}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.user_email ?? r.path ?? "—"}
                </div>
              </div>
              <span style={{ fontSize: 11.5, color: "var(--ink-500)", whiteSpace: "nowrap" }}>{timeAgo(r.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
