"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { EXPENSE_CATS, EXPENSE_ICONS } from "@/lib/data";
import {  fmt, ukDate , sym } from "@/lib/format";
import { ExpenseEntry } from "@/lib/types";
import Icon from "@/components/Icon";
import CountUp from "@/components/CountUp";
import ExpenseModal from "@/components/modals/ExpenseModal";
import SmsImportModal from "@/components/modals/SmsImportModal";
import SplitBillModal from "@/components/modals/SplitBillModal";
import FilterBar from "@/components/FilterBar";

export default function ExpensesPage() {
  const t = useTranslations("Pages.expenses");
  const { expenses, deleteExpense, toast, totalExpenses } = useAppData();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [smsOpen, setSmsOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
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
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("sub")}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => setSplitOpen(true)}>
            <Icon name="users" size={16} /> {t("splitBtn")}
          </button>
          <button className="btn btn-ghost" onClick={() => setSmsOpen(true)}>
            <Icon name="smartphone" size={16} /> {t("smsBtn")}
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <Icon name="plus" size={16} /> {t("addBtn")}
          </button>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">{t("statTotal")}</span>
          <div className="stat-value">
            <CountUp end={totalExpenses} prefix={sym()} />
          </div>
        </div>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">{t("statTx")}</span>
          <div className="stat-value">
            <CountUp end={expenses.length} decimals={0} />
          </div>
        </div>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">{t("statRecurring")}</span>
          <div className="stat-value">
            <CountUp end={expenses.filter((e) => e.recurring).length} decimals={0} />
          </div>
        </div>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">{t("statLargest")}</span>
          <div className="stat-value">
            <CountUp end={expenses.length ? Math.max(...expenses.map((e) => e.amount)) : 0} prefix={sym()} />
          </div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("phSearch")}
          categoryOptions={EXPENSE_CATS.map((c) => ({ value: c, label: c }))}
          onSearchChange={setSearch}
          onCategoryChange={setCatFilter}
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("colMerchant")}</th>
                <th>{t("colCategory")}</th>
                <th>{t("colAccount")}</th>
                <th>{t("colMethod")}</th>
                <th>{t("colDate")}</th>
                <th style={{ textAlign: "right" }}>{t("colAmount")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                    {t("empty")}
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
                          {t("badgeRecurring")}
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
                    <button className="btn btn-ghost btn-sm" data-tip={t("tipEdit")} onClick={() => openEdit(e)}>
                      <Icon name="pencil" size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      data-tip={t("tipDelete")}
                      onClick={() => {
                        deleteExpense(e.id);
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

      {modalOpen && <ExpenseModal editing={editing} onClose={() => setModalOpen(false)} />}
      {smsOpen && <SmsImportModal onClose={() => setSmsOpen(false)} />}
      {splitOpen && <SplitBillModal onClose={() => setSplitOpen(false)} />}
    </>
  );
}
