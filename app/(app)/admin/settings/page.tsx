"use client";

import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { CURRENCIES } from "@/lib/data";
import { DEFAULT_CURRENCY, currencySymbol } from "@/lib/format";

export default function AdminSettingsPage() {
  const { toast } = useAppData();
  const [defaultCurrency, setDefaultCurrency] = useState(DEFAULT_CURRENCY);
  const [activeTab, setActiveTab] = useState<"general" | "security" | "payroll" | "billing" | "notifications">("general");

  const handleSaveSettings = () => {
    toast("Settings saved successfully", "check-circle");
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Platform Settings</h2>
          <p className="section-sub">Configure platform-wide settings and preferences</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid var(--card-border)" }}>
        <button
          className={`btn btn-ghost ${activeTab === "general" ? "active" : ""}`}
          onClick={() => setActiveTab("general")}
        >
          General & Organisation</button>
        <button
          className={`btn btn-ghost ${activeTab === "security" ? "active" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          Security & Access</button>
        <button
          className={`btn btn-ghost ${activeTab === "payroll" ? "active" : ""}`}
          onClick={() => setActiveTab("payroll")}
        >
          Payroll & Operations</button>
        <button
          className={`btn btn-ghost ${activeTab === "billing" ? "active" : ""}`}
          onClick={() => setActiveTab("billing")}
        >
          Plans & Billing</button>
        <button
          className={`btn btn-ghost ${activeTab === "notifications" ? "active" : ""}`}
          onClick={() => setActiveTab("notifications")}
        >
          Notifications</button>
      </div>

      {activeTab === "general" && (
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>General & Organisation Settings</h3>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Platform Name</div>
              <div className="sub">Display name for the platform</div>
            </div>
            <input type="text" defaultValue="WellSpend Budget Tracker" style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)", width: 200 }} />
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Default Currency</div>
              <div className="sub">Default currency for new users</div>
            </div>
            <select className="settings-select" value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c} ({currencySymbol(c)})</option>
              ))}
            </select>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Default Language</div>
              <div className="sub">Default interface language</div>
            </div>
            <select className="settings-select" defaultValue="en">
              <option>English (UK)</option>
              <option>English (US)</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Time Zone</div>
              <div className="sub">Platform default timezone</div>
            </div>
            <select className="settings-select" defaultValue="utc">
              <option>UTC</option>
              <option>Europe/London</option>
              <option>Africa/Harare</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Maintenance Mode</div>
              <div className="sub">Disable the platform for maintenance</div>
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
            <h3>Security & Access Settings</h3>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Session Timeout</div>
              <div className="sub">Auto-logout after inactivity</div>
            </div>
            <select className="settings-select" defaultValue="30">
              <option>15 minutes</option>
              <option>30 minutes</option>
              <option>1 hour</option>
              <option>24 hours</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">API Rate Limit</div>
              <div className="sub">Requests per minute per user</div>
            </div>
            <select className="settings-select" defaultValue="100">
              <option>50</option>
              <option>100</option>
              <option>200</option>
              <option>Unlimited</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Two-Factor Auth</div>
              <div className="sub">Require 2FA for admin accounts</div>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="track"><span className="knob" /></span>
            </label>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Debug Mode</div>
              <div className="sub">Enable detailed logging (technical only)</div>
            </div>
            <label className="switch">
              <input type="checkbox" />
              <span className="track"><span className="knob" /></span>
            </label>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Password Policy</div>
              <div className="sub">Minimum password requirements</div>
            </div>
            <select className="settings-select" defaultValue="strong">
              <option>Standard (8 chars)</option>
              <option>Strong (12+ chars, mixed)</option>
              <option>Very Strong (14+ chars, special)</option>
            </select>
          </div>
        </div>
      )}

      {activeTab === "payroll" && (
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Payroll & Operations Settings</h3>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Payroll Cutoff Day</div>
              <div className="sub">Day of month payroll closes</div>
            </div>
            <select className="settings-select" defaultValue="22">
              <option>20th</option>
              <option>22nd</option>
              <option>25th</option>
              <option>Last day</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Correction Deadline</div>
              <div className="sub">Last day for payroll corrections</div>
            </div>
            <select className="settings-select" defaultValue="24">
              <option>23rd</option>
              <option>24th</option>
              <option>25th</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Expected Payday</div>
              <div className="sub">Default salary payment day</div>
            </div>
            <select className="settings-select" defaultValue="25">
              <option>25th</option>
              <option>Last working day</option>
              <option>Last day</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Auto-Approve Corrections</div>
              <div className="sub">Automatically approve minor corrections</div>
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
            <h3>Plans & Billing Settings</h3>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Individual Plan Price</div>
              <div className="sub">Annual individual subscription fee</div>
            </div>
            <input type="text" defaultValue="$1" style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)", width: 100 }} />
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Individual Plan Duration</div>
              <div className="sub">Validity period for individual plans</div>
            </div>
            <select className="settings-select" defaultValue="1">
              <option>1 year</option>
              <option>6 months</option>
              <option>3 months</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Invoice Due Days</div>
              <div className="sub">Days before invoice becomes overdue</div>
            </div>
            <select className="settings-select" defaultValue="30">
              <option>15 days</option>
              <option>30 days</option>
              <option>45 days</option>
              <option>60 days</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Grace Period</div>
              <div className="sub">Days after expiry before access revoked</div>
            </div>
            <select className="settings-select" defaultValue="7">
              <option>3 days</option>
              <option>7 days</option>
              <option>14 days</option>
              <option>30 days</option>
            </select>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Notification Settings</h3>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Email Notifications</div>
              <div className="sub">Send email notifications to users</div>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="track"><span className="knob" /></span>
            </label>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Push Notifications</div>
              <div className="sub">Send push notifications to users</div>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="track"><span className="knob" /></span>
            </label>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">SMS Notifications</div>
              <div className="sub">Send SMS notifications for critical alerts</div>
            </div>
            <label className="switch">
              <input type="checkbox" />
              <span className="track"><span className="knob" /></span>
            </label>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Admin Alerts</div>
              <div className="sub">Send alerts to admin for critical events</div>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="track"><span className="knob" /></span>
            </label>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Payslip Delivery</div>
              <div className="sub">Notify employees when payslip available</div>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="track"><span className="knob" /></span>
            </label>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <button className="btn btn-primary" onClick={handleSaveSettings}>Save Settings</button>
      </div>
    </>
  );
}
