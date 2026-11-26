import { NextRequest, NextResponse } from "next/server";
import { sbSignedUrl } from "@/lib/server/supabaseAdmin";
import { canWriteHr, resolveHrActor } from "@/lib/server/hrAuth";

export const runtime = "nodejs";

/**
 * GET /api/hr/files?bucket=applications&path=… → { url } (1h signed link)
 * These buckets hold CVs and employee documents — signed URLs must never be
 * handed out to anonymous callers.
 */
export async function GET(req: NextRequest) {
  if (!canWriteHr(await resolveHrActor(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const bucket = req.nextUrl.searchParams.get("bucket") ?? "";
  const path = req.nextUrl.searchParams.get("path") ?? "";
  if (!["applications", "hr-docs"].includes(bucket) || !path)
    return NextResponse.json({ error: "bad params" }, { status: 400 });
  const url = await sbSignedUrl(bucket, path);
  if (!url) return NextResponse.json({ error: "sign failed" }, { status: 502 });
  return NextResponse.json({ url });
}
