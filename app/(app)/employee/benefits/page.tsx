"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import RecordModal, { RowRecord } from "@/components/RecordModal";

const BENEFITS = [
  { key: "healthInsurance", provider: "Vitality Health", status: "Enrolled" },
  { key: "pensionScheme", provider: "Nest Pensions", status: "Enrolled" },
  { key: "lifeInsurance", provider: "Aviva", status: "Enrolled" },
  { key: "dentalCover", provider: "Bupa", status: "Available" },
  { key: "cycleToWork", provider: "Cyclescheme", status: "Available" },
];

export default function EmployeeBenefitsPage() {
  const { user, toast } = useAppData();
  const t = useTranslations("Pages.emp_benefits");
  const [benefits, setBenefits] = useState(BENEFITS);
  const [managing, setManaging] = useState<RowRecord | null>(null);

  const statusLabel = (s: string) => (s === "Enrolled" ? t("statusEnrolled") : s === "Available" ? t("statusAvailable") : s);

  const handleAction = (key: string, status: string) => {
    if (status === "Enrolled") {
      const b = benefits.find((x) => x.key === key);
      if (b) setManaging({
        [t("fieldName")]: t(`benefits.${b.key}.name`),
        [t("fieldProvider")]: b.provider,
        [t("fieldStatus")]: statusLabel(b.status),
        [t("fieldDetail")]: t(`benefits.${b.key}.detail`),
      });
    } else {
      setBenefits((prev) => prev.map((x) => (x.key === key ? { ...x, status: "Enrolled" } : x)));
      toast(t("enrolledToast", { name: t(`benefits.${key}.name`) }));
    }
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle", { org: user?.organisation ?? t("yourOrganisation") })}</p>
        </div>
      </div>

      <div className="grid grid-2">
        {benefits.map((b) => (
          <div key={b.key} className="glass-card card-pad" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: "var(--pink-100)", color: "var(--rose-600)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon name="heart-pulse" size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t(`benefits.${b.key}.name`)}</div>
                <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{b.provider} — {t(`benefits.${b.key}.detail`)}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className={`badge ${b.status === "Enrolled" ? "badge-green" : "badge-blue"}`}>{statusLabel(b.status)}</span>
              <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => handleAction(b.key, b.status)}>
                {b.status === "Enrolled" ? t("manage") : t("enrol")}
              </button>
            </div>
          </div>
        ))}
      </div>
      {managing && <RecordModal mode="view" title={t("benefitDetails")} record={managing} onClose={() => setManaging(null)} />}
    </>
  );
}
