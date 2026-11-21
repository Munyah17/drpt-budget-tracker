import { NextRequest, NextResponse } from "next/server";
import { sbDelete, sbGet, sbInsert, sbPatch } from "@/lib/server/supabaseAdmin";
import { isAdminRequest } from "@/lib/server/admin";
import { markProfilePaid } from "@/lib/server/payments";
import { notifyAdmin, sendUserEmail } from "@/lib/server/notify";
import { detailTable, highlightBox } from "@/lib/server/emailTemplate";
import { APP_URL } from "@/lib/server/appUrl";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";

const DIRECT_PROVIDERS = "ecocash,bank";

interface PaymentRow {
  id: number;
  user_id: string | null;
  user_email: string | null;
  provider: string;
  method: string | null;
  amount: number | null;
  currency: string;
  reference: string | null;
  status: string;
  paid_at: string;
  created_at: string;
  meta: Record<string, unknown> | null;
}

interface ProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  is_paid: boolean;
  created_at: string;
}

/**
 * GET /api/admin/approvals — pending direct-transfer (EcoCash/InnBucks/bank)
 * payments with the temporary account's profile, for the approve/reject queue.
 */
export async function GET(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  if (!(await isAdminRequest(req, serviceKey))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const payments = await sbGet<PaymentRow>(
    "payments",
    `status=eq.pending&provider=in.(${DIRECT_PROVIDERS})&order=created_at.desc&limit=200`
  );

  const ids = [...new Set(payments.map((p) => p.user_id).filter((v): v is string => !!v))];
  const profiles = ids.length
    ? await sbGet<ProfileRow>(
        "profiles",
        `id=in.(${ids.join(",")})&select=id,name,email,phone,country,is_paid,created_at`
      )
    : [];
  const byId = new Map(profiles.map((p) => [p.id, p]));

  return NextResponse.json({
    approvals: payments.map((p) => ({
      ...p,
      profile: p.user_id ? byId.get(p.user_id) ?? null : null,
    })),
  });
}

/**
 * POST /api/admin/approvals { paymentId, action: "approve" | "reject" }
 *
 * approve → payment marked paid, profile is_paid/paid_until extended, and the
 * temp account's email is confirmed so the client can sign in.
 * reject  → payment marked rejected and the temporary account is deleted.
 */
export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  if (!(await isAdminRequest(req, serviceKey))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const paymentId = Number(body?.paymentId);
  const action = String(body?.action ?? "");
  if (!Number.isFinite(paymentId) || !["approve", "reject", "stall"].includes(action)) {
    return NextResponse.json({ error: "paymentId and action (approve|reject|stall) required" }, { status: 400 });
  }

  const rows = await sbGet<PaymentRow>(
    "payments",
    `id=eq.${paymentId}&select=id,user_id,user_email,provider,method,amount,currency,status,reference,meta&limit=1`
  );
  const payment = rows[0];
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (payment.status !== "pending") {
    return NextResponse.json({ error: `Payment already ${payment.status}` }, { status: 409 });
  }

  const userId = payment.user_id;

  // stall — hold the request while the admin asks the client for more info.
  // Stays "pending" so Approve/Reject still work later; the note is kept on
  // the payment meta, shown in the approvals queue, and emailed to the client.
  if (action === "stall") {
    const note = typeof body?.note === "string" ? body.note.trim().slice(0, 300) : "";
    const meta: Record<string, unknown> = { ...(payment.meta ?? {}), stalled: true, stalled_at: new Date().toISOString() };
    if (note) meta.stall_note = note;
    await sbPatch("payments", `id=eq.${paymentId}`, { meta });

    const methodLabel = payment.provider === "bank" ? "Bank transfer" : "EcoCash / InnBucks";
    const amountLabel =
      payment.amount != null
        ? `${String(payment.currency ?? "usd").toUpperCase()} ${payment.amount.toFixed(2)}`
        : "—";
    const emailed = payment.user_email
      ? await sendUserEmail({
          to: payment.user_email,
          subject: "WellSpend — we need more info for your payment",
          heading: "We need a bit more information",
          emoji: "📩",
          badge: "Action needed",
          badgeColor: "#b45309",
          bodyHtml:
            `<p>Thanks for your payment request. Before we can confirm it, we need ` +
            `<strong>more information from you</strong>.</p>` +
            (note
              ? highlightBox(`<strong>Requested info:</strong> ${note.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}`)
              : highlightBox("Please reply to this email with any missing payment details or proof of payment.")) +
            detailTable([
              ["Reference", payment.reference ?? `#${paymentId}`],
              ["Method", methodLabel],
              ["Amount", amountLabel],
            ]),
          cta: { label: "Contact support", url: `${APP_URL}/support` },
        }).catch(() => false)
      : false;

    return NextResponse.json({ ok: true, action: "stalled", emailed });
  }

  if (action === "approve") {
    await sbPatch("payments", `id=eq.${paymentId}`, {
      status: "paid",
      paid_at: new Date().toISOString(),
    });

    if (userId) {
      // Some older pending accounts were provisioned without a profiles row.
      // Recreate a minimal profile before activating so login/profile sync has
      // something to read.
      const existingProfile = await sbGet<{ id: string }>(
        "profiles",
        `id=eq.${encodeURIComponent(userId)}&select=id&limit=1`
      );
      if (existingProfile.length === 0) {
        const meta = payment.meta ?? {};
        const name = typeof meta.name === "string" && meta.name
          ? meta.name
          : (payment.user_email ? payment.user_email.split("@")[0] : "User");
        if (payment.user_email) {
          await sbInsert("profiles", {
            id: userId,
            email: payment.user_email,
            name,
            role: "user",
            currency: "USD",
            is_paid: false,
            phone: typeof meta.phone === "string" ? meta.phone : undefined,
            country: typeof meta.country === "string" ? meta.country : undefined,
          });
        }
      }
      await markProfilePaid(userId);
      // Temp accounts are created unconfirmed — confirm so they can sign in.
      await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
        method: "PUT",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email_confirm: true }),
      }).catch(() => {});
    }

    void notifyAdmin("payment_success", {
      email: payment.user_email ?? undefined,
      method: payment.provider === "bank" ? "Bank transfer" : "EcoCash / InnBucks",
      detail: `Approved by admin · ref ${payment.reference ?? paymentId}`,
    }).catch(() => {});

    // Tell the client their account is live — they were told to watch for this.
    const clientEmail = payment.user_email;
    if (clientEmail) {
      void sendUserEmail({
        to: clientEmail,
        subject: "Your WellSpend account is activated ✅",
        heading: "Payment confirmed — you're in!",
        emoji: "🎉",
        badge: "Activated",
        badgeColor: "#15803d",
        bodyHtml:
          `<p>Good news — your payment has been <strong>confirmed</strong> and your ` +
          `WellSpend account is now <strong>fully activated</strong>.</p>` +
          detailTable([
            ["Amount", payment.amount != null ? `${String(payment.currency).toUpperCase()} ${payment.amount.toFixed(2)}` : "—"],
            ["Method", payment.provider === "bank" ? "Bank transfer" : "EcoCash / InnBucks"],
            ["Reference", payment.reference ?? `#${paymentId}`],
          ]) +
          highlightBox("Sign in with the email and password you used at checkout — everything is unlocked."),
        cta: { label: "Sign in to WellSpend", url: `${APP_URL}/login` },
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, action: "approved" });
  }

  // reject — remove the temporary account entirely
  await sbPatch("payments", `id=eq.${paymentId}`, { status: "rejected", user_id: null });
  if (userId) {
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    }).catch(() => {});
    await sbDelete("profiles", `id=eq.${encodeURIComponent(userId)}`);
  }

  // Let the client know the transfer wasn't confirmed.
  if (payment.user_email) {
    void sendUserEmail({
      to: payment.user_email,
      subject: "WellSpend — payment not confirmed",
      heading: "We couldn't confirm your payment",
      emoji: "⚠️",
      badge: "Update",
      badgeColor: "#b45309",
      bodyHtml:
        `<p>We reviewed your direct-transfer request but <strong>couldn't confirm the payment</strong>. ` +
        `If you already sent the money, please reply to this email or message us on WhatsApp with your ` +
        `proof of payment and we'll sort it out right away.</p>` +
        detailTable([["Reference", payment.reference ?? `#${paymentId}`]]),
      cta: { label: "Contact support", url: `${APP_URL}/support` },
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, action: "rejected" });
}
