"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import { useCrud } from "@/lib/useCrud";

interface ApiKey {
  id: string;
  label: string;
  prefix: string;
  scopes: string;
  created: string;
  lastUsed: string;
  status: string;
}

interface Webhook {
  url: string;
  events: string;
  status: string;
}

const KEYS_DATA: ApiKey[] = [];

const WEBHOOKS_DATA: Webhook[] = [];

const SCOPES = ["employees:read", "employees:write", "payroll:read", "payroll:write", "leave:read", "leave:write", "reports:read"];

export default function DeveloperPage() {
  const t = useTranslations("Pages.corp_developer");
  const { toast } = useAppData();
  const keys = useCrud(KEYS_DATA, t("entityApiKey"));
  const webhooks = useCrud(WEBHOOKS_DATA, t("entityWebhook"));
  const [createOpen, setCreateOpen] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(["employees:read"]));

  const toggleScope = (s: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });

  const generateKey = () => {
    const full = `wellspend_live_${Array.from(crypto.getRandomValues(new Uint8Array(24))).map((b) => b.toString(16).padStart(2, "0")).join("")}`;
    keys.setItems((prev) => [...prev, {
      id: String(Date.now()),
      label: label || t("untitledKey"),
      prefix: full.slice(0, 12),
      scopes: [...selected].join(", ") || t("scopesNone"),
      created: new Date().toISOString().slice(0, 10),
      lastUsed: t("never"),
      status: "Active",
    }]);
    setNewKey(full);
    setCreateOpen(false);
    setLabel("");
    toast(t("toastCreated"), "key");
  };

  const revoke = (k: ApiKey) => {
    keys.setItems((prev) => prev.map((x) => (x.id === k.id ? { ...x, status: "Revoked" } : x)));
    toast(t("toastRevoked", { label: k.label }), "x-circle");
  };

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard?.writeText(newKey).catch(() => {});
      toast(t("toastCopied"), "check-circle");
    }
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          {t("createApiKey")}
        </button>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div className="card-head"><h3>{t("apiKeysHeading")}</h3></div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thLabel")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thKey")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thScopes")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thCreated")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thLastUsed")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thActions")}</th>
            </tr>
          </thead>
          <tbody>
            {keys.items.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  {t("emptyKeys")}
                </td>
              </tr>
            )}
            {keys.items.map((k, idx) => (
              <tr key={k.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{k.label}</td>
                <td style={{ padding: "12px 8px", fontSize: 13, fontFamily: "monospace" }}>{k.prefix}…</td>
                <td style={{ padding: "12px 8px", fontSize: 12 }}>{k.scopes}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{k.created}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{k.lastUsed}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${k.status === "Active" ? "badge-green" : "badge-red"}`}>{k.status === "Active" ? t("statusActive") : t("statusRevoked")}</span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => keys.openModal("view", k, idx)}><Icon name="eye" size={14} style={{ marginRight: 4 }} />{t("view")}</button>
                  {k.status === "Active" && (
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--red)" }} onClick={() => revoke(k)}><Icon name="x-circle" size={14} style={{ marginRight: 4 }} />{t("revoke")}</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <h3>{t("webhooksHeading")}</h3>
          <button className="btn btn-ghost" onClick={() => webhooks.openModal("create")}>
            <Icon name="plus" size={14} style={{ marginRight: 6 }} />
            {t("addWebhook")}
          </button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thEndpoint")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thEvents")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thActions")}</th>
            </tr>
          </thead>
          <tbody>
            {webhooks.items.map((w, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontSize: 13, fontFamily: "monospace" }}>{w.url}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{w.events}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${w.status === "Active" ? "badge-green" : "badge-amber"}`}>{w.status}</span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => webhooks.openModal("edit", w, idx)}><Icon name="edit" size={14} style={{ marginRight: 4 }} />{t("edit")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-card card-pad" style={{ maxWidth: 560 }}>
        <div className="card-head"><h3>{t("apiAccessHeading")}</h3></div>
        <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 12 }}>
          {t.rich("apiAccessDesc", {
            baseUrl: "https://api.wellspend.example/v1",
            authHeader: "Authorization: Bearer <key>",
            code: (chunks) => <code>{chunks}</code>,
          })}
        </p>
        <p style={{ fontSize: 12, color: "var(--ink-500)" }}>
          {t("apiAccessNote")}
        </p>
      </div>

      {createOpen && (
        <Modal title={t("createApiKey")} onClose={() => setCreateOpen(false)}>
          <div className="field">
            <label>{t("thLabel")}</label>
            <input type="text" placeholder={t("labelPlaceholder")} value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="field">
            <label>{t("thScopes")}</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SCOPES.map((s) => (
                <label key={s} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "4px 10px", borderRadius: 999, background: selected.has(s) ? "var(--pink-100)" : "var(--card-solid)", cursor: "pointer" }}>
                  <input type="checkbox" checked={selected.has(s)} onChange={() => toggleScope(s)} />
                  {s}
                </label>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={generateKey}>
            <Icon name="key" size={16} style={{ marginRight: 8 }} />
            {t("generateKey")}
          </button>
        </Modal>
      )}

      {newKey && (
        <Modal title={t("keyCreatedTitle")} onClose={() => setNewKey(null)}>
          <p style={{ fontSize: 13, marginBottom: 8 }}>{t("copyKeyNote")}</p>
          <div style={{ padding: 12, borderRadius: "var(--radius-sm)", background: "var(--card-solid)", fontFamily: "monospace", fontSize: 12, wordBreak: "break-all", marginBottom: 12 }}>
            {newKey}
          </div>
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={copyKey}>{t("copyToClipboard")}</button>
        </Modal>
      )}

      {keys.modalNode}
      {webhooks.modalNode}
    </>
  );
}
