import { NextRequest, NextResponse } from "next/server";
import { sbGet } from "@/lib/server/supabaseAdmin";
import { isAdminRequest } from "@/lib/server/admin";
import { recordPayment, markProfilePaid } from "@/lib/server/payments";

export const runtime = "nodejs";

const DAY = 24 * 60 * 60 * 1000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

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
}

/**
 * GET /api/admin/payments — payment ledger + revenue aggregates for the
 * admin finance pages. Rows come from public.payments (written by
 * verify-payment, the Stripe webhook, Paynow/EcoCash polls and admin
 * grants). Stats cover every provider incl. paynow, bucketed per day.
 */
export async function GET(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  if (!(await isAdminRequest(req, serviceKey))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = (await sbGet<PaymentRow>(
    "payments",
    "select=id,user_id,user_email,provider,method,amount,currency,reference,status,paid_at,created_at,meta&order=paid_at.desc&limit=1000"
  )) as PaymentRow[];

  const userIds = [...new Set(rows.map((r) => r.user_id).filter((v): v is string => !!v))];
  const profiles = userIds.length
    ? await sbGet<ProfileRow>(
        "profiles",
        `id=in.(${userIds.join(",")})&select=id,name,email,phone&limit=1000`
      )
    : [];
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  // ---- Aggregates -------------------------------------------------------
  const paid = rows.filter((r) => r.status === "paid");
  const byProvider = new Map<string, { count: number; total: number }>();
  const byCurrency = new Map<string, number>();
  let pendingCount = 0;
  let pendingTotal = 0;

  for (const r of rows) {
    if (r.status !== "paid") {
      pendingCount++;
      pendingTotal += r.amount ?? 0;
      continue;
    }
    const cur = (r.currency || "usd").toLowerCase();
    const agg = byProvider.get(r.provider) ?? { count: 0, total: 0 };
    agg.count++;
    agg.total += r.amount ?? 0;
    byProvider.set(r.provider, agg);
    byCurrency.set(cur, (byCurrency.get(cur) ?? 0) + (r.amount ?? 0));
  }

  // 14-day revenue series (paid rows only)
  const days: { date: string; label: string; total: number; paynow: number; stripe: number; other: number }[] = [];
  const dayIndex = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY);
    const date = dayKey(d);
    dayIndex.set(date, days.length);
    days.push({
      date,
      label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      total: 0,
      paynow: 0,
      stripe: 0,
      other: 0,
    });
  }
  for (const r of paid) {
    const idx = dayIndex.get(dayKey(new Date(r.paid_at)));
    if (idx === undefined) continue;
    const amt = r.amount ?? 0;
    days[idx].total += amt;
    if (r.provider === "paynow") days[idx].paynow += amt;
    else if (r.provider === "stripe") days[idx].stripe += amt;
    else days[idx].other += amt;
  }

  const stats = {
    totalRevenue: paid.reduce((s, r) => s + (r.amount ?? 0), 0),
    paidCount: paid.length,
    pendingCount,
    pendingTotal,
    byProvider: Object.fromEntries(byProvider),
    byCurrency: Object.fromEntries(byCurrency),
    days,
  };

  return NextResponse.json({
    payments: rows.map((r) => ({
      ...r,
      profile: r.user_id ? profileById.get(r.user_id) ?? null : null,
    })),
    stats,
  });
}

const PROVIDERS = new Set(["stripe", "paynow", "ecocash", "bank", "admin", "manual"]);

/**
 * POST /api/admin/payments — record a manual/offline payment (cash, bank
 * deposit, agent collection…). Optionally marks the user's profile paid.
 * Body: { userEmail?, userId?, provider?, method?, amount, currency?, reference?, markPaid? }
 */
export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  if (!(await isAdminRequest(req, serviceKey))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const amount = typeof body?.amount === "number" ? body.amount : Number(body?.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
  }
  const provider =
    typeof body?.provider === "string" && PROVIDERS.has(body.provider.toLowerCase())
      ? body.provider.toLowerCase()
      : "manual";
  const userEmail = typeof body?.userEmail === "string" ? body.userEmail.trim() : "";
  const userId = typeof body?.userId === "string" ? body.userId.trim() : "";

  const ok = await recordPayment({
    userId: userId || undefined,
    userEmail: userEmail || undefined,
    provider,
    method: typeof body?.method === "string" ? body.method : undefined,
    amount,
    currency: typeof body?.currency === "string" ? body.currency.toLowerCase() : "usd",
    reference:
      typeof body?.reference === "string" && body.reference.trim()
        ? body.reference.trim()
        : `manual-${Date.now()}`,
    status: "paid",
    meta: { recordedBy: "admin", note: typeof body?.note === "string" ? body.note : undefined },
  });
  if (!ok) return NextResponse.json({ error: "Could not record payment" }, { status: 502 });

  let markedPaid = false;
  if (body?.markPaid === true && userId) {
    markedPaid = await markProfilePaid(userId);
  }

  return NextResponse.json({ ok: true, markedPaid });
}
