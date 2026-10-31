import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireSession } from "@/lib/server/jwt";
import { requireFeatureAccess, accessError } from "@/lib/server/gate";
import { sbGet, sbInsert, sbPatch } from "@/lib/server/supabaseAdmin";
import { createAgreement, createRequisition } from "@/lib/server/gocardless";
import { bankingPriceCents, bankingPriceLabel, OPEN_BANKING_FEE_USD } from "@/lib/pricing";

/** Stripe Checkout session for a $1-net per-bank unlock (hosted, REST only). */
async function unlockCheckout(opts: {
  origin: string; uid: string; institutionId: string; institutionName: string; country: string;
}) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return null;
  const body = new URLSearchParams({
    mode: "payment",
    success_url: `${opts.origin}/banking?unlocked=1`,
    cancel_url: `${opts.origin}/banking`,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(bankingPriceCents("stripe", opts.country)),
    "line_items[0][price_data][product_data][name]":
      `WellSpend — Bank Connection (${opts.institutionName || "your bank"})`,
    client_reference_id: opts.uid,
    "metadata[purpose]": "banking_unlock",
    "metadata[user_id]": opts.uid,
    "metadata[institution_id]": opts.institutionId,
    "payment_method_types[0]": "card",
  });
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await res.json();
  return res.ok ? (data.url as string) : null;
}

/**
 * POST /api/banking/connect?uid=<uuid>
 * Body: {institutionId, institutionName, country}
 * Creates the end-user agreement + requisition and returns the bank's consent
 * link. The bank redirects back to /api/banking/callback?ref=<link_ref>.
 *
 * Free-tier users must buy a one-off unlock per institution first: when no
 * unlock exists this returns 402 {requiresPayment, checkoutUrl, priceLabel}
 * instead of starting the flow.
 */
export async function POST(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "";
  const session = requireSession(req, uid);
  if ("error" in session) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  const body = await req.json().catch(() => ({}));
  const institutionId = String(body.institutionId ?? "");
  const institutionName = String(body.institutionName ?? "");
  const country = String(body.country ?? "gb").toLowerCase();
  if (!institutionId) {
    return NextResponse.json({ error: "Missing institutionId" }, { status: 400 });
  }

  // Access: paid plans & corporate roles get banking free; otherwise the user
  // needs a per-institution unlock (covers the provider fee + our $1 net).
  let allowed = false;
  const access = await requireFeatureAccess(uid);
  if ("ok" in access) {
    allowed = true;
  } else if (access.status === 402) {
    const unlocks = await sbGet<{ id: number }>(
      "banking_unlocks",
      `user_key=eq.${encodeURIComponent(uid)}&institution_id=eq.${encodeURIComponent(institutionId)}&select=id&limit=1`
    );
    allowed = unlocks.length > 0;
    if (!allowed) {
      const checkoutUrl = await unlockCheckout({
        origin: req.nextUrl.origin, uid, institutionId, institutionName, country,
      });
      return NextResponse.json(
        {
          requiresPayment: true,
          checkoutUrl,
          priceLabel: bankingPriceLabel("stripe", country),
          providerFeeUsd: OPEN_BANKING_FEE_USD[country] ?? 0,
        },
        { status: 402 }
      );
    }
  } else {
    return accessError(access);
  }

  try {
    const agreement = await createAgreement(institutionId);
    const linkRef = crypto.randomUUID();
    const redirect = `${req.nextUrl.origin}/api/banking/callback`;
    const requisition = await createRequisition({
      redirect,
      institutionId,
      agreementId: agreement.id,
      reference: linkRef,
    });

    const existing = await sbGet<{ id: number }>(
      "bank_connections",
      `user_key=eq.${encodeURIComponent(uid)}&select=id`
    );
    const patch = {
      provider: "gocardless",
      requisition_id: requisition.id,
      institution_id: institutionId,
      institution_name: institutionName,
      link_ref: linkRef,
      status: "pending",
      consent_expires_at: null,
      updated_at: new Date().toISOString(),
    };
    const saved = existing.length
      ? await sbPatch("bank_connections", `id=eq.${existing[0].id}`, patch)
      : !!(await sbInsert("bank_connections", { user_key: uid, ...patch }));
    if (!saved) {
      return NextResponse.json({ error: "Could not save connection" }, { status: 500 });
    }
    return NextResponse.json({ link: requisition.link });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not start bank connection" },
      { status: 502 }
    );
  }
}

export const runtime = "nodejs";
