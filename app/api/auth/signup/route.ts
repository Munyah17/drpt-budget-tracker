import { NextRequest, NextResponse } from "next/server";
import { sendMail, notifyAdmin } from "@/lib/server/notify";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://drpt-budget-tracker.vercel.app";

/**
 * POST /api/auth/signup
 * { email, password, name?, phone?, gender?, profession?, country?, referral_code? }
 *
 * Creates the auth user through the Supabase admin API with the email
 * pre-confirmed, upserts the profile row, and sends the welcome email via our
 * own mailer. This bypasses Supabase Auth's built-in confirmation email —
 * its default SMTP is rate-limited and was failing signups with
 * "Error sending confirmation email". The app force-confirms anyway, so the
 * Supabase email was redundant.
 */
export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const { email, password, name, phone, gender, profession, country, referral_code, platform } =
    await req.json().catch(() => ({}));

  const cleanEmail = String(email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  const kyc = Object.fromEntries(
    Object.entries({ name, phone, gender, profession, country, referral_code, platform }).filter(
      ([, v]) => typeof v === "string" && v
    )
  );

  try {
    const create = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: kyc,
      }),
    });

    const created = await create.json().catch(() => ({}));
    if (!create.ok) {
      const msg = String(created?.msg ?? created?.message ?? created?.error_description ?? "Signup failed");
      const exists = /already|exists|registered/i.test(msg);
      return NextResponse.json(
        { error: exists ? "An account with this email already exists" : msg },
        { status: exists ? 409 : 502 }
      );
    }

    const uid: string | undefined = created?.id;
    if (!uid) {
      return NextResponse.json({ error: "Signup failed" }, { status: 502 });
    }

    // Profile row — same payload shape as /api/auth/confirm so KYC columns
    // land when present and the guaranteed fields always do.
    const profile: Record<string, unknown> = {
      id: uid,
      email: cleanEmail,
      name: name || cleanEmail.split("@")[0],
      role: "user",
      currency: "USD",
      ...kyc,
    };
    const upsert = await fetch(`${SUPABASE_URL}/rest/v1/profiles?on_conflict=id`, {
      method: "POST",
      headers: { ...headers, Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(profile),
    });
    if (!upsert.ok && Object.keys(kyc).length > 4) {
      // KYC columns may not exist yet — retry with guaranteed fields only.
      const { phone: _p, gender: _g, profession: _pr, country: _c, referral_code: _r, ...base } = profile;
      await fetch(`${SUPABASE_URL}/rest/v1/profiles?on_conflict=id`, {
        method: "POST",
        headers: { ...headers, Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify(base),
      });
    }

    // Notifications — pure FYI emails, no confirmation links (the account is
    // already confirmed). Client gets a welcome note; admin gets the event.
    // Web signups are provisioned AFTER payment, so the account is already
    // activated — the email just welcomes them in.
    void sendMail({
      to: cleanEmail,
      subject: "Welcome to WellSpend",
      text:
        `Hi ${name || cleanEmail.split("@")[0]},\n\n` +
        `Your WellSpend account (${cleanEmail}) is ready and fully activated — ` +
        `just sign in with your email and password at ${APP_URL}.\n\n` +
        `Every feature is unlocked: transactions, budgets, savings goals, reports ` +
        `and banking. Welcome aboard!\n\n` +
        `WellSpend`,
    }).catch(() => {});

    void notifyAdmin("signup_success", {
      email: cleanEmail,
      name: name || cleanEmail.split("@")[0],
      detail: [country && `country: ${country}`, profession && `profession: ${profession}`]
        .filter(Boolean)
        .join(" · ") || undefined,
    }).catch(() => {});

    return NextResponse.json({ ok: true, userId: uid });
  } catch {
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}

export const runtime = "nodejs";
