import type { Metadata } from "next";
import "./globals.css";
import "@fontsource-variable/source-sans-3";
import { AppDataProvider } from "@/lib/AppDataContext";
import { CashFlowProvider } from "@/lib/CashFlowContext";
import ToastHost from "@/components/ToastHost";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "WellSpend Budget Tracker ❤",
  description: "Track income, expenses and savings goals in one calm, beautiful place.",
  themeColor: "#c81057",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body>
        <AppDataProvider>
          <CashFlowProvider>
            <PwaRegister />
            {children}
            <ToastHost />
          </CashFlowProvider>
        </AppDataProvider>
      </body>
    </html>
  );
}
