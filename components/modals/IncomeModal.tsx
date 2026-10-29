"use client";
import { useTranslations } from "next-intl";
import { sym } from "@/lib/format";

import { FormEvent, useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { INCOME_CATEGORIES } from "@/lib/data";
import { IncomeEntry } from "@/lib/types";
import Modal from "@/components/Modal";

export default function IncomeModal({ editing, onClose }: { editing?: IncomeEntry; onClose: () => void }) {
  const t = useTranslations("Pages.components");
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
      toast(t("inc_toastUpdated"));
    } else {
      addIncome(data);
      toast(t("inc_toastAdded"));
    }
    onClose();
  }

  return (
    <Modal title={editing ? t("inc_titleEdit") : t("inc_titleAdd")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>{t("inc_source")}</label>
          <input required value={source} onChange={(e) => setSource(e.target.value)} placeholder={t("inc_phSource")} />
        </div>
        <div className="field">
          <label>{t("inc_category")}</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {INCOME_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{t("inc_amount", { sym: sym() })}</label>
          <input required type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div className="field">
          <label>{t("inc_date")}</label>
          <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>{t("inc_recurring")}</label>
          <select value={recurring} onChange={(e) => setRecurring(e.target.value as IncomeEntry["recurring"])}>
            {(["None", "Weekly", "Monthly", "Yearly"] as const).map((c) => (
              <option key={c} value={c}>{t("recurring_" + c.toLowerCase())}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" style={{ width: "100%", marginTop: 6 }} type="submit">
          {editing ? t("inc_saveChanges") : t("inc_save")}
        </button>
      </form>
    </Modal>
  );
}
