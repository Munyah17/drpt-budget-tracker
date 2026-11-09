import { NextRequest, NextResponse } from "next/server";
import { verifySupabaseJwt } from "@/lib/server/jwt";
import { sbInsert } from "@/lib/server/supabaseAdmin";
import { notifyAdmin } from "@/lib/server/notify";

/**
 * POST /api/support — client support message → support_messages row + admin email.
 *
 * Callers:
 *  - logged-in users: Bearer JWT → user_key = profile id, verified email
 *  - the local admin:  x-admin-email header
 *  - logged-out visitors: name + email fields in the body (unverified)
 */

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "munyamuzvidziwa19@gmail.com").toLowerCase();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Same per-IP limiter shape as /api/notify (10 messages / minute).
const hits = new Map<string, { n: number; reset: number }>();
function throttled(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.reset) {
    hits.set(ip, { n: 1, reset: now + 60_000 });
    return false;
  }
  rec.n += 1;
  return rec.n > 10;
}

interface Sender {
  userKey: string | null;
  email: string;
  verified: boolean;
}

/** Identity: verified JWT user or admin header; null → anonymous body fields. */
function resolveSender(req: NextRequest): Sender | null | "anonymous" {
  const headerEmail = (req.headers.get("x-admin-email") ?? "").toLowerCase();
  if (headerEmail && headerEmail === ADMIN_EMAIL) {
    return { userKey: `admin:${ADMIN_EMAIL}`, email: ADMIN_EMAIL, verified: true };
  }
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!token || !jwtSecret) return "anonymous";
  const claims = verifySupabaseJwt(token, jwtSecret);
  const uid = typeof claims?.sub === "string" ? claims.sub : "";
  if (!claims || claims.aud !== "authenticated" || !UUID_RE.test(uid)) return "anonymous";
  return {
    userKey: uid,
    email: typeof claims.email === "string" ? claims.email : "",
    verified: true,
  };
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (throttled(ip)) {
    return NextResponse.json({ ok: false, error: "rate limited" }, { status: 429 });
  }

  let body: { subject?: string; message?: string; name?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  const subject = String(body.subject ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, 140);
  const message = String(body.message ?? "").trim().slice(0, 4000);
  if (!subject || !message) {
    return NextResponse.json({ ok: false, error: "subject and message are required" }, { status: 400 });
  }

  const sender = resolveSender(req);
  const isAnon = sender === "anonymous";
  const name = String(body.name ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, 120);
  const email = isAnon ? String(body.email ?? "").trim().toLowerCase().slice(0, 160) : (sender?.email ?? "");
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "a valid reply email is required" }, { status: 400 });
  }

  // Persist first — the inbox works even when SMTP is down.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let saved = false;
  if (serviceKey) {
    const row = await sbInsert("support_messages", {
      user_key: isAnon ? null : sender?.userKey,
      user_email: email,
      user_name: name || null,
      subject,
      message,
      status: "open",
    });
    saved = row !== null;
  }

  const mailed = await notifyAdmin("support_message", {
    email,
    name: name || undefined,
    detail: `${subject} — ${message.slice(0, 220)}`,
  });

  return NextResponse.json({ ok: saved || mailed });
}

export const runtime = "nodejs";
