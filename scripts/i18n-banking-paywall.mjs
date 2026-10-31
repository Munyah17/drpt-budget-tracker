// Adds the per-bank paywall strings to Pages.banking in every locale.
// Run: node scripts/i18n-banking-paywall.mjs
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const DIR = fileURLToPath(new URL("../messages/", import.meta.url));

const en = {
  paywallLine: "Connecting {bank} costs {price} — a one-off unlock",
  toastUnlocked: "Unlocked — finish connecting your bank",
  errCheckout: "Couldn't start the checkout — try again",
};

const L = {
  fr: { paywallLine: "Connecter {bank} coûte {price} — déblocage unique", toastUnlocked: "Débloqué — terminez la connexion de votre banque", errCheckout: "Impossible de lancer le paiement — réessayez" },
  es: { paywallLine: "Conectar {bank} cuesta {price} — desbloqueo único", toastUnlocked: "Desbloqueado — termina de conectar tu banco", errCheckout: "No se pudo iniciar el pago — inténtalo de nuevo" },
  it: { paywallLine: "Collegare {bank} costa {price} — sblocco una tantum", toastUnlocked: "Sbloccato — completa il collegamento della banca", errCheckout: "Impossibile avviare il pagamento — riprova" },
  nl: { paywallLine: "{bank} verbinden kost {price} — eenmalige ontgrendeling", toastUnlocked: "Ontgrendeld — rond het verbinden van je bank af", errCheckout: "Kon de checkout niet starten — probeer opnieuw" },
  pl: { paywallLine: "Połączenie {bank} kosztuje {price} — jednorazowe odblokowanie", toastUnlocked: "Odblokowano — dokończ łączenie banku", errCheckout: "Nie udało się uruchomić płatności — spróbuj ponownie" },
  "pt-PT": { paywallLine: "Ligar {bank} custa {price} — desbloqueio único", toastUnlocked: "Desbloqueado — termina de ligar o teu banco", errCheckout: "Não foi possível iniciar o pagamento — tenta de novo" },
  sv: { paywallLine: "Att koppla {bank} kostar {price} — engångsupplåsning", toastUnlocked: "Upplåst — slutför bankkopplingen", errCheckout: "Kunde inte starta betalningen — försök igen" },
  nb: { paywallLine: "Å koble {bank} koster {price} — engangsopplåsing", toastUnlocked: "Låst opp — fullfør tilkoblingen av banken", errCheckout: "Kunne ikke starte betalingen — prøv igjen" },
  cs: { paywallLine: "Propojení {bank} stojí {price} — jednorázové odemčení", toastUnlocked: "Odemčeno — dokončete propojení banky", errCheckout: "Nepodařilo se spustit platbu — zkuste znovu" },
  ru: { paywallLine: "Подключение {bank} стоит {price} — разовая разблокировка", toastUnlocked: "Разблокировано — завершите подключение банка", errCheckout: "Не удалось запустить оплату — попробуйте снова" },
  ar: { paywallLine: "ربط {bank} يكلف {price} — فتح لمرة واحدة", toastUnlocked: "تم الفتح — أكمل ربط بنكك", errCheckout: "تعذّر بدء الدفع — حاول مجدداً" },
  zu: { paywallLine: "Ukuxhuma i-{bank} kubiza {price} — uvulwa kanye kuphela", toastUnlocked: "Kuvulwe — qedela ukuxhuma ibhange", errCheckout: "Asikwazanga ukuqala inkokhelo — zama futhi" },
};

for (const file of readdirSync(DIR)) {
  if (!file.endsWith(".json")) continue;
  const path = join(DIR, file);
  const locale = file.replace(/\.json$/, "");
  const t = L[locale] ?? en;
  const data = JSON.parse(readFileSync(path, "utf8"));
  data.Pages ??= {};
  data.Pages.banking = { ...(data.Pages.banking ?? {}), ...t };
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`${file} <- ${L[locale] ? locale : "en (fallback)"}`);
}
