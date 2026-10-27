import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/server/notify";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";

const DAY = 24 * 60 * 60 * 1000;
const MAX_SENDS_PER_RUN = 100;

interface ReminderRow {
  id: number;
  user_key: string;
  bill_id: string;
  bill_name: string;
  amount: number | null;
  currency: string;
  due_date: string;
  channel: "email" | "sms" | "whatsapp";
  days_before: number;
  destination: string;
}

/**
 * Cron guard. Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when the
 * env var is set — enforce it in that case. When no secret is configured the
 * endpoint stays open; abuse is bounded by MAX_SENDS_PER_RUN and by the fact
 * that last_sent_at dedupes sends (a reminder fires once per saved config).
 */
function authorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const query = req.nextUrl.searchParams.get("secret") ?? "";
  return bearer === secret || query === secret;
}

/** Send an SMS or WhatsApp message via Twilio REST (no SDK dependency). */
async function sendTwilio(to: string, body: string, whatsapp: boolean): Promise<string | null> {
  const sid = process.env.TWILIO_SID;
  const token = process.env.TWILIO_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) return "twilio not configured";

  const params = new URLSearchParams({
    To: whatsapp ? `whatsapp:${to}` : to,
    From: whatsapp ? `whatsapp:${from}` : from,
    Body: body,
  });
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    if (!res.ok) return `twilio ${res.status}: ${(await res.text()).slice(0, 120)}`;
    return null; // sent
  } catch (e) {
    return e instanceof Error ? e.message : "twilio send failed";
  }
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * GET /api/reminders/run — find saved reminders whose window has opened
 * (days-until-due <= days_before, not yet sent for the current config) and
 * deliver them. Vercel cron calls this daily at 06:00 UTC; it can also be
 * triggered manually for testing.
 */
export async function GET(req: NextRequest) {
  if (!authorised(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  const svc = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const horizon = new Date(today.getTime() + 14 * DAY).toISOString().slice(0, 10);
  // include a few overdue days so a missed cron run still catches up
  const floor = new Date(today.getTime() - 3 * DAY).toISOString().slice(0, 10);

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/bill_reminders?enabled=eq.true&last_sent_at=is.null` +
        `&due_date=gte.${floor}&due_date=lte.${horizon}&select=id,user_key,bill_id,bill_name,amount,currency,due_date,channel,days_before,destination`,
      { headers: svc, cache: "no-store" }
    );
    const rows: ReminderRow[] = res.ok ? await res.json() : [];

    const results = { checked: rows.length, due: 0, sent: 0, failed: 0, skipped: 0 };
    const patch = (id: number, body: Record<string, unknown>) =>
      fetch(`${SUPABASE_URL}/rest/v1/bill_reminders?id=eq.${id}`, {
        method: "PATCH",
        headers: { ...svc, Prefer: "return=minimal" },
        body: JSON.stringify(body),
      }).catch(() => {});

    for (const r of rows) {
      if (results.sent + results.failed >= MAX_SENDS_PER_RUN) break;
      const daysUntil = Math.round(
        (new Date(r.due_date + "T00:00:00Z").getTime() - new Date(todayStr + "T00:00:00Z").getTime()) / DAY
      );
      if (daysUntil > r.days_before) {
        results.skipped++; // window not open yet
        continue;
      }
      results.due++;

      const amountStr = r.amount != null ? ` ${r.currency} ${Number(r.amount).toFixed(2)}` : "";
      const when = daysUntil < 0 ? `was due on ${r.due_date}` : daysUntil === 0 ? "is due today" : `is due in ${daysUntil} day${daysUntil === 1 ? "" : "s"} (${r.due_date})`;
      const text = `WellSpend reminder: "${r.bill_name}"${amountStr} ${when}.`;

      let err: string | null = null;
      if (r.channel === "email") {
        const ok = await sendMail({
          to: r.destination,
          subject: `Bill reminder: ${r.bill_name} ${daysUntil === 0 ? "due today" : `due ${r.due_date}`}`,
          text,
          html:
            `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:520px">` +
            `<h3 style="color:#c81057;margin:0 0 10px">Bill reminder</h3>` +
            `<p style="font-size:15px;margin:0 0 6px"><strong>${esc(r.bill_name)}</strong>${esc(amountStr)} ${esc(when)}.</p>` +
            `<p style="color:#999;font-size:12px;margin-top:14px">WellSpend Budget Tracker — you set this reminder on the Bills page.</p>` +
            `</div>`,
        });
        err = ok ? null : "smtp send failed";
      } else {
        err = await sendTwilio(r.destination, text, r.channel === "whatsapp");
      }

      if (err) {
        results.failed++;
        await patch(r.id, { last_error: err });
      } else {
        results.sent++;
        await patch(r.id, { last_sent_at: new Date().toISOString(), last_error: null });
      }
    }

    return NextResponse.json({ ok: true, ...results });
  } catch {
    return NextResponse.json({ error: "Run failed" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
