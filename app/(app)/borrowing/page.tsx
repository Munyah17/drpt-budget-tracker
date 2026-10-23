"use client";

import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";

export default function BorrowingPage() {
  const { toast } = useAppData();

  const handleApply = (loanType: string) => {
    toast(`Applying for ${loanType}...`, "credit-card");
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
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "12px 8px", fontWeight: 600 }}>Personal Loan</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>Barclays</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>$10,000</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>5.9% APR</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>$300</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>$7,500</td>
              <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Active</span></td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "12px 8px", fontWeight: 600 }}>Car Loan</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>Lloyds</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>$15,000</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>4.5% APR</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>$280</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>$4,950</td>
              <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Active</span></td>
            </tr>
            <tr>
              <td style={{ padding: "12px 8px", fontWeight: 600 }}>Credit Card</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>Monzo</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>$12,450</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>18.9% APR</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>$150</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>$12,450</td>
              <td style={{ padding: "12px 8px" }}><span className="badge badge-amber">High Balance</span></td>
            </tr>
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
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => handleApply("Personal Loan")}>
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
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => handleApply("Home Equity Loan")}>
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
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => handleApply("Debt Consolidation")}>
              Apply Now
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
