import en from "../../messages/en.json";
import ar from "../../messages/ar.json";
import cs from "../../messages/cs.json";
import es from "../../messages/es.json";
import fr from "../../messages/fr.json";
import it from "../../messages/it.json";
import nb from "../../messages/nb.json";
import nl from "../../messages/nl.json";
import pl from "../../messages/pl.json";
import ptPT from "../../messages/pt-PT.json";
import ru from "../../messages/ru.json";
import sv from "../../messages/sv.json";
import zhHans from "../../messages/zh-Hans.json";
import zu from "../../messages/zu.json";
import { AppLocale } from "./config";

const CATALOGS: Record<AppLocale, unknown> = {
  en,
  "pt-PT": ptPT,
  es,
  sv,
  nl,
  "zh-Hans": zhHans,
  ar,
  zu,
  fr,
  pl,
  ru,
  nb,
  cs,
  it,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/** Locale strings overlay English, so a missing translation stays English. */
export function deepMerge(
  base: Record<string, unknown>,
  over: unknown
): Record<string, unknown> {
  if (!isRecord(over)) return base;
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(over)) {
    const prev = out[key];
    if (isRecord(value) && isRecord(prev)) out[key] = deepMerge(prev, value);
    else if (typeof value === "string") out[key] = value;
  }
  return out;
}

export function loadMessages(locale: AppLocale): Record<string, unknown> {
  if (locale === "en") return en;
  return deepMerge(en, CATALOGS[locale]);
}
