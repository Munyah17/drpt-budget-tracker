"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { adminHeaders, updateAdminUser, type AdminUserPatch } from "@/lib/adminClient";
import { paidActive } from "@/lib/paid";
import Modal from "@/components/Modal";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

interface ProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  profession: string | null;
  role: string | null;
  currency: string | null;
  is_paid: boolean | null;
  paid_until: string | null;
  country: string | null;
  organisation: string | null;
  corporate_id: string | null;
  created_at: string | null;
}

interface OverrideForm {
  name: string;
  role: string;
  paid: "paid" | "free";
  paidUntil: string;
  currency: string;
  phone: string;
  profession: string;
  country: string;
  organisation: string;
  corporateId: string;
}

const ALL_ROLES: readonly string[] = ["super_admin", "admin", "user", "corporate", "employee"];

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export default function AdminAccessPage() {
  const t = useTranslations("Pages.adm_risk_access");
  const { user, toast } = useAppData();
  const adminEmail = user?.email;
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [paidFilter, setPaidFilter] = useState("");
  const [editing, setEditing] = useState<ProfileRow | null>(null);
  const [form, setForm] = useState<OverrideForm | null>(null);
  const [saving, setSaving] = useState(false);

  const canGrantSuper = user?.role === "super_admin";

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { headers: await adminHeaders(adminEmail) });
      const data = await res.json().catch(() => null);
      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [adminEmail]);

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((p) => {
      if (roleFilter && p.role !== roleFilter) return false;
      if (paidFilter === "paid" && !p.is_paid) return false;
      if (paidFilter === "free" && p.is_paid) return false;
      if (!q) return true;
      return (
        (p.name ?? "").toLowerCase().includes(q) ||
        (p.email ?? "").toLowerCase().includes(q) ||
        (p.phone ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter, paidFilter]);

  const roleOptions = useMemo(
    () => ALL_ROLES.map((role) => ({ value: role, label: t(`role_${role}`) })),
    [t]
  );

  const editingRole = editing?.role;
  const roleChoices = useMemo(() => {
    const base = canGrantSuper ? ALL_ROLES : ALL_ROLES.filter((r) => r !== "super_admin");
    if (editingRole && !base.includes(editingRole)) return [...base, editingRole];
    return base;
  }, [canGrantSuper, editingRole]);

  function openOverride(p: ProfileRow) {
    setEditing(p);
    setForm({
      name: p.name ?? "",
      role: p.role ?? "user",
      paid: p.is_paid ? "paid" : "free",
      paidUntil: toLocalInput(p.paid_until),
      currency: p.currency ?? "",
      phone: p.phone ?? "",
      profession: p.profession ?? "",
      country: p.country ?? "",
      organisation: p.organisation ?? "",
      corporateId: p.corporate_id ?? "",
    });
  }

  async function saveOverride() {
    if (!editing || !form) return;
    setSaving(true);
    try {
      const patch: AdminUserPatch = {
        id: editing.id,
        name: form.name,
        role: form.role,
        is_paid: form.paid === "paid",
        paid_until: form.paid === "paid" ? fromLocalInput(form.paidUntil) : null,
      };
      const currentRow = editing as unknown as Record<string, string | null>;
      const optional: [keyof OverrideForm, string][] = [
        ["currency", "currency"],
        ["phone", "phone"],
        ["profession", "profession"],
        ["country", "country"],
        ["organisation", "organisation"],
        ["corporateId", "corporate_id"],
      ];
      for (const [formKey, patchKey] of optional) {
        const next = String(form[formKey] ?? "").trim();
        const prev = String(currentRow[patchKey] ?? "").trim();
        if (next !== prev) patch[patchKey] = next;
      }
      await updateAdminUser(user?.email, patch);
      toast(t("toastSaved"), "check-circle");
      setEditing(null);
      setForm(null);
      await refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("toastFailed"), "x");
    } finally {
      setSaving(false);
    }
  }

  function roleBadge(role: string | null) {
    const cls =
      role === "super_admin" ? "badge-red" : role === "admin" ? "badge-amber" : "badge-green";
    return <span className={`badge ${cls}`}>{role ?? "user"}</span>;
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-ghost" onClick={() => void refresh()} disabled={loading}>
          <Icon name="refresh-cw" size={15} style={{ marginRight: 6 }} />
          {t("refresh")}
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          categoryOptions={roleOptions}
          statusOptions={[
            { value: "paid", label: t("filterPaid") },
            { value: "free", label: t("filterFree") },
          ]}
          onSearchChange={setSearch}
          onCategoryChange={setRoleFilter}
          onStatusChange={setPaidFilter}
        />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thName")}</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thEmail")}</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thRole")}</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thPlan")}</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thPaidUntil")}</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thStatus")}</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thActions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                    {loading ? t("loading") : t("emptyState")}
                  </td>
                </tr>
              )}
              {filtered.map((p) => {
                const active = paidActive(p);
                const status = !p.is_paid ? t("statusFree") : active ? t("statusActive") : t("statusExpired");
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                    <td style={{ padding: "12px 8px" }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name || p.email || "—"}</div>
                      {p.phone && <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{p.phone}</div>}
                    </td>
                    <td style={{ padding: "12px 8px", fontSize: 13 }}>{p.email || "—"}</td>
                    <td style={{ padding: "12px 8px" }}>{roleBadge(p.role)}</td>
                    <td style={{ padding: "12px 8px", fontSize: 13 }}>{p.is_paid ? t("planPaid") : t("planFree")}</td>
                    <td style={{ padding: "12px 8px", fontSize: 13 }}>
                      {p.paid_until ? new Date(p.paid_until).toLocaleDateString("en-GB") : p.is_paid ? t("exempt") : "—"}
                    </td>
                    <td style={{ padding: "12px 8px" }}>
                      <span className={`badge ${!p.is_paid ? "badge-amber" : active ? "badge-green" : "badge-red"}`}>{status}</span>
                    </td>
                    <td style={{ padding: "12px 8px" }}>
                      <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => openOverride(p)}>
                        <Icon name="shield" size={14} style={{ marginRight: 4 }} />
                        {t("override")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && form && (
        <Modal title={t("overrideTitle")} onClose={() => { setEditing(null); setForm(null); }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>{t("fieldName")}</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>{t("fieldEmail")}</label>
              <input value={editing.email ?? ""} disabled />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>{t("fieldRole")}</label>
              <select className="settings-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {roleChoices.map((role) => (
                  <option key={role} value={role}>{t(`role_${role}`)}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>{t("fieldPlan")}</label>
              <select className="settings-select" value={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.value as "paid" | "free" })}>
                <option value="paid">{t("planPaid")}</option>
                <option value="free">{t("planFree")}</option>
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>{t("fieldPaidUntil")}</label>
              <input type="datetime-local" value={form.paidUntil} onChange={(e) => setForm({ ...form, paidUntil: e.target.value })} disabled={form.paid === "free"} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>{t("fieldCurrency")}</label>
              <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="USD" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>{t("fieldPhone")}</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>{t("fieldProfession")}</label>
              <input value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>{t("fieldCountry")}</label>
              <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="ZW" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>{t("fieldOrganisation")}</label>
              <input value={form.organisation} onChange={(e) => setForm({ ...form, organisation: e.target.value })} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>{t("fieldCorporateId")}</label>
              <input value={form.corporateId} onChange={(e) => setForm({ ...form, corporateId: e.target.value })} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => void saveOverride()} disabled={saving}>
              {saving ? t("saving") : t("save")}
            </button>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setEditing(null); setForm(null); }}>
              {t("cancel")}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
