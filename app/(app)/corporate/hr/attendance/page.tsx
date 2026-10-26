"use client";

import { useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { useCrud } from "@/lib/useCrud";
import { downloadCsv } from "@/lib/download";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

interface AttendanceRecord {
  employee: string;
  date: string;
  clockIn: string;
  clockOut: string;
  hours: string;
  status: string;
}

const ATTENDANCE_DATA: AttendanceRecord[] = [];

export default function AttendancePage() {
  const { toast } = useAppData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const crud = useCrud(ATTENDANCE_DATA, "Attendance Record");

  const filteredData = useMemo(() => {
    return crud.items.filter((r) =>
      (!statusFilter || r.status === statusFilter) &&
      r.employee.toLowerCase().includes(search.toLowerCase())
    );
  }, [crud.items, search, statusFilter]);

  const exportReport = () => {
    downloadCsv("attendance.csv", filteredData.map((r) => ({ ...r })));
    toast(`${filteredData.length} attendance records exported`, "download");
  };

  const present = crud.items.filter((r) => r.status === "Present").length;
  const late = crud.items.filter((r) => r.status === "Late").length;
  const absent = crud.items.filter((r) => r.status === "Absent" || r.status === "On Leave").length;

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Attendance</h2>
          <p className="section-sub">Track employee clock-ins and working hours</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={exportReport}>
            <Icon name="download" size={16} style={{ marginRight: 8 }} />
            Export
          </button>
          <button className="btn btn-primary" onClick={() => crud.openModal("create")}>
            <Icon name="plus" size={16} style={{ marginRight: 8 }} />
            Add Record
          </button>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">Present</div>
          <div className="stat-value">{present}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Late</div>
          <div className="stat-value">{late}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Absent / Leave</div>
          <div className="stat-value">{absent}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Avg. Hours</div>
          <div className="stat-value">—</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search employees..."
          statusOptions={[{ value: "Present", label: "Present" }, { value: "Late", label: "Late" }, { value: "On Leave", label: "On Leave" }, { value: "Absent", label: "Absent" }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Employee</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Date</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Clock In</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Clock Out</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Hours</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No attendance records match your search.
                </td>
              </tr>
            )}
            {filteredData.map((r, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{r.employee}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{r.date}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{r.clockIn}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{r.clockOut}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{r.hours}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${r.status === "Present" ? "badge-green" : r.status === "Late" ? "badge-amber" : "badge-red"}`}>
                    {r.status}
                  </span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("view", r, crud.items.indexOf(r))}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("edit", r, crud.items.indexOf(r))}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
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
