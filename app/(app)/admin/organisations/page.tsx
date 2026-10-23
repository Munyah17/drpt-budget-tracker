"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminOrganisationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/admin/organisations/corporates");
  }, [router]);

  return null;
}
