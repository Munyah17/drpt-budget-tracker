"use client";

import { useEffect, useState, MouseEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Fab from "@/components/Fab";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout } = useAppData();
  const router = useRouter();
  const pathname = usePathname();
  const [showSubscribe, setShowSubscribe] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const isUnpaid = user?.role === "user" && !user?.isPaid;

  // Free users may browse every page, but any action click (buttons/inputs
  // inside page content) triggers the subscribe-first prompt instead.
  const gateClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!isUnpaid) return;
    const el = e.target as HTMLElement;
    if (el.closest("button, input, select, textarea, a:not(.nav-item)")) {
      e.preventDefault();
      e.stopPropagation();
      setShowSubscribe(true);
    }
  };

  return (
    <div id="main-app">
      <Sidebar />
      <div className="main-col">
        <Topbar />
        <div className="page-container">
          <div className="page active fade-up" key={pathname} onClickCapture={gateClick}>
            {children}
          </div>
        </div>
      </div>
      {!isUnpaid && <Fab />}
      {isUnpaid && (
        <div
          style={{
            position: "sticky",
            bottom: 0,
            padding: "10px 18px",
            background: "var(--pink-100)",
            borderTop: "1px solid var(--card-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            fontSize: 13,
          }}
        >
          <span style={{ color: "var(--ink-700)" }}>
            You&apos;re browsing in free mode — subscribe to unlock all features.
          </span>
          <button
            className="btn btn-primary"
            style={{ padding: "6px 14px", fontSize: 13 }}
            onClick={() => router.push("/payment")}
          >
            Subscribe — $1 once
          </button>
        </div>
      )}
      {showSubscribe && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowSubscribe(false)}
        >
          <div
            className="glass-card card-pad"
            style={{ maxWidth: 400, textAlign: "center", background: "var(--card-solid)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 12 }}>Subscribe first</h3>
            <p style={{ marginBottom: 20, color: "var(--ink-500)" }}>
              This feature is for subscribers. Pay $1 once to unlock everything.
            </p>
            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={() => {
                setShowSubscribe(false);
                router.push("/payment");
              }}
            >
              Subscribe — $1 once
            </button>
            <button
              className="btn btn-ghost"
              style={{ width: "100%", marginTop: 10 }}
              onClick={() => setShowSubscribe(false)}
            >
              Keep Browsing
            </button>
            <button
              className="btn btn-ghost"
              style={{ width: "100%", marginTop: 4, fontSize: 12 }}
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
