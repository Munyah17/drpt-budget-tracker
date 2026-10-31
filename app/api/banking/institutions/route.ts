import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/server/jwt";
import { listInstitutions } from "@/lib/server/gocardless";

/**
 * GET /api/banking/institutions?uid=<uuid>&country=gb
 * Lists banks available for connection in the given country (ISO-3166 alpha-2).
 * Session-only on purpose: free-tier users browse banks before paying the
 * per-bank unlock, which is enforced in /api/banking/connect instead.
 */
export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "";
  const session = requireSession(req, uid);
  if ("error" in session) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  const country = (req.nextUrl.searchParams.get("country") ?? "gb").toLowerCase();
  try {
    const institutions = await listInstitutions(country);
    return NextResponse.json({
      institutions: institutions.map((i) => ({ id: i.id, name: i.name, logo: i.logo ?? null })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not list banks" },
      { status: 502 }
    );
  }
}

export const runtime = "nodejs";
