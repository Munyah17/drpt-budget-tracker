/**
 * Offline verification for the import/banking feature — exercises the pure
 * logic without network or API keys. Run: npx tsx scripts/verify-import-banking.ts
 */
import crypto from "crypto";
import { parseCsv, gridToItems } from "../lib/server/extract/tabular";
import { extractWithGemini } from "../lib/server/extract/gemini";
import { suggestMatch } from "../lib/matching";
import { bankingPriceCents, priceCents } from "../lib/pricing";
import { verifySupabaseJwt } from "../lib/server/jwt";

let pass = 0, fail = 0;
function check(name: string, cond: boolean, extra = "") {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name} ${extra}`); }
}

// ---------- parseCsv ----------
console.log("parseCsv");
{
  const rows = parseCsv('Date,Description,Amount\n01/10/2026,"TESCO STORES, LONDON",-12.40\n');
  check("quoted comma kept in field", rows[1]?.[1] === "TESCO STORES, LONDON", JSON.stringify(rows[1]));
  check("rows parsed", rows.length === 2);
  const crlf = parseCsv("a,b\r\nc,d\r\n\r\n");
  check("crlf + trailing blank skipped", crlf.length === 2);
  const esc = parseCsv('x,"say ""hi""",y\n');
  check("escaped quotes", esc[0]?.[1] === 'say "hi"');
}

// ---------- gridToItems (heuristic path — no GROQ_API_KEY) ----------
console.log("gridToItems (heuristic column mapping)");
{
  const grid = [
    ["Date", "Description", "Amount"],
    ["01/10/2026", "TESCO STORES 3291", "-12.40"],
    ["03/10/2026", "SALARY ACME LTD", "2450.00"],
    ["not-a-date", "junk row", "-5.00"],
  ];
  const items = await gridToItems(grid);
  check("2 valid rows extracted, junk skipped", items.length === 2, String(items.length));
  check("debit → expense", items[0]?.type === "expense" && items[0].amount === 12.4);
  check("credit → income", items[1]?.type === "income" && items[1].amount === 2450);
  check("date normalised ISO", items[0]?.date === "2026-10-01", items[0]?.date);
  check("unmappable grid → empty", (await gridToItems([["foo", "bar"], ["x", "y"]])).length === 0);
}

// ---------- suggestMatch ----------
console.log("suggestMatch");
{
  const expenses = [
    { id: 1, merchant: "Tesco", category: "Food", date: "2026-10-01", amount: 12.4, account: "a", method: "m", tags: [], recurring: false },
    { id: 2, merchant: "Netflix", category: "Subscriptions", date: "2026-10-25", amount: 12.4, account: "a", method: "m", tags: [], recurring: false },
  ];
  const hit = suggestMatch(
    { id: 9, booked_at: "2026-10-02", amount: -12.4, currency: "GBP", counterparty: "TESCO STORES 3291" },
    expenses
  );
  check("same amount + near date + similar name → match", hit?.expenseId === 1, JSON.stringify(hit));
  check(
    "different amount → no match",
    suggestMatch({ id: 9, booked_at: "2026-10-02", amount: -99, currency: "GBP", counterparty: "TESCO STORES" }, expenses) === null
  );
  check(
    "date >3 days away → no match",
    suggestMatch({ id: 9, booked_at: "2026-10-20", amount: -12.4, currency: "GBP", counterparty: "TESCO STORES" }, expenses) === null
  );
  check(
    "amount+date ok but unrelated merchant → no match",
    suggestMatch({ id: 9, booked_at: "2026-10-02", amount: -12.4, currency: "GBP", counterparty: "RAILWAY TICKET OFFICE" }, expenses) === null
  );
}

// ---------- pricing ----------
console.log("banking pricing");
{
  const stripe = bankingPriceCents("stripe", "gb");
  check("gb unlock grosses $1 net (≈$1.34)", stripe === 134, String(stripe));
  check("free-provider price equals activation price", bankingPriceCents("stripe") === priceCents("stripe"));
  check("banking unlock ≥ activation price everywhere", bankingPriceCents("paynow") >= priceCents("paynow"));
}

// ---------- Gemini without a key (error path, must not throw) ----------
console.log("extractWithGemini (no key)");
{
  const saved = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const res = await extractWithGemini("aGk=", "image/png");
  check("missing key → {error} not throw", typeof res === "object" && "error" in res);
  if (saved) process.env.GEMINI_API_KEY = saved;
}

// ---------- JWT verify: valid vs forged ----------
console.log("verifySupabaseJwt");
{
  const secret = "test-secret";
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const head = b64({ alg: "HS256", typ: "JWT" });
  const good = b64({ sub: "u1", aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 600 });
  const sig = crypto.createHmac("sha256", secret).update(`${head}.${good}`).digest("base64url");
  const token = `${head}.${good}.${sig}`;
  check("valid token verifies", verifySupabaseJwt(token, secret)?.sub === "u1");
  // Attacker swaps the payload for a different identity but reuses the signature
  const forged = `${head}.${b64({ sub: "attacker", aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 600 })}.${sig}`;
  check("forged payload with stolen sig rejected", verifySupabaseJwt(forged, secret) === null);
  const wrongSecret = verifySupabaseJwt(token, "other-secret");
  check("wrong secret rejected", wrongSecret === null);
  const expiredPayload = b64({ sub: "u1", aud: "authenticated", exp: 1 });
  const expiredSig = crypto.createHmac("sha256", secret).update(`${head}.${expiredPayload}`).digest("base64url");
  check("expired token rejected", verifySupabaseJwt(`${head}.${expiredPayload}.${expiredSig}`, secret) === null);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
