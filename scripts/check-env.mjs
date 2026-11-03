// Verifies required env vars are present (values are never printed).
// Run: node scripts/check-env.mjs
import { readFileSync, existsSync } from "fs";

const env = { ...process.env };
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const REQUIRED = [
  ["NEXT_PUBLIC_SUPABASE_URL", "Supabase project URL"],
  ["SUPABASE_SERVICE_ROLE_KEY", "Supabase service role key (server only)"],
  ["SUPABASE_JWT_SECRET", "Supabase JWT secret — required by requireSession for ALL authed API routes"],
  ["STRIPE_SECRET_KEY", "Stripe secret — activation + banking unlock checkout"],
  ["STRIPE_WEBHOOK_SECRET", "Stripe webhook secret — payments won't apply without it"],
  ["GEMINI_API_KEY", "Google AI Studio key — receipt/document extraction"],
  ["PLAID_CLIENT_ID", "Plaid client id — open banking"],
  ["PLAID_SECRET", "Plaid secret — open banking (use the key for PLAID_ENV)"],
  ["PLAID_ENV", "Plaid environment: sandbox | development | production"],
  ["GROQ_API_KEY", "Groq key — spreadsheet column mapping + text parsing"],
  ["CRON_SECRET", "Cron bearer — protects /api/reminders/run + /api/banking/run"],
];

let missing = 0;
console.log("Env check\n---------");
for (const [key, why] of REQUIRED) {
  const set = !!env[key];
  if (!set) missing++;
  console.log(`${set ? " ok  " : "MISS"} ${key} — ${why}`);
}
console.log(`\n${missing} missing — ${missing ? "add them to .env.local (local) and Vercel env (production)" : "all set"}`);
process.exit(missing ? 1 : 0);
