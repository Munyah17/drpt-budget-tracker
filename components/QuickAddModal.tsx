"use client";

import { FormEvent, useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { ACCOUNTS, EXPENSE_CATS, INCOME_CATEGORIES, PAYMENT_METHODS } from "@/lib/data";
import Modal from "./Modal";

export default function QuickAddModal({ onClose }: { onClose: () => void }) {
  const { addIncome, addExpense, toast } = useAppData();
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATS[0]);
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("2025-05-25");
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [account, setAccount] = useState(ACCOUNTS[0].name);

  function switchType(t: "expense" | "income") {
    setType(t);
    setCategory(t === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATS[0]);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (type === "income") {
      addIncome({ source: desc || category, category, date, amount: amt, recurring: "None" });
    } else {
      addExpense({ merchant: desc || category, category, date, amount: amt, account, method, tags: [], recurring: false });
    }
    toast("Transaction saved");
    onClose();
  }

  const tabs = (
    <div className="modal-tabs">
      <button type="button" className={"tab-btn" + (type === "expense" ? " active" : "")} onClick={() => switchType("expense")}>
        Expense
      </button>
      <button type="button" className={"tab-btn" + (type === "income" ? " active" : "")} onClick={() => switchType("income")}>
        Income
      </button>
    </div>
  );

  return (
    <Modal title="Add Transaction" onClose={onClose} tabs={tabs}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Amount (£)</label>
          <input required type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="field">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {(type === "income" ? INCOME_CATEGORIES : EXPENSE_CATS).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Description</label>
          <input placeholder="e.g. Fuel at Shell Station" value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
          <label>Account</label>
          <select value={account} onChange={(e) => setAccount(e.target.value)}>
            {ACCOUNTS.map((a) => (
              <option key={a.name}>{a.name}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">
          Save Transaction
        </button>
      </form>
    </Modal>
  );
}
