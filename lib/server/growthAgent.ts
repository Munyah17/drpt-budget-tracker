/**
 * Growth Agent — the app's autonomous sales/marketing admin.
 *
 * Scores prospects by intent from activity_events + profiles, writes a
 * personalised outreach email per hot lead (Groq, template fallback),
 * sends it through the SMTP relay, logs every touch to sales_outreach,
 * and mails the admin a daily digest of what it did and who's still hot.
 *
 * Runs from /api/growth/run (Vercel cron) or manually via /api/admin/growth.
 * Server-only — never import from client components.
 */
import { sbGet, sbInsert, sbPatch } from "./supabaseAdmin";
import { sendMail } from "./notify";
import { emailLayout, detailTable, highlightBox, BRAND } from "./emailTemplate";
import { APP_URL } from "./appUrl";
import { paidActive } from "../paid";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

const DAY = 24 * 60 * 60 * 1000;
const EVENT_WINDOW_DAYS = 30;
const SEND_THRESHOLD = 50;
const MAX_TOUCHES = 3;
const COOLDOWN_DAYS = 4;
const MAX_DAILY = Math.max(1, Number(process.env.SALES_MAX_DAILY ?? 10) || 10);

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

export interface ScoredLead {
  key: string;
  email: string | null;
  name: string | null;
  score: number;
  signals: string[];
  paid: boolean;
  role: string | null;
  /** No email on file — can be chased by the digest but not auto-emailed. */
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

  const leads: ScoredLead[] = [...buckets.values()].map((b) => {
    const paid = b.profile ? paidActive(b.profile) : false;
    const role = b.profile?.role ?? null;
    const hist = byKey.get(b.key);
    return {
      key: b.key,
      email: b.email,
      name: b.name,
      score: b.score,
      signals: [...new Set(b.signals)].slice(0, 6),
      paid,
      role,
      anonymous: !b.email,
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
/* State                                                               */
/* ------------------------------------------------------------------ */

async function getState(): Promise<AgentState | null> {
  const rows = await sbGet<AgentState>(
    "sales_agent_state",
    "select=enabled,last_run_at,last_digest_at,sent_today,sent_today_date&id=eq.1"
  );
  return rows[0] ?? null;
}

/* ------------------------------------------------------------------ */
/* The run                                                             */
/* ------------------------------------------------------------------ */

export interface RunResult {
  skipped?: string;
  leadsScored?: number;
  eligible?: number;
  emailed?: number;
  failed?: number;
  digestSent?: boolean;
  cappedBy?: string;
}

export async function runGrowthAgent(opts: { manual?: boolean } = {}): Promise<RunResult> {
  const state = await getState();
  if (state && !state.enabled && !opts.manual) {
    return { skipped: "disabled" };
  }

  const { leads, funnel24h } = await collectLeads();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const alreadyToday = state?.sent_today_date === today ? (state.sent_today ?? 0) : 0;
  const remaining = Math.max(0, MAX_DAILY - alreadyToday);

  const eligible = leads.filter((l) => {
    if (!l.email || l.anonymous || l.paid) return false;
    if (l.role && l.role !== "user") return false;
    if (l.score < SEND_THRESHOLD) return false;
    if (l.touches >= MAX_TOUCHES) return false;
    if (l.lastContactAt && now.getTime() - Date.parse(l.lastContactAt) < COOLDOWN_DAYS * DAY) return false;
    return true;
  });

  const batch = eligible.slice(0, remaining);
  const emailed: ScoredLead[] = [];
  let failed = 0;

  for (const lead of batch) {
    const copy = (await groqSalesCopy(lead)) ?? templateSalesCopy(lead);
    const bodyHtml =
      `<p>${esc(copy.body).replace(/\n/g, "<br>")}</p>` +
      highlightBox(
        `Questions? Just reply to this email — a human reads every message.`,
        BRAND.roseSoft
      );
    const html = emailLayout({
      badge: "Growth",
      emoji: "👋",
      title: copy.subject,
      bodyHtml,
      cta: {
        label: "Open WellSpend",
        url: lead.role || lead.signals.some((s) => s.includes("account")) ? `${APP_URL}/login` : `${APP_URL}/register`,
      },
      footerNote: "You got this because you showed interest in WellSpend.",
      preheader: copy.subject,
    });

    const ok = lead.email
      ? await sendMail({ to: lead.email, subject: copy.subject, text: copy.body, html })
      : false;

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

    if (ok) emailed.push(lead);
    else failed++;
  }

  // ---- Daily digest to the admin -------------------------------------
  let digestSent = false;
  const digestDue = !state?.last_digest_at || state.last_digest_at.slice(0, 10) < today;
  if (digestDue) {
    const to = process.env.NOTIFY_TO || process.env.SMTP_USER || "";
    if (to) {
      const hotUncontacted = leads
        .filter((l) => l.score >= SEND_THRESHOLD && l.touches < MAX_TOUCHES)
        .slice(0, 10);
      const funnelRows: Array<[string, string]> = [
        ["Sign-ups (24h)", String(funnel24h.signup ?? 0)],
        ["Demo starts (24h)", String(funnel24h.demo_start ?? 0)],
        ["Failed payments (24h)", String(funnel24h.payment_failed ?? 0)],
        ["Logins (24h)", String(funnel24h.login ?? 0)],
        ["Leads scored", String(leads.length)],
        ["Emails sent today", String(emailed.length + alreadyToday)],
      ];

      const sentRows = emailed.length
        ? emailed
            .map((l) => `<tr><td style="padding:8px 10px;border-bottom:1px solid ${BRAND.border};font-size:13px">${esc(l.email ?? l.key)}</td><td style="padding:8px 10px;border-bottom:1px solid ${BRAND.border};font-size:13px;text-align:right">${l.score}</td><td style="padding:8px 10px;border-bottom:1px solid ${BRAND.border};font-size:12px;color:${BRAND.inkFaint}">${esc(l.signals[0] ?? "—")}</td></tr>`)
            .join("")
        : `<tr><td colspan="3" style="padding:10px;font-size:13px;color:${BRAND.inkFaint}">No emails went out this run.</td></tr>`;

      const hotRows = hotUncontacted.length
        ? hotUncontacted
            .map((l) => `<tr><td style="padding:8px 10px;border-bottom:1px solid ${BRAND.border};font-size:13px">${esc(l.email ?? l.key)}${l.anonymous ? ' <span style="color:' + BRAND.amber + '">(no email)</span>' : ""}</td><td style="padding:8px 10px;border-bottom:1px solid ${BRAND.border};font-size:13px;text-align:right">${l.score}</td><td style="padding:8px 10px;border-bottom:1px solid ${BRAND.border};font-size:12px;color:${BRAND.inkFaint}">${esc(l.signals.slice(0, 2).join("; ") || "—")}</td></tr>`)
            .join("")
        : `<tr><td colspan="3" style="padding:10px;font-size:13px;color:${BRAND.inkFaint}">Pipeline is quiet.</td></tr>`;

      const table = (head: string, rows: string) =>
        `<p style="margin:18px 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${BRAND.inkFaint}">${esc(head)}</p>` +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BRAND.border};border-radius:10px;overflow:hidden">${rows}</table>`;

      const html = emailLayout({
        badge: "Growth Agent",
        emoji: "📈",
        title: "Daily growth digest",
        bodyHtml:
          `<p>The agent scored <strong>${leads.length}</strong> prospects and emailed <strong>${emailed.length}</strong> this run${failed ? ` (${failed} failed)` : ""}.</p>` +
          detailTable(funnelRows) +
          table("Emailed today", sentRows) +
          table("Hot leads still in play", hotRows) +
          highlightBox(`Review the full pipeline at <a href="${APP_URL}/admin/growth" style="color:${BRAND.rose}">Admin → Growth Agent</a>.`, BRAND.roseSoft),
        cta: { label: "Open Growth Agent", url: `${APP_URL}/admin/growth` },
        footerNote: "WellSpend Growth Agent — automated sales & marketing admin",
        preheader: `Growth digest: ${emailed.length} emails sent, ${hotUncontacted.length} hot leads in play.`,
      });

      const text =
        `Growth Agent daily digest\n\n` +
        `Scored ${leads.length} prospects; emailed ${emailed.length} this run${failed ? ` (${failed} failed)` : ""}.\n\n` +
        funnelRows.map(([k, v]) => `${k}: ${v}`).join("\n") +
        `\n\nHot leads still in play:\n` +
        hotUncontacted.map((l) => `- ${l.email ?? l.key} (score ${l.score}) — ${l.signals.slice(0, 2).join("; ") || "—"}`).join("\n") +
        `\n\n${APP_URL}/admin/growth`;

      digestSent = await sendMail({
        to,
        subject: `[WellSpend] Growth digest — ${emailed.length} sent, ${hotUncontacted.length} hot leads`,
        text,
        html,
      });
    }
  }

  // ---- Persist state ---------------------------------------------------
  await sbPatch("sales_agent_state", "id=eq.1", {
    last_run_at: now.toISOString(),
    last_digest_at: digestSent ? now.toISOString() : state?.last_digest_at ?? null,
    sent_today: alreadyToday + emailed.length,
    sent_today_date: today,
    updated_at: now.toISOString(),
  });

  return {
    leadsScored: leads.length,
    eligible: eligible.length,
    emailed: emailed.length,
    failed,
    digestSent,
    cappedBy: eligible.length > batch.length ? "daily_cap" : undefined,
  };
}
