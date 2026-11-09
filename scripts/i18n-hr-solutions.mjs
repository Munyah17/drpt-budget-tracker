// One-off: pricing card "Unified HR" → "Unified HR Solutions" (two lines).
// Run: node scripts/i18n-hr-solutions.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const T = {
  en: ["Unified HR", "Solutions"],
  "pt-PT": ["RH", "Soluções unificadas"],
  es: ["RRHH", "Soluciones unificadas"],
  sv: ["Samlad HR", "Lösningar"],
  nl: ["Geïntegreerde HR", "Oplossingen"],
  "zh-Hans": ["一体化人力资源", "解决方案"],
  ar: ["الموارد البشرية", "الحلول الموحدة"],
  zu: ["I-HR", "IziSolutions Ezihlanganisiwe"],
  fr: ["RH", "Solutions unifiées"],
  pl: ["Zintegrowany HR", "Rozwiązania"],
  ru: ["Единый HR", "HR-решения"],
  nb: ["Samlet HR", "HR-løsninger"],
  cs: ["Sjednocený HR", "HR řešení"],
  it: ["HR", "soluzioni unite"],
};

for (const [loc, [l1, l2]] of Object.entries(T)) {
  const file = join(root, "messages", `${loc}.json`);
  const data = JSON.parse(readFileSync(file, "utf8"));
  data.Landing.pricing.hrLine1 = l1;
  data.Landing.pricing.hrLine2 = l2;
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log(`updated ${loc}.json`);
}
