import { NextRequest, NextResponse } from "next/server";
import { sbGet, sbInsert, sbPatch, sbDelete } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

/** GET /api/hr/notices?employee=<name> — notices + ack count + whether `employee` acked */
export async function GET(req: NextRequest) {
  const employee = req.nextUrl.searchParams.get("employee") ?? "";
  const [notices, acks] = await Promise.all([
    sbGet<{ id: string } & Record<string, unknown>>("notices", "order=pinned.desc,created_at.desc"),
    sbGet<{ notice_id: string; employee_name: string }>("notice_acks", "select=notice_id,employee_name"),
  ]);
  return NextResponse.json(
    notices.map((n) => ({
      ...n,
      ack_count: acks.filter((a) => a.notice_id === n.id).length,
      acked: employee ? acks.some((a) => a.notice_id === n.id && a.employee_name === employee) : false,
    }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.title) return NextResponse.json({ error: "title required" }, { status: 400 });
  const row = await sbInsert("notices", {
    title: body.title,
    body: body.body ?? "",
    audience: body.audience ?? "All staff",
    category: body.category ?? "General",
    pinned: !!body.pinned,
    posted_by: body.posted_by ?? "",
  });
  if (!row) return NextResponse.json({ error: "insert failed" }, { status: 502 });
  return NextResponse.json(row);
}

/** PATCH /api/hr/notices { id, ...patch } (pin/unpin, edit) */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { id, ...patch } = body;
  const ok = await sbPatch("notices", `id=eq.${id}`, patch);
  return NextResponse.json({ ok });
}

/** DELETE /api/hr/notices?id=<uuid> */
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const ok = await sbDelete("notices", `id=eq.${id}`);
  return NextResponse.json({ ok });
}
