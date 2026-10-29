"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { REPORTS } from "@/lib/data";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import RecordModal, { RowRecord } from "@/components/RecordModal";
import { downloadCsv, downloadBlob } from "@/lib/download";

function CustomReportModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Pages.reports");
  const { allTransactions, toast } = useAppData();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const generate = () => {
    const rows = allTransactions
      .filter((t) => (!from || t.date >= from) && (!to || t.date <= to))
      .map((t) => ({ date: t.date, description: t.name, category: t.category, account: t.account, type: t.type, amount: String(t.amount) }));
    if (!rows.length) { toast(t("toastNoTxn"), "x"); return; }
    downloadCsv("custom-report.csv", rows);
    toast(t("toastGenerated", { count: rows.length }), "file-text");
    onClose();
  };

  return (
    <Modal title={t("customTitle")} onClose={onClose}>
      <div className="field">
        <label>{t("fromDate")}</label>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div className="field">
        <label>{t("toDate")}</label>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <button className="btn btn-primary" style={{ width: "100%" }} onClick={generate}>{t("generateCsv")}</button>
    </Modal>
  );
}

export default function ReportsPage() {
  const t = useTranslations("Pages.reports");
  const { toast, allTransactions } = useAppData();
  const [viewing, setViewing] = useState<RowRecord | null>(null);
  const [customOpen, setCustomOpen] = useState(false);

  const exportCsv = (name: string) => {
    downloadCsv(`${name.toLowerCase().replace(/\s+/g, "-")}.csv`,
      allTransactions.map((t) => ({ date: t.date, description: t.name, category: t.category, account: t.account, type: t.type, amount: String(t.amount) })));
    toast(t("toastExportedCsv", { name }), "download");
  };

  const exportPdf = (name: string) => {
    downloadBlob(`${name.toLowerCase().replace(/\s+/g, "-")}.txt`,
      `${name}\n${t("generatedOn", { date: new Date().toLocaleDateString() })}\n\n` +
      allTransactions.map((t) => `${t.date}  ${t.name}  ${t.amount > 0 ? "+" : ""}${t.amount}`).join("\n"));
    toast(t("toastExported", { name }), "file-down");
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("sub")}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => window.open("/print/report", "_blank")}>
            <Icon name="printer" size={16} /> {t("printBtn")}
          </button>
          <button className="btn btn-primary" onClick={() => setCustomOpen(true)}>
            <Icon name="sliders-horizontal" size={16} /> {t("customTitle")}
          </button>
        </div>
      </div>
      <div className="glass-card card-pad">
        {REPORTS.map((r) => {
          const name = t(`rep_${r.key}`);
          const desc = t(`rep_${r.key}Desc`);
          return (
          <div
            key={r.key}
            style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 4px", borderBottom: "1px solid var(--card-border)", flexWrap: "wrap", rowGap: 10 }}
          >
            <div className="merchant-ic" style={{ width: 44, height: 44, borderRadius: 13 }}>
              <Icon name={r.icon} size={19} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{name}</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>{desc}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setViewing({ [t("rkReport")]: name, [t("rkDesc")]: desc, [t("rkFormat")]: "PDF / CSV", [t("rkTx")]: String(allTransactions.length) })}>
              {t("viewBtn")}
            </button>
            <button className="btn btn-ghost btn-sm" data-tip={t("tipExportPdf")} onClick={() => exportPdf(name)}>
              <Icon name="file-down" size={14} />
            </button>
            <button className="btn btn-ghost btn-sm" data-tip={t("tipExportCsv")} onClick={() => exportCsv(name)}>
              <Icon name="download" size={14} />
            </button>
          </div>
          );
        })}
      </div>
      {viewing && <RecordModal mode="view" title={t("reportDetails")} record={viewing} onClose={() => setViewing(null)} />}
      {customOpen && <CustomReportModal onClose={() => setCustomOpen(false)} />}
    </>
  );
}
