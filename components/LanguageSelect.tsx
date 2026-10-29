"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { setActiveLocale } from "@/lib/format";
import { isAppLocale, LOCALE_COOKIE, LOCALE_LABELS, LOCALES, textDirection } from "@/lib/i18n/config";

export default function LanguageSelect({
  id,
  compact = false,
}: {
  id?: string;
  compact?: boolean;
}) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("Language");

  function onChange(next: string) {
    if (!isAppLocale(next) || next === locale) return;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(next)}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    setActiveLocale(next);
    document.documentElement.lang = next;
    document.documentElement.dir = textDirection(next);
    router.refresh();
  }

  return (
    <select
      id={id}
      className={compact ? "lang-select" : "settings-select"}
      aria-label={t("label")}
      value={isAppLocale(locale) ? locale : "en"}
      onChange={(e) => onChange(e.target.value)}
    >
      {LOCALES.map((code) => (
        <option key={code} value={code}>
          {LOCALE_LABELS[code]}
        </option>
      ))}
    </select>
  );
}
