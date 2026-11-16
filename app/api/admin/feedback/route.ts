import { NextRequest, NextResponse } from "next/server";
import { sbGet, sbPatch } from "@/lib/server/supabaseAdmin";
import { ADMIN_EMAIL, isSuperAdminRequest } from "@/lib/server/admin";

export const runtime = "nodejs";

/**
 * Super-admin-only customer feedback inbox.
 * The hardcoded founder identity (x-admin-email === ADMIN_EMAIL) is allowed so
 * the local super-admin login can read feedback without a Supabase session.
 */
async function guard(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return { error: NextResponse.json({ error: "Not configured" }, { status: 500 }) };
  const headerEmail = (req.headers.get("x-admin-email") ?? "").toLowerCase();
  const ok = headerEmail === ADMIN_EMAIL || (await isSuperAdminRequest(req, serviceKey));
  if (!ok) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { serviceKey };
}

/** GET /api/admin/feedback — feedback rows, newest first. */
export async function GET(req: NextRequest) {
  const g = await guard(req);
  if ("error" in g) return g.error;
  const rows = await sbGet(
    "customer_feedback",
    "select=id,user_email,user_name,kind,message,page,app_version,status,created_at,updated_at&order=created_at.desc&limit=500"
  );
  return NextResponse.json({ feedback: rows });
}

const ALLOWED_STATUS = new Set(["new", "reviewed", "planned", "shipped", "declined"]);

/** PATCH /api/admin/feedback — set a feedback item's status. */
export async function PATCH(req: NextRequest) {
  const g = await guard(req);
  if ("error" in g) return g.error;

  let body: { id?: number; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const id = Number(body.id);
  const status = String(body.status ?? "");
  if (!Number.isInteger(id) || !ALLOWED_STATUS.has(status)) {
    return NextResponse.json({ error: "id and a valid status are required" }, { status: 400 });
  }

  const ok = await sbPatch("customer_feedback", `id=eq.${id}`, {
    status,
    updated_at: new Date().toISOString(),
  });
  return NextResponse.json({ ok });
}
