"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { EVENT_COLOR, CalEvent } from "@/lib/data";
import { fmt, ukDate } from "@/lib/format";
import Icon from "@/components/Icon";

const DOW_KEYS = ["dowMon", "dowTue", "dowWed", "dowThu", "dowFri", "dowSat", "dowSun"];
const MONTH_KEYS = ["monthJan","monthFeb","monthMar","monthApr","monthMay","monthJun","monthJul","monthAug","monthSep","monthOct","monthNov","monthDec"];

export default function CalendarPage() {
  const t = useTranslations("Pages.calendar");
  const { income, expenses, bills } = useAppData();
  const DOW = DOW_KEYS.map((k) => t(k));
  const MONTH_NAMES = MONTH_KEYS.map((k) => t(k));
  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const [selected, setSelected] = useState<string | null>(null);
  const [year, setYear] = useState(now.getFullYear());
  const [mon, setMon] = useState(now.getMonth()); // 0-indexed, current month default

  // Real day events from income, expenses and bills
  const CAL_EVENTS = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    const push = (iso: string, ev: CalEvent) => (map[iso] = map[iso] ?? []).push(ev);
    income.forEach((i) => push(i.date.slice(0, 10), { type: "income", label: i.source, amount: i.amount }));
    expenses.forEach((e) => push(e.date.slice(0, 10), { type: "expense", label: e.merchant, amount: -e.amount }));
    bills.forEach((b) => {
      if (b.due) push(b.due.slice(0, 10), { type: "bill", label: t("dueLabel", { name: b.name }), amount: -b.amount });
    });
    return map;
  }, [income, expenses, bills, t]);

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
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("sub")}</p>
        </div>
      </div>
      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <button className="btn btn-ghost btn-icon" onClick={prevMonth} aria-label={t("prevMonth")}>
            <Icon name="chevron-left" size={16} />
          </button>
          <h3>{MONTH_NAMES[mon]} {year}</h3>
          <button className="btn btn-ghost btn-icon" onClick={nextMonth} aria-label={t("nextMonth")}>
            <Icon name="chevron-right" size={16} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 16, marginBottom: 14, fontSize: 12.5, fontWeight: 600, color: "var(--ink-500)" }}>
          <span>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: EVENT_COLOR.income, marginRight: 5 }} />
            {t("income")}
          </span>
          <span>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: EVENT_COLOR.expense, marginRight: 5 }} />
            {t("expenses")}
          </span>
          <span>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: EVENT_COLOR.bill, marginRight: 5 }} />
            {t("bills")}
          </span>
          <span>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: EVENT_COLOR.savings, marginRight: 5 }} />
            {t("savings")}
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
            const isToday = iso === todayIso;
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
              <h3>{t("upcomingTitle")}</h3>
            </div>
            <p style={{ color: "var(--ink-500)", fontSize: 13.5 }}>
              {t("upcomingHint")}
            </p>
          </>
        )}
        {selected && !selectedEvents && (
          <>
            <div className="card-head">
              <h3>{ukDate(selected)}</h3>
            </div>
            <p style={{ color: "var(--ink-500)", fontSize: 13.5 }}>{t("noActivity")}</p>
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
                  {fmt(e.amount)}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}
