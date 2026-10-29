"use client";

import { useState, useMemo, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import { useCorpStore, updateCorp, nextId, LeaveStatus } from "@/lib/corpStore";

const th = { padding: "12px 8px", fontWeight: 600, fontSize: 13 } as const;
const td = { padding: "12px 8px", fontSize: 13 } as const;
const badge = (s: LeaveStatus) => (s === "Approved" ? "badge-green" : s === "Rejected" ? "badge-red" : "badge-amber");
const LEAVE_TYPES = ["Annual", "Sick", "Maternity/Paternity", "Compassionate", "Unpaid", "Study"];
const LEAVE_TYPE_KEYS: Record<string, string> = {
  Annual: "annual",
  Sick: "sick",
  "Maternity/Paternity": "maternityPaternity",
  Compassionate: "compassionate",
  Unpaid: "unpaid",
  Study: "study",
};

const dayMs = 864e5;
const today = new Date().toISOString().slice(0, 10);

function RequestModal({ employeeName, onClose }: { employeeName: string; onClose: () => void }) {
  const { toast } = useAppData();
  const t = useTranslations("Pages.emp_leave");
  const [type, setType] = useState(LEAVE_TYPES[0]);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const days = Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / dayMs) + 1);

  const leaveTypeLabel = (lt: string) => {
    const key = LEAVE_TYPE_KEYS[lt];
    return key ? t(`leaveType.${key}`) : lt;
  };

  function submit(e: FormEvent) {
    e.preventDefault();
    updateCorp((s) => ({
      ...s,
      leave: [{ id: nextId("LV"), employee: employeeName, type, from, to, days, status: "Pending" }, ...s.leave],
    }));
    toast(t("requestSentToast"), "check-circle");
    onClose();
  }

  return (
    <Modal title={t("requestLeave")} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>{t("fieldType")}</label>
          <select className="settings-select" style={{ width: "100%" }} value={type} onChange={(e) => setType(e.target.value)}>
            {LEAVE_TYPES.map((lt) => <option key={lt} value={lt}>{leaveTypeLabel(lt)}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="field"><label>{t("fieldFrom")}</label><input type="date" value={from} min={today} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className="field"><label>{t("fieldTo")}</label><input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></div>
        </div>
        <p style={{ fontSize: 13, color: "var(--ink-500)", margin: "-4px 0 10px" }}>
          {t.rich("daysRequested", {
            count: days,
            b: (chunks) => <b style={{ color: "var(--rose-600)" }}>{chunks}</b>,
          })}
        </p>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">{t("sendRequest")}</button>
      </form>
    </Modal>
  );
}

export default function EmployeeLeavePage() {
  const { user } = useAppData();
  const t = useTranslations("Pages.emp_leave");
  const store = useCorpStore();
  const [requesting, setRequesting] = useState(false);
  const name = user?.name ?? "Employee";

  const statusLabel = (s: LeaveStatus) =>
    s === "Approved" ? t("statusApproved") : s === "Rejected" ? t("statusRejected") : s === "Pending" ? t("statusPending") : s;
  const leaveTypeLabel = (lt: string) => {
    const key = LEAVE_TYPE_KEYS[lt];
    return key ? t(`leaveType.${key}`) : lt;
  };

  const mine = useMemo(
    () => store.leave.filter((l) => l.employee === name),
    [store.leave, name]
  );
  const usedDays = mine
    .filter((l) => l.status === "Approved" && l.type === "Annual")
    .reduce((s, l) => s + l.days, 0);
  const pendingDays = mine
    .filter((l) => l.status === "Pending")
    .reduce((s, l) => s + l.days, 0);
  const quota = store.leaveQuotaDays;
  const remaining = Math.max(0, quota - usedDays - pendingDays);

  function cancel(id: string) {
    updateCorp((s) => ({ ...s, leave: s.leave.filter((l) => l.id !== id) }));
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle", { org: user?.organisation ?? t("yourOrganisation") })}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setRequesting(true)}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />{t("requestLeave")}
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statQuota")}</div>
          <div className="stat-value">{quota}d</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statUsed")}</div>
          <div className="stat-value">{usedDays}d</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statPending")}</div>
          <div className="stat-value" style={{ color: pendingDays ? "var(--amber)" : undefined }}>{pendingDays}d</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statRemaining")}</div>
          <div className="stat-value" style={{ color: "var(--green)" }}>{remaining}d</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <div className="card-head"><h3>{t("myRequests")}</h3></div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={th}>{t("thType")}</th><th style={th}>{t("thFrom")}</th><th style={th}>{t("thTo")}</th>
              <th style={th}>{t("thDays")}</th><th style={th}>{t("thStatus")}</th><th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {mine.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                {t("emptyRequests")}
              </td></tr>
            )}
            {mine.map((l) => (
              <tr key={l.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ ...td, fontWeight: 600 }}>{leaveTypeLabel(l.type)}</td>
                <td style={td}>{l.from}</td>
                <td style={td}>{l.to}</td>
                <td style={td}>{l.days}</td>
                <td style={td}><span className={"badge " + badge(l.status)}>{statusLabel(l.status)}</span></td>
                <td style={td}>
                  {l.status === "Pending" && (
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--red)" }} onClick={() => cancel(l.id)}>
                      <Icon name="x" size={13} style={{ marginRight: 4 }} />{t("cancel")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {requesting && <RequestModal employeeName={name} onClose={() => setRequesting(false)} />}
    </>
  );
}
