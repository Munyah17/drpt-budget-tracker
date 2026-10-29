"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { supabase } from "@/lib/supabase";
import CountUp from "@/components/CountUp";
import Icon from "@/components/Icon";
import BarChart from "@/components/charts/BarChart";

interface AnalyticsData {
  totals: {
    views14d: number;
    visitors14d: number;
    activeUsers14d: number;
    signups14d: number;
    payments14d: number;
    demos14d: number;
    logins14d: number;
    registeredUsers: number;
    paidUsers: number;
  };
  days: { date: string; label: string; views: number; signups: number; payments: number; demos: number }[];
  topPages: { path: string; views: number }[];
  recent: { event: string; path: string | null; user_email: string | null; created_at: string }[];
}

const EVENT_COLOR: Record<string, string> = {
  payment: "var(--green)",
  signup: "var(--rose-600)",
  demo_start: "var(--amber)",
  signup_failed: "var(--red)",
  payment_failed: "var(--red)",
};

export default function AdminAnalyticsPage() {
  const t = useTranslations("Pages.adm_analytics");
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
  const conversion = totals && totals.visitors14d > 0 ? Math.round((totals.signups14d / totals.visitors14d) * 100) : 0;
  const payRate = totals && totals.signups14d > 0 ? Math.round((totals.payments14d / totals.signups14d) * 100) : 0;
  const visitorToPaid = totals && totals.visitors14d > 0 ? Math.round((totals.payments14d / totals.visitors14d) * 100) : 0;

  const eventLabels: Record<string, string> = {
    landing_view: t("eventLandingVisit"),
    page_view: t("eventPageView"),
    demo_start: t("eventDemoStart"),
    signup: t("eventSignedUp"),
    signup_failed: t("eventSignupFailed"),
    login: t("eventLoggedIn"),
    payment: t("eventPaid"),
    payment_failed: t("eventPaymentFailed"),
  };

  function timeAgo(iso: string): string {
    // eslint-disable-next-line react-hooks/purity -- relative-time labels need the current time at render
    const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
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
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
          <Icon name="repeat" size={14} /> {loading ? t("loading") : t("refresh")}
        </button>
      </div>

      {error && (
        <div className="glass-card card-pad" style={{ marginBottom: 20, borderLeft: "3px solid var(--red)" }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{t("loadError", { error })}</div>
          <div style={{ fontSize: 13, color: "var(--ink-500)" }}>
            {t.rich("errorHint", { code: (chunks) => <code>{chunks}</code> })}
          </div>
        </div>
      )}

      {/* Funnel KPIs */}
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">{t("statUniqueVisitors")}</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--rose-600)" }}>
              <Icon name="users" size={17} />
            </div>
          </div>
          <div className="stat-value"><CountUp end={totals?.visitors14d ?? 0} decimals={0} /></div>
          <span className="stat-delta" style={{ color: "var(--ink-500)" }}>{t("pageViewsCount", { count: totals?.views14d ?? 0 })}</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">{t("statSignups")}</span>
            <div className="stat-icon" style={{ background: "rgba(26,156,109,.12)", color: "var(--green)" }}>
              <Icon name="user-plus" size={17} />
            </div>
          </div>
          <div className="stat-value"><CountUp end={totals?.signups14d ?? 0} decimals={0} /></div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>{t("pctOfVisitors", { pct: conversion })}</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">{t("statPayments")}</span>
            <div className="stat-icon" style={{ background: "rgba(26,156,109,.12)", color: "var(--green)" }}>
              <Icon name="dollar-sign" size={17} />
            </div>
          </div>
          <div className="stat-value"><CountUp end={totals?.payments14d ?? 0} decimals={0} /></div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>{t("pctOfSignups", { pct: payRate })}</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">{t("statDemoStarts")}</span>
            <div className="stat-icon" style={{ background: "rgba(217,140,14,.12)", color: "var(--amber)" }}>
              <Icon name="sparkles" size={17} />
            </div>
          </div>
          <div className="stat-value"><CountUp end={totals?.demos14d ?? 0} decimals={0} /></div>
          <span className="stat-delta" style={{ color: "var(--ink-500)" }}>{t("loginsCount", { count: totals?.logins14d ?? 0 })}</span>
        </div>
      </div>

      {/* Account totals */}
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">{t("statRegisteredUsers")}</span>
          <div className="stat-value"><CountUp end={totals?.registeredUsers ?? 0} decimals={0} /></div>
        </div>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">{t("statPaidUsers")}</span>
          <div className="stat-value"><CountUp end={totals?.paidUsers ?? 0} decimals={0} /></div>
        </div>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">{t("statActiveUsers")}</span>
          <div className="stat-value"><CountUp end={totals?.activeUsers14d ?? 0} decimals={0} /></div>
        </div>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">{t("statVisitorToPaid")}</span>
          <div className="stat-value"><CountUp end={visitorToPaid} decimals={0} suffix="%" /></div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", marginBottom: 20 }}>
        {/* Daily activity */}
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("dailyActivity")}</h3>
            <span className="chip">{t("chip14Days")}</span>
          </div>
          <BarChart
            labels={(data?.days ?? []).map((d) => d.label)}
            series={[
              { name: t("seriesPageViews"), color: "#e91e63", data: (data?.days ?? []).map((d) => d.views) },
              { name: t("seriesSignups"), color: "#1a9c6d", data: (data?.days ?? []).map((d) => d.signups) },
            ]}
          />
        </div>

        {/* Conversion funnel */}
        <div className="glass-card card-pad">
          <div className="card-head"><h3>{t("conversionFunnel")}</h3></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: t("funnelUniqueVisitors"), value: totals?.visitors14d ?? 0, pct: 100, color: "var(--rose-600)" },
              { label: t("funnelSignedUp"), value: totals?.signups14d ?? 0, pct: conversion, color: "#f0568d" },
              { label: t("funnelPaid"), value: totals?.payments14d ?? 0, pct: visitorToPaid, color: "var(--green)" },
            ].map((step) => (
              <div key={step.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{step.label}</span>
                  <span style={{ color: "var(--ink-500)" }}>{step.value} · {step.pct}%</span>
                </div>
                <div style={{ height: 10, borderRadius: 6, background: "var(--pink-100)", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${step.value > 0 ? Math.max(4, step.pct) : 0}%`,
                      height: "100%",
                      background: step.color,
                      borderRadius: 6,
                      transition: "width .8s cubic-bezier(.2,.8,.2,1)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Top pages */}
        <div className="glass-card card-pad">
          <div className="card-head"><h3>{t("topPages")}</h3><span className="chip">30d</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(data?.topPages ?? []).length === 0 && (
              <div style={{ color: "var(--ink-500)", fontSize: 13.5 }}>{t("noPageViews")}</div>
            )}
            {(data?.topPages ?? []).map((p) => (
              <div
                key={p.path}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid var(--card-border)",
                  fontSize: 13.5,
                }}
              >
                <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{p.path}</span>
                <span style={{ color: "var(--ink-500)" }}>{t("viewsCount", { count: p.views })}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live event feed */}
        <div className="glass-card card-pad">
          <div className="card-head"><h3>{t("recentActivity")}</h3><span className="chip">{t("live")}</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 420, overflowY: "auto" }}>
            {(data?.recent ?? []).length === 0 && (
              <div style={{ color: "var(--ink-500)", fontSize: 13.5 }}>
                {t("noEvents")}
              </div>
            )}
            {(data?.recent ?? []).map((e, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "8px 0",
                  borderBottom: "1px solid var(--card-border)",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: EVENT_COLOR[e.event] ?? "var(--ink-900)" }}>
                    {eventLabels[e.event] ?? e.event}
                    {e.path && e.event === "page_view" && (
                      <span style={{ fontWeight: 500, color: "var(--ink-500)", fontFamily: "monospace" }}> {e.path}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {e.user_email ?? t("anonymousVisitor")}
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "var(--ink-500)", flexShrink: 0 }}>{timeAgo(e.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

