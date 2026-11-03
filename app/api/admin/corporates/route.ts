import { NextRequest, NextResponse } from "next/server";
import { sbGet, sbInsert, sbPatch, sbDelete } from "@/lib/server/supabaseAdmin";
import { isAdminRequest } from "@/lib/server/admin";
import { dispatchWebhook } from "@/lib/server/api";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";

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
  void dispatchWebhook("corporate.created", row);

  // Provision the client's admin login (email + password → role "corporate",
  // linked via profiles.corporate_id) so they can sign in straight into their
  // portal. Failure is reported on the row — the corporate itself was created.
  let accountError: string | null = null;
  const email = typeof body.contact_email === "string" ? body.contact_email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (password) {
    if (!email) {
      accountError = "contact email required for the login account";
    } else {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          email_confirm: true,
          user_metadata: { name: body.contact_name ?? "", role: "corporate" },
        }),
      });
      const created = await authRes.json().catch(() => null);
      if (!authRes.ok || !created?.id) {
        accountError =
          created?.msg || created?.message || created?.error_description || "account creation failed";
      } else {
        const profile = await sbInsert("profiles", {
          id: created.id,
          email,
          name: body.contact_name || email.split("@")[0],
          role: "corporate",
          currency: "USD",
          corporate_id: (row as { id?: string }).id,
        });
        if (!profile) accountError = "profile insert failed — account exists without a profile";
      }
    }
  }

  return NextResponse.json({ ...(row as Record<string, unknown>), accountError });
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
