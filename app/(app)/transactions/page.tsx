"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { ACCOUNTS } from "@/lib/data";
import { gbp, ukDate } from "@/lib/format";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

type SortKey = "date-desc" | "date-asc" | "amt-desc" | "amt-asc";

export default function TransactionsPage() {
  const { allTransactions, toast } = useAppData();
  const [search, setSearch] = useState("");
  const [accFilter, setAccFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("date-desc");
  const [selectAll, setSelectAll] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

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
          <button className="btn btn-ghost" onClick={() => toast("Exporting CSV…", "download")}>
            <Icon name="download" size={15} /> Export CSV
          </button>
          <button className="btn btn-ghost" onClick={() => toast("Exporting PDF report…", "file-down")}>
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
              {rows.map((t) => (
                <tr key={t.id}>
                  <td>
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
                    {gbp(Math.abs(t.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, fontSize: 13, color: "var(--ink-500)" }}>
          <span>
            Showing {rows.length} of {allTransactions.length} transactions
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-ghost btn-sm">
              <Icon name="chevron-left" size={14} />
            </button>
            <button className="btn btn-ghost btn-sm" style={{ background: "var(--pink-100)", color: "var(--rose-600)" }}>
              1
            </button>
            <button className="btn btn-ghost btn-sm">
              <Icon name="chevron-right" size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
