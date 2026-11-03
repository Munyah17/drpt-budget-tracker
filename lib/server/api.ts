/**
 * Server-only external API infrastructure — key auth, scopes, rate limiting,
 * response envelope, request audit, and signed webhook delivery.
 * Used by /api/v1/* routes. Never import this from client components.
 */
import { createHash, createHmac, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { sbGet, sbInsert, sbPatch } from "@/lib/server/supabaseAdmin";

export const API_VERSION = "v1";

/* ── Response envelope ────────────────────────────────────────────────────── */

export function apiOk(data: unknown, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, ...(meta ? { meta } : {}) });
}

export function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/* ── Pagination ───────────────────────────────────────────────────────────── */

export function pagination(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const limit = Math.min(Math.max(parseInt(p.get("limit") ?? "50", 10) || 50, 1), 200);
  const offset = Math.max(parseInt(p.get("offset") ?? "0", 10) || 0, 0);
  return { limit, offset, range: `limit=${limit}&offset=${offset}` };
}

/* ── API key authentication ───────────────────────────────────────────────── */

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
}

/** Raw key → lookup row. Keys are generated as `drpt_sk_<32 hex>` and stored
 *  hashed; the prefix is kept for display/revocation UX only. */
export function hashApiKey(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateApiKey() {
  const raw = `drpt_sk_${randomBytes(20).toString("hex")}`;
  return { raw, prefix: raw.slice(0, 14), hash: hashApiKey(raw) };
}

async function lookupKey(req: NextRequest): Promise<ApiKey | null> {
  const raw =
    req.headers.get("x-api-key") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";
  if (!raw.startsWith("drpt_sk_")) return null;
  const rows = await sbGet<ApiKey & { key_hash: string; active: boolean }>(
    "api_keys",
    `key_hash=eq.${hashApiKey(raw)}&active=eq.true&select=id,name,key_prefix,scopes&limit=1`
  );
  const key = rows[0];
  if (!key) return null;
  // touch last_used_at without blocking the request
  void sbPatch("api_keys", `id=eq.${key.id}`, { last_used_at: new Date().toISOString() });
  return key;
}

/* ── Rate limiting (per-process sliding window, 120 req/min/key) ─────────── */

const RATE_LIMIT = 120;
const WINDOW_MS = 60_000;
const windows = new Map<string, { count: number; reset: number }>();

function rateLimit(keyId: string): { ok: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const w = windows.get(keyId);
  if (!w || now > w.reset) {
    windows.set(keyId, { count: 1, reset: now + WINDOW_MS });
    return { ok: true, remaining: RATE_LIMIT - 1, reset: now + WINDOW_MS };
  }
  w.count += 1;
  return { ok: w.count <= RATE_LIMIT, remaining: Math.max(0, RATE_LIMIT - w.count), reset: w.reset };
}

/* ── Request wrapper ──────────────────────────────────────────────────────── */

type Scope = "read" | "write";

/**
 * Wraps a /api/v1 handler: authenticate key → enforce scope → rate limit →
 * run handler → audit the request. Responses carry X-RateLimit-* headers.
 */
export function withApi(
  scope: Scope,
  handler: (req: NextRequest, key: ApiKey, ctx?: { params: Promise<Record<string, string>> }) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx?: { params: Promise<Record<string, string>> }) => {
    const start = Date.now();
    let status = 500;
    let key: ApiKey | null = null;

    const finish = async (res: NextResponse, rl?: { remaining: number; reset: number }) => {
      status = res.status;
      if (rl) {
        res.headers.set("X-RateLimit-Limit", String(RATE_LIMIT));
        res.headers.set("X-RateLimit-Remaining", String(rl.remaining));
        res.headers.set("X-RateLimit-Reset", String(Math.floor(rl.reset / 1000)));
      }
      // fire-and-forget audit write — never delays the response
      void sbInsert("api_audit_log", {
        key_id: key?.id ?? null,
        method: req.method,
        path: req.nextUrl.pathname.slice(0, 200),
        status,
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        duration_ms: Date.now() - start,
      });
      return res;
    };

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return finish(apiError(500, "not_configured", "API is not configured on this deployment"));
    }
    key = await lookupKey(req);
    if (!key) {
      return finish(apiError(401, "unauthorized", "Invalid or missing API key — send X-API-Key: drpt_sk_..."));
    }
    if (!key.scopes.includes(scope)) {
      return finish(apiError(403, "forbidden", `This key lacks the '${scope}' scope`));
    }
    const rl = rateLimit(key.id);
    if (!rl.ok) {
      const res = apiError(429, "rate_limited", "Rate limit exceeded — 120 requests per minute per key");
      res.headers.set("Retry-After", String(Math.ceil((rl.reset - Date.now()) / 1000)));
      return finish(res, rl);
    }
    try {
      return await finish(await handler(req, key, ctx), rl);
    } catch (e) {
      console.error(`[api/v1] ${req.method} ${req.nextUrl.pathname}`, e);
      return finish(apiError(500, "internal_error", "Unexpected server error"), rl);
    }
  };
}

/* ── Document numbering ───────────────────────────────────────────────────── */

/** Next document number, e.g. INV-000123. Looks up the highest existing
 *  number for the prefix — the unique column guards against races. */
export async function nextDocNumber(kind: "invoice" | "quotation"): Promise<string> {
  const prefix = kind === "quotation" ? "QUO" : "INV";
  const rows = await sbGet<{ number: string }>(
    "invoices",
    `number=like.${prefix}-*&select=number&order=number.desc&limit=1`
  );
  const last = rows[0]?.number.match(/(\d+)$/)?.[1];
  const seq = (last ? parseInt(last, 10) : 0) + 1;
  return `${prefix}-${String(seq).padStart(6, "0")}`;
}

/** Valid document statuses by kind — shared by admin and v1 routes. */
export const INVOICE_STATUSES = ["Pending", "Paid", "Overdue"] as const;
export const QUOTE_STATUSES = ["Draft", "Sent", "Accepted", "Declined"] as const;

/* ── Webhooks ─────────────────────────────────────────────────────────────── */

/**
 * Fan out a domain event to all active matching webhook subscriptions.
 * Each POST body is {event, timestamp, data} signed as
 * `X-WellSpend-Signature: sha256=<hmac(secret, rawBody)>`.
 * Deliveries are recorded; failures never throw back into the request path.
 */
export async function dispatchWebhook(event: string, data: unknown) {
  const hooks = await sbGet<{ id: string; url: string; secret: string }>(
    "webhooks",
    `active=eq.true&events=cs.{${event}}&select=id,url,secret`
  );
  const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data });
  await Promise.allSettled(
    hooks.map(async (hook) => {
      const sig = createHmac("sha256", hook.secret).update(body).digest("hex");
      let status: number | null = null;
      try {
        const res = await fetch(hook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-WellSpend-Event": event,
            "X-WellSpend-Signature": `sha256=${sig}`,
          },
          body,
          signal: AbortSignal.timeout(10_000),
        });
        status = res.status;
      } catch {
        /* unreachable target — recorded below */
      }
      await sbInsert("webhook_deliveries", {
        webhook_id: hook.id,
        event,
        status,
        success: status !== null && status < 400,
      });
    })
  );
}
