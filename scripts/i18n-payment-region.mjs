// One-off: region-gate strings for the payment page.
// Run: node scripts/i18n-payment-region.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const T = {
  en: {
    regionPrompt: "Select your country to see prices and payment methods",
    countryPh: "Select country",
    methodStripeAlt: "Pay securely with Stripe — Visa, Mastercard, Amex and more",
  },
  "pt-PT": {
    regionPrompt: "Selecione o seu país para ver preços e métodos de pagamento",
    countryPh: "Selecione o país",
    methodStripeAlt: "Pague em segurança com o Stripe — Visa, Mastercard, Amex e outras",
  },
  es: {
    regionPrompt: "Selecciona tu país para ver precios y métodos de pago",
    countryPh: "Selecciona el país",
    methodStripeAlt: "Paga de forma segura con Stripe — Visa, Mastercard, Amex y más",
  },
  sv: {
    regionPrompt: "Välj ditt land för att se priser och betalningsmetoder",
    countryPh: "Välj land",
    methodStripeAlt: "Betala säkert med Stripe — Visa, Mastercard, Amex med flera",
  },
  nl: {
    regionPrompt: "Selecteer je land om prijzen en betaalmethoden te zien",
    countryPh: "Selecteer land",
    methodStripeAlt: "Betaal veilig met Stripe — Visa, Mastercard, Amex en meer",
  },
  "zh-Hans": {
    regionPrompt: "请选择您的国家/地区以查看价格和支付方式",
    countryPh: "选择国家/地区",
    methodStripeAlt: "通过 Stripe 安全支付——支持 Visa、Mastercard、Amex 等",
  },
  ar: {
    regionPrompt: "اختر بلدك لعرض الأسعار وطرق الدفع",
    countryPh: "اختر الدولة",
    methodStripeAlt: "ادفع بأمان عبر Stripe — Visa وMastercard وAmex وغيرها",
  },
  zu: {
    regionPrompt: "Khetha izwe lakho ukuze ubone izindleko nezindlela zokukhokha",
    countryPh: "Khetha izwe",
    methodStripeAlt: "Khokha ngendlela ephephile nge-Stripe — i-Visa, i-Mastercard, i-Amex nezinye",
  },
  fr: {
    regionPrompt: "Sélectionnez votre pays pour voir les prix et moyens de paiement",
    countryPh: "Sélectionnez le pays",
    methodStripeAlt: "Payez en toute sécurité avec Stripe — Visa, Mastercard, Amex et plus",
  },
  pl: {
    regionPrompt: "Wybierz kraj, aby zobaczyć ceny i metody płatności",
    countryPh: "Wybierz kraj",
    methodStripeAlt: "Płać bezpiecznie przez Stripe — Visa, Mastercard, Amex i inne",
  },
  ru: {
    regionPrompt: "Выберите страну, чтобы увидеть цены и способы оплаты",
    countryPh: "Выберите страну",
    methodStripeAlt: "Безопасная оплата через Stripe — Visa, Mastercard, Amex и другие",
  },
  nb: {
    regionPrompt: "Velg landet ditt for å se priser og betalingsmetoder",
    countryPh: "Velg land",
    methodStripeAlt: "Betal sikkert med Stripe — Visa, Mastercard, Amex med flere",
  },
  cs: {
    regionPrompt: "Vyberte zemi pro zobrazení cen a platebních metod",
    countryPh: "Vyberte zemi",
    methodStripeAlt: "Plaťte bezpečně přes Stripe — Visa, Mastercard, Amex a další",
  },
  it: {
    regionPrompt: "Seleziona il tuo paese per vedere prezzi e metodi di pagamento",
    countryPh: "Seleziona il paese",
    methodStripeAlt: "Paga in sicurezza con Stripe — Visa, Mastercard, Amex e altre",
  },
};

for (const [loc, keys] of Object.entries(T)) {
  const file = join(root, "messages", `${loc}.json`);
  const data = JSON.parse(readFileSync(file, "utf8"));
  data.Pages = data.Pages || {};
  data.Pages.payment = { ...(data.Pages.payment || {}), ...keys };
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log(`updated ${loc}.json`);
}
