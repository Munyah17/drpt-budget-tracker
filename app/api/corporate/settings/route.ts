import { NextRequest, NextResponse } from "next/server";
import { sbGet, sbPatch } from "@/lib/server/supabaseAdmin";
import { requireSessionOrAdmin } from "@/lib/server/jwt";

export const runtime = "nodejs";

async function getCorporateId(uid: string): Promise<string | null> {
  const rows = await sbGet<{ corporate_id: string | null }>(
    "profiles",
    `id=eq.${encodeURIComponent(uid)}&select=corporate_id&limit=1`
  );
  return rows[0]?.corporate_id ?? null;
}

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "";
  const session = requireSessionOrAdmin(req, uid);
  if ("error" in session) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  const corporateId = await getCorporateId(uid);
  if (!corporateId) {
    return NextResponse.json({ error: "No corporate linked" }, { status: 404 });
  }

  const rows = await sbGet<Record<string, unknown>>(
    "corporates",
    `id=eq.${encodeURIComponent(corporateId)}&select=id,name,theme_color,trial_started_at,trial_ends_at,plan,seats,status&limit=1`
  );
  const corp = rows[0];
  if (!corp) {
    return NextResponse.json({ error: "Corporate not found" }, { status: 404 });
  }

  const now = Date.now();
  const trialEnds = corp.trial_ends_at ? new Date(corp.trial_ends_at as string).getTime() : null;
  const trialActive = trialEnds !== null && trialEnds > now;
  const trialDaysLeft = trialActive ? Math.ceil((trialEnds! - now) / 86400000) : 0;

  return NextResponse.json({
    ...corp,
    trial_active: trialActive,
    trial_days_left: trialDaysLeft,
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const uid = body?.uid ?? "";
  const session = requireSessionOrAdmin(req, uid);
  if ("error" in session) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  const corporateId = await getCorporateId(uid);
  if (!corporateId) {
    return NextResponse.json({ error: "No corporate linked" }, { status: 404 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body?.theme_color === "string") {
    const color = body.theme_color.trim();
    if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) {
      return NextResponse.json({ error: "Invalid color format" }, { status: 400 });
    }
    patch.theme_color = color || null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const ok = await sbPatch(
    "corporates",
    `id=eq.${encodeURIComponent(corporateId)}`,
    patch
  );
  return NextResponse.json({ ok });
}
