"use client";

import { useState } from "react";
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
  const { toast } = useAppData();
  const keys = useCrud(KEYS_DATA, "API Key");
  const webhooks = useCrud(WEBHOOKS_DATA, "Webhook");
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
      label: label || "Untitled key",
      prefix: full.slice(0, 12),
      scopes: [...selected].join(", ") || "none",
      created: new Date().toISOString().slice(0, 10),
      lastUsed: "Never",
      status: "Active",
    }]);
    setNewKey(full);
    setCreateOpen(false);
    setLabel("");
    toast("API key created — copy it now, it won't be shown again", "key");
  };

  const revoke = (k: ApiKey) => {
    keys.setItems((prev) => prev.map((x) => (x.id === k.id ? { ...x, status: "Revoked" } : x)));
    toast(`${k.label} revoked`, "x-circle");
  };

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard?.writeText(newKey).catch(() => {});
      toast("API key copied to clipboard", "check-circle");
    }
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Developer &amp; API</h2>
          <p className="section-sub">API keys, scopes and webhooks for authorised integrations</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Create API Key
        </button>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div className="card-head"><h3>API Keys</h3></div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Label</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Key</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Scopes</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Created</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Last Used</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.items.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No API keys yet.
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
                  <span className={`badge ${k.status === "Active" ? "badge-green" : "badge-red"}`}>{k.status}</span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => keys.openModal("view", k, idx)}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  {k.status === "Active" && (
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--red)" }} onClick={() => revoke(k)}><Icon name="x-circle" size={14} style={{ marginRight: 4 }} />Revoke</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <h3>Webhooks</h3>
          <button className="btn btn-ghost" onClick={() => webhooks.openModal("create")}>
            <Icon name="plus" size={14} style={{ marginRight: 6 }} />
            Add Webhook
          </button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Endpoint URL</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Events</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
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
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => webhooks.openModal("edit", w, idx)}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-card card-pad" style={{ maxWidth: 560 }}>
        <div className="card-head"><h3>API Access</h3></div>
        <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 12 }}>
          Base URL: <code>https://api.wellspend.example/v1</code> — authenticate with <code>Authorization: Bearer &lt;key&gt;</code>. Requests are rate-limited per key and every call is recorded in the audit log.
        </p>
        <p style={{ fontSize: 12, color: "var(--ink-500)" }}>
          Note: for production, issue and verify keys server-side; this page is a UI demo and keys are held in memory only.
        </p>
      </div>

      {createOpen && (
        <Modal title="Create API Key" onClose={() => setCreateOpen(false)}>
          <div className="field">
            <label>Label</label>
            <input type="text" placeholder="e.g. Payroll sync" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="field">
            <label>Scopes</label>
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
            Generate Key
          </button>
        </Modal>
      )}

      {newKey && (
        <Modal title="API Key Created" onClose={() => setNewKey(null)}>
          <p style={{ fontSize: 13, marginBottom: 8 }}>Copy this key now — it will never be shown again:</p>
          <div style={{ padding: 12, borderRadius: "var(--radius-sm)", background: "var(--card-solid)", fontFamily: "monospace", fontSize: 12, wordBreak: "break-all", marginBottom: 12 }}>
            {newKey}
          </div>
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={copyKey}>Copy to Clipboard</button>
        </Modal>
      )}

      {keys.modalNode}
      {webhooks.modalNode}
    </>
  );
}
