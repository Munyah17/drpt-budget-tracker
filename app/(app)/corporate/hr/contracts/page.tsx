"use client";

import { useEffect, useState, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import FilterBar from "@/components/FilterBar";
import { CONTRACT_TEMPLATES, ContractTemplate } from "@/lib/contractTemplates";
import { openPrintDoc } from "@/lib/printDoc";
import { ukDate } from "@/lib/format";

const th = { padding: "12px 8px", fontWeight: 600, fontSize: 13 } as const;
const td = { padding: "12px 8px", fontSize: 13 } as const;

interface ContractRow {
  id: string; template: string; title: string; employee: string;
  data: Record<string, string>; status: string; created_at: string;
}

const FLOW = ["Draft", "Sent", "Signed", "Filed"];
const statusBadge = (s: string) =>
  s === "Filed" ? "badge-green" : s === "Signed" ? "badge-blue" : s === "Sent" ? "badge-amber" : "";

function GenerateModal({
  tpl, company, onClose, onCreated,
}: { tpl: ContractTemplate; company: string; onClose: () => void; onCreated: (c: ContractRow) => void }) {
  const t = useTranslations("Pages.corp_contracts");
  const { toast } = useAppData();
  const [data, setData] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/hr/contracts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template: tpl.id,
        title: `${tpl.label} — ${data.employee || "Employee"}`,
        employee: data.employee ?? "",
        data,
      }),
    });
    const row = await res.json().catch(() => null);
    setBusy(false);
    if (!row?.id) { toast(t("toastError"), "x"); return; }
    // Open the filled document straight away — print/sign cycle starts now
    openPrintDoc(tpl.render(data, company));
    toast(t("toastCreated"), "check-circle");
    onCreated(row);
  }

  return (
    <Modal title={tpl.label} onClose={onClose}>
      <form onSubmit={submit} style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 4 }}>
        <p style={{ fontSize: 12.5, color: "var(--ink-500)", margin: "0 0 12px" }}>{tpl.description}</p>
        {tpl.fields.map((f) => (
          <div className="field" key={f.key}>
            <label>{f.label}</label>
            <input
              type={f.type ?? "text"}
              value={data[f.key] ?? ""}
              placeholder={f.placeholder}
              onChange={(e) => setData((p) => ({ ...p, [f.key]: e.target.value }))}
            />
          </div>
        ))}
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit" disabled={busy}>
          {busy ? t("generating") : t("generatePrint")}
        </button>
      </form>
    </Modal>
  );
}

export default function ContractsPage() {
  const t = useTranslations("Pages.corp_contracts");
  const { toast, user } = useAppData();
  const company = user?.organisation ?? "WellSpend";
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [picking, setPicking] = useState<ContractTemplate | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetch("/api/hr/contracts").then((r) => r.json()).then((rows) => setContracts(Array.isArray(rows) ? rows : [])).catch(() => {});
  }, []);

  const filtered = contracts.filter((c) =>
    (!statusFilter || c.status === statusFilter) &&
    (c.employee.toLowerCase().includes(search.toLowerCase()) || c.title.toLowerCase().includes(search.toLowerCase()))
  );

  function reprint(c: ContractRow) {
    const tpl = CONTRACT_TEMPLATES.find((x) => x.id === c.template);
    if (tpl) openPrintDoc(tpl.render(c.data || {}, company));
  }

  async function advance(c: ContractRow) {
    const next = FLOW[Math.min(FLOW.indexOf(c.status) + 1, FLOW.length - 1)];
    await fetch("/api/hr/contracts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id, status: next }) });
    setContracts((p) => p.map((x) => (x.id === c.id ? { ...x, status: next } : x)));
    toast(t("toastAdvanced", { status: next }), "check-circle");
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
      </div>

      <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>{t("templatesTitle")}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 12, marginBottom: 24 }}>
        {CONTRACT_TEMPLATES.map((tpl) => (
          <button key={tpl.id} className="glass-card card-pad" style={{ textAlign: "left", cursor: "pointer", border: "1px solid var(--card-border)" }} onClick={() => setPicking(tpl)}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <Icon name="file-text" size={18} style={{ color: "var(--rose-600)" }} />
              <b style={{ fontSize: 14 }}>{tpl.label}</b>
            </div>
            <p style={{ fontSize: 12, color: "var(--ink-500)", margin: 0, lineHeight: 1.5 }}>{tpl.description}</p>
          </button>
        ))}
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPh")}
          statusOptions={FLOW.map((s) => ({ value: s, label: s }))}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={th}>{t("colDoc")}</th><th style={th}>{t("colEmployee")}</th><th style={th}>{t("colStatus")}</th>
              <th style={th}>{t("colCreated")}</th><th style={th}>{t("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>{t("emptyState")}</td></tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ ...td, fontWeight: 600 }}>{c.title}</td>
                <td style={td}>{c.employee || "—"}</td>
                <td style={td}><span className={`badge ${statusBadge(c.status)}`}>{c.status}</span></td>
                <td style={td}>{ukDate(c.created_at.slice(0, 10))}</td>
                <td style={td}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => reprint(c)}>
                    <Icon name="printer" size={13} style={{ marginRight: 4 }} />{t("print")}
                  </button>
                  {c.status !== "Filed" && (
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--green)" }} onClick={() => advance(c)}>
                      <Icon name="chevron-right" size={13} style={{ marginRight: 4 }} />{FLOW[FLOW.indexOf(c.status) + 1]}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {picking && <GenerateModal tpl={picking} company={company} onClose={() => setPicking(null)} onCreated={(c) => { setContracts((p) => [c, ...p]); setPicking(null); }} />}
    </>
  );
}
