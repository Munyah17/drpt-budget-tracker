"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "./Icon";
import QuickAddModal from "./QuickAddModal";

const TABS = [
  { id: "dashboard", icon: "layout-dashboard" },
  { id: "transactions", icon: "list" },
  { id: "budget", icon: "pie-chart" },
] as const;

/** Phone-only bottom bar for everyday use: Home, Transactions, a centred Add, Budget, and the full menu. */
export default function TabBar() {
  const pathname = usePathname();
  const tNav = useTranslations("Nav.user");
  const tShell = useTranslations("Shell");
  const tFab = useTranslations("Pages.components");
  const { setSidebarOpen } = useAppData();
  const [adding, setAdding] = useState(false);

  const tab = (t: (typeof TABS)[number]) => {
    const active = pathname === `/${t.id}` || pathname.startsWith(`/${t.id}/`);
    return (
      <Link key={t.id} href={`/${t.id}`} className={"tab-item" + (active ? " active" : "")} aria-current={active ? "page" : undefined}>
        <Icon name={t.icon} size={22} />
        <span>{tNav.has(t.id) ? tNav(t.id) : t.id}</span>
      </Link>
    );
  };

  return (
    <>
      <nav className="tabbar" aria-label="Main">
        {tab(TABS[0])}
        {tab(TABS[1])}
        <button className="tab-add" aria-label={tFab("fab_aria")} onClick={() => setAdding(true)}>
          <Icon name="plus" size={26} />
        </button>
        {tab(TABS[2])}
        <button className="tab-item" aria-label={tShell("openMenu")} onClick={() => setSidebarOpen(true)}>
          <Icon name="menu" size={22} />
          <span aria-hidden="true">•••</span>
        </button>
      </nav>
      {adding && <QuickAddModal onClose={() => setAdding(false)} />}
    </>
  );
}
