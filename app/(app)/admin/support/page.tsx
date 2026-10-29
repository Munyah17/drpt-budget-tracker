"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Pages.adm_support");
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
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("openTickets")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("inProgress")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("resolvedToday")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("avgResponseTime")}</div>
          <div className="stat-value">—</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <div className="card-head">
          <h3>{t("ticketsTitle")}</h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colSubject")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colUser")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colPriority")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colCreated")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colActions")}</th>
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
