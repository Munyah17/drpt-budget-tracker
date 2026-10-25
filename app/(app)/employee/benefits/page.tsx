"use client";

import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import RecordModal, { RowRecord } from "@/components/RecordModal";

const BENEFITS = [
  { name: "Health Insurance", provider: "Vitality Health", status: "Enrolled", detail: "Family cover — $0 employee cost" },
  { name: "Pension Scheme", provider: "Nest Pensions", status: "Enrolled", detail: "5% employee / 4% employer match" },
  { name: "Life Insurance", provider: "Aviva", status: "Enrolled", detail: "4× annual salary cover" },
  { name: "Dental Cover", provider: "Bupa", status: "Available", detail: "$12/mo employee contribution" },
  { name: "Cycle to Work", provider: "Cyclescheme", status: "Available", detail: "Tax-free bike up to $1,000" },
];

export default function EmployeeBenefitsPage() {
  const { user, toast } = useAppData();
  const [benefits, setBenefits] = useState(BENEFITS);
  const [managing, setManaging] = useState<RowRecord | null>(null);

  const handleAction = (name: string, status: string) => {
    if (status === "Enrolled") {
      const b = benefits.find((x) => x.name === name);
      if (b) setManaging({ name: b.name, provider: b.provider, status: b.status, detail: b.detail });
    } else {
      setBenefits((prev) => prev.map((x) => (x.name === name ? { ...x, status: "Enrolled" } : x)));
      toast(`Enrolled in ${name}`);
    }
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">My Benefits</h2>
          <p className="section-sub">Provided by {user?.organisation ?? "your organisation"}</p>
        </div>
      </div>

      <div className="grid grid-2">
        {benefits.map((b) => (
          <div key={b.name} className="glass-card card-pad" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: "var(--pink-100)", color: "var(--rose-600)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon name="heart-pulse" size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{b.name}</div>
                <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{b.provider} — {b.detail}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className={`badge ${b.status === "Enrolled" ? "badge-green" : "badge-blue"}`}>{b.status}</span>
              <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => handleAction(b.name, b.status)}>
                {b.status === "Enrolled" ? "Manage" : "Enrol"}
              </button>
            </div>
          </div>
        ))}
      </div>
      {managing && <RecordModal mode="view" title="Benefit Details" record={managing} onClose={() => setManaging(null)} />}
    </>
  );
}
