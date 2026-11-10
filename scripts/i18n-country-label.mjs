// One-off: add Pages.payment.countryLabel (region picker label) to all locales.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const T = {
  en: "Country",
  "pt-PT": "País",
  es: "País",
  sv: "Land",
  nl: "Land",
  "zh-Hans": "国家/地区",
  ar: "البلد",
  zu: "Izwe",
  fr: "Pays",
  pl: "Kraj",
  ru: "Страна",
  nb: "Land",
  cs: "Země",
  it: "Paese",
};

for (const [loc, label] of Object.entries(T)) {
  const file = join(root, "messages", `${loc}.json`);
  const data = JSON.parse(readFileSync(file, "utf8"));
  data.Pages = data.Pages || {};
  data.Pages.payment = data.Pages.payment || {};
  data.Pages.payment.countryLabel = label;
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log(`updated ${loc}.json`);
}
