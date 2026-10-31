import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/server/jwt";
import { requireBankingAccess, accessError } from "@/lib/server/gate";
import { syncBankTransactions } from "@/lib/server/bankSync";

/**
 * POST /api/banking/sync?uid=<uuid>
 * On-demand pull of new booked transactions for the user's connection.
 */
export async function POST(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "";
  const session = requireSession(req, uid);
  if ("error" in session) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }
  const access = await requireBankingAccess(uid);
  if (!("ok" in access)) return accessError(access);

  try {
    const written = await syncBankTransactions(uid);
    return NextResponse.json({ ok: true, synced: written });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 502 }
    );
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;
