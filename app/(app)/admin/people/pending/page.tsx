"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { adminHeaders } from "@/lib/adminClient";
import Icon from "@/components/Icon";

interface Approval {
  id: number;
  user_id: string | null;
  user_email: string | null;
  provider: string;
  method: string | null;
  amount: number | null;
  currency: string;
  reference: string | null;
  status: string;
  created_at: string;
  meta: Record<string, unknown> | null;
  profile: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    country: string | null;
    is_paid: boolean;
    created_at: string;
  } | null;
}

export default function PendingApprovalsPage() {
  const t = useTranslations("Pages.adm_people_pending");
  const { user, toast } = useAppData();
  const [items, setItems] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/approvals", { headers: await adminHeaders(user?.email) });
      const data = await res.json().catch(() => null);
      setItems(data?.approvals ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(id: number, action: "approve" | "reject" | "stall") {
    setBusyId(id);
    try {
      let note = "";
      if (action === "stall") {
        const raw = window.prompt(t("stallPrompt"));
        if (raw === null) { setBusyId(null); return; }
        note = raw;
      }
      const res = await fetch("/api/admin/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await adminHeaders(user?.email)) },
        body: JSON.stringify({ paymentId: id, action, note }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      toast(
        action === "approve" ? t("toastApproved") : action === "reject" ? t("toastRejected") : t("toastStalled"),
        action === "approve" ? "check-circle" : action === "reject" ? "trash-2" : "clock"
      );
      if (action === "stall") {
        setItems((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, meta: { ...(p.meta ?? {}), stalled: true, stall_note: note || undefined } }
              : p
          )
        );
      } else {
        setItems((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : t("actionFailed"), "x");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-ghost" onClick={load} disabled={loading}>
          <Icon name="refresh-cw" size={15} style={{ marginRight: 6 }} />
          {t("refresh")}
        </button>
      </div>

      <div className="glass-card card-pad">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thClient")}</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thMethod")}</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thAmount")}</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thReference")}</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thRequested")}</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thActions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                    {loading ? t("loading") : t("emptyState")}
                  </td>
                </tr>
              )}
              {items.map((p) => {
                const metaName = typeof p.meta?.name === "string" ? p.meta.name : "";
                const metaPhone = typeof p.meta?.phone === "string" ? p.meta.phone : "";
                const stalled = p.meta?.stalled === true;
                const stallNote = typeof p.meta?.stall_note === "string" ? p.meta.stall_note : "";
                return (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={{ padding: "12px 8px" }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{p.profile?.name || metaName || "—"}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{p.user_email || p.profile?.email}</div>
                    {(p.profile?.phone || metaPhone) && (
                      <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{p.profile?.phone ?? metaPhone}</div>
                    )}
                    {stalled && (
                      <div style={{ marginTop: 4 }}>
                        <span className="badge badge-amber">{t("badgeStalled")}</span>
                        {stallNote && (
                          <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 3 }}>{stallNote}</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px 8px", fontSize: 13, textTransform: "capitalize" }}>
                    {p.provider === "bank" ? t("methodBank") : t("methodEcocash")}
                  </td>
                  <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>
                    {p.amount != null ? `${p.currency.toUpperCase()} ${p.amount.toFixed(2)}` : "—"}
                  </td>
                  <td style={{ padding: "12px 8px", fontSize: 12, fontFamily: "monospace" }}>{p.reference || `#${p.id}`}</td>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>{new Date(p.created_at).toLocaleString("en-GB")}</td>
                  <td style={{ padding: "12px 8px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: "6px 14px", fontSize: 13 }}
                        disabled={busyId === p.id}
                        onClick={() => decide(p.id, "approve")}
                      >
                        {t("approve")}
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "6px 14px", fontSize: 13, color: "var(--amber, #b45309)" }}
                        disabled={busyId === p.id}
                        onClick={() => decide(p.id, "stall")}
                      >
                        {t("stall")}
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "6px 14px", fontSize: 13, color: "var(--red)" }}
                        disabled={busyId === p.id}
                        onClick={() => decide(p.id, "reject")}
                      >
                        {t("reject")}
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
