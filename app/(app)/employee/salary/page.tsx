"use client";

import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import { downloadBlob } from "@/lib/download";

export default function EmployeeSalaryPage() {
  const { user, toast } = useAppData();

  const downloadP60 = () => {
    downloadBlob(
      "p60-2024-25.txt",
      `P60 END OF YEAR CERTIFICATE 2024/25\nEmployer: ${user?.organisation ?? "Organisation"}\nEmployee: ${user?.name ?? "Employee"}\n\nTotal Gross Pay: £62,400\nTotal Tax Deducted: £8,940\nNational Insurance: £3,720\nPension Contributions: £3,060\n`
    );
    toast("P60 downloaded", "file-down");
  };
  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Salary Management</h2>
          <p className="section-sub">Compensation and deduction breakdown — {user?.organisation ?? "your organisation"}</p>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">Annual Gross</div>
          <div className="stat-value">£62,400</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Monthly Gross</div>
          <div className="stat-value">£5,200</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Monthly Net</div>
          <div className="stat-value">£3,890</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="glass-card card-pad">
          <h3 style={{ fontWeight: 600, marginBottom: 14, fontSize: 15 }}>Monthly Deductions</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "10px 6px", fontSize: 13 }}>Income Tax (PAYE)</td>
                <td style={{ padding: "10px 6px", textAlign: "right", fontWeight: 600 }}>£745</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "10px 6px", fontSize: 13 }}>National Insurance</td>
                <td style={{ padding: "10px 6px", textAlign: "right", fontWeight: 600 }}>£310</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "10px 6px", fontSize: 13 }}>Pension Contribution</td>
                <td style={{ padding: "10px 6px", textAlign: "right", fontWeight: 600 }}>£255</td>
              </tr>
              <tr>
                <td style={{ padding: "10px 6px", fontWeight: 600 }}>Total Deductions</td>
                <td style={{ padding: "10px 6px", textAlign: "right", fontWeight: 700 }}>£1,310</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="glass-card card-pad">
          <h3 style={{ fontWeight: 600, marginBottom: 14, fontSize: 15 }}>Salary History</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={{ padding: "10px 6px", fontWeight: 600, fontSize: 12 }}>Effective</th>
                <th style={{ padding: "10px 6px", fontWeight: 600, fontSize: 12 }}>Annual</th>
                <th style={{ padding: "10px 6px", fontWeight: 600, fontSize: 12 }}>Change</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "10px 6px", fontSize: 13 }}>2025-04-01</td>
                <td style={{ padding: "10px 6px" }}>£62,400</td>
                <td style={{ padding: "10px 6px" }}><span className="badge badge-green">+4.2%</span></td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "10px 6px", fontSize: 13 }}>2024-04-01</td>
                <td style={{ padding: "10px 6px" }}>£59,900</td>
                <td style={{ padding: "10px 6px" }}><span className="badge badge-green">+3.0%</span></td>
              </tr>
              <tr>
                <td style={{ padding: "10px 6px", fontSize: 13 }}>2023-04-01</td>
                <td style={{ padding: "10px 6px" }}>£58,150</td>
                <td style={{ padding: "10px 6px" }}><span className="badge badge-blue">Promotion</span></td>
              </tr>
            </tbody>
          </table>
          <button className="btn btn-ghost" style={{ marginTop: 14, fontSize: 13 }} onClick={downloadP60}>
            <Icon name="file-text" size={14} style={{ marginRight: 6 }} />View P60 / Tax Documents
          </button>
        </div>
      </div>
    </>
  );
}
