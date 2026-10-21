"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Fab from "@/components/Fab";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout } = useAppData();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const isUnpaid = user?.role === "user" && !user?.isPaid;

  return (
    <div id="main-app" style={isUnpaid ? { pointerEvents: "none" } : undefined}>
      <Sidebar />
      <div className="main-col">
        <Topbar />
        <div className="page-container">
          <div className="page active fade-up" key={pathname}>
            {children}
          </div>
        </div>
      </div>
      {!isUnpaid && <Fab />}
      {isUnpaid && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            pointerEvents: "auto",
          }}
        >
          <div
            className="glass-card card-pad"
            style={{ maxWidth: 400, textAlign: "center", background: "var(--card-solid)" }}
          >
            <h3 style={{ marginBottom: 12 }}>Upgrade to Full Access</h3>
            <p style={{ marginBottom: 20, color: "var(--ink-500)" }}>
              Pay $1 once to unlock all features and start tracking your finances.
            </p>
            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={() => router.push("/payment")}
            >
              Pay $1 to Unlock
            </button>
            <button
              className="btn btn-ghost"
              style={{ width: "100%", marginTop: 10 }}
              onClick={() => {
                logout();
                router.push("/");
              }}
            >
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
