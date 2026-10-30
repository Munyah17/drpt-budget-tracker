import { NextRequest, NextResponse } from "next/server";
import { sbSignedUrl } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

/** GET /api/hr/files?bucket=applications&path=… → { url } (1h signed link) */
export async function GET(req: NextRequest) {
  const bucket = req.nextUrl.searchParams.get("bucket") ?? "";
  const path = req.nextUrl.searchParams.get("path") ?? "";
  if (!["applications", "hr-docs"].includes(bucket) || !path)
    return NextResponse.json({ error: "bad params" }, { status: 400 });
  const url = await sbSignedUrl(bucket, path);
  if (!url) return NextResponse.json({ error: "sign failed" }, { status: 502 });
  return NextResponse.json({ url });
}
