import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { priceUsd } from "@/lib/pricing";

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
  const id = process.env.PAYNOW_INTEGRATION_ID;
  const key = process.env.PAYNOW_INTEGRATION_KEY;
  if (!id || !key) {
    return NextResponse.json({ error: "Paynow is not configured" }, { status: 500 });
  }

  const { userId, email } = await req.json().catch(() => ({}));
  const origin = req.nextUrl.origin;
  const reference = `WSPD-${Date.now()}`;

  // Field order matters for the hash
  const fields: [string, string][] = [
    ["id", id],
    ["reference", reference],
    ["amount", priceUsd("paynow").toFixed(2)],
    ["additionalinfo", `WellSpend lifetime access${userId ? ` (${userId})` : ""}`],
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
  const data = new URLSearchParams(text);
  const status = (data.get("status") ?? "").toLowerCase();

  if (!res.ok || status !== "ok") {
    return NextResponse.json(
      { error: data.get("error") ?? `Paynow initiate failed (${status || res.status})` },
      { status: 502 }
    );
  }

  return NextResponse.json({
    url: data.get("browserurl"),
    pollUrl: data.get("pollurl"),
    reference,
  });
}
