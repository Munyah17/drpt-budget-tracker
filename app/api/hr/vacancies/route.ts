import { NextRequest, NextResponse } from "next/server";
import { sbGet, sbInsert, sbPatch } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

/** GET /api/hr/vacancies?id=<uuid> | list all */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const rows = await sbGet("vacancies", `id=eq.${id}&limit=1`);
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(rows[0]);
  }
  const rows = await sbGet("vacancies", "order=created_at.desc");
  return NextResponse.json(rows);
}

/** POST /api/hr/vacancies — create */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.title) return NextResponse.json({ error: "title required" }, { status: 400 });
  const row = await sbInsert("vacancies", {
    title: body.title,
    department: body.department ?? "",
    sbu: body.sbu ?? "",
    location: body.location ?? "",
    employment_type: body.employment_type ?? "Full-time",
    description: body.description ?? "",
    skills: Array.isArray(body.skills) ? body.skills : [],
    fields: Array.isArray(body.fields) ? body.fields : [],
    file_requirements: body.file_requirements ?? { word: true, pdf: false, images: false },
    status: "Open",
  });
  if (!row) return NextResponse.json({ error: "insert failed" }, { status: 502 });
  return NextResponse.json(row);
}

/** PATCH /api/hr/vacancies { id, ...patch } */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { id, ...patch } = body;
  delete patch.created_at;
  const ok = await sbPatch("vacancies", `id=eq.${id}`, patch);
  return NextResponse.json({ ok });
}
