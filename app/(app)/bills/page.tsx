"use client";

import { useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { gbp, ukDate } from "@/lib/format";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

type Tab = "upcoming" | "overdue" | "paid";

export default function BillsPage() {
  const { bills, toast } = useAppData();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return bills.filter((b) => 
      b.status === tab && 
      b.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [bills, tab, search]);

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Bills</h2>
          <p className="section-sub">Stay ahead of every due date</p>
        </div>
      </div>
      <div className="tabs" style={{ marginBottom: 18 }}>
        {(["upcoming", "overdue", "paid"] as Tab[]).map((t) => (
          <button key={t} className={"tab-btn" + (tab === t ? " active" : "")} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <FilterBar
        searchPlaceholder="Search bills..."
        onSearchChange={setSearch}
      />
      <div className="grid grid-2">
        {filtered.length === 0 && <p style={{ color: "var(--ink-500)" }}>No bills in this tab.</p>}
        {filtered.map((b) => {
          const badge =
            b.status === "paid" ? (
              <span className="badge badge-green">Paid</span>
            ) : b.status === "overdue" ? (
              <span className="badge badge-red">{Math.abs(b.daysLeft)} days overdue</span>
            ) : (
              <span className="badge badge-amber">
                {b.daysLeft} day{b.daysLeft === 1 ? "" : "s"} left
              </span>
            );
          return (
            <div key={b.id} className="glass-card hoverable bill-card">
              <div className="bill-ic">
                <Icon name={b.icon} size={19} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{b.name}</div>
                <div style={{ fontSize: 12, color: "var(--ink-500)" }}>Due {ukDate(b.due)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, marginBottom: 4 }}>{gbp(b.amount)}</div>
                {badge}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 20 }}>
        <button className="btn btn-primary" onClick={() => toast("Add Bill form would open here", "receipt")}>
          <Icon name="plus" size={16} /> Add Bill
        </button>
      </div>
    </>
  );
}
