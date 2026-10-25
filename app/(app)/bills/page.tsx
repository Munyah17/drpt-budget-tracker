"use client";

import { FormEvent, useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import {  fmt, ukDate , sym } from "@/lib/format";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import Modal from "@/components/Modal";

type Tab = "upcoming" | "overdue" | "paid";

function AddBillModal({ onClose }: { onClose: () => void }) {
  const { addBill, toast } = useAppData();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    addBill({ name, amount: parseFloat(amount) || 0, due, icon: "receipt" });
    toast(`Bill "${name}" added`);
    onClose();
  }

  return (
    <Modal title="Add Bill" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Bill name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Council Tax" />
        </div>
        <div className="field">
          <label>Amount ({sym()})</label>
          <input required type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="field">
          <label>Due date</label>
          <input required type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">Add Bill</button>
      </form>
    </Modal>
  );
}

export default function BillsPage() {
  const { bills, markBillPaid, toast } = useAppData();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

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
                <div style={{ fontWeight: 800, marginBottom: 4 }}>{fmt(b.amount)}</div>
                {badge}
                {b.status !== "paid" && (
                  <button
                    className="btn btn-ghost"
                    style={{ padding: "4px 10px", fontSize: 12, marginTop: 6 }}
                    onClick={() => { markBillPaid(b.id); toast(`${b.name} marked as paid`); }}
                  >
                    Mark paid
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 20 }}>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Icon name="plus" size={16} /> Add Bill
        </button>
      </div>
      {modalOpen && <AddBillModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
