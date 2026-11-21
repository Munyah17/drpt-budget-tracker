/**
 * Server-only payment helpers — used by API route handlers.
 * Never import this from client components.
 */
import { nextPaidUntil } from "@/lib/paid";
import { sbGet, sbPatch } from "./supabaseAdmin";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";

/**
 * Mark a profile as paid via the Supabase REST API (service role bypasses RLS).
 * Sets paid_until — extends an active subscription, or starts a fresh month
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

/**
 * Resolve the profile id for a paid Stripe Checkout Session.
 * Order: client_reference_id → session metadata.user_id → payer-email lookup.
 * The email fallback covers pay-first signup, where no account existed at
 * checkout time so no reference id was set; the account created after payment
 * carries the same email. The caller-supplied uid is never trusted — identity
 * always comes from the Stripe session itself.
 */
export async function stripeSessionUserId(session: Record<string, unknown>): Promise<string> {
  const ref = (session.client_reference_id as string) ?? "";
  if (ref) return ref;
  const meta = (session.metadata as Record<string, string> | undefined) ?? {};
  if (meta.user_id) return meta.user_id;
  const customer = session.customer_details as Record<string, string> | undefined;
  const email = String(customer?.email ?? session.customer_email ?? "").trim().toLowerCase();
  if (!email) return "";
  const rows = await sbGet<{ id: string }>(
    "profiles",
    `email=eq.${encodeURIComponent(email)}&select=id&limit=1`
  );
  return rows[0]?.id ?? "";
}

export interface PaymentRecord {
  userId?: string;
  userEmail?: string;
  provider: string; // stripe | paynow | ecocash | bank | admin
  method?: string;
  amount?: number | null;
  currency?: string;
  reference?: string;
  status?: string;
  meta?: Record<string, unknown>;
}

/**
 * Append a payment to the `payments` ledger (see scripts/payments.sql).
 * Dedupes on provider+reference so a payment confirmed by both the webhook
 * and the client-side verify call is only stored once.
 * Never throws — a missing table/migration must not break checkout.
 */
export async function recordPayment(p: PaymentRecord): Promise<boolean> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return false;

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  try {
    if (p.reference) {
      const dup = await fetch(
        `${SUPABASE_URL}/rest/v1/payments?provider=eq.${encodeURIComponent(p.provider)}&reference=eq.${encodeURIComponent(p.reference)}&select=id&limit=1`,
        { headers, cache: "no-store" }
      );
      const existing = dup.ok ? await dup.json() : [];
      if (Array.isArray(existing) && existing.length > 0) return true;
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/payments`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({
        user_id: p.userId || null,
        user_email: p.userEmail || null,
        provider: p.provider,
        method: p.method || null,
        amount: p.amount ?? null,
        currency: p.currency || "usd",
        reference: p.reference || null,
        status: p.status || "paid",
        meta: p.meta ?? {},
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Apply a confirmed payment exactly once: extends paid_until, then writes the
 * ledger row. If a PAID ledger row already exists for provider+reference the
 * call is a no-op ("duplicate") — this stops verify-payment/webhook replays
 * from rolling paid_until forward forever. If a PENDING row exists for the
 * same reference (e.g. a direct-transfer or paynow initiation), it is flipped
 * to paid instead of inserting a duplicate.
 */
export async function applyPayment(p: PaymentRecord): Promise<"paid" | "duplicate" | "failed"> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || !p.userId) return "failed";

  if (p.reference) {
    const paid = await sbGet<{ id: number }>(
      "payments",
      `provider=eq.${encodeURIComponent(p.provider)}&reference=eq.${encodeURIComponent(p.reference)}&status=eq.paid&select=id&limit=1`
    );
    if (paid.length > 0) return "duplicate";
  }

  const marked = await markProfilePaid(p.userId);

  // Ledger: flip an existing pending row for this reference, else insert.
  let ledgerOk = false;
  if (p.reference) {
    const existing = await sbGet<{ id: number }>(
      "payments",
      `provider=eq.${encodeURIComponent(p.provider)}&reference=eq.${encodeURIComponent(p.reference)}&select=id&limit=1`
    );
    if (existing.length > 0) {
      ledgerOk = await sbPatch("payments", `id=eq.${existing[0].id}`, {
        user_id: p.userId,
        user_email: p.userEmail || null,
        method: p.method || null,
        amount: p.amount ?? null,
        currency: p.currency || "usd",
        status: "paid",
        paid_at: new Date().toISOString(),
        meta: p.meta ?? {},
      });
    }
  }
  if (!ledgerOk) ledgerOk = await recordPayment({ ...p, status: "paid" });

  return marked || ledgerOk ? "paid" : "failed";
}
