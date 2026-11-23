/**
 * Growth Agent — the app's sales/marketing copilot.
 *
 * Scores prospects by intent from activity_events + profiles, keeps paid
 * customers in a separate protected tier, and surfaces who's ready to
 * email. NOTHING sends automatically — the admin clicks "Email" on a
 * pipeline lead and sendLeadEmail() writes the personalised copy (Groq,
 * template fallback), sends via SMTP and logs the touch to
 * sales_outreach. A daily digest + weekly Devin Cloud research keep the
 * pipeline fed.
 *
 * Runs from /api/growth/run (Vercel cron) or manually via /api/admin/growth.
 * Server-only — never import from client components.
 */
import { sbGet, sbInsert, sbPatch } from "./supabaseAdmin";
import { sendMail } from "./notify";
import { emailLayout, detailTable, highlightBox, BRAND } from "./emailTemplate";
import { APP_URL } from "./appUrl";
import { paidActive } from "../paid";
import { devinConfigured, devinCreateSession, devinGetSession } from "./devinResearch";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

const DAY = 24 * 60 * 60 * 1000;
const EVENT_WINDOW_DAYS = 30;
const SEND_THRESHOLD = 50;
const MAX_TOUCHES = 3;
const COOLDOWN_DAYS = 4;

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface ActivityEvent {
  event: string;
  path: string | null;
  visitor_id: string | null;
  user_id: string | null;
  user_email: string | null;
  created_at: string;
}

interface ProfileRow {
  id: string;
  email: string | null;
  name: string | null;
  role: string | null;
  is_paid: boolean | null;
  paid_until: string | null;
  paid_override: string | null;
  created_at: string | null;
}

interface OutreachRow {
  lead_key: string;
  status: string;
  created_at: string;
}

/** Pipeline segmentation — who the lead is to the business. */
export type LeadTier = "customer" | "warm" | "dormant" | "anonymous";

export interface ScoredLead {
  key: string;
  email: string | null;
  name: string | null;
  score: number;
  signals: string[];
  paid: boolean;
  role: string | null;
  tier: LeadTier;
  /** No email on file — surfaced in the digest, can't be click-to-send. */
  anonymous: boolean;
  lastSeen: string;
  touches: number;
  lastContactAt: string | null;
}

export interface AgentState {
  enabled: boolean;
  last_run_at: string | null;
  last_digest_at: string | null;
  sent_today: number;
  sent_today_date: string | null;
  research_session_id?: string | null;
  research_launched_at?: string | null;
  research_status?: string | null;
  research_last_digest_at?: string | null;
}

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */

const EVENT_SCORE: Record<string, number> = {
  demo_start: 40,
  corp_interest: 50,
  payment_failed: 35,
  payment: 60, // converted — the paid check excludes these anyway
  signup: 25,
  bank_paywall: 20,
  signup_failed: 15,
  login: 5,
};

const EVENT_SIGNAL: Record<string, string> = {
  demo_start: "Tried the product demo",
  corp_interest: "Asked about the corporate plan",
  payment_failed: "Payment failed at checkout",
  payment: "Completed a payment",
  signup: "Created an account",
  bank_paywall: "Hit the paid-feature wall",
  signup_failed: "Sign-up attempt failed",
  login: "Signed in",
};

interface LeadBucket {
  key: string;
  email: string | null;
  name: string | null;
  userId: string | null;
  visitorId: string | null;
  score: number;
  signals: string[];
  seen: Set<string>;
  viewCount: number;
  lastSeen: string;
  profile: ProfileRow | null;
}

const clip = (v: unknown, max = 300): string | null =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function fetchEvents(): Promise<ActivityEvent[]> {
  const since = new Date(Date.now() - EVENT_WINDOW_DAYS * DAY).toISOString();
  return sbGet<ActivityEvent>(
    "activity_events",
    `select=event,path,visitor_id,user_id,user_email,created_at` +
      `&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=5000`
  );
}

/** Group funnel events into per-person lead buckets and score them. */
export async function collectLeads(): Promise<{ leads: ScoredLead[]; funnel24h: Record<string, number> }> {
  const events = await fetchEvents();
  const funnel24h: Record<string, number> = {};
  const dayAgo = Date.now() - DAY;

  const buckets = new Map<string, LeadBucket>();
  const userIds = new Set<string>();
  // visitor_id → email, learned from events that carry both (signup,
  // login, payment…). Events are newest-first so a pre-signup demo visit
  // still folds into the person's email bucket once they've identified.
  const visitorEmail = new Map<string, string>();
  for (const e of events) {
    const em = clip(e.user_email, 200)?.toLowerCase();
    if (em && e.visitor_id) visitorEmail.set(e.visitor_id, em);
  }

  for (const e of events) {
    const at = Date.parse(e.created_at);
    if (Number.isFinite(at) && at >= dayAgo) {
      funnel24h[e.event] = (funnel24h[e.event] ?? 0) + 1;
    }

    // Identity: a known email beats a user id beats an anonymous visitor id.
    const direct = clip(e.user_email, 200)?.toLowerCase() ?? null;
    const email = direct ?? (e.visitor_id ? visitorEmail.get(e.visitor_id) ?? null : null);
    const key = email ? `e:${email}` : e.user_id ? `u:${e.user_id}` : e.visitor_id ? `v:${e.visitor_id}` : null;
    if (!key) continue;
    if (e.user_id) userIds.add(e.user_id);

    let b = buckets.get(key);
    if (!b) {
      b = {
        key, email, name: null, userId: e.user_id ?? null, visitorId: e.visitor_id ?? null,
        score: 0, signals: [], seen: new Set(), viewCount: 0, lastSeen: e.created_at, profile: null,
      };
      buckets.set(key, b);
    }
    if (!b.email && email) b.email = email;
    if (!b.userId && e.user_id) b.userId = e.user_id;
    if (!b.visitorId && e.visitor_id) b.visitorId = e.visitor_id;
    if (e.created_at > b.lastSeen) b.lastSeen = e.created_at;

    // Score the event once per bucket.
    if (!b.seen.has(e.event)) {
      b.seen.add(e.event);
      const pts = EVENT_SCORE[e.event];
      if (pts) {
        b.score += pts;
        const label = EVENT_SIGNAL[e.event];
        if (label) b.signals.push(label);
      }
    }

    // Path signals on page_view.
    if (e.event === "page_view" || e.event === "landing_view") b.viewCount += 1;
    if (e.event === "page_view" && e.path && !b.seen.has(`path:${e.path}`)) {
      b.seen.add(`path:${e.path}`);
      if (e.path.includes("/payment")) {
        b.score += 15;
        b.signals.push("Visited the payment page");
      } else if (e.path.includes("/register") || e.path.includes("/login")) {
        b.score += 5;
        b.signals.push("Visited sign-up / sign-in");
      } else {
        b.score += 1;
      }
    }
  }

  // Repeat-visit bonus (capped) and profile merge.
  const ids = [...userIds];
  const profiles = new Map<string, ProfileRow>();
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100).map(encodeURIComponent).join(",");
    const rows = await sbGet<ProfileRow>(
      "profiles",
      `select=id,email,name,role,is_paid,paid_until,paid_override,created_at&id=in.(${chunk})`
    );
    for (const p of rows) profiles.set(p.id, p);
  }

  for (const b of buckets.values()) {
    if (b.viewCount >= 3) {
      b.score += Math.min(10, b.viewCount);
      b.signals.push(`Came back ${b.viewCount} times`);
    }

    if (b.userId) {
      const p = profiles.get(b.userId) ?? null;
      b.profile = p;
      if (p) {
        if (!b.email && p.email) b.email = p.email.toLowerCase();
        if (!b.name && p.name) b.name = p.name;
        // Registered-but-unpaid is itself a strong buying signal.
        if (!paidActive(p) && (p.role === "user" || !p.role)) {
          b.score += 20;
          b.signals.push("Has an account but never subscribed");
          const ageDays = p.created_at ? (Date.now() - Date.parse(p.created_at)) / DAY : 999;
          if (ageDays <= 7) {
            b.score += 10;
            b.signals.push("Signed up this week");
          }
        }
      }
    }
  }

  // Outreach history → touches + last contact per lead.
  const outreach = await sbGet<OutreachRow>(
    "sales_outreach",
    "select=lead_key,status,created_at&status=eq.sent&order=created_at.desc&limit=2000"
  );
  const byKey = new Map<string, { touches: number; last: string | null }>();
  for (const o of outreach) {
    const cur = byKey.get(o.lead_key) ?? { touches: 0, last: null };
    cur.touches += 1;
    if (!cur.last || o.created_at > cur.last) cur.last = o.created_at;
    byKey.set(o.lead_key, cur);
  }

  // Dormant sweep — registered users whose account exists but who have no
  // funnel events in the window: they signed up once, then went quiet.
  // The win-back segment — listed for the digest, kept under the send
  // threshold on purpose (a cold "we miss you" needs human judgement).
  const dormantProfiles = await sbGet<ProfileRow>(
    "profiles",
    `select=id,email,name,role,is_paid,paid_until,paid_override,created_at` +
      `&role=eq.user&created_at=gte.${encodeURIComponent(new Date(Date.now() - 120 * DAY).toISOString())}` +
      `&order=created_at.desc&limit=500`
  );
  const bucketUserIds = new Set(
    [...buckets.values()].map((b) => b.userId).filter((x): x is string => !!x)
  );
  const dormantKeys = new Set<string>();
  for (const p of dormantProfiles) {
    if (bucketUserIds.has(p.id) || paidActive(p)) continue;
    const key = `u:${p.id}`;
    dormantKeys.add(key);
    buckets.set(key, {
      key,
      email: p.email?.toLowerCase() ?? null,
      name: p.name ?? null,
      userId: p.id,
      visitorId: null,
      score: 45,
      signals: ["Signed up but never came back"],
      seen: new Set(),
      viewCount: 0,
      lastSeen: p.created_at ?? new Date(0).toISOString(),
      profile: p,
    });
  }

  // Paid sweep — existing clients are surfaced for visibility but are
  // permanently excluded from outreach. We grow NEW users; we never
  // disturb paying customers with acquisition messaging.
  const paidProfiles = await sbGet<ProfileRow>(
    "profiles",
    `select=id,email,name,role,is_paid,paid_until,paid_override,created_at` +
      `&and=(or=(is_paid.eq.true,paid_override.eq.paid),or=(role.eq.user,role.eq.corporate,role.is.null))` +
      `&order=created_at.desc&limit=300`
  );
  // Dedupe against event-sourced buckets by user id AND email — a paying
  // customer must never surface twice (once as prospect, once as client).
  const seenUserIds = new Set([...buckets.values()].map((b) => b.userId).filter((x): x is string => !!x));
  const seenEmails = new Set([...buckets.values()].map((b) => b.email?.toLowerCase()).filter((x): x is string => !!x));
  for (const p of paidProfiles) {
    if (!paidActive(p)) continue;
    const pEmail = p.email?.toLowerCase() ?? null;
    if (seenUserIds.has(p.id) || (pEmail && seenEmails.has(pEmail))) continue;
    const key = `u:${p.id}`;
    buckets.set(key, {
      key,
      email: p.email?.toLowerCase() ?? null,
      name: p.name ?? null,
      userId: p.id,
      visitorId: null,
      score: 0,
      signals: ["Paying customer"],
      seen: new Set(),
      viewCount: 0,
      lastSeen: p.created_at ?? new Date(0).toISOString(),
      profile: p,
    });
  }

  // Emails proven paid — catches prospects whose events carried an email
  // but no user_id (profile never merged, so paid status was unknown).
  const paidEmails = new Set(
    paidProfiles.filter(paidActive).map((p) => p.email?.toLowerCase()).filter((x): x is string => !!x)
  );

  const leads: ScoredLead[] = [...buckets.values()].map((b) => {
    const paid = (b.profile ? paidActive(b.profile) : false) || (!!b.email && paidEmails.has(b.email.toLowerCase()));
    const role = b.profile?.role ?? null;
    const hist = byKey.get(b.key);
    const anonymous = !b.email;
    const tier: LeadTier = paid
      ? "customer"
      : anonymous
        ? "anonymous"
        : dormantKeys.has(b.key)
          ? "dormant"
          : "warm";
    return {
      key: b.key,
      email: b.email,
      name: b.name,
      score: b.score,
      signals: [...new Set(b.signals)].slice(0, 6),
      paid,
      role,
      tier,
      anonymous,
      lastSeen: b.lastSeen,
      touches: hist?.touches ?? 0,
      lastContactAt: hist?.last ?? null,
    };
  });

  leads.sort((a, b) => b.score - a.score);
  return { leads, funnel24h };
}

/* ------------------------------------------------------------------ */
/* AI copy                                                             */
/* ------------------------------------------------------------------ */

function leadContextForPrompt(l: ScoredLead): string {
  return JSON.stringify({
    name: l.name,
    email: l.email,
    intentScore: l.score,
    signals: l.signals,
    lastActive: l.lastSeen.slice(0, 10),
    hasAccount: !!l.role || l.signals.some((s) => s.includes("account")),
  });
}

async function groqSalesCopy(l: ScoredLead): Promise<{ subject: string; body: string } | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are the growth assistant for WellSpend, a personal budget tracker web app (wellspend.site). " +
              "Write a short re-engagement email to a prospect who showed buying intent but hasn't subscribed. " +
              "Rules: under 120 words, warm and direct, reference their specific signals naturally, exactly one " +
              "call-to-action linking to the app, no hype words, no false claims, no emoji. " +
              'Reply with ONLY JSON: {"subject": "...", "body": "..."} — body is plain text with \\n line breaks.',
          },
          { role: "user", content: `Prospect context: ${leadContextForPrompt(l)}` },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(content);
    const subject = clip(parsed?.subject, 140);
    const body = clip(parsed?.body, 4000);
    return subject && body ? { subject, body } : null;
  } catch {
    return null;
  }
}

/** Deterministic fallback when Groq is unavailable — still on-brand. */
function templateSalesCopy(l: ScoredLead): { subject: string; body: string } {
  const first = (l.name ?? "").split(" ")[0];
  const hi = first ? `Hi ${first},` : "Hi,";
  const hasAccount = l.role !== null || l.signals.some((s) => s.includes("account"));
  const cta = hasAccount ? `${APP_URL}/login` : `${APP_URL}/register`;

  let hook: string;
  if (l.signals.includes("Asked about the corporate plan")) {
    hook = "You looked at WellSpend for teams — I'd love to show you what corporate rollout looks like for a small team.";
  } else if (l.signals.includes("Payment failed at checkout")) {
    hook = "Your checkout hit a snag last time — that happens, and it's usually a 2-minute fix. I'd rather help than lose you.";
  } else if (l.signals.includes("Tried the product demo")) {
    hook = "You tried the WellSpend demo — most people who do end up keeping it. Your budgeting data is one click away from being live.";
  } else if (l.signals.includes("Has an account but never subscribed")) {
    hook = "Your WellSpend account is ready and waiting — activating takes about two minutes, and your first budget is free to set up.";
  } else if (l.signals.includes("Hit the paid-feature wall")) {
    hook = "You hit the premium wall while exploring — fair enough. Here's the short version of what the paid plan unlocks.";
  } else {
    hook = "You showed interest in WellSpend a little while back — wanted to check in and see if now's a better time.";
  }

  return {
    subject: "Quick follow-up from WellSpend",
    body:
      `${hi}\n\n${hook}\n\n` +
      `WellSpend tracks income, expenses, bills and goals in one calm dashboard — built for people who want ` +
      `clarity, not another spreadsheet.\n\n` +
      `If it's still on your list: ${cta}\n\n` +
      `Either way — good luck with the budgeting.\n\n— The WellSpend team`,
  };
}

/* ------------------------------------------------------------------ */
/* Devin Cloud market research                                         */
/* ------------------------------------------------------------------ */

const RESEARCH_INTERVAL = 7 * DAY;

const RESEARCH_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    summary: { type: "string", description: "2-3 sentence market summary" },
    threads: {
      type: "array",
      items: {
        type: "object",
        properties: {
          platform: { type: "string" },
          title: { type: "string" },
          url: { type: "string" },
          pain_point: { type: "string" },
          relevance: { type: "string" },
          draft_reply: { type: "string" },
        },
        required: ["platform", "title", "url", "pain_point"],
      },
    },
    communities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          url: { type: "string" },
          why: { type: "string" },
        },
        required: ["name", "why"],
      },
    },
    competitor_insights: { type: "array", items: { type: "string" } },
    content_ideas: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "threads"],
};

const RESEARCH_PROMPT = `You are a market researcher for WellSpend (wellspend.site), a personal budget tracker web app with a low-cost monthly subscription, aimed at ordinary consumers.

Research the PUBLIC internet for the last 7 days and find prospective customers — people who have NOT necessarily heard of WellSpend yet:

1. THREADS: public posts/comments where people ask for budgeting help, recommend budgeting apps, complain about existing apps (Mint shutdown, YNAB cost, EveryDollar, spreadsheets), or describe money-management pain. Check Reddit (r/personalfinance, r/budgeting, r/povertyfinance, r/finanzen, country subs), X/Twitter, public Facebook group posts, TikTok/YouTube comments, app store reviews. For each: platform, title, URL, the pain point, why WellSpend is relevant, and a DRAFT reply the founder could post (genuinely helpful, no spam, no links unless the community allows them).
2. COMMUNITIES: budgeting/money forums, subreddits, Facebook groups, Discord servers worth joining — name, URL, why.
3. COMPETITOR INSIGHTS: what users complain about in rival budgeting apps this week.
4. CONTENT IDEAS: 3 short-form content ideas (TikTok/Reels/Shorts) that would attract budget-conscious users.

Research only — do NOT post, comment, message, or sign up anywhere. Update the structured output as you find things.`;

/**
 * Weekly rhythm inside the daily run: launch a Devin session when none is
 * active and the last launch is >7 days old; collect + email findings when
 * a session finishes. Devin sessions take minutes–hours so this is
 * deliberately two-phase across runs.
 */
async function researchTick(
  state: AgentState | null,
  now: Date
): Promise<{ note?: string; findingsEmailed?: boolean }> {
  if (!devinConfigured()) return {};

  const sid = state?.research_session_id ?? null;
  if (sid) {
    const s = await devinGetSession(sid);
    if (!s) return { note: "research_check_failed" };
    if (!["finished", "blocked", "expired", "suspend"].includes(s.status_enum)) {
      return { note: `research_${s.status_enum}` };
    }
    if (s.status_enum === "finished" && s.structured_output) {
      const to = process.env.NOTIFY_TO || process.env.SMTP_USER || "";
      if (to) {
        const f = s.structured_output;
        const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
        const threads = arr(f.threads).slice(0, 12);
        const communities = arr(f.communities).slice(0, 8);
        const insights = arr(f.competitor_insights).slice(0, 8);
        const ideas = arr(f.content_ideas).slice(0, 5);

        const escH = (v: unknown) => esc(String(v ?? ""));
        const link = (u: unknown, label: unknown) =>
          typeof u === "string" && u.startsWith("http")
            ? `<a href="${escH(u)}" style="color:${BRAND.rose}">${escH(label || u)}</a>`
            : escH(label || u);

        const threadRows = threads.length
          ? threads
              .map((t) => {
                const o = t as Record<string, unknown>;
                return `<tr>
                  <td style="padding:8px 10px;border-bottom:1px solid ${BRAND.border};font-size:12.5px">${escH(o.platform)}</td>
                  <td style="padding:8px 10px;border-bottom:1px solid ${BRAND.border};font-size:12.5px">${link(o.url, o.title)}<br><span style="color:${BRAND.inkFaint};font-size:11.5px">${escH(o.pain_point)}</span></td>
                  <td style="padding:8px 10px;border-bottom:1px solid ${BRAND.border};font-size:12px;color:${BRAND.inkSoft}">${escH(o.draft_reply ?? "—")}</td>
                </tr>`;
              })
              .join("")
          : `<tr><td colspan="3" style="padding:10px;font-size:13px;color:${BRAND.inkFaint}">No threads found this week.</td></tr>`;

        const listHtml = (items: unknown[]) =>
          items.length
            ? `<ul style="margin:6px 0;padding-left:18px;font-size:13px;line-height:1.7;color:${BRAND.inkSoft}">${items
                .map((i) => `<li>${escH(typeof i === "string" ? i : JSON.stringify(i))}</li>`)
                .join("")}</ul>`
            : `<p style="font-size:13px;color:${BRAND.inkFaint}">None this week.</p>`;

        const html = emailLayout({
          badge: "Devin Research",
          emoji: "🛰️",
          title: "Weekly prospect research",
          bodyHtml:
            `<p>${escH(f.summary)}</p>` +
            `<p style="margin:18px 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${BRAND.inkFaint}">Threads to engage</p>` +
            `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BRAND.border};border-radius:10px;overflow:hidden">${threadRows}</table>` +
            `<p style="margin:18px 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${BRAND.inkFaint}">Communities</p>` +
            listHtml(communities.map((c) => {
              const o = c as Record<string, unknown>;
              return `${link(o.url, o.name)} — ${o.why ?? ""}`;
            })) +
            `<p style="margin:18px 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${BRAND.inkFaint}">Competitor insights</p>` +
            listHtml(insights) +
            `<p style="margin:18px 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${BRAND.inkFaint}">Content ideas</p>` +
            listHtml(ideas),
          cta: { label: "Open Devin session", url: s.url || `${APP_URL}/admin/growth` },
          footerNote: "WellSpend Growth Agent — Devin Cloud prospect research",
          preheader: "Weekly prospecting findings from Devin Cloud.",
        });

        const ok = await sendMail({
          to,
          subject: `[WellSpend] Prospect research — ${threads.length} threads, ${communities.length} communities`,
          text:
            `Devin research digest\n\n${String(f.summary ?? "")}\n\n` +
            threads.map((t) => `- [${(t as Record<string, unknown>).platform}] ${(t as Record<string, unknown>).title} — ${(t as Record<string, unknown>).url}`).join("\n"),
          html,
        });
        await sbPatch("sales_agent_state", "id=eq.1", {
          research_session_id: null,
          research_status: "finished",
          research_last_digest_at: now.toISOString(),
          updated_at: now.toISOString(),
        });
        return { note: ok ? "research_digest_sent" : "research_digest_failed", findingsEmailed: ok };
      }
      await sbPatch("sales_agent_state", "id=eq.1", {
        research_session_id: null,
        research_status: "finished",
        updated_at: now.toISOString(),
      });
      return { note: "research_no_smtp" };
    }
    await sbPatch("sales_agent_state", "id=eq.1", {
      research_session_id: null,
      research_status: s.status_enum,
      updated_at: now.toISOString(),
    });
    return { note: `research_${s.status_enum}` };
  }

  const lastLaunch = state?.research_launched_at ? Date.parse(state.research_launched_at) : 0;
  if (now.getTime() - lastLaunch >= RESEARCH_INTERVAL) {
    const session = await devinCreateSession({
      prompt: RESEARCH_PROMPT,
      title: "WellSpend weekly prospect research",
      schema: RESEARCH_SCHEMA,
    });
    if (session) {
      await sbPatch("sales_agent_state", "id=eq.1", {
        research_session_id: session.session_id,
        research_launched_at: now.toISOString(),
        research_status: "launched",
        updated_at: now.toISOString(),
      });
      return { note: "research_launched" };
    }
    return { note: "research_launch_failed" };
  }
  return {};
}

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

async function getState(): Promise<AgentState | null> {
  const rows = await sbGet<AgentState>(
    "sales_agent_state",
    "select=enabled,last_run_at,last_digest_at,sent_today,sent_today_date,research_session_id,research_launched_at,research_status,research_last_digest_at&id=eq.1"
  );
  return rows[0] ?? null;
}

/* ------------------------------------------------------------------ */
/* The run                                                             */
/* ------------------------------------------------------------------ */

export interface RunResult {
  skipped?: string;
  leadsScored?: number;
  /** Prospects eligible for a manual click-to-send right now. */
  readyToSend?: number;
  digestSent?: boolean;
  research?: string;
  researchEmailed?: boolean;
}

/** True when a lead may receive outreach — shared by digest + manual send. */
function sendEligible(l: ScoredLead, now: Date): boolean {
  if (!l.email || l.anonymous || l.paid) return false;
  if (l.role && l.role !== "user") return false;
  if (l.score < SEND_THRESHOLD) return false;
  if (l.touches >= MAX_TOUCHES) return false;
  if (l.lastContactAt && now.getTime() - Date.parse(l.lastContactAt) < COOLDOWN_DAYS * DAY) return false;
  return true;
}

export async function runGrowthAgent(opts: { manual?: boolean } = {}): Promise<RunResult> {
  const state = await getState();
  if (state && !state.enabled && !opts.manual) {
    return { skipped: "disabled" };
  }

  const { leads, funnel24h } = await collectLeads();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  // No auto-send — outreach is 100% manual (click-to-send in the console).
  // This list is what the digest surfaces as "ready now".
  const readyToSend = leads.filter((l) => sendEligible(l, now));
  const alreadyToday = state?.sent_today_date === today ? (state.sent_today ?? 0) : 0;

  // ---- Daily digest to the admin -------------------------------------
  let digestSent = false;
  const digestDue = !state?.last_digest_at || state.last_digest_at.slice(0, 10) < today;
  if (digestDue) {
    const to = process.env.NOTIFY_TO || process.env.SMTP_USER || "";
    if (to) {
      // "In play" = warm prospects and anonymous hot visitors — paying
      // customers are a separate track and dormant signups get their own
      // win-back section below.
      const hotUncontacted = leads
        .filter((l) => l.tier !== "customer" && l.tier !== "dormant" && l.score >= SEND_THRESHOLD && l.touches < MAX_TOUCHES)
        .slice(0, 10);
      const dormant = leads.filter((l) => l.tier === "dormant").slice(0, 8);
      const customerCount = leads.filter((l) => l.tier === "customer").length;
      const funnelRows: Array<[string, string]> = [
        ["Sign-ups (24h)", String(funnel24h.signup ?? 0)],
        ["Demo starts (24h)", String(funnel24h.demo_start ?? 0)],
        ["Failed payments (24h)", String(funnel24h.payment_failed ?? 0)],
        ["Logins (24h)", String(funnel24h.login ?? 0)],
        ["Leads scored", String(leads.length)],
        ["Paying customers", String(customerCount)],
        ["Manual emails sent today", String(alreadyToday)],
      ];

      const readyRows = readyToSend.length
        ? readyToSend
            .slice(0, 10)
            .map((l) => `<tr><td style="padding:8px 10px;border-bottom:1px solid ${BRAND.border};font-size:13px">${esc(l.email ?? l.key)}</td><td style="padding:8px 10px;border-bottom:1px solid ${BRAND.border};font-size:13px;text-align:right">${l.score}</td><td style="padding:8px 10px;border-bottom:1px solid ${BRAND.border};font-size:12px;color:${BRAND.inkFaint}">${esc(l.signals.slice(0, 2).join("; ") || "—")}</td></tr>`)
            .join("")
        : `<tr><td colspan="3" style="padding:10px;font-size:13px;color:${BRAND.inkFaint}">Nobody is send-ready right now.</td></tr>`;

      const hotRows = hotUncontacted.length
        ? hotUncontacted
            .map((l) => `<tr><td style="padding:8px 10px;border-bottom:1px solid ${BRAND.border};font-size:13px">${esc(l.email ?? l.key)}${l.anonymous ? ' <span style="color:' + BRAND.amber + '">(no email)</span>' : ""}</td><td style="padding:8px 10px;border-bottom:1px solid ${BRAND.border};font-size:13px;text-align:right">${l.score}</td><td style="padding:8px 10px;border-bottom:1px solid ${BRAND.border};font-size:12px;color:${BRAND.inkFaint}">${esc(l.signals.slice(0, 2).join("; ") || "—")}</td></tr>`)
            .join("")
        : `<tr><td colspan="3" style="padding:10px;font-size:13px;color:${BRAND.inkFaint}">Pipeline is quiet.</td></tr>`;

      const dormantRows = dormant.length
        ? dormant
            .map((l) => `<tr><td style="padding:8px 10px;border-bottom:1px solid ${BRAND.border};font-size:13px">${esc(l.email ?? l.key)}</td><td style="padding:8px 10px;border-bottom:1px solid ${BRAND.border};font-size:12px;color:${BRAND.inkFaint}">signed up ${l.lastSeen.slice(0, 10)}</td><td style="padding:8px 10px;border-bottom:1px solid ${BRAND.border};font-size:12px;color:${BRAND.inkFaint}">${l.touches} touch${l.touches === 1 ? "" : "es"}</td></tr>`)
            .join("")
        : `<tr><td colspan="3" style="padding:10px;font-size:13px;color:${BRAND.inkFaint}">No dormant accounts.</td></tr>`;

      const table = (head: string, rows: string) =>
        `<p style="margin:18px 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${BRAND.inkFaint}">${esc(head)}</p>` +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BRAND.border};border-radius:10px;overflow:hidden">${rows}</table>`;

      const html = emailLayout({
        badge: "Growth Agent",
        emoji: "📈",
        title: "Daily growth digest",
        bodyHtml:
          `<p>The agent scored <strong>${leads.length}</strong> prospects — <strong>${readyToSend.length}</strong> are ready for you to email. Nothing goes out automatically; every send is your click.</p>` +
          detailTable(funnelRows) +
          table("Ready to send now", readyRows) +
          table("Hot leads still in play", hotRows) +
          table("Dormant — signed up, never returned (win-back)", dormantRows) +
          highlightBox(`Review the full pipeline at <a href="${APP_URL}/admin/growth" style="color:${BRAND.rose}">Admin → Growth Agent</a>.`, BRAND.roseSoft),
        cta: { label: "Open Growth Agent", url: `${APP_URL}/admin/growth` },
        footerNote: "WellSpend Growth Agent — sales pipeline, you press send",
        preheader: `Growth digest: ${readyToSend.length} leads ready to email, ${customerCount} customers protected.`,
      });

      const text =
        `Growth Agent daily digest\n\n` +
        `Scored ${leads.length} prospects; ${readyToSend.length} ready to email (manual send only).\n\n` +
        funnelRows.map(([k, v]) => `${k}: ${v}`).join("\n") +
        `\n\nReady to send now:\n` +
        readyToSend.slice(0, 10).map((l) => `- ${l.email ?? l.key} (score ${l.score}) — ${l.signals.slice(0, 2).join("; ") || "—"}`).join("\n") +
        `\n\nDormant (win-back):\n` +
        dormant.map((l) => `- ${l.email ?? l.key} — signed up ${l.lastSeen.slice(0, 10)}, ${l.touches} touches`).join("\n") +
        `\n\n${APP_URL}/admin/growth`;

      digestSent = await sendMail({
        to,
        subject: `[WellSpend] Growth digest — ${readyToSend.length} ready to send, ${customerCount} customers`,
        text,
        html,
      });
    }
  }

  // ---- Devin Cloud market research (launch / collect) ------------------
  const research = await researchTick(state, now);

  // ---- Persist state ---------------------------------------------------
  await sbPatch("sales_agent_state", "id=eq.1", {
    last_run_at: now.toISOString(),
    last_digest_at: digestSent ? now.toISOString() : state?.last_digest_at ?? null,
    sent_today: alreadyToday,
    sent_today_date: today,
    updated_at: now.toISOString(),
  });

  return {
    leadsScored: leads.length,
    readyToSend: readyToSend.length,
    digestSent,
    research: research.note,
    researchEmailed: research.findingsEmailed,
  };
}

/* ------------------------------------------------------------------ */
/* Manual click-to-send                                                 */
/* ------------------------------------------------------------------ */

export interface SendEmailResult {
  ok: boolean;
  error?: string;
  subject?: string;
}

async function bumpSentToday(): Promise<void> {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const state = await getState();
  const already = state?.sent_today_date === today ? (state.sent_today ?? 0) : 0;
  await sbPatch("sales_agent_state", "id=eq.1", {
    sent_today: already + 1,
    sent_today_date: today,
    updated_at: now.toISOString(),
  });
}

/**
 * Manual outreach � the admin clicks "Email" on a pipeline lead, we write
 * the personalised copy (Groq ? template fallback), send via SMTP and log
 * the touch. Nothing sends without this call.
 *
 * Guards: paying customers and anonymous visitors can never be mailed;
 * dormant signups are allowed below the hot-lead score threshold (win-back
 * is their whole point); touch cap + cooldown still apply so a misclick
 * can't turn into a spam loop.
 */
export async function sendLeadEmail(leadKey: string): Promise<SendEmailResult> {
  const { leads } = await collectLeads();
  const lead = leads.find((l) => l.key === leadKey);
  if (!lead) {
    return { ok: false, error: "Lead not found � the pipeline may have changed, refresh and retry" };
  }
  if (lead.paid || lead.tier === "customer") {
    return { ok: false, error: "Paying customers are excluded from outreach" };
  }
  if (lead.anonymous || !lead.email) {
    return { ok: false, error: "No email address on file for this lead" };
  }
  if (lead.role && lead.role !== "user") {
    return { ok: false, error: "Not a consumer prospect" };
  }

  const now = new Date();
  const scoreOk = lead.score >= SEND_THRESHOLD || lead.tier === "dormant";
  if (!scoreOk) {
    return { ok: false, error: `Score ${lead.score} is below the outreach threshold` };
  }
  if (lead.touches >= MAX_TOUCHES) {
    return { ok: false, error: `Touch limit reached (${MAX_TOUCHES})` };
  }
  if (lead.lastContactAt) {
    const waitMs = COOLDOWN_DAYS * DAY - (now.getTime() - Date.parse(lead.lastContactAt));
    if (waitMs > 0) {
      return { ok: false, error: `Cooldown � last contact was recent, try again in ~${Math.ceil(waitMs / DAY)}d` };
    }
  }

  const copy = (await groqSalesCopy(lead)) ?? templateSalesCopy(lead);
  const bodyHtml =
    `<p>${esc(copy.body).replace(/\n/g, "<br>")}</p>` +
    highlightBox(
      `Questions? Just reply to this email � a human reads every message.`,
      BRAND.roseSoft
    );
  const html = emailLayout({
    badge: "Growth",
    emoji: "??",
    title: copy.subject,
    bodyHtml,
    cta: {
      label: "Open WellSpend",
      url: lead.role || lead.signals.some((s) => s.includes("account")) ? `${APP_URL}/login` : `${APP_URL}/register`,
    },
    footerNote: "You got this because you showed interest in WellSpend.",
    preheader: copy.subject,
  });

  const ok = await sendMail({ to: lead.email, subject: copy.subject, text: copy.body, html });

  await sbInsert("sales_outreach", {
    lead_key: lead.key,
    email: lead.email,
    name: lead.name,
    intent_score: lead.score,
    signals: lead.signals,
    channel: "email",
    subject: copy.subject,
    body: copy.body,
    status: ok ? "sent" : "failed",
    error: ok ? null : "smtp send failed",
  });

  if (ok) await bumpSentToday();

  return ok
    ? { ok: true, subject: copy.subject }
    : { ok: false, error: "SMTP send failed � check mail server logs" };
}
