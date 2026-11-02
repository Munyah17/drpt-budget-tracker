// Reprices "$1 once-off" copy to "$1 per year" and adds the two new business
// cards, translating into every locale at runtime (Google Translate gtx).
// Run: node scripts/i18n-per-year.mjs
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const DIR = fileURLToPath(new URL("../messages/", import.meta.url));

const KEYS = {
  // New business cards (claims + hiring)
  "Landing.business.claimsTitle": "Claims without the paper trail",
  "Landing.business.claimsText": "Staff snap receipts and claim expenses or advances in-app — you approve in one tap and payroll sorts the rest.",
  "Landing.business.hireTitle": "Hire from one screen",
  "Landing.business.hireText": "Post a vacancy, share the link, and applications score themselves. Contracts and onboarding live in the same place.",
  // $1 once-off → $1 per year
  "Login.signupTitle": "Create your account — $1/year unlocks everything",
  "Login.signUpLink": "Sign up — $1/year",
  "Landing.hero.badge": "Just $1 a year",
  "Landing.hero.note": "$1 a year · Every feature unlocked · Paynow, card, Ecocash or bank.",
  "Landing.how.pay.title": "Pay $1 a year",
  "Landing.how.pay.text": "One dollar a year. Paynow, card, Ecocash or bank transfer — your pick.",
  "Landing.how.own.text": "Full access, all year. Every feature, every update, one dollar.",
  "Landing.pricing.sub": "No tiers, no upsells. One dollar a year keeps everything.",
  "Landing.pricing.lifetime": "Yearly access",
  "Landing.pricing.forever": "/ year",
  "Landing.pricing.features": "Every feature, all year",
  "Pages.payment.onceNotMonthly": "a year, not monthly",
  "Pages.payment.tagline": "One payment unlocks everything for a year.",
};

const LANG = {
  fr: "fr", es: "es", it: "it", nl: "nl", pl: "pl", "pt-PT": "pt",
  sv: "sv", nb: "no", cs: "cs", ru: "ru", ar: "ar", zu: "zu", "zh-Hans": "zh-CN",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cache = new Map();

async function translate(text, tl) {
  const ck = `${tl}:${text}`;
  if (cache.has(ck)) return cache.get(ck);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const out = data[0].map((s) => s[0]).join("");
        if (out) { cache.set(ck, out); return out; }
      }
    } catch { /* retry */ }
    await sleep(400);
  }
  cache.set(ck, null);
  return null;
}

function set(obj, path, val) {
  let o = obj;
  for (const k of path.slice(0, -1)) o = o[k] ??= {};
  o[path[path.length - 1]] = val;
}

let total = 0, failed = 0;
for (const file of readdirSync(DIR)) {
  if (!file.endsWith(".json")) continue;
  const locale = file.replace(/\.json$/, "");
  const data = JSON.parse(readFileSync(join(DIR, file), "utf8"));
  let changed = 0;
  for (const [path, en] of Object.entries(KEYS)) {
    const parts = path.split(".");
    if (locale === "en") { set(data, parts, en); changed++; continue; }
    const t = await translate(en, LANG[locale]);
    if (t) { set(data, parts, t); changed++; total++; }
    else failed++;
    await sleep(100);
  }
  writeFileSync(join(DIR, file), JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`${file}: ${changed} keys`);
}
console.log(`\n${total} translated, ${failed} failed`);
