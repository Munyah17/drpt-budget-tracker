"use client";

import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";

export default function BillingRevenuePage() {
  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Billing & Revenue</h2>
          <p className="section-sub">Track billing and revenue metrics</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">$45,850</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">This Month</div>
          <div className="stat-value">$4,560</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Pending</div>
          <div className="stat-value">$1,240</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Refunds</div>
          <div className="stat-value">$320</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <div className="card-head">
          <h3>Recent Transactions</h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Date</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>User</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Amount</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Method</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>2025-05-26</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>john.doe@email.com</td>
              <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>$1.00</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>Paynow</td>
              <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Completed</span></td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>2025-05-25</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>sarah.smith@email.com</td>
              <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>$1.00</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>Stripe</td>
              <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Completed</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
