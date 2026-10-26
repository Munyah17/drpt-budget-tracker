"use client";

import { formatCurrency, initials } from "@/lib/format";
import { Currency } from "@/lib/types";

/** sessionStorage key used to hand a PrintDocData payload to /print/invoice */
export const PRINT_DOC_KEY = "drpt-print-doc";

const BRAND = "#1E40AF"; // brand blue used for title, rules, table header, total

export interface DocItem {
  description: string;
  qty: number;
  unitPrice: number;
  /** absolute discount amount for the line — shown as "—" when 0/undefined */
  discount?: number;
}

export interface PrintDocData {
  /** document heading, e.g. "QUOTATION" or "INVOICE" */
  kind: string;
  /** document reference, shown as "No: ..." */
  number: string;
  /** display date, e.g. "25/10/2026" */
  date: string;
  /** issuer */
  companyName: string;
  /** optional logo image — falls back to a monogram block */
  companyLogoUrl?: string;
  /** address / phone / tax lines shown under the company name and in the footer */
  companyLines: string[];
  /** recipient */
  billToName: string;
  billToLines: string[];
  items: DocItem[];
  /** defaults to "Subtotal (ex VAT):" */
  subtotalLabel?: string;
  /** extra total rows shown between subtotal and TOTAL (e.g. VAT, shipping) */
  extraTotals?: { label: string; amount: number }[];
  notes?: string[];
  banking?: string[];
  currency?: Currency;
}

/**
 * A4 quotation/invoice printout modelled on the QUO-* jsPDF template:
 * logo + right-aligned title block, blue divider, BILL TO card, blue-headed
 * item table with zebra rows, totals band, notes, banking, signature box and
 * a full-bleed dark footer band.
 */
export default function PrintDocument({ doc }: { doc: PrintDocData }) {
  const cur = doc.currency;
  const money = (n: number) => formatCurrency(n, cur);
  const lineTotal = (it: DocItem) => it.qty * it.unitPrice - (it.discount ?? 0);
  const subtotal = doc.items.reduce((s, it) => s + lineTotal(it), 0);
  const total = subtotal + (doc.extraTotals ?? []).reduce((s, t) => s + t.amount, 0);

  const thBase = {
    background: BRAND,
    color: "#fff",
    fontSize: "9pt",
    fontWeight: 700,
    padding: "2.8mm 3mm",
    lineHeight: 1.2,
  } as const;
  const tdNum = {
    padding: "2.8mm 3mm",
    textAlign: "right" as const,
    color: "#505050",
    whiteSpace: "nowrap" as const,
  };
  const labelStyle = {
    fontSize: "9pt",
    fontWeight: 700,
    color: "#6E6E6E",
    letterSpacing: "0.06em",
  } as const;

  return (
    <div
      className="print-doc"
      style={{
        width: "210mm",
        minHeight: "297mm",
        position: "relative",
        background: "#fff",
        boxSizing: "border-box",
        padding: "14mm 14mm 26mm",
        fontFamily: "'Source Sans 3 Variable', 'Source Sans 3', Arial, sans-serif",
        color: "#141414",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ width: "43mm", height: "32mm", flexShrink: 0 }}>
          {doc.companyLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doc.companyLogoUrl}
              alt={doc.companyName}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          ) : (
            <div
              style={{
                width: "26mm",
                height: "26mm",
                borderRadius: "4mm",
                background: BRAND,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22pt",
                fontWeight: 700,
                letterSpacing: "0.02em",
              }}
            >
              {initials(doc.companyName)}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "18pt", fontWeight: 700, color: BRAND, letterSpacing: "0.03em" }}>
            {doc.kind}
          </div>
          <div style={{ fontSize: "9.5pt", color: "#5A5A5A", marginTop: "2mm" }}>No: {doc.number}</div>
          <div style={{ fontSize: "9.5pt", color: "#5A5A5A", marginTop: "1mm" }}>Date: {doc.date}</div>
          <div style={{ fontSize: "13pt", fontWeight: 700, marginTop: "5mm" }}>{doc.companyName}</div>
          {doc.companyLines.map((l, i) => (
            <div key={i} style={{ fontSize: "9pt", color: "#5A5A5A", marginTop: "1.2mm" }}>
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* ── Divider ────────────────────────────────────────────── */}
      <div style={{ borderTop: "0.6mm solid " + BRAND, margin: "6mm 0" }} />

      {/* ── Bill To ────────────────────────────────────────────── */}
      <div style={{ width: "90mm", background: "#F3F5FA", borderRadius: "2mm", padding: "4mm 5mm" }}>
        <div style={{ fontSize: "8.5pt", fontWeight: 700, color: "#6E6E6E", letterSpacing: "0.08em" }}>
          BILL TO
        </div>
        <div style={{ fontSize: "9.5pt", fontWeight: 700, marginTop: "2.5mm" }}>{doc.billToName}</div>
        {doc.billToLines.map((l, i) => (
          <div key={i} style={{ fontSize: "9.5pt", marginTop: "1.2mm" }}>
            {l}
          </div>
        ))}
      </div>

      {/* ── Items ──────────────────────────────────────────────── */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "9mm", fontSize: "9pt" }}>
        <thead>
          <tr>
            <th style={{ ...thBase, textAlign: "left", width: "50%" }}>Description</th>
            <th style={{ ...thBase, textAlign: "right" }}>Qty</th>
            <th style={{ ...thBase, textAlign: "right" }}>Unit Price</th>
            <th style={{ ...thBase, textAlign: "right" }}>Discount</th>
            <th style={{ ...thBase, textAlign: "right" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {doc.items.map((it, i) => (
            <tr key={i} style={{ background: i % 2 ? "#fff" : "#FAFAFA" }}>
              <td style={{ padding: "2.8mm 3mm", color: "#505050" }}>{it.description}</td>
              <td style={tdNum}>{it.qty}</td>
              <td style={tdNum}>{money(it.unitPrice)}</td>
              <td style={tdNum}>{it.discount ? money(it.discount) : "—"}</td>
              <td style={tdNum}>{money(lineTotal(it))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Totals ─────────────────────────────────────────────── */}
      <div style={{ marginLeft: "auto", marginTop: "6mm", width: "72mm" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 3mm", fontSize: "9.5pt" }}>
          <span style={{ color: "#5A5A5A" }}>{doc.subtotalLabel ?? "Subtotal (ex VAT):"}</span>
          <span style={{ fontWeight: 600 }}>{money(subtotal)}</span>
        </div>
        {(doc.extraTotals ?? []).map((t, i) => (
          <div
            key={i}
            style={{ display: "flex", justifyContent: "space-between", padding: "0 3mm", fontSize: "9.5pt", marginTop: "1.5mm" }}
          >
            <span style={{ color: "#5A5A5A" }}>{t.label}</span>
            <span style={{ fontWeight: 600 }}>{money(t.amount)}</span>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            background: "#E8EDF7",
            borderRadius: "2mm",
            padding: "3.5mm 3mm",
            marginTop: "2.5mm",
            fontSize: "11.5pt",
            fontWeight: 700,
            color: BRAND,
          }}
        >
          <span>TOTAL</span>
          <span>{money(total)}</span>
        </div>
      </div>

      {/* ── Notes / Banking ────────────────────────────────────── */}
      {!!doc.notes?.length && (
        <div style={{ marginTop: "9mm" }}>
          <div style={labelStyle}>NOTES</div>
          {doc.notes.map((n, i) => (
            <div key={i} style={{ fontSize: "9pt", marginTop: "1.2mm" }}>
              {n}
            </div>
          ))}
        </div>
      )}
      {!!doc.banking?.length && (
        <div style={{ marginTop: "6mm" }}>
          <div style={labelStyle}>BANKING DETAILS</div>
          {doc.banking.map((n, i) => (
            <div key={i} style={{ fontSize: "9pt", marginTop: "1.2mm" }}>
              {n}
            </div>
          ))}
        </div>
      )}

      {/* ── Signature box ──────────────────────────────────────── */}
      <div style={{ display: "flex", border: "0.3mm solid #D1D1D1", height: "10mm", marginTop: "12mm" }}>
        <div
          style={{
            flex: 1,
            borderRight: "0.3mm solid #D1D1D1",
            padding: "2mm 3mm",
            fontSize: "8.5pt",
            color: "#6E6E6E",
          }}
        >
          Prepared By
        </div>
        <div style={{ flex: 1, padding: "2mm 3mm", fontSize: "8.5pt", color: "#6E6E6E" }}>Approved By</div>
      </div>

      {/* ── Footer band ────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "22mm",
          background: "#1F293B",
          textAlign: "center",
          paddingTop: "4.5mm",
          boxSizing: "border-box",
        }}
      >
        <div style={{ color: "#fff", fontSize: "9pt", fontWeight: 700 }}>{doc.companyName}</div>
        {doc.companyLines[0] && (
          <div style={{ color: "#D2D6DE", fontSize: "7.5pt", marginTop: "1.4mm" }}>{doc.companyLines[0]}</div>
        )}
        {doc.companyLines.length > 1 && (
          <div style={{ color: "#D2D6DE", fontSize: "7.5pt", marginTop: "0.8mm" }}>
            {doc.companyLines.slice(1).join("  ·  ")}
          </div>
        )}
        <div style={{ position: "absolute", right: "3mm", bottom: "2.5mm", color: "#969BA8", fontSize: "7pt" }}>
          Page 1 of 1
        </div>
      </div>
    </div>
  );
}
