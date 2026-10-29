"use client";
import { sym } from "@/lib/format";

import { useTranslations } from "next-intl";
import { FormEvent, useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import Modal from "@/components/Modal";
import RecordModal, { RowRecord } from "@/components/RecordModal";
import { payoff, DebtInput } from "@/lib/financeInsights";
import { fmt } from "@/lib/format";

interface Loan {
  type: string;
  lender: string;
  amount: string;
  interestRate: string;
  monthlyPayment: string;
  remaining: string;
  status: string;
}

const LOANS_DATA: Loan[] = [];

function ApplyModal({ loanType, onApply, onClose }: { loanType: string; onApply: (amount: string, term: string) => void; onClose: () => void }) {
  const t = useTranslations("Pages.borrowing");
  const [amount, setAmount] = useState("");
  const [term, setTerm] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onApply(amount, term);
  }

  return (
    <Modal title={t("applyTitle", { type: loanType })} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>{t("amount", { sym: sym() })}</label>
          <input required type="number" min="100" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t("phAmount")} />
        </div>
        <div className="field">
          <label>{t("term")}</label>
          <select className="settings-select" style={{ width: "100%" }} value={term} onChange={(e) => setTerm(e.target.value)} required>
            <option value="" disabled>{t("selectTerm")}</option>
            <option>{t("term1")}</option>
            <option>{t("term3")}</option>
            <option>{t("term5")}</option>
            <option>{t("term7")}</option>
          </select>
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">{t("submitBtn")}</button>
      </form>
    </Modal>
  );
}

function PayoffPlanner({ loans }: { loans: Loan[] }) {
  const t = useTranslations("Pages.borrowing");
  const [extra, setExtra] = useState("50");

  const debts: DebtInput[] = useMemo(
    () =>
      loans
        .map((l) => ({
          balance: parseFloat(l.remaining.replace(/[^0-9.]/g, "")) || 0,
          apr: parseFloat(l.interestRate.replace(/[^0-9.]/g, "")) || 12,
          minPayment: parseFloat(l.monthlyPayment.replace(/[^0-9.]/g, "")) || 50,
        }))
        .filter((d) => d.balance > 0),
    [loans]
  );

  const x = parseFloat(extra) || 0;
  const avalanche = useMemo(() => payoff(debts, x, "avalanche"), [debts, x]);
  const snowball = useMemo(() => payoff(debts, x, "snowball"), [debts, x]);

  if (!debts.length) return null;

  return (
    <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
      <div className="card-head">
        <h3>{t("payoffTitle")} <span style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 400 }}>{t("payoffSub")}</span></h3>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <label style={{ fontSize: 13, color: "var(--ink-500)", flex: 1, minWidth: 200 }}>
          {t("extraPerMonth")}: <b style={{ color: "var(--rose-600)" }}>{fmt(x)}</b>
          <input type="range" min="0" max="500" step="10" value={extra} onChange={(e) => setExtra(e.target.value)} style={{ width: "100%" }} />
        </label>
      </div>
      <div className="grid grid-2">
        {([
          { name: t("avalanche"), r: avalanche },
          { name: t("snowball"), r: snowball },
        ]).map(({ name, r }) => (
          <div key={name} style={{ border: "1px solid var(--card-border)", borderRadius: "var(--radius-sm)", padding: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{name}</div>
            {r.impossible ? (
              <p style={{ fontSize: 13, color: "var(--red)", margin: 0 }}>{t("notPayable")}</p>
            ) : (
              <>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{t("monthsCount", { count: r.months })}</div>
                <div style={{ fontSize: 12, color: "var(--ink-500)" }}>
                  {t("debtFree", { date: r.payoffDate, interest: fmt(r.totalInterest) })}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      {!avalanche.impossible && !snowball.impossible && avalanche.totalInterest < snowball.totalInterest && (
        <p style={{ fontSize: 12.5, color: "var(--green)", marginTop: 10 }}>
          {t("avalancheSaves", { amount: fmt(snowball.totalInterest - avalanche.totalInterest) })}
        </p>
      )}
    </div>
  );
}

export default function BorrowingPage() {
  const t = useTranslations("Pages.borrowing");
  const { toast } = useAppData();
  const [loans, setLoans] = useState<Loan[]>(LOANS_DATA);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [applying, setApplying] = useState<string | null>(null);
  const [viewing, setViewing] = useState<RowRecord | null>(null);

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) =>
      (!statusFilter || loan.status === statusFilter) &&
      (loan.type.toLowerCase().includes(search.toLowerCase()) || loan.lender.toLowerCase().includes(search.toLowerCase()))
    );
  }, [loans, search, statusFilter]);

  const handleApply = (amount: string, term: string) => {
    if (!applying) return;
    const formatted = `$${Number(amount).toLocaleString()}`;
    setLoans((prev) => [...prev, {
      type: applying,
      lender: "WellSpend Credit",
      amount: formatted,
      interestRate: t("tbc"),
      monthlyPayment: t("monthsTerm", { term }),
      remaining: formatted,
      status: "Pending",
    }]);
    toast(t("toastApplied", { type: applying }), "check-circle");
    setApplying(null);
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("sub")}</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statOutstanding")}</div>
          <div className="stat-value">—</div>
          <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 4 }}>{t("statOutstandingSub")}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statMonthly")}</div>
          <div className="stat-value">—</div>
          <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 4 }}>{t("statMonthlySub")}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statScore")}</div>
          <div className="stat-value">—</div>
          <div style={{ fontSize: 12, color: "var(--green-500)", marginTop: 4 }}>{t("statScoreSub")}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statAvail")}</div>
          <div className="stat-value">—</div>
          <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 4 }}>{t("statAvailSub")}</div>
        </div>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <h3>{t("activeLoans")}</h3>
        </div>
        <FilterBar
          searchPlaceholder={t("phSearch")}
          statusOptions={[{ value: "Active", label: t("statusActive") }, { value: "High Balance", label: t("statusHighBalance") }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colType")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colLender")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colAmount")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colRate")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colMonthly")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colRemaining")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredLoans.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  {t("empty")}
                </td>
              </tr>
            )}
            {filteredLoans.map((loan, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)", cursor: "pointer" }} onClick={() => setViewing({ [t("rkType")]: loan.type, [t("rkLender")]: loan.lender, [t("rkAmount")]: loan.amount, [t("rkRate")]: loan.interestRate, [t("rkMonthly")]: loan.monthlyPayment, [t("rkRemaining")]: loan.remaining, [t("rkStatus")]: loan.status })}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{loan.type}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{loan.lender}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{loan.amount}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{loan.interestRate}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{loan.monthlyPayment}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{loan.remaining}</td>
                <td style={{ padding: "12px 8px" }}><span className={`badge ${loan.status === "Active" ? "badge-green" : loan.status === "Pending" ? "badge-blue" : "badge-amber"}`}>{loan.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PayoffPlanner loans={loans} />

      <div className="glass-card card-pad">
        <div className="card-head">
          <h3>{t("optionsTitle")}</h3>
        </div>
        <div className="grid grid-3">
          <div className="glass-card card-pad" style={{ cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: "var(--radius-sm)", background: "var(--blue-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="credit-card" size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{t("optPersonal")}</div>
                <div style={{ fontSize: 13, color: "var(--ink-500)" }}>{t("optPersonalLimit")}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 12 }}>
              <div>{t("optPersonalApr")}</div>
              <div>{t("optPersonalTerm")}</div>
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setApplying(t("optPersonal"))}>
              {t("applyBtn")}
            </button>
          </div>
          <div className="glass-card card-pad" style={{ cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: "var(--radius-sm)", background: "var(--green-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="home" size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{t("optHome")}</div>
                <div style={{ fontSize: 13, color: "var(--ink-500)" }}>{t("optHomeLimit")}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 12 }}>
              <div>{t("optHomeApr")}</div>
              <div>{t("optHomeTerm")}</div>
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setApplying(t("optHomeApply"))}>
              {t("applyBtn")}
            </button>
          </div>
          <div className="glass-card card-pad" style={{ cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: "var(--radius-sm)", background: "var(--purple-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="refresh-cw" size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{t("optDebt")}</div>
                <div style={{ fontSize: 13, color: "var(--ink-500)" }}>{t("optDebtLimit")}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 12 }}>
              <div>{t("optDebtApr")}</div>
              <div>{t("optDebtTerm")}</div>
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setApplying(t("optDebt"))}>
              {t("applyBtn")}
            </button>
          </div>
        </div>
      </div>
      {applying && <ApplyModal loanType={applying} onApply={handleApply} onClose={() => setApplying(null)} />}
      {viewing && <RecordModal mode="view" title={t("loanDetails")} record={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}
