import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/admin";
import { sbGet, sbPatch } from "@/lib/server/supabaseAdmin";
import { collectLeads, runGrowthAgent, sendLeadEmail } from "@/lib/server/growthAgent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface OutreachRow {
  id: string;
  lead_key: string;
  email: string | null;
  name: string | null;
  intent_score: number;
  signals: string[];
  channel: string;
  subject: string | null;
  status: string;
  error: string | null;
  created_at: string;
}

/**
 * GET /api/admin/growth — everything the Growth Agent console renders:
 * agent state, scored lead pipeline, recent outreach log, 24h funnel.
 */
export async function GET(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || !(await isAdminRequest(req, serviceKey))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const [stateRows, { leads, funnel24h }, outreach] = await Promise.all([
      sbGet<Record<string, unknown>>(
        "sales_agent_state",
        "select=enabled,last_run_at,last_digest_at,sent_today,sent_today_date,research_session_id,research_launched_at,research_status,research_last_digest_at&id=eq.1"
      ),
      collectLeads(),
      sbGet<OutreachRow>(
        "sales_outreach",
        "select=id,lead_key,email,name,intent_score,signals,channel,subject,status,error,created_at&order=created_at.desc&limit=50"
      ),
    ]);

    return NextResponse.json({
      state: stateRows[0] ?? { enabled: true },
      leads: leads.slice(0, 60),
      outreach,
      funnel24h,
      totals: {
        scored: leads.length,
        emailable: leads.filter((l) => l.email && !l.paid && (!l.role || l.role === "user")).length,
        anonymousHot: leads.filter((l) => l.anonymous && l.score >= 50).length,
        tiers: {
          customer: leads.filter((l) => l.tier === "customer").length,
          warm: leads.filter((l) => l.tier === "warm").length,
          dormant: leads.filter((l) => l.tier === "dormant").length,
          anonymous: leads.filter((l) => l.tier === "anonymous").length,
        },
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Load failed" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/growth — { action: "run" } triggers an agent run now
 * (bypasses the enabled flag, still respects daily cap + cooldowns);
 * { action: "set_enabled", enabled } pauses/resumes the cron agent.
 */
export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || !(await isAdminRequest(req, serviceKey))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const action = typeof body.action === "string" ? body.action : "";

  try {
    if (action === "run") {
      const result = await runGrowthAgent({ manual: true });
      return NextResponse.json({ ok: true, ...result });
    }
    if (action === "send") {
      const leadKey = typeof body.leadKey === "string" ? body.leadKey : "";
      if (!leadKey) return NextResponse.json({ error: "leadKey required" }, { status: 400 });
      const result = await sendLeadEmail(leadKey);
      return NextResponse.json(result, { status: result.ok ? 200 : 422 });
    }
    if (action === "set_enabled") {
      const enabled = body.enabled === true;
      await sbPatch("sales_agent_state", "id=eq.1", {
        enabled,
        updated_at: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true, enabled });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Action failed" },
      { status: 500 }
    );
  }
}
