import { NextRequest, NextResponse } from "next/server";
import { sbGet, sbInsert } from "@/lib/server/supabaseAdmin";
import { isAdminRequest } from "@/lib/server/admin";
import { dispatchWebhook } from "@/lib/server/api";

export const runtime = "nodejs";

/**
 * GET /api/admin/users?role=&corporate_id= — real profiles for admin lists
 * and the "View as client" picker.
 */
export async function GET(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  if (!(await isAdminRequest(req, serviceKey))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = [
    "select=id,name,email,phone,profession,role,corporate_id,is_paid,paid_until,created_at",
    "order=created_at.desc",
    "limit=500",
  ];
  const role = req.nextUrl.searchParams.get("role");
  if (role) q.unshift(`role=eq.${encodeURIComponent(role)}`);
  const corporateId = req.nextUrl.searchParams.get("corporate_id");
  if (corporateId) q.unshift(`corporate_id=eq.${encodeURIComponent(corporateId)}`);

  const rows = await sbGet("profiles", q.join("&"));
  return NextResponse.json({ users: rows });
}

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";

const ROLES = new Set(["user", "corporate", "employee", "admin"]);

/**
 * POST /api/admin/users { email, password, name?, role?, isPaid?, corporateId?, organisation? }
 *
 * Admin-only account provisioning: creates a confirmed Supabase auth user and
 * its profiles row with the right role, so the person can sign in immediately
 * and lands in the correct portal (admin / corporate / employee / dashboard).
 */
export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  if (!(await isAdminRequest(req, serviceKey))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "email and password required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "password must be at least 6 characters" }, { status: 400 });
  }
  const role = typeof body?.role === "string" && ROLES.has(body.role) ? body.role : "user";

  // Confirmed auth user — signInWithPassword works from the first login.
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
      user_metadata: { name: body?.name ?? "", role },
    }),
  });
  const created = await authRes.json().catch(() => null);
  if (!authRes.ok || !created?.id) {
    const msg =
      created?.msg || created?.message || created?.error_description || "account creation failed";
    return NextResponse.json({ error: msg }, { status: authRes.ok ? 502 : authRes.status });
  }

  // Profile row drives login's role → portal redirect and the paid gate.
  // Optional columns (organisation/corporate_id) may not exist — retry without
  // them so account creation never dies on a schema gap.
  const base: Record<string, unknown> = {
    id: created.id,
    email,
    name: typeof body?.name === "string" && body.name ? body.name : email.split("@")[0],
    role,
    currency: "USD",
    is_paid: body?.isPaid === true,
  };
  const optional = Object.fromEntries(
    Object.entries({ organisation: body?.organisation, corporate_id: body?.corporateId }).filter(
      ([, v]) => typeof v === "string" && v
    )
  );
  let profile = await sbInsert("profiles", { ...base, ...optional });
  if (!profile && Object.keys(optional).length) {
    profile = await sbInsert("profiles", base);
  }

  if (profile && role === "employee") void dispatchWebhook("employee.created", profile);

  return NextResponse.json({ ok: true, id: created.id, profile });
}
