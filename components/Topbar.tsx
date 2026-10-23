"use client";

import { useState, useEffect, useRef } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { initials } from "@/lib/format";
import Icon from "./Icon";

export default function Topbar() {
  const { sidebarOpen, setSidebarOpen, theme, toggleTheme, toast, user } = useAppData();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleProfile = () => {
    toast("Opening profile...", "user");
    setDropdownOpen(false);
  };

  const handleNotifications = () => {
    toast("Opening notifications...", "bell");
    setDropdownOpen(false);
  };

  const handleSettings = () => {
    toast("Opening settings...", "settings");
    setDropdownOpen(false);
  };

  const handleLogout = () => {
    toast("Logging out...", "log-out");
    setDropdownOpen(false);
  };

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
          <h1>Good morning, {user?.name || "User"} 👋</h1>
          <p>Here&apos;s your financial overview</p>
        </div>
      </div>
      <div className="topbar-actions">
        <div className="search-box">
          <Icon name="search" />
          <input placeholder="Search transactions, bills…" />
        </div>
        <button className="icon-btn" data-tip="Notifications">
          <Icon name="bell" />
          <span className="dot" />
        </button>
        <button className="icon-btn" data-tip="Toggle theme" onClick={toggleTheme}>
          <Icon name={theme === "dark" ? "sun" : "moon"} />
        </button>
        <div className="avatar-dropdown" style={{ position: "relative" }} ref={dropdownRef}>
          <div 
            className="avatar" 
            title={user?.email}
            style={{ cursor: "pointer" }}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {initials(user?.name || "User")}
          </div>
          {dropdownOpen && (
            <div className="dropdown-menu" style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: 8,
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              borderRadius: "var(--radius-sm)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              minWidth: 180,
              zIndex: 1000
            }}>
              <button 
                className="dropdown-item" 
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  color: "var(--ink-800)",
                  transition: "background 0.2s"
                }}
                onClick={handleProfile}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
              >
                <Icon name="user" size={16} />
                Profile
              </button>
              <button 
                className="dropdown-item" 
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  color: "var(--ink-800)",
                  transition: "background 0.2s"
                }}
                onClick={handleNotifications}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
              >
                <Icon name="bell" size={16} />
                Notifications
              </button>
              <button 
                className="dropdown-item" 
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  color: "var(--ink-800)",
                  transition: "background 0.2s"
                }}
                onClick={handleSettings}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
              >
                <Icon name="settings" size={16} />
                Settings
              </button>
              <div style={{ height: 1, background: "var(--card-border)", margin: "4px 0" }} />
              <button 
                className="dropdown-item" 
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  color: "var(--red-500)",
                  transition: "background 0.2s"
                }}
                onClick={handleLogout}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
              >
                <Icon name="log-out" size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
