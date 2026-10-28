"use client";

import { useMemo, useState, FormEvent, useRef } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import { downloadCsv } from "@/lib/download";
import { useCorpStore, updateCorp, CorpEmployee } from "@/lib/corpStore";

const th = { padding: "12px 8px", fontWeight: 600, fontSize: 13 } as const;
const td = { padding: "12px 8px", fontSize: 13 } as const;

const SAMPLE = `name,email,department,job_title,gross_pay,bank,account
Tariro Moyo,tariro@acme.co.zw,Finance,Accountant,1800,CBZ,1002345678
Tendai Ncube,tendai@acme.co.zw,Operations,Supervisor,1450,FBC,2009876543
Rudo Chikafu,rudo@acme.co.zw,Sales,Rep,1200,Steward,3004567890`;

/** Parse CSV text → employee rows. Accepts a header row in any column order. */
function parseCsv(text: string): CorpEmployee[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const split = (l: string) => l.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c) => c.replace(/^"|"$/g, "").trim());
  const header = split(lines[0]).map((h) => h.toLowerCase());
  const hasHeader = header.some((h) => h === "name" || h === "email");
  const idx = (...names: string[]) => names.map((n) => header.indexOf(n)).find((i) => i >= 0) ?? -1;
  const cName = hasHeader ? idx("name", "employee") : 0;
  const cEmail = hasHeader ? idx("email") : 1;
  const cDept = hasHeader ? idx("department", "dept") : 2;
  const cTitle = hasHeader ? idx("job_title", "title", "role", "position") : 3;
  const cPay = hasHeader ? idx("gross_pay", "pay", "salary", "net_pay") : 4;
  const cBank = hasHeader ? idx("bank", "bank_name") : 5;
  const cAcct = hasHeader ? idx("account", "account_no", "account_number") : 6;

  return lines.slice(hasHeader ? 1 : 0).map((l, i) => {
    const c = split(l);
    return {
      id: `emp-${Date.now().toString(36)}-${i}`,
      name: c[cName] ?? "",
      email: c[cEmail] ?? "",
      department: cDept >= 0 ? c[cDept] ?? "" : "",
      jobTitle: cTitle >= 0 ? c[cTitle] ?? "" : "",
      grossPay: parseFloat(cPay >= 0 ? c[cPay] ?? "" : "") || 0,
      bankName: cBank >= 0 ? c[cBank] ?? "" : "",
      bankAccount: cAcct >= 0 ? c[cAcct] ?? "" : "",
    };
  }).filter((e) => e.name);
}

export default function EmployeeImportPage() {
  const { toast } = useAppData();
  const store = useCorpStore();
  const [text, setText] = useState("");
  const [staged, setStaged] = useState<CorpEmployee[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const preview = useMemo(() => (text.trim() ? parseCsv(text) : staged), [text, staged]);

  function parse() {
    const rows = parseCsv(text);
    if (!rows.length) { toast("No valid rows found — check the format below", "x"); return; }
    setStaged(rows);
    toast(`${rows.length} employee${rows.length === 1 ? "" : "s"} parsed — review then import`, "check");
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then((t) => { setText(t); setStaged([]); });
  }

  function doImport(e: FormEvent) {
    e.preventDefault();
    const rows = text.trim() ? parseCsv(text) : staged;
    if (!rows.length) { toast("Nothing to import", "x"); return; }
    const existing = new Set(store.employees.map((x) => x.email.toLowerCase()).filter(Boolean));
    const fresh = rows.filter((r) => !r.email || !existing.has(r.email.toLowerCase()));
    const dupes = rows.length - fresh.length;
    updateCorp((s) => ({ ...s, employees: [...s.employees, ...fresh] }));
    toast(`${fresh.length} imported${dupes ? `, ${dupes} duplicate${dupes === 1 ? "" : "s"} skipped` : ""}`, "check-circle");
    setText(""); setStaged([]);
  }

  function exportCsv() {
    downloadCsv("employees.csv", store.employees.map((e) => ({
      name: e.name, email: e.email, department: e.department, job_title: e.jobTitle,
      gross_pay: String(e.grossPay), bank: e.bankName, account: e.bankAccount,
    })));
    toast("Employee CSV downloaded", "download");
  }

  function remove(id: string) {
    updateCorp((s) => ({ ...s, employees: s.employees.filter((e) => e.id !== id) }));
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Bulk Employee Import</h2>
          <p className="section-sub">Paste or upload a CSV — preview, then import in one click</p>
        </div>
        <button className="btn btn-ghost" onClick={exportCsv} disabled={!store.employees.length}>
          <Icon name="download" size={15} style={{ marginRight: 6 }} />Export CSV
        </button>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div className="card-head"><h3>Paste CSV</h3>
          <div>
            <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" style={{ display: "none" }} onChange={onFile} />
            <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
              <Icon name="upload-cloud" size={14} style={{ marginRight: 5 }} />Upload file
            </button>
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setStaged([]); }}
          placeholder={SAMPLE}
          rows={7}
          style={{ width: "100%", fontFamily: "monospace", fontSize: 12, padding: 12, borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)", background: "var(--card-solid)", color: "var(--ink-900)", resize: "vertical" }}
        />
        <form onSubmit={doImport} style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-ghost" onClick={parse}>Preview</button>
          <button type="submit" className="btn btn-primary"><Icon name="check" size={14} style={{ marginRight: 5 }} />Import {preview.length ? `(${preview.length})` : ""}</button>
        </form>
        <p style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 10 }}>
          Columns: name, email, department, job_title, gross_pay, bank, account — header row optional, any order.
        </p>
      </div>

      <div className="glass-card card-pad">
        <div className="card-head">
          <h3>{preview.length ? "Import preview" : `Employees (${store.employees.length})`}</h3>
        </div>
        <div className="table-wrap">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={th}>Name</th><th style={th}>Email</th><th style={th}>Department</th>
                <th style={th}>Job Title</th><th style={th}>Gross Pay</th><th style={th}>Bank</th><th style={th}>Account</th>
                {!preview.length && <th style={th}></th>}
              </tr>
            </thead>
            <tbody>
              {(preview.length ? preview : store.employees).length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>No employees yet — paste a CSV above to get started.</td></tr>
              )}
              {(preview.length ? preview : store.employees).map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={{ ...td, fontWeight: 600 }}>{e.name}</td>
                  <td style={td}>{e.email || "—"}</td>
                  <td style={td}>{e.department || "—"}</td>
                  <td style={td}>{e.jobTitle || "—"}</td>
                  <td style={td}>{e.grossPay ? `$${e.grossPay.toLocaleString()}` : "—"}</td>
                  <td style={td}>{e.bankName || "—"}</td>
                  <td style={td}>{e.bankAccount || "—"}</td>
                  {!preview.length && (
                    <td style={td}>
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--red)" }} onClick={() => remove(e.id)}>
                        <Icon name="trash-2" size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
