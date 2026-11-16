"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, authReady, user } = useAppData();
  const isLogin = pathname === "/super-admin/login";

  useEffect(() => {
    if (isLogin || !authReady) return;
    if (!isAuthenticated) router.replace("/super-admin/login");
    else if (user?.role !== "super_admin") router.replace("/");
    else router.replace("/admin");
  }, [isLogin, authReady, isAuthenticated, user, router]);

  if (isLogin) return <>{children}</>;
  return null;
}
