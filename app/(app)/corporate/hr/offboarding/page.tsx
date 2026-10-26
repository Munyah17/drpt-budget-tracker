"use client";

import { useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { useCrud } from "@/lib/useCrud";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

interface Leaver {
  employee: string;
  department: string;
  lastDay: string;
  reason: string;
  status: string;
}

const DEFAULT_STEPS = [
  { id: "contract", label: "Resignation / termination letter filed" },
  { id: "assets", label: "Company assets returned (laptop, badge, keys)" },
  { id: "accounts", label: "System accounts & email deactivated" },
  { id: "payroll", label: "Final payroll & leave payout processed" },
  { id: "exit", label: "Exit interview completed" },
];

const LEAVERS_DATA: Leaver[] = [];

export default function OffboardingPage() {
  const { toast } = useAppData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const crud = useCrud(LEAVERS_DATA, "Offboarding");
  const [steps, setSteps] = useState<Record<string, boolean>>({ contract: true, assets: true });

  const filteredData = useMemo(() => {
    return crud.items.filter((l) =>
      (!statusFilter || l.status === statusFilter) &&
      l.employee.toLowerCase().includes(search.toLowerCase())
    );
  }, [crud.items, search, statusFilter]);

  const toggleStep = (id: string) => setSteps((prev) => ({ ...prev, [id]: !prev[id] }));
  const done = Object.values(steps).filter(Boolean).length;
  const pct = Math.round((done / DEFAULT_STEPS.length) * 100);

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Offboarding</h2>
          <p className="section-sub">Manage employee exits and clearance checklists</p>
        </div>
        <button className="btn btn-primary" onClick={() => crud.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Start Offboarding
        </button>
      </div>

      <div className="grid grid-2">
        <div className="glass-card card-pad">
          <div className="card-head"><h3>Leavers</h3></div>
          <FilterBar
            searchPlaceholder="Search leavers..."
            statusOptions={[{ value: "In Progress", label: "In Progress" }, { value: "Completed", label: "Completed" }]}
            onSearchChange={setSearch}
            onStatusChange={setStatusFilter}
          />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Employee</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Last Day</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Reason</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                    No leavers match your search.
                  </td>
                </tr>
              )}
              {filteredData.map((l, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={{ padding: "12px 8px" }}>
                    <div style={{ fontWeight: 600 }}>{l.employee}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{l.department}</div>
                  </td>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>{l.lastDay}</td>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>{l.reason}</td>
                  <td style={{ padding: "12px 8px" }}>
                    <span className={`badge ${l.status === "Completed" ? "badge-green" : "badge-amber"}`}>{l.status}</span>
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("view", l, crud.items.indexOf(l))}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Exit Checklist</h3>
            <span className="badge badge-blue">{pct}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "var(--card-border)", marginBottom: 16 }}>
            <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: "var(--rose-500)", transition: "width 0.2s" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {DEFAULT_STEPS.map((s) => (
              <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 12px", borderRadius: "var(--radius-sm)", background: steps[s.id] ? "var(--pink-100)" : "var(--card-solid)" }}>
                <input type="checkbox" checked={!!steps[s.id]} onChange={() => toggleStep(s.id)} />
                <span style={{ fontSize: 13, textDecoration: steps[s.id] ? "line-through" : "none", color: steps[s.id] ? "var(--ink-500)" : "inherit" }}>{s.label}</span>
              </label>
            ))}
          </div>
          <button
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 16 }}
            onClick={() => toast("Clearance checklist submitted", "check-circle")}
          >
            <Icon name="check" size={16} style={{ marginRight: 8 }} />
            Submit Clearance ({done}/{DEFAULT_STEPS.length})
          </button>
        </div>
      </div>
      {crud.modalNode}
    </>
  );
}
