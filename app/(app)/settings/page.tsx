"use client";

import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { CURRENCIES, CURRENCY_SYMBOLS } from "@/lib/data";
import { Currency } from "@/lib/types";

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
  const { theme, toggleTheme, toast, currency, setCurrency } = useAppData();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Settings</h2>
          <p className="section-sub">Manage your preferences</p>
        </div>
      </div>
      <div className="tabs" style={{ marginBottom: 18 }}>
        <button className="tab-btn active">Preferences</button>
        <button className="tab-btn">Notifications</button>
        <button className="tab-btn">Security</button>
        <button className="tab-btn">Backup</button>
      </div>
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
            <div className="label">Backup Frequency</div>
            <div className="sub">Automatic data backup</div>
          </div>
          <select className="settings-select" defaultValue="Weekly">
            <option>Weekly</option>
            <option>Daily</option>
            <option>Monthly</option>
          </select>
        </div>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => toast("Settings saved", "check-circle")}>
          Save Changes
        </button>
      </div>
    </>
  );
}
