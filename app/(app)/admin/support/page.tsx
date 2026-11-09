"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { adminHeaders } from "@/lib/adminClient";
import Icon from "@/components/Icon";

interface SupportMessage {
  id: number;
  user_email: string | null;
  user_name: string | null;
  subject: string;
  message: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  created_at: string;
  resolved_at: string | null;
}

const STATUSES = ["open", "in-progress", "resolved", "closed"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_BADGE: Record<Status, string> = {
  open: "badge-green",
  "in-progress": "badge-amber",
  resolved: "badge-blue",
  closed: "badge-red",
};

function statusLabelKey(s: string): string {
  return s === "in-progress" ? "statusInProgress" : `status${s[0].toUpperCase()}${s.slice(1)}`;
}

export default function AdminSupportPage() {
  const t = useTranslations("Pages.adm_support");
  const { user, toast } = useAppData();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [draftStatus, setDraftStatus] = useState<Record<number, Status>>({});
  const [saving, setSaving] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/support", { headers: await adminHeaders(user?.email) });
      const data = await res.json().catch(() => null);
      setMessages(Array.isArray(data?.messages) ? data.messages : []);
    } catch {
      /* keep empty state */
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const open = messages.filter((m) => m.status === "open").length;
    const inProgress = messages.filter((m) => m.status === "in-progress").length;
    const today = new Date().toDateString();
    const resolvedToday = messages.filter(
      (m) => m.resolved_at && new Date(m.resolved_at).toDateString() === today
    ).length;
    // Average time-to-resolve across resolved messages; "—" when there's no data.
    const resolved = messages.filter((m) => m.resolved_at);
    const avgMs = resolved.length
      ? resolved.reduce((sum, m) => sum + (new Date(m.resolved_at!).getTime() - new Date(m.created_at).getTime()), 0) /
        resolved.length
      : null;
    const avg =
      avgMs == null
        ? "—"
        : avgMs < 3_600_000
          ? `${Math.max(1, Math.round(avgMs / 60_000))}m`
          : avgMs < 86_400_000
            ? `${Math.round(avgMs / 3_600_000)}h`
            : `${Math.round(avgMs / 86_400_000)}d`;
    return { open, inProgress, resolvedToday, avg };
  }, [messages]);

  const filtered = useMemo(
    () => (statusFilter ? messages.filter((m) => m.status === statusFilter) : messages),
    [messages, statusFilter]
  );

  async function updateStatus(id: number) {
    const status = draftStatus[id];
    if (!status || saving === id) return;
    setSaving(id);
    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(await adminHeaders(user?.email)) },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id
              ? {
                  ...m,
                  status,
                  resolved_at: status === "resolved" ? new Date().toISOString() : null,
                }
              : m
          )
        );
        toast(t("toastSaved"), "check-circle");
      } else {
        toast(data?.error || t("toastError"), "x");
      }
    } catch {
      toast(t("toastError"), "x");
    }
    setSaving(null);
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-ghost" onClick={load} disabled={loading}>
          <Icon name="repeat" size={14} style={{ marginRight: 6 }} />
          {t("refresh")}
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("openTickets")}</div>
          <div className="stat-value">{stats.open}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("inProgress")}</div>
          <div className="stat-value">{stats.inProgress}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("resolvedToday")}</div>
          <div className="stat-value">{stats.resolvedToday}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("avgResponseTime")}</div>
          <div className="stat-value">{stats.avg}</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <div className="card-head" style={{ marginBottom: 12 }}>
          <h3>{t("ticketsTitle")}</h3>
          <select
            className="settings-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", fontSize: 13 }}
          >
            <option value="">{t("filterAll")}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(statusLabelKey(s))}
              </option>
            ))}
          </select>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colSubject")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colUser")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colCreated")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <SupportRow
                key={m.id}
                m={m}
                expanded={expanded === m.id}
                draft={draftStatus[m.id] ?? m.status}
                saving={saving === m.id}
                onToggle={() => setExpanded(expanded === m.id ? null : m.id)}
                onDraft={(s) => setDraftStatus((d) => ({ ...d, [m.id]: s }))}
                onSave={() => updateStatus(m.id)}
                fmtDate={fmtDate}
                t={t}
              />
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "28px 8px", textAlign: "center", color: "var(--ink-500)", fontSize: 13.5 }}>
                  {t("emptyState")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SupportRow({
  m,
  expanded,
  draft,
  saving,
  onToggle,
  onDraft,
  onSave,
  fmtDate,
  t,
}: {
  m: SupportMessage;
  expanded: boolean;
  draft: Status;
  saving: boolean;
  onToggle: () => void;
  onDraft: (s: Status) => void;
  onSave: () => void;
  fmtDate: (iso: string) => string;
  t: ReturnType<typeof useTranslations>;
}) {
  const sender = m.user_name ? `${m.user_name} (${m.user_email ?? "—"})` : m.user_email ?? "—";
  const dirty = draft !== m.status;
  return (
    <>
      <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
        <td style={{ padding: "12px 8px", fontWeight: 600 }}>{m.subject}</td>
        <td style={{ padding: "12px 8px", fontSize: 13 }}>{sender}</td>
        <td style={{ padding: "12px 8px" }}>
          <span className={`badge ${STATUS_BADGE[m.status]}`}>{t(statusLabelKey(m.status))}</span>
        </td>
        <td style={{ padding: "12px 8px", fontSize: 13 }}>{fmtDate(m.created_at)}</td>
        <td style={{ padding: "12px 8px" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-ghost" style={{ padding: "6px 10px" }} onClick={onToggle} aria-label={t("colActions")}>
              <Icon name={expanded ? "chevron-down" : "eye"} size={16} />
            </button>
            {m.user_email && (
              <a
                className="btn btn-ghost"
                style={{ padding: "6px 10px" }}
                href={`mailto:${m.user_email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}
                aria-label={t("replyByEmail")}
              >
                <Icon name="send" size={16} />
              </a>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
          <td colSpan={5} style={{ padding: "16px 8px 20px" }}>
            <div style={{ background: "var(--paper)", borderRadius: 12, padding: "16px 18px", maxWidth: 720 }}>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13, color: "var(--ink-500)", marginBottom: 12 }}>
                <span>
                  <strong style={{ color: "var(--ink-700)" }}>{t("detailFrom")}:</strong> {sender}
                </span>
                <span>
                  <strong style={{ color: "var(--ink-700)" }}>{t("detailReceived")}:</strong> {fmtDate(m.created_at)}
                </span>
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: 16 }}>
                {m.message}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <select
                  className="settings-select"
                  value={draft}
                  onChange={(e) => onDraft(e.target.value as Status)}
                  style={{ padding: "8px 12px", fontSize: 13 }}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(statusLabelKey(s))}
                    </option>
                  ))}
                </select>
                <button className="btn btn-primary" style={{ padding: "8px 16px", fontSize: 13 }} onClick={onSave} disabled={!dirty || saving}>
                  {t("update")}
                </button>
                {m.user_email && (
                  <a
                    className="btn btn-ghost"
                    style={{ padding: "8px 16px", fontSize: 13 }}
                    href={`mailto:${m.user_email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}
                  >
                    <Icon name="send" size={14} style={{ marginRight: 6 }} />
                    {t("replyByEmail")}
                  </a>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
