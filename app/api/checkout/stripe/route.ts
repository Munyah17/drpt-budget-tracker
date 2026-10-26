import { NextRequest, NextResponse } from "next/server";

/**
 * Creates a Stripe Checkout Session for the $1 lifetime unlock and returns
 * the hosted checkout URL. No stripe SDK needed — plain REST.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  const { userId, email } = await req.json().catch(() => ({}));
  const origin = req.nextUrl.origin;

  const body = new URLSearchParams({
    mode: "payment",
    success_url: `${origin}/payment/success?provider=stripe&session_id={CHECKOUT_SESSION_ID}&uid=${encodeURIComponent(userId ?? "")}`,
    cancel_url: `${origin}/payment?cancelled=1`,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "100",
    "line_items[0][price_data][product_data][name]": "Dr PT — Lifetime Access",
    client_reference_id: userId ?? "",
    payment_method_types: "card",
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
