"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { CURRENCIES } from "@/lib/data";
import { DEFAULT_CURRENCY, currencySymbol } from "@/lib/format";

export default function AdminSettingsPage() {
  const t = useTranslations("Pages.adm_settings");
  const { toast } = useAppData();
  const [defaultCurrency, setDefaultCurrency] = useState(DEFAULT_CURRENCY);
  const [activeTab, setActiveTab] = useState<"general" | "security" | "payroll" | "billing" | "notifications">("general");

  const handleSaveSettings = () => {
    toast(t("settingsSaved"), "check-circle");
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid var(--card-border)" }}>
        <button
          className={`btn btn-ghost ${activeTab === "general" ? "active" : ""}`}
          onClick={() => setActiveTab("general")}
        >
          {t("tabGeneral")}</button>
        <button
          className={`btn btn-ghost ${activeTab === "security" ? "active" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          {t("tabSecurity")}</button>
        <button
          className={`btn btn-ghost ${activeTab === "payroll" ? "active" : ""}`}
          onClick={() => setActiveTab("payroll")}
        >
          {t("tabPayroll")}</button>
        <button
          className={`btn btn-ghost ${activeTab === "billing" ? "active" : ""}`}
          onClick={() => setActiveTab("billing")}
        >
          {t("tabBilling")}</button>
        <button
          className={`btn btn-ghost ${activeTab === "notifications" ? "active" : ""}`}
          onClick={() => setActiveTab("notifications")}
        >
          {t("tabNotifications")}</button>
      </div>

      {activeTab === "general" && (
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("generalSettingsTitle")}</h3>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("platformName")}</div>
              <div className="sub">{t("platformNameSub")}</div>
            </div>
            <input type="text" defaultValue="WellSpend Budget Tracker" style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)", width: 200 }} />
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("defaultCurrency")}</div>
              <div className="sub">{t("defaultCurrencySub")}</div>
            </div>
            <select className="settings-select" value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value)}>
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
            <select className="settings-select" defaultValue="en">
              <option>{t("langEnglishUk")}</option>
              <option>{t("langEnglishUs")}</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("timeZone")}</div>
              <div className="sub">{t("timeZoneSub")}</div>
            </div>
            <select className="settings-select" defaultValue="utc">
              <option>UTC</option>
              <option>Europe/London</option>
              <option>Africa/Harare</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("maintenanceMode")}</div>
              <div className="sub">{t("maintenanceModeSub")}</div>
            </div>
            <label className="switch">
              <input type="checkbox" />
              <span className="track"><span className="knob" /></span>
            </label>
          </div>
        </div>
      )}

      {activeTab === "security" && (
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("securitySettingsTitle")}</h3>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("sessionTimeout")}</div>
              <div className="sub">{t("sessionTimeoutSub")}</div>
            </div>
            <select className="settings-select" defaultValue="30">
              <option>{t("opt15Minutes")}</option>
              <option>{t("opt30Minutes")}</option>
              <option>{t("opt1Hour")}</option>
              <option>{t("opt24Hours")}</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("apiRateLimit")}</div>
              <div className="sub">{t("apiRateLimitSub")}</div>
            </div>
            <select className="settings-select" defaultValue="100">
              <option>50</option>
              <option>100</option>
              <option>200</option>
              <option>{t("optUnlimited")}</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("twoFactorAuth")}</div>
              <div className="sub">{t("twoFactorAuthSub")}</div>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="track"><span className="knob" /></span>
            </label>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("debugMode")}</div>
              <div className="sub">{t("debugModeSub")}</div>
            </div>
            <label className="switch">
              <input type="checkbox" />
              <span className="track"><span className="knob" /></span>
            </label>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("passwordPolicy")}</div>
              <div className="sub">{t("passwordPolicySub")}</div>
            </div>
            <select className="settings-select" defaultValue="strong">
              <option>{t("passwordStandard")}</option>
              <option>{t("passwordStrong")}</option>
              <option>{t("passwordVeryStrong")}</option>
            </select>
          </div>
        </div>
      )}

      {activeTab === "payroll" && (
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("payrollSettingsTitle")}</h3>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("payrollCutoffDay")}</div>
              <div className="sub">{t("payrollCutoffDaySub")}</div>
            </div>
            <select className="settings-select" defaultValue="22">
              <option>{t("day20th")}</option>
              <option>{t("day22nd")}</option>
              <option>{t("day25th")}</option>
              <option>{t("lastDay")}</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("correctionDeadline")}</div>
              <div className="sub">{t("correctionDeadlineSub")}</div>
            </div>
            <select className="settings-select" defaultValue="24">
              <option>{t("day23rd")}</option>
              <option>{t("day24th")}</option>
              <option>{t("day25th")}</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("expectedPayday")}</div>
              <div className="sub">{t("expectedPaydaySub")}</div>
            </div>
            <select className="settings-select" defaultValue="25">
              <option>{t("day25th")}</option>
              <option>{t("lastWorkingDay")}</option>
              <option>{t("lastDay")}</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("autoApproveCorrections")}</div>
              <div className="sub">{t("autoApproveCorrectionsSub")}</div>
            </div>
            <label className="switch">
              <input type="checkbox" />
              <span className="track"><span className="knob" /></span>
            </label>
          </div>
        </div>
      )}

      {activeTab === "billing" && (
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("billingSettingsTitle")}</h3>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("individualPlanPrice")}</div>
              <div className="sub">{t("individualPlanPriceSub")}</div>
            </div>
            <input type="text" defaultValue="$1" style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)", width: 100 }} />
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("individualPlanDuration")}</div>
              <div className="sub">{t("individualPlanDurationSub")}</div>
            </div>
            <select className="settings-select" defaultValue="1">
              <option>{t("opt1Year")}</option>
              <option>{t("opt6Months")}</option>
              <option>{t("opt3Months")}</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("invoiceDueDays")}</div>
              <div className="sub">{t("invoiceDueDaysSub")}</div>
            </div>
            <select className="settings-select" defaultValue="30">
              <option>{t("opt15Days")}</option>
              <option>{t("opt30Days")}</option>
              <option>{t("opt45Days")}</option>
              <option>{t("opt60Days")}</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("gracePeriod")}</div>
              <div className="sub">{t("gracePeriodSub")}</div>
            </div>
            <select className="settings-select" defaultValue="7">
              <option>{t("opt3Days")}</option>
              <option>{t("opt7Days")}</option>
              <option>{t("opt14Days")}</option>
              <option>{t("opt30Days")}</option>
            </select>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("notificationSettingsTitle")}</h3>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("emailNotifications")}</div>
              <div className="sub">{t("emailNotificationsSub")}</div>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="track"><span className="knob" /></span>
            </label>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("pushNotifications")}</div>
              <div className="sub">{t("pushNotificationsSub")}</div>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="track"><span className="knob" /></span>
            </label>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("smsNotifications")}</div>
              <div className="sub">{t("smsNotificationsSub")}</div>
            </div>
            <label className="switch">
              <input type="checkbox" />
              <span className="track"><span className="knob" /></span>
            </label>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("adminAlerts")}</div>
              <div className="sub">{t("adminAlertsSub")}</div>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="track"><span className="knob" /></span>
            </label>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("payslipDelivery")}</div>
              <div className="sub">{t("payslipDeliverySub")}</div>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="track"><span className="knob" /></span>
            </label>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <button className="btn btn-primary" onClick={handleSaveSettings}>{t("saveSettings")}</button>
      </div>
    </>
  );
}
