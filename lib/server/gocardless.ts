/**
 * Server-only GoCardless Bank Account Data client (free for UK/EU account
 * information). Token is cached in-module for its lifetime (~24h).
 * Never import this from client components.
 */

const BASE = "https://bankaccountdata.gocardless.com/api/v2";
/** Consent + history window under PSD2; 90 days is the max banks allow. */
const ACCESS_DAYS = 90;

let cached: { access: string; refresh: string; expiresAt: number } | null = null;

async function gcToken(forceRefresh = false): Promise<string> {
  const id = process.env.GC_SECRET_ID;
  const secret = process.env.GC_SECRET_KEY;
  if (!id || !secret) throw new Error("Banking is not configured");

  if (!forceRefresh && cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.access;
  }
  if (forceRefresh && cached?.refresh) {
    const res = await fetch(`${BASE}/token/refresh/`, {
      method: "POST",
      signal: AbortSignal.timeout(20_000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: cached.refresh }),
    });
    if (res.ok) {
      const d = await res.json();
      cached = {
        ...cached,
        access: d.access,
        expiresAt: Date.now() + (d.access_expires ?? 86400) * 1000,
      };
      return cached.access;
    }
    cached = null; // fall through to a fresh login
  }
  const res = await fetch(`${BASE}/token/new/`, {
    method: "POST",
    signal: AbortSignal.timeout(20_000),
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret_id: id, secret_key: secret }),
  });
  if (!res.ok) throw new Error(`GoCardless auth failed (${res.status})`);
  const d = await res.json();
  cached = {
    access: d.access,
    refresh: d.refresh,
    expiresAt: Date.now() + (d.access_expires ?? 86400) * 1000,
  };
  return cached.access;
}

async function gc<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const token = await gcToken();
  const res = await fetch(`${BASE}${path}`, {
    signal: AbortSignal.timeout(20_000),
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 401 && !retried) {
    await gcToken(true);
    return gc<T>(path, init, true);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GoCardless ${path} failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.status === 204 ? (null as T) : res.json();
}

export interface GcInstitution {
  id: string;
  name: string;
  logo?: string;
  countries?: string[];
}

export interface GcTransaction {
  transactionId?: string;
  internalTransactionId?: string;
  bookingDate?: string;
  transactionAmount?: { amount: string; currency: string };
  creditorName?: string;
  debtorName?: string;
  remittanceInformationUnstructured?: string;
  remittanceInformationUnstructuredArray?: string[];
}

export function listInstitutions(country: string) {
  return gc<GcInstitution[]>(`/institutions/?country=${encodeURIComponent(country)}`);
}

export function createAgreement(institutionId: string) {
  return gc<{ id: string }>(`/agreements/enduser/`, {
    method: "POST",
    body: JSON.stringify({
      institution_id: institutionId,
      max_historical_days: ACCESS_DAYS,
      access_valid_days: ACCESS_DAYS,
      access_scope: ["balances", "details", "transactions"],
    }),
  });
}

export function createRequisition(args: {
  redirect: string;
  institutionId: string;
  agreementId: string;
  reference: string;
}) {
  return gc<{ id: string; link: string }>(`/requisitions/`, {
    method: "POST",
    body: JSON.stringify({
      redirect: args.redirect,
      institution_id: args.institutionId,
      agreement: args.agreementId,
      reference: args.reference,
    }),
  });
}

export function getRequisition(id: string) {
  return gc<{ id: string; status: string; accounts?: string[]; institution_id?: string }>(
    `/requisitions/${encodeURIComponent(id)}/`
  );
}

export function getAccountDetails(accountId: string) {
  return gc<{ account?: { iban?: string; name?: string; currency?: string; product?: string } }>(
    `/accounts/${encodeURIComponent(accountId)}/details/`
  );
}

export async function getTransactions(accountId: string): Promise<GcTransaction[]> {
  const d = await gc<{ transactions?: { booked?: GcTransaction[]; pending?: GcTransaction[] } }>(
    `/accounts/${encodeURIComponent(accountId)}/transactions/`
  );
  // Booked only — pending entries churn their ids and would double-count.
  return d?.transactions?.booked ?? [];
}

export function deleteRequisition(id: string) {
  return gc<null>(`/requisitions/${encodeURIComponent(id)}/`, { method: "DELETE" });
}
