"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { CURRENCIES } from "@/lib/data";
import { currencySymbol } from "@/lib/format";
import Icon from "@/components/Icon";

const THEME_PRESETS = [
  { name: "Default Rose", color: "#c81057" },
  { name: "Corporate Blue", color: "#1e40af" },
  { name: "Professional Green", color: "#059669" },
  { name: "Elegant Purple", color: "#7c3aed" },
  { name: "Modern Teal", color: "#0d9488" },
  { name: "Warm Orange", color: "#ea580c" },
  { name: "Charcoal", color: "#374151" },
  { name: "Navy", color: "#1e3a8a" },
];

export default function CorporateSettingsPage() {
  const t = useTranslations("Pages.corp_settings");
  const { toast, currency, setCurrency, corporateSettings, updateCorporateTheme } = useAppData();
  const [companyName, setCompanyName] = useState("Acme Corporation");
  const [contactEmail, setContactEmail] = useState("hr@acme.com");
  const [payrollDay, setPayrollDay] = useState("28");
  const [selectedColor, setSelectedColor] = useState<string>(corporateSettings?.themeColor ?? "#c81057");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (corporateSettings?.themeColor) {
      setSelectedColor(corporateSettings.themeColor);
    }
  }, [corporateSettings?.themeColor]);

  const handleSave = async () => {
    setSaving(true);
    const success = await updateCorporateTheme(selectedColor);
    setSaving(false);
    if (success) {
      toast(t("toastSaved"), "check-circle");
    } else {
      toast(t("toastError"), "alert-circle");
    }
  };

  const handleReset = async () => {
    setSelectedColor("#c81057");
    await updateCorporateTheme("#c81057");
    toast(t("toastReset"), "check-circle");
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
      </div>

      <div className="glass-card card-pad" style={{ maxWidth: 560, marginBottom: 20 }}>
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
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Icon name="check" size={16} style={{ marginRight: 8 }} />
          {saving ? t("saving") : t("saveChanges")}
        </button>
      </div>

      <div className="glass-card card-pad" style={{ maxWidth: 560 }}>
        <h3 style={{ marginBottom: 16, fontSize: "1.1rem", fontWeight: 600 }}>{t("themeColor")}</h3>
        <p className="text-muted" style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>{t("themeColorDesc")}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.color}
              onClick={() => setSelectedColor(preset.color)}
              style={{
                padding: "0.75rem",
                border: selectedColor === preset.color ? "2px solid var(--rose-500)" : "1px solid var(--border)",
                borderRadius: "8px",
                background: "var(--surface)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "40px",
                  background: preset.color,
                  borderRadius: "4px",
                  marginBottom: "0.5rem",
                }}
              />
              <div style={{ fontSize: "0.75rem", fontWeight: 500 }}>{preset.name}</div>
            </button>
          ))}
        </div>
        <div className="field">
          <label htmlFor="custom-color">{t("customColor")}</label>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="color"
              id="custom-color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              style={{ width: "60px", height: "40px", border: "none", borderRadius: "4px", cursor: "pointer" }}
            />
            <input
              type="text"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              placeholder="#c81057"
              style={{ flex: 1 }}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Icon name="check" size={16} style={{ marginRight: 8 }} />
            {saving ? t("saving") : t("saveTheme")}
          </button>
          <button className="btn btn-secondary" onClick={handleReset}>
            {t("resetDefault")}
          </button>
        </div>
      </div>
    </>
  );
}
