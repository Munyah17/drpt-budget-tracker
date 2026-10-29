/** Supported interface languages. English is the fallback. */
export const LOCALES = [
  "en",
  "pt-PT",
  "es",
  "sv",
  "nl",
  "zh-Hans",
  "ar",
  "zu",
  "fr",
  "pl",
  "ru",
  "nb",
  "cs",
  "it",
] as const;

export type AppLocale = (typeof LOCALES)[number];

/** Not a secret. Readable by the language control so a choice sticks across visits. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  "pt-PT": "Português",
  es: "Español",
  sv: "Svenska",
  nl: "Nederlands",
  "zh-Hans": "简体中文",
  ar: "العربية",
  zu: "isiZulu",
  fr: "Français",
  pl: "Polski",
  ru: "Русский",
  nb: "Norsk bokmål",
  cs: "Čeština",
  it: "Italiano",
};

const PRIMARY: Record<string, AppLocale> = {
  en: "en",
  es: "es",
  sv: "sv",
  nl: "nl",
  ar: "ar",
  zu: "zu",
  fr: "fr",
  pl: "pl",
  ru: "ru",
  cs: "cs",
  it: "it",
};

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

export function textDirection(locale: string): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

/**
 * Date and number locales. English keeps the existing UK dates and US currency
 * symbols so the default language does not change how money looks today.
 * Banking figures stay in Latin digits in every language.
 */
export function intlLocaleFor(locale: string): { date: string; number: string } {
  switch (locale) {
    case "pt-PT":
      return { date: "pt-PT", number: "pt-PT" };
    case "es":
      return { date: "es", number: "es" };
    case "sv":
      return { date: "sv-SE", number: "sv-SE" };
    case "nl":
      return { date: "nl-NL", number: "nl-NL" };
    case "zh-Hans":
      return { date: "zh-CN", number: "zh-CN" };
    case "ar":
      return { date: "ar", number: "ar" };
    case "zu":
      return { date: "zu-ZA", number: "zu-ZA" };
    case "fr":
      return { date: "fr-FR", number: "fr-FR" };
    case "pl":
      return { date: "pl-PL", number: "pl-PL" };
    case "ru":
      return { date: "ru-RU", number: "ru-RU" };
    case "nb":
      return { date: "nb-NO", number: "nb-NO" };
    case "cs":
      return { date: "cs-CZ", number: "cs-CZ" };
    case "it":
      return { date: "it-IT", number: "it-IT" };
    default:
      return { date: "en-GB", number: "en-US" };
  }
}

/** Map one BCP 47 tag onto a language this app ships. */
export function matchLocaleTag(tag: string): AppLocale | null {
  const t = tag.trim().toLowerCase().replace(/_/g, "-");
  if (!t || t === "*") return null;

  if (t === "zh" || t.startsWith("zh-hans") || t.startsWith("zh-cn") || t.startsWith("zh-sg") || t.startsWith("zh-my")) {
    return "zh-Hans";
  }
  if (t.startsWith("zh")) return null;

  if (t.startsWith("pt")) return "pt-PT";

  if (t === "no" || t.startsWith("no-") || t.startsWith("nb") || t.startsWith("nn")) return "nb";

  return PRIMARY[t.split("-")[0]] ?? null;
}

/** First supported language in an Accept-Language header, or English. */
export function negotiateAcceptLanguage(header: string | null | undefined): AppLocale {
  if (!header) return "en";

  const ranked = header
    .split(",")
    .map((part) => {
      const [range, ...params] = part.trim().split(";");
      let q = 1;
      for (const param of params) {
        const [key, value] = param.trim().split("=");
        if (key === "q") {
          const parsed = Number(value);
          q = Number.isFinite(parsed) ? parsed : 0;
        }
      }
      return { range, q };
    })
    .filter((item) => item.range)
    .sort((a, b) => b.q - a.q);

  for (const item of ranked) {
    if (item.q <= 0) continue;
    const hit = matchLocaleTag(item.range);
    if (hit) return hit;
  }
  return "en";
}
