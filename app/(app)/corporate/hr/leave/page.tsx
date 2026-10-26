"use client";

import { useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { useCrud } from "@/lib/useCrud";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

interface LeaveRequest {
  employee: string;
  type: string;
  from: string;
  to: string;
  days: string;
  status: string;
}

const LEAVE_DATA: LeaveRequest[] = [];

export default function LeavePage() {
  const { toast } = useAppData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const crud = useCrud(LEAVE_DATA, "Leave Request");

  const filteredData = useMemo(() => {
    return crud.items.filter((r) =>
      (!statusFilter || r.status === statusFilter) &&
      (r.employee.toLowerCase().includes(search.toLowerCase()) || r.type.toLowerCase().includes(search.toLowerCase()))
    );
  }, [crud.items, search, statusFilter]);

  const decide = (r: LeaveRequest, decision: "Approved" | "Rejected") => {
    crud.setItems((prev) => prev.map((x) => (x === r ? { ...x, status: decision } : x)));
    toast(`Leave request ${decision.toLowerCase()} for ${r.employee}`, decision === "Approved" ? "check-circle" : "x");
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Leave Management</h2>
          <p className="section-sub">Review and manage employee leave requests</p>
        </div>
        <button className="btn btn-primary" onClick={() => crud.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          New Request
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">Pending</div>
          <div className="stat-value">{crud.items.filter((r) => r.status === "Pending").length}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Approved</div>
          <div className="stat-value">{crud.items.filter((r) => r.status === "Approved").length}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Rejected</div>
          <div className="stat-value">{crud.items.filter((r) => r.status === "Rejected").length}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">On Leave Today</div>
          <div className="stat-value">—</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search requests..."
          statusOptions={[{ value: "Pending", label: "Pending" }, { value: "Approved", label: "Approved" }, { value: "Rejected", label: "Rejected" }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Employee</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Type</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>From</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>To</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Days</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No leave requests match your search.
                </td>
              </tr>
            )}
            {filteredData.map((r, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{r.employee}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{r.type}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{r.from}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{r.to}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{r.days}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${r.status === "Approved" ? "badge-green" : r.status === "Rejected" ? "badge-red" : "badge-amber"}`}>
                    {r.status}
                  </span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  {r.status === "Pending" ? (
                    <>
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--green)" }} onClick={() => decide(r, "Approved")}><Icon name="check" size={14} style={{ marginRight: 4 }} />Approve</button>
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--red)" }} onClick={() => decide(r, "Rejected")}><Icon name="x" size={14} style={{ marginRight: 4 }} />Reject</button>
                    </>
                  ) : (
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("view", r, crud.items.indexOf(r))}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {crud.modalNode}
    </>
  );
}
