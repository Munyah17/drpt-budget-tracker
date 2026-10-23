"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminIntegrationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/admin/integrations/banks");
  }, [router]);

  return null;
}
