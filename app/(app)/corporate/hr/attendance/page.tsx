"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Pages.corp_hr_attendance");
  const { toast } = useAppData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const crud = useCrud(ATTENDANCE_DATA, t("entityLabel"));

  const filteredData = useMemo(() => {
    return crud.items.filter((r) =>
      (!statusFilter || r.status === statusFilter) &&
      r.employee.toLowerCase().includes(search.toLowerCase())
    );
  }, [crud.items, search, statusFilter]);

  const exportReport = () => {
    downloadCsv("attendance.csv", filteredData.map((r) => ({ ...r })));
    toast(t("toastExported", { count: filteredData.length }), "download");
  };

  const present = crud.items.filter((r) => r.status === "Present").length;
  const late = crud.items.filter((r) => r.status === "Late").length;
  const absent = crud.items.filter((r) => r.status === "Absent" || r.status === "On Leave").length;

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={exportReport}>
            <Icon name="download" size={16} style={{ marginRight: 8 }} />
            {t("export")}
          </button>
          <button className="btn btn-primary" onClick={() => crud.openModal("create")}>
            <Icon name="plus" size={16} style={{ marginRight: 8 }} />
            {t("addRecord")}
          </button>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statPresent")}</div>
          <div className="stat-value">{present}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statLate")}</div>
          <div className="stat-value">{late}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statAbsentLeave")}</div>
          <div className="stat-value">{absent}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statAvgHours")}</div>
          <div className="stat-value">—</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          statusOptions={[{ value: "Present", label: t("statusPresent") }, { value: "Late", label: t("statusLate") }, { value: "On Leave", label: t("statusOnLeave") }, { value: "Absent", label: t("statusAbsent") }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colEmployee")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colDate")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colClockIn")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colClockOut")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colHours")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  {t("emptyState")}
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
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("view", r, crud.items.indexOf(r))}><Icon name="eye" size={14} style={{ marginRight: 4 }} />{t("view")}</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("edit", r, crud.items.indexOf(r))}><Icon name="edit" size={14} style={{ marginRight: 4 }} />{t("edit")}</button>
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
