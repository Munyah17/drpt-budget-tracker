"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";
import { trackEvent } from "@/lib/analytics";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Fab from "@/components/Fab";
import TabBar from "@/components/TabBar";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authReady, user, sidebarOpen, setSidebarOpen } = useAppData();
  const router = useRouter();
  const pathname = usePathname();

  // Every registration must pay — unpaid standard users never reach app content.
  // Demo/admin/corporate/employee accounts carry isPaid or a non-user role, so
  // they pass through. /payment itself lives outside this layout, so no loop.
  // Fail closed: authenticated with no profile loaded counts as unpaid.
  const isUnpaid = !user || (user.role === "user" && !user.isPaid);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      // Guests land on the marketing page — they sign up & pay or leave.
      router.replace("/");
    } else if (isUnpaid) {
      router.replace("/payment");
    }
  }, [authReady, isAuthenticated, isUnpaid, pathname, router]);

  // Product analytics: one event per in-app page view
  const uid = user?.id;
  useEffect(() => {
    if (authReady && isAuthenticated && !isUnpaid) {
      trackEvent("page_view", { path: pathname });
    }
  }, [authReady, isAuthenticated, isUnpaid, pathname, uid]);

  if (!authReady || !isAuthenticated || isUnpaid) return null;

  return (
    <div id="main-app" className={user?.role === "user" ? "has-tabbar" : undefined}>
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
      {user?.role === "user" && <TabBar />}
    </div>
  );
}
