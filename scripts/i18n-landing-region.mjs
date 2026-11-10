// One-off: Landing.pricing region picker + dynamic CTA price, all locales.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const T = {
  en:      { regionPh: "Select your country", createFrom: "Create account & pay {price}" },
  "pt-PT": { regionPh: "Selecione o seu país", createFrom: "Criar conta e pagar {price}" },
  es:      { regionPh: "Selecciona tu país", createFrom: "Crear cuenta y pagar {price}" },
  sv:      { regionPh: "Välj ditt land", createFrom: "Skapa konto och betala {price}" },
  nl:      { regionPh: "Selecteer je land", createFrom: "Account aanmaken en {price} betalen" },
  "zh-Hans": { regionPh: "选择您的国家/地区", createFrom: "创建账户并支付 {price}" },
  ar:      { regionPh: "اختر بلدك", createFrom: "أنشئ حسابًا وادفع {price}" },
  zu:      { regionPh: "Khetha izwe lakho", createFrom: "Yenza i-akhawunti uphose {price}" },
  fr:      { regionPh: "Sélectionnez votre pays", createFrom: "Créer un compte et payer {price}" },
  pl:      { regionPh: "Wybierz swój kraj", createFrom: "Utwórz konto i zapłać {price}" },
  ru:      { regionPh: "Выберите страну", createFrom: "Создать аккаунт и оплатить {price}" },
  nb:      { regionPh: "Velg landet ditt", createFrom: "Opprett konto og betal {price}" },
  cs:      { regionPh: "Vyberte zemi", createFrom: "Vytvořit účet a zaplatit {price}" },
  it:      { regionPh: "Seleziona il tuo paese", createFrom: "Crea account e paga {price}" },
};

for (const [loc, keys] of Object.entries(T)) {
  const file = join(root, "messages", `${loc}.json`);
  const data = JSON.parse(readFileSync(file, "utf8"));
  data.Landing = data.Landing || {};
  data.Landing.pricing = { ...(data.Landing.pricing || {}), ...keys };
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log(`updated ${loc}.json`);
}
