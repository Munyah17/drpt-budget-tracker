"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ITEMS, ADMIN_NAV_ITEMS } from "@/lib/data";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "./Icon";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen, logout, user } = useAppData();
  const navItems = user?.role === "admin" ? ADMIN_NAV_ITEMS : NAV_ITEMS;

  return (
    <aside className={"sidebar" + (sidebarOpen ? " open" : "")} id="sidebar">
      <div className="sidebar-logo">
        Dr PT <span style={{ color: "var(--rose-500)" }}>❤</span>
      </div>
      <nav className="nav-group">
        {navItems.map((n) => {
          const href = user?.role === "admin" ? `/admin/${n.id}` : `/${n.id}`;
          const active = pathname === href;
          return (
            <Link
              key={n.id}
              href={href}
              className={"nav-item" + (active ? " active" : "")}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon name={n.icon} />
              {n.label}
            </Link>
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
          Log out
        </button>
      </div>
    </aside>
  );
}
