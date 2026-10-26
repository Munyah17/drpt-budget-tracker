"use client";

import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { REPORTS } from "@/lib/data";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import RecordModal, { RowRecord } from "@/components/RecordModal";
import { downloadCsv, downloadBlob } from "@/lib/download";

function CustomReportModal({ onClose }: { onClose: () => void }) {
  const { allTransactions, toast } = useAppData();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const generate = () => {
    const rows = allTransactions
      .filter((t) => (!from || t.date >= from) && (!to || t.date <= to))
      .map((t) => ({ date: t.date, description: t.name, category: t.category, account: t.account, type: t.type, amount: String(t.amount) }));
    if (!rows.length) { toast("No transactions in that range", "x"); return; }
    downloadCsv("custom-report.csv", rows);
    toast(`Report generated — ${rows.length} transactions`, "file-text");
    onClose();
  };

  return (
    <Modal title="Custom Report" onClose={onClose}>
      <div className="field">
        <label>From date</label>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div className="field">
        <label>To date</label>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <button className="btn btn-primary" style={{ width: "100%" }} onClick={generate}>Generate CSV</button>
    </Modal>
  );
}

export default function ReportsPage() {
  const { toast, allTransactions } = useAppData();
  const [viewing, setViewing] = useState<RowRecord | null>(null);
  const [customOpen, setCustomOpen] = useState(false);

  const exportCsv = (name: string) => {
    downloadCsv(`${name.toLowerCase().replace(/\s+/g, "-")}.csv`,
      allTransactions.map((t) => ({ date: t.date, description: t.name, category: t.category, account: t.account, type: t.type, amount: String(t.amount) })));
    toast(`${name} exported as CSV`, "download");
  };

  const exportPdf = (name: string) => {
    downloadBlob(`${name.toLowerCase().replace(/\s+/g, "-")}.txt`,
      `${name}\nGenerated ${new Date().toLocaleDateString()}\n\n` +
      allTransactions.map((t) => `${t.date}  ${t.name}  ${t.amount > 0 ? "+" : ""}${t.amount}`).join("\n"));
    toast(`${name} exported`, "file-down");
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Reports</h2>
          <p className="section-sub">Professional summaries, ready to export</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => window.open("/print/report", "_blank")}>
            <Icon name="printer" size={16} /> Print Monthly Report
          </button>
          <button className="btn btn-primary" onClick={() => setCustomOpen(true)}>
            <Icon name="sliders-horizontal" size={16} /> Custom Report
          </button>
        </div>
      </div>
      <div className="glass-card card-pad">
        {REPORTS.map((r) => (
          <div
            key={r.name}
            style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 4px", borderBottom: "1px solid var(--card-border)", flexWrap: "wrap", rowGap: 10 }}
          >
            <div className="merchant-ic" style={{ width: 44, height: 44, borderRadius: 13 }}>
              <Icon name={r.icon} size={19} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{r.name}</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>{r.desc}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setViewing({ report: r.name, description: r.desc, format: "PDF / CSV", transactions: String(allTransactions.length) })}>
              View
            </button>
            <button className="btn btn-ghost btn-sm" data-tip="Export PDF" onClick={() => exportPdf(r.name)}>
              <Icon name="file-down" size={14} />
            </button>
            <button className="btn btn-ghost btn-sm" data-tip="Export CSV" onClick={() => exportCsv(r.name)}>
              <Icon name="download" size={14} />
            </button>
          </div>
        ))}
      </div>
      {viewing && <RecordModal mode="view" title="Report Details" record={viewing} onClose={() => setViewing(null)} />}
      {customOpen && <CustomReportModal onClose={() => setCustomOpen(false)} />}
    </>
  );
}
