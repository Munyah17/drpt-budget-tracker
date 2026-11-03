import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/server/jwt";
import { requireFeatureAccess, accessError } from "@/lib/server/gate";
import { sbGet } from "@/lib/server/supabaseAdmin";
import { bankingUnlockCheckout } from "@/lib/server/checkout";
import { bankingPriceLabel } from "@/lib/pricing";

/**
 * POST /api/banking/unlock?uid=<uuid>
 * Starts the $1-per-institution Stripe checkout for the user's CONNECTED
 * bank (the institution is read from their saved connection — client can't
 * pick a different one). 402-style response only applies to free-tier users
 * whose institution isn't unlocked yet.
 */
export async function POST(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "";
  const session = requireSession(req, uid);
  if ("error" in session) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  const access = await requireFeatureAccess(uid);
  if ("ok" in access) return NextResponse.json({ unlocked: true });
  if (access.status !== 402) return accessError(access);

  const conns = await sbGet<{ institution_id: string | null; institution_name: string | null }>(
    "bank_connections",
    `user_key=eq.${encodeURIComponent(uid)}&select=institution_id,institution_name&limit=1`
  );
  const conn = conns[0];
  if (!conn?.institution_id) {
    return NextResponse.json({ error: "No bank connected" }, { status: 400 });
  }

  const rows = await sbGet<{ id: number }>(
    "banking_unlocks",
    `user_key=eq.${encodeURIComponent(uid)}&institution_id=eq.${encodeURIComponent(conn.institution_id)}&select=id&limit=1`
  );
  if (rows.length) return NextResponse.json({ unlocked: true });

  const checkoutUrl = await bankingUnlockCheckout({
    origin: req.nextUrl.origin,
    uid,
    institutionId: conn.institution_id,
    institutionName: conn.institution_name ?? "",
  });
  return NextResponse.json(
    { unlocked: false, checkoutUrl, priceLabel: bankingPriceLabel("stripe") },
    { status: 402 }
  );
}

export const runtime = "nodejs";
