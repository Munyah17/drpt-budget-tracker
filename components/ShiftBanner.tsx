"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";

/**
 * Client-shift strip — visible across the top of the user app shell while
 * the super admin is living as a regular user. "Return" shifts back into the
 * super-admin console instantly (no re-login).
 */
export default function ShiftBanner() {
  const t = useTranslations("Pages.components");
  const { shifted, shiftToConsole } = useAppData();
  const router = useRouter();

  if (!shifted) return null;

  const back = () => {
    shiftToConsole();
    router.push("/super-admin");
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
        <Icon name="user" size={15} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {t("shiftedClient")}
        </span>
      </span>
      <button
        onClick={back}
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
        <Icon name="shield" size={13} />
        {t("returnToConsole")}
      </button>
    </div>
  );
}
