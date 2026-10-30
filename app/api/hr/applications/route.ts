import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { sbGet, sbInsert, sbPatch, sbUpload } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

const ALLOWED = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "image/png",
  "image/jpeg",
]);

/**
 * Score an application out of 100:
 *  - 40 file completeness (Word CV is worth 25 — it's the machine-readable one)
 *  - 40 skills match (keywords found in extracted CV text vs vacancy skills)
 *  - 20 answers completeness (share of required custom fields answered)
 */
function scoreApplication(opts: {
  files: { kind: string }[];
  skills: string[];
  cvText: string;
  answers: Record<string, unknown>;
  requiredFields: { label: string; required?: boolean }[];
}) {
  const has = (k: string) => opts.files.some((f) => f.kind === k);
  const fileScore = Math.min(40, (has("word") ? 25 : 0) + (has("pdf") ? 10 : 0) + (has("image") ? 5 : 0));

  const text = (opts.cvText || "").toLowerCase();
  const hit = opts.skills.filter((s) => s && text.includes(String(s).toLowerCase().trim()));
  const skillScore = opts.skills.length ? Math.round((hit.length / opts.skills.length) * 40) : 20;

  const required = (opts.requiredFields || []).filter((f) => f.required !== false);
  const answered = required.filter((f) => {
    const v = opts.answers?.[f.label];
    return v !== undefined && v !== null && String(v).trim() !== "";
  });
  const answerScore = required.length ? Math.round((answered.length / required.length) * 20) : 20;

  return {
    score: Math.min(100, fileScore + skillScore + answerScore),
    breakdown: { files: fileScore, skills: skillScore, answers: answerScore, matchedSkills: hit },
  };
}

/** GET /api/hr/applications?vacancy=<id> | all */
export async function GET(req: NextRequest) {
  const vacancy = req.nextUrl.searchParams.get("vacancy");
  const q = vacancy ? `vacancy_id=eq.${vacancy}&order=created_at.desc` : "order=created_at.desc";
  return NextResponse.json(await sbGet("applications", q));
}

/**
 * POST /api/hr/applications — multipart/form-data
 * fields: vacancy_id, applicant_name, email, phone, answers(JSON), cvText
 * files: any number of File parts, tagged by field name word|pdf|image
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "multipart required" }, { status: 400 });

  const vacancyId = String(form.get("vacancy_id") || "");
  if (!vacancyId) return NextResponse.json({ error: "vacancy_id required" }, { status: 400 });

  const vacancy = (await sbGet<{ skills: string[]; fields: { label: string; required?: boolean }[] }>(
    "vacancies", `id=eq.${vacancyId}&limit=1`
  ))[0];
  if (!vacancy) return NextResponse.json({ error: "vacancy not found" }, { status: 404 });
  if ((vacancy as { status?: string }).status !== "Open")
    return NextResponse.json({ error: "vacancy closed" }, { status: 410 });

  let answers: Record<string, unknown> = {};
  try { answers = JSON.parse(String(form.get("answers") || "{}")); } catch { /* keep {} */ }

  const appId = randomUUID();
  const files: { kind: string; name: string; path: string; size: number }[] = [];
  let idx = 0;
  for (const [key, value] of form.entries()) {
    if (!(value instanceof File)) continue;
    if (!ALLOWED.has(value.type)) continue;
    const kind = key === "word" || key === "pdf" || key === "image" ? key : "other";
    const path = `${vacancyId}/${appId}/${idx++}-${value.name.replace(/[^\w.\-]+/g, "_")}`;
    const ok = await sbUpload("applications", path, await value.arrayBuffer(), value.type);
    if (ok) files.push({ kind, name: value.name, path, size: value.size });
  }

  const { score, breakdown } = scoreApplication({
    files,
    skills: vacancy.skills ?? [],
    cvText: String(form.get("cvText") || ""),
    answers,
    requiredFields: vacancy.fields ?? [],
  });

  const row = await sbInsert("applications", {
    id: appId,
    vacancy_id: vacancyId,
    applicant_name: String(form.get("applicant_name") || "Applicant"),
    email: String(form.get("email") || ""),
    phone: String(form.get("phone") || ""),
    answers,
    files,
    score,
    score_breakdown: breakdown,
    stage: "New",
  });
  if (!row) return NextResponse.json({ error: "insert failed" }, { status: 502 });
  return NextResponse.json(row);
}

/** PATCH /api/hr/applications { id, stage } */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.id || !body?.stage) return NextResponse.json({ error: "id + stage required" }, { status: 400 });
  const ok = await sbPatch("applications", `id=eq.${body.id}`, { stage: body.stage });
  return NextResponse.json({ ok });
}
