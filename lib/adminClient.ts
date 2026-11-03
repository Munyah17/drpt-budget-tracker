"use client";

import { supabase } from "./supabase";

/**
 * Headers for /api/admin/* calls: the hardcoded admin proves itself via
 * x-admin-email; real Supabase admins via their Bearer JWT (verified
 * server-side against the profiles.role column).
 */
export async function adminHeaders(email: string | undefined | null): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    "x-admin-email": email ?? "",
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}
