import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { markProfilePaid, recordPayment } from "@/lib/server/payments";
import { notifyAdmin } from "@/lib/server/notify";
import { sbUpsert } from "@/lib/server/supabaseAdmin";

/**
 * POST /api/webhooks/stripe — Stripe sends checkout.session.completed here.
 * We verify the Stripe-Signature HMAC ourselves (no SDK), then mark the
 * profile is_paid via the service-role helper.
 */

const TOLERANCE_SEC = 300; // reject events older than 5 min (replay protection)

function verifySignature(rawBody: string, header: string, secret: string): boolean {
  // header format: t=1700000000,v1=abc123...,v1=...
  const parts = new Map<string, string>();
  for (const kv of header.split(",")) {
    const i = kv.indexOf("=");
    if (i > 0) parts.set(kv.slice(0, i).trim(), kv.slice(i + 1).trim());
  }
  const t = parts.get("t");
  const v1 = parts.get("v1");
  if (!t || !v1) return false;

  const ts = parseInt(t, 10);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > TOLERANCE_SEC) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${t}.${rawBody}`)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const sigHeader = req.headers.get("stripe-signature") ?? "";
  if (!verifySignature(rawBody, sigHeader, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Checkout Session paid (card + async methods) or invoice paid — mark unlock
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data?.object ?? {};
    const meta = (session.metadata as Record<string, string> | undefined) ?? {};
    const uid =
      (session.client_reference_id as string) ?? meta.user_id ?? "";
    const paidStatus = session.payment_status as string | undefined;
    const paid = paidStatus === "paid" || event.type === "checkout.session.async_payment_succeeded";

    // Per-bank unlock (free-tier users) — records the entitlement WITHOUT
    // marking the whole profile paid.
    if (meta.purpose === "banking_unlock") {
      if (uid && meta.institution_id && paid) {
        await sbUpsert(
          "banking_unlocks",
          [{
            user_key: uid,
            institution_id: meta.institution_id,
            amount_cents: Number(session.amount_total) || 0,
            currency: String(session.currency ?? "usd"),
            provider: "stripe",
            session_id: String(session.id ?? ""),
          }],
          "user_key,institution_id"
        );
        const customer = session.customer_details as Record<string, string> | undefined;
        await notifyAdmin("payment_success", {
          email: customer?.email ?? (session.customer_email as string) ?? "",
          name: customer?.name ?? "",
          method: "stripe",
          detail: `banking unlock ${meta.institution_id} — session ${session.id ?? ""}`,
        });
      }
      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (uid && paid) {
      await markProfilePaid(uid);
      const customer = session.customer_details as Record<string, string> | undefined;
      await recordPayment({
        userId: uid,
        userEmail: customer?.email ?? (session.customer_email as string) ?? "",
        provider: "stripe",
        method: "card",
        amount: typeof session.amount_total === "number" ? session.amount_total / 100 : null,
        currency: (session.currency as string) ?? "usd",
        reference: String(session.id ?? ""),
      });
      await notifyAdmin("payment_success", {
        email: customer?.email ?? (session.customer_email as string) ?? "",
        name: customer?.name ?? "",
        method: "stripe",
        detail: `session ${session.id ?? ""}`,
      });
    }
  }

  if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data?.object ?? {};
    const customer = session.customer_details as Record<string, string> | undefined;
    await notifyAdmin("payment_failed", {
      email: customer?.email ?? (session.customer_email as string) ?? "",
      name: customer?.name ?? "",
      method: "stripe",
      detail: `async payment failed — session ${session.id ?? ""}`,
    });
  }

  // Stripe expects a 2xx quickly — heavy work is already done above
  return NextResponse.json({ received: true }, { status: 200 });
}

// Webhooks need the raw body — Next route handlers already give us that via req.text()
export const runtime = "nodejs";
