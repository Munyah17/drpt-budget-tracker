"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { adminHeaders } from "@/lib/adminClient";
import { ukDate } from "@/lib/format";
import Icon from "@/components/Icon";

interface AgentState {
  enabled: boolean;
  last_run_at: string | null;
  last_digest_at: string | null;
  sent_today: number;
  sent_today_date: string | null;
}

interface ScoredLead {
  key: string;
  email: string | null;
  name: string | null;
  score: number;
  signals: string[];
  paid: boolean;
  role: string | null;
  anonymous: boolean;
  lastSeen: string;
  touches: number;
  lastContactAt: string | null;
}

interface OutreachRow {
  id: string;
  lead_key: string;
  email: string | null;
  name: string | null;
  intent_score: number;
  subject: string | null;
  status: string;
  error: string | null;
  created_at: string;
}

interface GrowthData {
  state: AgentState;
  leads: ScoredLead[];
  outreach: OutreachRow[];
  funnel24h: Record<string, number>;
  totals: { scored: number; emailable: number; anonymousHot: number };
}

function scoreBadge(score: number): string {
  if (score >= 80) return "badge badge-green";
  if (score >= 60) return "badge badge-amber";
  return "badge";
}

export default function AdminGrowthPage() {
  const t = useTranslations("Pages.adm_growth");
  const { user } = useAppData();
  const [data, setData] = useState<GrowthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"run" | "toggle" | null>(null);
  const [runNote, setRunNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/growth", {
        headers: await adminHeaders(user?.email),
        cache: "no-store",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setData(json as GrowthData);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  async function post(body: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    const res = await fetch("/api/admin/growth", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await adminHeaders(user?.email)) },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
    return json;
  }

  async function runNow() {
    setBusy("run");
    setRunNote(null);
    try {
      const r = await post({ action: "run" });
      setRunNote(
        t("runResult", {
          scored: Number(r?.leadsScored ?? 0),
          emailed: Number(r?.emailed ?? 0),
          failed: Number(r?.failed ?? 0),
        })
      );
      await load();
    } catch (e) {
      setRunNote(t("runFailed", { error: e instanceof Error ? e.message : "?" }));
    } finally {
      setBusy(null);
    }
  }

  async function toggle() {
    if (!data) return;
    setBusy("toggle");
    try {
      await post({ action: "set_enabled", enabled: !data.state.enabled });
      await load();
    } catch {
      /* surfaced on next refresh */
    } finally {
      setBusy(null);
    }
  }

  const state = data?.state;
  const enabled = state?.enabled !== false;
  const funnel = data?.funnel24h ?? {};
  const funnelItems: [string, number][] = [
    [t("fSignups"), funnel.signup ?? 0],
    [t("fDemos"), funnel.demo_start ?? 0],
    [t("fPayFails"), funnel.payment_failed ?? 0],
    [t("fLogins"), funnel.login ?? 0],
  ];

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 className="section-title">
            {t("title")}{" "}
            <span className={`badge ${enabled ? "badge-green" : ""}`} style={{ fontSize: 11, verticalAlign: "middle" }}>
              {enabled ? t("live") : t("paused")}
            </span>
          </h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-sm" onClick={runNow} disabled={busy !== null || loading}>
            <Icon name="send" size={14} style={{ marginRight: 6 }} />
            {busy === "run" ? t("running") : t("runNow")}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={toggle} disabled={busy !== null || loading}>
            {enabled ? t("pause") : t("resume")}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
            <Icon name="refresh-cw" size={14} />
          </button>
        </div>
      </div>

      {runNote && (
        <div className="glass-card card-pad" style={{ marginBottom: 20, borderLeft: "3px solid var(--rose-500)" }}>
          <div style={{ fontSize: 13 }}>{runNote}</div>
        </div>
      )}
      {error && (
        <div className="glass-card card-pad" style={{ marginBottom: 20, borderLeft: "3px solid var(--red)" }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{t("loadError", { error })}</div>
          <div style={{ fontSize: 13, color: "var(--ink-500)" }}>{t("errorHint")}</div>
        </div>
      )}

      {/* Status strip */}
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        {[
          [t("stLastRun"), state?.last_run_at ? ukDate(state.last_run_at) : t("never")],
          [t("stDigest"), state?.last_digest_at ? ukDate(state.last_digest_at) : t("never")],
          [t("stSentToday"), String(state?.sent_today ?? 0)],
          [t("stHotLeads"), String(data?.totals.scored ?? 0)],
        ].map(([label, value]) => (
          <div className="glass-card card-pad" key={label}>
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        {/* Hot leads */}
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("hotLeads")}</h3>
            <span className="chip">{t("chipScored", { count: data?.totals.scored ?? 0 })}</span>
          </div>
          <div className="table-wrap" style={{ maxHeight: 460, overflowY: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("colLead")}</th>
                  <th>{t("colScore")}</th>
                  <th>{t("colSignals")}</th>
                  <th>{t("colTouches")}</th>
                </tr>
              </thead>
              <tbody>
                {(data?.leads ?? []).slice(0, 25).map((l) => (
                  <tr key={l.key}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{l.email ?? `${l.key.slice(0, 20)}…`}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-500)" }}>
                        {l.name ? `${l.name} · ` : ""}
                        {l.anonymous ? t("anonymous") : l.paid ? t("paid") : t("unpaid")}
                      </div>
                    </td>
                    <td><span className={scoreBadge(l.score)}>{l.score}</span></td>
                    <td style={{ fontSize: 12, color: "var(--ink-500)", maxWidth: 220 }}>
                      {l.signals.slice(0, 2).join(" · ") || "—"}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--ink-500)" }}>
                      {l.touches}
                      {l.lastContactAt && <div style={{ fontSize: 10 }}>{ukDate(l.lastContactAt)}</div>}
                    </td>
                  </tr>
                ))}
                {(data?.leads ?? []).length === 0 && !loading && (
                  <tr><td colSpan={4} style={{ padding: 16, fontSize: 13, color: "var(--ink-500)" }}>{t("noLeads")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: funnel + outreach log */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="glass-card card-pad">
            <div className="card-head"><h3>{t("funnel24h")}</h3><span className="chip">24h</span></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {funnelItems.map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
                  <span style={{ color: "var(--ink-500)" }}>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 14, fontSize: 12, color: "var(--ink-500)" }}>
              {t("emailableNote", { count: data?.totals.emailable ?? 0, anon: data?.totals.anonymousHot ?? 0 })}
            </p>
          </div>

          <div className="glass-card card-pad">
            <div className="card-head"><h3>{t("outreachLog")}</h3><span className="chip">{data?.outreach.length ?? 0}</span></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
              {(data?.outreach ?? []).length === 0 && !loading && (
                <div style={{ fontSize: 13, color: "var(--ink-500)" }}>{t("noOutreach")}</div>
              )}
              {(data?.outreach ?? []).slice(0, 20).map((o) => (
                <div key={o.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--card-border)", fontSize: 12.5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {o.email ?? o.lead_key}
                    </span>
                    <span className={`badge ${o.status === "sent" ? "badge-green" : "badge-red"}`} style={{ fontSize: 10, flexShrink: 0 }}>
                      {o.status}
                    </span>
                  </div>
                  <div style={{ color: "var(--ink-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {o.subject ?? "—"} · {ukDate(o.created_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="glass-card card-pad">
        <div className="card-head"><h3>{t("howTitle")}</h3></div>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "var(--ink-500)", display: "flex", flexDirection: "column", gap: 6, lineHeight: 1.6 }}>
          <li>{t("how1")}</li>
          <li>{t("how2")}</li>
          <li>{t("how3")}</li>
          <li>{t("how4")}</li>
        </ul>
      </div>
    </>
  );
}
