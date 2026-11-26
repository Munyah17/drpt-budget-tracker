import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { priceUsdForCountry } from "@/lib/server/pricing";
import { sbGet, sbInsert } from "@/lib/server/supabaseAdmin";
import { rateLimited, clientIp } from "@/lib/server/rateLimit";
import { paynowParam, validatePaynowHash } from "@/lib/server/paynow";

const INITIATE_URL = "https://www.paynow.co.zw/interface/initiatetransaction";

/**
 * Paynow message integrity hash: SHA512 of every outgoing value concatenated
 * in field order, with the integration key appended last. Uppercase hex.
 */
function paynowHash(values: (string | undefined)[], key: string): string {
  const msg = values.map((v) => v ?? "").join("") + key;
  return crypto.createHash("sha512").update(msg, "utf8").digest("hex").toUpperCase();
}

export async function POST(req: NextRequest) {
  // Public endpoint — cap checkout-session creation per IP.
  if (rateLimited(`paynow-init:${clientIp(req)}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests — try again later" }, { status: 429 });
  }

  const id = process.env.PAYNOW_INTEGRATION_ID;
  const key = process.env.PAYNOW_INTEGRATION_KEY;
  if (!id || !key) {
    return NextResponse.json({ error: "Paynow is not configured" }, { status: 500 });
  }

  const { userId, email, country } = await req.json().catch(() => ({}));
  const origin = req.nextUrl.origin;
  // Unguessable reference — a bare epoch timestamp let anyone enumerate or
  // collide with other customers' payment references (bug-bounty VULN-12).
  const reference = `WSPD-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

  // Checkout country: the picker's choice wins; profile country is the fallback.
  let region = String(country ?? "").trim();
  if (!region && userId) {
    const rows = await sbGet<{ country: string | null }>(
      "profiles",
      `id=eq.${encodeURIComponent(String(userId))}&select=country&limit=1`
    );
    if (rows[0]?.country) region = rows[0].country;
  }
  region = region.toLowerCase();

  // Paynow only settles in Zimbabwe — every other region is card-only (Stripe).
  if (region && region !== "zw") {
    return NextResponse.json(
      { error: "Paynow is only available in Zimbabwe — please pay by card" },
      { status: 400 }
    );
  }

  const amount = await priceUsdForCountry("paynow", region);

  // Field order matters for the hash
  const fields: [string, string][] = [
    ["id", id],
    ["reference", reference],
    ["amount", amount.toFixed(2)],
    ["additionalinfo", `WellSpend monthly access${userId ? ` (${userId})` : ""}`],
    ["returnurl", `${origin}/payment/success?provider=paynow&uid=${encodeURIComponent(userId ?? "")}`],
    ["resulturl", `${origin}/api/paynow/result`],
    ["authemail", email ?? ""],
    ["status", "Message"],
  ];

  const hash = paynowHash(fields.map(([, v]) => v), key);
  const body = new URLSearchParams([...fields, ["hash", hash]]);

  const res = await fetch(INITIATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  const { ok: hashOk, params } = validatePaynowHash(text, key);
  if (!hashOk) {
    return NextResponse.json({ error: "Paynow initiate hash validation failed" }, { status: 502 });
  }
  const status = paynowParam(params, "status").toLowerCase();

  if (!res.ok || status !== "ok") {
    // Log the full error server-side but return a generic message to the client
    console.error("Paynow initiate error:", paynowParam(params, "error") || `Paynow initiate failed (${status || res.status})`);
    return NextResponse.json(
      { error: "Payment could not be initiated. Please try again or contact support." },
      { status: 502 }
    );
  }

  // Record the intent as a pending ledger row — /api/verify-payment uses it
  // to bind the confirmed payment to this exact account (anti-replay).
  await sbInsert("payments", {
    user_id: userId ? String(userId) : null,
    user_email: email ? String(email) : null,
    provider: "paynow",
    method: "paynow",
    amount,
    currency: "usd",
    reference,
    status: "pending",
    meta: { initiated: true },
  });

  return NextResponse.json({
    url: paynowParam(params, "browserurl"),
    pollUrl: paynowParam(params, "pollurl"),
    reference,
  });
}
