"use client";
import { sym } from "@/lib/format";

import { FormEvent, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import Modal from "@/components/Modal";
import RecordModal, { RowRecord } from "@/components/RecordModal";
import { useAppData } from "@/lib/AppDataContext";

interface Advance {
  id: string;
  type: string;
  amount: string;
  repayment: string;
  status: string;
  date: string;
}

const ADVANCES_DATA: Advance[] = [];
const ADVANCE_TYPE_KEYS: Record<string, string> = {
  "Salary Advance": "salaryAdvance",
  "Employee Loan": "employeeLoan",
};

function RequestAdvanceModal({ onSubmit, onClose }: { onSubmit: (type: string, amount: string) => void; onClose: () => void }) {
  const t = useTranslations("Pages.emp_borrowing");
  const [type, setType] = useState("Salary Advance");
  const [amount, setAmount] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(type, amount);
  }

  return (
    <Modal title={t("requestAdvance")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>{t("fieldType")}</label>
          <select className="settings-select" style={{ width: "100%" }} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="Salary Advance">{t("advanceType.salaryAdvance")}</option>
            <option value="Employee Loan">{t("advanceType.employeeLoan")}</option>
          </select>
        </div>
        <div className="field">
          <label>{t("amountLabel", { sym: sym() })}</label>
          <input required type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t("amountPlaceholder")} />
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">{t("submitRequest")}</button>
      </form>
    </Modal>
  );
}

export default function EmployeeBorrowingPage() {
  const { user, toast } = useAppData();
  const t = useTranslations("Pages.emp_borrowing");
  const [advances, setAdvances] = useState<Advance[]>(ADVANCES_DATA);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [requestOpen, setRequestOpen] = useState(false);
  const [viewing, setViewing] = useState<RowRecord | null>(null);

  const filteredData = useMemo(() => {
    return advances.filter((a) =>
      (!statusFilter || a.status === statusFilter) &&
      (a.id.toLowerCase().includes(search.toLowerCase()) || a.type.toLowerCase().includes(search.toLowerCase()))
    );
  }, [advances, search, statusFilter]);

  const typeLabel = (at: string) => {
    const key = ADVANCE_TYPE_KEYS[at];
    return key ? t(`advanceType.${key}`) : at;
  };
  const statusLabel = (s: string) =>
    s === "Approved" ? t("statusApproved")
    : s === "Active" ? t("statusActive")
    : s === "Settled" ? t("statusSettled")
    : s === "Pending" ? t("statusPending")
    : s;
  const repaymentLabel = (r: string) => (r === "Pending approval" ? t("pendingApproval") : r);

  const handleView = (a: Advance) => setViewing({
    [t("thReference")]: a.id,
    [t("thType")]: typeLabel(a.type),
    [t("thAmount")]: a.amount,
    [t("thRepayment")]: repaymentLabel(a.repayment),
    [t("thStatus")]: statusLabel(a.status),
    [t("thDate")]: a.date,
  });

  const handleRequest = (type: string, amount: string) => {
    setAdvances((prev) => [...prev, {
      id: `ADV-${String(prev.length + 1).padStart(3, "0")}`,
      type,
      amount: `$${Number(amount).toLocaleString()}`,
      repayment: "Pending approval",
      status: "Pending",
      date: new Date().toISOString().slice(0, 10),
    }]);
    toast(t("requestSubmittedToast", { type: typeLabel(type) }), "check-circle");
    setRequestOpen(false);
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle", { org: user?.organisation ?? t("yourOrganisation") })}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setRequestOpen(true)}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          {t("requestAdvance")}
        </button>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statAvailable")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statOutstanding")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statNextRepayment")}</div>
          <div className="stat-value">—</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          statusOptions={[{ value: "Approved", label: t("statusApproved") }, { value: "Active", label: t("statusActive") }, { value: "Settled", label: t("statusSettled") }, { value: "Pending", label: t("statusPending") }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thReference")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thType")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thAmount")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thRepayment")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thDate")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  {t("emptySearch")}
                </td>
              </tr>
            )}
            {filteredData.map((a, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{a.id}</td>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{typeLabel(a.type)}</td>
                <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>{a.amount}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{repaymentLabel(a.repayment)}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${a.status === "Settled" ? "badge-green" : a.status === "Pending" ? "badge-amber" : "badge-blue"}`}>
                    {statusLabel(a.status)}
                  </span>
                </td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{a.date}</td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleView(a)}><Icon name="eye" size={14} style={{ marginRight: 4 }} />{t("view")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {requestOpen && <RequestAdvanceModal onSubmit={handleRequest} onClose={() => setRequestOpen(false)} />}
      {viewing && <RecordModal mode="view" title={t("advanceDetails")} record={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}
