"use client";

import { useSyncExternalStore } from "react";
import { PRINTDOC_KEY, PrintDoc } from "@/lib/printDoc";

const EMPTY: PrintDoc = { docType: "", company: "", sections: [], signatures: [] };

const emptySubscribe = () => () => {};
let cached: { raw: string | null; doc: PrintDoc } | undefined;

function readDoc(): PrintDoc {
  let raw: string | null = null;
  try { raw = sessionStorage.getItem(PRINTDOC_KEY); } catch { /* unavailable */ }
  if (cached && cached.raw === raw) return cached.doc;
  let doc = EMPTY;
  try { if (raw) doc = JSON.parse(raw) as PrintDoc; } catch { /* malformed */ }
  cached = { raw, doc };
  return doc;
}

const Sig = ({ label, name }: { label: string; name?: string }) => (
  <div className="sig">
    <div className="sig-line">{name || ""}</div>
    <div className="sig-cap">{label}</div>
    <div className="sig-date">Date: ______________</div>
  </div>
);

export default function PrintDocPage() {
  const doc = useSyncExternalStore<PrintDoc>(emptySubscribe, readDoc, () => EMPTY);

  return (
    <div className="print-screen">
      <style>{`
        @page { size: A4 portrait; margin: 14mm; }
        * { box-sizing: border-box; }
        .print-screen { min-height: 100vh; background: #525659; padding: 24px 16px 48px; display: flex; flex-direction: column; align-items: center; gap: 16px; font-family: 'Times New Roman', Georgia, serif; }
        .print-toolbar { display: flex; gap: 10px; position: sticky; top: 12px; z-index: 10; }
        .print-toolbar button { border: none; border-radius: 8px; padding: 10px 22px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Segoe UI', Arial, sans-serif; }
        .pt-primary { background: #1E40AF; color: #fff; }
        .pt-ghost { background: #fff; color: #141414; }
        .sheet { width: 190mm; max-width: 100%; background: #fff; padding: 16mm 18mm; color: #111; box-shadow: 0 4px 24px rgba(0,0,0,.35); }
        .letterhead { text-align: center; border-bottom: 2.5px solid #1E40AF; padding-bottom: 10px; margin-bottom: 14px; }
        .company { font-size: 24px; font-weight: 800; letter-spacing: .02em; color: #1E40AF; }
        .addr { font-size: 12px; color: #333; margin-top: 3px; }
        .meta { display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 12px; }
        .doc-type { text-align: center; font-size: 17px; font-weight: 800; letter-spacing: .04em; margin: 10px 0 6px; text-decoration: underline; }
        .subject { font-size: 13.5px; font-weight: 700; margin-bottom: 14px; }
        .section { margin-bottom: 13px; }
        .sec-heading { font-size: 13px; font-weight: 800; margin-bottom: 5px; }
        .sec-body { font-size: 12.5px; line-height: 1.7; text-align: justify; }
        .sec-body p { margin: 0 0 8px; }
        .fields { margin: 6px 0; }
        .frow { display: flex; font-size: 12.5px; padding: 4px 0; border-bottom: .5px dotted #bbb; }
        .flabel { width: 42%; color: #333; }
        .fvalue { font-weight: 700; }
        .sigs { display: flex; flex-wrap: wrap; gap: 40px 60px; margin-top: 48px; }
        .sig { width: 220px; }
        .sig-line { border-bottom: 1px solid #111; height: 34px; font-size: 13px; display: flex; align-items: flex-end; padding-bottom: 2px; }
        .sig-cap { font-size: 11.5px; margin-top: 4px; font-weight: 700; }
        .sig-date { font-size: 11.5px; margin-top: 6px; }
        .footnote { margin-top: 34px; font-size: 10.5px; color: #555; border-top: .5px solid #ccc; padding-top: 8px; }
        @media print { .print-toolbar { display: none; } .print-screen { background: #fff; padding: 0; } .sheet { box-shadow: none; width: 100%; padding: 0; } }
      `}</style>

      <div className="print-toolbar">
        <button className="pt-primary" onClick={() => window.print()}>Print / Save as PDF</button>
        <button className="pt-ghost" onClick={() => window.close()}>Close</button>
      </div>

      <div className="sheet">
        <div className="letterhead">
          <div className="company">{doc.company || "—"}</div>
          {doc.companyAddress && <div className="addr">{doc.companyAddress}</div>}
        </div>

        <div className="meta">
          <span>{doc.ref ? `Ref: ${doc.ref}` : ""}</span>
          <span>{doc.date ?? new Date().toLocaleDateString("en-GB")}</span>
        </div>

        <div className="doc-type">{doc.docType}</div>
        {doc.subject && <div className="subject">{doc.subject}</div>}

        {doc.sections.map((s, i) => (
          <div className="section" key={i}>
            {s.heading && <div className="sec-heading">{s.heading}</div>}
            {s.fields && (
              <div className="fields">
                {s.fields.map((f, j) => (
                  <div className="frow" key={j}>
                    <span className="flabel">{f.label}</span>
                    <span className="fvalue">{f.value || "—"}</span>
                  </div>
                ))}
              </div>
            )}
            {s.body && (
              <div className="sec-body">
                {s.body.split("\n\n").map((p, j) => <p key={j}>{p}</p>)}
              </div>
            )}
          </div>
        ))}

        <div className="sigs">
          {doc.signatures.map((s, i) => <Sig key={i} label={s.label} name={s.name} />)}
        </div>

        {doc.footerNote && <div className="footnote">{doc.footerNote}</div>}
      </div>
    </div>
  );
}
