import { NextRequest, NextResponse } from "next/server";
import { sbGet } from "@/lib/server/supabaseAdmin";
import { isAdminRequest } from "@/lib/server/admin";

export const runtime = "nodejs";

/**
 * GET /api/admin/payments — payment ledger for the admin finance pages.
 * Rows come from public.payments (written by verify-payment, the Stripe
 * webhook and admin grants). Returns [] when the table doesn't exist.
 */
export async function GET(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  if (!(await isAdminRequest(req, serviceKey))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await sbGet(
    "payments",
    "select=id,user_id,user_email,provider,method,amount,currency,reference,status,paid_at,created_at&order=paid_at.desc&limit=500"
  );
  return NextResponse.json({ payments: rows });
}
