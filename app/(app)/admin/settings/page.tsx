"use client";

import { useAppData } from "@/lib/AppDataContext";

export default function AdminSettingsPage() {
  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Platform Settings</h2>
          <p className="section-sub">Configure platform-wide settings and preferences</p>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>General Settings</h3>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Platform Name</div>
              <div className="sub">Display name for the platform</div>
            </div>
            <input type="text" defaultValue="Dr PT Budget Tracker" style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)", width: 200 }} />
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Default Currency</div>
              <div className="sub">Default currency for new users</div>
            </div>
            <select className="settings-select" defaultValue="GBP">
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
            <select className="settings-select" defaultValue="en">
              <option>English (UK)</option>
              <option>English (US)</option>
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

        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Security Settings</h3>
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
              <div className="sub">Enable detailed logging</div>
            </div>
            <label className="switch">
              <input type="checkbox" />
              <span className="track"><span className="knob" /></span>
            </label>
          </div>
        </div>

        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Payment Settings</h3>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Paynow Integration</div>
              <div className="sub">Enable Paynow payment gateway</div>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="track"><span className="knob" /></span>
            </label>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Stripe Integration</div>
              <div className="sub">Enable Stripe payment gateway</div>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="track"><span className="knob" /></span>
            </label>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">ZIPIT Integration</div>
              <div className="sub">Enable ZIPIT payment gateway</div>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="track"><span className="knob" /></span>
            </label>
          </div>
          <div className="settings-row">
            <div>
              <div className="label">Ecocash Integration</div>
              <div className="sub">Enable Ecocash payment gateway</div>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="track"><span className="knob" /></span>
            </label>
          </div>
        </div>

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
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button className="btn btn-primary">Save All Settings</button>
      </div>
    </>
  );
}
