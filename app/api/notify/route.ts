import { NextRequest, NextResponse } from "next/server";
import { notifyAdmin, NotifyEvent } from "@/lib/server/notify";

/**
 * POST /api/notify — client-side events (signup success/fail, direct-transfer
 * intent, checkout initiation failure). Server-side payment results are emailed
 * directly from the webhook / verify routes instead.
 *
 * The endpoint can only email the fixed admin address, and the event type is
 * allowlisted — worst case abuse is spam to the owner, not data exposure.
 */

const ALLOWED: ReadonlySet<string> = new Set<NotifyEvent>([
  "signup_success",
  "signup_failed",
  "payment_failed",
  "transfer_intent",
]);

// Tiny per-IP rate limiter (20 events / minute) — serverless instances each get
// their own map, which is fine; it just curbs accidental loops and cheap spam.
const hits = new Map<string, { n: number; reset: number }>();
function throttled(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.reset) {
    hits.set(ip, { n: 1, reset: now + 60_000 });
    return false;
  }
  rec.n += 1;
  return rec.n > 20;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (throttled(ip)) {
    return NextResponse.json({ ok: false, error: "rate limited" }, { status: 429 });
  }

  let body: { type?: string; email?: string; name?: string; method?: string; detail?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  const type = body.type ?? "";
  if (!ALLOWED.has(type)) {
    return NextResponse.json({ ok: false, error: "unknown event" }, { status: 400 });
  }

  const sent = await notifyAdmin(type as NotifyEvent, {
    email: body.email,
    name: body.name,
    method: body.method,
    detail: body.detail,
  });
  return NextResponse.json({ ok: sent });
}

export const runtime = "nodejs";
