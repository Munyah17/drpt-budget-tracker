"use client";

import { useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { useCrud } from "@/lib/useCrud";
import { downloadCsv } from "@/lib/download";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

interface AuditLog {
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  ipAddress: string;
}

const AUDIT_DATA: AuditLog[] = [
  { timestamp: "2025-05-26 15:30:45", user: "john.smith@drpt.com", action: "Updated payroll batch", resource: "BCH-2025-0526-001", ipAddress: "192.168.1.100" },
  { timestamp: "2025-05-26 15:15:22", user: "sarah.jones@drpt.com", action: "Generated invoice", resource: "INV-2025-0526-003", ipAddress: "192.168.1.105" },
  { timestamp: "2025-05-26 14:45:10", user: "admin@drpt.com", action: "Modified user role", resource: "john.doe@email.com", ipAddress: "192.168.1.50" },
  { timestamp: "2025-05-26 14:30:00", user: "emma.wilson@acme.com", action: "Viewed payslip", resource: "Payslip-May-2025", ipAddress: "10.0.0.45" },
];

export default function AdminAuditPage() {
  const { toast } = useAppData();
  const [search, setSearch] = useState("");
  const crud = useCrud(AUDIT_DATA, "Audit Log");

  const filteredData = useMemo(() => {
    return crud.items.filter((log) =>
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.resource.toLowerCase().includes(search.toLowerCase())
    );
  }, [crud.items, search]);

  const exportLogs = () => {
    downloadCsv("risk-audit-logs.csv", filteredData.map((l) => ({ ...l })));
    toast(`${filteredData.length} audit logs exported`, "download");
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Audit Logs</h2>
          <p className="section-sub">Track all system activity</p>
        </div>
        <button className="btn btn-primary" onClick={exportLogs}>
          <Icon name="download" size={16} style={{ marginRight: 8 }} />
          Export Logs
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search audit logs..."
          onSearchChange={setSearch}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Timestamp</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>User</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Action</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Resource</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No audit logs match your search.
                </td>
              </tr>
            )}
            {filteredData.map((log, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)", cursor: "pointer" }} onClick={() => crud.openModal("view", log, crud.items.indexOf(log))}>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{log.timestamp}</td>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{log.user}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{log.action}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{log.resource}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{log.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {crud.modalNode}
    </>
  );
}
