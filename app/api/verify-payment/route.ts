import { NextRequest, NextResponse } from "next/server";
import { applyPayment } from "@/lib/server/payments";
import { notifyAdmin, sendUserEmail } from "@/lib/server/notify";
import { detailTable } from "@/lib/server/emailTemplate";
import { sbGet } from "@/lib/server/supabaseAdmin";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://drpt-budget-tracker.vercel.app";

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
    cta: { label: "Open WellSpend", url: APP_URL },
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
      // Bind to the checkout session's own reference — never trust a uid
      // supplied by the caller (one payment must not activate other accounts).
      const userId = (session.client_reference_id as string) ?? "";
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
        if (email) {
          receiptEmail(email, typeof session.amount_total === "number" ? session.amount_total / 100 : null, (session.currency as string) ?? "usd", "Card", sessionId);
        }
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
      if (paid && !dry) {
        // Bind the payment to the account it was initiated for: the pending
        // ledger row written by /api/paynow/initiate carries the owner.
        const reference = data.get("reference") ?? "";
        const pending = reference
          ? await sbGet<{ id: number; user_id: string | null; user_email: string | null }>(
              "payments",
              `provider=eq.paynow&reference=eq.${encodeURIComponent(reference)}&select=id,user_id,user_email&limit=1`
            )
          : [];
        const ownerId = pending[0]?.user_id ?? "";
        if (ownerId && uid && uid !== ownerId) {
          return NextResponse.json({ paid: false, error: "Account mismatch" }, { status: 403 });
        }
        const effectiveUid = ownerId || uid;
        if (effectiveUid) {
          await applyPayment({
            userId: effectiveUid,
            userEmail: pending[0]?.user_email ?? undefined,
            provider: "paynow",
            method: "paynow",
            amount: data.get("amount") ? Number(data.get("amount")) : null,
            currency: "usd",
            reference: reference || undefined,
            meta: { paynowreference: data.get("paynowreference") ?? "", status },
          });
        }
        await notifyAdmin("payment_success", { method: "paynow", detail: `status "${status}", uid ${effectiveUid}` });
        const prof = await sbGet<{ email: string | null }>("profiles", `id=eq.${encodeURIComponent(effectiveUid)}&select=email&limit=1`);
        const email = prof[0]?.email;
        if (email) {
          receiptEmail(email, data.get("amount") ? Number(data.get("amount")) : null, "usd", "Paynow", reference || effectiveUid);
        }
      } else if (!paid && !dry && (status === "cancelled" || status === "failed" || status === "disputed")) {
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
