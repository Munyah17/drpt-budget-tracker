"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { INCOME_ICONS } from "@/lib/data";
import {  fmt, ukDate , sym } from "@/lib/format";
import { IncomeEntry } from "@/lib/types";
import Icon from "@/components/Icon";
import CountUp from "@/components/CountUp";
import IncomeModal from "@/components/modals/IncomeModal";
import FilterBar from "@/components/FilterBar";

export default function IncomePage() {
  const t = useTranslations("Pages.income");
  const { income, deleteIncome, toast, totalIncome } = useAppData();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeEntry | undefined>(undefined);

  const categories = useMemo(() => [...new Set(income.map((i) => i.category))], [income]);
  const rows = useMemo(
    () =>
      income.filter(
        (i) =>
          (!catFilter || i.category === catFilter) &&
          (i.source.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()))
      ),
    [income, search, catFilter]
  );

  function openAdd() {
    setEditing(undefined);
    setModalOpen(true);
  }
  function openEdit(entry: IncomeEntry) {
    setEditing(entry);
    setModalOpen(true);
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("sub")}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Icon name="plus" size={16} /> {t("addBtn")}
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">{t("statTotal")}</span>
          <div className="stat-value">
            <CountUp end={totalIncome} prefix={sym()} />
          </div>
        </div>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">{t("statSources")}</span>
          <div className="stat-value">
            <CountUp end={income.length} decimals={0} />
          </div>
        </div>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">{t("statRecurring")}</span>
          <div className="stat-value">
            <CountUp end={income.filter((i) => i.recurring !== "None").length} decimals={0} />
          </div>
        </div>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">{t("statAvg")}</span>
          <div className="stat-value">
            <CountUp end={income.length ? totalIncome / income.length : 0} prefix={sym()} />
          </div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("phSearch")}
          categoryOptions={categories.map((c) => ({ value: c, label: c }))}
          onSearchChange={setSearch}
          onCategoryChange={setCatFilter}
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("colSource")}</th>
                <th>{t("colCategory")}</th>
                <th>{t("colDate")}</th>
                <th>{t("colRecurring")}</th>
                <th style={{ textAlign: "right" }}>{t("colAmount")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                    {t("empty")}
                  </td>
                </tr>
              )}
              {rows.map((i) => (
                <tr key={i.id}>
                  <td>
                    <div className="merchant-cell">
                      <div className="merchant-ic">
                        <Icon name={INCOME_ICONS[i.category] || "wallet"} size={15} />
                      </div>
                      {i.source}
                    </div>
                  </td>
                  <td>
                    <span className="chip">{i.category}</span>
                  </td>
                  <td>{ukDate(i.date)}</td>
                  <td>{i.recurring === "None" ? <span style={{ color: "var(--ink-500)" }}>{t("oneOff")}</span> : i.recurring}</td>
                  <td style={{ textAlign: "right" }} className="amt-pos">
                    +{fmt(i.amount)}
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button className="btn btn-ghost btn-sm" data-tip={t("tipEdit")} onClick={() => openEdit(i)}>
                      <Icon name="pencil" size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      data-tip={t("tipDelete")}
                      onClick={() => {
                        deleteIncome(i.id);
                        toast(t("toastDeleted"), "trash-2");
                      }}
                    >
                      <Icon name="trash-2" size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && <IncomeModal editing={editing} onClose={() => setModalOpen(false)} />}
    </>
  );
}
