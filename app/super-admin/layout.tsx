"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";

const NAV = [
  { id: "command", href: "/super-admin", icon: "layout-dashboard" },
  { id: "clientAccess", href: "/super-admin/client-access", icon: "user" },
] as const;

/**
 * Super-admin console shell. Guards every /super-admin/* route: only the
 * founder (role super_admin, not shifted into client nature) gets in.
 * The login page renders bare.
 */
export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, authReady, user, shifted, logout } = useAppData();
  const t = useTranslations("SuperAdmin");

  const isLogin = pathname === "/super-admin/login";
  const allowed = authReady && isAuthenticated && user?.role === "super_admin" && !shifted;

  useEffect(() => {
    if (isLogin || !authReady) return;
    if (!isAuthenticated) {
      router.replace("/super-admin/login");
    } else if (shifted || user?.role !== "super_admin") {
      // Wrong nature or wrong role — send them to their own home.
      router.replace(shifted ? "/dashboard" : "/");
    }
  }, [isLogin, authReady, isAuthenticated, user, shifted, router]);

  if (isLogin) return <>{children}</>;
  if (!authReady || !allowed) return null;

  return (
    <div id="main-app" style={{ background: "var(--bg, #fff7fa)" }}>
      <aside
        className="sidebar"
        style={{
          position: "fixed",
          insetInlineStart: 0,
          top: 0,
          bottom: 0,
          width: 260,
          zIndex: 40,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="sidebar-logo" style={{ padding: "20px 20px 12px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Icon name="shield" size={20} />
            {t("consoleTitle")}
          </span>
        </div>
        <nav className="nav-group" style={{ flex: 1, padding: "8px 12px" }}>
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.id}
                href={n.href}
                className={"nav-item" + (active ? " active" : "")}
                style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textDecoration: "none" }}
              >
                <Icon name={n.icon} />
                {t(`nav.${n.id}`)}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer" style={{ padding: 12 }}>
          <div style={{ fontSize: 12, color: "var(--ink-500)", padding: "8px 12px" }}>
            {user?.name}
          </div>
          <button
            className="nav-item"
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12 }}
            onClick={() => {
              logout();
              router.push("/super-admin/login");
            }}
          >
            <Icon name="log-out" />
            {t("signOut")}
          </button>
        </div>
      </aside>

      <div className="main-col" style={{ marginInlineStart: 260 }}>
        <div className="page-container">
          <div className="page active fade-up" key={pathname}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
