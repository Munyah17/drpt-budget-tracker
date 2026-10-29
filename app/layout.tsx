import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import "./globals.css";
import "@fontsource-variable/source-sans-3";
import { AppDataProvider } from "@/lib/AppDataContext";
import { CashFlowProvider } from "@/lib/CashFlowContext";
import ToastHost from "@/components/ToastHost";
import PwaRegister from "@/components/PwaRegister";
import NativeLock from "@/components/NativeLock";
import LocaleSync from "@/components/LocaleSync";
import { textDirection } from "@/lib/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#c81057",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} dir={textDirection(locale)}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LocaleSync locale={locale} />
          <AppDataProvider>
            <CashFlowProvider>
              <PwaRegister />
              <NativeLock />
              {children}
              <ToastHost />
            </CashFlowProvider>
          </AppDataProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
