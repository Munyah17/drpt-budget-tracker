import { sbGet, sbPatch } from "@/lib/server/supabaseAdmin";
import {
  apiError,
  apiOk,
  dispatchWebhook,
  withApi,
  INVOICE_STATUSES,
  QUOTE_STATUSES,
} from "@/lib/server/api";

export const runtime = "nodejs";

const ALL_STATUSES: readonly string[] = [...INVOICE_STATUSES, ...QUOTE_STATUSES];

/** GET /api/v1/invoices/:id — one document by id. */
export const GET = withApi("read", async (_req, _key, ctx) => {
  const { id } = (await ctx?.params) ?? {};
  const rows = await sbGet("invoices", `id=eq.${encodeURIComponent(id ?? "")}&limit=1`);
  if (!rows[0]) return apiError(404, "not_found", "Document not found");
  return apiOk(rows[0]);
});

/** PATCH /api/v1/invoices/:id — update document status.
 *  Body: { status } — Paid stamps paid_at and fires invoice.paid. */
export const PATCH = withApi("write", async (req, _key, ctx) => {
  const { id } = (await ctx?.params) ?? {};
  const body = await req.json().catch(() => null);
  const status = typeof body?.status === "string" ? body.status : "";
  if (!ALL_STATUSES.includes(status)) {
    return apiError(400, "invalid_body", `status must be one of: ${ALL_STATUSES.join(", ")}`);
  }
  const ok = await sbPatch("invoices", `id=eq.${encodeURIComponent(id ?? "")}`, {
    status,
    ...(status === "Paid" ? { paid_at: new Date().toISOString() } : {}),
  });
  if (!ok) return apiError(502, "upstream_error", "Could not update the document");
  if (status === "Paid") void dispatchWebhook("invoice.paid", { id, status });
  return apiOk({ id, status });
});
