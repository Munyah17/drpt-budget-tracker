import { NextRequest, NextResponse } from "next/server";
import { sbGet, sbInsert, sbPatch, sbDelete } from "@/lib/server/supabaseAdmin";
import { isAdminRequest } from "@/lib/server/admin";

export const runtime = "nodejs";

async function denied(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  if (!(await isAdminRequest(req, serviceKey))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** GET /api/admin/corporates — all corporate client organisations, newest first.
 *  GET /api/admin/corporates?id=<uuid> — one corporate + its employees. */
export async function GET(req: NextRequest) {
  const deny = await denied(req);
  if (deny) return deny;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    const rows = await sbGet("corporates", "order=created_at.desc");
    return NextResponse.json(rows);
  }

  const corps = await sbGet("corporates", `id=eq.${encodeURIComponent(id)}&limit=1`);
  const corporate = corps[0];
  if (!corporate) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const employees = await sbGet(
    "profiles",
    `corporate_id=eq.${encodeURIComponent(id)}&select=id,name,email,phone,profession,role,is_paid,created_at&order=created_at.asc`
  );
  return NextResponse.json({ corporate, employees });
}

export async function POST(req: NextRequest) {
  const deny = await denied(req);
  if (deny) return deny;
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
  const deny = await denied(req);
  if (deny) return deny;
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { id, ...patch } = body;
  const ok = await sbPatch("corporates", `id=eq.${id}`, patch);
  return NextResponse.json({ ok });
}

/** DELETE /api/admin/corporates?id=<uuid> */
export async function DELETE(req: NextRequest) {
  const deny = await denied(req);
  if (deny) return deny;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const ok = await sbDelete("corporates", `id=eq.${id}`);
  return NextResponse.json({ ok });
}
