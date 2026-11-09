import { NextRequest, NextResponse } from "next/server";
import { sbGet, sbPatch } from "@/lib/server/supabaseAdmin";
import { isAdminRequest } from "@/lib/server/admin";

export const runtime = "nodejs";

/** GET /api/admin/support — support inbox rows, newest first. */
export async function GET(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  if (!(await isAdminRequest(req, serviceKey))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await sbGet(
    "support_messages",
    "select=id,user_email,user_name,subject,message,status,created_at,resolved_at&order=created_at.desc&limit=500"
  );
  return NextResponse.json({ messages: rows });
}

const ALLOWED_STATUS = new Set(["open", "in-progress", "resolved", "closed"]);

/** PATCH /api/admin/support — set a message's status (resolved stamps resolved_at). */
export async function PATCH(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  if (!(await isAdminRequest(req, serviceKey))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const ok = await sbPatch(
    "support_messages",
    `id=eq.${id}`,
    { status, resolved_at: status === "resolved" ? new Date().toISOString() : null }
  );
  return NextResponse.json({ ok });
}
