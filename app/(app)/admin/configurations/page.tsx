"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { CURRENCIES } from "@/lib/data";
import { DEFAULT_CURRENCY, currencySymbol } from "@/lib/format";

export default function ConfigurationsPage() {
  const t = useTranslations("Pages.adm_configurations");
  const { toast } = useAppData();
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [language, setLanguage] = useState("English (UK)");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
      </div>

      <div className="glass-card card-pad" style={{ maxWidth: 600 }}>
        <div className="settings-row">
          <div>
            <div className="label">{t("defaultCurrency")}</div>
            <div className="sub">{t("defaultCurrencySub")}</div>
          </div>
          <select className="settings-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c} ({currencySymbol(c)})</option>
            ))}
          </select>
        </div>
        <div className="settings-row">
          <div>
            <div className="label">{t("defaultLanguage")}</div>
            <div className="sub">{t("defaultLanguageSub")}</div>
          </div>
          <select className="settings-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option>English (UK)</option>
            <option>English (US)</option>
          </select>
        </div>
        <div className="settings-row">
          <div>
            <div className="label">{t("dateFormat")}</div>
            <div className="sub">{t("dateFormatSub")}</div>
          </div>
          <select className="settings-select" value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
            <option>DD/MM/YYYY</option>
            <option>MM/DD/YYYY</option>
          </select>
        </div>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => toast(t("savedToast"), "check-circle")}>{t("saveButton")}</button>
      </div>
    </>
  );
}
