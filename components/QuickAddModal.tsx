"use client";
import { useTranslations } from "next-intl";
import { sym } from "@/lib/format";

import { FormEvent, useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { ACCOUNTS, EXPENSE_CATS, INCOME_CATEGORIES, PAYMENT_METHODS } from "@/lib/data";
import Modal from "./Modal";

export default function QuickAddModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Pages.components");
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
    toast(t("quickAdd_toastSaved"));
    onClose();
  }

  const tabs = (
    <div className="modal-tabs">
      <button type="button" className={"tab-btn" + (type === "expense" ? " active" : "")} onClick={() => switchType("expense")}>
        {t("quickAdd_expense")}
      </button>
      <button type="button" className={"tab-btn" + (type === "income" ? " active" : "")} onClick={() => switchType("income")}>
        {t("quickAdd_income")}
      </button>
    </div>
  );

  return (
    <Modal title={t("quickAdd_title")} onClose={onClose} tabs={tabs}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>{t("quickAdd_amount", { sym: sym() })}</label>
          <input required type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="field">
          <label>{t("quickAdd_category")}</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {(type === "income" ? INCOME_CATEGORIES : EXPENSE_CATS).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{t("quickAdd_desc")}</label>
          <input placeholder={t("quickAdd_phDesc")} value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div className="field">
          <label>{t("quickAdd_date")}</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>{t("quickAdd_method")}</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{t("quickAdd_account")}</label>
          <select value={account} onChange={(e) => setAccount(e.target.value)}>
            {ACCOUNTS.map((a) => (
              <option key={a.name}>{a.name}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">
          {t("quickAdd_save")}
        </button>
      </form>
    </Modal>
  );
}
