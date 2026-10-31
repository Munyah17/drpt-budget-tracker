"use client";

import { useTranslations } from "next-intl";
import Icon from "./Icon";

/**
 * Free-tier placeholder shown inside the iPhone app for locked routes.
 * Deliberately contains no price, no purchase button and no external link —
 * directing users to an outside payment mechanism from inside the app would
 * violate App Store guideline 3.1.1.
 */
export default function LockedScreen() {
  const t = useTranslations("Pages.components");
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "64px 24px",
        minHeight: "50vh",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "var(--pink-100)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--rose-600)",
          marginBottom: 20,
        }}
      >
        <Icon name="lock" size={30} />
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>{t("lockTitle")}</h2>
      <p style={{ color: "var(--ink-500)", fontSize: 14, maxWidth: 320, margin: 0, lineHeight: 1.6 }}>
        {t("lockBody")}
      </p>
    </div>
  );
}
