"use client";

import { FormEvent, useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { gbp } from "@/lib/format";
import Icon from "@/components/Icon";
import CircleProgress from "@/components/charts/CircleProgress";
import Modal from "@/components/Modal";

function NewGoalModal({ onClose }: { onClose: () => void }) {
  const { addGoal, toast } = useAppData();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("0");
  const [deadline, setDeadline] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const dd = new Date(deadline + "T00:00:00");
    addGoal({
      name,
      target: parseFloat(target),
      saved: parseFloat(saved || "0"),
      deadline: dd.toLocaleDateString("en-GB"),
    });
    toast("Savings goal created");
    onClose();
  }

  return (
    <Modal title="New Savings Goal" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Goal name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New Laptop" />
        </div>
        <div className="field">
          <label>Target amount (£)</label>
          <input required type="number" step="0.01" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0.00" />
        </div>
        <div className="field">
          <label>Already saved (£)</label>
          <input type="number" step="0.01" value={saved} onChange={(e) => setSaved(e.target.value)} />
        </div>
        <div className="field">
          <label>Deadline</label>
          <input required type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">
          Create Goal
        </button>
      </form>
    </Modal>
  );
}

export default function SavingsPage() {
  const { goals } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Savings Goals</h2>
          <p className="section-sub">{goals.length} goals in progress</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Icon name="plus" size={16} /> New Goal
        </button>
      </div>
      <div className="grid grid-3">
        {goals.map((g) => {
          const pct = Math.round((g.saved / g.target) * 100);
          return (
            <div key={g.id} className="glass-card hoverable card-pad" style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <CircleProgress pct={pct} color="var(--rose-500)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{g.name}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginBottom: 8 }}>Target {g.deadline}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 }}>
                  <span>{gbp(g.saved)} saved</span>
                  <span style={{ color: "var(--ink-500)", fontWeight: 500 }}>of {gbp(g.target)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {modalOpen && <NewGoalModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
