"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Pages.corp_hr_performance");
  const { toast } = useAppData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const reviews = useCrud(REVIEWS_DATA, t("entityReview"));
  const goals = useCrud(GOALS_DATA, t("entityGoal"));

  const filteredReviews = useMemo(() => {
    return reviews.items.filter((r) =>
      (!statusFilter || r.status === statusFilter) &&
      r.employee.toLowerCase().includes(search.toLowerCase())
    );
  }, [reviews.items, search, statusFilter]);

  const completeReview = (r: Review) => {
    reviews.setItems((prev) => prev.map((x) => (x === r ? { ...x, status: "Completed", rating: "4.0 / 5" } : x)));
    toast(t("toastCompleted", { employee: r.employee }), "check-circle");
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => reviews.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          {t("scheduleReview")}
        </button>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div className="card-head"><h3>{t("reviewsHeading")}</h3></div>
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          statusOptions={[{ value: "Completed", label: t("statusCompleted") }, { value: "Scheduled", label: t("statusScheduled") }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colEmployee")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colReviewer")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colPeriod")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colRating")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  {t("emptyReviews")}
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
                      <Icon name="check" size={14} style={{ marginRight: 4 }} />{t("complete")}
                    </button>
                  )}
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => reviews.openModal("view", r, reviews.items.indexOf(r))}><Icon name="eye" size={14} style={{ marginRight: 4 }} />{t("view")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-card card-pad">
        <div className="card-head">
          <h3>{t("goalsHeading")}</h3>
          <button className="btn btn-ghost" onClick={() => goals.openModal("create")}>
            <Icon name="plus" size={14} style={{ marginRight: 6 }} />
            {t("addGoal")}
          </button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colEmployee")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colGoal")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colDue")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colProgress")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colActions")}</th>
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
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => goals.openModal("edit", g, idx)}><Icon name="edit" size={14} style={{ marginRight: 4 }} />{t("edit")}</button>
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
