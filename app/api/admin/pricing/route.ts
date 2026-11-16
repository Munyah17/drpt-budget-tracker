import { NextRequest, NextResponse } from "next/server";
import { MARKET_PRICE_USD } from "@/lib/pricing";
import { sbDelete, sbGet, sbUpsert } from "@/lib/server/supabaseAdmin";
import { isSuperAdminRequest } from "@/lib/server/admin";
import { clearPricingCache, type PriceOverride } from "@/lib/server/pricing";

export const runtime = "nodejs";

const MARKETS = new Set(Object.keys(MARKET_PRICE_USD));

async function guard(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return { error: NextResponse.json({ error: "Not configured" }, { status: 500 }) };
  if (!(await isSuperAdminRequest(req, serviceKey))) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { serviceKey };
}

function validScopeKey(scope: string, key: string): boolean {
  if (scope === "market") return MARKETS.has(key);
  if (scope === "country") return /^[a-z]{2}$/.test(key);
  return false;
}

/** GET /api/admin/pricing — list custom price overrides (super admin only). */
export async function GET(req: NextRequest) {
  const g = await guard(req);
  if ("error" in g) return g.error;
  const rows = await sbGet<PriceOverride & { id: number; updated_at?: string }>(
    "price_overrides",
    "select=id,scope,key,amount_usd,updated_at&order=scope,key"
  );
  return NextResponse.json({ overrides: rows });
}

/** POST /api/admin/pricing — upsert { scope: "market"|"country", key, amountUsd }. */
export async function POST(req: NextRequest) {
  const g = await guard(req);
  if ("error" in g) return g.error;

  const body = await req.json().catch(() => null);
  const scope = String(body?.scope ?? "").toLowerCase();
  const key = String(body?.key ?? "").trim().toLowerCase();
  const amount = Number(body?.amountUsd);
  if (!["market", "country"].includes(scope) || !validScopeKey(scope, key)) {
    return NextResponse.json({ error: "Invalid scope/key" }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000) {
    return NextResponse.json({ error: "amountUsd must be between 0 and 1000" }, { status: 400 });
  }

  const ok = await sbUpsert(
    "price_overrides",
    [{ scope, key, amount_usd: amount, updated_at: new Date().toISOString() }],
    "scope,key"
  );
  if (!ok) return NextResponse.json({ error: "Could not save price" }, { status: 502 });
  clearPricingCache();
  return NextResponse.json({ ok: true });
}

/** DELETE /api/admin/pricing — remove { scope, key }. */
export async function DELETE(req: NextRequest) {
  const g = await guard(req);
  if ("error" in g) return g.error;

  const body = await req.json().catch(() => null);
  const scope = String(body?.scope ?? "").toLowerCase();
  const key = String(body?.key ?? "").trim().toLowerCase();
  if (!["market", "country"].includes(scope) || !validScopeKey(scope, key)) {
    return NextResponse.json({ error: "Invalid scope/key" }, { status: 400 });
  }

  const ok = await sbDelete(
    "price_overrides",
    `scope=eq.${encodeURIComponent(scope)}&key=eq.${encodeURIComponent(key)}`
  );
  if (!ok) return NextResponse.json({ error: "Could not delete price" }, { status: 502 });
  clearPricingCache();
  return NextResponse.json({ ok: true });
}
