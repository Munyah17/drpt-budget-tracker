"use client";

import { useCallback, useEffect, useState } from "react";
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

const EVENT_LABELS: Record<string, string> = {
  page_view: "Page view",
  landing_view: "Landing visit",
  signup: "User registered",
  payment: "Payment confirmed",
  demo_start: "Demo started",
  login: "User logged in",
};

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminDashboardPage() {
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
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    load();
  }, [load]);

  const t = data?.totals;
  const signupsPct = t && t.visitors14d > 0 ? Math.round((t.signups14d / t.visitors14d) * 100) : 0;
  const paymentsPct = t && t.signups14d > 0 ? Math.round((t.payments14d / t.signups14d) * 100) : 0;

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Operations Dashboard</h2>
          <p className="section-sub">Platform-wide metrics and system health</p>
        </div>
        <div className="badge badge-green" style={{ fontSize: 13, fontWeight: 600 }}>
          Admin: {user?.name}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Registered Users</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--rose-600)" }}>
              <Icon name="users" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={t?.registeredUsers ?? 0} decimals={0} />
          </div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>—</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Active Users (14d)</span>
            <div className="stat-icon" style={{ background: "rgba(26,156,109,.12)", color: "var(--green)" }}>
              <Icon name="user-circle" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={t?.activeUsers14d ?? 0} decimals={0} />
          </div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>—</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Page Views (14d)</span>
            <div className="stat-icon" style={{ background: "rgba(26,156,109,.12)", color: "var(--green)" }}>
              <Icon name="eye" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={t?.views14d ?? 0} decimals={0} />
          </div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>—</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Paid Users</span>
            <div className="stat-icon" style={{ background: "rgba(224,38,75,.12)", color: "var(--red)" }}>
              <Icon name="credit-card" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={t?.paidUsers ?? 0} decimals={0} />
          </div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>—</span>
        </div>
      </div>

      {/* Second KPI Row */}
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Signups (14d)</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--rose-600)" }}>
              <Icon name="user-plus" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={t?.signups14d ?? 0} decimals={0} />
          </div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>—</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Payments (14d)</span>
            <div className="stat-icon" style={{ background: "rgba(26,156,109,.12)", color: "var(--green)" }}>
              <Icon name="shield" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={t?.payments14d ?? 0} decimals={0} />
          </div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>—</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Demo Starts (14d)</span>
            <div className="stat-icon" style={{ background: "rgba(217,140,14,.12)", color: "var(--amber)" }}>
              <Icon name="zap" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={t?.demos14d ?? 0} decimals={0} />
          </div>
          <span className="stat-delta" style={{ color: "var(--amber)" }}>—</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Logins (14d)</span>
            <div className="stat-icon" style={{ background: "rgba(26,156,109,.12)", color: "var(--green)" }}>
              <Icon name="check-circle" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={t?.logins14d ?? 0} decimals={0} />
          </div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>—</span>
        </div>
      </div>

      {error && (
        <div className="glass-card card-pad" style={{ marginBottom: 20, color: "var(--ink-500)", fontSize: 13 }}>
          Analytics unavailable — {error}
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", marginBottom: 20 }}>
        {/* Activity chart — real event data */}
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Platform Activity</h3>
            <span className="chip">Last 14 days</span>
          </div>
          {loading ? (
            <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "48px 0", textAlign: "center" }}>Loading…</p>
          ) : data && data.days.some((d) => d.views + d.signups + d.payments + d.demos > 0) ? (
            <BarChart
              labels={data.days.map((d) => d.label)}
              series={[
                { name: "Page views", color: "#e91e63", data: data.days.map((d) => d.views) },
                { name: "Signups", color: "#1a9c6d", data: data.days.map((d) => d.signups) },
                { name: "Payments", color: "#d98c0e", data: data.days.map((d) => d.payments) },
                { name: "Demos", color: "#1E40AF", data: data.days.map((d) => d.demos) },
              ]}
            />
          ) : (
            <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "48px 0", textAlign: "center" }}>
              No activity recorded yet — events appear here as visitors use the site.
            </p>
          )}
        </div>

        {/* Top Pages — real */}
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Top Pages</h3>
            <span className="chip">14d</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(data?.topPages ?? []).slice(0, 8).map((p) => (
              <div key={p.path} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600, fontSize: 13.5 }}>{p.path}</span>
                <span style={{ color: "var(--ink-500)", fontWeight: 700, fontSize: 13 }}>{p.views} views</span>
              </div>
            ))}
            {!loading && (data?.topPages ?? []).length === 0 && (
              <p style={{ color: "var(--ink-500)", fontSize: 13 }}>No page views recorded yet.</p>
            )}
            {loading && <p style={{ color: "var(--ink-500)", fontSize: 13 }}>Loading…</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Conversion funnel — real */}
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Conversion Funnel</h3>
            <span className="chip">14d</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Visitors", value: t?.visitors14d ?? 0, pct: 100 },
              { label: "Signups", value: t?.signups14d ?? 0, pct: signupsPct },
              { label: "Payments", value: t?.payments14d ?? 0, pct: paymentsPct },
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
            <h3>Recent Activity</h3>
            <span className="chip">Live</span>
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
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{EVENT_LABELS[e.event] ?? e.event}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-500)" }}>
                    {e.user_email ?? (e.visitor_id ? `visitor ${e.visitor_id.slice(0, 8)}` : "anonymous")}
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "var(--ink-500)" }}>{timeAgo(e.created_at)}</span>
              </div>
            ))}
            {!loading && (data?.recent ?? []).length === 0 && (
              <p style={{ color: "var(--ink-500)", fontSize: 13 }}>No events recorded yet.</p>
            )}
            {loading && <p style={{ color: "var(--ink-500)", fontSize: 13 }}>Loading…</p>}
          </div>
        </div>
      </div>
    </>
  );
}
