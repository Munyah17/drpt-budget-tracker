import { NextRequest, NextResponse } from "next/server";
import { sbGet, sbInsert, sbPatch, sbDelete } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

/** GET /api/admin/corporates — all corporate client organisations, newest first */
export async function GET() {
  const rows = await sbGet("corporates", "order=created_at.desc");
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const row = await sbInsert("corporates", {
    name: body.name,
    industry: body.industry ?? "",
    contact_name: body.contact_name ?? "",
    contact_email: body.contact_email ?? "",
    plan: body.plan ?? "Growth",
    seats: Number(body.seats) || 25,
    status: "Onboarding",
  });
  if (!row) return NextResponse.json({ error: "insert failed" }, { status: 502 });
  return NextResponse.json(row);
}

/** PATCH /api/admin/corporates { id, ...patch } (activate, edit plan/seats) */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { id, ...patch } = body;
  const ok = await sbPatch("corporates", `id=eq.${id}`, patch);
  return NextResponse.json({ ok });
}

/** DELETE /api/admin/corporates?id=<uuid> */
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const ok = await sbDelete("corporates", `id=eq.${id}`);
  return NextResponse.json({ ok });
}
