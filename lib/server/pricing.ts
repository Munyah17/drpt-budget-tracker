import { marketFor, priceUsdFor, type PaymentChannel } from "@/lib/pricing";
import { sbGet } from "./supabaseAdmin";

/**
 * Server-side price resolution with Super Admin overrides.
 *
 * `price_overrides` rows (scope=country|market) replace the default regional
 * price for every payment channel. Country wins over market; missing table or
 * rows simply fall back to lib/pricing defaults.
 */

export interface PriceOverride {
  scope: "market" | "country";
  key: string;
  amount_usd: number;
}

const CHANNELS: PaymentChannel[] = ["stripe", "paynow", "ecocash", "bank"];
const CACHE_MS = 30_000;
let cache: { at: number; rows: PriceOverride[] } | null = null;

async function overrides(): Promise<PriceOverride[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.rows;
  const rows = await sbGet<PriceOverride>(
    "price_overrides",
    "select=scope,key,amount_usd&order=scope,key"
  );
  cache = { at: Date.now(), rows };
  return rows;
}

export function clearPricingCache(): void {
  cache = null;
}

function countryKey(country = ""): string {
  return country.trim().toLowerCase();
}

export async function priceUsdForCountry(
  method: PaymentChannel,
  country = ""
): Promise<number> {
  const rows = await overrides();
  const ck = countryKey(country);
  const countryOverride = ck
    ? rows.find((r) => r.scope === "country" && r.key === ck)
    : undefined;
  if (countryOverride) return Number(countryOverride.amount_usd);

  const market = marketFor(country);
  const marketOverride = market
    ? rows.find((r) => r.scope === "market" && r.key === market)
    : undefined;
  if (marketOverride) return Number(marketOverride.amount_usd);

  return priceUsdFor(method, country);
}

export async function priceCentsForCountry(
  method: PaymentChannel,
  country = ""
): Promise<number> {
  return Math.round((await priceUsdForCountry(method, country)) * 100);
}

export async function pricesForCountry(country = "") {
  const entries = await Promise.all(
    CHANNELS.map(async (m) => [m, await priceUsdForCountry(m, country)] as const)
  );
  const prices = Object.fromEntries(entries) as Record<PaymentChannel, number>;
  const custom = await isCustomPrice(country);
  return {
    prices,
    min: Math.min(...Object.values(prices)),
    custom,
  };
}

export async function isCustomPrice(country = ""): Promise<boolean> {
  const rows = await overrides();
  const ck = countryKey(country);
  if (ck && rows.some((r) => r.scope === "country" && r.key === ck)) return true;
  const market = marketFor(country);
  return market ? rows.some((r) => r.scope === "market" && r.key === market) : false;
}
