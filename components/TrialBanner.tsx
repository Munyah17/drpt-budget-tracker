"use client";

import { useAppData } from "@/lib/AppDataContext";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export default function TrialBanner() {
  const { corporateSettings, user } = useAppData();
  const t = useTranslations("Components.TrialBanner");
  const router = useRouter();

  if (!user || user.role !== "corporate" || !corporateSettings) {
    return null;
  }

  const { trialActive, trialDaysLeft } = corporateSettings;

  if (!trialActive) {
    return null;
  }

  const isExpiringSoon = trialDaysLeft <= 2;

  return (
    <div
      style={{
        background: isExpiringSoon
          ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
          : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        color: "white",
        padding: "0.75rem 1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "0.875rem",
        fontWeight: 500,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>{isExpiringSoon ? "⚠️" : "🎉"}</span>
        <span>
          {isExpiringSoon
            ? t("expiringSoon", { days: trialDaysLeft })
            : t("trialActive", { days: trialDaysLeft })}
        </span>
      </div>
      <button
        onClick={() => router.push("/corporate/settings")}
        style={{
          background: "rgba(255,255,255,0.2)",
          border: "1px solid rgba(255,255,255,0.3)",
          color: "white",
          padding: "0.25rem 0.75rem",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "0.75rem",
          fontWeight: 600,
        }}
      >
        {t("upgrade")}
      </button>
    </div>
  );
}
