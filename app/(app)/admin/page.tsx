"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { supabase } from "@/lib/supabase";
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

export default function AdminDashboardPage() {
  const t = useTranslations("Pages.adm_home");
  const { user } = useAppData();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/analytics", {
        headers: {
          // Hardcoded local admin proves itself by email; real Supabase
          // admins are verified by their JWT server-side.
          "x-admin-email": user?.email ?? "",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failedToLoad"));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const totals = data?.totals;
  const signupsPct = totals && totals.visitors14d > 0 ? Math.round((totals.signups14d / totals.visitors14d) * 100) : 0;
  const paymentsPct = totals && totals.signups14d > 0 ? Math.round((totals.payments14d / totals.signups14d) * 100) : 0;

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
        <div className="badge badge-green" style={{ fontSize: 13, fontWeight: 600 }}>
          {t("adminBadge", { name: user?.name ?? "" })}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">{t("statRegisteredUsers")}</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--rose-600)" }}>
              <Icon name="users" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={totals?.registeredUsers ?? 0} decimals={0} />
          </div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>—</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">{t("statActiveUsers")}</span>
            <div className="stat-icon" style={{ background: "rgba(26,156,109,.12)", color: "var(--green)" }}>
              <Icon name="user-circle" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={totals?.activeUsers14d ?? 0} decimals={0} />
          </div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>—</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">{t("statPageViews")}</span>
            <div className="stat-icon" style={{ background: "rgba(26,156,109,.12)", color: "var(--green)" }}>
              <Icon name="eye" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={totals?.views14d ?? 0} decimals={0} />
          </div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>—</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">{t("statPaidUsers")}</span>
            <div className="stat-icon" style={{ background: "rgba(224,38,75,.12)", color: "var(--red)" }}>
              <Icon name="credit-card" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={totals?.paidUsers ?? 0} decimals={0} />
          </div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>—</span>
        </div>
      </div>

      {/* Second KPI Row */}
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">{t("statSignups")}</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--rose-600)" }}>
              <Icon name="user-plus" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={totals?.signups14d ?? 0} decimals={0} />
          </div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>—</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">{t("statPayments")}</span>
            <div className="stat-icon" style={{ background: "rgba(26,156,109,.12)", color: "var(--green)" }}>
              <Icon name="shield" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={totals?.payments14d ?? 0} decimals={0} />
          </div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>—</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">{t("statDemoStarts")}</span>
            <div className="stat-icon" style={{ background: "rgba(217,140,14,.12)", color: "var(--amber)" }}>
              <Icon name="zap" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={totals?.demos14d ?? 0} decimals={0} />
          </div>
          <span className="stat-delta" style={{ color: "var(--amber)" }}>—</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">{t("statLogins")}</span>
            <div className="stat-icon" style={{ background: "rgba(26,156,109,.12)", color: "var(--green)" }}>
              <Icon name="check-circle" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={totals?.logins14d ?? 0} decimals={0} />
          </div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>—</span>
        </div>
      </div>

      {error && (
        <div className="glass-card card-pad" style={{ marginBottom: 20, color: "var(--ink-500)", fontSize: 13 }}>
          {t("analyticsUnavailable", { error })}
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", marginBottom: 20 }}>
        {/* Activity chart — real event data */}
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("platformActivity")}</h3>
            <span className="chip">{t("last14Days")}</span>
          </div>
          {loading ? (
            <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "48px 0", textAlign: "center" }}>{t("loading")}</p>
          ) : data && data.days.some((d) => d.views + d.signups + d.payments + d.demos > 0) ? (
            <BarChart
              labels={data.days.map((d) => d.label)}
              series={[
                { name: t("seriesPageViews"), color: "#e91e63", data: data.days.map((d) => d.views) },
                { name: t("seriesSignups"), color: "#1a9c6d", data: data.days.map((d) => d.signups) },
                { name: t("seriesPayments"), color: "#d98c0e", data: data.days.map((d) => d.payments) },
                { name: t("seriesDemos"), color: "#1E40AF", data: data.days.map((d) => d.demos) },
              ]}
            />
          ) : (
            <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "48px 0", textAlign: "center" }}>
              {t("noActivity")}
            </p>
          )}
        </div>

        {/* Top Pages — real */}
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("topPages")}</h3>
            <span className="chip">14d</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(data?.topPages ?? []).slice(0, 8).map((p) => (
              <div key={p.path} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600, fontSize: 13.5 }}>{p.path}</span>
                <span style={{ color: "var(--ink-500)", fontWeight: 700, fontSize: 13 }}>{t("viewsCount", { count: p.views })}</span>
              </div>
            ))}
            {!loading && (data?.topPages ?? []).length === 0 && (
              <p style={{ color: "var(--ink-500)", fontSize: 13 }}>{t("noPageViews")}</p>
            )}
            {loading && <p style={{ color: "var(--ink-500)", fontSize: 13 }}>{t("loading")}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Conversion funnel — real */}
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("conversionFunnel")}</h3>
            <span className="chip">14d</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: t("funnelVisitors"), value: totals?.visitors14d ?? 0, pct: 100 },
              { label: t("funnelSignups"), value: totals?.signups14d ?? 0, pct: signupsPct },
              { label: t("funnelPayments"), value: totals?.payments14d ?? 0, pct: paymentsPct },
            ].map((step) => (
              <div key={step.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{step.label}</span>
                  <span style={{ color: "var(--ink-500)" }}>{step.value} · {step.pct}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "var(--pink-100)" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.max(0, Math.min(100, step.pct))}%`,
                      borderRadius: 4,
                      background: "var(--rose-600)",
                      transition: "width .4s",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity — real events */}
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("recentActivity")}</h3>
            <span className="chip">{t("live")}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(data?.recent ?? []).slice(0, 8).map((e, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid var(--card-border)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{eventLabels[e.event] ?? e.event}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-500)" }}>
                    {e.user_email ?? (e.visitor_id ? t("visitorLabel", { id: e.visitor_id.slice(0, 8) }) : t("anonymous"))}
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "var(--ink-500)" }}>{timeAgo(e.created_at)}</span>
              </div>
            ))}
            {!loading && (data?.recent ?? []).length === 0 && (
              <p style={{ color: "var(--ink-500)", fontSize: 13 }}>{t("noEvents")}</p>
            )}
            {loading && <p style={{ color: "var(--ink-500)", fontSize: 13 }}>{t("loading")}</p>}
          </div>
        </div>
      </div>
    </>
  );
}
