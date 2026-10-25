"use client";

import { FormEvent, useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { gbp } from "@/lib/format";
import Icon from "@/components/Icon";
import CircleProgress from "@/components/charts/CircleProgress";
import Modal from "@/components/Modal";
import type { Goal } from "@/lib/types";

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

function EditGoalModal({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const { updateGoal, deleteGoal, toast } = useAppData();
  const [name, setName] = useState(goal.name);
  const [target, setTarget] = useState(String(goal.target));
  const [saved, setSaved] = useState(String(goal.saved));
  const [deadline, setDeadline] = useState(() => {
    const d = new Date(goal.deadline.split("/").reverse().join("-"));
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const dd = new Date(deadline + "T00:00:00");
    updateGoal(goal.id, {
      name,
      target: parseFloat(target) || 0,
      saved: parseFloat(saved || "0"),
      deadline: isNaN(dd.getTime()) ? goal.deadline : dd.toLocaleDateString("en-GB"),
    });
    toast("Goal updated");
    onClose();
  }

  function handleDelete() {
    deleteGoal(goal.id);
    toast("Goal deleted", "trash-2");
    onClose();
  }

  return (
    <Modal title="Edit Savings Goal" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Goal name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Target amount (£)</label>
          <input required type="number" step="0.01" value={target} onChange={(e) => setTarget(e.target.value)} />
        </div>
        <div className="field">
          <label>Already saved (£)</label>
          <input type="number" step="0.01" value={saved} onChange={(e) => setSaved(e.target.value)} />
        </div>
        <div className="field">
          <label>Deadline</label>
          <input required type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} type="submit">Save</button>
          <button className="btn btn-ghost" style={{ flex: 1, color: "var(--red-500)" }} type="button" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function SavingsPage() {
  const { goals } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

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
            <div key={g.id} className="glass-card hoverable card-pad" style={{ display: "flex", gap: 16, alignItems: "center", cursor: "pointer" }} onClick={() => setEditing(g)}>
              <CircleProgress pct={pct} color="var(--rose-500)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{g.name}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginBottom: 8 }}>Target {g.deadline}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 }}>
                  <span>{gbp(g.saved)} saved</span>
                  <span style={{ color: "var(--ink-500)", fontWeight: 500 }}>of {gbp(g.target)}</span>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" data-tip="Edit goal" onClick={(e) => { e.stopPropagation(); setEditing(g); }}>
                <Icon name="pencil" size={14} />
              </button>
            </div>
          );
        })}
      </div>
      {modalOpen && <NewGoalModal onClose={() => setModalOpen(false)} />}
      {editing && <EditGoalModal goal={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
