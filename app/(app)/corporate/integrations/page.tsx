"use client";

import { useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";

interface Integration {
  name: string;
  desc: string;
  category: "Accounting & ERP" | "Payments" | "Government & Tax" | "HR & Payroll" | "Productivity";
  icon: string;
  connected: boolean;
}

const INTEGRATIONS: Integration[] = [
  { name: "SAP", desc: "Sync employees, cost centres and payroll journals", category: "Accounting & ERP", icon: "building-2", connected: false },
  { name: "QuickBooks", desc: "Export payroll entries and expenses to your ledger", category: "Accounting & ERP", icon: "book", connected: false },
  { name: "Loyverse", desc: "Point-of-sale staff shifts and sales data", category: "Accounting & ERP", icon: "shopping-cart", connected: false },
  { name: "Microsoft 365", desc: "Single sign-on and directory sync via Entra ID", category: "Productivity", icon: "briefcase", connected: true },
  { name: "ZIMRA FDMS", desc: "Fiscal device receipts and real-time tax filing", category: "Government & Tax", icon: "landmark", connected: false },
  { name: "ZIMRA TaRMS", desc: "Tax account registration and return submissions", category: "Government & Tax", icon: "shield", connected: false },
  { name: "NSSA", desc: "Statutory social security submissions for Zimbabwe", category: "Government & Tax", icon: "shield", connected: false },
  { name: "Paynow", desc: "Collect payroll deductions and disbursements in Zimbabwe", category: "Payments", icon: "dollar-sign", connected: false },
  { name: "EcoCash", desc: "Mobile money disbursements to employee wallets", category: "Payments", icon: "smartphone", connected: false },
  { name: "Zimswitch", desc: "Zimbabwean card settlement and ZIPIT transfers", category: "Payments", icon: "credit-card", connected: false },
  { name: "Stripe", desc: "International card payments and payouts", category: "Payments", icon: "credit-card", connected: true },
  { name: "PayPal", desc: "Pay vendors and contractors via PayPal", category: "Payments", icon: "wallet", connected: false },
  { name: "Wise", desc: "Low-cost international salary payments", category: "Payments", icon: "send", connected: false },
  { name: "Cash App", desc: "US-based instant peer payments", category: "Payments", icon: "banknote", connected: false },
];

const CATEGORIES = ["All", "Accounting & ERP", "Payments", "Government & Tax", "HR & Payroll", "Productivity"];

export default function IntegrationsPage() {
  const { toast } = useAppData();
  const [items, setItems] = useState<Integration[]>(INTEGRATIONS);
  const [category, setCategory] = useState("All");
  const [connecting, setConnecting] = useState<Integration | null>(null);
  const [apiKey, setApiKey] = useState("");

  const filtered = useMemo(
    () => items.filter((i) => category === "All" || i.category === category),
    [items, category]
  );

  const connect = () => {
    if (!connecting) return;
    setItems((prev) => prev.map((i) => (i.name === connecting.name ? { ...i, connected: true } : i)));
    toast(`${connecting.name} connected`, "check-circle");
    setConnecting(null);
    setApiKey("");
  };

  const disconnect = (i: Integration) => {
    setItems((prev) => prev.map((x) => (x.name === i.name ? { ...x, connected: false } : x)));
    toast(`${i.name} disconnected`, "x");
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Integrations</h2>
          <p className="section-sub">Connect authorised third-party systems — credentials are encrypted</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`btn ${category === c ? "btn-primary" : "btn-ghost"}`}
            style={{ padding: "6px 14px", fontSize: 13 }}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-3">
        {filtered.map((i) => (
          <div key={i.name} className="glass-card card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--pink-100)", color: "var(--rose-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={i.icon} size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{i.name}</div>
                <div style={{ fontSize: 11, color: "var(--ink-500)" }}>{i.category}</div>
              </div>
              {i.connected && <span className="badge badge-green" style={{ marginLeft: "auto" }}>Connected</span>}
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-500)", flex: 1 }}>{i.desc}</div>
            {i.connected ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => toast(`${i.name} settings opened`, "settings")}>Configure</button>
                <button className="btn btn-ghost" style={{ color: "var(--red)" }} onClick={() => disconnect(i)}>Disconnect</button>
              </div>
            ) : (
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => { setConnecting(i); setApiKey(""); }}>
                <Icon name="plug" size={14} style={{ marginRight: 6 }} />
                Connect
              </button>
            )}
          </div>
        ))}
      </div>

      {connecting && (
        <Modal title={`Connect ${connecting.name}`} onClose={() => setConnecting(null)}>
          <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 12 }}>
            Authorise {connecting.name} to exchange data with your organisation. Credentials are stored encrypted and never shown again.
          </p>
          <div className="field">
            <label>API key or Client ID</label>
            <input type="password" placeholder={`${connecting.name} API key`} value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={connect} disabled={!apiKey.trim()}>
            Authorise Connection
          </button>
        </Modal>
      )}
    </>
  );
}
