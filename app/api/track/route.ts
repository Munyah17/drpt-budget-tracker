import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";

const ALLOWED_EVENTS = new Set([
  "landing_view",
  "page_view",
  "demo_start",
  "signup",
  "signup_failed",
  "login",
  "payment",
  "payment_failed",
]);

const clip = (v: unknown, max = 200): string | null =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

/**
 * POST /api/track — stores a product-analytics event in `activity_events`
 * via the service role (anon/public inserts are blocked by RLS).
 * Payload is whitelisted + clipped so the table can't be abused.
 */
export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const event = clip(body.event, 60);
  if (!event || !ALLOWED_EVENTS.has(event)) {
    return NextResponse.json({ error: "Unknown event" }, { status: 400 });
  }

  const meta =
    body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)
      ? (body.meta as Record<string, unknown>)
      : {};
  // Shallow-sanitize meta: keep it small, primitives only.
  const safeMeta: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(meta).slice(0, 12)) {
    if (typeof v === "string") safeMeta[k.slice(0, 40)] = v.slice(0, 200);
    else if (typeof v === "number" || typeof v === "boolean") safeMeta[k.slice(0, 40)] = v;
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/activity_events`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        event,
        path: clip(body.path, 300),
        visitor_id: clip(body.visitor_id, 80),
        user_id: clip(body.user_id, 80),
        user_email: clip(body.user_email, 200),
        meta: safeMeta,
      }),
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Store failed" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Store failed" }, { status: 500 });
  }
}

export const runtime = "nodejs";
