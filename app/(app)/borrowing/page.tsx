"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";

/**
 * WellSpend is not a lending institution — there are no consumer loans.
 * Salary advances (Earned Wage Access) exist only for corporate employees,
 * so this route forwards employees to Early Pay and everyone else home.
 */
export default function BorrowingPage() {
  const router = useRouter();
  const { user, authReady } = useAppData();

  useEffect(() => {
    if (!authReady) return;
    router.replace(user?.role === "employee" ? "/employee/borrowing" : "/dashboard");
  }, [authReady, user?.role, router]);

  return null;
}
