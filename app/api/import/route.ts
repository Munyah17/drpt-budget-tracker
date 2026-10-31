import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireSession } from "@/lib/server/jwt";
import { requireFeatureAccess, accessError } from "@/lib/server/gate";
import { sbGet, sbInsert, sbPatch, sbUpload } from "@/lib/server/supabaseAdmin";
import { extractWithGemini, ExtractedItem, VisionResult } from "@/lib/server/extract/gemini";
import { parseCsv, readXlsx, gridToItems } from "@/lib/server/extract/tabular";

const BUCKET = "receipts";
const MAX_BYTES = 10 * 1024 * 1024;
/** base64 inflates ~4/3 — anything bigger than this can't hold a legal file */
const MAX_BODY_BYTES = Math.ceil(MAX_BYTES * 4 / 3) + 64 * 1024;
/** Per-user daily extraction cap — bounds AI spend against abuse/loops. */
const MAX_IMPORTS_PER_DAY = 50;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "application/pdf": "pdf",
  "text/csv": "csv",
  "text/plain": "csv",
  "application/vnd.ms-excel": "csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

const VISION_MIMES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf",
]);

function sniffMime(filename: string, mime: string): string {
  if (EXT_BY_MIME[mime]) return mime;
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  const byExt: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    heic: "image/heic", pdf: "application/pdf", csv: "text/csv", txt: "text/csv",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return byExt[ext] ?? "";
}

/** Normalise any extraction result into one list of reviewable items. */
function toItems(result: VisionResult): ExtractedItem[] {
  if (result.kind === "receipt" && result.receipt) {
    const r = result.receipt;
    return [{
      type: "expense",
      payee: r.merchant || "Unknown",
      amount: Math.abs(r.amount || 0),
      currency: (r.currency || "GBP").toUpperCase(),
      date: (r.datetime || "").slice(0, 10),
      category: r.category || "Other",
      confidence: typeof r.confidence === "number" ? r.confidence : 0.7,
    }];
  }
  return (result.items ?? [])
    .filter((i) => typeof i.amount === "number" && i.amount > 0 && i.date)
    .map((i) => ({ ...i, amount: Math.abs(i.amount) }));
}

/**
 * POST /api/import?uid=<uuid>
 * Body: {base64, mime, filename?, source?: "camera"|"upload"}
 * Uploads to the receipts bucket, extracts transaction candidates, and returns
 * them for review — nothing is committed until the client confirms.
 */
export async function POST(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "";
  const session = requireSession(req, uid);
  if ("error" in session) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }
  const access = await requireFeatureAccess(uid);
  if (!("ok" in access)) return accessError(access);

  // Reject oversized bodies before paying the parse cost — base64 inflates ~33%.
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 413 });
  }

  // Daily cap on extraction calls — protects the AI quota from abuse and
  // accidental retry loops. Count today's documents for this user.
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todays = await sbGet<{ id: number }>(
    "import_documents",
    `user_key=eq.${encodeURIComponent(uid)}&created_at=gte.${today.toISOString()}&select=id&limit=${MAX_IMPORTS_PER_DAY + 1}`
  );
  if (todays.length > MAX_IMPORTS_PER_DAY) {
    return NextResponse.json({ error: "Daily import limit reached — try again tomorrow" }, { status: 429 });
  }

  let base64 = "", mime = "", filename = "upload", source = "upload";
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file" }, { status: 400 });
      }
      base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
      mime = file.type;
      filename = file.name || "upload";
      source = String(form.get("source") ?? "upload");
    } else {
      const body = await req.json();
      base64 = String(body.base64 ?? "");
      mime = String(body.mime ?? "");
      filename = String(body.filename ?? "upload");
      source = body.source === "camera" ? "camera" : "upload";
    }
  } catch {
    return NextResponse.json({ error: "Bad body" }, { status: 400 });
  }

  const bytes = Buffer.from(base64, "base64");
  if (!bytes.length) return NextResponse.json({ error: "Empty file" }, { status: 400 });
  if (bytes.length > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 413 });
  }

  mime = sniffMime(filename, mime);
  if (!mime) {
    return NextResponse.json(
      { error: "Unsupported file type — use a photo, PDF, CSV or Excel file" },
      { status: 415 }
    );
  }

  // Keep the original for audit/tax proof before attempting extraction.
  const ext = EXT_BY_MIME[mime];
  const storagePath = `${uid}/${crypto.randomUUID()}.${ext}`;
  await sbUpload(BUCKET, storagePath, bytes, mime);

  const doc = await sbInsert<{ id: number }>("import_documents", {
    user_key: uid,
    storage_path: storagePath,
    mime,
    source,
    status: "processing",
  });
  const docId = doc?.id ?? null;

  let items: ExtractedItem[] = [];
  let extractError = "";
  try {
    if (VISION_MIMES.has(mime)) {
      const result = await extractWithGemini(base64, mime);
      if ("error" in result) extractError = result.error;
      else items = toItems(result);
    } else {
      const grid =
        ext === "xlsx" ? await readXlsx(bytes) : parseCsv(bytes.toString("utf8"));
      items = await gridToItems(grid);
      if (!items.length) extractError = "No transactions found in this file";
    }
  } catch (err) {
    extractError = err instanceof Error ? err.message : "Extraction failed";
  }

  const status = items.length ? "extracted" : "failed";
  if (docId) {
    await sbPatch("import_documents", `id=eq.${docId}`, {
      status,
      ...(extractError ? { error: extractError.slice(0, 500) } : {}),
    });
    if (items.length) {
      await Promise.all(
        items.map((payload) =>
          sbInsert("extracted_items", { user_key: uid, document_id: docId, payload })
        )
      );
    }
  }

  if (!items.length) {
    return NextResponse.json(
      { error: extractError || "Could not read any transactions from this file", documentId: docId },
      { status: 422 }
    );
  }
  return NextResponse.json({ documentId: docId, items });
}

export const runtime = "nodejs";
export const maxDuration = 60;
