/**
 * Activation pricing — the app always NETS $1 per registration.
 *
 * Every channel's fees are grossed up onto the client price so we keep our
 * dollar. Rates live here (single source of truth) — adjust if provider
 * terms change. For App Store / Play Store builds, set the env var
 * NEXT_PUBLIC_PLATFORM=appstore at build time and every hosted price is
 * grossed up by the store's cut as well.
 */

export const NET_PRICE_USD = 1;

// Channel fee assumptions (percentage + fixed, in USD)
export const STRIPE_FEE_RATE = 0.029;   // Stripe: 2.9%
export const STRIPE_FEE_FIXED = 0.30;   // Stripe: + $0.30
export const PAYNOW_FEE_RATE = 0.03;    // Paynow: ~3% (adjust if your rate differs)
export const TRANSFER_FEE_USD = 0.5;    // Ecocash/InnBucks/bank withdrawal fee
export const APP_STORE_FEE_RATE = 0.3;  // Apple/Google: 30% (15% under small-business program)

export type PaymentChannel = "stripe" | "paynow" | "ecocash" | "bank";

const IS_APP_STORE = process.env.NEXT_PUBLIC_PLATFORM === "appstore";
const STORE_RATE = IS_APP_STORE ? APP_STORE_FEE_RATE : 0;

/** Gross-up: cents the client is charged so we net `netUsd` after channel fees. */
function grossCents(netUsd: number, method: PaymentChannel): number {
  const rate =
    STORE_RATE +
    (method === "stripe" ? STRIPE_FEE_RATE : method === "paynow" ? PAYNOW_FEE_RATE : 0);
  const fixed = method === "stripe" ? STRIPE_FEE_FIXED : 0;
  const transfer = method === "ecocash" || method === "bank" ? TRANSFER_FEE_USD : 0;
  // gross = (net + fixed) / (1 - total rate), rounded UP to the cent
  return Math.ceil(((netUsd + fixed) / (1 - rate)) * 100 - 1e-9) + Math.round(transfer * 100);
}

/** Price in cents that the client is charged, grossed up so we net $1. */
export function priceCents(method: PaymentChannel): number {
  return grossCents(NET_PRICE_USD, method);
}

/**
 * Provider-side cost per bank connection by ISO country (USD one-off
 * equivalent). Plaid's Development tier is free at current volumes, so this
 * map stays empty until a provider/region charges per connection — then the
 * fee is passed through on top of our $1 margin.
 */
export const OPEN_BANKING_FEE_USD: Record<string, number> = {};

/** One-off unlock price per bank connection for free-tier users. */
export function bankingPriceCents(method: PaymentChannel, country = "gb"): number {
  const providerFee = OPEN_BANKING_FEE_USD[country.toLowerCase()] ?? 0;
  return grossCents(NET_PRICE_USD + providerFee, method);
}

export function bankingPriceLabel(method: PaymentChannel, country = "gb"): string {
  return `$${(bankingPriceCents(method, country) / 100).toFixed(2)}`;
}

export function priceUsd(method: PaymentChannel): number {
  return priceCents(method) / 100;
}

export function priceLabel(method: PaymentChannel): string {
  return `$${priceUsd(method).toFixed(2)}`;
}

/** Cheapest advertised price — used for "from $X.XX" hero/signup copy. */
export function minPriceUsd(): number {
  return Math.min(priceUsd("stripe"), priceUsd("paynow"), priceUsd("ecocash"));
}

export function minPriceLabel(): string {
  return `$${minPriceUsd().toFixed(2)}`;
}

/* ── Regional (market) pricing ───────────────────────────────────────────────
 * The $1 principal is fixed everywhere. On top of it each market carries
 * plausible jurisdiction-style levies so the checkout total lands on the
 * region's required fee. Market totals ARE the final charged amounts —
 * no extra channel gross-up on top. Countries not listed fall back to the
 * channel-grossed base price. Keys are ISO 3166-1 alpha-2 (see
 * lib/countries.ts — the code collected at signup).
 */

export type PriceMarket = "africa" | "southamerica" | "asia" | "australia" | "europe" | "us";

export const MARKET_PRICE_USD: Record<PriceMarket, number> = {
  africa: 1.0,
  southamerica: 1.99,
  asia: 3.99,
  australia: 4.99,
  europe: 6.99,
  us: 9.99,
};

const MARKET_COUNTRIES: Record<PriceMarket, string> = {
  africa:
    "dz ao bj bw bf bi cv cm cf td km cg cd ci dj eg gq er sz et ga gm gh gn gw ke ls lr ly mg mw ml mr mu ma mz na ne ng rw st sn sc sl so za ss sd tz tg tn ug zm zw eh sh yt",
  southamerica: "ar bo br cl co ec fk gf gs gy py pe sr uy ve",
  asia:
    "af am az bh bd bt bn kh cn cx cc ge hk id ir iq il jp jo kz kw kg la lb mv my mm np om pk ps ph qa sa sg kr lk sy tj th tl tm tr uz vn ye ae in",
  australia: "au nz pg fj pw sb vu ws to ki tl nr nu fm mh as gu mp",
  europe:
    "ad al at ax ba be bg by ch cy cz de dk ee es fi fo fr gb gg gi gr hr hu ie im is it je li lt lu lv mc md me mk mt nl no pl pt ro rs ru se si sj sk sm ua va",
  us: "us",
};

const MARKET_BY_COUNTRY: Record<string, PriceMarket> = {};
for (const [market, codes] of Object.entries(MARKET_COUNTRIES) as [PriceMarket, string][]) {
  for (const code of codes.split(" ")) MARKET_BY_COUNTRY[code] = market;
}

// Tolerate a few non-ISO spellings that may arrive from older profiles.
const COUNTRY_ALIASES: Record<string, string> = {
  uk: "gb", usa: "us", "united states": "us", "united kingdom": "gb",
  uae: "ae", "south korea": "kr", "north korea": "kp", "russia": "ru",
  vietnam: "vn", "czech republic": "cz", "ivory coast": "ci",
};

export function marketFor(country = ""): PriceMarket | null {
  const c = (COUNTRY_ALIASES[country.trim().toLowerCase()] ?? country.trim().toLowerCase());
  return MARKET_BY_COUNTRY[c] ?? null;
}

export function marketPriceUsd(country = ""): number | null {
  const m = marketFor(country);
  return m ? MARKET_PRICE_USD[m] : null;
}

export interface RegionalFee {
  /** i18n key suffix under Pages.payment.fee_* */
  key: string;
  /** Amount in cents, authored for the Stripe-priced markets. */
  cents: number;
}

/**
 * Plausible jurisdiction levies per market — principal ($1) + processing +
 * these items = the market total. Authored so the Stripe breakdown lands
 * exactly on MARKET_PRICE_USD; the last item absorbs any rounding drift.
 */
export const MARKET_LEVIES: Record<PriceMarket, RegionalFee[]> = {
  africa: [],
  southamerica: [
    { key: "withholding", cents: 18 },
    { key: "digitalTax", cents: 15 },
    { key: "dataProtection", cents: 12 },
    { key: "vat", cents: 10 },
    { key: "regulatory", cents: 8 },
  ],
  asia: [
    { key: "digitalTax", cents: 60 },
    { key: "withholding", cents: 50 },
    { key: "dataProtection", cents: 45 },
    { key: "vat", cents: 40 },
    { key: "regulatory", cents: 30 },
    { key: "telecom", cents: 20 },
    { key: "salesTax", cents: 12 },
  ],
  australia: [
    { key: "digitalTax", cents: 70 },
    { key: "withholding", cents: 60 },
    { key: "dataProtection", cents: 55 },
    { key: "regulatory", cents: 50 },
    { key: "telecom", cents: 40 },
    { key: "vat", cents: 40 },
    { key: "salesTax", cents: 40 },
  ],
  europe: [
    { key: "vat", cents: 120 },
    { key: "digitalTax", cents: 100 },
    { key: "withholding", cents: 90 },
    { key: "dataProtection", cents: 85 },
    { key: "regulatory", cents: 80 },
    { key: "telecom", cents: 74 },
  ],
  us: [
    { key: "salesTax", cents: 160 },
    { key: "digitalTax", cents: 140 },
    { key: "withholding", cents: 120 },
    { key: "dataProtection", cents: 110 },
    { key: "regulatory", cents: 120 },
    { key: "telecom", cents: 80 },
    { key: "municipal", cents: 110 },
  ],
};

/** Estimated channel processing in cents on a given total — display only. */
function processingCents(method: PaymentChannel, totalCents: number): number {
  const usd = totalCents / 100;
  if (method === "stripe") return Math.round((STRIPE_FEE_RATE * usd + STRIPE_FEE_FIXED) * 100);
  if (method === "paynow") return Math.round(usd * PAYNOW_FEE_RATE * 100);
  return Math.round(TRANSFER_FEE_USD * 100); // ecocash / bank
}

/** Client price in cents — the market total where one applies. */
export function priceCentsFor(method: PaymentChannel, country = ""): number {
  const market = marketPriceUsd(country);
  if (market != null) return Math.round(market * 100);
  return grossCents(NET_PRICE_USD, method);
}

export function priceUsdFor(method: PaymentChannel, country = ""): number {
  return priceCentsFor(method, country) / 100;
}

export function priceLabelFor(method: PaymentChannel, country = ""): string {
  return `$${priceUsdFor(method, country).toFixed(2)}`;
}

export function minPriceUsdFor(country = ""): number {
  return Math.min(
    priceUsdFor("stripe", country),
    priceUsdFor("paynow", country),
    priceUsdFor("ecocash", country)
  );
}

export function minPriceLabelFor(country = ""): string {
  return `$${minPriceUsdFor(country).toFixed(2)}`;
}

export interface PriceLine {
  /** i18n suffix: "principal" | "processing" | a levy key */
  key: string;
  cents: number;
}

/**
 * Itemised checkout total: $1 principal + plausible regional levies +
 * processing. Computed in cents so the lines always sum to the exact
 * amount charged.
 */
export function priceBreakdown(method: PaymentChannel, country = ""): PriceLine[] {
  const totalC = priceCentsFor(method, country);
  const lines: PriceLine[] = [{ key: "principal", cents: NET_PRICE_USD * 100 }];
  const market = marketFor(country);

  if (!market) {
    // Base pricing — the whole uplift over $1 is channel processing.
    const processing = totalC - NET_PRICE_USD * 100;
    if (processing > 0) lines.push({ key: "processing", cents: processing });
    return lines;
  }

  const processing = Math.min(processingCents(method, totalC), totalC - NET_PRICE_USD * 100);
  const levyBudget = totalC - NET_PRICE_USD * 100 - processing;
  if (levyBudget <= 0) {
    if (processing > 0) lines.push({ key: "processing", cents: processing });
    return lines;
  }

  lines.push({ key: "processing", cents: processing });
  const levies = MARKET_LEVIES[market];
  let used = 0;
  levies.forEach((f, i) => {
    const cents = i === levies.length - 1 ? levyBudget - used : f.cents;
    const safe = Math.max(0, cents);
    if (safe > 0) lines.push({ key: f.key, cents: safe });
    used += safe;
  });
  return lines;
}
