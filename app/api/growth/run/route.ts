import { NextRequest, NextResponse } from "next/server";
import { runGrowthAgent } from "@/lib/server/growthAgent";
import { isAdminRequest } from "@/lib/server/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron guard — same pattern as /api/reminders/run and /api/cleanup/unpaid.
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; a verified admin
 * JWT also works so the console can trigger a manual run. Identity headers
 * are never trusted.
 */
async function authorised(req: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const query = req.nextUrl.searchParams.get("secret") ?? "";
    if (bearer === secret || query === secret) return true;
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return serviceKey ? isAdminRequest(req, serviceKey) : false;
}

/**
 * GET /api/growth/run — the Growth Agent's daily shift. Scores prospects,
 * emails the hot ones a personalised nudge (Groq copy, SMTP delivery),
 * logs every touch to sales_outreach and mails the admin a digest.
 * Vercel cron calls this daily; ?manual=1 bypasses the enabled flag.
 */
export async function GET(req: NextRequest) {
  if (!(await authorised(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const manual = req.nextUrl.searchParams.get("manual") === "1";
    const result = await runGrowthAgent({ manual });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Run failed" },
      { status: 500 }
    );
  }
}
