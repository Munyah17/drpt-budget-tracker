/**
 * Server-only payment helpers — used by API route handlers.
 * Never import this from client components.
 */
import { nextPaidUntil } from "@/lib/paid";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";

/**
 * Mark a profile as paid via the Supabase REST API (service role bypasses RLS).
 * Sets paid_until — extends an active subscription, or starts a fresh year
 * for new/expired buyers.
 */
export async function markProfilePaid(userId: string): Promise<boolean> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || !userId) return false;

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  try {
    const cur = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=paid_until`,
      { headers, cache: "no-store" }
    );
    const rows = cur.ok ? await cur.json() : [];
    const paidUntil = nextPaidUntil(
      Array.isArray(rows) ? rows[0]?.paid_until ?? null : null
    );

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify({ is_paid: true, paid_until: paidUntil }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}
