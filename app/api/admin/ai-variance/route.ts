import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/admin";
import { paidActive } from "@/lib/paid";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";
const ACTIVE_DAYS = 14;
const DAY = 24 * 60 * 60 * 1000;

// "Active" = meaningful product usage, not being online. A registered user is
// active when they perform at least one core in-app action inside the window.
const ACTIVE_EVENTS = new Set([
  "login",
  "page_view",
  "import_open",
  "import_extracted",
  "import_confirmed",
  "bank_connect_start",
  "bank_connected",
  "bank_sync",
  "bank_txn_imported",
  "bank_txn_linked",
  "bank_unlock_paid",
]);

interface ProfileRow {
  id: string;
  role: string | null;
  is_paid: boolean | null;
  paid_until: string | null;
  paid_override: string | null;
  created_at: string | null;
}

interface EventRow {
  user_id: string | null;
  event: string;
  created_at: string;
}

function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;
}

async function groqVariance(metrics: Record<string, unknown>) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return { ai: null, aiError: "GROQ_API_KEY not configured" };

  const system = `You are a SaaS metrics analyst for a budget app. Compare registered users, paid users and active users. "Active" means meaningful product activity in the last ${ACTIVE_DAYS} days — never "online right now". Return ONLY JSON: {"summary":"2-3 sentences","insights":["..."],"risks":["..."],"recommendations":["..."]}. Be specific with the numbers, call out variances like paid-but-inactive and active-but-unpaid, and keep each item under 28 words.`;

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.35,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify(metrics) },
        ],
      }),
    });
    const data = await res.json();
    if (!res.ok) return { ai: null, aiError: data?.error?.message ?? "Groq request failed" };
    const content = data?.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(content);
    return {
      ai: {
        summary: typeof parsed.summary === "string" ? parsed.summary : "",
        insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 6) : [],
        risks: Array.isArray(parsed.risks) ? parsed.risks.slice(0, 6) : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 6) : [],
      },
      aiError: null,
    };
  } catch (err) {
    return { ai: null, aiError: err instanceof Error ? err.message : "Groq request failed" };
  }
}

/**
 * GET /api/admin/ai-variance — registered vs paid vs active variance report
 * with a Groq-written analysis. Admin-only.
 */
export async function GET(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  if (!(await isAdminRequest(req, serviceKey))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const svc = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
  const since = new Date(Date.now() - ACTIVE_DAYS * DAY).toISOString();

  try {
    const [profilesRes, eventsRes] = await Promise.all([
      fetch(
        `${SUPABASE_URL}/rest/v1/profiles?select=id,role,is_paid,paid_until,paid_override,created_at&role=eq.user&limit=5000`,
        { headers: svc, cache: "no-store" }
      ),
      fetch(
        `${SUPABASE_URL}/rest/v1/activity_events?select=user_id,event,created_at&created_at=gte.${encodeURIComponent(since)}&user_id=not.is.null&order=created_at.desc&limit=10000`,
        { headers: svc, cache: "no-store" }
      ),
    ]);

    const profiles: ProfileRow[] = profilesRes.ok ? await profilesRes.json() : [];
    const events: EventRow[] = eventsRes.ok ? await eventsRes.json() : [];

    const profileIds = new Set(profiles.map((p) => p.id));
    const activeIds = new Set<string>();
    const eventCounts = new Map<string, number>();
    const lastActive = new Map<string, string>();

    for (const e of events) {
      if (!e.user_id || !profileIds.has(e.user_id) || !ACTIVE_EVENTS.has(e.event)) continue;
      activeIds.add(e.user_id);
      eventCounts.set(e.user_id, (eventCounts.get(e.user_id) ?? 0) + 1);
      const prev = lastActive.get(e.user_id);
      if (!prev || e.created_at > prev) lastActive.set(e.user_id, e.created_at);
    }

    const paidIds = new Set<string>();
    const activePaidIds = new Set<string>();
    const activeUnpaidIds = new Set<string>();
    let newUsers14d = 0;

    for (const p of profiles) {
      if (p.created_at && p.created_at >= since) newUsers14d++;
      const paid = paidActive(p);
      const active = activeIds.has(p.id);
      if (paid) paidIds.add(p.id);
      if (paid && active) activePaidIds.add(p.id);
      if (active && !paid) activeUnpaidIds.add(p.id);
    }

    const registered = profiles.length;
    const paid = paidIds.size;
    const active = activeIds.size;
    const paidActiveCount = activePaidIds.size;
    const paidInactive = paid - paidActiveCount;
    const activeUnpaid = activeUnpaidIds.size;
    const registeredOnly = registered - new Set([...paidIds, ...activeIds]).size;

    const metrics = {
      windowDays: ACTIVE_DAYS,
      activeDefinition:
        "Active = registered user with at least one meaningful in-app action in the window: login, in-app page view, import, or bank connect/sync/link. Not 'online now'.",
      registeredUsers: registered,
      paidUsers: paid,
      activeUsers: active,
      paidAndActive: paidActiveCount,
      paidButInactive: paidInactive,
      activeButUnpaid: activeUnpaid,
      registeredOnlyNoPaidNoActivity: registeredOnly,
      newUsersInWindow: newUsers14d,
      rates: {
        paidRate: pct(paid, registered),
        activeRate: pct(active, registered),
        paidToActiveRate: pct(paidActiveCount, paid),
        activeToPaidRate: pct(paidActiveCount, active),
        paidInactiveRate: pct(paidInactive, paid),
      },
      topActiveUsersByEvents: [...eventCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([userId, count]) => ({ userId, events: count })),
    };

    const { ai, aiError } = await groqVariance(metrics);

    return NextResponse.json({
      metrics,
      ai,
      aiError,
      generatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
