"use client";

import { useState } from "react";
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
        setError(data.error ?? "Couldn't read a transaction from that text — try pasting the full SMS.");
      }
    } catch {
      setError("Could not reach the AI service. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleSave() {
    if (!parsed) return;
    const today = new Date().toISOString().slice(0, 10);
    if (parsed.type === "income") {
      addIncome({
        source: parsed.payee || "Income",
        category: INCOME_CATEGORIES.includes(parsed.category) ? parsed.category : "Other",
        date: today,
        amount: parsed.amount,
        recurring: "None",
      });
      toast(`Income of ${parsed.amount} added`, "plus");
    } else {
      addExpense({
        merchant: parsed.payee || "Expense",
        category: EXPENSE_CATS.includes(parsed.category) ? parsed.category : "Other",
        date: today,
        amount: parsed.amount,
        account: accounts[0]?.name ?? "Cash",
        method: "Mobile Money",
        tags: parsed.note ? [parsed.note] : [],
        recurring: false,
      });
      toast(`Expense of ${parsed.amount} added`, "plus");
    }
    onClose();
  }

  return (
    <Modal title="Import from SMS" onClose={onClose}>
      <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 12 }}>
        Paste a bank or mobile-money SMS (EcoCash, InnBucks, ZB, CBZ…) and the AI will extract the transaction.
      </p>
      <textarea
        value={sms}
        onChange={(e) => setSms(e.target.value)}
        placeholder={"e.g. EcoCash: You sent $12.50 to Tendai Moyo. Ref: MP240611.1832.A12345. New balance $148.20"}
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
            <span style={{ color: "var(--ink-500)" }}>Type</span>
            <span className={"badge " + (parsed.type === "income" ? "badge-green" : "badge-red")}>{parsed.type}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--ink-500)" }}>Amount</span>
            <strong>{parsed.amount}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--ink-500)" }}>{parsed.type === "income" ? "From" : "Paid to"}</span>
            <strong>{parsed.payee}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--ink-500)" }}>Category</span>
            <span className="chip">{parsed.category}</span>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        {parsed ? (
          <>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setParsed(null)}>
              <Icon name="x" size={14} style={{ marginRight: 6 }} /> Re-parse
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
              <Icon name="check" size={14} style={{ marginRight: 6 }} /> Add Entry
            </button>
          </>
        ) : (
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleParse} disabled={busy || !sms.trim()}>
            <Icon name="sparkles" size={14} style={{ marginRight: 6 }} />
            {busy ? "Reading SMS…" : "Extract Transaction"}
          </button>
        )}
      </div>
    </Modal>
  );
}
