/**
 * Devin Cloud research client — server-only.
 *
 * Launches Devin sessions that browse the web for prospective customers
 * (public conversations where people ask for budgeting help, complain
 * about competitor apps, or ask for recommendations) and returns their
 * structured findings. The Growth Agent collects the output and folds it
 * into the admin digest.
 *
 * Auth: DEVIN_API_KEY — a personal (apk_user_*) or service (apk_*) key
 * from https://app.devin.ai/settings/api-keys. v1 endpoints remain
 * supported during the v1→v3 migration.
 */

const DEVIN_API = "https://api.devin.ai/v1";

export function devinConfigured(): boolean {
  return !!process.env.DEVIN_API_KEY;
}

export interface DevinSessionResult {
  session_id: string;
  url: string;
}

export async function devinCreateSession(opts: {
  prompt: string;
  title: string;
  schema: Record<string, unknown>;
  maxAcu?: number;
}): Promise<DevinSessionResult | null> {
  const key = process.env.DEVIN_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`${DEVIN_API}/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: opts.prompt,
        title: opts.title,
        tags: ["wellspend-growth"],
        structured_output_schema: opts.schema,
        max_acu_limit: opts.maxAcu ?? 12,
        idempotent: true,
      }),
    });
    if (!res.ok) {
      console.error("[devin] create session failed:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = await res.json();
    return data?.session_id ? { session_id: data.session_id, url: data.url ?? "" } : null;
  } catch (e) {
    console.error("[devin] create session error:", e);
    return null;
  }
}

export interface DevinSessionState {
  status_enum: string;
  structured_output: Record<string, unknown> | null;
  url: string;
}

export async function devinGetSession(sessionId: string): Promise<DevinSessionState | null> {
  const key = process.env.DEVIN_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`${DEVIN_API}/sessions/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      status_enum: String(data?.status_enum ?? data?.status ?? "unknown"),
      structured_output:
        data?.structured_output && typeof data.structured_output === "object"
          ? (data.structured_output as Record<string, unknown>)
          : null,
      url: String(data?.url ?? ""),
    };
  } catch {
    return null;
  }
}
