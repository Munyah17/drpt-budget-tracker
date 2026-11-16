"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

import { useCrud } from "@/lib/useCrud";
import { useAppData } from "@/lib/AppDataContext";
import { createAdminAccount, adminHeaders, impersonateUser, roleHome } from "@/lib/adminClient";
import { paidActive } from "@/lib/paid";
interface Person {
  id?: string;
  name: string;
  email: string;
  plan: string;
  expiry: string;
  status: string;
  paymentMethod: string;
  paidOn: string;
  amount: string;
  reference: string;
  isPaid?: boolean;
  paidOverride?: string | null;
  pendingPaymentId?: number | null;
}

interface PaymentRow {
  provider: string;
  method: string | null;
  amount: number | null;
  currency: string;
  reference: string | null;
  paid_at: string;
}

interface ProfileRow {
  id: string;
  name: string;
  email: string;
  is_paid: boolean;
  paid_until: string | null;
  paid_override: string | null;
  payment: PaymentRow | null;
}

interface ApprovalRow {
  id: number;
  user_id: string | null;
  status: string;
}

export default function AdminIndividualsPage() {
  const t = useTranslations("Pages.adm_people_individuals");
  const tc = useTranslations("Pages.components");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { user, toast } = useAppData();
  const [entering, setEntering] = useState("");
  const crud = useCrud<Person>([], t("entityName"), ["name", "email", "plan", "expiry", "status"], {
    extraFields: ["password"],
    readonlyFields: ["paymentMethod", "paidOn", "amount", "reference"],
    onCreate: async (v) => {
      await createAdminAccount(user?.email, {
        email: v.email,
        password: v.password,
        name: v.name,
        role: "user",
        isPaid: v.plan.toLowerCase() === "paid",
      });
    },
  });

  const { setItems } = crud;
  const refresh = useCallback(async () => {
    const headers = await adminHeaders(user?.email);
    const [usersRes, approvalsRes] = await Promise.all([
      fetch("/api/admin/users?role=user", { headers }),
      fetch("/api/admin/approvals", { headers }),
    ]);
    const data = await usersRes.json().catch(() => null);
    const approvalsData = await approvalsRes.json().catch(() => null);
    const rows: ProfileRow[] = Array.isArray(data) ? data : data?.users ?? [];
    const pendingByUser = new Map<string, number>();
    for (const a of (approvalsData?.approvals ?? []) as ApprovalRow[]) {
      if (a.status === "pending" && a.user_id) pendingByUser.set(a.user_id, a.id);
    }
    setItems(
      rows.map((p) => {
        const pay = p.payment;
        const active = paidActive({ is_paid: p.is_paid, paid_until: p.paid_until, paid_override: p.paid_override });
        const pendingPaymentId = pendingByUser.get(p.id) ?? null;
        return {
          id: p.id,
          name: p.name || p.email,
          email: p.email,
          plan: active ? "Paid" : "Free",
          expiry: p.paid_until ? new Date(p.paid_until).toLocaleDateString("en-GB") : "—",
          status: active ? "Active" : pendingPaymentId ? "Pending" : "Expired",
          paymentMethod: pay ? (pay.method ? `${pay.provider} (${pay.method})` : pay.provider) : "—",
          paidOn: pay ? new Date(pay.paid_at).toLocaleDateString("en-GB") : "—",
          amount: pay?.amount != null ? `${pay.currency.toUpperCase()} ${pay.amount.toFixed(2)}` : "—",
          reference: pay?.reference || "—",
          isPaid: active,
          paidOverride: p.paid_override,
          pendingPaymentId,
        };
      })
    );
  }, [user?.email, setItems]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function viewAs(person: Person) {
    if (entering) return;
    setEntering(person.email);
    try {
      const info = await impersonateUser(person.email, user?.email);
      window.location.assign(roleHome(info.role));
    } catch (err) {
      toast(tc("toastViewAsFail", { msg: err instanceof Error ? err.message : "" }), "x");
      setEntering("");
    }
  }

  async function approvePending(person: Person) {
    if (!person.pendingPaymentId) return;
    try {
      const res = await fetch("/api/admin/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await adminHeaders(user?.email)) },
        body: JSON.stringify({ paymentId: person.pendingPaymentId, action: "approve" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      toast(t("toastActivated"), "check-circle");
      await refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("activateFailed"), "x");
    }
  }

  async function setPaidOverride(person: Person, paid: boolean) {
    if (!person.id) return;
    const ok = window.confirm(paid ? t("confirmActivate", { name: person.name }) : t("confirmDeactivate", { name: person.name }));
    if (!ok) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(await adminHeaders(user?.email)) },
        body: JSON.stringify({
          id: person.id,
          is_paid: paid,
          paid_until: null,
          paid_override: paid ? "paid" : "unpaid",
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      toast(paid ? t("toastActivated") : t("toastDeactivated"), paid ? "check-circle" : "x");
      await refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("activateFailed"), "x");
    }
  }

  const filteredData = useMemo(() => {
    return crud.items.filter((person) =>
      (!statusFilter || person.status === statusFilter) &&
      (person.name.toLowerCase().includes(search.toLowerCase()) || person.email.toLowerCase().includes(search.toLowerCase()))
    );
  }, [crud.items, search, statusFilter]);

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => crud.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          {t("addPerson")}
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          statusOptions={[{ value: "Active", label: t("statusActive") }, { value: "Pending", label: t("statusPending") }, { value: "Expired", label: t("statusExpired") }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thName")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thEmail")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thPlan")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thExpiry")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  {t("emptyState")}
                </td>
              </tr>
            )}
            {filteredData.map((person, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{person.name}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{person.email}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{person.plan}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{person.expiry}</td>
                <td style={{ padding: "12px 8px" }}><span className={`badge ${person.status === "Active" ? "badge-green" : "badge-red"}`}>{person.status}</span></td>
                <td style={{ padding: "12px 8px", whiteSpace: "nowrap" }}>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: "4px 8px", fontSize: 12, color: "var(--rose-600)" }}
                    onClick={() => viewAs(person)}
                    disabled={entering === person.email}
                    title={tc("viewAs")}
                  >
                    <Icon name="user-circle" size={14} style={{ marginRight: 4 }} />{tc("viewAs")}
                  </button>
                  {person.pendingPaymentId ? (
                    <button className="btn btn-primary" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => approvePending(person)}>
                      <Icon name="check-circle" size={14} style={{ marginRight: 4 }} />{t("approve")}
                    </button>
                  ) : person.status !== "Active" ? (
                    <button className="btn btn-primary" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => setPaidOverride(person, true)}>
                      <Icon name="check-circle" size={14} style={{ marginRight: 4 }} />{t("activate")}
                    </button>
                  ) : (
                    <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 12, color: "var(--red)" }} onClick={() => setPaidOverride(person, false)}>
                      <Icon name="x" size={14} style={{ marginRight: 4 }} />{t("deactivate")}
                    </button>
                  )}
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("view", person, crud.items.indexOf(person))}><Icon name="eye" size={14} style={{ marginRight: 4 }} />{t("view")}</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("edit", person, crud.items.indexOf(person))}><Icon name="edit" size={14} style={{ marginRight: 4 }} />{t("edit")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      {crud.modalNode}
    </>
  );
}
