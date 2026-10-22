"use client";

import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
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
  const { toast } = useAppData();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const mockTickets: Ticket[] = [
    { id: "1", subject: "Payment not processing", user: "john.doe@email.com", status: "open", priority: "urgent", created: "2h ago" },
    { id: "2", subject: "Cannot access dashboard", user: "sarah.smith@email.com", status: "in-progress", priority: "high", created: "5h ago" },
    { id: "3", subject: "Feature request: export data", user: "mike.wilson@email.com", status: "open", priority: "low", created: "1d ago" },
    { id: "4", subject: "Billing inquiry", user: "emma.jones@email.com", status: "resolved", priority: "medium", created: "2d ago" },
  ];

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
          <div className="stat-value">12</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">In Progress</div>
          <div className="stat-value">5</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Resolved Today</div>
          <div className="stat-value">8</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Avg Response Time</div>
          <div className="stat-value">2.5h</div>
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
