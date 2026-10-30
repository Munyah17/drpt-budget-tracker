"use client";

import { useState, useMemo, useEffect, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import FilterBar from "@/components/FilterBar";
import { useCorpStore } from "@/lib/corpStore";
import { ukDate } from "@/lib/format";

const th = { padding: "12px 8px", fontWeight: 600, fontSize: 13 } as const;
const td = { padding: "12px 8px", fontSize: 13 } as const;

interface CustomField { label: string; type: "text" | "number" | "date" | "select"; options?: string; required: boolean }
interface Vacancy {
  id: string; title: string; department: string; sbu: string; location: string;
  employment_type: string; description: string; skills: string[];
  fields: CustomField[]; file_requirements: { word: boolean; pdf: boolean; images: boolean };
  status: string; created_at: string;
}
interface Application {
  id: string; vacancy_id: string; applicant_name: string; email: string; phone: string;
  answers: Record<string, string>; files: { kind: string; name: string; path: string; size: number }[];
  score: number; score_breakdown: { files: number; skills: number; answers: number; matchedSkills: string[] };
  stage: string; created_at: string;
}

const STAGES = ["New", "Reviewed", "Shortlisted", "Interview", "Hired"];
const scoreBadge = (s: number) => (s >= 70 ? "badge-green" : s >= 40 ? "badge-amber" : "badge-red");
const stageBadge = (s: string) =>
  s === "Hired" ? "badge-green" : s === "Rejected" ? "badge-red" : s === "New" ? "badge-amber" : "badge-blue";

function FieldBuilder({ fields, onChange }: { fields: CustomField[]; onChange: (f: CustomField[]) => void }) {
  const t = useTranslations("Pages.corp_hr_recruitment");
  const [label, setLabel] = useState("");
  const [type, setType] = useState<CustomField["type"]>("text");
  const [options, setOptions] = useState("");
  const [required, setRequired] = useState(true);

  function add() {
    if (!label.trim()) return;
    onChange([...fields, { label: label.trim(), type, options: type === "select" ? options : undefined, required }]);
    setLabel(""); setOptions(""); setRequired(true); setType("text");
  }

  return (
    <div style={{ border: "1px dashed var(--card-border)", borderRadius: 10, padding: 12, marginBottom: 10 }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>{t("fieldsBuilderTitle")}</div>
      {fields.map((f, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, marginBottom: 6 }}>
          <span className="chip">{f.type}</span>
          <span style={{ fontWeight: 600 }}>{f.label}</span>
          {f.required && <span style={{ color: "var(--rose-600)", fontSize: 11 }}>{t("requiredTag")}</span>}
          <button type="button" className="btn btn-ghost" style={{ padding: "1px 6px", fontSize: 11, marginLeft: "auto", color: "var(--red)" }}
            onClick={() => onChange(fields.filter((_, j) => j !== i))}>{t("remove")}</button>
        </div>
      ))}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr .8fr .8fr", gap: 8, marginTop: 8 }}>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("fieldLabelPh")} />
        <select className="settings-select" value={type} onChange={(e) => setType(e.target.value as CustomField["type"])}>
          <option value="text">{t("ftypeText")}</option>
          <option value="number">{t("ftypeNumber")}</option>
          <option value="date">{t("ftypeDate")}</option>
          <option value="select">{t("ftypeSelect")}</option>
        </select>
        <button type="button" className="btn btn-ghost" onClick={add}><Icon name="plus" size={13} style={{ marginRight: 4 }} />{t("addField")}</button>
      </div>
      {type === "select" && (
        <input style={{ marginTop: 8, width: "100%" }} value={options} onChange={(e) => setOptions(e.target.value)} placeholder={t("fieldOptionsPh")} />
      )}
      <label className="remember" style={{ marginTop: 8, display: "flex", gap: 6, fontSize: 12.5 }}>
        <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} style={{ accentColor: "var(--rose-500)" }} /> {t("fieldRequired")}
      </label>
    </div>
  );
}

function VacancyModal({ sbus, onClose, onCreated }: { sbus: { id: string; name: string }[]; onClose: () => void; onCreated: (v: Vacancy) => void }) {
  const t = useTranslations("Pages.corp_hr_recruitment");
  const { toast } = useAppData();
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [sbu, setSbu] = useState("sbu-hq");
  const [location, setLocation] = useState("");
  const [etype, setEtype] = useState("Full-time");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [pdf, setPdf] = useState(false);
  const [images, setImages] = useState(false);
  const [fields, setFields] = useState<CustomField[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/hr/vacancies", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, department, sbu, location, employment_type: etype, description,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        fields,
        file_requirements: { word: true, pdf, images },
      }),
    });
    setBusy(false);
    if (!res.ok) { toast(t("toastError"), "x"); return; }
    const v = await res.json();
    toast(t("toastCreated", { title }), "check-circle");
    onCreated(v);
  }

  return (
    <Modal title={t("modalTitle")} onClose={onClose}>
      <form onSubmit={submit} style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 4 }}>
        <div className="field"><label>{t("fieldJobTitle")}</label><input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("jobTitlePh")} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="field"><label>{t("fieldDepartment")}</label><input value={department} onChange={(e) => setDepartment(e.target.value)} /></div>
          <div className="field"><label>{t("fieldSbu")}</label>
            <select className="settings-select" style={{ width: "100%" }} value={sbu} onChange={(e) => setSbu(e.target.value)}>
              {sbus.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="field"><label>{t("fieldLocation")}</label><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t("locationPh")} /></div>
          <div className="field"><label>{t("fieldType")}</label>
            <select className="settings-select" style={{ width: "100%" }} value={etype} onChange={(e) => setEtype(e.target.value)}>
              {["Full-time", "Part-time", "Contract", "Internship"].map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
        </div>
        <div className="field"><label>{t("fieldDesc")}</label><textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: "100%", resize: "vertical" }} /></div>
        <div className="field">
          <label>{t("fieldSkills")}</label>
          <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder={t("skillsPh")} />
          <p style={{ fontSize: 11.5, color: "var(--ink-500)", margin: "4px 0 0" }}>{t("skillsHint")}</p>
        </div>
        <div className="field">
          <label>{t("fieldFiles")}</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
            <label className="remember"><input type="checkbox" checked disabled style={{ accentColor: "var(--rose-500)" }} /> {t("fileWord")}</label>
            <label className="remember"><input type="checkbox" checked={pdf} onChange={(e) => setPdf(e.target.checked)} style={{ accentColor: "var(--rose-500)" }} /> {t("filePdf")}</label>
            <label className="remember"><input type="checkbox" checked={images} onChange={(e) => setImages(e.target.checked)} style={{ accentColor: "var(--rose-500)" }} /> {t("fileImages")}</label>
          </div>
        </div>
        <FieldBuilder fields={fields} onChange={setFields} />
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit" disabled={busy}>{busy ? t("creating") : t("createVacancy")}</button>
      </form>
    </Modal>
  );
}

function ApplicantModal({ app, vacancy, onClose }: { app: Application; vacancy?: Vacancy; onClose: () => void }) {
  const t = useTranslations("Pages.corp_hr_recruitment");
  const { toast } = useAppData();

  async function openFile(path: string) {
    const res = await fetch(`/api/hr/files?bucket=applications&path=${encodeURIComponent(path)}`);
    const data = await res.json().catch(() => null);
    if (data?.url) window.open(data.url, "_blank");
    else toast(t("toastFileError"), "x");
  }

  const b = app.score_breakdown;
  return (
    <Modal title={`${app.applicant_name} — ${vacancy?.title ?? ""}`} onClose={onClose}>
      <div style={{ display: "flex", gap: 14, marginBottom: 14, fontSize: 13, flexWrap: "wrap" }}>
        <span><b>{t("lblEmail")}:</b> {app.email}</span>
        <span><b>{t("lblPhone")}:</b> {app.phone}</span>
        <span><b>{t("lblApplied")}:</b> {ukDate(app.created_at.slice(0, 10))}</span>
      </div>
      <div className="glass-card" style={{ padding: 12, marginBottom: 14, border: "1px solid var(--card-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>{t("scoreTitle")}</span>
          <span className={`badge ${scoreBadge(app.score)}`}>{app.score}/100</span>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink-500)", display: "flex", gap: 14, flexWrap: "wrap" }}>
          <span>{t("scoreFiles")}: {b?.files ?? 0}/40</span>
          <span>{t("scoreSkills")}: {b?.skills ?? 0}/40</span>
          <span>{t("scoreAnswers")}: {b?.answers ?? 0}/20</span>
        </div>
        {!!b?.matchedSkills?.length && (
          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {b.matchedSkills.map((s) => <span key={s} className="chip" style={{ fontSize: 11 }}>{s}</span>)}
          </div>
        )}
      </div>
      {Object.keys(app.answers || {}).length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
          <tbody>
            {Object.entries(app.answers).map(([k, v]) => (
              <tr key={k} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "8px 6px", fontSize: 12.5, color: "var(--ink-500)", width: "40%" }}>{k}</td>
                <td style={{ padding: "8px 6px", fontSize: 13 }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {app.files.map((f) => (
          <button key={f.path} className="btn btn-ghost" style={{ justifyContent: "flex-start", fontSize: 12.5 }} onClick={() => openFile(f.path)}>
            <Icon name="file-text" size={14} style={{ marginRight: 8 }} />{f.name}
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-500)" }}>{f.kind.toUpperCase()} · {Math.round(f.size / 1024)}KB</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

export default function RecruitmentPage() {
  const t = useTranslations("Pages.corp_hr_recruitment");
  const { toast } = useAppData();
  const store = useCorpStore();
  const [tab, setTab] = useState<"vacancies" | "apps">("vacancies");
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [vacancyFilter, setVacancyFilter] = useState("");
  const [viewing, setViewing] = useState<Application | null>(null);

  async function refresh() {
    const [v, a] = await Promise.all([
      fetch("/api/hr/vacancies").then((r) => r.json()).catch(() => []),
      fetch("/api/hr/applications").then((r) => r.json()).catch(() => []),
    ]);
    setVacancies(Array.isArray(v) ? v : []);
    setApps(Array.isArray(a) ? a : []);
  }
  useEffect(() => { void Promise.resolve().then(() => refresh()); }, []);

  const appsFor = (id: string) => apps.filter((a) => a.vacancy_id === id);
  const filteredApps = useMemo(
    () => apps.filter((a) =>
      (!vacancyFilter || a.vacancy_id === vacancyFilter) &&
      (a.applicant_name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()))
    ).sort((x, y) => (y.score ?? 0) - (x.score ?? 0)),
    [apps, search, vacancyFilter]
  );

  async function toggleVacancy(v: Vacancy) {
    const status = v.status === "Open" ? "Closed" : "Open";
    await fetch("/api/hr/vacancies", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: v.id, status }) });
    setVacancies((p) => p.map((x) => (x.id === v.id ? { ...x, status } : x)));
    toast(t(status === "Closed" ? "toastClosed" : "toastReopened", { title: v.title }), status === "Closed" ? "x" : "check-circle");
  }

  function copyLink(v: Vacancy) {
    const url = `${window.location.origin}/apply/${v.id}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    toast(t("toastLink"), "check-circle");
  }

  async function advanceStage(a: Application) {
    const next = STAGES[Math.min(STAGES.indexOf(a.stage) + 1, STAGES.length - 1)];
    await fetch("/api/hr/applications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: a.id, stage: next }) });
    setApps((p) => p.map((x) => (x.id === a.id ? { ...x, stage: next } : x)));
    toast(t("toastStage", { name: a.applicant_name, stage: next }), "check-circle");
  }

  async function reject(a: Application) {
    await fetch("/api/hr/applications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: a.id, stage: "Rejected" }) });
    setApps((p) => p.map((x) => (x.id === a.id ? { ...x, stage: "Rejected" } : x)));
    toast(t("toastRejected", { name: a.applicant_name }), "x");
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        {tab === "vacancies" && (
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <Icon name="plus" size={16} style={{ marginRight: 8 }} />{t("newVacancy")}
          </button>
        )}
      </div>

      <div className="tabs" style={{ marginBottom: 18 }}>
        <button className={"tab-btn" + (tab === "vacancies" ? " active" : "")} onClick={() => setTab("vacancies")}>{t("tabVacancies")}</button>
        <button className={"tab-btn" + (tab === "apps" ? " active" : "")} onClick={() => setTab("apps")}>
          {t("tabApps")} {apps.length > 0 && <span className="badge badge-blue" style={{ marginLeft: 6 }}>{apps.length}</span>}
        </button>
      </div>

      {tab === "vacancies" && (
        <div className="glass-card card-pad">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={th}>{t("colTitle")}</th><th style={th}>{t("colDepartment")}</th><th style={th}>{t("colSbu")}</th>
                <th style={th}>{t("colType")}</th><th style={th}>{t("colApps")}</th><th style={th}>{t("colStatus")}</th><th style={th}>{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {vacancies.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>{t("emptyVacancies")}</td></tr>
              )}
              {vacancies.map((v) => (
                <tr key={v.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={{ ...td, fontWeight: 600 }}>{v.title}<div style={{ fontSize: 11, color: "var(--ink-500)", fontWeight: 400 }}>{v.location}</div></td>
                  <td style={td}>{v.department}</td>
                  <td style={td}><span className="chip">{store.sbus.find((s) => s.id === v.sbu)?.code ?? "HQ"}</span></td>
                  <td style={td}>{v.employment_type}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{appsFor(v.id).length}</td>
                  <td style={td}><span className={`badge ${v.status === "Open" ? "badge-green" : ""}`}>{v.status === "Open" ? t("statusOpen") : t("statusClosed")}</span></td>
                  <td style={td}>
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => copyLink(v)}><Icon name="link" size={13} style={{ marginRight: 4 }} />{t("copyLink")}</button>
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: v.status === "Open" ? "var(--red)" : "var(--green)" }} onClick={() => toggleVacancy(v)}>
                      {v.status === "Open" ? t("close") : t("reopen")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "apps" && (
        <div className="glass-card card-pad">
          <FilterBar
            searchPlaceholder={t("searchPh")}
            statusOptions={vacancies.map((v) => ({ value: v.id, label: v.title }))}
            onSearchChange={setSearch}
            onStatusChange={setVacancyFilter}
          />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={th}>{t("colApplicant")}</th><th style={th}>{t("colVacancy")}</th><th style={th}>{t("colScore")}</th>
                <th style={th}>{t("colFiles")}</th><th style={th}>{t("colStage")}</th><th style={th}>{t("colApplied")}</th><th style={th}>{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>{t("emptyApps")}</td></tr>
              )}
              {filteredApps.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={{ ...td, fontWeight: 600 }}>{a.applicant_name}<div style={{ fontSize: 11, color: "var(--ink-500)", fontWeight: 400 }}>{a.email}</div></td>
                  <td style={td}>{vacancies.find((v) => v.id === a.vacancy_id)?.title ?? "—"}</td>
                  <td style={td}><span className={`badge ${scoreBadge(a.score ?? 0)}`}>{a.score ?? 0}</span></td>
                  <td style={td}>{a.files.length}</td>
                  <td style={td}><span className={`badge ${stageBadge(a.stage)}`}>{a.stage}</span></td>
                  <td style={td}>{ukDate(a.created_at.slice(0, 10))}</td>
                  <td style={td}>
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => setViewing(a)}><Icon name="eye" size={13} style={{ marginRight: 4 }} />{t("view")}</button>
                    {a.stage !== "Hired" && a.stage !== "Rejected" && (
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--green)" }} onClick={() => advanceStage(a)}>
                        <Icon name="chevron-right" size={13} style={{ marginRight: 4 }} />{t("advance")}
                      </button>
                    )}
                    {a.stage !== "Rejected" && a.stage !== "Hired" && (
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--red)" }} onClick={() => reject(a)}>
                        <Icon name="x" size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && <VacancyModal sbus={store.sbus} onClose={() => setCreating(false)} onCreated={(v) => { setVacancies((p) => [v, ...p]); setCreating(false); }} />}
      {viewing && <ApplicantModal app={viewing} vacancy={vacancies.find((v) => v.id === viewing.vacancy_id)} onClose={() => setViewing(null)} />}
    </>
  );
}
