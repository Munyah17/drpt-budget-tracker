import { NextRequest, NextResponse } from "next/server";
import { priceCentsForCountry } from "@/lib/server/pricing";
import { sbGet } from "@/lib/server/supabaseAdmin";
import { rateLimited, clientIp } from "@/lib/server/rateLimit";

/** Checkout country: the picker's choice wins; profile country is the fallback. */
async function countryFor(userId: string, preferred: string): Promise<string> {
  if (preferred) return preferred;
  if (userId) {
    const rows = await sbGet<{ country: string | null }>(
      "profiles",
      `id=eq.${encodeURIComponent(userId)}&select=country&limit=1`
    );
    if (rows[0]?.country) return rows[0].country;
  }
  return "";
}

/**
 * Creates a Stripe Checkout Session for the monthly subscription and returns the
 * hosted checkout URL. Price comes from the regional/custom price resolver.
 * No stripe SDK needed — plain REST.
 */
export async function POST(req: NextRequest) {
  if (rateLimited(`stripe-checkout:${clientIp(req)}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests — try again later" }, { status: 429 });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  const { userId, email, country } = await req.json().catch(() => ({}));
  const origin = req.nextUrl.origin;
  const region = await countryFor(String(userId ?? ""), String(country ?? ""));
  const amountCents = await priceCentsForCountry("stripe", region);

  const body = new URLSearchParams({
    mode: "subscription",
    success_url: `${origin}/payment/success?provider=stripe&session_id={CHECKOUT_SESSION_ID}&uid=${encodeURIComponent(userId ?? "")}`,
    cancel_url: `${origin}/payment?cancelled=1`,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(amountCents),
    "line_items[0][price_data][recurring][interval]": "month",
    "line_items[0][price_data][product_data][name]": "WellSpend — Monthly Access",
    client_reference_id: userId ?? "",
    // Session-level metadata too — the webhook reads session.metadata on
    // checkout.session.completed; subscription_data only reaches invoices.
    "metadata[user_id]": userId ?? "",
    "metadata[email]": email ?? "",
    "metadata[country]": region,
    "subscription_data[metadata][user_id]": userId ?? "",
    "subscription_data[metadata][email]": email ?? "",
    "subscription_data[metadata][country]": region,
    "payment_method_types[0]": "card",
  });
  if (email) body.set("customer_email", email);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: data?.error?.message ?? "Stripe checkout failed" },
      { status: 502 }
    );
  }
  return NextResponse.json({ url: data.url });
}
