"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminFinancePage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/admin/finance/invoices");
  }, [router]);

  return null;
}
