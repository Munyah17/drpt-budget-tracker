"use client";

import { useAppData } from "@/lib/AppDataContext";

export default function SystemSettingsPage() {
  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">System Settings</h2>
          <p className="section-sub">Configure system-wide settings</p>
        </div>
      </div>

      <div className="glass-card card-pad" style={{ maxWidth: 600 }}>
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
        <div className="settings-row">
          <div>
            <div className="label">Debug Mode</div>
            <div className="sub">Enable detailed logging</div>
          </div>
          <label className="switch">
            <input type="checkbox" defaultChecked />
            <span className="track"><span className="knob" /></span>
          </label>
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
        <button className="btn btn-primary" style={{ marginTop: 20 }}>Save Settings</button>
      </div>
    </>
  );
}
