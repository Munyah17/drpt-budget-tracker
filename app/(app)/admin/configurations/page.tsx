"use client";

import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";

export default function ConfigurationsPage() {
  const { toast } = useAppData();
  const [currency, setCurrency] = useState("GBP (£)");
  const [language, setLanguage] = useState("English (UK)");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Configurations</h2>
          <p className="section-sub">Manage application configurations</p>
        </div>
      </div>

      <div className="glass-card card-pad" style={{ maxWidth: 600 }}>
        <div className="settings-row">
          <div>
            <div className="label">Default Currency</div>
            <div className="sub">Default currency for new users</div>
          </div>
          <select className="settings-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option>GBP (£)</option>
            <option>USD ($)</option>
            <option>EUR (€)</option>
            <option>ZAR (R)</option>
          </select>
        </div>
        <div className="settings-row">
          <div>
            <div className="label">Default Language</div>
            <div className="sub">Default interface language</div>
          </div>
          <select className="settings-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option>English (UK)</option>
            <option>English (US)</option>
          </select>
        </div>
        <div className="settings-row">
          <div>
            <div className="label">Date Format</div>
            <div className="sub">Default date display format</div>
          </div>
          <select className="settings-select" value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
            <option>DD/MM/YYYY</option>
            <option>MM/DD/YYYY</option>
          </select>
        </div>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => toast("Configurations saved", "check-circle")}>Save Configurations</button>
      </div>
    </>
  );
}
