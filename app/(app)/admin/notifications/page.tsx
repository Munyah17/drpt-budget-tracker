"use client";

import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  target: "all" | "paid" | "free";
  sent: string;
}

export default function NotificationsPage() {
  const { toast } = useAppData();
  const [showCompose, setShowCompose] = useState(false);

  const mockNotifications: Notification[] = [];

  const getTypeBadge = (type: string) => {
    const colors = {
      info: "badge-blue",
      warning: "badge-amber",
      error: "badge-red",
      success: "badge-green",
    };
    return <span className={`badge ${colors[type as keyof typeof colors]}`}>{type}</span>;
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Notifications</h2>
          <p className="section-sub">Manage system-wide notifications</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCompose(true)}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Send Notification
        </button>
      </div>

      {showCompose && (
        <div className="glass-card card-pad" style={{ marginBottom: 20, maxWidth: 600 }}>
          <h3 style={{ marginBottom: 16 }}>Compose Notification</h3>
          <div className="field">
            <label>Title</label>
            <input type="text" placeholder="Notification title" style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }} />
          </div>
          <div className="field">
            <label>Message</label>
            <textarea placeholder="Notification message" rows={4} style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)", resize: "vertical" }} />
          </div>
          <div className="field">
            <label>Type</label>
            <select style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }}>
              <option>Info</option>
              <option>Warning</option>
              <option>Error</option>
              <option>Success</option>
            </select>
          </div>
          <div className="field">
            <label>Target</label>
            <select style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }}>
              <option>All Users</option>
              <option>Paid Users Only</option>
              <option>Free Users Only</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" onClick={() => { toast("Notification sent", "check-circle"); setShowCompose(false); }}>Send</button>
            <button className="btn btn-ghost" onClick={() => setShowCompose(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="glass-card card-pad">
        <div className="card-head">
          <h3>Sent Notifications</h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Title</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Message</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Type</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Target</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Sent</th>
            </tr>
          </thead>
          <tbody>
            {mockNotifications.map((notif) => (
              <tr key={notif.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{notif.title}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{notif.message}</td>
                <td style={{ padding: "12px 8px" }}>{getTypeBadge(notif.type)}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{notif.target}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{notif.sent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
