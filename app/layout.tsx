import type { Metadata } from "next";
import "./globals.css";
import "@fontsource-variable/source-sans-3";
import { AppDataProvider } from "@/lib/AppDataContext";
import ToastHost from "@/components/ToastHost";

export const metadata: Metadata = {
  title: "Dr PT ❤ — Personal Budget Tracker",
  description: "Track income, expenses and savings goals in one calm, beautiful place.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body>
        <AppDataProvider>
          {children}
          <ToastHost />
        </AppDataProvider>
      </body>
    </html>
  );
}
