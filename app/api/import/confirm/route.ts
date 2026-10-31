import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/server/jwt";
import { requireFeatureAccess, accessError } from "@/lib/server/gate";
import { sbPatch } from "@/lib/server/supabaseAdmin";

/**
 * POST /api/import/confirm?uid=<uuid>
 * Body: {documentId, acceptedCount}
 * The client already committed the entries itself — this just records the
 * review outcome on the document for audit/retention.
 */
export async function POST(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "";
  const session = requireSession(req, uid);
  if ("error" in session) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }
  const access = await requireFeatureAccess(uid);
  if (!("ok" in access)) return accessError(access);

  const body = await req.json().catch(() => ({}));
  const docId = Number(body.documentId);
  if (!docId) return NextResponse.json({ error: "Missing documentId" }, { status: 400 });

  const accepted = Math.max(0, Number(body.acceptedCount) || 0);
  await sbPatch(
    "extracted_items",
    `document_id=eq.${docId}&user_key=eq.${uid}&status=eq.pending`,
    { status: "accepted" }
  );
  await sbPatch("import_documents", `id=eq.${docId}&user_key=eq.${uid}`, {
    status: "confirmed",
  });
  return NextResponse.json({ ok: true, accepted });
}

export const runtime = "nodejs";
