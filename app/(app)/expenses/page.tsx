"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { EXPENSE_CATS, EXPENSE_ICONS } from "@/lib/data";
import {  fmt, ukDate , sym } from "@/lib/format";
import { ExpenseEntry } from "@/lib/types";
import Icon from "@/components/Icon";
import CountUp from "@/components/CountUp";
import ExpenseModal from "@/components/modals/ExpenseModal";
import FilterBar from "@/components/FilterBar";

export default function ExpensesPage() {
  const { expenses, deleteExpense, toast, totalExpenses } = useAppData();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseEntry | undefined>(undefined);

  const rows = useMemo(
    () =>
      expenses.filter(
        (e) =>
          (!catFilter || e.category === catFilter) &&
          (e.merchant.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase()))
      ),
    [expenses, search, catFilter]
  );

  function openAdd() {
    setEditing(undefined);
    setModalOpen(true);
  }
  function openEdit(entry: ExpenseEntry) {
    setEditing(entry);
    setModalOpen(true);
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Expenses</h2>
          <p className="section-sub">Everything you&apos;ve spent this month</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Icon name="plus" size={16} /> Add Expense
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">Total Spent</span>
          <div className="stat-value">
            <CountUp end={totalExpenses} prefix={sym()} />
          </div>
        </div>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">Transactions</span>
          <div className="stat-value">
            <CountUp end={expenses.length} decimals={0} />
          </div>
        </div>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">Recurring</span>
          <div className="stat-value">
            <CountUp end={expenses.filter((e) => e.recurring).length} decimals={0} />
          </div>
        </div>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">Largest Expense</span>
          <div className="stat-value">
            <CountUp end={expenses.length ? Math.max(...expenses.map((e) => e.amount)) : 0} prefix={sym()} />
          </div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search expenses..."
          categoryOptions={EXPENSE_CATS.map((c) => ({ value: c, label: c }))}
          onSearchChange={setSearch}
          onCategoryChange={setCatFilter}
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Merchant</th>
                <th>Category</th>
                <th>Account</th>
                <th>Method</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                    No expenses match your search.
                  </td>
                </tr>
              )}
              {rows.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div className="merchant-cell">
                      <div className="merchant-ic">
                        <Icon name={EXPENSE_ICONS[e.category] || "circle"} size={15} />
                      </div>
                      {e.merchant}
                      {e.recurring && (
                        <span className="badge badge-amber" style={{ marginLeft: 6 }}>
                          Recurring
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="chip">{e.category}</span>
                  </td>
                  <td>{e.account}</td>
                  <td>{e.method}</td>
                  <td>{ukDate(e.date)}</td>
                  <td style={{ textAlign: "right" }} className="amt-neg">
                    -{fmt(e.amount)}
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button className="btn btn-ghost btn-sm" data-tip="Edit" onClick={() => openEdit(e)}>
                      <Icon name="pencil" size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      data-tip="Delete"
                      onClick={() => {
                        deleteExpense(e.id);
                        toast("Expense deleted", "trash-2");
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

      {modalOpen && <ExpenseModal editing={editing} onClose={() => setModalOpen(false)} />}
    </>
  );
}
