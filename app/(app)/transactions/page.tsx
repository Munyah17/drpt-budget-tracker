"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { ACCOUNTS } from "@/lib/data";
import { fmt, ukDate } from "@/lib/format";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import RecordModal, { RowRecord } from "@/components/RecordModal";
import { downloadCsv, downloadBlob } from "@/lib/download";

type SortKey = "date-desc" | "date-asc" | "amt-desc" | "amt-asc";
const PAGE_SIZE = 15;

export default function TransactionsPage() {
  const { allTransactions, toast } = useAppData();
  const [search, setSearch] = useState("");
  const [accFilter, setAccFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("date-desc");
  const [selectAll, setSelectAll] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<RowRecord | null>(null);

  const categories = useMemo(() => [...new Set(allTransactions.map((t) => t.category))], [allTransactions]);

  const rows = useMemo(() => {
    let list = allTransactions.filter(
      (t) =>
        (!accFilter || t.account === accFilter) &&
        (!catFilter || t.category === catFilter) &&
        (t.name.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()))
    );
    list = [...list];
    if (sort === "date-asc") list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sort === "date-desc") list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (sort === "amt-desc") list.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    if (sort === "amt-asc") list.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
    return list;
  }, [allTransactions, search, accFilter, catFilter, sort]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function exportCsv() {
    downloadCsv("transactions.csv", rows.map((t) => ({
      description: t.name,
      category: t.category,
      account: t.account,
      date: t.date,
      type: t.type,
      amount: String(t.amount),
    })));
    toast(`Exported ${rows.length} transactions to CSV`, "download");
  }

  function exportPdf() {
    downloadBlob("transactions-report.txt", rows.map((t) => `${t.date}  ${t.name}  ${t.category}  ${t.amount > 0 ? "+" : ""}${t.amount}`).join("\n"));
    toast(`Exported ${rows.length} transactions`, "file-down");
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelectAll(checked);
    setSelected(checked ? new Set(rows.map((r) => r.id)) : new Set());
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Transactions</h2>
          <p className="section-sub">Master view of every movement across your accounts</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={exportCsv}>
            <Icon name="download" size={15} /> Export CSV
          </button>
          <button className="btn btn-ghost" onClick={exportPdf}>
            <Icon name="file-down" size={15} /> Export PDF
          </button>
        </div>
      </div>
      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search transactions..."
          categoryOptions={categories.map((c) => ({ value: c, label: c }))}
          onSearchChange={setSearch}
          onCategoryChange={setCatFilter}
        />
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <select value={accFilter} onChange={(e) => setAccFilter(e.target.value)} style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)", minWidth: 150 }}>
            <option value="">All Accounts</option>
            {ACCOUNTS.map((a) => (
              <option key={a.name}>{a.name}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)", minWidth: 150 }}>
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="amt-desc">Highest amount</option>
            <option value="amt-asc">Lowest amount</option>
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <input type="checkbox" checked={selectAll} onChange={(e) => toggleAll(e.target.checked)} />
                </th>
                <th>Description</th>
                <th>Category</th>
                <th>Account</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                    No transactions found.
                  </td>
                </tr>
              )}
              {pageRows.map((t) => (
                <tr key={t.id} style={{ cursor: "pointer" }} onClick={() => setViewing({ description: t.name, category: t.category, account: t.account, date: t.date, type: t.type, amount: `${t.amount > 0 ? "+" : ""}${fmt(t.amount)}` })}>
                  <td onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleRow(t.id)} />
                  </td>
                  <td>
                    <div className="merchant-cell">
                      <div
                        className="merchant-ic"
                        style={t.type === "income" ? { background: "rgba(26,156,109,.12)", color: "var(--green)" } : undefined}
                      >
                        <Icon name={t.type === "income" ? "arrow-down-left" : "arrow-up-right"} size={14} />
                      </div>
                      {t.name}
                    </div>
                  </td>
                  <td>
                    <span className="chip">{t.category}</span>
                  </td>
                  <td>{t.account}</td>
                  <td>{ukDate(t.date)}</td>
                  <td style={{ textAlign: "right" }} className={t.amount > 0 ? "amt-pos" : "amt-neg"}>
                    {t.amount > 0 ? "+" : "-"}
                    {fmt(Math.abs(t.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, fontSize: 13, color: "var(--ink-500)" }}>
          <span>
            Showing {pageRows.length} of {rows.length} transactions
          </span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button className="btn btn-ghost btn-sm" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <Icon name="chevron-left" size={14} />
            </button>
            <span style={{ fontSize: 13, padding: "0 6px" }}>Page {safePage} of {pageCount}</span>
            <button className="btn btn-ghost btn-sm" disabled={safePage >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
              <Icon name="chevron-right" size={14} />
            </button>
          </div>
        </div>
      </div>
      {viewing && (
        <RecordModal
          mode="view"
          title="Transaction Details"
          record={viewing}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  );
}
