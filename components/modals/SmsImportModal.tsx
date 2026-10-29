"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/Modal";
import Icon from "@/components/Icon";
import { useAppData } from "@/lib/AppDataContext";
import { EXPENSE_CATS, INCOME_CATEGORIES } from "@/lib/data";

interface ParsedEntry {
  type: "expense" | "income";
  amount: number;
  payee: string;
  category: string;
  note?: string | null;
}

/**
 * Paste a bank/EcoCash SMS and let Groq extract the transaction,
 * then confirm and log it as a real income or expense entry.
 */
export default function SmsImportModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Pages.components");
  const { addExpense, addIncome, accounts, toast } = useAppData();
  const [sms, setSms] = useState("");
  const [busy, setBusy] = useState(false);
  const [parsed, setParsed] = useState<ParsedEntry | null>(null);
  const [error, setError] = useState("");

  async function handleParse() {
    if (!sms.trim() || busy) return;
    setBusy(true);
    setError("");
    setParsed(null);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "parse", messages: [{ role: "user", content: sms }] }),
      });
      const data = await res.json();
      if (data.entry && typeof data.entry.amount === "number" && data.entry.amount > 0) {
        setParsed(data.entry as ParsedEntry);
      } else {
        setError(data.error ?? t("sms_errParse"));
      }
    } catch {
      setError(t("sms_errService"));
    } finally {
      setBusy(false);
    }
  }

  function handleSave() {
    if (!parsed) return;
    const today = new Date().toISOString().slice(0, 10);
    if (parsed.type === "income") {
      addIncome({
        source: parsed.payee || t("sms_fallbackIncome"),
        category: INCOME_CATEGORIES.includes(parsed.category) ? parsed.category : "Other",
        date: today,
        amount: parsed.amount,
        recurring: "None",
      });
      toast(t("sms_toastIncome", { amount: parsed.amount }), "plus");
    } else {
      addExpense({
        merchant: parsed.payee || t("sms_fallbackExpense"),
        category: EXPENSE_CATS.includes(parsed.category) ? parsed.category : "Other",
        date: today,
        amount: parsed.amount,
        account: accounts[0]?.name ?? "Cash",
        method: "Mobile Money",
        tags: parsed.note ? [parsed.note] : [],
        recurring: false,
      });
      toast(t("sms_toastExpense", { amount: parsed.amount }), "plus");
    }
    onClose();
  }

  return (
    <Modal title={t("sms_title")} onClose={onClose}>
      <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 12 }}>
        {t("sms_desc")}
      </p>
      <textarea
        value={sms}
        onChange={(e) => setSms(e.target.value)}
        placeholder={t("sms_ph")}
        rows={4}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--card-border)",
          fontFamily: "inherit",
          fontSize: 13,
          resize: "vertical",
        }}
      />

      {error && (
        <p style={{ color: "var(--red)", fontSize: 13, marginTop: 10 }}>{error}</p>
      )}

      {parsed && (
        <div
          className="glass-card"
          style={{ marginTop: 12, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6, fontSize: 13.5 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--ink-500)" }}>{t("sms_lblType")}</span>
            <span className={"badge " + (parsed.type === "income" ? "badge-green" : "badge-red")}>{t("sms_type_" + parsed.type)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--ink-500)" }}>{t("sms_lblAmount")}</span>
            <strong>{parsed.amount}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--ink-500)" }}>{parsed.type === "income" ? t("sms_lblFrom") : t("sms_lblPaidTo")}</span>
            <strong>{parsed.payee}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--ink-500)" }}>{t("sms_lblCategory")}</span>
            <span className="chip">{parsed.category}</span>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        {parsed ? (
          <>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setParsed(null)}>
              <Icon name="x" size={14} style={{ marginRight: 6 }} /> {t("sms_reparse")}
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
              <Icon name="check" size={14} style={{ marginRight: 6 }} /> {t("sms_addEntry")}
            </button>
          </>
        ) : (
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleParse} disabled={busy || !sms.trim()}>
            <Icon name="sparkles" size={14} style={{ marginRight: 6 }} />
            {busy ? t("sms_busy") : t("sms_extract")}
          </button>
        )}
      </div>
    </Modal>
  );
}
