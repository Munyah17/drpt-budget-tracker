import { NextRequest, NextResponse } from "next/server";
import { sbGet, sbInsert, sbPatch } from "@/lib/server/supabaseAdmin";
import { isAdminRequest } from "@/lib/server/admin";
import {
  dispatchWebhook,
  nextDocNumber,
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

async function denied(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  if (!(await isAdminRequest(req, serviceKey))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** GET /api/admin/invoices — all documents, newest first. */
export async function GET(req: NextRequest) {
  const deny = await denied(req);
  if (deny) return deny;
  const rows = await sbGet("invoices", "order=created_at.desc");
  return NextResponse.json(rows);
}

/** POST /api/admin/invoices — create + issue an invoice or quotation.
 *  Body: { kind, bill_to_name, bill_to_lines?, items, extra_totals?,
 *          due_date?, notes?, corporate_id?, status? } */
export async function POST(req: NextRequest) {
  const deny = await denied(req);
  if (deny) return deny;
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

  if (!billToName) return NextResponse.json({ error: "bill_to_name required" }, { status: 400 });
  if (!items.length) return NextResponse.json({ error: "at least one line item required" }, { status: 400 });

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
        ? QUOTE_STATUSES.includes(body?.status) ? body.status : "Sent"
        : INVOICE_STATUSES.includes(body?.status) ? body.status : "Pending",
    due_date: body?.due_date || null,
    corporate_id: body?.corporate_id || null,
    issued_at: new Date().toISOString(),
  });
  if (!row) return NextResponse.json({ error: "insert failed" }, { status: 502 });
  void dispatchWebhook("invoice.created", row);
  return NextResponse.json(row);
}

/** PATCH /api/admin/invoices { id, status } — mark Paid / Sent / Accepted / etc. */
export async function PATCH(req: NextRequest) {
  const deny = await denied(req);
  if (deny) return deny;
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const status = typeof body?.status === "string" ? body.status : "";
  const allStatuses: string[] = [...INVOICE_STATUSES, ...QUOTE_STATUSES];
  if (!allStatuses.includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  const ok = await sbPatch("invoices", `id=eq.${encodeURIComponent(body.id)}`, {
    status,
    ...(status === "Paid" ? { paid_at: new Date().toISOString() } : {}),
  });
  if (!ok) return NextResponse.json({ error: "update failed" }, { status: 502 });
  if (status === "Paid") void dispatchWebhook("invoice.paid", { id: body.id, status });
  return NextResponse.json({ ok: true });
}
