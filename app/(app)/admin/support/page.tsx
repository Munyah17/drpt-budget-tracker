"use client";

import { useState } from "react";
import Icon from "@/components/Icon";

interface Ticket {
  id: string;
  subject: string;
  user: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  created: string;
}

export default function SupportPage() {
  const [, setSelectedTicket] = useState<Ticket | null>(null);

  const mockTickets: Ticket[] = [];

  const getStatusBadge = (status: string) => {
    const colors = {
      open: "badge-green",
      "in-progress": "badge-amber",
      resolved: "badge-blue",
      closed: "badge-red",
    };
    return <span className={`badge ${colors[status as keyof typeof colors]}`}>{status}</span>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: "badge-amber",
      medium: "badge-blue",
      high: "badge-red",
      urgent: "badge-red",
    };
    return <span className={`badge ${colors[priority as keyof typeof colors]}`}>{priority}</span>;
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Support</h2>
          <p className="section-sub">Manage user support tickets</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">Open Tickets</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">In Progress</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Resolved Today</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Avg Response Time</div>
          <div className="stat-value">—</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <div className="card-head">
          <h3>Support Tickets</h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Subject</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>User</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Priority</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Created</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockTickets.map((ticket) => (
              <tr key={ticket.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{ticket.subject}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{ticket.user}</td>
                <td style={{ padding: "12px 8px" }}>{getStatusBadge(ticket.status)}</td>
                <td style={{ padding: "12px 8px" }}>{getPriorityBadge(ticket.priority)}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{ticket.created}</td>
                <td style={{ padding: "12px 8px" }}>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: "6px 10px" }}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <Icon name="eye" size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
