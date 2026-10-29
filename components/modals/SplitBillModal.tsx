"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/Modal";
import Icon from "@/components/Icon";
import { useAppData } from "@/lib/AppDataContext";
import { fmt, sym } from "@/lib/format";
import { EXPENSE_CATS } from "@/lib/data";

/** Split a shared bill — computes each person's share and logs yours as an expense. */
export default function SplitBillModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Pages.components");
  const { addExpense, accounts, toast } = useAppData();
  const [label, setLabel] = useState("");
  const [total, setTotal] = useState("");
  const [people, setPeople] = useState(2);
  const [tipPct, setTipPct] = useState(0);
  const [category, setCategory] = useState("Food");

  const totalNum = parseFloat(total) || 0;
  const withTip = totalNum * (1 + tipPct / 100);
  const perPerson = people > 0 ? withTip / people : 0;

  function logShare() {
    if (perPerson <= 0) return;
    addExpense({
      merchant: label.trim() ? t("split_merchantShare", { label: label.trim() }) : t("split_merchantDefault"),
      category: EXPENSE_CATS.includes(category) ? category : "Other",
      date: new Date().toISOString().slice(0, 10),
      amount: Math.round(perPerson * 100) / 100,
      account: accounts[0]?.name ?? "Cash",
      method: "Card",
      tags: [t("split_tagWays", { count: people })],
      recurring: false,
    });
    toast(t("split_toast", { amount: fmt(perPerson) }), "check");
    onClose();
  }

  const field = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--card-border)",
    fontSize: 13.5,
    boxSizing: "border-box" as const,
  };

  return (
    <Modal title={t("split_title")} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="text"
          placeholder={t("split_phLabel")}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          style={field}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: "var(--ink-500)", display: "block", marginBottom: 4 }}>
              {t("split_total", { sym: sym() })}
            </label>
            <input type="number" min="0" step="0.01" value={total} onChange={(e) => setTotal(e.target.value)} style={field} />
          </div>
          <div style={{ width: 110 }}>
            <label style={{ fontSize: 12, color: "var(--ink-500)", display: "block", marginBottom: 4 }}>{t("split_people")}</label>
            <input
              type="number"
              min={1}
              max={30}
              value={people}
              onChange={(e) => setPeople(Math.max(1, parseInt(e.target.value) || 1))}
              style={field}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: "var(--ink-500)", display: "block", marginBottom: 4 }}>{t("split_tip")}</label>
            <input
              type="number"
              min={0}
              max={100}
              value={tipPct}
              onChange={(e) => setTipPct(Math.max(0, parseFloat(e.target.value) || 0))}
              style={field}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: "var(--ink-500)", display: "block", marginBottom: 4 }}>{t("split_category")}</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...field, background: "var(--card-solid)" }}>
              {EXPENSE_CATS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div
          className="glass-card"
          style={{ padding: "14px 16px", textAlign: "center", background: "var(--pink-100)", border: "none" }}
        >
          <div style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>
            {t("split_eachPays")}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--rose-600)", margin: "4px 0" }}>
            {fmt(perPerson)}
          </div>
          {tipPct > 0 && (
            <div style={{ fontSize: 12, color: "var(--ink-500)" }}>
              {t("split_inclTip", { pct: tipPct, amount: fmt(totalNum) })}
            </div>
          )}
        </div>

        <button className="btn btn-primary" onClick={logShare} disabled={perPerson <= 0}>
          <Icon name="check" size={15} style={{ marginRight: 6 }} /> {t("split_logBtn")}
        </button>
      </div>
    </Modal>
  );
}
