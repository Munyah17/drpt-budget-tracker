import { sbGet, sbInsert } from "@/lib/server/supabaseAdmin";
import { apiError, apiOk, dispatchWebhook, pagination, withApi } from "@/lib/server/api";

export const runtime = "nodejs";

/** GET /api/v1/corporates?status=&limit=&offset= — corporate client organisations. */
export const GET = withApi("read", async (req) => {
  const p = pagination(req);
  const status = req.nextUrl.searchParams.get("status");
  const q = ["order=created_at.desc", p.range];
  if (status) q.unshift(`status=eq.${encodeURIComponent(status)}`);
  const rows = await sbGet("corporates", q.join("&"));
  return apiOk(rows, { limit: p.limit, offset: p.offset });
});

/** POST /api/v1/corporates — create a corporate client organisation. */
export const POST = withApi("write", async (req) => {
  const body = await req.json().catch(() => null);
  if (typeof body?.name !== "string" || !body.name.trim()) {
    return apiError(400, "invalid_body", "name is required");
  }
  const row = await sbInsert("corporates", {
    name: body.name.trim(),
    industry: body.industry ?? "",
    contact_name: body.contact_name ?? "",
    contact_email: body.contact_email ?? "",
    plan: body.plan ?? "Growth",
    seats: Number(body.seats) || 25,
    status: body.status === "Active" ? "Active" : "Onboarding",
  });
  if (!row) return apiError(502, "upstream_error", "Could not create the corporate record");
  void dispatchWebhook("corporate.created", row);
  return apiOk(row);
});
