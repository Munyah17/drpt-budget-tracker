/**
 * Shared auth for the corporate HR API routes (/api/hr/*).
 * Server-only — never import from client components.
 */
import { NextRequest } from "next/server";
import { verifySupabaseJwt } from "./jwt";
import { sbGet } from "./supabaseAdmin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Roles allowed to read/write HR data (contracts, documents, vacancies, applications). */
export const HR_WRITER_ROLES = new Set(["corporate", "admin", "super_admin"]);

export interface HrActor {
  uid: string;
  role: string;
}

/** Verified caller identity, or null. Identity headers are never trusted. */
export async function resolveHrActor(req: NextRequest): Promise<HrActor | null> {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const claims = token && jwtSecret ? verifySupabaseJwt(token, jwtSecret) : null;
  const uid = typeof claims?.sub === "string" ? claims.sub : "";
  if (!claims || claims.aud !== "authenticated" || !UUID_RE.test(uid)) return null;
  try {
    const rows = await sbGet<{ role: string | null }>(
      "profiles",
      `id=eq.${encodeURIComponent(uid)}&select=role&limit=1`
    );
    return { uid, role: rows[0]?.role ?? "user" };
  } catch {
    return null;
  }
}

export function canWriteHr(actor: HrActor | null): actor is HrActor {
  return !!actor && HR_WRITER_ROLES.has(actor.role);
}
