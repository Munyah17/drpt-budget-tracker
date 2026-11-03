import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/admin";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";

interface ActivityRow {
  event: string;
  path: string | null;
  visitor_id: string | null;
  user_id: string | null;
  user_email: string | null;
  created_at: string;
}

const DAY = 24 * 60 * 60 * 1000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/**
 * GET /api/admin/analytics — aggregated product-usage metrics for the admin
 * analytics page. Service-role reads; admin-only access.
 */
export async function GET(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  if (!(await isAdminRequest(req, serviceKey))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const svc = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
  const since = new Date(Date.now() - 30 * DAY).toISOString();

  try {
    const [eventsRes, profilesRes] = await Promise.all([
      fetch(
        `${SUPABASE_URL}/rest/v1/activity_events?select=event,path,visitor_id,user_id,user_email,created_at&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=5000`,
        { headers: svc, cache: "no-store" }
      ),
      fetch(`${SUPABASE_URL}/rest/v1/profiles?select=is_paid,created_at`, {
        headers: svc,
        cache: "no-store",
      }),
    ]);

    const events: ActivityRow[] = eventsRes.ok ? await eventsRes.json() : [];
    const profiles: { is_paid: boolean; created_at: string }[] = profilesRes.ok
      ? await profilesRes.json()
      : [];

    // ---- 14-day daily series ---------------------------------------------
    const days: { date: string; label: string; views: number; signups: number; payments: number; demos: number }[] = [];
    const dayIndex = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY);
      const date = dayKey(d);
      dayIndex.set(date, days.length);
      days.push({
        date,
        label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        views: 0,
        signups: 0,
        payments: 0,
        demos: 0,
      });
    }

    const totals = { views: 0, visitors: new Set<string>(), signups: 0, payments: 0, demos: 0, logins: 0, activeUsers: new Set<string>() };
    const pageCounts = new Map<string, number>();
    const recent: ActivityRow[] = [];

    events.forEach((e, i) => {
      const idx = dayIndex.get(dayKey(new Date(e.created_at)));
      const v = e.visitor_id || e.user_id || "anon";
      totals.visitors.add(v);
      if (e.user_id) totals.activeUsers.add(e.user_id);
      if (i < 60) recent.push(e);

      switch (e.event) {
        case "page_view":
        case "landing_view":
          totals.views++;
          if (idx !== undefined) days[idx].views++;
          if (e.path) pageCounts.set(e.path, (pageCounts.get(e.path) ?? 0) + 1);
          break;
        case "signup":
          totals.signups++;
          if (idx !== undefined) days[idx].signups++;
          break;
        case "payment":
          totals.payments++;
          if (idx !== undefined) days[idx].payments++;
          break;
        case "demo_start":
          totals.demos++;
          if (idx !== undefined) days[idx].demos++;
          break;
        case "login":
          totals.logins++;
          break;
      }
    });

    const topPages = [...pageCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, views]) => ({ path, views }));

    return NextResponse.json({
      totals: {
        views14d: totals.views,
        visitors14d: totals.visitors.size,
        activeUsers14d: totals.activeUsers.size,
        signups14d: totals.signups,
        payments14d: totals.payments,
        demos14d: totals.demos,
        logins14d: totals.logins,
        registeredUsers: profiles.length,
        paidUsers: profiles.filter((p) => p.is_paid === true).length,
      },
      days,
      topPages,
      recent,
    });
  } catch {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}

export const runtime = "nodejs";
