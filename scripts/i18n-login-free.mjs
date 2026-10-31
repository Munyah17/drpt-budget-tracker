// Adds Login.signupTitleFree + Login.createFree to all locale files.
// Run: node scripts/i18n-login-free.mjs
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const DIR = fileURLToPath(new URL("../messages/", import.meta.url));

const en = { signupTitleFree: "Create your free account", createFree: "Create Account" };

const L = {
  fr: { signupTitleFree: "Crée ton compte gratuit", createFree: "Créer un compte" },
  es: { signupTitleFree: "Crea tu cuenta gratuita", createFree: "Crear cuenta" },
  it: { signupTitleFree: "Crea il tuo account gratuito", createFree: "Crea account" },
  nl: { signupTitleFree: "Maak je gratis account aan", createFree: "Account aanmaken" },
  pl: { signupTitleFree: "Utwórz darmowe konto", createFree: "Utwórz konto" },
  "pt-PT": { signupTitleFree: "Cria a tua conta gratuita", createFree: "Criar conta" },
  sv: { signupTitleFree: "Skapa ditt gratiskonto", createFree: "Skapa konto" },
  nb: { signupTitleFree: "Lag gratiskontoen din", createFree: "Opprett konto" },
  cs: { signupTitleFree: "Vytvoř si bezplatný účet", createFree: "Vytvořit účet" },
  ru: { signupTitleFree: "Создай бесплатный аккаунт", createFree: "Создать аккаунт" },
  ar: { signupTitleFree: "أنشئ حسابك المجاني", createFree: "إنشاء حساب" },
  zu: { signupTitleFree: "Yenza i-akhawunti yakho yamahhala", createFree: "Yenza i-akhawunti" },
};

for (const file of readdirSync(DIR)) {
  if (!file.endsWith(".json")) continue;
  const path = join(DIR, file);
  const locale = file.replace(/\.json$/, "");
  const t = L[locale] ?? en;
  const data = JSON.parse(readFileSync(path, "utf8"));
  data.Login = { ...(data.Login ?? {}), ...t };
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`${file} <- ${L[locale] ? locale : "en (fallback)"}`);
}
