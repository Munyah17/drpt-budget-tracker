"use client";

import { useState, useMemo } from "react";
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

const JOBS_DATA: JobPosting[] = [
  { title: "Senior Physiotherapist", department: "Clinical", location: "Harare", type: "Full-time", applicants: "24", status: "Open" },
  { title: "Payroll Administrator", department: "Finance", location: "Remote", type: "Full-time", applicants: "12", status: "Open" },
  { title: "Front Desk Coordinator", department: "Operations", location: "Bulawayo", type: "Part-time", applicants: "8", status: "Paused" },
];

const CANDIDATES_DATA: Candidate[] = [
  { name: "Tendai Moyo", role: "Senior Physiotherapist", stage: "Interview", applied: "2025-05-20" },
  { name: "Chipo Dube", role: "Payroll Administrator", stage: "Screening", applied: "2025-05-22" },
  { name: "Farai Ndoro", role: "Senior Physiotherapist", stage: "Offer", applied: "2025-05-15" },
];

export default function RecruitmentPage() {
  const { toast } = useAppData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const jobs = useCrud(JOBS_DATA, "Job Posting");
  const candidates = useCrud(CANDIDATES_DATA, "Candidate");

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
    toast(`${c.name} moved to ${next}`, "check-circle");
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Recruitment</h2>
          <p className="section-sub">Job postings and candidate pipeline</p>
        </div>
        <button className="btn btn-primary" onClick={() => jobs.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Post Job
        </button>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div className="card-head"><h3>Open Positions</h3></div>
        <FilterBar
          searchPlaceholder="Search positions..."
          statusOptions={[{ value: "Open", label: "Open" }, { value: "Paused", label: "Paused" }, { value: "Closed", label: "Closed" }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Position</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Department</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Location</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Type</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Applicants</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No positions match your search.
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
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => jobs.openModal("view", j, jobs.items.indexOf(j))}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => jobs.openModal("edit", j, jobs.items.indexOf(j))}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-card card-pad">
        <div className="card-head">
          <h3>Candidate Pipeline</h3>
          <button className="btn btn-ghost" onClick={() => candidates.openModal("create")}>
            <Icon name="plus" size={14} style={{ marginRight: 6 }} />
            Add Candidate
          </button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Candidate</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Position</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Stage</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Applied</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
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
                      <Icon name="chevron-right" size={14} style={{ marginRight: 4 }} />Advance
                    </button>
                  )}
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => candidates.openModal("view", c, idx)}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
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
