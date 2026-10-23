"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPeoplePage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/admin/people/individuals");
  }, [router]);

  return null;
}
