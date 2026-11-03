"use client";

import { useState, useMemo, FormEvent } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import Modal from "@/components/Modal";
import { useAppData } from "@/lib/AppDataContext";
import { adminHeaders } from "@/lib/adminClient";
import { ukDate } from "@/lib/format";

interface Corporate {
  id: string;
  name: string;
  industry: string;
  contact_name: string;
  contact_email: string;
  plan: string;
  seats: number;
  status: "Onboarding" | "Active" | "Suspended";
  created_at: string;
}
interface Employee {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  profession: string | null;
  role: string;
  is_paid: boolean;
  created_at: string;
}

const PLANS = ["Starter", "Growth", "Enterprise"] as const;
const EMPTY_FORM = { name: "", industry: "", contactName: "", contactEmail: "", plan: "Growth", seats: "25" };

const badgeClass = (s: string) =>
  s === "Active" ? "badge-green" : s === "Suspended" ? "badge-red" : "badge-amber";

export default function AdminCorporatesPage() {
  const t = useTranslations("Pages.adm_orgs_corporates");
  const { toast, user } = useAppData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [orgs, setOrgs] = useState<Corporate[] | null>(null);
  const [formOpen, setFormOpen] = useState<"create" | Corporate | null>(null);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<Corporate | null>(null);
  const [view, setView] = useState<Corporate | null>(null);
  const [viewEmployees, setViewEmployees] = useState<Employee[] | null>(null);
  const [empSearch, setEmpSearch] = useState("");
  const [f, setF] = useState(EMPTY_FORM);

  const refresh = async () => {
    try {
      const res = await fetch("/api/admin/corporates", { headers: await adminHeaders(user?.email) });
      const rows = await res.json();
      setOrgs(Array.isArray(rows) ? rows : []);
    } catch {
      setOrgs([]);
    }
  };
  if (orgs === null) {
    Promise.resolve().then(refresh);
  }

  const filtered = useMemo(() => {
    const list = orgs ?? [];
    return list.filter((o) =>
      (!statusFilter || o.status === statusFilter) &&
      o.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [orgs, search, statusFilter]);

  const filteredEmployees = useMemo(() => {
    const q = empSearch.trim().toLowerCase();
    const list = viewEmployees ?? [];
    if (!q) return list;
    return list.filter((e) =>
      [e.name, e.email, e.phone, e.profession]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    );
  }, [viewEmployees, empSearch]);

  async function openView(o: Corporate) {
    setView(o);
    setViewEmployees(null);
    setEmpSearch("");
    try {
      const res = await fetch(`/api/admin/corporates?id=${o.id}`, {
        headers: await adminHeaders(user?.email),
      });
      const data = await res.json();
      setViewEmployees(Array.isArray(data.employees) ? data.employees : []);
    } catch {
      setViewEmployees([]);
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const payload = {
      name: f.name.trim(),
      industry: f.industry.trim(),
      contact_name: f.contactName.trim(),
      contact_email: f.contactEmail.trim(),
      plan: f.plan,
      seats: Number(f.seats) || 25,
    };
    const editing = formOpen !== null && formOpen !== "create" ? formOpen : null;
    const res = await fetch("/api/admin/corporates", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json", ...(await adminHeaders(user?.email)) },
      body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload),
    });
    setSaving(false);
    if (res.ok) {
      const row = await res.json();
      if (editing) {
        toast(t("toastSaved"), "check-circle");
      } else {
        toast(t("toastCreated", { name: row.name }), "check-circle");
        setCreated(row);
      }
      setFormOpen(null);
      setF(EMPTY_FORM);
      refresh();
    } else {
      toast(t("toastError"), "x");
    }
  }

  async function setStatus(o: Corporate, status: Corporate["status"]) {
    await fetch("/api/admin/corporates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(await adminHeaders(user?.email)) },
      body: JSON.stringify({ id: o.id, status }),
    });
    toast(
      status === "Suspended" ? t("toastSuspended", { name: o.name }) : t("toastActive", { name: o.name }),
      status === "Suspended" ? "alert-triangle" : "check-circle"
    );
    refresh();
  }

  async function remove(o: Corporate) {
    await fetch(`/api/admin/corporates?id=${o.id}`, { method: "DELETE", headers: await adminHeaders(user?.email) });
    toast(t("toastRemoved", { name: o.name }), "trash-2");
    refresh();
  }

  function copyInvite(o: Corporate) {
    const link = `${window.location.origin}/login?signup=1`;
    const msg = `Welcome to WellSpend for Business — ${o.name} is set up on the ${o.plan} plan (${o.seats} seats). Your admin portal: ${link}`;
    navigator.clipboard.writeText(msg).then(() => toast(t("toastCopied"), "link"));
  }

  const field = (k: keyof typeof f, label: string, opts?: { type?: string; ph?: string; required?: boolean }) => (
    <div className="field" key={k}>
      <label>{label}{opts?.required ? " *" : ""}</label>
      <input
        type={opts?.type ?? "text"}
        placeholder={opts?.ph}
        value={f[k]}
        onChange={(e) => setF({ ...f, [k]: e.target.value })}
        required={opts?.required}
      />
    </div>
  );

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setF(EMPTY_FORM); setFormOpen("create"); }}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          {t("addCorporate")}
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          statusOptions={[
            { value: "Active", label: t("statusActive") },
            { value: "Onboarding", label: t("statusOnboarding") },
            { value: "Suspended", label: t("statusSuspended") },
          ]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thOrganisation")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thIndustry")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thContact")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thPlan")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thSeats")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  {t("emptyState")}
                </td>
              </tr>
            )}
            {filtered.map((o) => (
              <tr key={o.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{o.name}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{o.industry || "—"}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>
                  {o.contact_name || "—"}{o.contact_email ? ` · ${o.contact_email}` : ""}
                </td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{o.plan}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{o.seats}</td>
                <td style={{ padding: "12px 8px" }}><span className={`badge ${badgeClass(o.status)}`}>{o.status}</span></td>
                <td style={{ padding: "12px 8px", whiteSpace: "nowrap" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => openView(o)} title={t("view")}>
                    <Icon name="eye" size={14} />
                  </button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => { setF({ name: o.name, industry: o.industry, contactName: o.contact_name, contactEmail: o.contact_email, plan: o.plan, seats: String(o.seats) }); setFormOpen(o); }} title={t("edit")}>
                    <Icon name="pencil" size={14} />
                  </button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => copyInvite(o)} title={t("invite")}>
                    <Icon name="link" size={14} />
                  </button>
                  {o.status === "Suspended" ? (
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => setStatus(o, "Active")} title={t("activate")}>
                      <Icon name="check" size={14} />
                    </button>
                  ) : (
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--amber)" }} onClick={() => setStatus(o, "Suspended")} title={t("suspend")}>
                      <Icon name="alert-triangle" size={14} />
                    </button>
                  )}
                  {o.status === "Onboarding" && (
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => setStatus(o, "Active")} title={t("activate")}>
                      <Icon name="check" size={14} />
                    </button>
                  )}
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--red)" }} onClick={() => remove(o)} title={t("remove")}>
                    <Icon name="trash-2" size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit */}
      {formOpen && (
        <Modal title={formOpen === "create" ? t("addTitle") : t("editTitle")} onClose={() => setFormOpen(null)}>
          <form onSubmit={save}>
            {field("name", t("fName"), { required: true, ph: t("fNamePh") })}
            {field("industry", t("fIndustry"), { ph: t("fIndustryPh") })}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {field("contactName", t("fContact"), { required: true, ph: t("fContactPh") })}
              {field("contactEmail", t("fEmail"), { type: "email", ph: "hr@company.com" })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="field">
                <label>{t("fPlan")}</label>
                <select className="settings-select" style={{ width: "100%" }} value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value })}>
                  {PLANS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              {field("seats", t("fSeats"), { type: "number" })}
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={saving}>
              {saving ? t("saving") : formOpen === "create" ? t("create") : t("save")}
            </button>
          </form>
        </Modal>
      )}

      {/* Detail view: corporate info + employees */}
      {view && (
        <Modal title={view.name} onClose={() => setView(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 18px", fontSize: 13.5, marginBottom: 18 }}>
            <div><span style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 600 }}>{t("thIndustry")}</span><div style={{ fontWeight: 600 }}>{view.industry || "—"}</div></div>
            <div><span style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 600 }}>{t("thContact")}</span><div style={{ fontWeight: 600 }}>{view.contact_name || "—"}<br />{view.contact_email}</div></div>
            <div><span style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 600 }}>{t("thPlan")}</span><div style={{ fontWeight: 600 }}>{view.plan} · {view.seats} {t("seatsShort")}</div></div>
            <div><span style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 600 }}>{t("thStatus")}</span><div><span className={`badge ${badgeClass(view.status)}`}>{view.status}</span></div></div>
            <div><span style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 600 }}>{t("since")}</span><div style={{ fontWeight: 600 }}>{ukDate(view.created_at.slice(0, 10))}</div></div>
          </div>

          <div className="card-head" style={{ marginBottom: 10 }}>
            <h3 style={{ fontSize: 14.5, fontWeight: 700, margin: 0 }}>{t("employeesTitle")}</h3>
            <span className="chip">{viewEmployees?.length ?? "…"}</span>
          </div>
          <input
            type="search"
            placeholder={t("empSearchPh")}
            value={empSearch}
            onChange={(e) => setEmpSearch(e.target.value)}
            style={{ width: "100%", marginBottom: 10, padding: "9px 12px", borderRadius: 10, border: "1px solid var(--card-border)", background: "var(--paper)", color: "var(--ink-900)" }}
          />
          {viewEmployees === null ? (
            <p style={{ fontSize: 13, color: "var(--ink-500)" }}>{t("loading")}</p>
          ) : filteredEmployees.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--ink-500)" }}>{t("emptyEmployees")}</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                  <th style={{ padding: "8px", fontSize: 12 }}>{t("thEmployee")}</th>
                  <th style={{ padding: "8px", fontSize: 12 }}>{t("thProfession")}</th>
                  <th style={{ padding: "8px", fontSize: 12 }}>{t("thPhone")}</th>
                  <th style={{ padding: "8px", fontSize: 12 }}>{t("thJoined")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                    <td style={{ padding: "8px", fontSize: 13 }}>
                      <div style={{ fontWeight: 600 }}>{e.name || "—"}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{e.email}</div>
                    </td>
                    <td style={{ padding: "8px", fontSize: 13 }}>{e.profession || "—"}</td>
                    <td style={{ padding: "8px", fontSize: 13 }}>{e.phone || "—"}</td>
                    <td style={{ padding: "8px", fontSize: 13 }}>{ukDate(e.created_at.slice(0, 10))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal>
      )}

      {created && (
        <Modal title={t("createdTitle")} onClose={() => setCreated(null)}>
          <p style={{ fontSize: 14, lineHeight: 1.7, margin: "0 0 14px" }}>
            {t("createdBody", { name: created.name, contact: created.contact_name })}
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { copyInvite(created); setCreated(null); }}>
              <Icon name="link" size={14} style={{ marginRight: 6 }} />{t("copyInvite")}
            </button>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setCreated(null)}>{t("done")}</button>
          </div>
        </Modal>
      )}
    </>
  );
}
