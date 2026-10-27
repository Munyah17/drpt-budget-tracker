"use client";

import { useCallback, useEffect, useState } from "react";
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

const EVENT_LABEL: Record<string, string> = {
  landing_view: "Landing visit",
  page_view: "Page view",
  demo_start: "Demo started",
  signup: "Signed up",
  signup_failed: "Signup failed",
  login: "Logged in",
  payment: "Paid $1",
  payment_failed: "Payment failed",
};

const EVENT_COLOR: Record<string, string> = {
  payment: "var(--green)",
  signup: "var(--rose-600)",
  demo_start: "var(--amber)",
  signup_failed: "var(--red)",
  payment_failed: "var(--red)",
};

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminAnalyticsPage() {
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
  }, [user]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const t = data?.totals;
  const conversion = t && t.visitors14d > 0 ? Math.round((t.signups14d / t.visitors14d) * 100) : 0;
  const payRate = t && t.signups14d > 0 ? Math.round((t.payments14d / t.signups14d) * 100) : 0;
  const visitorToPaid = t && t.visitors14d > 0 ? Math.round((t.payments14d / t.visitors14d) * 100) : 0;

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">User Activity Analytics</h2>
          <p className="section-sub">Real traffic, signups and conversions — last 14 days</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
          <Icon name="repeat" size={14} /> {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="glass-card card-pad" style={{ marginBottom: 20, borderLeft: "3px solid var(--red)" }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Couldn&apos;t load analytics ({error})</div>
          <div style={{ fontSize: 13, color: "var(--ink-500)" }}>
            Make sure the <code>activity_events</code> table exists — run{" "}
            <code>scripts/activity_events.sql</code> in the Supabase SQL editor.
          </div>
        </div>
      )}

      {/* Funnel KPIs */}
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Unique Visitors</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--rose-600)" }}>
              <Icon name="users" size={17} />
            </div>
          </div>
          <div className="stat-value"><CountUp end={t?.visitors14d ?? 0} decimals={0} /></div>
          <span className="stat-delta" style={{ color: "var(--ink-500)" }}>{t?.views14d ?? 0} page views</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Signups</span>
            <div className="stat-icon" style={{ background: "rgba(26,156,109,.12)", color: "var(--green)" }}>
              <Icon name="user-plus" size={17} />
            </div>
          </div>
          <div className="stat-value"><CountUp end={t?.signups14d ?? 0} decimals={0} /></div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>{conversion}% of visitors</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Payments</span>
            <div className="stat-icon" style={{ background: "rgba(26,156,109,.12)", color: "var(--green)" }}>
              <Icon name="dollar-sign" size={17} />
            </div>
          </div>
          <div className="stat-value"><CountUp end={t?.payments14d ?? 0} decimals={0} /></div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>{payRate}% of signups</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Demo Starts</span>
            <div className="stat-icon" style={{ background: "rgba(217,140,14,.12)", color: "var(--amber)" }}>
              <Icon name="sparkles" size={17} />
            </div>
          </div>
          <div className="stat-value"><CountUp end={t?.demos14d ?? 0} decimals={0} /></div>
          <span className="stat-delta" style={{ color: "var(--ink-500)" }}>{t?.logins14d ?? 0} logins</span>
        </div>
      </div>

      {/* Account totals */}
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">Registered Users</span>
          <div className="stat-value"><CountUp end={t?.registeredUsers ?? 0} decimals={0} /></div>
        </div>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">Paid Users</span>
          <div className="stat-value"><CountUp end={t?.paidUsers ?? 0} decimals={0} /></div>
        </div>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">Active Users (14d)</span>
          <div className="stat-value"><CountUp end={t?.activeUsers14d ?? 0} decimals={0} /></div>
        </div>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">Visitor → Paid</span>
          <div className="stat-value"><CountUp end={visitorToPaid} decimals={0} suffix="%" /></div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", marginBottom: 20 }}>
        {/* Daily activity */}
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Daily Activity</h3>
            <span className="chip">14 days</span>
          </div>
          <BarChart
            labels={(data?.days ?? []).map((d) => d.label)}
            series={[
              { name: "Page views", color: "#e91e63", data: (data?.days ?? []).map((d) => d.views) },
              { name: "Signups", color: "#1a9c6d", data: (data?.days ?? []).map((d) => d.signups) },
            ]}
          />
        </div>

        {/* Conversion funnel */}
        <div className="glass-card card-pad">
          <div className="card-head"><h3>Conversion Funnel</h3></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Unique visitors", value: t?.visitors14d ?? 0, pct: 100, color: "var(--rose-600)" },
              { label: "Signed up", value: t?.signups14d ?? 0, pct: conversion, color: "#f0568d" },
              { label: "Paid $1", value: t?.payments14d ?? 0, pct: visitorToPaid, color: "var(--green)" },
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
          <div className="card-head"><h3>Top Pages</h3><span className="chip">30d</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(data?.topPages ?? []).length === 0 && (
              <div style={{ color: "var(--ink-500)", fontSize: 13.5 }}>No page views recorded yet.</div>
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
                <span style={{ color: "var(--ink-500)" }}>{p.views} views</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live event feed */}
        <div className="glass-card card-pad">
          <div className="card-head"><h3>Recent Activity</h3><span className="chip">Live</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 420, overflowY: "auto" }}>
            {(data?.recent ?? []).length === 0 && (
              <div style={{ color: "var(--ink-500)", fontSize: 13.5 }}>
                No events yet — they&apos;ll appear here as people use the app.
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
                    {EVENT_LABEL[e.event] ?? e.event}
                    {e.path && e.event === "page_view" && (
                      <span style={{ fontWeight: 500, color: "var(--ink-500)", fontFamily: "monospace" }}> {e.path}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {e.user_email ?? "anonymous visitor"}
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

