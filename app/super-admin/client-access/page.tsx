"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";

/**
 * Client Access — the client shift. One click transforms the super admin
 * into a full regular user (same session, no re-login). The banner inside the
 * user app offers the instant shift back.
 */
export default function ClientAccessPage() {
  const t = useTranslations("SuperAdmin");
  const { shiftToClient } = useAppData();
  const router = useRouter();

  const shift = () => {
    shiftToClient();
    router.push("/dashboard");
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("clientAccessTitle")}</h2>
          <p className="section-sub">{t("clientAccessSub")}</p>
        </div>
      </div>

      <div className="glass-card card-pad" style={{ maxWidth: 640 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 20 }}>
          <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--rose-600)", width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="user" size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{t("clientAccessHeading")}</div>
            <p style={{ fontSize: 13.5, color: "var(--ink-500)", lineHeight: 1.6, margin: 0 }}>
              {t("clientAccessBody")}
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          <div className="glass-card" style={{ padding: 16, border: "1px solid var(--card-border)" }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: "var(--rose-600)" }}>{t("consoleNature")}</div>
            <p style={{ fontSize: 12.5, color: "var(--ink-500)", margin: 0, lineHeight: 1.5 }}>{t("consoleNatureBody")}</p>
          </div>
          <div className="glass-card" style={{ padding: 16, border: "1px solid var(--card-border)" }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: "var(--green)" }}>{t("clientNature")}</div>
            <p style={{ fontSize: 12.5, color: "var(--ink-500)", margin: 0, lineHeight: 1.5 }}>{t("clientNatureBody")}</p>
          </div>
        </div>

        <button className="btn btn-primary" onClick={shift} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Icon name="user" size={16} />
          {t("shiftToClient")}
        </button>
        <p style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 12, marginBottom: 0 }}>
          {t("shiftNote")}
        </p>
      </div>
    </>
  );
}
