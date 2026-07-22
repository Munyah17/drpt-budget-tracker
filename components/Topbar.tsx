"use client";

import { useAppData } from "@/lib/AppDataContext";
import { USER } from "@/lib/data";
import { initials } from "@/lib/format";
import Icon from "./Icon";

const MONTH_OPTIONS = ["May 2025", "April 2025", "March 2025", "June 2025"];

export default function Topbar() {
  const { sidebarOpen, setSidebarOpen, theme, toggleTheme, month, setMonth, toast } = useAppData();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="icon-btn hamburger"
          aria-label="Open menu"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Icon name="menu" />
        </button>
        <div className="topbar-greeting">
          <h1>Good morning, Dr Patience 👋</h1>
          <p>Here&apos;s your financial overview</p>
        </div>
      </div>
      <div className="topbar-actions">
        <div className="search-box">
          <Icon name="search" />
          <input placeholder="Search transactions, bills…" />
        </div>
        <select
          className="month-select"
          value={month}
          onChange={(e) => {
            setMonth(e.target.value);
            toast("Showing data for " + e.target.value, "calendar");
          }}
        >
          {MONTH_OPTIONS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <button className="icon-btn" data-tip="Notifications">
          <Icon name="bell" />
          <span className="dot" />
        </button>
        <button className="icon-btn" data-tip="Toggle theme" onClick={toggleTheme}>
          <Icon name={theme === "dark" ? "sun" : "moon"} />
        </button>
        <div className="avatar">{initials(USER.name)}</div>
      </div>
    </header>
  );
}
