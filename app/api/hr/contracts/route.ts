import { NextRequest, NextResponse } from "next/server";
import { sbGet, sbInsert, sbPatch } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await sbGet("contracts", "order=created_at.desc"));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.template) return NextResponse.json({ error: "template required" }, { status: 400 });
  const row = await sbInsert("contracts", {
    template: body.template,
    title: body.title ?? body.template,
    employee: body.employee ?? "",
    data: body.data ?? {},
    status: "Draft",
  });
  if (!row) return NextResponse.json({ error: "insert failed" }, { status: 502 });
  return NextResponse.json(row);
}

/** PATCH /api/hr/contracts { id, status | data | ... } */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { id, ...patch } = body;
  const ok = await sbPatch("contracts", `id=eq.${id}`, patch);
  return NextResponse.json({ ok });
}
