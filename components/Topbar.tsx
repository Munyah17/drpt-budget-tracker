"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { initials } from "@/lib/format";
import LanguageSelect from "./LanguageSelect";
import Icon from "./Icon";

export default function Topbar() {
  const router = useRouter();
  const t = useTranslations("Shell");
  const { sidebarOpen, setSidebarOpen, theme, toggleTheme, toast, user, isDemo, logout } = useAppData();
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
    router.push("/profile");
    setDropdownOpen(false);
  };

  const handleSettings = () => {
    router.push("/settings");
    setDropdownOpen(false);
  };

  const handleLogout = () => {
    toast(isDemo ? t("exitingDemo") : t("loggingOut"), "log-out");
    setDropdownOpen(false);
    logout();
    router.push("/");
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="icon-btn hamburger"
          aria-label={t("openMenu")}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Icon name="menu" />
        </button>
        <div className="topbar-greeting">
          <h1>
            {t("greeting", { name: user?.name || t("guest") })}
            {isDemo && (
              <span className="chip" style={{ marginInlineStart: 10, verticalAlign: "middle", fontSize: 11 }}>
                {t("demoChip")}
              </span>
            )}
          </h1>
          <p>{t("overview")}</p>
        </div>
      </div>
      <div className="topbar-actions">
        <div className="search-box">
          <Icon name="search" />
          <input placeholder={t("search")} />
        </div>
        <LanguageSelect compact />
        <button className="icon-btn" data-tip={t("toggleTheme")} onClick={toggleTheme}>
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
              insetInlineEnd: 0,
              marginTop: 8,
              background: "var(--card-solid)",
              border: "1px solid var(--card-border)",
              borderRadius: "var(--radius-sm)",
              boxShadow: "var(--shadow-md)",
              minWidth: 180,
              padding: 6,
              zIndex: 1000
            }}>
              <button 
                className="dropdown-item" 
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  textAlign: "start",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  color: "var(--ink-900)",
                  transition: "background 0.2s"
                }}
                onClick={handleProfile}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--pink-100)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
              >
                <Icon name="user" size={16} />
                {t("profile")}
              </button>
              <button
                className="dropdown-item" 
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  textAlign: "start",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  color: "var(--ink-900)",
                  transition: "background 0.2s"
                }}
                onClick={handleSettings}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--pink-100)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
              >
                <Icon name="settings" size={16} />
                {t("settings")}
              </button>
              <div style={{ height: 1, background: "var(--card-border)", margin: "4px 0" }} />
              <button 
                className="dropdown-item" 
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  textAlign: "start",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  color: "var(--red)",
                  transition: "background 0.2s"
                }}
                onClick={handleLogout}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--pink-100)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
              >
                <Icon name="log-out" size={16} />
                {isDemo ? t("exitDemo") : t("logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
