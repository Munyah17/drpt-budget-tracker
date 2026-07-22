"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { INCOME_ICONS } from "@/lib/data";
import { gbp, ukDate } from "@/lib/format";
import { IncomeEntry } from "@/lib/types";
import Icon from "@/components/Icon";
import CountUp from "@/components/CountUp";
import IncomeModal from "@/components/modals/IncomeModal";

export default function IncomePage() {
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
          <h2 className="section-title">Income</h2>
          <p className="section-sub">All income sources for May 2025</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Icon name="plus" size={16} /> Add Income
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">Total Income</span>
          <div className="stat-value">
            <CountUp end={totalIncome} prefix="£" />
          </div>
        </div>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">Sources</span>
          <div className="stat-value">
            <CountUp end={income.length} decimals={0} />
          </div>
        </div>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">Recurring</span>
          <div className="stat-value">
            <CountUp end={income.filter((i) => i.recurring !== "None").length} decimals={0} />
          </div>
        </div>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">Avg per source</span>
          <div className="stat-value">
            <CountUp end={income.length ? totalIncome / income.length : 0} prefix="£" />
          </div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <div className="card-head">
          <div className="search-box" style={{ width: 260 }}>
            <Icon name="search" />
            <input placeholder="Search income…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="filters-row">
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Category</th>
                <th>Date</th>
                <th>Recurring</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                    No income entries match your search.
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
                  <td>{i.recurring === "None" ? <span style={{ color: "var(--ink-500)" }}>One-off</span> : i.recurring}</td>
                  <td style={{ textAlign: "right" }} className="amt-pos">
                    +{gbp(i.amount)}
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button className="btn btn-ghost btn-sm" data-tip="Edit" onClick={() => openEdit(i)}>
                      <Icon name="pencil" size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      data-tip="Delete"
                      onClick={() => {
                        deleteIncome(i.id);
                        toast("Income entry deleted", "trash-2");
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
