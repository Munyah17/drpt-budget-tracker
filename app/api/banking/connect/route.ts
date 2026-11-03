import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/server/jwt";
import { createLinkToken } from "@/lib/server/plaid";

/**
 * POST /api/banking/connect?uid=<uuid>
 * Creates a Plaid Link token. Returns { linkToken, hostedLinkUrl } — web opens
 * Link with the token, native opens hostedLinkUrl in the system browser.
 * Any signed-in user may start Link; the per-bank unlock is enforced after
 * the institution is known (see /api/banking/exchange).
 */
export async function POST(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "";
  const session = requireSession(req, uid);
  if ("error" in session) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  try {
    const redirect = `${req.nextUrl.origin}/banking`;
    const token = await createLinkToken(uid, redirect);
    return NextResponse.json({
      linkToken: token.link_token,
      hostedLinkUrl: token.hosted_link_url ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not start bank connection" },
      { status: 502 }
    );
  }
}

export const runtime = "nodejs";
