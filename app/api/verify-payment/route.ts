import { NextRequest, NextResponse } from "next/server";
import { applyPayment, stripeSessionUserId } from "@/lib/server/payments";
import { sendUserEmail } from "@/lib/server/notify";
import { detailTable } from "@/lib/server/emailTemplate";
import {
  isPaynowPollUrl,
  paynowParam,
  paynowPaid,
  pollPaynow,
  settlePaynowPayment,
} from "@/lib/server/paynow";
import { confirmationUrl } from "@/lib/server/appUrl";

/** Branded receipt email — fire-and-forget, never blocks verification. */
function receiptEmail(to: string, amount: number | null, currency: string, method: string, reference: string) {
  void sendUserEmail({
    to,
    subject: "Payment received — thank you!",
    heading: "Payment confirmed",
    emoji: "✅",
    badge: "Receipt",
    badgeColor: "#15803d",
    bodyHtml:
      `<p>We've received your payment. Your WellSpend subscription is active — ` +
      `enjoy the full experience.</p>` +
      detailTable([
        ["Amount", amount != null ? `${currency.toUpperCase()} ${amount.toFixed(2)}` : "—"],
        ["Method", method],
        ["Reference", reference],
      ]),
    cta: { label: "Open WellSpend", url: confirmationUrl("payment") },
  }).catch(() => {});
}

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
  // dry=1: report paid status only — no profile update, no ledger write.
  // Used by the pay-first signup flow before the account exists.
  const dry = p.get("dry") === "1";

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
      // Bind to the checkout session's own identity — never trust a uid
      // supplied by the caller (one payment must not activate other accounts).
      // Falls back to the payer email for pay-first signup, where no account
      // existed at checkout time.
      const userId = paid && !dry ? await stripeSessionUserId(session) : "";
      if (paid && !dry && userId) {
        const customer = session.customer_details as Record<string, string> | undefined;
        const email = customer?.email ?? (session.customer_email as string) ?? "";
        await applyPayment({
          userId,
          userEmail: email,
          provider: "stripe",
          method: "card",
          amount: typeof session.amount_total === "number" ? session.amount_total / 100 : null,
          currency: (session.currency as string) ?? "usd",
          reference: sessionId,
        });
        // Pay-first signup: the subscription was created before the account
        // existed, so its metadata has no user_id — stamp it now so future
        // invoice.paid renewal webhooks can attribute the payment.
        if (!session.client_reference_id && session.subscription) {
          void fetch(
            `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(String(session.subscription))}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${secret}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({ "metadata[user_id]": userId, "metadata[email]": email }),
            }
          ).catch(() => {});
        }
        if (email) {
          receiptEmail(email, typeof session.amount_total === "number" ? session.amount_total / 100 : null, (session.currency as string) ?? "usd", "Card", sessionId);
        }
      }
      return NextResponse.json({ paid });
    }

    if (provider === "paynow") {
      const pollUrl = p.get("pollurl") ?? "";
      if (!isPaynowPollUrl(pollUrl)) {
        return NextResponse.json({ paid: false, error: "Invalid poll URL" }, { status: 400 });
      }
      if (dry) {
        const polled = await pollPaynow(pollUrl);
        const status = paynowParam(polled, "status").toLowerCase();
        return NextResponse.json({ paid: paynowPaid(status), status });
      }
      const result = await settlePaynowPayment({ pollUrl, uid });
      return NextResponse.json({ paid: result.paid, status: result.status });
    }

    return NextResponse.json({ paid: false, error: "Unknown provider" }, { status: 400 });
  } catch (err) {
    // Log the full error server-side but return a generic message to the client
    console.error("Payment verification error:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      { paid: false, error: "Payment verification failed. Please try again or contact support." },
      { status: 500 }
    );
  }
}
