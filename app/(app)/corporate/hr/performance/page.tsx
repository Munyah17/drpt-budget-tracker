"use client";

import { useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { useCrud } from "@/lib/useCrud";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

interface Review {
  employee: string;
  reviewer: string;
  period: string;
  rating: string;
  status: string;
}

interface Goal {
  employee: string;
  goal: string;
  due: string;
  progress: string;
  status: string;
}

const REVIEWS_DATA: Review[] = [];

const GOALS_DATA: Goal[] = [];

export default function PerformancePage() {
  const { toast } = useAppData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const reviews = useCrud(REVIEWS_DATA, "Review");
  const goals = useCrud(GOALS_DATA, "Goal");

  const filteredReviews = useMemo(() => {
    return reviews.items.filter((r) =>
      (!statusFilter || r.status === statusFilter) &&
      r.employee.toLowerCase().includes(search.toLowerCase())
    );
  }, [reviews.items, search, statusFilter]);

  const completeReview = (r: Review) => {
    reviews.setItems((prev) => prev.map((x) => (x === r ? { ...x, status: "Completed", rating: "4.0 / 5" } : x)));
    toast(`Review for ${r.employee} marked complete`, "check-circle");
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Performance</h2>
          <p className="section-sub">Reviews, goals and appraisals</p>
        </div>
        <button className="btn btn-primary" onClick={() => reviews.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Schedule Review
        </button>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div className="card-head"><h3>Performance Reviews</h3></div>
        <FilterBar
          searchPlaceholder="Search reviews..."
          statusOptions={[{ value: "Completed", label: "Completed" }, { value: "Scheduled", label: "Scheduled" }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Employee</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Reviewer</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Period</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Rating</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No reviews match your search.
                </td>
              </tr>
            )}
            {filteredReviews.map((r, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{r.employee}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{r.reviewer}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{r.period}</td>
                <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>{r.rating}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${r.status === "Completed" ? "badge-green" : "badge-amber"}`}>{r.status}</span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  {r.status !== "Completed" && (
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--green)" }} onClick={() => completeReview(r)}>
                      <Icon name="check" size={14} style={{ marginRight: 4 }} />Complete
                    </button>
                  )}
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => reviews.openModal("view", r, reviews.items.indexOf(r))}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-card card-pad">
        <div className="card-head">
          <h3>Goals &amp; Objectives</h3>
          <button className="btn btn-ghost" onClick={() => goals.openModal("create")}>
            <Icon name="plus" size={14} style={{ marginRight: 6 }} />
            Add Goal
          </button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Employee</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Goal</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Due</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Progress</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {goals.items.map((g, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{g.employee}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{g.goal}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{g.due}</td>
                <td style={{ padding: "12px 8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--card-border)", maxWidth: 100 }}>
                      <div style={{ width: g.progress, height: "100%", borderRadius: 3, background: "var(--rose-500)" }} />
                    </div>
                    <span style={{ fontSize: 12 }}>{g.progress}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${g.status === "On Track" ? "badge-green" : g.status === "Complete" ? "badge-blue" : "badge-amber"}`}>{g.status}</span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => goals.openModal("edit", g, idx)}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {reviews.modalNode}
      {goals.modalNode}
    </>
  );
}
