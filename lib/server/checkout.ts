/**
 * Server-only Stripe hosted checkout for the per-bank $1 unlock.
 * Never import this from client components.
 */
import { bankingPriceCents } from "@/lib/pricing";

/** Stripe Checkout session for a $1-net per-bank unlock (hosted, REST only). */
export async function bankingUnlockCheckout(opts: {
  origin: string; uid: string; institutionId: string; institutionName: string; country?: string;
}): Promise<string | null> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return null;
  const body = new URLSearchParams({
    mode: "payment",
    success_url: `${opts.origin}/banking?unlocked=1`,
    cancel_url: `${opts.origin}/banking`,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(
      bankingPriceCents("stripe", opts.country ?? "gb")
    ),
    "line_items[0][price_data][product_data][name]":
      `WellSpend — Bank Connection (${opts.institutionName || "your bank"})`,
    client_reference_id: opts.uid,
    "metadata[purpose]": "banking_unlock",
    "metadata[user_id]": opts.uid,
    "metadata[institution_id]": opts.institutionId,
    "payment_method_types[0]": "card",
  });
  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      signal: AbortSignal.timeout(20_000),
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const data = await res.json();
    return res.ok ? (data.url as string) : null;
  } catch {
    return null;
  }
}
