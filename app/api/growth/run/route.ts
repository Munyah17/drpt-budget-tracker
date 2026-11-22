import { NextRequest, NextResponse } from "next/server";
import { runGrowthAgent } from "@/lib/server/growthAgent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron guard — same pattern as /api/reminders/run and /api/cleanup/unpaid.
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when configured;
 * without a secret the endpoint falls back to the admin-email header so it
 * can still be triggered manually by the admin.
 */
function authorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const query = req.nextUrl.searchParams.get("secret") ?? "";
    return bearer === secret || query === secret;
  }
  const adminEmail = (process.env.ADMIN_EMAIL ?? "munyamuzvidziwa19@gmail.com").toLowerCase();
  return (req.headers.get("x-admin-email") ?? "").toLowerCase() === adminEmail;
}

/**
 * GET /api/growth/run — the Growth Agent's daily shift. Scores prospects,
 * emails the hot ones a personalised nudge (Groq copy, SMTP delivery),
 * logs every touch to sales_outreach and mails the admin a digest.
 * Vercel cron calls this daily; ?manual=1 bypasses the enabled flag.
 */
export async function GET(req: NextRequest) {
  if (!authorised(req)) {
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
