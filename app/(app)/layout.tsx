"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";
import { trackEvent } from "@/lib/analytics";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Fab from "@/components/Fab";
import TabBar from "@/components/TabBar";
import WelcomeTour from "@/components/WelcomeTour";
import LockedScreen from "@/components/LockedScreen";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import { useIsNative, FREE_TIER_ROUTES } from "@/lib/native";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authReady, user, sidebarOpen, setSidebarOpen } = useAppData();
  const router = useRouter();
  const pathname = usePathname();
  const native = useIsNative();

  // Guests are sent to the marketing page. Signed-in users always reach
  // their portal — payment is never forced on sign-in/sign-up navigation.
  // Native (iPhone app): unpaid users get a free tier — dashboard, profile
  // and settings work; every other route renders a LockedScreen.
  // Demo/admin/corporate/employee accounts carry isPaid or a non-user role.
  const isUnpaid = !user || (user.role === "user" && !user.isPaid);
  const freeTier = native && isUnpaid;
  const freeRoute = FREE_TIER_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      // Guests land on the marketing page — they sign up & pay or leave.
      router.replace("/");
    }
  }, [authReady, isAuthenticated, isUnpaid, native, pathname, router]);

  // Product analytics: one event per in-app page view
  const uid = user?.id;
  useEffect(() => {
    if (authReady && isAuthenticated && !isUnpaid) {
      trackEvent("page_view", { path: pathname });
    }
  }, [authReady, isAuthenticated, isUnpaid, pathname, uid]);

  if (!authReady || !isAuthenticated) return null;

  return (
    <div id="main-app" className={user?.role === "user" ? "has-tabbar" : undefined}>
      <Sidebar />
      <div
        className={"sidebar-backdrop" + (sidebarOpen ? " show" : "")}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <div className="main-col">
        <ImpersonationBanner />
        <Topbar />
        <div className="page-container">
          <div className="page active fade-up" key={pathname}>
            {freeTier && !freeRoute ? <LockedScreen /> : children}
          </div>
        </div>
      </div>
      <Fab />
      {user?.role === "user" && <TabBar />}
      <WelcomeTour />
    </div>
  );
}
