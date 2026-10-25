"use client";

import { FormEvent, useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import Modal from "@/components/Modal";
import RecordModal, { RowRecord } from "@/components/RecordModal";

interface Loan {
  type: string;
  lender: string;
  amount: string;
  interestRate: string;
  monthlyPayment: string;
  remaining: string;
  status: string;
}

const LOANS_DATA: Loan[] = [
  { type: "Personal Loan", lender: "Barclays", amount: "$10,000", interestRate: "5.9% APR", monthlyPayment: "$300", remaining: "$7,500", status: "Active" },
  { type: "Car Loan", lender: "Lloyds", amount: "$15,000", interestRate: "4.5% APR", monthlyPayment: "$280", remaining: "$4,950", status: "Active" },
  { type: "Credit Card", lender: "Monzo", amount: "$12,450", interestRate: "18.9% APR", monthlyPayment: "$150", remaining: "$12,450", status: "High Balance" },
];

function ApplyModal({ loanType, onApply, onClose }: { loanType: string; onApply: (amount: string, term: string) => void; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [term, setTerm] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onApply(amount, term);
  }

  return (
    <Modal title={`Apply — ${loanType}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Amount (£)</label>
          <input required type="number" min="100" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 5000" />
        </div>
        <div className="field">
          <label>Term</label>
          <select className="settings-select" style={{ width: "100%" }} value={term} onChange={(e) => setTerm(e.target.value)} required>
            <option value="" disabled>Select term</option>
            <option>1 year</option>
            <option>3 years</option>
            <option>5 years</option>
            <option>7 years</option>
          </select>
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">Submit Application</button>
      </form>
    </Modal>
  );
}

export default function BorrowingPage() {
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
    const formatted = `£${Number(amount).toLocaleString()}`;
    setLoans((prev) => [...prev, {
      type: applying,
      lender: "Dr PT Credit",
      amount: formatted,
      interestRate: "TBC",
      monthlyPayment: `${term} months`,
      remaining: formatted,
      status: "Pending",
    }]);
    toast(`${applying} application submitted`, "check-circle");
    setApplying(null);
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Borrowing & Loans</h2>
          <p className="section-sub">Manage your loans and credit options</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">Total Outstanding</div>
          <div className="stat-value">$12,450</div>
          <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 4 }}>Across all loans</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Monthly Payment</div>
          <div className="stat-value">$450</div>
          <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 4 }}>Next due: Jun 1</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Credit Score</div>
          <div className="stat-value">742</div>
          <div style={{ fontSize: 12, color: "var(--green-500)", marginTop: 4 }}>Good</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Available Credit</div>
          <div className="stat-value">$8,550</div>
          <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 4 }}>Of $21,000 limit</div>
        </div>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <h3>Active Loans</h3>
        </div>
        <FilterBar
          searchPlaceholder="Search loans..."
          statusOptions={[{ value: "Active", label: "Active" }, { value: "High Balance", label: "High Balance" }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Loan Type</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Lender</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Amount</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Interest Rate</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Monthly Payment</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Remaining</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredLoans.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No loans match your search.
                </td>
              </tr>
            )}
            {filteredLoans.map((loan, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)", cursor: "pointer" }} onClick={() => setViewing({ type: loan.type, lender: loan.lender, amount: loan.amount, "interest rate": loan.interestRate, "monthly payment": loan.monthlyPayment, remaining: loan.remaining, status: loan.status })}>
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

      <div className="glass-card card-pad">
        <div className="card-head">
          <h3>Available Loan Options</h3>
        </div>
        <div className="grid grid-3">
          <div className="glass-card card-pad" style={{ cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: "var(--radius-sm)", background: "var(--blue-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="credit-card" size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>Personal Loan</div>
                <div style={{ fontSize: 13, color: "var(--ink-500)" }}>Up to $50,000</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 12 }}>
              <div>From 5.9% APR</div>
              <div>1-7 year terms</div>
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setApplying("Personal Loan")}>
              Apply Now
            </button>
          </div>
          <div className="glass-card card-pad" style={{ cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: "var(--radius-sm)", background: "var(--green-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="home" size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>Home Equity</div>
                <div style={{ fontSize: 13, color: "var(--ink-500)" }}>Up to $250,000</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 12 }}>
              <div>From 4.5% APR</div>
              <div>5-20 year terms</div>
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setApplying("Home Equity Loan")}>
              Apply Now
            </button>
          </div>
          <div className="glass-card card-pad" style={{ cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: "var(--radius-sm)", background: "var(--purple-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="refresh-cw" size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>Debt Consolidation</div>
                <div style={{ fontSize: 13, color: "var(--ink-500)" }}>Simplify payments</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 12 }}>
              <div>From 6.5% APR</div>
              <div>1-5 year terms</div>
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setApplying("Debt Consolidation")}>
              Apply Now
            </button>
          </div>
        </div>
      </div>
      {applying && <ApplyModal loanType={applying} onApply={handleApply} onClose={() => setApplying(null)} />}
      {viewing && <RecordModal mode="view" title="Loan Details" record={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}
