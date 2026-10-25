"use client";

import { useState, useMemo } from "react";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import { useAppData } from "@/lib/AppDataContext";

interface Advance {
  id: string;
  type: string;
  amount: string;
  repayment: string;
  status: string;
  date: string;
}

const ADVANCES_DATA: Advance[] = [
  { id: "ADV-001", type: "Salary Advance", amount: "£800", repayment: "Deducted June payroll", status: "Approved", date: "2025-05-20" },
  { id: "ADV-002", type: "Employee Loan", amount: "£2,500", repayment: "£208/mo × 12", status: "Active", date: "2025-02-10" },
  { id: "ADV-003", type: "Salary Advance", amount: "£400", repayment: "Deducted April payroll", status: "Settled", date: "2025-03-15" },
];

export default function EmployeeBorrowingPage() {
  const { user } = useAppData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredData = useMemo(() => {
    return ADVANCES_DATA.filter((a) =>
      (!statusFilter || a.status === statusFilter) &&
      (a.id.toLowerCase().includes(search.toLowerCase()) || a.type.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, statusFilter]);

  const handleView = (item: string) => alert(`Viewing ${item}...`);

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Borrowing & Advances</h2>
          <p className="section-sub">Salary advances and employee loans via {user?.organisation ?? "your organisation"}</p>
        </div>
        <button className="btn btn-primary" onClick={() => alert("Requesting advance...")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Request Advance
        </button>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">Available to Borrow</div>
          <div className="stat-value">£1,950</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Outstanding Balance</div>
          <div className="stat-value">£1,664</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Next Repayment</div>
          <div className="stat-value">£208</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search advances..."
          statusOptions={[{ value: "Approved", label: "Approved" }, { value: "Active", label: "Active" }, { value: "Settled", label: "Settled" }, { value: "Pending", label: "Pending" }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Reference</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Type</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Amount</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Repayment</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Date</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No advances match your search.
                </td>
              </tr>
            )}
            {filteredData.map((a, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{a.id}</td>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{a.type}</td>
                <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>{a.amount}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{a.repayment}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${a.status === "Settled" ? "badge-green" : a.status === "Pending" ? "badge-amber" : "badge-blue"}`}>
                    {a.status}
                  </span>
                </td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{a.date}</td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleView(a.id)}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
