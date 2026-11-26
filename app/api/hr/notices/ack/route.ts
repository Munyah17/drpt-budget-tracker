import { NextRequest, NextResponse } from "next/server";
import { sbInsert } from "@/lib/server/supabaseAdmin";
import { verifySupabaseJwt } from "@/lib/server/jwt";

export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/hr/notices/ack { notice_id, employee_name }
 * Acknowledgements require a verified session — the endpoint was previously
 * open to anyone, allowing forged ack records.
 */
export async function POST(req: NextRequest) {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const claims = token && jwtSecret ? verifySupabaseJwt(token, jwtSecret) : null;
  const uid = typeof claims?.sub === "string" ? claims.sub : "";
  if (!claims || claims.aud !== "authenticated" || !UUID_RE.test(uid)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.notice_id || !body?.employee_name)
    return NextResponse.json({ error: "notice_id + employee_name required" }, { status: 400 });
  const row = await sbInsert("notice_acks", {
    notice_id: body.notice_id,
    employee_name: body.employee_name,
  });
  return NextResponse.json({ ok: !!row });
}
