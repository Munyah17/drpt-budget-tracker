"use client";

import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import RecordModal, { RowRecord } from "@/components/RecordModal";

interface Plan {
  name: string;
  price: string;
  tagline: string;
  status: string;
  popular: boolean;
  features: string[];
}

const PLANS_DATA: Plan[] = [];

export default function PricingPage() {
  const { toast } = useAppData();
  const [plans, setPlans] = useState<Plan[]>(PLANS_DATA);
  const [modal, setModal] = useState<{ mode: "edit" | "create"; record: RowRecord; index: number } | null>(null);

  const openModal = (mode: "edit" | "create", plan?: Plan, index?: number) => {
    const record: RowRecord = plan
      ? { name: plan.name, price: plan.price, tagline: plan.tagline, status: plan.status }
      : { name: "", price: "", tagline: "", status: "Draft" };
    setModal({ mode, record, index: index ?? -1 });
  };

  const handleSave = (values: RowRecord) => {
    if (!modal) return;
    if (modal.mode === "create") {
      setPlans((prev) => [...prev, { name: values.name, price: values.price, tagline: values.tagline, status: values.status, popular: false, features: [] }]);
      toast(`${values.name} plan created`);
    } else {
      setPlans((prev) => prev.map((p, i) => (i === modal.index ? { ...p, name: values.name, price: values.price, tagline: values.tagline, status: values.status } : p)));
      toast(`${values.name} plan updated`);
    }
    setModal(null);
  };

  const handleDelete = () => {
    if (!modal) return;
    setPlans((prev) => prev.filter((_, i) => i !== modal.index));
    toast("Plan deleted", "trash-2");
    setModal(null);
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Pricing</h2>
          <p className="section-sub">Manage pricing plans and tiers</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Add Plan
        </button>
      </div>

      <div className="grid grid-3">
        {plans.map((plan, idx) => (
          <div key={idx} className="glass-card card-pad" style={plan.popular ? { border: "2px solid var(--rose-500)" } : undefined}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18 }}>{plan.name}</h3>
              <span className={`badge ${plan.status === "Popular" ? "badge-green" : "badge-amber"}`}>{plan.status}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>{plan.price}</div>
            <div style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 20 }}>{plan.tagline}</div>
            <ul style={{ listStyle: "none", padding: 0, marginBottom: 20 }}>
              {plan.features.map((f, fi) => (
                <li key={fi} style={{ padding: "8px 0", borderBottom: fi < plan.features.length - 1 ? "1px solid var(--card-border)" : "none" }}>
                  <Icon name={plan.name === "Free" && f === "Advanced analytics" ? "x" : "check"} size={16} style={{ color: plan.name === "Free" && f === "Advanced analytics" ? "var(--red)" : "var(--green)", marginRight: 8 }} />
                  {f}
                </li>
              ))}
              {plan.features.length === 0 && (
                <li style={{ padding: "8px 0", color: "var(--ink-500)" }}>No features configured yet</li>
              )}
            </ul>
            <button className={`btn ${plan.popular ? "btn-primary" : "btn-ghost"}`} style={{ width: "100%" }} onClick={() => openModal("edit", plan, idx)}>Edit Plan</button>
          </div>
        ))}
      </div>
      {modal && (
        <RecordModal
          mode={modal.mode === "create" ? "create" : "edit"}
          title={modal.mode === "create" ? "Add Plan" : "Edit Plan"}
          record={modal.record}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={modal.mode === "edit" ? handleDelete : undefined}
        />
      )}
    </>
  );
}
