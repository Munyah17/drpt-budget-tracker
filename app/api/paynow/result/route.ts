import { NextRequest, NextResponse } from "next/server";

/**
 * Paynow server-to-server result callback (resulturl). Paynow expects a 200;
 * the authoritative status check happens client-side via /api/verify-payment,
 * which polls the transaction's pollurl.
 */
export async function POST(req: NextRequest) {
  try {
    await req.text();
  } catch {
    /* body optional */
  }
  return new NextResponse("OK", { status: 200 });
}
