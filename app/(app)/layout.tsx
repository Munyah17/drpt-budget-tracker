"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Fab from "@/components/Fab";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppData();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div id="main-app">
      <Sidebar />
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
