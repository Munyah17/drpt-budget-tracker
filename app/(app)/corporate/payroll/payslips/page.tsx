"use client";

import { useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import Modal from "@/components/Modal";
import { downloadBlob } from "@/lib/download";

interface Payslip {
  employee: string;
  period: string;
  gross: string;
  net: string;
  status: string;
}

const PAYSLIPS_DATA: Payslip[] = [
  { employee: "Emma Wilson", period: "May 2025", gross: "$5,200", net: "$3,890", status: "Delivered" },
  { employee: "David Brown", period: "May 2025", gross: "$4,100", net: "$3,120", status: "Delivered" },
  { employee: "Lisa Chen", period: "May 2025", gross: "$3,600", net: "$2,780", status: "Pending" },
  { employee: "James Patel", period: "May 2025", gross: "$3,900", net: "$2,960", status: "Delivered" },
];

function GenerateModal({ onGenerate, onClose }: { onGenerate: (period: string) => void; onClose: () => void }) {
  const [period, setPeriod] = useState("June 2025");
  return (
    <Modal title="Generate Payslips" onClose={onClose}>
      <div className="field">
        <label>Pay period</label>
        <select className="settings-select" style={{ width: "100%" }} value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option>June 2025</option>
          <option>July 2025</option>
          <option>August 2025</option>
        </select>
      </div>
      <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => onGenerate(period)}>Generate</button>
    </Modal>
  );
}

export default function CorporatePayslipsPage() {
  const { toast } = useAppData();
  const [payslips, setPayslips] = useState<Payslip[]>(PAYSLIPS_DATA);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [genOpen, setGenOpen] = useState(false);

  const filteredData = useMemo(() => {
    return payslips.filter((p) =>
      (!statusFilter || p.status === statusFilter) &&
      p.employee.toLowerCase().includes(search.toLowerCase())
    );
  }, [payslips, search, statusFilter]);

  const handleDownload = (p: Payslip) => {
    downloadBlob(
      `payslip-${p.employee.replace(/\s+/g, "-").toLowerCase()}-${p.period.replace(/\s+/g, "-").toLowerCase()}.txt`,
      `PAYSLIP — ${p.period}\nEmployee: ${p.employee}\n\nGross Pay: ${p.gross}\nNet Pay: ${p.net}\nStatus: ${p.status}\n`
    );
    toast(`Payslip for ${p.employee} downloaded`, "download");
  };

  const handleSend = (p: Payslip) => {
    setPayslips((prev) => prev.map((x) => (x === p ? { ...x, status: "Delivered" } : x)));
    toast(`Payslip sent to ${p.employee}`, "send");
  };

  const handleGenerate = (period: string) => {
    const existing = new Set(payslips.map((p) => `${p.employee}|${p.period}`));
    const additions = ["Emma Wilson", "David Brown", "Lisa Chen", "James Patel"]
      .filter((e) => !existing.has(`${e}|${period}`))
      .map((employee) => ({ employee, period, gross: "$4,200", net: "$3,180", status: "Pending" }));
    setPayslips((prev) => [...prev, ...additions]);
    toast(`${additions.length} payslips generated for ${period}`);
    setGenOpen(false);
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Payslips</h2>
          <p className="section-sub">Distribute and manage employee payslips</p>
        </div>
        <button className="btn btn-primary" onClick={() => setGenOpen(true)}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Generate Payslips
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search payslips..."
          statusOptions={[{ value: "Delivered", label: "Delivered" }, { value: "Pending", label: "Pending" }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Employee</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Period</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Gross</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Net</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No payslips match your search.
                </td>
              </tr>
            )}
            {filteredData.map((p, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{p.employee}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{p.period}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{p.gross}</td>
                <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>{p.net}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${p.status === "Delivered" ? "badge-green" : "badge-amber"}`}>
                    {p.status}
                  </span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleDownload(p)}><Icon name="download" size={14} style={{ marginRight: 4 }} />Download</button>
                  {p.status !== "Delivered" && (
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleSend(p)}><Icon name="send" size={14} style={{ marginRight: 4 }} />Send</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {genOpen && <GenerateModal onGenerate={handleGenerate} onClose={() => setGenOpen(false)} />}
    </>
  );
}
