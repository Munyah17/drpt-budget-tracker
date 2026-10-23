"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminRiskSecurityPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/admin/risk-security/audit");
  }, [router]);

  return null;
}
