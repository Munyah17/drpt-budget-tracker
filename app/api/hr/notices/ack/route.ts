import { NextRequest, NextResponse } from "next/server";
import { sbInsert } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

/** POST /api/hr/notices/ack { notice_id, employee_name } */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.notice_id || !body?.employee_name)
    return NextResponse.json({ error: "notice_id + employee_name required" }, { status: 400 });
  const row = await sbInsert("notice_acks", {
    notice_id: body.notice_id,
    employee_name: body.employee_name,
  });
  return NextResponse.json({ ok: !!row });
}
