"use client";

import { useState, useMemo, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import { downloadCsv } from "@/lib/download";
import { useCorpStore, updateCorp, payrollBadge, PayrollRunRec } from "@/lib/corpStore";
import { useWallet, walletCredit } from "@/lib/walletStore";
import { usd } from "@/lib/payslip";

const th = { padding: "12px 8px", fontWeight: 600, fontSize: 13 } as const;
const td = { padding: "12px 8px", fontSize: 13 } as const;

/** Per-employee bank detail editor — used when employees lack bank info. */
function BankModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Pages.corp_pay_disbursements");
  const { toast } = useAppData();
  const store = useCorpStore();
  const [rows, setRows] = useState(
    store.employees.map((e) => ({ id: e.id, name: e.name, bankName: e.bankName, bankAccount: e.bankAccount }))
  );

  function save(e: FormEvent) {
    e.preventDefault();
    const map = new Map(rows.map((r) => [r.id, r]));
    updateCorp((s) => ({
      ...s,
      employees: s.employees.map((emp) => {
        const r = map.get(emp.id);
        return r ? { ...emp, bankName: r.bankName, bankAccount: r.bankAccount } : emp;
      }),
    }));
    toast(t("toastBankSaved"), "check-circle");
    onClose();
  }

  return (
    <Modal title={t("bankModalTitle")} onClose={onClose}>
      <form onSubmit={save}>
        {rows.length === 0 && <p style={{ color: "var(--ink-500)", fontSize: 13 }}>{t("noEmployees")}</p>}
        {rows.map((r, i) => (
          <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</span>
            <input placeholder={t("bankPlaceholder")} value={r.bankName} onChange={(e) => setRows((p) => p.map((x, j) => (j === i ? { ...x, bankName: e.target.value } : x)))} />
            <input placeholder={t("accountPlaceholder")} value={r.bankAccount} onChange={(e) => setRows((p) => p.map((x, j) => (j === i ? { ...x, bankAccount: e.target.value } : x)))} />
          </div>
        ))}
        {rows.length > 0 && <button className="btn btn-primary" style={{ width: "100%", marginTop: 8 }} type="submit">{t("save")}</button>}
      </form>
    </Modal>
  );
}

export default function DisbursementsPage() {
  const t = useTranslations("Pages.corp_pay_disbursements");
  const { toast, user } = useAppData();
  const store = useCorpStore();
  const wallet = useWallet();
  const [banks, setBanks] = useState(false);

  const approved = useMemo(
    () => store.payrollRuns.filter((r) => r.status === "Approved" || r.status === "Paid"),
    [store.payrollRuns]
  );

  function exportRun(run: PayrollRunRec) {
    const rows = store.employees.map((e) => ({
      run_id: run.id,
      employee: e.name,
      bank: e.bankName,
      account: e.bankAccount,
      net_pay: run.employees > 0 ? (run.totalAmount / run.employees).toFixed(2) : run.totalAmount.toFixed(2),
      currency: "USD",
      reference: `${run.id}/${e.id}`,
    }));
    if (!rows.length) {
      downloadCsv(`disbursement-${run.id}.csv`, [
        { run_id: run.id, employee: "ALL STAFF", bank: "", account: "", net_pay: run.totalAmount.toFixed(2), currency: "USD", reference: run.id },
      ]);
    } else {
      downloadCsv(`disbursement-${run.id}.csv`, rows);
    }
    toast(t("toastBankFile", { id: run.id }), "download");
  }

  function exportEcocash(run: PayrollRunRec) {
    const rows = store.employees.map((e) => ({
      run_id: run.id,
      employee: e.name,
      phone: "",
      amount: run.employees > 0 ? (run.totalAmount / run.employees).toFixed(2) : run.totalAmount.toFixed(2),
      currency: "USD",
    }));
    downloadCsv(`ecocash-bulk-${run.id}.csv`, rows.length ? rows : [
      { run_id: run.id, employee: "ALL STAFF", phone: "", amount: run.totalAmount.toFixed(2), currency: "USD" },
    ]);
    toast(t("toastEcocashFile", { id: run.id }), "download");
  }

  /** Salary lands straight into opened WellSpend wallets — instant, no bank file. */
  function payToWallets(run: PayrollRunRec) {
    if (!wallet.opened) {
      toast(t("toastNoWallet"), "x");
      return;
    }
    const share = run.employees > 0 ? run.totalAmount / run.employees : run.totalAmount;
    walletCredit(Math.round(share * 100) / 100, t("txnSalary", { period: run.period }), "Internal", user?.organisation ?? run.id);
    toast(t("toastWalletPaid", { amount: usd(share), id: run.id }), "check-circle");
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-ghost" onClick={() => setBanks(true)}>
          <Icon name="wallet" size={15} style={{ marginRight: 6 }} />{t("bankDetails")}
        </button>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div className="card-head"><h3>{t("readyHeading")}</h3></div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={th}>{t("colRun")}</th><th style={th}>{t("colPeriod")}</th><th style={th}>{t("colEmployees")}</th>
              <th style={th}>{t("colTotal")}</th><th style={th}>{t("colStatus")}</th><th style={th}>{t("colExport")}</th>
            </tr>
          </thead>
          <tbody>
            {approved.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                {t("emptyState")}
              </td></tr>
            )}
            {approved.map((run) => (
              <tr key={run.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={td}>{run.id}</td>
                <td style={{ ...td, fontWeight: 600 }}>{run.period}</td>
                <td style={td}>{run.employees}</td>
                <td style={{ ...td, fontWeight: 600 }}>{usd(run.totalAmount)}</td>
                <td style={td}><span className={"badge " + payrollBadge(run.status)}>{run.status}</span></td>
                <td style={td}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => exportRun(run)}>
                    <Icon name="download" size={13} style={{ marginRight: 4 }} />{t("bankCsv")}
                  </button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => exportEcocash(run)}>
                    <Icon name="download" size={13} style={{ marginRight: 4 }} />Ecocash
                  </button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--rose-600)" }} onClick={() => payToWallets(run)}>
                    <Icon name="wallet" size={13} style={{ marginRight: 4 }} />{t("payToWallets")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-card card-pad" style={{ fontSize: 13, color: "var(--ink-500)", lineHeight: 1.7 }}>
        <Icon name="file-text" size={15} style={{ marginRight: 6, verticalAlign: -2 }} />
        {t.rich("helpText", { b: (chunks) => <b>{chunks}</b> })}
      </div>

      {banks && <BankModal onClose={() => setBanks(false)} />}
    </>
  );
}
