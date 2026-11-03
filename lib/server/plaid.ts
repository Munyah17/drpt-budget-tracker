/**
 * Server-only Plaid client (Link + Transactions). Keys come from
 * PLAID_CLIENT_ID / PLAID_SECRET / PLAID_ENV (sandbox | development |
 * production). Never import this from client components.
 */

const ENVS: Record<string, string> = {
  sandbox: "https://sandbox.plaid.com",
  development: "https://development.plaid.com",
  production: "https://production.plaid.com",
};

const BASE = ENVS[process.env.PLAID_ENV ?? "sandbox"] ?? ENVS.sandbox;

/** Regions WellSpend supports — UK, most of the EU, US & Canada. */
const COUNTRY_CODES = [
  "GB", "IE", "FR", "DE", "ES", "PT", "IT", "NL", "BE", "AT", "PL", "SE",
  "NO", "DK", "FI", "CZ", "LT", "LV", "EE", "RO", "HU", "GR", "US", "CA",
];

async function plaid<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const client_id = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  if (!client_id || !secret) throw new Error("Banking is not configured");

  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    signal: AbortSignal.timeout(25_000),
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id, secret, ...body }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Plaid ${path} failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

export interface PlaidAccount {
  account_id: string;
  name: string;
  official_name?: string | null;
  mask?: string | null;
  subtype?: string | null;
  balances?: { iso_currency_code?: string | null };
}

export interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number; // Plaid: positive = money OUT
  date: string;
  name?: string;
  merchant_name?: string | null;
  pending?: boolean;
  iso_currency_code?: string | null;
}

/** Create a Link token — hosted_link gives native apps a browser URL. */
export function createLinkToken(uid: string, redirectUri: string) {
  return plaid<{
    link_token: string;
    hosted_link_url?: string;
    expiration: string;
  }>("/link/token/create", {
    client_name: "WellSpend",
    user: { client_user_id: uid },
    products: ["transactions"],
    transactions: { days_requested: 730 },
    country_codes: COUNTRY_CODES,
    language: "en",
    redirect_uri: redirectUri,
    hosted_link: {},
  });
}

/** Hosted-link completion: retrieve the public_token from the finished session. */
export async function getHostedPublicToken(linkToken: string): Promise<string | null> {
  const d = await plaid<{
    link_sessions?: {
      results?: { item_add_result?: { public_token?: string } };
    }[];
  }>("/link/token/get", { link_token: linkToken });
  for (const s of d.link_sessions ?? []) {
    const t = s.results?.item_add_result?.public_token;
    if (t) return t;
  }
  return null;
}

export function exchangePublicToken(publicToken: string) {
  return plaid<{ access_token: string; item_id: string }>(
    "/item/public_token/exchange",
    { public_token: publicToken }
  );
}

export function getItem(accessToken: string) {
  return plaid<{ item: { institution_id?: string | null; consent_expiration_time?: string | null } }>(
    "/item/get",
    { access_token: accessToken }
  );
}

export function getInstitution(institutionId: string) {
  return plaid<{ institution: { name?: string; logo?: string | null } }>(
    "/institutions/get_by_id",
    { institution_id: institutionId, country_codes: ["GB", "US"], options: { include_optional_metadata: true } }
  );
}

export function getAccounts(accessToken: string) {
  return plaid<{ accounts: PlaidAccount[] }>("/accounts/get", {
    access_token: accessToken,
  });
}

/**
 * Cursor-based transaction sync. Returns all changes since `cursor`
 * (null = full history window requested at link time).
 */
export function syncTransactions(accessToken: string, cursor: string | null) {
  return plaid<{
    added: PlaidTransaction[];
    modified: PlaidTransaction[];
    removed: { transaction_id: string | null }[];
    next_cursor: string;
    has_more: boolean;
  }>("/transactions/sync", {
    access_token: accessToken,
    ...(cursor ? { cursor } : {}),
    count: 200,
  });
}

export function removeItem(accessToken: string) {
  return plaid<null>("/item/remove", { access_token: accessToken });
}
