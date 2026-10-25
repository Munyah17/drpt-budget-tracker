"use client";
import { sym } from "@/lib/format";

import { FormEvent, useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { ACCOUNTS, EXPENSE_CATS, PAYMENT_METHODS } from "@/lib/data";
import { ExpenseEntry } from "@/lib/types";
import Modal from "@/components/Modal";
import Icon from "@/components/Icon";

export default function ExpenseModal({ editing, onClose }: { editing?: ExpenseEntry; onClose: () => void }) {
  const { addExpense, updateExpense, toast } = useAppData();
  const [merchant, setMerchant] = useState(editing?.merchant || "");
  const [category, setCategory] = useState(editing?.category || EXPENSE_CATS[0]);
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [date, setDate] = useState(editing?.date || "2025-05-25");
  const [account, setAccount] = useState(editing?.account || ACCOUNTS[0].name);
  const [method, setMethod] = useState(editing?.method || PAYMENT_METHODS[0]);
  const [recurring, setRecurring] = useState(editing?.recurring || false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const data = { merchant, category, amount: parseFloat(amount), date, account, method, recurring, tags: [] as string[] };
    if (editing) {
      updateExpense(editing.id, data);
      toast("Expense updated");
    } else {
      addExpense(data);
      toast("Expense added");
    }
    onClose();
  }

  return (
    <Modal title={editing ? "Edit Expense" : "Add Expense"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Merchant</label>
          <input required value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="e.g. Tesco" />
        </div>
        <div className="field">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {EXPENSE_CATS.map((c) => (
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
          <label>Account</label>
          <select value={account} onChange={(e) => setAccount(e.target.value)}>
            {ACCOUNTS.map((a) => (
              <option key={a.name}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Payment Method</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Receipt</label>
          <div className="upload-box">
            <Icon name="upload-cloud" size={22} />
            <div>
              Upload receipt
              <br />
              <span style={{ fontSize: 11 }}>JPG, PNG or PDF</span>
            </div>
          </div>
        </div>
        <label className="remember" style={{ marginBottom: 16 }}>
          <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} style={{ accentColor: "var(--rose-500)" }} />
          Recurring transaction
        </label>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">
          {editing ? "Save Changes" : "Save Expense"}
        </button>
      </form>
    </Modal>
  );
}
