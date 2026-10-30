"use client";

import { useEffect, useState, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import FilterBar from "@/components/FilterBar";
import { HR_FORMS, HrFormTemplate } from "@/lib/hrForms";
import { openPrintDoc } from "@/lib/printDoc";
import { ukDate } from "@/lib/format";

const th = { padding: "12px 8px", fontWeight: 600, fontSize: 13 } as const;
const td = { padding: "12px 8px", fontSize: 13 } as const;

interface HrDoc {
  id: string; employee: string; doc_type: string;
  file_name: string; file_path: string; file_size: number;
  meta: Record<string, unknown>; expires: string | null; created_at: string;
}

const DOC_TYPES = ["Contract", "Sick note", "Certificate", "Qualification", "ID copy", "Signed form", "Policy", "Other"];
const typeBadge = (t: string) =>
  t === "Sick note" ? "badge-amber" : t === "Contract" ? "badge-blue" : t === "Certificate" || t === "Qualification" ? "badge-green" : "";

function UploadModal({ onClose, onAdded }: { onClose: () => void; onAdded: (d: HrDoc) => void }) {
  const t = useTranslations("Pages.corp_hr_documents");
  const { toast } = useAppData();
  const [employee, setEmployee] = useState("");
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [expires, setExpires] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData();
    fd.append("employee", employee);
    fd.append("doc_type", docType);
    if (expires) fd.append("expires", expires);
    if (file) fd.append("file", file);
    const res = await fetch("/api/hr/documents", { method: "POST", body: fd }).catch(() => null);
    const row = await res?.json().catch(() => null);
    setBusy(false);
    if (!row?.id) { toast(t("toastUploadError"), "x"); return; }
    toast(t("toastUploaded", { name: row.file_name || docType }), "upload-cloud");
    onAdded(row);
  }

  return (
    <Modal title={t("uploadTitle")} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field"><label>{t("fieldEmployee")}</label><input required value={employee} onChange={(e) => setEmployee(e.target.value)} placeholder={t("employeePh")} /></div>
        <div className="field"><label>{t("fieldType")}</label>
          <select className="settings-select" style={{ width: "100%" }} value={docType} onChange={(e) => setDocType(e.target.value)}>
            {DOC_TYPES.map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
        <div className="field"><label>{t("fieldExpiry")}</label><input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} /></div>
        <div className="field"><label>{t("fieldFile")}</label><input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit" disabled={busy}>{busy ? t("uploading") : t("uploadBtn")}</button>
      </form>
    </Modal>
  );
}

function FormModal({ form, company, onClose }: { form: HrFormTemplate; company: string; onClose: () => void }) {
  const t = useTranslations("Pages.corp_hr_documents");
  const [data, setData] = useState<Record<string, string>>({});

  function generate(e: FormEvent) {
    e.preventDefault();
    openPrintDoc(form.render(data, company));
    // audit trail — record that this form was generated
    const fd = new FormData();
    fd.append("employee", data.employee ?? "");
    fd.append("doc_type", "Signed form");
    fd.append("meta", JSON.stringify({ generated: form.id, title: form.label }));
    fetch("/api/hr/documents", { method: "POST", body: fd }).catch(() => {});
    onClose();
  }

  return (
    <Modal title={form.label} onClose={onClose}>
      <form onSubmit={generate} style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 4 }}>
        <p style={{ fontSize: 12.5, color: "var(--ink-500)", margin: "0 0 12px" }}>{form.description}</p>
        {form.fields.map((f) => (
          <div className="field" key={f.key}>
            <label>{f.label}</label>
            <input type={f.type ?? "text"} value={data[f.key] ?? ""} placeholder={f.placeholder}
              onChange={(e) => setData((p) => ({ ...p, [f.key]: e.target.value }))} />
          </div>
        ))}
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">
          <Icon name="printer" size={15} style={{ marginRight: 6 }} />{t("fillAndPrint")}
        </button>
      </form>
    </Modal>
  );
}

export default function DocumentsPage() {
  const t = useTranslations("Pages.corp_hr_documents");
  const { toast, user } = useAppData();
  const company = user?.organisation ?? "WellSpend";
  const [tab, setTab] = useState<"docs" | "forms">("docs");
  const [docs, setDocs] = useState<HrDoc[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<HrFormTemplate | null>(null);

  useEffect(() => {
    fetch("/api/hr/documents").then((r) => r.json()).then((rows) => setDocs(Array.isArray(rows) ? rows : [])).catch(() => {});
  }, []);

  const filtered = docs.filter((d) =>
    (!typeFilter || d.doc_type === typeFilter) &&
    ((d.employee || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.file_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.doc_type || "").toLowerCase().includes(search.toLowerCase()))
  );

  async function openFile(d: HrDoc) {
    if (!d.file_path) return;
    const res = await fetch(`/api/hr/files?bucket=hr-docs&path=${encodeURIComponent(d.file_path)}`);
    const data = await res.json().catch(() => null);
    if (data?.url) window.open(data.url, "_blank");
    else toast(t("toastFileError"), "x");
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        {tab === "docs" && (
          <button className="btn btn-primary" onClick={() => setUploading(true)}>
            <Icon name="upload-cloud" size={16} style={{ marginRight: 8 }} />{t("uploadDocument")}
          </button>
        )}
      </div>

      <div className="tabs" style={{ marginBottom: 18 }}>
        <button className={"tab-btn" + (tab === "docs" ? " active" : "")} onClick={() => setTab("docs")}>{t("tabDocs")}</button>
        <button className={"tab-btn" + (tab === "forms" ? " active" : "")} onClick={() => setTab("forms")}>{t("tabForms")}</button>
      </div>

      {tab === "docs" && (
        <div className="glass-card card-pad">
          <FilterBar
            searchPlaceholder={t("searchPlaceholder")}
            statusOptions={DOC_TYPES.map((x) => ({ value: x, label: x }))}
            onSearchChange={setSearch}
            onStatusChange={setTypeFilter}
          />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={th}>{t("colDocument")}</th><th style={th}>{t("colType")}</th><th style={th}>{t("colEmployee")}</th>
                <th style={th}>{t("colExpires")}</th><th style={th}>{t("colUploaded")}</th><th style={th}>{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>{t("emptyState")}</td></tr>
              )}
              {filtered.map((d) => (
                <tr key={d.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={{ ...td, fontWeight: 600 }}>
                    {d.file_name || String(d.meta?.title ?? d.doc_type)}
                    {d.file_size > 0 && <div style={{ fontSize: 11, color: "var(--ink-500)", fontWeight: 400 }}>{Math.round(d.file_size / 1024)} KB</div>}
                  </td>
                  <td style={td}><span className={`badge ${typeBadge(d.doc_type)}`}>{d.doc_type}</span></td>
                  <td style={td}>{d.employee || "—"}</td>
                  <td style={td}>{d.expires ? ukDate(d.expires) : "—"}</td>
                  <td style={td}>{ukDate(d.created_at.slice(0, 10))}</td>
                  <td style={td}>
                    {d.file_path && (
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => openFile(d)}>
                        <Icon name="eye" size={13} style={{ marginRight: 4 }} />{t("view")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "forms" && (
        <>
          <p style={{ fontSize: 13, color: "var(--ink-500)", margin: "-6px 0 14px" }}>{t("formsHint")}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 12 }}>
            {HR_FORMS.map((f) => (
              <button key={f.id} className="glass-card card-pad" style={{ textAlign: "left", cursor: "pointer", border: "1px solid var(--card-border)" }} onClick={() => setForm(f)}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <Icon name="file-text" size={18} style={{ color: "var(--rose-600)" }} />
                  <b style={{ fontSize: 14 }}>{f.label}</b>
                </div>
                <p style={{ fontSize: 12, color: "var(--ink-500)", margin: 0, lineHeight: 1.5 }}>{f.description}</p>
              </button>
            ))}
          </div>
        </>
      )}

      {uploading && <UploadModal onClose={() => setUploading(false)} onAdded={(d) => { setDocs((p) => [d, ...p]); setUploading(false); }} />}
      {form && <FormModal form={form} company={company} onClose={() => setForm(null)} />}
    </>
  );
}
