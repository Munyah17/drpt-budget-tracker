/**
 * Server-only feature gating for premium endpoints (import, banking).
 * Never import this from client components.
 */
import { NextResponse } from "next/server";
import { sbGet } from "./supabaseAdmin";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";

export type AccessCheck = { ok: true } | { error: string; status: number };

/**
 * Paid users get cloud features; so do corporate-issued roles (employee,
 * corporate, admin) — the employer pays on their behalf. Mirrors the
 * `isUnpaid` rule in app/(app)/layout.tsx: only role "user" can be unpaid.
 */
export async function requireFeatureAccess(uid: string): Promise<AccessCheck> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return { error: "Not configured", status: 500 };

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(uid)}&select=is_paid,role`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );
  if (!res.ok) return { error: "Lookup failed", status: 500 };
  const rows = await res.json();
  const profile = Array.isArray(rows) ? rows[0] : null;
  if (!profile) return { error: "Unauthorized", status: 401 };
  // Allowlist only: paid accounts or roles provisioned by an organisation.
  // (role !== "user" would wrongly admit null/unexpected role values.)
  if (profile.is_paid === true || ["employee", "corporate", "admin"].includes(profile.role)) {
    return { ok: true };
  }
  return { error: "Payment required", status: 402 };
}

/**
 * Banking routes: full access for paid/corporate roles, OR for free-tier
 * users who bought at least one per-bank unlock. Returns {ok} or an error to
 * forward — use for feed/sync/resolve/disconnect (connect gates per-bank).
 */
export async function requireBankingAccess(uid: string): Promise<AccessCheck> {
  const feat = await requireFeatureAccess(uid);
  if ("ok" in feat || feat.status !== 402) return feat;
  const unlocks = await sbGet<{ id: number }>(
    "banking_unlocks",
    `user_key=eq.${encodeURIComponent(uid)}&select=id&limit=1`
  );
  return unlocks.length ? { ok: true } : feat;
}

export function accessError(check: AccessCheck) {
  return NextResponse.json(
    { error: "error" in check ? check.error : "Forbidden" },
    { status: "status" in check ? check.status : 403 }
  );
}
