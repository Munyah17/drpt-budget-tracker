import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { isAppLocale, LOCALE_COOKIE, negotiateAcceptLanguage } from "@/lib/i18n/config";
import { loadMessages } from "@/lib/i18n/loadMessages";
import { setActiveLocale } from "@/lib/format";

export default getRequestConfig(async () => {
  const store = await cookies();
  const requested = store.get(LOCALE_COOKIE)?.value;
  const header = (await headers()).get("accept-language");
  const locale = isAppLocale(requested) ? requested : negotiateAcceptLanguage(header);

  setActiveLocale(locale);

  return {
    locale,
    messages: loadMessages(locale),
  };
});
