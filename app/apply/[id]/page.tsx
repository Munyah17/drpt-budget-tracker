"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface CustomField { label: string; type: "text" | "number" | "date" | "select"; options?: string; required: boolean }
interface Vacancy {
  id: string; title: string; department: string; location: string; employment_type: string;
  description: string; skills: string[]; fields: CustomField[];
  file_requirements: { word: boolean; pdf: boolean; images: boolean }; status: string;
}

/** Pull plain text out of a .docx for keyword scoring. */
async function extractDocxText(file: File): Promise<string> {
  try {
    // mammoth's browser bundle has no shipped types
    const mammoth = (await import("mammoth/mammoth.browser" as never)) as {
      extractRawText: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
    };
    const res = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return res.value || "";
  } catch {
    return "";
  }
}

const MAX_BYTES = 8 * 1024 * 1024;
const extOk = (name: string, exts: string[]) => exts.some((e) => name.toLowerCase().endsWith(e));

export default function ApplyPage() {
  const t = useTranslations("Pages.apply");
  const params = useParams();
  const id = String(params.id);
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [word, setWord] = useState<File | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);

  useEffect(() => {
    fetch(`/api/hr/vacancies?id=${id}`)
      .then(async (r) => (r.ok ? r.json() : null))
      .then((v) => { setVacancy(v); setNotFound(!v); setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [id]);

  const reqs = vacancy?.file_requirements ?? { word: true, pdf: false, images: false };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!word) { setError(t("errWord")); return; }
    if (reqs.pdf && !pdf) { setError(t("errPdf")); return; }
    for (const f of [word, pdf, ...images].filter(Boolean) as File[]) {
      if (f.size > MAX_BYTES) { setError(t("errSize", { name: f.name })); return; }
    }
    if (!extOk(word.name, [".docx", ".doc"])) { setError(t("errWordType")); return; }
    if (pdf && !extOk(pdf.name, [".pdf"])) { setError(t("errPdfType")); return; }
    if (images.some((f) => !extOk(f.name, [".png", ".jpg", ".jpeg"]))) { setError(t("errImgType")); return; }

    setBusy(true);
    const cvText = await extractDocxText(word);
    const fd = new FormData();
    fd.append("vacancy_id", id);
    fd.append("applicant_name", name);
    fd.append("email", email);
    fd.append("phone", phone);
    fd.append("answers", JSON.stringify(answers));
    fd.append("cvText", cvText);
    fd.append("word", word);
    if (pdf) fd.append("pdf", pdf);
    images.forEach((f) => fd.append("image", f));

    const res = await fetch("/api/hr/applications", { method: "POST", body: fd }).catch(() => null);
    setBusy(false);
    if (res?.ok) setDone(true);
    else setError(t("errSubmit"));
  }

  const card: React.CSSProperties = {
    background: "var(--card-bg, #fff)", border: "1px solid var(--card-border, #eee)",
    borderRadius: 18, padding: 28, maxWidth: 640, width: "100%",
    boxShadow: "0 12px 40px rgba(0,0,0,.08)",
  };

  return (
    <div className="login-wrap" style={{ alignItems: "flex-start", padding: "40px 16px", minHeight: "100vh" }}>
      <div style={card}>
        <div className="login-logo" style={{ marginBottom: 18 }}>WellSpend <span style={{ color: "var(--rose-500)" }}>❤</span></div>

        {loading && <p style={{ color: "var(--ink-500)" }}>{t("loading")}</p>}
        {notFound && <p style={{ color: "var(--red)" }}>{t("notFound")}</p>}

        {vacancy && !done && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{vacancy.title}</h2>
            <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 14 }}>
              {[vacancy.department, vacancy.location, vacancy.employment_type].filter(Boolean).join(" · ")}
            </p>
            {vacancy.description && <p style={{ fontSize: 13.5, lineHeight: 1.65, marginBottom: 18, whiteSpace: "pre-line" }}>{vacancy.description}</p>}
            {vacancy.skills?.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
                {vacancy.skills.map((s) => <span key={s} className="chip">{s}</span>)}
              </div>
            )}
            {vacancy.status !== "Open" ? (
              <p style={{ color: "var(--amber)", fontSize: 13.5 }}>{t("closed")}</p>
            ) : (
              <form onSubmit={submit}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: "16px 0 10px" }}>{t("yourDetails")}</h3>
                <div className="field"><label>{t("fullName")}</label><input required value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div className="field"><label>{t("email")}</label><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                  <div className="field"><label>{t("phone")}</label><input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                </div>

                {vacancy.fields?.length > 0 && (
                  <>
                    <h3 style={{ fontSize: 14, fontWeight: 700, margin: "16px 0 10px" }}>{t("additional")}</h3>
                    {vacancy.fields.map((f) => (
                      <div className="field" key={f.label}>
                        <label>{f.label}{f.required ? " *" : ""}</label>
                        {f.type === "select" ? (
                          <select className="settings-select" style={{ width: "100%" }} required={f.required}
                            value={answers[f.label] ?? ""} onChange={(e) => setAnswers((p) => ({ ...p, [f.label]: e.target.value }))}>
                            <option value="" disabled>{t("selectPh")}</option>
                            {(f.options ?? "").split(",").map((o) => o.trim()).filter(Boolean).map((o) => <option key={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input type={f.type} required={f.required} value={answers[f.label] ?? ""}
                            onChange={(e) => setAnswers((p) => ({ ...p, [f.label]: e.target.value }))} />
                        )}
                      </div>
                    ))}
                  </>
                )}

                <h3 style={{ fontSize: 14, fontWeight: 700, margin: "16px 0 10px" }}>{t("documents")}</h3>
                <div className="field">
                  <label>{t("cvWord")} *</label>
                  <input required type="file" accept=".docx,.doc" onChange={(e) => setWord(e.target.files?.[0] ?? null)} />
                </div>
                {reqs.pdf && (
                  <div className="field">
                    <label>{t("cvPdf")} *</label>
                    <input required type="file" accept=".pdf" onChange={(e) => setPdf(e.target.files?.[0] ?? null)} />
                  </div>
                )}
                {reqs.images && (
                  <div className="field">
                    <label>{t("images")}</label>
                    <input type="file" accept=".png,.jpg,.jpeg" multiple onChange={(e) => setImages(Array.from(e.target.files ?? []))} />
                  </div>
                )}

                {error && <p style={{ color: "var(--red)", fontSize: 13, margin: "4px 0 10px" }}>{error}</p>}
                <button className="btn btn-primary" style={{ width: "100%" }} type="submit" disabled={busy}>
                  {busy ? t("submitting") : t("submit")}
                </button>
              </form>
            )}
          </>
        )}

        {done && (
          <div style={{ textAlign: "center", padding: "24px 8px" }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{t("doneTitle")}</h2>
            <p style={{ fontSize: 13.5, color: "var(--ink-500)" }}>{t("doneText")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
