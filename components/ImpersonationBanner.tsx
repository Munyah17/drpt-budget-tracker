"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { activeImpersonation, exitImpersonation } from "@/lib/adminClient";
import Icon from "@/components/Icon";

/**
 * Engineer preview strip — visible across the top of the app shell while a
 * super admin is inside a client's session. Exit restores the admin session.
 */
export default function ImpersonationBanner() {
  const t = useTranslations("Pages.components");
  const { user } = useAppData();
  const [leaving, setLeaving] = useState(false);

  const info = activeImpersonation();
  if (!info) return null;

  // Stale stash (admin logged out & back in, or tab moved on) — clean up and hide.
  if (user && user.email !== info.email) {
    sessionStorage.removeItem("drpt-impersonating");
    sessionStorage.removeItem("drpt-impersonate-backup");
    return null;
  }

  const exit = async () => {
    setLeaving(true);
    await exitImpersonation();
    window.location.href = "/admin";
  };

  return (
    <div
      role="status"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
        padding: "9px 16px",
        background: "var(--rose-600)",
        color: "#fff",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <Icon name="eye" size={15} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {t("impersonating", { name: info.name, email: info.email })}
        </span>
      </span>
      <button
        onClick={exit}
        disabled={leaving}
        style={{
          border: "1px solid rgba(255,255,255,.55)",
          background: "rgba(255,255,255,.14)",
          color: "#fff",
          borderRadius: 8,
          padding: "5px 12px",
          fontSize: 12.5,
          fontWeight: 700,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Icon name="log-out" size={13} />
        {leaving ? t("exiting") : t("exitPreview")}
      </button>
    </div>
  );
}
