"use client";

import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import { downloadCsv } from "@/lib/download";

interface AuditLog {
  id: string;
  action: string;
  user: string;
  details: string;
  timestamp: string;
  ip: string;
}

export default function AuditLogsPage() {
  const { toast } = useAppData();
  const [searchTerm, setSearchTerm] = useState("");

  const mockLogs: AuditLog[] = [];

  const filteredLogs = mockLogs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionBadge = (action: string) => {
    if (action.includes("Login")) return <span className="badge badge-green">Login</span>;
    if (action.includes("Created")) return <span className="badge badge-blue">Create</span>;
    if (action.includes("Updated")) return <span className="badge badge-amber">Update</span>;
    if (action.includes("Payment")) return <span className="badge badge-green">Payment</span>;
    if (action.includes("Failed")) return <span className="badge badge-red">Error</span>;
    return <span className="badge badge-amber">Other</span>;
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Audit Logs</h2>
          <p className="section-sub">Track all system activities</p>
        </div>
        <button className="btn btn-ghost" onClick={() => {
          downloadCsv("audit-logs.csv", filteredLogs.map((l) => ({ timestamp: l.timestamp, action: l.action, user: l.user, details: l.details, ip: l.ip })));
          toast(`${filteredLogs.length} log entries exported`, "download");
        }}>
          <Icon name="download" size={16} style={{ marginRight: 8 }} />
          Export Logs
        </button>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }}
        />
      </div>

      <div className="glass-card card-pad">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Timestamp</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Action</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>User</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Details</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{log.timestamp}</td>
                <td style={{ padding: "12px 8px" }}>{getActionBadge(log.action)}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{log.user}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{log.details}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
