"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { adminHeaders } from "@/lib/adminClient";
import Icon from "@/components/Icon";

interface FeedbackItem {
  id: number;
  user_email: string | null;
  user_name: string | null;
  kind: "suggestion" | "feedback" | "bug";
  message: string;
  page: string | null;
  app_version: string | null;
  status: "new" | "reviewed" | "planned" | "shipped" | "declined";
  created_at: string;
  updated_at: string | null;
}

const KINDS = ["suggestion", "feedback", "bug"] as const;
const STATUSES = ["new", "reviewed", "planned", "shipped", "declined"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_BADGE: Record<Status, string> = {
  new: "badge-green",
  reviewed: "badge-amber",
  planned: "badge-amber",
  shipped: "badge-green",
  declined: "badge-red",
};

function statusLabelKey(s: string): string {
  return `status${s[0].toUpperCase()}${s.slice(1)}`;
}

export default function AdminFeedbackPage() {
  const t = useTranslations("Pages.adm_feedback");
  const { user, toast, authReady } = useAppData();
  const router = useRouter();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [draftStatus, setDraftStatus] = useState<Record<number, Status>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const isSuperAdmin = user?.role === "super_admin";

  useEffect(() => {
    if (authReady && user && !isSuperAdmin) router.replace("/admin");
  }, [authReady, user, isSuperAdmin, router]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/feedback", { headers: await adminHeaders(user?.email) });
        const data = await res.json().catch(() => null);
        if (!cancelled) setItems(Array.isArray(data?.feedback) ? data.feedback : []);
      } catch {
        /* keep empty state */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin, user, reloadKey]);

  const stats = useMemo(() => {
    const fresh = items.filter((i) => i.status === "new").length;
    const bugs = items.filter((i) => i.kind === "bug").length;
    const suggestions = items.filter((i) => i.kind === "suggestion").length;
    return { total: items.length, fresh, bugs, suggestions };
  }, [items]);

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (!kindFilter || i.kind === kindFilter) &&
          (!statusFilter || i.status === statusFilter)
      ),
    [items, kindFilter, statusFilter]
  );

  async function updateStatus(id: number) {
    const status = draftStatus[id];
    if (!status || saving === id) return;
    setSaving(id);
    try {
      const res = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(await adminHeaders(user?.email)) },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, status, updated_at: new Date().toISOString() } : i))
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

  if (authReady && user && !isSuperAdmin) return null;

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => {
            setLoading(true);
            setReloadKey((k) => k + 1);
          }}
          disabled={loading}
        >
          <Icon name="repeat" size={14} style={{ marginRight: 6 }} />
          {t("refresh")}
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("total")}</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("newCount")}</div>
          <div className="stat-value">{stats.fresh}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("bugs")}</div>
          <div className="stat-value">{stats.bugs}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("suggestions")}</div>
          <div className="stat-value">{stats.suggestions}</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <div className="card-head" style={{ marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
          <h3>{t("inboxTitle")}</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select
              className="settings-select"
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
              style={{ padding: "8px 12px", fontSize: 13 }}
            >
              <option value="">{t("kindFilterAll")}</option>
              {KINDS.map((k) => (
                <option key={k} value={k}>{t(`kind_${k}`)}</option>
              ))}
            </select>
            <select
              className="settings-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: "8px 12px", fontSize: 13 }}
            >
              <option value="">{t("statusFilterAll")}</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{t(statusLabelKey(s))}</option>
              ))}
            </select>
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colKind")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colFrom")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colPage")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colCreated")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <FeedbackRow
                key={item.id}
                item={item}
                expanded={expanded === item.id}
                draft={draftStatus[item.id] ?? item.status}
                saving={saving === item.id}
                onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
                onDraft={(s) => setDraftStatus((d) => ({ ...d, [item.id]: s }))}
                onSave={() => updateStatus(item.id)}
                fmtDate={fmtDate}
                t={t}
              />
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "28px 8px", textAlign: "center", color: "var(--ink-500)", fontSize: 13.5 }}>
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

function FeedbackRow({
  item,
  expanded,
  draft,
  saving,
  onToggle,
  onDraft,
  onSave,
  fmtDate,
  t,
}: {
  item: FeedbackItem;
  expanded: boolean;
  draft: Status;
  saving: boolean;
  onToggle: () => void;
  onDraft: (s: Status) => void;
  onSave: () => void;
  fmtDate: (iso: string) => string;
  t: ReturnType<typeof useTranslations>;
}) {
  const sender = item.user_name ? `${item.user_name} (${item.user_email ?? "—"})` : item.user_email ?? "—";
  const dirty = draft !== item.status;
  return (
    <>
      <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
        <td style={{ padding: "12px 8px", fontWeight: 600 }}>{t(`kind_${item.kind}`)}</td>
        <td style={{ padding: "12px 8px", fontSize: 13 }}>{sender}</td>
        <td style={{ padding: "12px 8px" }}>
          <span className={`badge ${STATUS_BADGE[item.status]}`}>{t(statusLabelKey(item.status))}</span>
        </td>
        <td style={{ padding: "12px 8px", fontSize: 13 }}>{item.page ?? "—"}</td>
        <td style={{ padding: "12px 8px", fontSize: 13 }}>{fmtDate(item.created_at)}</td>
        <td style={{ padding: "12px 8px" }}>
          <button className="btn btn-ghost" style={{ padding: "6px 10px" }} onClick={onToggle} aria-label={t("colActions")}>
            <Icon name={expanded ? "chevron-down" : "eye"} size={16} />
          </button>
        </td>
      </tr>
      {expanded && (
        <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
          <td colSpan={6} style={{ padding: "16px 8px 20px" }}>
            <div style={{ background: "var(--paper)", borderRadius: 12, padding: "16px 18px", maxWidth: 760 }}>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13, color: "var(--ink-500)", marginBottom: 12 }}>
                <span><strong style={{ color: "var(--ink-700)" }}>{t("detailFrom")}:</strong> {sender}</span>
                <span><strong style={{ color: "var(--ink-700)" }}>{t("detailKind")}:</strong> {t(`kind_${item.kind}`)}</span>
                <span><strong style={{ color: "var(--ink-700)" }}>{t("detailPage")}:</strong> {item.page ?? "—"}</span>
                <span><strong style={{ color: "var(--ink-700)" }}>{t("detailReceived")}:</strong> {fmtDate(item.created_at)}</span>
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: 16 }}>
                {item.message}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <select
                  className="settings-select"
                  value={draft}
                  onChange={(e) => onDraft(e.target.value as Status)}
                  style={{ padding: "8px 12px", fontSize: 13 }}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{t(statusLabelKey(s))}</option>
                  ))}
                </select>
                <button className="btn btn-primary" style={{ padding: "8px 16px", fontSize: 13 }} onClick={onSave} disabled={!dirty || saving}>
                  {t("update")}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
