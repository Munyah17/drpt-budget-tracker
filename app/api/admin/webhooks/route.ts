import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { sbGet, sbInsert, sbDelete } from "@/lib/server/supabaseAdmin";
import { isAdminRequest } from "@/lib/server/admin";

export const runtime = "nodejs";

export const WEBHOOK_EVENTS = [
  "corporate.created",
  "employee.created",
  "invoice.created",
  "invoice.paid",
] as const;

async function denied(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  if (!(await isAdminRequest(req, serviceKey))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** GET /api/admin/webhooks — subscriptions + recent deliveries. */
export async function GET(req: NextRequest) {
  const deny = await denied(req);
  if (deny) return deny;
  const hooks = await sbGet("webhooks", "select=id,name,url,events,active,created_at&order=created_at.desc");
  const deliveries = await sbGet("webhook_deliveries", "order=attempted_at.desc&limit=25");
  return NextResponse.json({ hooks, deliveries });
}

/** POST /api/admin/webhooks { name?, url, events[] } — create a subscription.
 *  The signing secret is returned ONCE (verify X-WellSpend-Signature). */
export async function POST(req: NextRequest) {
  const deny = await denied(req);
  if (deny) return deny;
  const body = await req.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "a valid https URL is required" }, { status: 400 });
  }
  const events = (Array.isArray(body?.events) ? body.events : [])
    .map(String)
    .filter((e: string) => (WEBHOOK_EVENTS as readonly string[]).includes(e));
  if (!events.length) {
    return NextResponse.json({ error: `events must include one of: ${WEBHOOK_EVENTS.join(", ")}` }, { status: 400 });
  }

  const secret = `whsec_${randomBytes(20).toString("hex")}`;
  const row = await sbInsert("webhooks", {
    name: body?.name ?? "",
    url,
    events,
    secret,
  });
  if (!row) return NextResponse.json({ error: "insert failed" }, { status: 502 });
  return NextResponse.json({ secret, row });
}

/** DELETE /api/admin/webhooks?id= — remove a subscription (deliveries cascade). */
export async function DELETE(req: NextRequest) {
  const deny = await denied(req);
  if (deny) return deny;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const ok = await sbDelete("webhooks", `id=eq.${encodeURIComponent(id)}`);
  if (!ok) return NextResponse.json({ error: "delete failed" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
