"use client";

import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "urgent";
  target: "all" | "paid" | "free";
  published: string;
  expires: string;
  active: boolean;
}

export default function AnnouncementsPage() {
  const { toast } = useAppData();
  const [showCompose, setShowCompose] = useState(false);

  const mockAnnouncements: Announcement[] = [
    { id: "1", title: "Scheduled Maintenance", content: "Platform will be down for maintenance on June 1st from 2-4 AM UTC", type: "warning", target: "all", published: "2025-05-26", expires: "2025-06-02", active: true },
    { id: "2", title: "New Feature Launch", content: "AI Assistant is now available for all premium users!", type: "info", target: "paid", published: "2025-05-25", expires: "2025-06-25", active: true },
    { id: "3", title: "Security Update", content: "Please update your passwords for enhanced security", type: "urgent", target: "all", published: "2025-05-20", expires: "2025-06-20", active: false },
  ];

  const getTypeBadge = (type: string) => {
    const colors = {
      info: "badge-blue",
      warning: "badge-amber",
      urgent: "badge-red",
    };
    return <span className={`badge ${colors[type as keyof typeof colors]}`}>{type}</span>;
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Announcements</h2>
          <p className="section-sub">Manage platform announcements</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCompose(true)}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          New Announcement
        </button>
      </div>

      {showCompose && (
        <div className="glass-card card-pad" style={{ marginBottom: 20, maxWidth: 600 }}>
          <h3 style={{ marginBottom: 16 }}>Create Announcement</h3>
          <div className="field">
            <label>Title</label>
            <input type="text" placeholder="Announcement title" style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }} />
          </div>
          <div className="field">
            <label>Content</label>
            <textarea placeholder="Announcement content" rows={4} style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)", resize: "vertical" }} />
          </div>
          <div className="field">
            <label>Type</label>
            <select style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }}>
              <option>Info</option>
              <option>Warning</option>
              <option>Urgent</option>
            </select>
          </div>
          <div className="field">
            <label>Target Audience</label>
            <select style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }}>
              <option>All Users</option>
              <option>Paid Users Only</option>
              <option>Free Users Only</option>
            </select>
          </div>
          <div className="field">
            <label>Expires On</label>
            <input type="date" style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" onClick={() => { toast("Announcement published", "check-circle"); setShowCompose(false); }}>Publish</button>
            <button className="btn btn-ghost" onClick={() => setShowCompose(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="glass-card card-pad">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Title</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Content</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Type</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Target</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Published</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Expires</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockAnnouncements.map((ann) => (
              <tr key={ann.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{ann.title}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{ann.content}</td>
                <td style={{ padding: "12px 8px" }}>{getTypeBadge(ann.type)}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{ann.target}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{ann.published}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{ann.expires}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${ann.active ? "badge-green" : "badge-red"}`}>
                    {ann.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-ghost" style={{ padding: "6px 10px" }}>
                      <Icon name="edit-2" size={16} />
                    </button>
                    <button className="btn btn-ghost" style={{ padding: "6px 10px", color: "var(--red)" }}>
                      <Icon name="trash-2" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
