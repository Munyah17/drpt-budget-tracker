"use client";

import { useState, useMemo, FormEvent } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import Modal from "@/components/Modal";
import { useCorpStore, updateCorp, nextId, LeaveReq, LeaveStatus } from "@/lib/corpStore";

const th = { padding: "12px 8px", fontWeight: 600, fontSize: 13 } as const;
const td = { padding: "12px 8px", fontSize: 13 } as const;
const badge = (s: LeaveStatus) => (s === "Approved" ? "badge-green" : s === "Rejected" ? "badge-red" : "badge-amber");
const LEAVE_TYPES = ["Annual", "Sick", "Maternity/Paternity", "Compassionate", "Unpaid", "Study"];

const dayMs = 864e5;
const today = new Date().toISOString().slice(0, 10);
const inDays = (n: number) => new Date(Date.now() + n * dayMs).toISOString().slice(0, 10);

function RequestModal({ onClose }: { onClose: () => void }) {
  const { toast } = useAppData();
  const [employee, setEmployee] = useState("");
  const [type, setType] = useState(LEAVE_TYPES[0]);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  const days = Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / dayMs) + 1);

  function submit(e: FormEvent) {
    e.preventDefault();
    const req: LeaveReq = { id: nextId("LV"), employee, type, from, to, days, status: "Pending" };
    updateCorp((s) => ({ ...s, leave: [req, ...s.leave] }));
    toast(`Leave request for ${employee} submitted`, "check-circle");
    onClose();
  }

  return (
    <Modal title="New Leave Request" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field"><label>Employee</label><input required value={employee} onChange={(e) => setEmployee(e.target.value)} placeholder="Full name" /></div>
        <div className="field">
          <label>Type</label>
          <select className="settings-select" style={{ width: "100%" }} value={type} onChange={(e) => setType(e.target.value)}>
            {LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="field"><label>From</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className="field"><label>To</label><input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></div>
        </div>
        <p style={{ fontSize: 13, color: "var(--ink-500)", margin: "-4px 0 10px" }}><b style={{ color: "var(--rose-600)" }}>{days} day{days === 1 ? "" : "s"}</b> requested</p>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">Submit Request</button>
      </form>
    </Modal>
  );
}

/** Who's-off strip for the next 21 days. */
function TeamCalendar({ leave }: { leave: LeaveReq[] }) {
  const horizon = useMemo(() => Array.from({ length: 21 }, (_, i) => inDays(i)), []);
  const approved = leave.filter((l) => l.status === "Approved");
  const offOn = (d: string) => approved.filter((l) => l.from <= d && l.to >= d);
  if (!approved.some((l) => l.to >= today)) return null;

  return (
    <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
      <div className="card-head"><h3>Team Calendar — next 3 weeks</h3></div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(21, minmax(30px,1fr))", gap: 4, minWidth: 640 }}>
          {horizon.map((d) => {
            const off = offOn(d);
            const dt = new Date(d + "T00:00:00");
            return (
              <div
                key={d}
                title={off.length ? off.map((l) => `${l.employee} (${l.type})`).join(", ") : d}
                style={{
                  textAlign: "center", fontSize: 10, padding: "6px 2px", borderRadius: 8,
                  background: off.length ? "var(--pink-100)" : "transparent",
                  border: d === today ? "1.5px solid var(--rose-600)" : "1px solid var(--card-border)",
                  color: off.length ? "var(--rose-600)" : "var(--ink-500)", fontWeight: off.length ? 700 : 400,
                }}
              >
                <div>{dt.toLocaleDateString("en-GB", { weekday: "narrow" })}</div>
                <div style={{ fontWeight: 700 }}>{dt.getDate()}</div>
                {off.length > 0 && <div style={{ fontSize: 9 }}>{off.length} off</div>}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        {approved.filter((l) => l.to >= today).map((l) => (
          <span key={l.id} className="chip" title={`${l.from} → ${l.to}`}>
            {l.employee} · {l.type} · {l.from.slice(5)}→{l.to.slice(5)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function LeavePage() {
  const { toast } = useAppData();
  const store = useCorpStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(
    () => store.leave.filter((r) =>
      (!statusFilter || r.status === statusFilter) &&
      (r.employee.toLowerCase().includes(search.toLowerCase()) || r.type.toLowerCase().includes(search.toLowerCase()))),
    [store.leave, search, statusFilter]
  );

  const pending = store.leave.filter((r) => r.status === "Pending");
  const onLeaveToday = store.leave.filter((r) => r.status === "Approved" && r.from <= today && r.to >= today).length;

  function decide(r: LeaveReq, status: LeaveStatus) {
    updateCorp((s) => ({ ...s, leave: s.leave.map((x) => (x.id === r.id ? { ...x, status } : x)) }));
    toast(`Leave ${status.toLowerCase()} for ${r.employee}`, status === "Approved" ? "check-circle" : "x");
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Leave Management</h2>
          <p className="section-sub">Review and manage employee leave requests</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          New Request
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">Pending</div>
          <div className="stat-value" style={{ color: pending.length ? "var(--amber)" : undefined }}>{pending.length}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Approved</div>
          <div className="stat-value">{store.leave.filter((r) => r.status === "Approved").length}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Rejected</div>
          <div className="stat-value">{store.leave.filter((r) => r.status === "Rejected").length}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">On Leave Today</div>
          <div className="stat-value">{onLeaveToday}</div>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="glass-card card-pad" style={{ marginBottom: 20, borderLeft: "3px solid var(--amber)" }}>
          <div className="card-head"><h3>Needs your decision ({pending.length})</h3></div>
          {pending.map((r) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--card-border)", flexWrap: "wrap" }}>
              <div>
                <b>{r.employee}</b> · {r.type} · {r.from} → {r.to} <span style={{ color: "var(--ink-500)" }}>({r.days}d)</span>
              </div>
              <div>
                <button className="btn btn-primary btn-sm" style={{ marginRight: 6 }} onClick={() => decide(r, "Approved")}><Icon name="check" size={13} style={{ marginRight: 4 }} />Approve</button>
                <button className="btn btn-ghost btn-sm" onClick={() => decide(r, "Rejected")}><Icon name="x" size={13} style={{ marginRight: 4 }} />Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TeamCalendar leave={store.leave} />

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search requests..."
          statusOptions={[{ value: "Pending", label: "Pending" }, { value: "Approved", label: "Approved" }, { value: "Rejected", label: "Rejected" }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={th}>Employee</th>
              <th style={th}>Type</th>
              <th style={th}>From</th>
              <th style={th}>To</th>
              <th style={th}>Days</th>
              <th style={th}>Status</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No leave requests match your search.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ ...td, fontWeight: 600 }}>{r.employee}</td>
                <td style={td}>{r.type}</td>
                <td style={td}>{r.from}</td>
                <td style={td}>{r.to}</td>
                <td style={td}>{r.days}</td>
                <td style={td}>
                  <span className={"badge " + badge(r.status)}>{r.status}</span>
                </td>
                <td style={td}>
                  {r.status === "Pending" && (
                    <>
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--green)" }} onClick={() => decide(r, "Approved")}><Icon name="check" size={14} style={{ marginRight: 4 }} />Approve</button>
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--red)" }} onClick={() => decide(r, "Rejected")}><Icon name="x" size={14} style={{ marginRight: 4 }} />Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {creating && <RequestModal onClose={() => setCreating(false)} />}
    </>
  );
}
