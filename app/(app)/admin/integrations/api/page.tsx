"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { adminHeaders } from "@/lib/adminClient";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  active: boolean;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

interface AuditRow {
  id: string;
  method: string;
  path: string;
  status: number;
  ip: string | null;
  duration_ms: number | null;
  created_at: string;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
}

interface Delivery {
  id: string;
  webhook_id: string;
  event: string;
  status: number | null;
  success: boolean;
  attempted_at: string;
}

const EVENTS = ["corporate.created", "employee.created", "invoice.created", "invoice.paid"];
const EMPTY_KEY = { name: "", read: true, write: false };
const EMPTY_HOOK = { name: "", url: "", events: [] as string[] };

const fmtTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "—";

export default function AdminApiPage() {
  const t = useTranslations("Pages.adm_integrations_api");
  const { toast, user } = useAppData();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [hooks, setHooks] = useState<Webhook[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyModal, setKeyModal] = useState(false);
  const [hookModal, setHookModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState(EMPTY_KEY);
  const [h, setH] = useState(EMPTY_HOOK);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [kRes, hRes] = await Promise.all([
        fetch("/api/admin/api-keys", { headers: await adminHeaders(user?.email) }),
        fetch("/api/admin/webhooks", { headers: await adminHeaders(user?.email) }),
      ]);
      const k = await kRes.json().catch(() => ({}));
      const w = await hRes.json().catch(() => ({}));
      setKeys(Array.isArray(k.keys) ? k.keys : []);
      setAudit(Array.isArray(k.audit) ? k.audit : []);
      setHooks(Array.isArray(w.hooks) ? w.hooks : []);
      setDeliveries(Array.isArray(w.deliveries) ? w.deliveries : []);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => toast(t("toastCopied"), "link"));
  }

  async function createKey(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const res = await fetch("/api/admin/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await adminHeaders(user?.email)) },
      body: JSON.stringify({
        name: f.name.trim(),
        scopes: [f.read && "read", f.write && "write"].filter(Boolean),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast(t("toastError"), "x");
      return;
    }
    const data = await res.json();
    setKeyModal(false);
    setF(EMPTY_KEY);
    setCreatedKey(data.key);
    refresh();
  }

  async function revokeKey(k: ApiKey) {
    const res = await fetch(`/api/admin/api-keys?id=${k.id}`, {
      method: "DELETE",
      headers: await adminHeaders(user?.email),
    });
    toast(res.ok ? t("toastRevoked", { name: k.name }) : t("toastError"), res.ok ? "check-circle" : "x");
    refresh();
  }

  async function createHook(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const res = await fetch("/api/admin/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await adminHeaders(user?.email)) },
      body: JSON.stringify({ name: h.name.trim(), url: h.url.trim(), events: h.events }),
    });
    setSaving(false);
    if (!res.ok) {
      toast(t("toastError"), "x");
      return;
    }
    const data = await res.json();
    setHookModal(false);
    setH(EMPTY_HOOK);
    setCreatedSecret(data.secret);
    refresh();
  }

  async function removeHook(w: Webhook) {
    const res = await fetch(`/api/admin/webhooks?id=${w.id}`, {
      method: "DELETE",
      headers: await adminHeaders(user?.email),
    });
    toast(res.ok ? t("toastHookRemoved", { name: w.name || w.url }) : t("toastError"), res.ok ? "trash-2" : "x");
    refresh();
  }

  function toggleEvent(ev: string) {
    setH((prev) => ({
      ...prev,
      events: prev.events.includes(ev) ? prev.events.filter((e) => e !== ev) : [...prev.events, ev],
    }));
  }

  const statusBadge = (n: number | null) =>
    n === null ? "badge-red" : n < 400 ? "badge-green" : "badge-amber";

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setHookModal(true)}>
            <Icon name="webhook" size={16} style={{ marginRight: 8 }} />
            {t("newWebhook")}
          </button>
          <button className="btn btn-primary" onClick={() => setKeyModal(true)}>
            <Icon name="plus" size={16} style={{ marginRight: 8 }} />
            {t("newKey")}
          </button>
        </div>
      </div>

      {/* ── API keys ─────────────────────────────────────────── */}
      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>{t("keysTitle")}</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "10px 8px", fontSize: 13 }}>{t("thName")}</th>
              <th style={{ padding: "10px 8px", fontSize: 13 }}>{t("thKey")}</th>
              <th style={{ padding: "10px 8px", fontSize: 13 }}>{t("thScopes")}</th>
              <th style={{ padding: "10px 8px", fontSize: 13 }}>{t("thStatus")}</th>
              <th style={{ padding: "10px 8px", fontSize: 13 }}>{t("thLastUsed")}</th>
              <th style={{ padding: "10px 8px", fontSize: 13 }}>{t("thActions")}</th>
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 24 }}>
                  {loading ? t("loading") : t("noKeys")}
                </td>
              </tr>
            )}
            {keys.map((k) => (
              <tr key={k.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "10px 8px", fontWeight: 600 }}>{k.name}</td>
                <td style={{ padding: "10px 8px", fontSize: 13, fontFamily: "monospace" }}>{k.key_prefix}…</td>
                <td style={{ padding: "10px 8px" }}>
                  {k.scopes.map((s) => (
                    <span key={s} className="badge badge-blue" style={{ marginRight: 4 }}>{s}</span>
                  ))}
                </td>
                <td style={{ padding: "10px 8px" }}>
                  <span className={`badge ${k.active ? "badge-green" : "badge-red"}`}>
                    {k.active ? t("active") : t("revoked")}
                  </span>
                </td>
                <td style={{ padding: "10px 8px", fontSize: 13 }}>{fmtTime(k.last_used_at)}</td>
                <td style={{ padding: "10px 8px" }}>
                  {k.active && (
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => revokeKey(k)}>
                      <Icon name="lock" size={14} style={{ marginRight: 4 }} />{t("revoke")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Webhooks ─────────────────────────────────────────── */}
      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>{t("webhooksTitle")}</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "10px 8px", fontSize: 13 }}>{t("thName")}</th>
              <th style={{ padding: "10px 8px", fontSize: 13 }}>{t("thUrl")}</th>
              <th style={{ padding: "10px 8px", fontSize: 13 }}>{t("thEvents")}</th>
              <th style={{ padding: "10px 8px", fontSize: 13 }}>{t("thActions")}</th>
            </tr>
          </thead>
          <tbody>
            {hooks.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "var(--ink-500)", padding: 24 }}>
                  {loading ? t("loading") : t("noHooks")}
                </td>
              </tr>
            )}
            {hooks.map((w) => (
              <tr key={w.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "10px 8px", fontWeight: 600 }}>{w.name || "—"}</td>
                <td style={{ padding: "10px 8px", fontSize: 13, fontFamily: "monospace" }}>{w.url}</td>
                <td style={{ padding: "10px 8px", fontSize: 12 }}>
                  {w.events.map((e) => (
                    <span key={e} className="badge badge-amber" style={{ marginRight: 4 }}>{e}</span>
                  ))}
                </td>
                <td style={{ padding: "10px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => removeHook(w)}>
                    <Icon name="trash-2" size={14} style={{ marginRight: 4 }} />{t("remove")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Getting started + recent traffic ─────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 20, marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <h3 style={{ marginBottom: 10 }}>{t("docsTitle")}</h3>
          <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 10 }}>{t("docsAuth")}</p>
          <code style={{ display: "block", fontSize: 12, background: "var(--bg-elev, #f3f4f6)", padding: 10, borderRadius: 6, marginBottom: 10 }}>
            X-API-Key: drpt_sk_…
          </code>
          <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 8 }}>{t("docsResources")}</p>
          <code style={{ display: "block", fontSize: 12, background: "var(--bg-elev, #f3f4f6)", padding: 10, borderRadius: 6, whiteSpace: "pre-line" }}>
            {`GET  /api/v1\nGET  /api/v1/corporates\nPOST /api/v1/corporates\nGET  /api/v1/employees\nPOST /api/v1/employees\nGET  /api/v1/invoices\nPOST /api/v1/invoices\nGET  /api/v1/invoices/:id\nPATCH /api/v1/invoices/:id`}
          </code>
          <p style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 10 }}>{t("docsRate")}</p>
        </div>

        <div className="glass-card card-pad">
          <h3 style={{ marginBottom: 12 }}>{t("recentTitle")}</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={{ padding: "8px 6px", fontSize: 12 }}>{t("thTime")}</th>
                <th style={{ padding: "8px 6px", fontSize: 12 }}>{t("thMethod")}</th>
                <th style={{ padding: "8px 6px", fontSize: 12 }}>{t("thPath")}</th>
                <th style={{ padding: "8px 6px", fontSize: 12 }}>{t("thCode")}</th>
                <th style={{ padding: "8px 6px", fontSize: 12 }}>{t("thMs")}</th>
              </tr>
            </thead>
            <tbody>
              {audit.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--ink-500)", padding: 20 }}>
                    {t("noCalls")}
                  </td>
                </tr>
              )}
              {audit.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={{ padding: "8px 6px", fontSize: 12 }}>{fmtTime(a.created_at)}</td>
                  <td style={{ padding: "8px 6px", fontSize: 12, fontWeight: 600 }}>{a.method}</td>
                  <td style={{ padding: "8px 6px", fontSize: 12, fontFamily: "monospace" }}>{a.path}</td>
                  <td style={{ padding: "8px 6px" }}>
                    <span className={`badge ${statusBadge(a.status)}`}>{a.status}</span>
                  </td>
                  <td style={{ padding: "8px 6px", fontSize: 12 }}>{a.duration_ms ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Webhook deliveries ───────────────────────────────── */}
      {deliveries.length > 0 && (
        <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12 }}>{t("deliveriesTitle")}</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {deliveries.map((d) => (
                <tr key={d.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={{ padding: "8px 6px", fontSize: 12 }}>{fmtTime(d.attempted_at)}</td>
                  <td style={{ padding: "8px 6px", fontSize: 12, fontWeight: 600 }}>{d.event}</td>
                  <td style={{ padding: "8px 6px" }}>
                    <span className={`badge ${statusBadge(d.status)}`}>
                      {d.status ?? t("unreachable")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── New key modal ────────────────────────────────────── */}
      {keyModal && (
        <Modal title={t("keyModalTitle")} onClose={() => setKeyModal(false)}>
          <form onSubmit={createKey}>
            <div className="field">
              <label>{t("fName")} *</label>
              <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={t("fNamePh")} required />
            </div>
            <div className="field">
              <label>{t("fScopes")}</label>
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, marginTop: 6 }}>
                <input type="checkbox" checked={f.read} onChange={(e) => setF({ ...f, read: e.target.checked })} /> {t("scopeRead")}
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, marginTop: 4 }}>
                <input type="checkbox" checked={f.write} onChange={(e) => setF({ ...f, write: e.target.checked })} /> {t("scopeWrite")}
              </label>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={saving}>
              {saving ? t("creating") : t("create")}
            </button>
          </form>
        </Modal>
      )}

      {/* ── Created key shown once ───────────────────────────── */}
      {createdKey && (
        <Modal title={t("keyCreatedTitle")} onClose={() => setCreatedKey(null)}>
          <p style={{ fontSize: 13, marginBottom: 10 }}>{t("keyCreatedBody")}</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <code style={{ flex: 1, fontSize: 13, padding: 10, background: "var(--bg-elev, #f3f4f6)", borderRadius: 6, wordBreak: "break-all" }}>
              {createdKey}
            </code>
            <button className="btn btn-ghost" onClick={() => copy(createdKey)} title={t("copy")}>
              <Icon name="link" size={14} />
            </button>
          </div>
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setCreatedKey(null)}>
            {t("done")}
          </button>
        </Modal>
      )}

      {/* ── New webhook modal ────────────────────────────────── */}
      {hookModal && (
        <Modal title={t("hookModalTitle")} onClose={() => setHookModal(false)}>
          <form onSubmit={createHook}>
            <div className="field">
              <label>{t("fName")}</label>
              <input value={h.name} onChange={(e) => setH({ ...h, name: e.target.value })} placeholder={t("fHookNamePh")} />
            </div>
            <div className="field">
              <label>{t("fUrl")} *</label>
              <input type="url" value={h.url} onChange={(e) => setH({ ...h, url: e.target.value })} placeholder={t("fUrlPh")} required />
            </div>
            <div className="field">
              <label>{t("fEvents")} *</label>
              {EVENTS.map((ev) => (
                <label key={ev} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, marginTop: 6 }}>
                  <input type="checkbox" checked={h.events.includes(ev)} onChange={() => toggleEvent(ev)} /> {ev}
                </label>
              ))}
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={saving || !h.events.length}>
              {saving ? t("creating") : t("create")}
            </button>
          </form>
        </Modal>
      )}

      {/* ── Created webhook secret shown once ────────────────── */}
      {createdSecret && (
        <Modal title={t("secretCreatedTitle")} onClose={() => setCreatedSecret(null)}>
          <p style={{ fontSize: 13, marginBottom: 10 }}>{t("secretCreatedBody")}</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <code style={{ flex: 1, fontSize: 13, padding: 10, background: "var(--bg-elev, #f3f4f6)", borderRadius: 6, wordBreak: "break-all" }}>
              {createdSecret}
            </code>
            <button className="btn btn-ghost" onClick={() => copy(createdSecret)} title={t("copy")}>
              <Icon name="link" size={14} />
            </button>
          </div>
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setCreatedSecret(null)}>
            {t("done")}
          </button>
        </Modal>
      )}
    </>
  );
}
