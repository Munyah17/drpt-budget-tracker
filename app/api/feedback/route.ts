import { NextRequest, NextResponse } from "next/server";
import { verifySupabaseJwt } from "@/lib/server/jwt";
import { sbInsert } from "@/lib/server/supabaseAdmin";
import { notifyAdmin } from "@/lib/server/notify";

/**
 * POST /api/feedback — customer suggestion / feedback / bug report.
 * Stored in customer_feedback and shown only in the Super Admin console.
 *
 * Identity: verified Supabase JWT when present; otherwise the x-admin-email
 * header (app users send their profile email) or anonymous body fields.
 */

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "munyamuzvidziwa19@gmail.com").toLowerCase();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const KINDS = new Set(["suggestion", "feedback", "bug"]);

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

function resolveSender(req: NextRequest): Sender | null {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (token && jwtSecret) {
    const claims = verifySupabaseJwt(token, jwtSecret);
    const uid = typeof claims?.sub === "string" ? claims.sub : "";
    if (claims && claims.aud === "authenticated" && UUID_RE.test(uid)) {
      return {
        userKey: uid,
        email: typeof claims.email === "string" ? claims.email : "",
        verified: true,
      };
    }
  }

  const headerEmail = (req.headers.get("x-admin-email") ?? "").trim().toLowerCase();
  if (headerEmail && EMAIL_RE.test(headerEmail)) {
    return {
      userKey: `email:${headerEmail}`,
      email: headerEmail,
      verified: headerEmail === ADMIN_EMAIL,
    };
  }
  return null;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (throttled(ip)) {
    return NextResponse.json({ ok: false, error: "rate limited" }, { status: 429 });
  }

  let body: {
    kind?: string;
    message?: string;
    page?: string;
    appVersion?: string;
    name?: string;
    email?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  const kind = String(body.kind ?? "").trim().toLowerCase();
  const message = String(body.message ?? "").trim().slice(0, 4000);
  const page = String(body.page ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, 300) || null;
  const appVersion = String(body.appVersion ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, 80) || null;
  const name = String(body.name ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, 120);

  if (!KINDS.has(kind)) {
    return NextResponse.json({ ok: false, error: "invalid kind" }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ ok: false, error: "message is required" }, { status: 400 });
  }

  const sender = resolveSender(req);
  const email = (sender?.email || String(body.email ?? "").trim().toLowerCase()).slice(0, 160);
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "a valid email is required" }, { status: 400 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let saved = false;
  if (serviceKey) {
    const row = await sbInsert("customer_feedback", {
      user_key: sender?.userKey ?? null,
      user_email: email,
      user_name: name || null,
      kind,
      message,
      page,
      app_version: appVersion,
      status: "new",
    });
    saved = row !== null;
  }

  const mailed = await notifyAdmin("feedback", {
    email,
    name: name || undefined,
    detail: `${kind} · ${page ?? "app"} — ${message.slice(0, 220)}`,
  });

  return NextResponse.json({ ok: saved || mailed });
}

export const runtime = "nodejs";
