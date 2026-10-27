import { NextRequest, NextResponse } from "next/server";
import { verifySupabaseJwt } from "@/lib/server/jwt";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "munyamuzvidziwa19@gmail.com").toLowerCase();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CHANNELS = new Set(["email", "sms", "whatsapp"]);

interface Actor {
  userKey: string; // uuid for real users, "admin:<email>" for the local admin
  email: string;
  paid: boolean;
}

/**
 * Identity for the reminders endpoints:
 *  - real Supabase user  → Bearer JWT (sub = profile id); paid from profiles.is_paid
 *  - hardcoded local admin → x-admin-email header; admin is implicitly paid
 * Returns null when neither is present/valid.
 */
async function resolveActor(req: NextRequest, serviceKey: string): Promise<Actor | null> {
  const headerEmail = (req.headers.get("x-admin-email") ?? "").toLowerCase();
  if (headerEmail && headerEmail === ADMIN_EMAIL) {
    return { userKey: `admin:${ADMIN_EMAIL}`, email: ADMIN_EMAIL, paid: true };
  }

  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!token || !jwtSecret) return null;
  const claims = verifySupabaseJwt(token, jwtSecret);
  const uid = typeof claims?.sub === "string" ? claims.sub : "";
  if (!claims || claims.aud !== "authenticated" || !UUID_RE.test(uid)) return null;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(uid)}&select=is_paid`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: "no-store" }
    );
    const rows = await res.json();
    return {
      userKey: uid,
      email: typeof claims.email === "string" ? claims.email : "",
      paid: Array.isArray(rows) && rows[0]?.is_paid === true,
    };
  } catch {
    return null;
  }
}

const svcHeaders = (serviceKey: string) => ({
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
});

/** GET /api/reminders — list the caller's saved reminder prefs. */
export async function GET(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  const actor = await resolveActor(req, serviceKey);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/bill_reminders?user_key=eq.${encodeURIComponent(actor.userKey)}&select=bill_id,bill_name,due_date,channel,days_before,destination,enabled,last_sent_at&order=due_date.asc`,
      { headers: svcHeaders(serviceKey), cache: "no-store" }
    );
    const rows = res.ok ? await res.json() : [];
    return NextResponse.json({ reminders: Array.isArray(rows) ? rows : [] });
  } catch {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}

/**
 * POST /api/reminders — upsert a reminder for one bill.
 * The client bills list is local state, so each save snapshots the bill's
 * name/amount/due date — the cron runner can then send without user context.
 * Paid-plan feature: unpaid callers get 402 with a stable code the UI can gate on.
 */
export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  const actor = await resolveActor(req, serviceKey);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!actor.paid) {
    return NextResponse.json({ error: "Reminders are part of the paid plan", code: "payment_required" }, { status: 402 });
  }

  let body: {
    billId?: string | number;
    billName?: string;
    amount?: number;
    currency?: string;
    dueDate?: string;
    channel?: string;
    daysBefore?: number;
    destination?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const billId = String(body.billId ?? "").slice(0, 64);
  const billName = String(body.billName ?? "").slice(0, 120);
  const dueDate = String(body.dueDate ?? "").slice(0, 10);
  const channel = String(body.channel ?? "email");
  const daysBefore = Number(body.daysBefore ?? 1);
  const destination = String(body.destination ?? actor.email).trim().slice(0, 160);
  const currency = String(body.currency ?? "USD").slice(0, 8);
  const amount = typeof body.amount === "number" && isFinite(body.amount) ? body.amount : null;

  if (!billId || !billName || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return NextResponse.json({ error: "billId, billName and a YYYY-MM-DD dueDate are required" }, { status: 400 });
  }
  if (!CHANNELS.has(channel)) {
    return NextResponse.json({ error: "channel must be email, sms or whatsapp" }, { status: 400 });
  }
  if (!Number.isInteger(daysBefore) || daysBefore < 0 || daysBefore > 14) {
    return NextResponse.json({ error: "daysBefore must be 0-14" }, { status: 400 });
  }
  if (!destination) {
    return NextResponse.json({ error: "destination (email or phone) is required" }, { status: 400 });
  }
  if (channel === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(destination)) {
    return NextResponse.json({ error: "invalid email destination" }, { status: 400 });
  }

  const row = {
    user_key: actor.userKey,
    bill_id: billId,
    bill_name: billName,
    amount,
    currency,
    due_date: dueDate,
    channel,
    days_before: daysBefore,
    destination,
    enabled: true,
    last_sent_at: null, // re-saving resets the send flag so the new config fires
    last_error: null,
    updated_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/bill_reminders?on_conflict=user_key,bill_id`, {
      method: "POST",
      headers: { ...svcHeaders(serviceKey), Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify([row]),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[reminders] upsert failed:", res.status, text.slice(0, 200));
      return NextResponse.json({ error: "Save failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}

/** DELETE /api/reminders?billId=<id> — remove a reminder. */
export async function DELETE(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  const actor = await resolveActor(req, serviceKey);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const billId = req.nextUrl.searchParams.get("billId") ?? "";
  if (!billId) return NextResponse.json({ error: "billId required" }, { status: 400 });

  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/bill_reminders?user_key=eq.${encodeURIComponent(actor.userKey)}&bill_id=eq.${encodeURIComponent(billId)}`,
      { method: "DELETE", headers: svcHeaders(serviceKey) }
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

export const runtime = "nodejs";
