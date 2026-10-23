"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminOperationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/admin/operations/payroll");
  }, [router]);

  return null;
}
