import crypto from "crypto";
import { applyPayment } from "./payments";
import { notifyAdmin, sendUserEmail } from "./notify";
import { detailTable } from "./emailTemplate";
import { sbGet } from "./supabaseAdmin";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://drpt-budget-tracker.vercel.app");
const PAYNOW_POLL_PREFIX = "https://www.paynow.co.zw/";

export function isPaynowPollUrl(url: string): boolean {
  return url.startsWith(PAYNOW_POLL_PREFIX);
}

export async function pollPaynow(pollUrl: string): Promise<URLSearchParams | null> {
  if (!isPaynowPollUrl(pollUrl)) return null;
  try {
    const res = await fetch(pollUrl, { cache: "no-store" });
    if (!res.ok) return null;
    return new URLSearchParams(await res.text());
  } catch {
    return null;
  }
}

export function paynowParam(
  params: URLSearchParams | null | undefined,
  key: string
): string {
  if (!params) return "";
  const lower = key.toLowerCase();
  for (const [k, v] of params.entries()) {
    if (k.toLowerCase() === lower) return v;
  }
  return "";
}

export function paynowPaid(status: string): boolean {
  const s = status.trim().toLowerCase();
  return s === "paid" || s === "awaiting delivery" || s === "delivered";
}

export function paynowFailed(status: string): boolean {
  const s = status.trim().toLowerCase();
  return s === "cancelled" || s === "failed" || s === "disputed" || s === "refunded";
}

/**
 * Validate an inbound Paynow message (resulturl callback). Paynow hashes every
 * posted value except `hash`, in the order received, URL-decoded, with the
 * integration key appended last.
 */
export function validatePaynowHash(
  rawBody: string,
  integrationKey: string
): { ok: boolean; params: URLSearchParams } {
  const params = new URLSearchParams(rawBody);
  const values: string[] = [];
  let hash = "";
  for (const [k, v] of params.entries()) {
    if (k.toLowerCase() === "hash") {
      if (!hash) hash = v;
      continue;
    }
    values.push(v);
  }
  const expected = crypto
    .createHash("sha512")
    .update(values.join("") + integrationKey, "utf8")
    .digest("hex")
    .toUpperCase();
  return { ok: !!hash && expected === hash.toUpperCase(), params };
}

function receiptEmail(
  to: string,
  amount: number | null,
  currency: string,
  method: string,
  reference: string
) {
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

export interface PaynowSettleOptions {
  pollUrl?: string;
  uid?: string;
  reference?: string;
  amount?: number | null;
  paynowreference?: string;
  status?: string;
  notify?: boolean;
}

export interface PaynowSettleResult {
  paid: boolean;
  status: string;
  reference: string;
  userId: string;
  applied: boolean;
  notified: boolean;
}

/**
 * Confirm a Paynow transaction and settle it exactly once. The poll URL is the
 * authoritative source when available; callback fields are the fallback for a
 * hash-verified resulturl message. Notifications fire only when the payment is
 * newly applied, so client verify + server callback can't double-email.
 */
export async function settlePaynowPayment(
  opts: PaynowSettleOptions = {}
): Promise<PaynowSettleResult> {
  const polled = opts.pollUrl ? await pollPaynow(opts.pollUrl) : null;
  const status = (paynowParam(polled, "status") || opts.status || "")
    .trim()
    .toLowerCase();
  const reference = paynowParam(polled, "reference") || opts.reference || "";
  const paynowreference =
    paynowParam(polled, "paynowreference") || opts.paynowreference || "";
  const amountRaw = paynowParam(polled, "amount");
  const amount = amountRaw ? Number(amountRaw) : opts.amount ?? null;
  const paid = paynowPaid(status);
  const uid = opts.uid ?? "";
  const notify = opts.notify !== false;

  if (!paid) {
    if (notify && paynowFailed(status)) {
      await notifyAdmin("payment_failed", {
        method: "paynow",
        detail: `status "${status}", ref ${reference || paynowreference || uid}`,
      });
    }
    return { paid: false, status, reference, userId: uid, applied: false, notified: false };
  }

  const pending = reference
    ? await sbGet<{ id: number; user_id: string | null; user_email: string | null }>(
        "payments",
        `provider=eq.paynow&reference=eq.${encodeURIComponent(reference)}&select=id,user_id,user_email&order=created_at.desc&limit=1`
      )
    : [];
  const hasPending = pending.length > 0;
  if (!hasPending) {
    if (notify && opts.reference) {
      await notifyAdmin("payment_success", {
        method: "paynow",
        detail: `status "${status}", ref ${reference || paynowreference}, no pending payment`,
      });
    }
    return { paid: false, status, reference, userId: uid, applied: false, notified: false };
  }

  const ownerId = pending[0]?.user_id ?? "";
  if (ownerId && uid && uid !== ownerId) {
    return { paid: false, status, reference, userId: uid, applied: false, notified: false };
  }
  const effectiveUid = ownerId || uid;

  let applied = false;
  if (effectiveUid) {
    const result = await applyPayment({
      userId: effectiveUid,
      userEmail: pending[0]?.user_email ?? undefined,
      provider: "paynow",
      method: "paynow",
      amount,
      currency: "usd",
      reference: reference || undefined,
      meta: { paynowreference, status },
    });
    applied = result === "paid";
  }

  let notified = false;
  if (notify && applied) {
    const prof = effectiveUid
      ? await sbGet<{ email: string | null; name: string | null }>(
          "profiles",
          `id=eq.${encodeURIComponent(effectiveUid)}&select=email,name&limit=1`
        )
      : [];
    const email = prof[0]?.email ?? pending[0]?.user_email ?? "";
    const name = prof[0]?.name ?? "";
    const sent = await notifyAdmin("payment_success", {
      email,
      name,
      method: "paynow",
      detail: `status "${status}", ref ${reference || paynowreference || effectiveUid}`,
    });
    notified = sent;
    if (email) {
      receiptEmail(email, amount, "usd", "Paynow", reference || effectiveUid);
    }
  } else if (notify && !effectiveUid && opts.reference) {
    await notifyAdmin("payment_success", {
      method: "paynow",
      detail: `status "${status}", ref ${reference || paynowreference}, no account linked`,
    });
    notified = true;
  }

  return {
    paid: true,
    status,
    reference,
    userId: effectiveUid,
    applied,
    notified,
  };
}
