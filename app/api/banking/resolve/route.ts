import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/server/jwt";
import { requireBankingAccess, accessError } from "@/lib/server/gate";
import { sbPatch } from "@/lib/server/supabaseAdmin";

/**
 * POST /api/banking/resolve?uid=<uuid>
 * Body: {transactionId, action: "imported"|"dismissed", expenseId?}
 * Removes a bank transaction from the pending feed — either because it was
 * committed as an expense (optionally linked to its expense id) or because
 * the user confirmed it was already logged / doesn't belong.
 */
export async function POST(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "";
  const session = requireSession(req, uid);
  if ("error" in session) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }
  const access = await requireBankingAccess(uid);
  if (!("ok" in access)) return accessError(access);

  const body = await req.json().catch(() => ({}));
  const txnId = Number(body.transactionId);
  const action = String(body.action ?? "");
  if (!txnId || !["imported", "dismissed"].includes(action)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const patch =
    action === "dismissed"
      ? { dismissed: true }
      : { imported_expense_id: Number(body.expenseId) > 0 ? Number(body.expenseId) : -1 };

  const ok = await sbPatch(
    "bank_transactions",
    `id=eq.${txnId}&user_key=eq.${encodeURIComponent(uid)}`,
    patch
  );
  return NextResponse.json({ ok });
}

export const runtime = "nodejs";
