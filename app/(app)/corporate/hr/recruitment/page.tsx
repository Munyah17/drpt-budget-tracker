"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { useCrud } from "@/lib/useCrud";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

interface JobPosting {
  title: string;
  department: string;
  location: string;
  type: string;
  applicants: string;
  status: string;
}

interface Candidate {
  name: string;
  role: string;
  stage: string;
  applied: string;
}

const JOBS_DATA: JobPosting[] = [];

const CANDIDATES_DATA: Candidate[] = [];

export default function RecruitmentPage() {
  const t = useTranslations("Pages.corp_hr_recruitment");
  const { toast } = useAppData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const jobs = useCrud(JOBS_DATA, t("entityJob"));
  const candidates = useCrud(CANDIDATES_DATA, t("entityCandidate"));

  const filteredJobs = useMemo(() => {
    return jobs.items.filter((j) =>
      (!statusFilter || j.status === statusFilter) &&
      (j.title.toLowerCase().includes(search.toLowerCase()) || j.department.toLowerCase().includes(search.toLowerCase()))
    );
  }, [jobs.items, search, statusFilter]);

  const nextStage = (c: Candidate) => {
    const stages = ["Screening", "Interview", "Offer", "Hired"];
    const idx = stages.indexOf(c.stage);
    const next = stages[Math.min(idx + 1, stages.length - 1)];
    candidates.setItems((prev) => prev.map((x) => (x === c ? { ...x, stage: next } : x)));
    toast(t("toastAdvanced", { name: c.name, stage: next }), "check-circle");
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => jobs.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          {t("postJob")}
        </button>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div className="card-head"><h3>{t("positionsHeading")}</h3></div>
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          statusOptions={[{ value: "Open", label: t("statusOpen") }, { value: "Paused", label: t("statusPaused") }, { value: "Closed", label: t("statusClosed") }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colPosition")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colDepartment")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colLocation")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colType")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colApplicants")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  {t("emptyPositions")}
                </td>
              </tr>
            )}
            {filteredJobs.map((j, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{j.title}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{j.department}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{j.location}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{j.type}</td>
                <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>{j.applicants}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${j.status === "Open" ? "badge-green" : j.status === "Closed" ? "badge-red" : "badge-amber"}`}>
                    {j.status}
                  </span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => jobs.openModal("view", j, jobs.items.indexOf(j))}><Icon name="eye" size={14} style={{ marginRight: 4 }} />{t("view")}</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => jobs.openModal("edit", j, jobs.items.indexOf(j))}><Icon name="edit" size={14} style={{ marginRight: 4 }} />{t("edit")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-card card-pad">
        <div className="card-head">
          <h3>{t("pipelineHeading")}</h3>
          <button className="btn btn-ghost" onClick={() => candidates.openModal("create")}>
            <Icon name="plus" size={14} style={{ marginRight: 6 }} />
            {t("addCandidate")}
          </button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colCandidate")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colPosition")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colStage")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colApplied")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {candidates.items.map((c, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{c.name}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{c.role}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${c.stage === "Offer" || c.stage === "Hired" ? "badge-green" : "badge-blue"}`}>{c.stage}</span>
                </td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{c.applied}</td>
                <td style={{ padding: "12px 8px" }}>
                  {c.stage !== "Hired" && (
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => nextStage(c)}>
                      <Icon name="chevron-right" size={14} style={{ marginRight: 4 }} />{t("advance")}
                    </button>
                  )}
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => candidates.openModal("view", c, idx)}><Icon name="eye" size={14} style={{ marginRight: 4 }} />{t("view")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {jobs.modalNode}
      {candidates.modalNode}
    </>
  );
}
