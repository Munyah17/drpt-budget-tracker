import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/server/notify";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://drpt-budget-tracker.vercel.app";

/**
 * POST /api/auth/confirm { userId?, email, name? }
 *
 * Confirms a user's email and (when userId is provided) upserts their profile
 * row — all via the service role, so it works even when Supabase email
 * confirmation is enabled and the fresh signup has no session for RLS.
 *
 * This is what makes brand-new signups able to sign in immediately instead of
 * getting "Email not confirmed" errors.
 */
export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const { userId, email, name, phone, gender, profession, referral_code } = await req
    .json()
    .catch(() => ({}));
  if (!email && !userId) {
    return NextResponse.json({ error: "email or userId required" }, { status: 400 });
  }

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  try {
    let uid: string | null = userId ?? null;

    // No userId (login-retry path): find the user by email — admin API has no
    // email filter, so page through the user list.
    if (!uid) {
      for (let page = 1; page <= 10 && !uid; page++) {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=200`, {
          headers,
          cache: "no-store",
        });
        const data = await res.json();
        const users: { id: string; email?: string }[] = data?.users ?? data ?? [];
        const match = users.find(
          (u) => u.email?.toLowerCase() === String(email).toLowerCase()
        );
        if (match) uid = match.id;
        if (users.length < 200) break;
      }
      if (!uid) return NextResponse.json({ ok: false, found: false });
    } else {
      // Verify the claimed user id actually owns this email before confirming
      const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${uid}`, {
        headers,
        cache: "no-store",
      });
      const u = await res.json();
      if (email && u?.email && u.email.toLowerCase() !== String(email).toLowerCase()) {
        return NextResponse.json({ error: "email mismatch" }, { status: 403 });
      }
    }

    // Mark the email confirmed so signInWithPassword works right away
    const confirm = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${uid}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ email_confirm: true }),
    });
    if (!confirm.ok) {
      return NextResponse.json({ error: "confirm failed" }, { status: 502 });
    }

    // Ensure a profile row exists (signup path — no session for RLS, so the
    // client-side insert fails when confirmation is required). Merge: never
    // overwrite is_paid/role on an existing row.
    if (userId) {
      const base = {
        id: uid,
        email,
        name: name || String(email).split("@")[0],
        role: "user",
        currency: "USD",
      };
      // KYC columns may not exist in the table yet — try with them first,
      // then fall back to the guaranteed payload. The same data also lives
      // in auth user_metadata from signUp, so nothing is lost either way.
      const kyc = Object.fromEntries(
        Object.entries({ phone, gender, profession, referral_code }).filter(
          ([, v]) => typeof v === "string" && v
        )
      );
      const upsert = await fetch(`${SUPABASE_URL}/rest/v1/profiles?on_conflict=id`, {
        method: "POST",
        headers: { ...headers, Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({ ...base, ...kyc }),
      });
      if (!upsert.ok && Object.keys(kyc).length) {
        await fetch(`${SUPABASE_URL}/rest/v1/profiles?on_conflict=id`, {
          method: "POST",
          headers: { ...headers, Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify(base),
        });
      }

      // Welcome email — the only channel where we can legally talk about
      // activation (the iOS app must stay silent about payment). Fire and
      // forget so a slow SMTP relay never blocks the signup response.
      void sendMail({
        to: email,
        subject: "Welcome to WellSpend",
        text:
          `Hi ${name || email.split("@")[0]},\n\n` +
          `Your WellSpend account is ready — sign in with ${email}.\n\n` +
          `To activate every feature (transactions, budgets, savings goals and reports), ` +
          `a one-time $1 activation applies. On the web, sign in at ${APP_URL} and follow ` +
          `the activation step — it takes about a minute. Once activated, your plan unlocks ` +
          `everywhere, including the iPhone app.\n\n` +
          `WellSpend ❤`,
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, uid });
  } catch {
    return NextResponse.json({ error: "Confirm failed" }, { status: 500 });
  }
}

export const runtime = "nodejs";
