import { NextRequest, NextResponse } from "next/server";
import {
  paynowParam,
  settlePaynowPayment,
  validatePaynowHash,
} from "@/lib/server/paynow";

export const runtime = "nodejs";

/**
 * Paynow server-to-server result callback (resulturl). Validates the message
 * hash, then settles the payment and sends notifications without relying on
 * the customer's browser returning to /payment/success.
 */
export async function POST(req: NextRequest) {
  const key = process.env.PAYNOW_INTEGRATION_KEY;
  const raw = await req.text();
  if (!key) return new NextResponse("OK", { status: 200 });

  const { ok, params } = validatePaynowHash(raw, key);
  if (!ok) return new NextResponse("Invalid hash", { status: 401 });

  const pollUrl = paynowParam(params, "pollurl");
  const status = paynowParam(params, "status");
  const reference = paynowParam(params, "reference");
  const paynowreference = paynowParam(params, "paynowreference");
  const amountRaw = paynowParam(params, "amount");
  const amountNum = amountRaw ? Number(amountRaw) : null;
  const amount = amountNum != null && Number.isFinite(amountNum) ? amountNum : null;

  try {
    await settlePaynowPayment({ pollUrl, reference, paynowreference, amount, status });
  } catch (err) {
    console.error("[paynow/result] settle failed:", err);
    return new NextResponse("Error", { status: 500 });
  }
  return new NextResponse("OK", { status: 200 });
}
