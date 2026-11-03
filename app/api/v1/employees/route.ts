import { sbGet, sbInsert } from "@/lib/server/supabaseAdmin";
import { apiError, apiOk, dispatchWebhook, pagination, withApi } from "@/lib/server/api";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";

const PROFILE_COLS =
  "id,name,email,phone,profession,role,corporate_id,is_paid,created_at";

/** GET /api/v1/employees?corporate_id=&limit=&offset= — employee profiles. */
export const GET = withApi("read", async (req) => {
  const p = pagination(req);
  const corporateId = req.nextUrl.searchParams.get("corporate_id");
  const q = [
    "role=eq.employee",
    `select=${PROFILE_COLS}`,
    "order=created_at.desc",
    p.range,
  ];
  if (corporateId) q.unshift(`corporate_id=eq.${encodeURIComponent(corporateId)}`);
  const rows = await sbGet("profiles", q.join("&"));
  return apiOk(rows, { limit: p.limit, offset: p.offset });
});

/** POST /api/v1/employees — provision an employee login + profile.
 *  Body: { email, password, name?, corporate_id?, phone?, profession? } */
export const POST = withApi("write", async (req) => {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return apiError(400, "invalid_body", "A valid email is required");
  }
  if (password.length < 6) {
    return apiError(400, "invalid_body", "password must be at least 6 characters");
  }

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
      user_metadata: { name: body?.name ?? "", role: "employee" },
    }),
  });
  const created = await authRes.json().catch(() => null);
  if (!authRes.ok || !created?.id) {
    return apiError(
      502,
      "upstream_error",
      created?.msg || created?.message || "Could not create the auth user"
    );
  }

  const profile = await sbInsert("profiles", {
    id: created.id,
    email,
    name: body?.name || email.split("@")[0],
    role: "employee",
    currency: "USD",
    corporate_id: body?.corporate_id || null,
    phone: body?.phone || null,
    profession: body?.profession || null,
  });
  if (!profile) {
    return apiError(502, "upstream_error", "Profile insert failed — auth user exists without a profile");
  }
  void dispatchWebhook("employee.created", profile);
  return apiOk(profile);
});
