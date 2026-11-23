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
  // 60/hr per IP — carrier-grade NAT puts many mobile users behind one IP,
  // and checkout retries are legitimate. Still curbs session-scraping abuse.
  if (rateLimited(`stripe-checkout:${clientIp(req)}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests — try again later" }, { status: 429 });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  const { userId, email, country } = await req.json().catch(() => ({}));
  // Reject malformed emails before Stripe sees them — a bad customer_email
  // comes back as an opaque 502 and looks like a payment failure.
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
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
    "subscription_data[metadata][user_id]": userId ?? "",
    "subscription_data[metadata][email]": email ?? "",
    "subscription_data[metadata][country]": region,
    "payment_method_types[0]": "card",
  });
  // Only include client_reference_id when userId is non-empty — Stripe rejects empty strings
  if (userId) {
    body.set("client_reference_id", userId);
  }
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
    // Log the full error server-side; return Stripe's error code (safe —
    // e.g. "parameter_invalid_empty") so failure emails show the real cause.
    const stripeErr = data?.error as { message?: string; code?: string; type?: string } | undefined;
    console.error("Stripe checkout error:", stripeErr?.message ?? "Unknown error", stripeErr?.code ?? "");
    return NextResponse.json(
      {
        error: "Payment could not be initiated. Please try again or contact support.",
        code: stripeErr?.code ?? stripeErr?.type ?? "stripe_error",
      },
      { status: 502 }
    );
  }
  return NextResponse.json({ url: data.url });
}
