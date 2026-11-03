import { NextRequest, NextResponse } from "next/server";
import { sbGet, sbInsert, sbPatch } from "@/lib/server/supabaseAdmin";
import { isAdminRequest } from "@/lib/server/admin";
import { generateApiKey } from "@/lib/server/api";

export const runtime = "nodejs";

const KEY_COLS = "id,name,key_prefix,scopes,active,last_used_at,created_at,revoked_at";

async function denied(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  if (!(await isAdminRequest(req, serviceKey))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** GET /api/admin/api-keys — keys + a slice of recent request activity. */
export async function GET(req: NextRequest) {
  const deny = await denied(req);
  if (deny) return deny;
  const keys = await sbGet("api_keys", `select=${KEY_COLS}&order=created_at.desc`);
  const audit = await sbGet("api_audit_log", "order=created_at.desc&limit=25");
  return NextResponse.json({ keys, audit });
}

/** POST /api/admin/api-keys { name, scopes } — create a key.
 *  The raw key is returned ONCE; only its hash is stored. */
export async function POST(req: NextRequest) {
  const deny = await denied(req);
  if (deny) return deny;
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const scopes = (Array.isArray(body?.scopes) ? body.scopes : [])
    .map(String)
    .filter((s: string) => s === "read" || s === "write");
  if (!scopes.length) scopes.push("read");

  const { raw, prefix, hash } = generateApiKey();
  const row = await sbInsert("api_keys", {
    name,
    key_prefix: prefix,
    key_hash: hash,
    scopes,
  });
  if (!row) return NextResponse.json({ error: "insert failed" }, { status: 502 });
  return NextResponse.json({ key: raw, row });
}

/** DELETE /api/admin/api-keys?id= — revoke a key (soft). */
export async function DELETE(req: NextRequest) {
  const deny = await denied(req);
  if (deny) return deny;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const ok = await sbPatch("api_keys", `id=eq.${encodeURIComponent(id)}`, {
    active: false,
    revoked_at: new Date().toISOString(),
  });
  if (!ok) return NextResponse.json({ error: "update failed" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
