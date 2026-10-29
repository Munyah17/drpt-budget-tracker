"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import LanguageSelect from "@/components/LanguageSelect";
import { CURRENCIES } from "@/lib/data";
import { Currency } from "@/lib/types";
import { currencySymbol, fmt } from "@/lib/format";
import { downloadBlob, downloadCsv } from "@/lib/download";
import { useFinancePrefs, updatePrefs, toCsvRows, whatsappLink } from "@/lib/financeInsights";
import Icon from "@/components/Icon";

type SettingsTab = "preferences" | "notifications" | "security" | "backup";

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="track">
        <span className="knob" />
      </span>
    </label>
  );
}

export default function SettingsPage() {
  const { theme, toggleTheme, toast, currency, setCurrency, user, logout, allTransactions, syncIntervalMin, setSyncIntervalMin, budgets } = useAppData();
  const t = useTranslations("Settings");
  const prefs = useFinancePrefs();
  const [tab, setTab] = useState<SettingsTab>("preferences");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [billReminders, setBillReminders] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");

  const exportCsv = () => {
    if (!allTransactions.length) { toast(t("toastNoTxn"), "x"); return; }
    downloadCsv(`wellspend-transactions-${new Date().toISOString().slice(0, 10)}.csv`, toCsvRows(allTransactions));
    toast(t("toastCsv"), "download");
  };

  const exportBackup = () => {
    downloadBlob(
      "wellspend-backup.json",
      JSON.stringify({ exportedAt: new Date().toISOString(), user, currency, transactions: allTransactions }, null, 2),
      "application/json"
    );
    toast(t("toastBackup"), "download");
  };

  const changePassword = () => {
    if (!currentPw || !newPw) { toast(t("toastBothPw"), "x"); return; }
    toast(t("toastPwUpdated"), "check-circle");
    setCurrentPw(""); setNewPw("");
  };

  const TABS: { id: SettingsTab; label: string }[] = [
    { id: "preferences", label: t("preferences") },
    { id: "notifications", label: t("notifications") },
    { id: "security", label: t("security") },
    { id: "backup", label: t("backup") },
  ];

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("sub")}</p>
        </div>
      </div>
      <div className="tabs" style={{ marginBottom: 18 }}>
        {TABS.map((t) => (
          <button key={t.id} className={"tab-btn" + (tab === t.id ? " active" : "")} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "preferences" && (
      <div className="glass-card card-pad" style={{ maxWidth: 640 }}>
        <div className="settings-row">
          <div>
            <div className="label">{t("currency")}</div>
            <div className="sub">{t("currencySub")}</div>
          </div>
          <select 
            className="settings-select" 
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c} ({currencySymbol(c)})
              </option>
            ))}
          </select>
        </div>
        <div className="settings-row">
          <div>
            <div className="label">{t("dateFormat")}</div>
            <div className="sub">{t("dateFormatSub")}</div>
          </div>
          <select className="settings-select" defaultValue="DD/MM/YYYY">
            <option>DD/MM/YYYY</option>
            <option>MM/DD/YYYY</option>
          </select>
        </div>
        <div className="settings-row">
          <div>
            <label className="label" htmlFor="app-language">{t("language")}</label>
            <div className="sub">{t("languageHint")}</div>
          </div>
          <LanguageSelect id="app-language" />
        </div>
        <div className="settings-row">
          <div>
            <div className="label">{t("theme")}</div>
            <div className="sub">{t("themeSub")}</div>
          </div>
          <Switch checked={theme === "dark"} onChange={toggleTheme} />
        </div>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => toast(t("saved"), "check-circle")}>
          {t("save")}
        </button>
      </div>
      )}

      {tab === "notifications" && (
        <div className="glass-card card-pad" style={{ maxWidth: 640 }}>
          <div className="settings-row">
            <div>
              <div className="label">{t("emailNotifs")}</div>
              <div className="sub">{t("emailNotifsSub")}</div>
            </div>
            <Switch checked={emailNotifs} onChange={setEmailNotifs} />
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("weeklySummary")}</div>
              <div className="sub">{t("weeklySummarySub")}</div>
            </div>
            <Switch checked={weeklySummary} onChange={setWeeklySummary} />
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("billReminders")}</div>
              <div className="sub">{t("billRemindersSub")}</div>
            </div>
            <Switch checked={billReminders} onChange={setBillReminders} />
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("budgetAlerts")}</div>
              <div className="sub">{t("budgetAlertsSub")}</div>
            </div>
            <Switch checked={budgetAlerts} onChange={setBudgetAlerts} />
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("whatsappAlerts")}</div>
              <div className="sub">{t("whatsappAlertsSub")}</div>
            </div>
            <Switch checked={prefs.whatsappEnabled} onChange={(v) => updatePrefs((p) => ({ ...p, whatsappEnabled: v }))} />
          </div>
          {prefs.whatsappEnabled && (
            <>
              <div className="settings-row">
                <div>
                  <div className="label">{t("whatsappNumber")}</div>
                  <div className="sub">{t("whatsappNumberSub")}</div>
                </div>
                <input
                  className="settings-select"
                  style={{ width: 180 }}
                  value={prefs.whatsappNumber}
                  onChange={(e) => updatePrefs((p) => ({ ...p, whatsappNumber: e.target.value }))}
                  placeholder="2637…"
                />
              </div>
              <div className="settings-row">
                <div>
                  <div className="label">{t("budgetThreshold")}</div>
                  <div className="sub">{t("budgetThresholdSub")}</div>
                </div>
                <select
                  className="settings-select"
                  value={prefs.budgetAlertPct}
                  onChange={(e) => updatePrefs((p) => ({ ...p, budgetAlertPct: Number(e.target.value) }))}
                >
                  <option value={70}>70%</option>
                  <option value={85}>85%</option>
                  <option value={95}>95%</option>
                  <option value={100}>100%</option>
                </select>
              </div>
              <button
                className="btn btn-ghost"
                style={{ marginTop: 4 }}
                onClick={() => {
                  const over = budgets.filter((b) => b.budget > 0 && (b.spent / b.budget) * 100 >= prefs.budgetAlertPct);
                  const text = over.length
                    ? t("waAlert", { items: over.map((b) => `${b.category} at ${Math.round((b.spent / b.budget) * 100)}% (${fmt(b.spent)}/${fmt(b.budget)})`).join(", ") })
                    : t("waOnTrack", { pct: prefs.budgetAlertPct });
                  window.open(whatsappLink(prefs.whatsappNumber, text), "_blank");
                  toast(t("toastWaOpened"), "send");
                }}
              >
                <Icon name="send" size={14} style={{ marginRight: 6 }} />{t("sendBudgetNow")}
              </button>
            </>
          )}
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => toast(t("toastNotifSaved"), "check-circle")}>
            {t("save")}
          </button>
        </div>
      )}

      {tab === "security" && (
        <div className="glass-card card-pad" style={{ maxWidth: 640 }}>
          <div className="settings-row" style={{ display: "block" }}>
            <div className="label" style={{ marginBottom: 10 }}>{t("changePassword")}</div>
            <div className="field">
              <label>{t("currentPw")}</label>
              <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
            </div>
            <div className="field">
              <label>{t("newPw")}</label>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={changePassword}>{t("updatePassword")}</button>
          </div>
          <div className="settings-row" style={{ marginTop: 16 }}>
            <div>
              <div className="label">{t("signOutEverywhere")}</div>
              <div className="sub">{t("signOutEverywhereSub")}</div>
            </div>
            <button className="btn btn-ghost" onClick={() => { logout(); location.href = "/"; }}>
              <Icon name="log-out" size={14} style={{ marginRight: 6 }} />{t("signOut")}
            </button>
          </div>
        </div>
      )}

      {tab === "backup" && (
        <div className="glass-card card-pad" style={{ maxWidth: 640 }}>
          <div className="settings-row">
            <div>
              <div className="label">{t("cloudSync")}</div>
              <div className="sub">{t("cloudSyncSub")}</div>
            </div>
            <select
              className="settings-select"
              value={syncIntervalMin}
              onChange={(e) => setSyncIntervalMin(Number(e.target.value))}
            >
              <option value={15}>{t("every15")}</option>
              <option value={30}>{t("every30")}</option>
              <option value={60}>{t("everyHour")}</option>
              <option value={360}>{t("every6h")}</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("exportNow")}</div>
              <div className="sub">{t("exportNowSub")}</div>
            </div>
            <button className="btn btn-primary" onClick={exportBackup}>
              <Icon name="download" size={14} style={{ marginRight: 6 }} />{t("downloadBackup")}
            </button>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">{t("txCsv")}</div>
              <div className="sub">{t("txCsvSub")}</div>
            </div>
            <button className="btn btn-ghost" onClick={exportCsv}>
              <Icon name="file-down" size={14} style={{ marginRight: 6 }} />{t("exportCsvBtn")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
