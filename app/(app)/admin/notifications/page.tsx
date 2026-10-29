"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  target: "all" | "paid" | "free";
  sent: string;
}

export default function NotificationsPage() {
  const t = useTranslations("Pages.adm_notifications");
  const { toast } = useAppData();
  const [showCompose, setShowCompose] = useState(false);

  const mockNotifications: Notification[] = [];

  const getTypeBadge = (type: string) => {
    const colors = {
      info: "badge-blue",
      warning: "badge-amber",
      error: "badge-red",
      success: "badge-green",
    };
    return <span className={`badge ${colors[type as keyof typeof colors]}`}>{type}</span>;
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCompose(true)}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          {t("sendNotification")}
        </button>
      </div>

      {showCompose && (
        <div className="glass-card card-pad" style={{ marginBottom: 20, maxWidth: 600 }}>
          <h3 style={{ marginBottom: 16 }}>{t("composeTitle")}</h3>
          <div className="field">
            <label>{t("fieldTitle")}</label>
            <input type="text" placeholder={t("phTitle")} style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }} />
          </div>
          <div className="field">
            <label>{t("fieldMessage")}</label>
            <textarea placeholder={t("phMessage")} rows={4} style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)", resize: "vertical" }} />
          </div>
          <div className="field">
            <label>{t("fieldType")}</label>
            <select style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }}>
              <option>{t("typeInfo")}</option>
              <option>{t("typeWarning")}</option>
              <option>{t("typeError")}</option>
              <option>{t("typeSuccess")}</option>
            </select>
          </div>
          <div className="field">
            <label>{t("fieldTarget")}</label>
            <select style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }}>
              <option>{t("targetAll")}</option>
              <option>{t("targetPaid")}</option>
              <option>{t("targetFree")}</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" onClick={() => { toast(t("toastSent"), "check-circle"); setShowCompose(false); }}>{t("send")}</button>
            <button className="btn btn-ghost" onClick={() => setShowCompose(false)}>{t("cancel")}</button>
          </div>
        </div>
      )}

      <div className="glass-card card-pad">
        <div className="card-head">
          <h3>{t("sentTitle")}</h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("fieldTitle")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("fieldMessage")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("fieldType")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("fieldTarget")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colSent")}</th>
            </tr>
          </thead>
          <tbody>
            {mockNotifications.map((notif) => (
              <tr key={notif.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{notif.title}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{notif.message}</td>
                <td style={{ padding: "12px 8px" }}>{getTypeBadge(notif.type)}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{notif.target}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{notif.sent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
