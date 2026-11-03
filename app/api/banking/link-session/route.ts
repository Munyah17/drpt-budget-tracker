import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/server/jwt";
import { getHostedPublicToken } from "@/lib/server/plaid";

/**
 * GET /api/banking/link-session?uid=<uuid>&linkToken=...
 * Hosted-Link completion helper (native apps): after the system browser
 * closes, Plaid stores the session result under the link token — this
 * returns the public_token so the client can call /api/banking/exchange.
 */
export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "";
  const session = requireSession(req, uid);
  if ("error" in session) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  const linkToken = req.nextUrl.searchParams.get("linkToken") ?? "";
  if (!linkToken) {
    return NextResponse.json({ error: "Missing linkToken" }, { status: 400 });
  }

  try {
    const publicToken = await getHostedPublicToken(linkToken);
    return NextResponse.json({ publicToken: publicToken ?? null });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not read link session" },
      { status: 502 }
    );
  }
}

export const runtime = "nodejs";
