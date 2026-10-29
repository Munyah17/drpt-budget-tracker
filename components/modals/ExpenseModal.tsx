"use client";
import { useTranslations } from "next-intl";
import { sym } from "@/lib/format";

import { FormEvent, useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { ACCOUNTS, EXPENSE_CATS, PAYMENT_METHODS } from "@/lib/data";
import { ExpenseEntry } from "@/lib/types";
import Modal from "@/components/Modal";
import Icon from "@/components/Icon";

export default function ExpenseModal({ editing, onClose }: { editing?: ExpenseEntry; onClose: () => void }) {
  const t = useTranslations("Pages.components");
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
      toast(t("exp_toastUpdated"));
    } else {
      addExpense(data);
      toast(t("exp_toastAdded"));
    }
    onClose();
  }

  return (
    <Modal title={editing ? t("exp_titleEdit") : t("exp_titleAdd")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>{t("exp_merchant")}</label>
          <input required value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder={t("exp_phMerchant")} />
        </div>
        <div className="field">
          <label>{t("exp_category")}</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {EXPENSE_CATS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{t("exp_amount", { sym: sym() })}</label>
          <input required type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div className="field">
          <label>{t("exp_date")}</label>
          <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>{t("exp_account")}</label>
          <select value={account} onChange={(e) => setAccount(e.target.value)}>
            {ACCOUNTS.map((a) => (
              <option key={a.name}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{t("exp_method")}</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{t("exp_receipt")}</label>
          <div className="upload-box">
            <Icon name="upload-cloud" size={22} />
            <div>
              {t("exp_upload")}
              <br />
              <span style={{ fontSize: 11 }}>{t("exp_uploadHint")}</span>
            </div>
          </div>
        </div>
        <label className="remember" style={{ marginBottom: 16 }}>
          <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} style={{ accentColor: "var(--rose-500)" }} />
          {t("exp_recurring")}
        </label>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">
          {editing ? t("exp_saveChanges") : t("exp_save")}
        </button>
      </form>
    </Modal>
  );
}
