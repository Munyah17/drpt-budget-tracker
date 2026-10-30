import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { sbGet, sbInsert, sbPatch, sbUpload } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

/** GET /api/hr/documents?employee=<name> */
export async function GET(req: NextRequest) {
  const employee = req.nextUrl.searchParams.get("employee");
  const q = employee ? `employee=eq.${encodeURIComponent(employee)}&order=created_at.desc` : "order=created_at.desc";
  return NextResponse.json(await sbGet("hr_documents", q));
}

/** POST /api/hr/documents — multipart: employee, doc_type, expires?, meta(JSON)?, file */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "multipart required" }, { status: 400 });
  const file = form.get("file");
  const employee = String(form.get("employee") || "");
  const docType = String(form.get("doc_type") || "Document");

  let filePath = "", fileName = "", fileSize = 0;
  if (file instanceof File && file.size > 0) {
    filePath = `${employee.replace(/[^\w.\-]+/g, "_")}/${randomUUID()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
    const ok = await sbUpload("hr-docs", filePath, await file.arrayBuffer(), file.type || "application/octet-stream");
    if (!ok) return NextResponse.json({ error: "upload failed" }, { status: 502 });
    fileName = file.name;
    fileSize = file.size;
  }

  let meta: Record<string, unknown> = {};
  try { meta = JSON.parse(String(form.get("meta") || "{}")); } catch { /* keep {} */ }

  const row = await sbInsert("hr_documents", {
    employee,
    doc_type: docType,
    file_name: fileName,
    file_path: filePath,
    file_size: fileSize,
    meta,
    expires: String(form.get("expires") || "") || null,
  });
  if (!row) return NextResponse.json({ error: "insert failed" }, { status: 502 });
  return NextResponse.json(row);
}

/** PATCH /api/hr/documents { id, ...patch } (verify, set expiry) */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { id, ...patch } = body;
  const ok = await sbPatch("hr_documents", `id=eq.${id}`, patch);
  return NextResponse.json({ ok });
}
