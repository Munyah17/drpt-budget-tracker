"use client";

import { useEffect } from "react";
import { setActiveLocale } from "@/lib/format";
import { textDirection } from "@/lib/i18n/config";

/** Keeps dates, currency formatting, and the document language in step with the request. */
export default function LocaleSync({ locale }: { locale: string }) {
  setActiveLocale(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = textDirection(locale);
  }, [locale]);

  return null;
}
