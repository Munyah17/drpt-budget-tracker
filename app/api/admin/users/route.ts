import { NextRequest, NextResponse } from "next/server";
import { sbGet, sbInsert, sbPatch } from "@/lib/server/supabaseAdmin";
import { ADMIN_EMAIL, isAdminRequest, isSuperAdminRequest } from "@/lib/server/admin";
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
    "select=id,name,email,phone,profession,role,currency,corporate_id,is_paid,paid_until,paid_override,created_at",
    "order=created_at.desc",
    "limit=500",
  ];
  const role = req.nextUrl.searchParams.get("role");
  if (role) q.unshift(`role=eq.${encodeURIComponent(role)}`);
  const corporateId = req.nextUrl.searchParams.get("corporate_id");
  if (corporateId) q.unshift(`corporate_id=eq.${encodeURIComponent(corporateId)}`);

  const rows = await sbGet<{ id: string }>("profiles", q.join("&"));

  // Latest payment per user for traceability (method, amount, reference).
  // Empty when the `payments` table hasn't been created yet — sbGet returns [].
  const ids = rows.map((r) => r.id).filter(Boolean);
  const payments = ids.length
    ? await sbGet<{ user_id: string; provider: string; method: string | null; amount: number | null; currency: string; reference: string | null; paid_at: string }>(
        "payments",
        `user_id=in.(${ids.join(",")})&order=paid_at.desc&select=user_id,provider,method,amount,currency,reference,paid_at`
      )
    : [];
  const latestByUser = new Map<string, (typeof payments)[number]>();
  for (const pay of payments) {
    if (pay.user_id && !latestByUser.has(pay.user_id)) latestByUser.set(pay.user_id, pay);
  }

  return NextResponse.json({
    users: rows.map((r) => ({ ...r, payment: latestByUser.get(r.id) ?? null })),
  });
}

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";

const ROLES = new Set(["user", "corporate", "employee", "admin"]);
const PROFILE_ROLES = new Set(["super_admin", "admin", "user", "corporate", "employee"]);
const EDITABLE_FIELDS = new Set([
  "name",
  "role",
  "is_paid",
  "paid_until",
  "paid_override",
  "currency",
  "phone",
  "profession",
  "country",
  "organisation",
  "corporate_id",
]);

async function callerIsSuperAdmin(req: NextRequest, serviceKey: string): Promise<boolean> {
  if ((req.headers.get("x-admin-email") ?? "").toLowerCase() === ADMIN_EMAIL) return true;
  return isSuperAdminRequest(req, serviceKey);
}

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

/**
 * PATCH /api/admin/users { id, ...fields } — manual override for any profile.
 * Only columns present on the profile row are patched, so optional schema
 * columns (organisation/corporate_id/country) never break the update.
 * Granting or removing super_admin requires the founder identity.
 */
export async function PATCH(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  if (!(await isAdminRequest(req, serviceKey))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const rows = await sbGet<Record<string, unknown>>(
    "profiles",
    `id=eq.${encodeURIComponent(id)}&select=*&limit=1`
  );
  const current = rows[0];
  if (!current) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (key === "id" || !EDITABLE_FIELDS.has(key)) continue;
    if (!(key in current)) continue;

    if (key === "role") {
      if (typeof value !== "string" || !PROFILE_ROLES.has(value)) {
        return NextResponse.json({ error: "invalid role" }, { status: 400 });
      }
      if ((value === "super_admin" || current.role === "super_admin") && !(await callerIsSuperAdmin(req, serviceKey))) {
        return NextResponse.json({ error: "Super admin required" }, { status: 403 });
      }
      patch.role = value;
      continue;
    }

    if (key === "is_paid") {
      if (typeof value !== "boolean") {
        return NextResponse.json({ error: "is_paid must be boolean" }, { status: 400 });
      }
      patch.is_paid = value;
      continue;
    }

    if (key === "paid_until") {
      if (value === null || value === "") {
        patch.paid_until = null;
        continue;
      }
      if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
        return NextResponse.json({ error: "invalid paid_until" }, { status: 400 });
      }
      patch.paid_until = new Date(value).toISOString();
      continue;
    }

    if (key === "paid_override") {
      if (value !== null && value !== "paid" && value !== "unpaid") {
        return NextResponse.json({ error: "paid_override must be paid|unpaid|null" }, { status: 400 });
      }
      patch.paid_override = value;
      continue;
    }

    if (value === null || typeof value === "string") {
      patch[key] = value;
    } else {
      return NextResponse.json({ error: `${key} must be a string` }, { status: 400 });
    }
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "No editable fields supplied" }, { status: 400 });
  }
  // Manual is_paid edits are Super Admin overrides unless an explicit
  // paid_override was supplied in the same request.
  if ("paid_override" in current && "is_paid" in patch && !("paid_override" in patch)) {
    patch.paid_override = patch.is_paid === true ? "paid" : "unpaid";
  }
  if (patch.is_paid === false && !("paid_until" in patch)) patch.paid_until = null;

  const ok = await sbPatch("profiles", `id=eq.${encodeURIComponent(id)}`, patch);
  if (!ok) return NextResponse.json({ error: "Update failed" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
