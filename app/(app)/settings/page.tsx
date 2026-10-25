"use client";

import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { CURRENCIES, CURRENCY_SYMBOLS } from "@/lib/data";
import { Currency } from "@/lib/types";
import { downloadBlob } from "@/lib/download";
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
  const { theme, toggleTheme, toast, currency, setCurrency, user, logout, allTransactions } = useAppData();
  const [tab, setTab] = useState<SettingsTab>("preferences");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [billReminders, setBillReminders] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [backupFreq, setBackupFreq] = useState("Weekly");

  const exportBackup = () => {
    downloadBlob(
      "drpt-backup.json",
      JSON.stringify({ exportedAt: new Date().toISOString(), user, currency, transactions: allTransactions }, null, 2),
      "application/json"
    );
    toast("Backup downloaded", "download");
  };

  const changePassword = () => {
    if (!currentPw || !newPw) { toast("Enter both passwords", "x"); return; }
    toast("Password updated", "check-circle");
    setCurrentPw(""); setNewPw("");
  };

  const TABS: { id: SettingsTab; label: string }[] = [
    { id: "preferences", label: "Preferences" },
    { id: "notifications", label: "Notifications" },
    { id: "security", label: "Security" },
    { id: "backup", label: "Backup" },
  ];

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Settings</h2>
          <p className="section-sub">Manage your preferences</p>
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
            <div className="label">Currency</div>
            <div className="sub">Used across the app</div>
          </div>
          <select 
            className="settings-select" 
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c} ({CURRENCY_SYMBOLS[c]})
              </option>
            ))}
          </select>
        </div>
        <div className="settings-row">
          <div>
            <div className="label">Date Format</div>
            <div className="sub">How dates are displayed</div>
          </div>
          <select className="settings-select" defaultValue="DD/MM/YYYY">
            <option>DD/MM/YYYY</option>
            <option>MM/DD/YYYY</option>
          </select>
        </div>
        <div className="settings-row">
          <div>
            <div className="label">Language</div>
            <div className="sub">Interface language</div>
          </div>
          <select className="settings-select" defaultValue="English (UK)">
            <option>English (UK)</option>
            <option>English (US)</option>
          </select>
        </div>
        <div className="settings-row">
          <div>
            <div className="label">Theme</div>
            <div className="sub">Light or dark appearance</div>
          </div>
          <Switch checked={theme === "dark"} onChange={toggleTheme} />
        </div>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => toast("Settings saved", "check-circle")}>
          Save Changes
        </button>
      </div>
      )}

      {tab === "notifications" && (
        <div className="glass-card card-pad" style={{ maxWidth: 640 }}>
          <div className="settings-row">
            <div>
              <div className="label">Email Notifications</div>
              <div className="sub">Bill reminders and alerts</div>
            </div>
            <Switch checked={emailNotifs} onChange={setEmailNotifs} />
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Weekly Summary</div>
              <div className="sub">Every Monday at 8am</div>
            </div>
            <Switch checked={weeklySummary} onChange={setWeeklySummary} />
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Bill Reminders</div>
              <div className="sub">3 days before a bill is due</div>
            </div>
            <Switch checked={billReminders} onChange={setBillReminders} />
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Budget Alerts</div>
              <div className="sub">When a category hits 85% of budget</div>
            </div>
            <Switch checked={budgetAlerts} onChange={setBudgetAlerts} />
          </div>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => toast("Notification preferences saved", "check-circle")}>
            Save Changes
          </button>
        </div>
      )}

      {tab === "security" && (
        <div className="glass-card card-pad" style={{ maxWidth: 640 }}>
          <div className="settings-row" style={{ display: "block" }}>
            <div className="label" style={{ marginBottom: 10 }}>Change Password</div>
            <div className="field">
              <label>Current password</label>
              <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
            </div>
            <div className="field">
              <label>New password</label>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={changePassword}>Update Password</button>
          </div>
          <div className="settings-row" style={{ marginTop: 16 }}>
            <div>
              <div className="label">Sign out everywhere</div>
              <div className="sub">Ends all active sessions</div>
            </div>
            <button className="btn btn-ghost" onClick={() => { logout(); location.href = "/"; }}>
              <Icon name="log-out" size={14} style={{ marginRight: 6 }} />Sign out
            </button>
          </div>
        </div>
      )}

      {tab === "backup" && (
        <div className="glass-card card-pad" style={{ maxWidth: 640 }}>
          <div className="settings-row">
            <div>
              <div className="label">Backup Frequency</div>
              <div className="sub">Automatic data backup</div>
            </div>
            <select className="settings-select" value={backupFreq} onChange={(e) => setBackupFreq(e.target.value)}>
              <option>Weekly</option>
              <option>Daily</option>
              <option>Monthly</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Export now</div>
              <div className="sub">Download a JSON snapshot of your data</div>
            </div>
            <button className="btn btn-primary" onClick={exportBackup}>
              <Icon name="download" size={14} style={{ marginRight: 6 }} />Download Backup
            </button>
          </div>
        </div>
      )}
    </>
  );
}
