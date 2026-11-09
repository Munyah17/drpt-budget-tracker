// One-off: add the regional-pricing disclaimer under the landing pricing card.
// Run: node scripts/i18n-price-note.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = ["en", "pt-PT", "es", "sv", "nl", "zh-Hans", "ar", "zu", "fr", "pl", "ru", "nb", "cs", "it"];

const NOTE = {
  en: ["Prices may differ according to regions and operational regulatory requirements.", "Terms & Conditions Apply"],
  "pt-PT": ["Os preços podem variar consoante as regiões e os requisitos regulamentares operacionais.", "Aplicam-se os Termos e Condições"],
  es: ["Los precios pueden variar según las regiones y los requisitos regulatorios operativos.", "Se aplican los Términos y Condiciones"],
  sv: ["Priser kan skilja sig åt beroende på region och operativa regulatoriska krav.", "Allmänna villkor gäller"],
  nl: ["Prijzen kunnen variëren afhankelijk van regio's en operationele regelgevingsvereisten.", "Algemene voorwaarden zijn van toepassing"],
  "zh-Hans": ["价格可能因地区和运营监管要求而异。", "适用条款和条件"],
  ar: ["قد تختلف الأسعار حسب المناطق والمتطلبات التنظيمية التشغيلية.", "تخضع للشروط والأحكام"],
  zu: ["Izindleko zingahlukaissorodwe nemiphakathi nemibandela yomthetho wokusebenza.", "Imigomo Nemibandela iyasebenza"],
  fr: ["Les prix peuvent varier selon les régions et les exigences réglementaires opérationnelles.", "Conditions générales applicables"],
  pl: ["Ceny mogą się różnić w zależności od regionu i wymogów regulacyjnych.", "Obowiązują warunki i postanowienia"],
  ru: ["Цены могут отличаться в зависимости от региона и операционных регуляторных требований.", "Действуют условия и положения"],
  nb: ["Prisene kan variere etter region og operasjonelle regulatoriske krav.", "Vilkår og betingelser gjelder"],
  cs: ["Ceny se mohou lišit podle regionu a provozních regulačních požadavků.", "Platí obchodní podmínky"],
  it: ["I prezzi possono variare in base alle regioni e ai requisiti normativi operativi.", "Si applicano i termini e le condizioni"],
};

for (const loc of LOCALES) {
  const file = join(root, "messages", `${loc}.json`);
  const data = JSON.parse(readFileSync(file, "utf8"));
  data.Landing = data.Landing || {};
  data.Landing.pricing = data.Landing.pricing || {};
  const [priceNote, tncApply] = NOTE[loc];
  data.Landing.pricing.priceNote = priceNote;
  data.Landing.pricing.tncApply = tncApply;
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log(`updated ${loc}.json`);
}
