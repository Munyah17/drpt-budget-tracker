import { NextRequest, NextResponse } from "next/server";
import { sbGet } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

/** GET /api/corporate/trial?token=<token>&corp=<id> — validate trial token */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const corpId = req.nextUrl.searchParams.get("corp");

  if (!token || !corpId) {
    return NextResponse.json({ error: "Missing token or corporate ID" }, { status: 400 });
  }

  // Validate token and get corporate info
  const rows = await sbGet<Record<string, unknown>>(
    "corporates",
    `id=eq.${encodeURIComponent(corpId)}&trial_token=eq.${encodeURIComponent(token)}&select=id,name,contact_email,contact_name,trial_started_at,trial_ends_at,theme_color,plan,seats,status&limit=1`
  );

  const corp = rows[0];
  if (!corp) {
    return NextResponse.json({ error: "Invalid trial link" }, { status: 404 });
  }

  const now = Date.now();
  const trialEnds = corp.trial_ends_at ? new Date(corp.trial_ends_at as string).getTime() : null;
  const trialActive = trialEnds !== null && trialEnds > now;
  const trialExpired = trialEnds !== null && trialEnds <= now;
  const trialDaysLeft = trialActive ? Math.ceil((trialEnds! - now) / 86400000) : 0;

  return NextResponse.json({
    valid: true,
    corporate: {
      id: corp.id,
      name: corp.name,
      contact_email: corp.contact_email,
      contact_name: corp.contact_name,
      trial_started_at: corp.trial_started_at,
      trial_ends_at: corp.trial_ends_at,
      trial_active: trialActive,
      trial_expired: trialExpired,
      trial_days_left: trialDaysLeft,
      theme_color: corp.theme_color,
      plan: corp.plan,
      seats: corp.seats,
      status: corp.status,
    },
  });
}
