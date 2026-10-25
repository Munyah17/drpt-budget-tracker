"use client";
import { sym } from "@/lib/format";

import { FormEvent, useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { INCOME_CATEGORIES } from "@/lib/data";
import { IncomeEntry } from "@/lib/types";
import Modal from "@/components/Modal";

export default function IncomeModal({ editing, onClose }: { editing?: IncomeEntry; onClose: () => void }) {
  const { addIncome, updateIncome, toast } = useAppData();
  const [source, setSource] = useState(editing?.source || "");
  const [category, setCategory] = useState(editing?.category || INCOME_CATEGORIES[0]);
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [date, setDate] = useState(editing?.date || "2025-05-25");
  const [recurring, setRecurring] = useState<IncomeEntry["recurring"]>(editing?.recurring || "None");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const data = { source, category, amount: parseFloat(amount), date, recurring };
    if (editing) {
      updateIncome(editing.id, data);
      toast("Income updated");
    } else {
      addIncome(data);
      toast("Income added");
    }
    onClose();
  }

  return (
    <Modal title={editing ? "Edit Income" : "Add Income"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Source</label>
          <input required value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. NHS Salary" />
        </div>
        <div className="field">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {INCOME_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Amount ({sym()})</label>
          <input required type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div className="field">
          <label>Date</label>
          <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Recurring</label>
          <select value={recurring} onChange={(e) => setRecurring(e.target.value as IncomeEntry["recurring"])}>
            {(["None", "Weekly", "Monthly", "Yearly"] as const).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" style={{ width: "100%", marginTop: 6 }} type="submit">
          {editing ? "Save Changes" : "Add Income"}
        </button>
      </form>
    </Modal>
  );
}
