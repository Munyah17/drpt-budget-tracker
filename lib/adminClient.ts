"use client";

import { supabase } from "./supabase";
import { touchSession } from "./session";

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

export interface CreateAccountInput {
  email: string;
  password: string;
  name?: string;
  /** Portal the account lands in after login */
  role: "user" | "corporate" | "employee" | "admin";
  isPaid?: boolean;
  corporateId?: string;
  organisation?: string;
}

export interface CreatedAccount {
  id: string;
}

/**
 * Provision a real login account for a user created in the admin panel.
 * Returns the new auth user id; throws with the server's error message so the
 * caller can surface it and abort the save.
 */
export async function createAdminAccount(
  adminEmail: string | undefined | null,
  input: CreateAccountInput
): Promise<CreatedAccount> {
  const res = await fetch("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await adminHeaders(adminEmail)) },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.id) {
    throw new Error(data?.error || "Account creation failed");
  }
  return { id: data.id };
}

/* ── "View as client" engineer preview ────────────────────────────────────── */

const STASH_KEY = "drpt-impersonate-backup";
const ACTIVE_KEY = "drpt-impersonating";
const USER_KEY = "drpatie-user";
const REMEMBER_KEY = "drpatie-remember";

interface SessionStash {
  access: string | null;
  refresh: string | null;
  remember: string | null;
  userLocal: string | null;
  userSession: string | null;
}

export interface ImpersonationInfo {
  email: string;
  name: string;
  role: string;
  adminEmail: string;
}

/** Landing route per role — mirrors the post-login redirect map. */
export function roleHome(role: string): string {
  return role === "corporate"
    ? "/corporate/overview"
    : role === "employee"
      ? "/employee"
      : role === "admin"
        ? "/admin"
        : "/dashboard";
}

/** The account currently being previewed, or null when not impersonating. */
export function activeImpersonation(): ImpersonationInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ACTIVE_KEY);
    return raw ? (JSON.parse(raw) as ImpersonationInfo) : null;
  } catch {
    return null;
  }
}

/**
 * Enter the target account's session as an engineer preview.
 * Stashes the admin's tokens/profile, swaps to the target via verifyOtp,
 * then performs a full navigation so AppDataContext hydrates fresh.
 * Throws with a toastable message on failure.
 */
export async function impersonateUser(
  targetEmail: string,
  adminEmail: string | undefined | null
): Promise<ImpersonationInfo> {
  const { data: { session } } = await supabase.auth.getSession();
  const stash: SessionStash = {
    access: session?.access_token ?? null,
    refresh: session?.refresh_token ?? null,
    remember: localStorage.getItem(REMEMBER_KEY),
    userLocal: localStorage.getItem(USER_KEY),
    userSession: sessionStorage.getItem(USER_KEY),
  };
  sessionStorage.setItem(STASH_KEY, JSON.stringify(stash));

  try {
    const res = await fetch("/api/admin/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await adminHeaders(adminEmail)) },
      body: JSON.stringify({ email: targetEmail }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.token_hash) {
      throw new Error(data?.error || "Could not start the preview");
    }

    // "Remember" → the new session lands in localStorage and rehydrates on the
    // full navigation that follows (checkSession only runs when remembered).
    localStorage.setItem(REMEMBER_KEY, "1");
    const { error } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: data.token_hash,
    });
    if (error) throw new Error(error.message);

    // Drop the admin's stored profile so the reload hydrates the target's.
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);

    const info: ImpersonationInfo = {
      email: data.email,
      name: data.name || data.email,
      role: data.role || "user",
      adminEmail: adminEmail ?? "",
    };
    sessionStorage.setItem(ACTIVE_KEY, JSON.stringify(info));
    return info;
  } catch (err) {
    // Roll back — restore whatever we stashed and drop the half-entered state.
    await exitImpersonation();
    throw err;
  }
}

/**
 * Leave the preview: restore the stashed admin session tokens + stored
 * profile, then navigate back to /admin (caller does location.href).
 */
export async function exitImpersonation(): Promise<void> {
  let stash: SessionStash | null = null;
  try {
    const raw = sessionStorage.getItem(STASH_KEY);
    stash = raw ? (JSON.parse(raw) as SessionStash) : null;
  } catch {
    stash = null;
  }

  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(USER_KEY);
  if (stash?.remember === "1") localStorage.setItem(REMEMBER_KEY, "1");
  else if (stash?.remember === "0") localStorage.setItem(REMEMBER_KEY, "0");
  else localStorage.removeItem(REMEMBER_KEY);
  if (stash?.userLocal) localStorage.setItem(USER_KEY, stash.userLocal);
  if (stash?.userSession) sessionStorage.setItem(USER_KEY, stash.userSession);

  try {
    if (stash?.access && stash?.refresh) {
      await supabase.auth.setSession({
        access_token: stash.access,
        refresh_token: stash.refresh,
      });
    } else {
      // Hardcoded demo admin has no Supabase session — just end the target's.
      await supabase.auth.signOut();
    }
  } catch {
    await supabase.auth.signOut().catch(() => {});
  }

  sessionStorage.removeItem(STASH_KEY);
  sessionStorage.removeItem(ACTIVE_KEY);
  touchSession(); // keep the restored admin session inside the freshness window
}
