"use client";

import { useState } from "react";
import { CAL_EVENTS, EVENT_COLOR } from "@/lib/data";
import { gbp, ukDate } from "@/lib/format";
import Icon from "@/components/Icon";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function CalendarPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [year, setYear] = useState(2025);
  const [mon, setMon] = useState(4); // 0-indexed, May 2025 default

  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  // Day of week for the 1st, converted to Mon=0..Sun=6
  const firstDow = (new Date(year, mon, 1).getDay() + 6) % 7;

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(mon + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }

  const prevMonth = () => {
    setSelected(null);
    if (mon === 0) { setMon(11); setYear((y) => y - 1); } else setMon((m) => m - 1);
  };
  const nextMonth = () => {
    setSelected(null);
    if (mon === 11) { setMon(0); setYear((y) => y + 1); } else setMon((m) => m + 1);
  };

  const selectedEvents = selected ? CAL_EVENTS[selected] : undefined;

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Calendar</h2>
          <p className="section-sub">Income, expenses, bills and savings at a glance</p>
        </div>
      </div>
      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <button className="btn btn-ghost btn-icon" onClick={prevMonth} aria-label="Previous month">
            <Icon name="chevron-left" size={16} />
          </button>
          <h3>{MONTH_NAMES[mon]} {year}</h3>
          <button className="btn btn-ghost btn-icon" onClick={nextMonth} aria-label="Next month">
            <Icon name="chevron-right" size={16} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 16, marginBottom: 14, fontSize: 12.5, fontWeight: 600, color: "var(--ink-500)" }}>
          <span>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: EVENT_COLOR.income, marginRight: 5 }} />
            Income
          </span>
          <span>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: EVENT_COLOR.expense, marginRight: 5 }} />
            Expenses
          </span>
          <span>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: EVENT_COLOR.bill, marginRight: 5 }} />
            Bills
          </span>
          <span>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: EVENT_COLOR.savings, marginRight: 5 }} />
            Savings
          </span>
        </div>
        <div className="cal-grid" style={{ marginBottom: 6 }}>
          {DOW.map((d) => (
            <div className="cal-dow" key={d}>
              {d}
            </div>
          ))}
        </div>
        <div className="cal-grid">
          {cells.map((iso, idx) => {
            if (!iso) return <div className="cal-day muted" key={idx} />;
            const isToday = iso === "2025-05-28";
            const isSelected = iso === selected;
            const ev = CAL_EVENTS[iso];
            const day = parseInt(iso.slice(-2), 10);
            return (
              <div
                key={iso}
                className={"cal-day" + (isToday ? " today" : "") + (isSelected ? " selected" : "")}
                style={isSelected ? { outline: "2px solid var(--rose-500)", borderRadius: 6 } : undefined}
                onClick={() => setSelected(iso)}
              >
                {day}
                {ev && (
                  <div className="cal-dots">
                    {ev.map((e, i) => (
                      <span key={i} style={{ background: EVENT_COLOR[e.type] }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="glass-card card-pad">
        {!selected && (
          <>
            <div className="card-head">
              <h3>Upcoming this week</h3>
            </div>
            <p style={{ color: "var(--ink-500)", fontSize: 13.5 }}>
              Click any date above to see a full breakdown of income, expenses and bills for that day.
            </p>
          </>
        )}
        {selected && !selectedEvents && (
          <>
            <div className="card-head">
              <h3>{ukDate(selected)}</h3>
            </div>
            <p style={{ color: "var(--ink-500)", fontSize: 13.5 }}>No activity recorded on this day.</p>
          </>
        )}
        {selected && selectedEvents && (
          <>
            <div className="card-head">
              <h3>{ukDate(selected)}</h3>
            </div>
            {selectedEvents.map((e, i) => (
              <div
                key={i}
                style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--card-border)" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: EVENT_COLOR[e.type] }} />
                  {e.label}
                </div>
                <span style={{ fontWeight: 700, color: e.amount > 0 ? "var(--green)" : "var(--ink-900)" }}>
                  {e.amount > 0 ? "+" : ""}
                  {gbp(e.amount)}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}
