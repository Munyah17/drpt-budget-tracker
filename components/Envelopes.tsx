"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { fmt } from "@/lib/format";
import Icon from "./Icon";

const KEY = "drpt-envelopes";

interface Envelope {
  id: number;
  name: string;
  amount: number;
}

/**
 * Payday envelopes — split the month's income into named pots
 * (bills, food, savings…). Warns when the plan overshoots income.
 */
export default function Envelopes() {
  const t = useTranslations("Pages.components");
  const { income } = useAppData();
  const [envelopes, setEnvelopes] = useState<Envelope[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as Envelope[]) : [];
    } catch {
      return [];
    }
  });
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  function save(next: Envelope[]) {
    setEnvelopes(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }

  function add() {
    const amt = parseFloat(amount);
    if (!name.trim() || !amt || amt <= 0) return;
    save([...envelopes, { id: Date.now(), name: name.trim(), amount: amt }]);
    setName("");
    setAmount("");
  }

  // this month's income = the pot to allocate
  const now = new Date();
  const inMonth = (d: string) => {
    const t = new Date(d);
    return t.getMonth() === now.getMonth() && t.getFullYear() === now.getFullYear();
  };
  const pot = income.filter((i) => inMonth(i.date)).reduce((s, i) => s + i.amount, 0);
  const allocated = envelopes.reduce((s, e) => s + e.amount, 0);
  const left = pot - allocated;
  const over = left < 0;

  return (
    <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
      <div className="card-head" style={{ marginBottom: 12 }}>
        <h3>{t("envelopes_title")}</h3>
        <span className="chip">{t("envelopes_toAllocate", { amount: fmt(pot) })}</span>
      </div>

      {envelopes.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 12 }}>
          {t("envelopes_empty")}
        </p>
      )}

      {envelopes.map((e) => (
        <div
          key={e.id}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--card-border)", fontSize: 13.5 }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="wallet" size={14} style={{ color: "var(--rose-600)" }} /> {e.name}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <strong>{fmt(e.amount)}</strong>
            <button className="btn btn-ghost btn-sm" data-tip={t("envelopes_remove")} onClick={() => save(envelopes.filter((x) => x.id !== e.id))}>
              <Icon name="trash-2" size={13} />
            </button>
          </span>
        </div>
      ))}

      {envelopes.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 13.5, fontWeight: 700, color: over ? "var(--red)" : "var(--green)" }}>
          <span>{over ? t("envelopes_over") : t("envelopes_left")}</span>
          <span>{fmt(Math.abs(left))}</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          type="text"
          placeholder={t("envelopes_phName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: 1, padding: "10px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)", fontSize: 13 }}
        />
        <input
          type="number"
          placeholder={t("envelopes_phAmount")}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ width: 110, padding: "10px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)", fontSize: 13 }}
        />
        <button className="btn btn-primary" onClick={add} disabled={!name.trim() || !amount}>
          <Icon name="plus" size={14} />
        </button>
      </div>
    </div>
  );
}
