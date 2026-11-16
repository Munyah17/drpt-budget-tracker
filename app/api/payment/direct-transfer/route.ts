import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sbGet, sbUpsert } from "@/lib/server/supabaseAdmin";
import { recordPayment } from "@/lib/server/payments";
import { notifyAdmin } from "@/lib/server/notify";
import { priceUsdFor, type PaymentChannel } from "@/lib/pricing";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";

const DIRECT_METHODS = new Set(["ecocash", "bank"]);

/**
 * POST /api/payment/direct-transfer
 * { email, password?, name?, phone?, country?, method: "ecocash"|"bank", signup? }
 *
 * Direct-transfer (EcoCash/InnBucks/bank) checkout: instead of making the
 * admin re-type the client's details after a WhatsApp PoP, this provisions a
 * TEMPORARY INACTIVE account right away — Supabase auth user with
 * email_confirm=false (cannot log in) + an unpaid profile — and logs a
 * pending payment. The admin reviews it under Admin → User Management →
 * Pending Approvals and clicks Approve (confirms email + marks paid) or
 * Reject (deletes the temp account).
 */
export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const method = String(body?.method ?? "").toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (!DIRECT_METHODS.has(method)) {
    return NextResponse.json({ error: "Unsupported transfer method" }, { status: 400 });
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const country = typeof body?.country === "string" ? body.country.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" && body.password.length >= 6
    ? body.password
    : crypto.randomBytes(9).toString("base64url"); // temp — user resets after approval if unknown
  const amount = priceUsdFor(method as PaymentChannel, country);

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  try {
    // Existing profile? (returning unpaid user re-trying checkout)
    const existing = await sbGet<{ id: string; is_paid: boolean }>(
      "profiles",
      `email=eq.${encodeURIComponent(email)}&select=id,is_paid&limit=1`
    );
    let userId = existing[0]?.id ?? null;

    if (!userId) {
      // Temp inactive account — email NOT confirmed, so they can't sign in
      // until an admin approves the transfer.
      const create = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          email,
          password,
          email_confirm: false,
          user_metadata: { name, phone, country, method },
        }),
      });
      const created = await create.json().catch(() => ({}));
      if (!create.ok) {
        const msg = String(created?.msg ?? created?.message ?? created?.error_description ?? "account creation failed");
        if (/already|exists|registered/i.test(msg)) {
          // Auth user exists but profile didn't — reuse via profile lookup
          // is impossible without the id; surface a clear error instead.
          return NextResponse.json({ error: "An account with this email already exists — please log in to pay" }, { status: 409 });
        }
        return NextResponse.json({ error: msg }, { status: 502 });
      }
      userId = created?.id ?? null;
      if (!userId) return NextResponse.json({ error: "Account creation failed" }, { status: 502 });

      const kyc = Object.fromEntries(
        Object.entries({ name, phone, country }).filter(([, v]) => typeof v === "string" && v)
      );
      const base = {
        id: userId,
        email,
        name: name || email.split("@")[0],
        role: "user",
        currency: "USD",
        is_paid: false,
      };
      const ok = await sbUpsert("profiles", [{ ...base, ...kyc }], "id");
      if (!ok) await sbUpsert("profiles", [base], "id");
    }

    const reference = `dt-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    await recordPayment({
      userId: userId ?? undefined,
      userEmail: email,
      provider: method,
      method: "direct_transfer",
      amount,
      currency: "usd",
      reference,
      status: "pending",
      meta: { name, phone, country, channel: method, signup: body?.signup === true },
    });

    void notifyAdmin("transfer_intent", {
      email,
      name: name || undefined,
      method: method === "bank" ? "Bank transfer" : "EcoCash / InnBucks",
      detail: `Pending approval · ref ${reference} · $${amount.toFixed(2)}`,
    }).catch(() => {});

    return NextResponse.json({ ok: true, pending: true, reference });
  } catch {
    return NextResponse.json({ error: "Direct transfer registration failed" }, { status: 500 });
  }
}
