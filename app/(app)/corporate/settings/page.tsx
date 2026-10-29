"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { CURRENCIES } from "@/lib/data";
import { currencySymbol } from "@/lib/format";
import Icon from "@/components/Icon";

export default function CorporateSettingsPage() {
  const t = useTranslations("Pages.corp_settings");
  const { toast, currency, setCurrency } = useAppData();
  const [companyName, setCompanyName] = useState("Acme Corporation");
  const [contactEmail, setContactEmail] = useState("hr@acme.com");
  const [payrollDay, setPayrollDay] = useState("28");

  const handleSave = () => {
    toast(t("toastSaved"), "check-circle");
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
      </div>

      <div className="glass-card card-pad" style={{ maxWidth: 560 }}>
        <div className="field">
          <label htmlFor="company-name">{t("fieldCompanyName")}</label>
          <input id="company-name" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="contact-email">{t("fieldContactEmail")}</label>
          <input id="contact-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="payroll-day">{t("fieldPayrollDay")}</label>
          <input id="payroll-day" type="number" min="1" max="28" value={payrollDay} onChange={(e) => setPayrollDay(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="currency">{t("fieldCurrency")}</label>
          <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c} ({currencySymbol(c)})</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          <Icon name="check" size={16} style={{ marginRight: 8 }} />
          {t("saveChanges")}
        </button>
      </div>
    </>
  );
}
