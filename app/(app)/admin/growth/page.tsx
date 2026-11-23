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
  research_session_id?: string | null;
  research_launched_at?: string | null;
  research_status?: string | null;
  research_last_digest_at?: string | null;
}

interface ScoredLead {
  key: string;
  email: string | null;
  name: string | null;
  score: number;
  signals: string[];
  paid: boolean;
  role: string | null;
  tier?: "customer" | "warm" | "dormant" | "anonymous";
  anonymous: boolean;
  lastSeen: string;
  touches: number;
  lastContactAt: string | null;
}

const TIER_BADGE: Record<string, string> = {
  customer: "badge-green",
  warm: "badge",
  dormant: "badge-amber",
  anonymous: "",
};

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
  totals: {
    scored: number;
    emailable: number;
    anonymousHot: number;
    tiers?: Partial<Record<"customer" | "warm" | "dormant" | "anonymous", number>>;
  };
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
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const [sendingKey, setSendingKey] = useState<string | null>(null);
  const [sendNote, setSendNote] = useState<string | null>(null);

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
          ready: Number(r?.readyToSend ?? 0),
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

  /** Click-to-send: first click arms the confirm, second click sends. */
  async function sendEmail(lead: ScoredLead) {
    if (sendingKey) return;
    if (confirmKey !== lead.key) {
      setConfirmKey(lead.key);
      setTimeout(() => setConfirmKey((k) => (k === lead.key ? null : k)), 4000);
      return;
    }
    setConfirmKey(null);
    setSendingKey(lead.key);
    setSendNote(null);
    try {
      const r = await post({ action: "send", leadKey: lead.key });
      setSendNote(
        r?.ok
          ? t("sendOk", { email: lead.email ?? lead.key })
          : t("sendFailed", { error: String(r?.error ?? "unknown") })
      );
    } catch (e) {
      setSendNote(t("sendFailed", { error: e instanceof Error ? e.message : "?" }));
    } finally {
      setSendingKey(null);
      await load();
    }
  }

  /** Mirrors the server guards closely enough to show/hide the button. */
  const canSend = (l: ScoredLead) =>
    !!l.email &&
    !l.anonymous &&
    !l.paid &&
    (l.tier === "dormant" || (l.tier === "warm" && l.score >= 50));

  const state = data?.state;
  const enabled = state?.enabled !== false;
  const funnel = data?.funnel24h ?? {};
  const funnelItems: [string, number][] = [
    [t("fSignups"), funnel.signup ?? 0],
    [t("fDemos"), funnel.demo_start ?? 0],
    [t("fPayFails"), funnel.payment_failed ?? 0],
    [t("fLogins"), funnel.login ?? 0],
  ];

  // Pipeline split — prospects get outreach tools, customers are read-only.
  const allLeads = data?.leads ?? [];
  const tierGroups: Record<"warm" | "dormant" | "anonymous" | "customer", ScoredLead[]> = {
    warm: allLeads.filter((l) => l.tier === "warm").sort((a, b) => b.score - a.score),
    dormant: allLeads.filter((l) => l.tier === "dormant").sort((a, b) => b.score - a.score),
    anonymous: allLeads.filter((l) => l.tier === "anonymous").sort((a, b) => b.score - a.score),
    customer: allLeads.filter((l) => l.tier === "customer").sort((a, b) => b.score - a.score),
  };
  const prospectCount = tierGroups.warm.length + tierGroups.dormant.length + tierGroups.anonymous.length;

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
          [t("stLastRun"), state?.last_run_at ? ukDate(state.last_run_at.slice(0, 10)) : t("never")],
          [t("stDigest"), state?.last_digest_at ? ukDate(state.last_digest_at.slice(0, 10)) : t("never")],
          [t("stSentToday"), String(state?.sent_today ?? 0)],
          [t("stHotLeads"), String(data?.totals.scored ?? 0)],
        ].map(([label, value]) => (
          <div className="glass-card card-pad" key={label}>
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Devin Cloud research status */}
      <div className="glass-card card-pad" style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Icon name="search" size={16} />
        <strong style={{ fontSize: 13 }}>{t("researchTitle")}</strong>
        <span className="chip">
          {state?.research_session_id
            ? t("researchRunning", { status: state.research_status ?? "…" })
            : state?.research_status
              ? `${state.research_status}${state.research_last_digest_at ? ` · ${ukDate(state.research_last_digest_at.slice(0, 10))}` : ""}`
              : t("researchIdle")}
        </span>
        <span style={{ fontSize: 12, color: "var(--ink-500)" }}>{t("researchHint")}</span>
      </div>

      {sendNote && (
        <div className="glass-card card-pad" style={{ marginBottom: 20, borderLeft: "3px solid var(--rose-500)" }}>
          <div style={{ fontSize: 13 }}>{sendNote}</div>
        </div>
      )}

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        {/* Prospect pipeline — grouped by tier, click-to-send per lead */}
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("hotLeads")}</h3>
            <span className="chip">{t("chipScored", { count: prospectCount })}</span>
          </div>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--ink-500)" }}>{t("pipelineNote")}</p>
          {(["warm", "dormant", "anonymous"] as const).map((tier) => (
            <div key={tier} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span className={`badge ${TIER_BADGE[tier]}`} style={{ fontSize: 10 }}>{t(`tier_${tier}`)}</span>
                <span style={{ fontSize: 11.5, color: "var(--ink-500)" }}>{t(`tierDesc_${tier}`)}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-500)" }}>{tierGroups[tier].length}</span>
              </div>
              {tierGroups[tier].length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--ink-500)", padding: "4px 0 8px" }}>{t("tierEmpty")}</div>
              ) : (
                <div className="table-wrap" style={{ maxHeight: tier === "warm" ? 320 : 200, overflowY: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t("colLead")}</th>
                        <th>{t("colScore")}</th>
                        <th>{t("colSignals")}</th>
                        <th>{t("colTouches")}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {tierGroups[tier].slice(0, 15).map((l) => (
                        <tr key={l.key}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{l.email ?? `${l.key.slice(0, 20)}…`}</div>
                            <div style={{ fontSize: 11, color: "var(--ink-500)" }}>
                              {l.name ? `${l.name} · ` : ""}
                              {l.anonymous ? t("anonymous") : t("unpaid")}
                            </div>
                          </td>
                          <td><span className={scoreBadge(l.score)}>{l.score}</span></td>
                          <td style={{ fontSize: 12, color: "var(--ink-500)", maxWidth: 200 }}>
                            {l.signals.slice(0, 2).join(" · ") || "—"}
                          </td>
                          <td style={{ fontSize: 12, color: "var(--ink-500)" }}>
                            {l.touches}
                            {l.lastContactAt && <div style={{ fontSize: 10 }}>{ukDate(l.lastContactAt.slice(0, 10))}</div>}
                          </td>
                          <td style={{ whiteSpace: "nowrap" }}>
                            {canSend(l) ? (
                              <button
                                className={`btn btn-sm ${confirmKey === l.key ? "btn-primary" : "btn-ghost"}`}
                                onClick={() => void sendEmail(l)}
                                disabled={sendingKey !== null}
                              >
                                {sendingKey === l.key ? t("sending") : confirmKey === l.key ? t("confirmSend") : t("sendEmail")}
                              </button>
                            ) : l.anonymous ? (
                              <span style={{ fontSize: 11, color: "var(--ink-500)" }}>{t("noEmail")}</span>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right column: funnel + outreach log + customers */}
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
            <div className="card-head"><h3>{t("customersTitle")}</h3><span className="chip badge-green">{tierGroups.customer.length}</span></div>
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--ink-500)" }}>{t("customersNote")}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
              {tierGroups.customer.length === 0 && !loading && (
                <div style={{ fontSize: 13, color: "var(--ink-500)" }}>{t("noCustomers")}</div>
              )}
              {tierGroups.customer.slice(0, 15).map((c) => (
                <div key={c.key} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12.5 }}>
                  <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.email ?? c.key}
                  </span>
                  <span style={{ color: "var(--ink-500)", flexShrink: 0 }}>{ukDate(c.lastSeen.slice(0, 10))}</span>
                </div>
              ))}
            </div>
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
                    {o.subject ?? "—"} · {ukDate(o.created_at.slice(0, 10))}
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
          <li>{t("how5")}</li>
        </ul>
      </div>
    </>
  );
}
