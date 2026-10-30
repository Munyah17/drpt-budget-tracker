"use client";

import { useState, useMemo, FormEvent } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import Modal from "@/components/Modal";
import { useAppData } from "@/lib/AppDataContext";

interface Corporate {
  id: string;
  name: string;
  industry: string;
  contact_name: string;
  contact_email: string;
  plan: string;
  seats: number;
  status: "Onboarding" | "Active";
  created_at: string;
}

const PLANS = ["Starter", "Growth", "Enterprise"] as const;

export default function AdminCorporatesPage() {
  const t = useTranslations("Pages.adm_orgs_corporates");
  const { toast } = useAppData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [orgs, setOrgs] = useState<Corporate[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<Corporate | null>(null);
  const [f, setF] = useState({ name: "", industry: "", contactName: "", contactEmail: "", plan: "Growth", seats: "25" });

  const refresh = () => {
    fetch("/api/admin/corporates")
      .then((r) => r.json())
      .then((rows) => setOrgs(Array.isArray(rows) ? rows : []))
      .catch(() => setOrgs([]));
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

  async function create(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const res = await fetch("/api/admin/corporates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: f.name.trim(),
        industry: f.industry.trim(),
        contact_name: f.contactName.trim(),
        contact_email: f.contactEmail.trim(),
        plan: f.plan,
        seats: Number(f.seats) || 25,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const row = await res.json();
      toast(t("toastCreated", { name: row.name }), "check-circle");
      setAdding(false);
      setCreated(row);
      setF({ name: "", industry: "", contactName: "", contactEmail: "", plan: "Growth", seats: "25" });
      refresh();
    } else {
      toast(t("toastError"), "x");
    }
  }

  async function activate(o: Corporate) {
    await fetch("/api/admin/corporates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: o.id, status: "Active" }),
    });
    toast(t("toastActive", { name: o.name }), "check-circle");
    refresh();
  }

  async function remove(o: Corporate) {
    await fetch(`/api/admin/corporates?id=${o.id}`, { method: "DELETE" });
    toast(t("toastRemoved", { name: o.name }), "trash-2");
    refresh();
  }

  function copyInvite(o: Corporate) {
    const link = `${window.location.origin}/login?signup=1`;
    const msg = `Welcome to WellSpend for Business — ${o.name} is set up on the ${o.plan} plan (${o.seats} seats). Your admin portal: ${link}`;
    navigator.clipboard.writeText(msg).then(() => toast(t("toastCopied"), "link"));
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAdding(true)}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          {t("addCorporate")}
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          statusOptions={[{ value: "Active", label: t("statusActive") }, { value: "Onboarding", label: t("statusOnboarding") }]}
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
                <td style={{ padding: "12px 8px" }}><span className={`badge ${o.status === "Active" ? "badge-green" : "badge-amber"}`}>{o.status}</span></td>
                <td style={{ padding: "12px 8px", whiteSpace: "nowrap" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => copyInvite(o)} title={t("invite")}><Icon name="link" size={14} style={{ marginRight: 4 }} />{t("invite")}</button>
                  {o.status === "Onboarding" && (
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => activate(o)}><Icon name="check" size={14} style={{ marginRight: 4 }} />{t("activate")}</button>
                  )}
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--red)" }} onClick={() => remove(o)}><Icon name="trash-2" size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {adding && (
        <Modal title={t("addTitle")} onClose={() => setAdding(false)}>
          <form onSubmit={create}>
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
              {saving ? t("creating") : t("create")}
            </button>
          </form>
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
