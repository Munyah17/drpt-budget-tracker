"use client";

import { supabase } from "./supabase";

/**
 * Fetch helper for service-role API routes: attaches the Supabase access
 * token as Bearer and appends ?uid=. Mirrors the pattern used by /api/sync.
 */
export async function authedFetch(
  uid: string,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const sep = path.includes("?") ? "&" : "?";
  return fetch(`${path}${sep}uid=${encodeURIComponent(uid)}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${session?.access_token ?? ""}`,
      ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(init.headers ?? {}),
    },
  });
}
