"use client";

import { useTranslations } from "next-intl";
import WalletView from "@/components/WalletView";

export default function WalletPage() {
  const t = useTranslations("Pages.wallet");
  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
      </div>
      <WalletView />
    </>
  );
}
