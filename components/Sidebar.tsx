"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { NAV_ITEMS, ADMIN_NAV_ITEMS, CORPORATE_NAV_ITEMS, EMPLOYEE_NAV_ITEMS } from "@/lib/data";
import { useAppData } from "@/lib/AppDataContext";
import { useFreeTier, FREE_TIER_ROUTES } from "@/lib/native";
import { textDirection } from "@/lib/i18n/config";
import Icon from "./Icon";

const FREE_IDS = new Set(FREE_TIER_ROUTES.map((r) => r.slice(1)));

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen, logout, user } = useAppData();
  const freeTier = useFreeTier();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const rtl = textDirection(useLocale()) === "rtl";
  const navNs =
    user?.role === "admin"
      ? "admin"
      : user?.role === "corporate"
        ? "corporate"
        : user?.role === "employee"
          ? "employee"
          : "user";
  const tNav = useTranslations(`Nav.${navNs}`);
  const tShell = useTranslations("Shell");
  const labelFor = (id: string, fallback: string) => (tNav.has(id) ? tNav(id) : fallback);

  const navItems =
    user?.role === "admin"
      ? ADMIN_NAV_ITEMS
      : user?.role === "corporate"
        ? CORPORATE_NAV_ITEMS
        : user?.role === "employee"
          ? EMPLOYEE_NAV_ITEMS
          : NAV_ITEMS;

  const rolePrefix =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "corporate"
        ? "/corporate"
        : "";

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hasSubItems = (
    item: object
  ): item is { subItems: { id: string; label: string }[] } => {
    return "subItems" in item && Array.isArray(item.subItems);
  };

  return (
    <aside className={"sidebar" + (sidebarOpen ? " open" : "")} id="sidebar">
      <div className="sidebar-logo">
        WellSpend <span style={{ color: "var(--rose-500)" }}>❤</span>
        <button
          className="sidebar-close"
          aria-label={tShell("closeMenu")}
          onClick={() => setSidebarOpen(false)}
        >
          <Icon name="x" size={18} />
        </button>
      </div>
      <nav className="nav-group">
        {navItems.map((n) => {
          const href = (n as { href?: string }).href ?? `${rolePrefix}/${n.id}`;
          const active = pathname === href;
          const isExpanded = expandedItems.has(n.id);
          const hasSub = hasSubItems(n);

          return (
            <div key={n.id}>
              <button
                className={"nav-item" + (active ? " active" : "")}
                onClick={() => {
                  if (hasSub) {
                    toggleExpanded(n.id);
                  } else {
                    router.push(href);
                    setSidebarOpen(false);
                  }
                }}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Icon name={n.icon} />
                  {labelFor(n.id, n.label)}
                </div>
                {freeTier && !hasSub && !FREE_IDS.has(n.id) && (
                  <Icon name="lock" size={13} style={{ opacity: 0.45 }} />
                )}
                {hasSub && (
                  <Icon 
                    name={isExpanded ? "chevron-down" : rtl ? "chevron-left" : "chevron-right"} 
                    size={14}
                    style={{ transition: "transform 0.2s", transform: isExpanded || rtl ? "rotate(0deg)" : "rotate(-90deg)" }}
                  />
                )}
              </button>
              {hasSub && isExpanded && (
                <div style={{ marginInlineStart: 16, marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                  {n.subItems.map((sub) => {
                    const subHref = `${rolePrefix}/${n.id}/${sub.id}`;
                    const subActive = pathname === subHref;
                    return (
                      <Link
                        key={sub.id}
                        href={subHref}
                        className="nav-item"
                        style={{ 
                          fontSize: 13, 
                          paddingInlineStart: 26,
                          background: subActive ? "var(--pink-100)" : "transparent",
                          color: subActive ? "var(--rose-600)" : "var(--ink-500)"
                        }}
                        onClick={() => setSidebarOpen(false)}
                      >
                        {labelFor(`${n.id}_${sub.id}`, sub.label)}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <button
          className="nav-item"
          onClick={() => {
            logout();
            router.push("/");
          }}
        >
          <Icon name="log-out" />
          {tShell("logOut")}
        </button>
      </div>
    </aside>
  );
}
