"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";

interface Integration {
  name: string;
  desc: string;
  category: "accounting" | "payments" | "government" | "hr" | "productivity";
  icon: string;
  connected: boolean;
}

const INTEGRATIONS: Integration[] = [
  { name: "SAP", desc: "sap", category: "accounting", icon: "building-2", connected: false },
  { name: "QuickBooks", desc: "quickbooks", category: "accounting", icon: "book", connected: false },
  { name: "Loyverse", desc: "loyverse", category: "accounting", icon: "shopping-cart", connected: false },
  { name: "Microsoft 365", desc: "microsoft365", category: "productivity", icon: "briefcase", connected: true },
  { name: "ZIMRA FDMS", desc: "zimraFdms", category: "government", icon: "landmark", connected: false },
  { name: "ZIMRA TaRMS", desc: "zimraTarms", category: "government", icon: "shield", connected: false },
  { name: "NSSA", desc: "nssa", category: "government", icon: "shield", connected: false },
  { name: "Paynow", desc: "paynow", category: "payments", icon: "dollar-sign", connected: false },
  { name: "EcoCash", desc: "ecocash", category: "payments", icon: "smartphone", connected: false },
  { name: "Zimswitch", desc: "zimswitch", category: "payments", icon: "credit-card", connected: false },
  { name: "Stripe", desc: "stripe", category: "payments", icon: "credit-card", connected: true },
  { name: "PayPal", desc: "paypal", category: "payments", icon: "wallet", connected: false },
  { name: "Wise", desc: "wise", category: "payments", icon: "send", connected: false },
  { name: "Cash App", desc: "cashApp", category: "payments", icon: "banknote", connected: false },
];

const CATEGORIES = ["all", "accounting", "payments", "government", "hr", "productivity"] as const;

export default function IntegrationsPage() {
  const t = useTranslations("Pages.corp_integrations");
  const { toast } = useAppData();
  const [items, setItems] = useState<Integration[]>(INTEGRATIONS);
  const [category, setCategory] = useState("all");
  const [connecting, setConnecting] = useState<Integration | null>(null);
  const [apiKey, setApiKey] = useState("");

  const filtered = useMemo(
    () => items.filter((i) => category === "all" || i.category === category),
    [items, category]
  );

  const connect = () => {
    if (!connecting) return;
    setItems((prev) => prev.map((i) => (i.name === connecting.name ? { ...i, connected: true } : i)));
    toast(t("toastConnected", { name: connecting.name }), "check-circle");
    setConnecting(null);
    setApiKey("");
  };

  const disconnect = (i: Integration) => {
    setItems((prev) => prev.map((x) => (x.name === i.name ? { ...x, connected: false } : x)));
    toast(t("toastDisconnected", { name: i.name }), "x");
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
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
            {t(`cat.${c}`)}
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
                <div style={{ fontSize: 11, color: "var(--ink-500)" }}>{t(`cat.${i.category}`)}</div>
              </div>
              {i.connected && <span className="badge badge-green" style={{ marginLeft: "auto" }}>{t("connected")}</span>}
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-500)", flex: 1 }}>{t(`desc.${i.desc}`)}</div>
            {i.connected ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => toast(t("toastSettings", { name: i.name }), "settings")}>{t("configure")}</button>
                <button className="btn btn-ghost" style={{ color: "var(--red)" }} onClick={() => disconnect(i)}>{t("disconnect")}</button>
              </div>
            ) : (
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => { setConnecting(i); setApiKey(""); }}>
                <Icon name="plug" size={14} style={{ marginRight: 6 }} />
                {t("connect")}
              </button>
            )}
          </div>
        ))}
      </div>

      {connecting && (
        <Modal title={t("connectTitle", { name: connecting.name })} onClose={() => setConnecting(null)}>
          <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 12 }}>
            {t("authoriseDesc", { name: connecting.name })}
          </p>
          <div className="field">
            <label>{t("fieldApiKey")}</label>
            <input type="password" placeholder={t("apiKeyPlaceholder", { name: connecting.name })} value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={connect} disabled={!apiKey.trim()}>
            {t("authoriseConnection")}
          </button>
        </Modal>
      )}
    </>
  );
}
