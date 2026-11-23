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
  const title = t("title");
  const description = t("description");
  return {
    metadataBase: new URL("https://wellspend.site"),
    title,
    description,
    icons: {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "WellSpend",
    },
    openGraph: {
      type: "website",
      siteName: "WellSpend",
      title,
      description,
      url: "/",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "WellSpend — track income, expenses and savings goals",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
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
