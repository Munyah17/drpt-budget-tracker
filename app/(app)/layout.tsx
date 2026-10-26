"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Fab from "@/components/Fab";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authReady, user, sidebarOpen, setSidebarOpen } = useAppData();
  const router = useRouter();
  const pathname = usePathname();

  // Every registration must pay — unpaid standard users never reach app content.
  // Demo/admin/corporate/employee accounts carry isPaid or a non-user role, so
  // they pass through. /payment itself lives outside this layout, so no loop.
  const isUnpaid = user?.role === "user" && !user?.isPaid;

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      router.replace("/login?next=" + encodeURIComponent(pathname));
    } else if (isUnpaid) {
      router.replace("/payment");
    }
  }, [authReady, isAuthenticated, isUnpaid, pathname, router]);

  if (!authReady || !isAuthenticated || isUnpaid) return null;

  return (
    <div id="main-app">
      <Sidebar />
      <div
        className={"sidebar-backdrop" + (sidebarOpen ? " show" : "")}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <div className="main-col">
        <Topbar />
        <div className="page-container">
          <div className="page active fade-up" key={pathname}>
            {children}
          </div>
        </div>
      </div>
      <Fab />
    </div>
  );
}
