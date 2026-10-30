"use client";

import { useState, useMemo, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import Modal from "@/components/Modal";
import {
  useCorpStore, updateCorp, payrollNext, payrollBadge,
  PayrollRunRec, PayrollStatus,
} from "@/lib/corpStore";
import { usd } from "@/lib/payslip";

const th = { padding: "12px 8px", fontWeight: 600, fontSize: 13 } as const;
const td = { padding: "12px 8px", fontSize: 13 } as const;

const ACTION_KEYS: Record<string, string> = {
  "Pending Review": "actionSubmitReview",
  Approved: "actionApprove",
  Paid: "actionMarkPaid",
};

function NewRunModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Pages.corp_pay_runs");
  const { toast, user } = useAppData();
  const store = useCorpStore();
  const [period, setPeriod] = useState("");
  const [kind, setKind] = useState<"Regular" | "Off-cycle">("Regular");
  const [sbu, setSbu] = useState("all");
  const [employees, setEmployees] = useState(String(store.employees.length || ""));
  const [total, setTotal] = useState("");
  const [payDate, setPayDate] = useState("");
  const [note, setNote] = useState("");

  const sbuCount = sbu === "all" ? store.employees.length : store.employees.filter((e) => (e.sbuId ?? "sbu-hq") === sbu).length;

  function submit(e: FormEvent) {
    e.preventDefault();
    const run: PayrollRunRec = {
      id: `RUN-${Date.now().toString(36).toUpperCase()}`,
      period: period || new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      kind,
      sbu,
      employees: parseInt(employees) || sbuCount || 0,
      totalAmount: parseFloat(total) || 0,
      status: "Draft",
      payDate: payDate || "—",
      createdBy: user?.name,
      note: kind === "Off-cycle" ? note || "Off-cycle payment" : note,
    };
    updateCorp((s) => ({ ...s, payrollRuns: [run, ...s.payrollRuns] }));
    toast(t("toastCreated", { kind: t(kind === "Off-cycle" ? "kindOffCycle" : "kindRegular"), id: run.id }), "check-circle");
    onClose();
  }

  return (
    <Modal title={t("modalTitle")} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>{t("fieldRunType")}</label>
          <select className="settings-select" style={{ width: "100%" }} value={kind} onChange={(e) => setKind(e.target.value as "Regular" | "Off-cycle")}>
            <option value="Regular">{t("kindRegular")}</option>
            <option value="Off-cycle">{t("kindOffCycle")}</option>
          </select>
        </div>
        <div className="field">
          <label>{t("fieldPeriod")}{kind === "Off-cycle" ? t("periodHintOffCycle") : ""}</label>
          <input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder={kind === "Regular" ? t("periodPlaceholderRegular") : t("periodPlaceholderOffCycle")} />
        </div>
        <div className="field">
          <label>{t("fieldSbu")}</label>
          <select className="settings-select" style={{ width: "100%" }} value={sbu} onChange={(e) => setSbu(e.target.value)}>
            <option value="all">{t("sbuAll")}</option>
            {store.sbus.map((s) => <option key={s.id} value={s.id}>{s.name} ({store.employees.filter((e) => (e.sbuId ?? "sbu-hq") === s.id).length})</option>)}
          </select>
        </div>
        <div className="field">
          <label>{t("fieldEmployees")}</label>
          <input type="number" min="0" value={employees || sbuCount} onChange={(e) => setEmployees(e.target.value)} />
        </div>
        <div className="field">
          <label>{t("fieldTotal")}</label>
          <input required type="number" min="0" step="0.01" value={total} onChange={(e) => setTotal(e.target.value)} placeholder={t("totalPlaceholder")} />
        </div>
        <div className="field">
          <label>{t("fieldPayDate")}</label>
          <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
        </div>
        {kind === "Off-cycle" && (
          <div className="field">
            <label>{t("fieldReason")}</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("reasonPlaceholder")} />
          </div>
        )}
        {store.advances.filter((a) => a.status === "Approved" || a.status === "Paid Out").length > 0 && (
          <p style={{ fontSize: 12.5, color: "var(--ink-500)", margin: "-4px 0 10px" }}>
            {t("earlyPayDeductions", {
              count: store.advances.filter((a) => a.status === "Approved" || a.status === "Paid Out").length,
              total: usd(store.advances.filter((a) => a.status === "Approved" || a.status === "Paid Out").reduce((s, a) => s + a.repay, 0)),
            })}
          </p>
        )}
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">{t("createRun")}</button>
      </form>
    </Modal>
  );
}

export default function CorporatePayrollRunsPage() {
  const t = useTranslations("Pages.corp_pay_runs");
  const { toast, user } = useAppData();
  const store = useCorpStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(
    () =>
      store.payrollRuns.filter(
        (r) =>
          (!statusFilter || r.status === statusFilter) &&
          (r.id.toLowerCase().includes(search.toLowerCase()) ||
            r.period.toLowerCase().includes(search.toLowerCase()))
      ),
    [store.payrollRuns, search, statusFilter]
  );

  const count = (s: PayrollStatus) => store.payrollRuns.filter((r) => r.status === s).length;
  const awaiting = count("Pending Review");

  function advance(run: PayrollRunRec) {
    const next = payrollNext(run.status);
    if (!next) return;
    updateCorp((s) => ({
      ...s,
      payrollRuns: s.payrollRuns.map((r) =>
        r.id === run.id
          ? { ...r, status: next, ...(next === "Approved" ? { approvedBy: user?.name } : {}) }
          : r
      ),
      // Payday settles every Early Pay advance that was paid out
      ...(next === "Paid"
        ? {
            advances: s.advances.map((a) =>
              a.status === "Paid Out" ? { ...a, status: "Settled" as const, settledRunId: run.id } : a
            ),
          }
        : {}),
    }));
    toast(t("toastAdvanced", { id: run.id, status: next }), next === "Paid" ? "check-circle" : "check");
  }

  function reject(run: PayrollRunRec) {
    updateCorp((s) => ({
      ...s,
      payrollRuns: s.payrollRuns.map((r) => (r.id === run.id ? { ...r, status: "Rejected" as const } : r)),
    }));
    toast(t("toastRejected", { id: run.id }), "x");
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          {t("newRun")}
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad"><div className="stat-label">{t("statDraft")}</div><div className="stat-value">{count("Draft")}</div></div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statAwaiting")}</div>
          <div className="stat-value" style={{ color: awaiting ? "var(--amber)" : undefined }}>{awaiting}</div>
        </div>
        <div className="glass-card card-pad"><div className="stat-label">{t("statApprovedUnpaid")}</div><div className="stat-value">{count("Approved")}</div></div>
        <div className="glass-card card-pad"><div className="stat-label">{t("statPaid")}</div><div className="stat-value" style={{ color: "var(--green)" }}>{count("Paid")}</div></div>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          statusOptions={[
            { value: "Draft", label: t("statusDraft") },
            { value: "Pending Review", label: t("statusPendingReview") },
            { value: "Approved", label: t("statusApproved") },
            { value: "Paid", label: t("statusPaid") },
            { value: "Rejected", label: t("statusRejected") },
          ]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={th}>{t("colRunId")}</th>
              <th style={th}>{t("colPeriod")}</th>
              <th style={th}>{t("colSbu")}</th>
              <th style={th}>{t("colType")}</th>
              <th style={th}>{t("colEmployees")}</th>
              <th style={th}>{t("colTotal")}</th>
              <th style={th}>{t("colStatus")}</th>
              <th style={th}>{t("colPayDate")}</th>
              <th style={th}>{t("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>{t("emptyState")}</td></tr>
            )}
            {filtered.map((run) => {
              const next = payrollNext(run.status);
              return (
                <tr key={run.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={td}>{run.id}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{run.period}</td>
                  <td style={td}><span className="chip">{run.sbu && run.sbu !== "all" ? (store.sbus.find((s) => s.id === run.sbu)?.code ?? "HQ") : t("sbuAllShort")}</span></td>
                  <td style={td}><span className="chip">{run.kind}</span></td>
                  <td style={td}>{run.employees}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{usd(run.totalAmount)}</td>
                  <td style={td}><span className={"badge " + payrollBadge(run.status)}>{run.status}</span></td>
                  <td style={td}>{run.payDate}</td>
                  <td style={td}>
                    {next && (
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "4px 8px", fontSize: 12, color: next === "Paid" ? "var(--green)" : "var(--rose-600)" }}
                        onClick={() => advance(run)}
                      >
                        <Icon name="check" size={14} style={{ marginRight: 4 }} />{t(ACTION_KEYS[next])}
                      </button>
                    )}
                    {(run.status === "Draft" || run.status === "Pending Review") && (
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--red)" }} onClick={() => reject(run)}>
                        <Icon name="x" size={14} style={{ marginRight: 4 }} />{t("reject")}
                      </button>
                    )}
                    {run.approvedBy && <span style={{ fontSize: 11, color: "var(--ink-500)", display: "block" }}>{t("approvedBy", { name: run.approvedBy })}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {creating && <NewRunModal onClose={() => setCreating(false)} />}
    </>
  );
}
