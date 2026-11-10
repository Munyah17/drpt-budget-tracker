// One-off: add Pages.payment.fee_municipal (US market levy label) to all locales.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const T = {
  en: "Municipal & state levies",
  "pt-PT": "Taxas municipais e estatais",
  es: "Tasas municipales y estatales",
  sv: "Kommunala och statliga avgifter",
  nl: "Gemeentelijke en staatsheffingen",
  "zh-Hans": "PLACEHOLDER_ZH",
  ar: "رسوم بلدية وولائية",
  zu: "Imali yebanhlokweni nezifundazwe",
  fr: "Taxes municipales et étatiques",
  pl: "Opłaty gminne i stanowe",
  ru: "Муниципальные и государственные сборы",
  nb: "Kommunale og statlige avgifter",
  cs: "Obecní a státní poplatky",
  it: "Tasse comunali e statali",
};

for (const [loc, label] of Object.entries(T)) {
  const file = join(root, "messages", `${loc}.json`);
  const data = JSON.parse(readFileSync(file, "utf8"));
  data.Pages = data.Pages || {};
  data.Pages.payment = data.Pages.payment || {};
  data.Pages.payment.fee_municipal = label;
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log(`updated ${loc}.json`);
}
