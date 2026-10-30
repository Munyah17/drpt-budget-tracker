/**
 * Server-only Supabase helpers — PostgREST + Storage via the service role.
 * Never import this from client components.
 */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";

const serviceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function headers(extra: Record<string, string> = {}) {
  return {
    apikey: serviceKey(),
    Authorization: `Bearer ${serviceKey()}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export async function sbGet<T>(table: string, query = ""): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export async function sbInsert<T>(
  table: string,
  row: Record<string, unknown>
): Promise<T | null> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify(row),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return (data?.[0] as T) ?? null;
}

export async function sbPatch(
  table: string,
  match: string,
  patch: Record<string, unknown>
): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${match}`, {
    method: "PATCH",
    headers: headers({ Prefer: "return=minimal" }),
    body: JSON.stringify(patch),
  });
  return res.ok;
}

export async function sbDelete(table: string, match: string): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${match}`, {
    method: "DELETE",
    headers: headers({ Prefer: "return=minimal" }),
  });
  return res.ok;
}

export async function sbUpload(
  bucket: string,
  path: string,
  body: ArrayBuffer,
  contentType: string
): Promise<boolean> {
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${bucket}/${encodeURIComponent(path)}`,
    {
      method: "POST",
      headers: {
        apikey: serviceKey(),
        Authorization: `Bearer ${serviceKey()}`,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body,
    }
  );
  return res.ok;
}

/** Temporary signed URL for a private object (default 1 hour). */
export async function sbSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 3600
): Promise<string | null> {
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/sign/${bucket}/${encodeURIComponent(path)}`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ expiresIn }),
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data?.signedURL ? `${SUPABASE_URL}/storage/v1${data.signedURL}` : null;
}
