import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { isAppLocale, LOCALE_COOKIE } from "@/lib/i18n/config";
import { loadMessages } from "@/lib/i18n/loadMessages";
import { setActiveLocale } from "@/lib/format";

export default getRequestConfig(async () => {
  const store = await cookies();
  const requested = store.get(LOCALE_COOKIE)?.value;
  // English is the default, always. The only override is an explicit choice
  // made through the language selector (persisted in NEXT_LOCALE) — browser
  // Accept-Language is deliberately not consulted so the landing language
  // never surprises a visitor.
  const locale = isAppLocale(requested) ? requested : "en";

  setActiveLocale(locale);

  return {
    locale,
    messages: loadMessages(locale),
  };
});
