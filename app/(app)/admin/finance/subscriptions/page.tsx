"use client";

import { useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

import { useCrud } from "@/lib/useCrud";
interface Subscription {
  user: string;
  plan: string;
  startDate: string;
  expiry: string;
  status: string;
}

const SUBSCRIPTIONS_DATA: Subscription[] = [
  { user: "John Doe", plan: "Individual ($1/yr)", startDate: "2024-12-31", expiry: "2025-12-31", status: "Active" },
  { user: "Sarah Smith", plan: "Individual ($1/yr)", startDate: "2024-05-15", expiry: "2025-05-15", status: "Expired" },
];

export default function AdminSubscriptionsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const crud = useCrud(SUBSCRIPTIONS_DATA, "Subscription");

  const { toast } = useAppData();
  const filteredData = useMemo(() => {
    return crud.items.filter((subscription) =>
      (!statusFilter || subscription.status === statusFilter) &&
      (subscription.user.toLowerCase().includes(search.toLowerCase()) || subscription.plan.toLowerCase().includes(search.toLowerCase()))
    );
  }, [crud.items, search, statusFilter]);

  const handleRenew = (item: string) => {
    toast(`Renewing ${item}...`);
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Subscriptions</h2>
          <p className="section-sub">Manage user subscriptions</p>
        </div>
        <button className="btn btn-primary" onClick={() => crud.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Add Subscription
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search subscriptions..."
          statusOptions={[{ value: "Active", label: "Active" }, { value: "Expired", label: "Expired" }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>User</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Plan</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Start Date</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Expiry</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No subscriptions match your search.
                </td>
              </tr>
            )}
            {filteredData.map((subscription, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{subscription.user}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{subscription.plan}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{subscription.startDate}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{subscription.expiry}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${subscription.status === "Active" ? "badge-green" : "badge-red"}`}>
                    {subscription.status}
                  </span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("edit", subscription, crud.items.indexOf(subscription))}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                  {subscription.status === "Expired" && (
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleRenew(subscription.user)}><Icon name="refresh-cw" size={14} style={{ marginRight: 4 }} />Renew</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {crud.modalNode}
    </>
  );
}
