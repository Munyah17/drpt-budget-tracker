/**
 * Server-only fixed-window rate limiter (in-memory, per serverless instance).
 * Not a hard guarantee across instances, but curbs abuse on public endpoints
 * like direct-transfer signup and payment initiation.
 */

interface Bucket {
  n: number;
  reset: number;
}

const buckets = new Map<string, Bucket>();

/** Returns true when the key has exceeded `limit` hits within `windowMs`. */
export function rateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const rec = buckets.get(key);
  if (!rec || now > rec.reset) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    return false;
  }
  rec.n += 1;
  return rec.n > limit;
}

/** Client IP from proxy headers. */
export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
