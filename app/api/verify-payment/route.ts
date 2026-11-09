import { NextRequest, NextResponse } from "next/server";
import { markProfilePaid, recordPayment } from "@/lib/server/payments";
import { notifyAdmin } from "@/lib/server/notify";

/**
 * GET /api/verify-payment?provider=stripe&session_id=...&uid=...
 * GET /api/verify-payment?provider=paynow&pollurl=...&uid=...
 *
 * Confirms a payment with the provider, then marks the profile is_paid.
 * Returns { paid: true|false }.
 */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const provider = p.get("provider");
  const uid = p.get("uid") ?? "";

  try {
    if (provider === "stripe") {
      const sessionId = p.get("session_id") ?? "";
      const secret = process.env.STRIPE_SECRET_KEY;
      if (!secret || !sessionId) {
        return NextResponse.json({ paid: false, error: "Not configured" }, { status: 400 });
      }
      const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const session = await res.json();
      const paid = res.ok && session.payment_status === "paid";
      const userId = uid || session.client_reference_id || "";
      if (paid) {
        await markProfilePaid(userId);
        const customer = session.customer_details as Record<string, string> | undefined;
        await recordPayment({
          userId,
          userEmail: customer?.email ?? (session.customer_email as string) ?? "",
          provider: "stripe",
          method: "card",
          amount: typeof session.amount_total === "number" ? session.amount_total / 100 : null,
          currency: (session.currency as string) ?? "usd",
          reference: sessionId,
        });
      }
      return NextResponse.json({ paid });
    }

    if (provider === "paynow") {
      const pollUrl = p.get("pollurl") ?? "";
      if (!pollUrl.startsWith("https://www.paynow.co.zw/")) {
        return NextResponse.json({ paid: false, error: "Invalid poll URL" }, { status: 400 });
      }
      const res = await fetch(pollUrl, { cache: "no-store" });
      const data = new URLSearchParams(await res.text());
      const status = (data.get("status") ?? "").toLowerCase();
      const paid = status === "paid" || status === "awaiting delivery" || status === "delivered";
      if (paid) {
        await markProfilePaid(uid);
        await recordPayment({
          userId: uid,
          provider: "paynow",
          method: "paynow",
          amount: data.get("amount") ? Number(data.get("amount")) : null,
          currency: "usd",
          reference: data.get("reference") ?? undefined,
          meta: { paynowreference: data.get("paynowreference") ?? "", status },
        });
        await notifyAdmin("payment_success", { method: "paynow", detail: `status "${status}", uid ${uid}` });
      } else if (status === "cancelled" || status === "failed" || status === "disputed") {
        await notifyAdmin("payment_failed", { method: "paynow", detail: `status "${status}", uid ${uid}` });
      }
      return NextResponse.json({ paid, status });
    }

    return NextResponse.json({ paid: false, error: "Unknown provider" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { paid: false, error: err instanceof Error ? err.message : "Verification failed" },
      { status: 500 }
    );
  }
}
