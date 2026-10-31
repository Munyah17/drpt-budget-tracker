// Adds Landing.footer.privacy + Landing.footer.terms to all locale files.
// Run: node scripts/i18n-footer-legal.mjs
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const DIR = fileURLToPath(new URL("../messages/", import.meta.url));

const en = { privacy: "Privacy", terms: "Terms" };

const L = {
  fr: { privacy: "Confidentialité", terms: "Conditions" },
  es: { privacy: "Privacidad", terms: "Términos" },
  it: { privacy: "Privacy", terms: "Termini" },
  nl: { privacy: "Privacy", terms: "Voorwaarden" },
  pl: { privacy: "Prywatność", terms: "Warunki" },
  "pt-PT": { privacy: "Privacidade", terms: "Termos" },
  sv: { privacy: "Integritet", terms: "Villkor" },
  nb: { privacy: "Personvern", terms: "Vilkår" },
  cs: { privacy: "Soukromí", terms: "Podmínky" },
  ru: { privacy: "Конфиденциальность", terms: "Условия" },
  ar: { privacy: "الخصوصية", terms: "الشروط" },
  zu: { privacy: "Ubumfihlo", terms: "Imigomo" },
};

for (const file of readdirSync(DIR)) {
  if (!file.endsWith(".json")) continue;
  const path = join(DIR, file);
  const locale = file.replace(/\.json$/, "");
  const t = L[locale] ?? en;
  const data = JSON.parse(readFileSync(path, "utf8"));
  data.Landing ??= {};
  data.Landing.footer = { ...(data.Landing.footer ?? {}), ...t };
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`${file} <- ${L[locale] ? locale : "en (fallback)"}`);
}
