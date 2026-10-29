"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/Icon";

interface PlatformEvent {
  id: string;
  title: string;
  type: "maintenance" | "release" | "meeting" | "announcement";
  date: string;
  description: string;
}

export default function AdminCalendarPage() {
  const t = useTranslations("Pages.adm_calendar");
  const [selectedDate, setSelectedDate] = useState("2025-05-26");
  const [showAddEvent, setShowAddEvent] = useState(false);

  const mockEvents: PlatformEvent[] = [];

  const typeLabels: Record<string, string> = {
    maintenance: t("typeMaintenance"),
    release: t("typeRelease"),
    meeting: t("typeMeeting"),
    announcement: t("typeAnnouncement"),
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      maintenance: "badge-amber",
      release: "badge-green",
      meeting: "badge-blue",
      announcement: "badge-red",
    };
    return <span className={`badge ${colors[type as keyof typeof colors]}`}>{typeLabels[type] ?? type}</span>;
  };

  const days = Array.from({ length: 35 }, (_, i) => {
    const date = new Date(2025, 4, i - 2);
    return {
      day: date.getDate(),
      month: date.getMonth(),
      isCurrentMonth: date.getMonth() === 4,
      dateStr: date.toISOString().split('T')[0],
    };
  });

  const weekDays = [t("daySun"), t("dayMon"), t("dayTue"), t("dayWed"), t("dayThu"), t("dayFri"), t("daySat")];

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddEvent(true)}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          {t("addEvent")}
        </button>
      </div>

      {showAddEvent && (
        <div className="glass-card card-pad" style={{ marginBottom: 20, maxWidth: 500 }}>
          <h3 style={{ marginBottom: 16 }}>{t("addEventHeading")}</h3>
          <div className="field">
            <label>{t("labelEventTitle")}</label>
            <input type="text" placeholder={t("eventTitlePlaceholder")} style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }} />
          </div>
          <div className="field">
            <label>{t("labelType")}</label>
            <select style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }}>
              <option>{t("typeMaintenance")}</option>
              <option>{t("typeRelease")}</option>
              <option>{t("typeMeeting")}</option>
              <option>{t("typeAnnouncement")}</option>
            </select>
          </div>
          <div className="field">
            <label>{t("labelDate")}</label>
            <input type="date" style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }} />
          </div>
          <div className="field">
            <label>{t("labelDescription")}</label>
            <textarea rows={3} placeholder={t("eventDescriptionPlaceholder")} style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)", resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" onClick={() => setShowAddEvent(false)}>{t("saveEvent")}</button>
            <button className="btn btn-ghost" onClick={() => setShowAddEvent(false)}>{t("cancel")}</button>
          </div>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: "1fr 350px", gap: 20 }}>
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("monthTitle")}</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, textAlign: "center" }}>
            {weekDays.map((day) => (
              <div key={day} style={{ fontWeight: 600, fontSize: 12, padding: 8 }}>{day}</div>
            ))}
            {days.map((d, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedDate(d.dateStr)}
                style={{
                  padding: 12,
                  borderRadius: "var(--radius-sm)",
                  background: selectedDate === d.dateStr ? "var(--rose-500)" : d.isCurrentMonth ? "var(--card-solid)" : "transparent",
                  color: selectedDate === d.dateStr ? "white" : d.isCurrentMonth ? "var(--ink-900)" : "var(--ink-500)",
                  cursor: "pointer",
                  opacity: d.isCurrentMonth ? 1 : 0.3,
                }}
              >
                {d.day}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("eventsFor", { date: selectedDate })}</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mockEvents
              .filter(e => e.date === selectedDate)
              .map((event) => (
                <div key={event.id} style={{ padding: 12, borderRadius: "var(--radius-sm)", background: "var(--card-solid)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{event.title}</span>
                    {getTypeBadge(event.type)}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{event.description}</div>
                </div>
              ))}
            {mockEvents.filter(e => e.date === selectedDate).length === 0 && (
              <div style={{ textAlign: "center", color: "var(--ink-500)", padding: 20 }}>{t("noEvents")}</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
