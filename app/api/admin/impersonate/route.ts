import { NextRequest, NextResponse } from "next/server";
import { sbGet } from "@/lib/server/supabaseAdmin";
import { isAdminRequest } from "@/lib/server/admin";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";

/**
 * POST /api/admin/impersonate { email }
 * "View as client": returns a magic-link token_hash for the target account so
 * the admin's browser can verifyOtp() into their session. Admin profiles are
 * refused — admins must never enter each other's sessions.
 */
export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  if (!(await isAdminRequest(req, serviceKey))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "valid email required" }, { status: 400 });
  }

  const profiles = await sbGet<{
    id: string;
    email: string;
    name: string;
    role: string;
  }>("profiles", `email=eq.${encodeURIComponent(email)}&select=id,email,name,role&limit=1`);
  const profile = profiles[0];
  if (!profile) return NextResponse.json({ error: "No account with that email" }, { status: 404 });
  if (profile.role === "admin") {
    return NextResponse.json({ error: "Cannot impersonate another admin" }, { status: 403 });
  }

  // Magic link with no redirect — we only need the token_hash.
  const linkRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "magiclink", email }),
  });
  const link = await linkRes.json().catch(() => null);
  if (!linkRes.ok) {
    return NextResponse.json({ error: link?.msg || "Could not create login token" }, { status: 502 });
  }

  // GoTrue returns hashed_token directly on newer versions; older ones embed
  // `token` in the action_link query string.
  const tokenHash: string =
    link?.hashed_token ??
    new URL(link?.action_link ?? "", SUPABASE_URL).searchParams.get("token") ??
    "";
  if (!tokenHash) {
    return NextResponse.json({ error: "Token not present in generate_link response" }, { status: 502 });
  }

  return NextResponse.json({
    token_hash: tokenHash,
    email: profile.email,
    name: profile.name,
    role: profile.role,
  });
}
