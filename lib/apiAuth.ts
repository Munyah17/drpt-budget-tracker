"use client";

import { supabase } from "./supabase";

/**
 * Authorization headers for authenticated API routes: the caller's Supabase
 * Bearer JWT. Merge any extra headers (e.g. Content-Type) on top.
 */
export async function authHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    ...(extra ?? {}),
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}
