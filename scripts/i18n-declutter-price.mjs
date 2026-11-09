// One-off: strip "$1"/price mentions outside the hero and pricing table,
// and add the mandatory country field labels to Login.*.
// Run: node scripts/i18n-declutter-price.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const T = {
  en: {
    signupTitle: "Create your account",
    createPay: "Create Account & Pay",
    signUpLink: "Sign up",
    country: "Country",
    countryPh: "Select country",
    getStarted: "Get Started",
    startShort: "Start",
    payTitle: "Pay yearly",
    payText: "Paynow, card, Ecocash or bank transfer — your pick.",
    ownText: "Full access, all year. Every feature, every update.",
    ctaText: "Registration completes with a yearly subscription — then the whole app is yours.",
    ctaButton: "Get Started",
    paid: "Paid",
  },
  "pt-PT": {
    signupTitle: "Crie a sua conta",
    createPay: "Criar conta e pagar",
    signUpLink: "Registe-se",
    country: "País",
    countryPh: "Selecione o país",
    getStarted: "Começar",
    startShort: "Começar",
    payTitle: "Pagar anualmente",
    payText: "Paynow, cartão, Ecocash ou transferência bancária – você escolhe.",
    ownText: "Acesso total, o ano todo. Cada recurso, cada atualização.",
    ctaText: "O registo termina com uma subscrição anual — depois a app é toda tua.",
    ctaButton: "Começar",
    paid: "Pago",
  },
  es: {
    signupTitle: "Crea tu cuenta",
    createPay: "Crear cuenta y pagar",
    signUpLink: "Regístrate",
    country: "País",
    countryPh: "Selecciona el país",
    getStarted: "Empezar",
    startShort: "Empezar",
    payTitle: "Paga anualmente",
    payText: "Paynow, tarjeta, Ecocash o transferencia bancaria: tú eliges.",
    ownText: "Acceso completo, todo el año. Cada característica, cada actualización.",
    ctaText: "El registro se completa con una suscripción anual — después toda la app es tuya.",
    ctaButton: "Empezar",
    paid: "Pagado",
  },
  sv: {
    signupTitle: "Skapa ditt konto",
    createPay: "Skapa konto & betala",
    signUpLink: "Registrera dig",
    country: "Land",
    countryPh: "Välj land",
    getStarted: "Kom igång",
    startShort: "Start",
    payTitle: "Betala årligen",
    payText: "Paynow, kort, Ecocash eller banköverföring - ditt val.",
    ownText: "Full tillgång, hela året. Varje funktion, varje uppdatering.",
    ctaText: "Registreringen slutförs med en årsprenumeration — sen är hela appen din.",
    ctaButton: "Kom igång",
    paid: "Betald",
  },
  nl: {
    signupTitle: "Maak je account aan",
    createPay: "Account aanmaken & betalen",
    signUpLink: "Registreer je",
    country: "Land",
    countryPh: "Selecteer land",
    getStarted: "Aan de slag",
    startShort: "Start",
    payTitle: "Betaal jaarlijks",
    payText: "Betaal nu, kaart, Ecocash of bankoverschrijving: jouw keuze.",
    ownText: "Volledige toegang, het hele jaar door. Elke functie, elke update.",
    ctaText: "Je registratie wordt afgerond met een jaarabonnement — daarna is de hele app van jou.",
    ctaButton: "Aan de slag",
    paid: "Betaald",
  },
  "zh-Hans": {
    signupTitle: "创建您的账户",
    createPay: "创建账户并支付",
    signUpLink: "注册",
    country: "国家",
    countryPh: "选择国家",
    getStarted: "立即开始",
    startShort: "开始",
    payTitle: "每年付费",
    payText: "Paynow、银行卡、Ecocash 或银行转账——由您选择。",
    ownText: "全年完整访问。每项功能,每次更新。",
    ctaText: "注册后即为年度订阅——之后整个应用都属于您。",
    ctaButton: "立即开始",
    paid: "已付费",
  },
  ar: {
    signupTitle: "أنشئ حسابك",
    createPay: "إنشاء الحساب وإتمام الدفع",
    signUpLink: "سجّل",
    country: "الدولة",
    countryPh: "اختر الدولة",
    getStarted: "ابدأ الآن",
    startShort: "ابدأ",
    payTitle: "ادفع سنويًا",
    payText: "Paynow أو البطاقة أو Ecocash أو التحويل البنكي — الخيار لك.",
    ownText: "وصول كامل طوال العام. كل ميزة وكل تحديث.",
    ctaText: "يكتمل التسجيل باشتراك سنوي — ثم يصبح التطبيق كله لك.",
    ctaButton: "ابدأ الآن",
    paid: "مدفوع",
  },
  zu: {
    signupTitle: "Dala i-akhawunti yakho",
    createPay: "Yenza i-akhawunti & khokhela",
    signUpLink: "Bhalisa",
    country: "Izwe",
    countryPh: "Khetha izwe",
    getStarted: "Qala",
    startShort: "Qala",
    payTitle: "Khokha ngonyaka",
    payText: "I-Paynow, ikhadi, i-Ecocash noma inkokhelo yebhange — khetha inketho yakho.",
    ownText: "Ukufinyelela okuphelele unyaka lonke. Yonke isici, yonke isibuyekezo.",
    ctaText: "Ukubhalisa kuphothulwa=isivumelwano senyanga — bese i-app ephelele iba ngeyakho.",
    ctaButton: "Qala",
    paid: "Kukhokhliwe",
  },
  fr: {
    signupTitle: "Créez votre compte",
    createPay: "Créer un compte et payer",
    signUpLink: "Inscrivez-vous",
    country: "Pays",
    countryPh: "Sélectionnez le pays",
    getStarted: "Commencer",
    startShort: "Démarrer",
    payTitle: "Paiement annuel",
    payText: "Paynow, carte, Ecocash ou virement bancaire – votre choix.",
    ownText: "Accès complet, toute l'année. Chaque fonctionnalité, chaque mise à jour.",
    ctaText: "L''inscription se termine par un abonnement annuel — ensuite l''app est à toi.",
    ctaButton: "Commencer",
    paid: "Payé",
  },
  pl: {
    signupTitle: "Utwórz konto",
    createPay: "Utwórz konto i zapłać",
    signUpLink: "Zarejestruj się",
    country: "Kraj",
    countryPh: "Wybierz kraj",
    getStarted: "Zacznij",
    startShort: "Start",
    payTitle: "Płać rocznie",
    payText: "Paynow, karta, Ecocash lub przelew bankowy — Twój wybór.",
    ownText: "Pełny dostęp przez cały rok. Każda funkcja, każda aktualizacja.",
    ctaText: "Rejestracja kończy się roczną subskrypcją — potem cała aplikacja jest Twoja.",
    ctaButton: "Zacznij",
    paid: "Opłacone",
  },
  ru: {
    signupTitle: "Создайте аккаунт",
    createPay: "Создать аккаунт и оплатить",
    signUpLink: "Зарегистрироваться",
    country: "Страна",
    countryPh: "Выберите страну",
    getStarted: "Начать",
    startShort: "Старт",
    payTitle: "Оплата раз в год",
    payText: "Paynow, карта, Ecocash или банковский перевод — на ваш выбор.",
    ownText: "Полный доступ круглый год. Каждая функция, каждое обновление.",
    ctaText: "Регистрация завершается годовой подпиской — и всё приложение твоё.",
    ctaButton: "Начать",
    paid: "Оплачено",
  },
  nb: {
    signupTitle: "Opprett kontoen din",
    createPay: "Opprett konto & betal",
    signUpLink: "Registrer deg",
    country: "Land",
    countryPh: "Velg land",
    getStarted: "Kom i gang",
    startShort: "Start",
    payTitle: "Betal i året",
    payText: "Paynow, kort, Ecocash eller bankoverføring – ditt valg.",
    ownText: "Full tilgang, hele året. Hver funksjon, hver oppdatering.",
    ctaText: "Registreringen fullføres med et årsabonnement — så er hele appen din.",
    ctaButton: "Kom i gang",
    paid: "Betalt",
  },
  cs: {
    signupTitle: "Vytvořte si účet",
    createPay: "Vytvořit účet a zaplatit",
    signUpLink: "Zaregistrujte se",
    country: "Země",
    countryPh: "Vyberte zemi",
    getStarted: "Začít",
    startShort: "Start",
    payTitle: "Roční platba",
    payText: "Paynow, karta, Ecocash nebo bankovní převod – vaše volba.",
    ownText: "Plný přístup po celý rok. Každá funkce, každá aktualizace.",
    ctaText: "Registrace končí ročním předplatným — pak je celá aplikace tvoje.",
    ctaButton: "Začít",
    paid: "Zaplaceno",
  },
  it: {
    signupTitle: "Crea il tuo account",
    createPay: "Crea account e paga",
    signUpLink: "Registrati",
    country: "Paese",
    countryPh: "Seleziona il paese",
    getStarted: "Inizia ora",
    startShort: "Inizia",
    payTitle: "Pagamento annuale",
    payText: "Paynow, carta, Ecocash o bonifico bancario: a te la scelta.",
    ownText: "Accesso completo, tutto l'anno. Ogni funzionalità, ogni aggiornamento.",
    ctaText: "La registrazione si completa con un abbonamento annuale — poi l''app è tutta tua.",
    ctaButton: "Inizia ora",
    paid: "Pagato",
  },
};

const set = (obj, path, value) => {
  const keys = path.split(".");
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]] ??= {};
  cur[keys[keys.length - 1]] = value;
};

for (const [loc, v] of Object.entries(T)) {
  const file = join(root, "messages", `${loc}.json`);
  const data = JSON.parse(readFileSync(file, "utf8"));

  set(data, "Login.signupTitle", v.signupTitle);
  set(data, "Login.createPay", v.createPay);
  set(data, "Login.signUpLink", v.signUpLink);
  set(data, "Login.country", v.country);
  set(data, "Login.countryPh", v.countryPh);

  set(data, "Landing.nav.getStarted", v.getStarted);
  set(data, "Landing.nav.startShort", v.startShort);
  set(data, "Landing.how.pay.title", v.payTitle);
  set(data, "Landing.how.pay.text", v.payText);
  set(data, "Landing.how.own.text", v.ownText);
  set(data, "Landing.cta.text", v.ctaText);
  set(data, "Landing.cta.button", v.ctaButton);

  set(data, "Pages.adm_analytics.funnelPaid", v.paid);
  set(data, "Pages.adm_analytics.eventPaid", v.paid);

  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log(`updated ${loc}.json`);
}
