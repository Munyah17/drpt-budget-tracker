import { sbGet, sbInsert } from "@/lib/server/supabaseAdmin";
import {
  apiError,
  apiOk,
  dispatchWebhook,
  nextDocNumber,
  pagination,
  withApi,
  INVOICE_STATUSES,
  QUOTE_STATUSES,
} from "@/lib/server/api";

export const runtime = "nodejs";

interface DocItem {
  description: string;
  qty: number;
  unitPrice: number;
  discount?: number;
}

/** GET /api/v1/invoices?kind=&status=&corporate_id=&limit=&offset= */
export const GET = withApi("read", async (req) => {
  const p = pagination(req);
  const q = ["order=created_at.desc", p.range];
  for (const [param, col] of [
    ["kind", "kind"],
    ["status", "status"],
    ["corporate_id", "corporate_id"],
  ] as const) {
    const v = req.nextUrl.searchParams.get(param);
    if (v) q.unshift(`${col}=eq.${encodeURIComponent(v)}`);
  }
  const rows = await sbGet("invoices", q.join("&"));
  return apiOk(rows, { limit: p.limit, offset: p.offset });
});

/** POST /api/v1/invoices — create + issue an invoice or quotation.
 *  Same contract as the admin endpoint: { kind, bill_to_name, bill_to_lines?,
 *  items, extra_totals?, due_date?, notes?, corporate_id?, status? } */
export const POST = withApi("write", async (req) => {
  const body = await req.json().catch(() => null);

  const kind = body?.kind === "quotation" ? "quotation" : "invoice";
  const billToName = typeof body?.bill_to_name === "string" ? body.bill_to_name.trim() : "";
  const rawItems = Array.isArray(body?.items) ? (body.items as DocItem[]) : [];
  const items = rawItems
    .map((it) => ({
      description: String(it.description ?? "").trim(),
      qty: Number(it.qty) || 0,
      unitPrice: Number(it.unitPrice) || 0,
      discount: Number(it.discount) || 0,
    }))
    .filter((it) => it.description && it.qty > 0);

  if (!billToName) return apiError(400, "invalid_body", "bill_to_name is required");
  if (!items.length) return apiError(400, "invalid_body", "at least one line item is required");

  const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice - (it.discount ?? 0), 0);
  const extraTotals = Array.isArray(body?.extra_totals)
    ? (body.extra_totals as { label: string; amount: number }[])
        .map((t) => ({ label: String(t.label ?? ""), amount: Number(t.amount) || 0 }))
        .filter((t) => t.label && t.amount !== 0)
    : [];
  const total = subtotal + extraTotals.reduce((s, t) => s + t.amount, 0);

  const number = await nextDocNumber(kind);
  const row = await sbInsert("invoices", {
    number,
    kind,
    bill_to_name: billToName,
    bill_to_lines: Array.isArray(body?.bill_to_lines)
      ? body.bill_to_lines.map(String).filter((l: string) => l.trim())
      : [],
    items,
    subtotal,
    extra_totals: extraTotals,
    total,
    notes: Array.isArray(body?.notes) ? body.notes.map(String).filter((l: string) => l.trim()) : [],
    status:
      kind === "quotation"
        ? (QUOTE_STATUSES as readonly string[]).includes(body?.status) ? body.status : "Sent"
        : (INVOICE_STATUSES as readonly string[]).includes(body?.status) ? body.status : "Pending",
    due_date: body?.due_date || null,
    corporate_id: body?.corporate_id || null,
    issued_at: new Date().toISOString(),
  });
  if (!row) return apiError(502, "upstream_error", "Could not create the document");
  void dispatchWebhook("invoice.created", row);
  return apiOk(row);
});
