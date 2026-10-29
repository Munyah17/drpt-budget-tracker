"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";

export default function SystemSettingsPage() {
  const t = useTranslations("Pages.adm_system_settings");
  const { toast } = useAppData();
  const [maintenance, setMaintenance] = useState(false);
  const [debug, setDebug] = useState(true);
  const [rateLimit, setRateLimit] = useState("100");
  const [timeout, setTimeout_] = useState("30 minutes");
  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
      </div>

      <div className="glass-card card-pad" style={{ maxWidth: 600 }}>
        <div className="settings-row">
          <div>
            <div className="label">{t("maintenanceLabel")}</div>
            <div className="sub">{t("maintenanceSub")}</div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={maintenance} onChange={(e) => setMaintenance(e.target.checked)} />
            <span className="track"><span className="knob" /></span>
          </label>
        </div>
        <div className="settings-row">
          <div>
            <div className="label">{t("debugLabel")}</div>
            <div className="sub">{t("debugSub")}</div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={debug} onChange={(e) => setDebug(e.target.checked)} />
            <span className="track"><span className="knob" /></span>
          </label>
        </div>
        <div className="settings-row">
          <div>
            <div className="label">{t("rateLimitLabel")}</div>
            <div className="sub">{t("rateLimitSub")}</div>
          </div>
          <select className="settings-select" value={rateLimit} onChange={(e) => setRateLimit(e.target.value)}>
            <option>50</option>
            <option>100</option>
            <option>200</option>
            <option value="Unlimited">{t("optUnlimited")}</option>
          </select>
        </div>
        <div className="settings-row">
          <div>
            <div className="label">{t("timeoutLabel")}</div>
            <div className="sub">{t("timeoutSub")}</div>
          </div>
          <select className="settings-select" value={timeout} onChange={(e) => setTimeout_(e.target.value)}>
            <option value="15 minutes">{t("opt15min")}</option>
            <option value="30 minutes">{t("opt30min")}</option>
            <option value="1 hour">{t("opt1hour")}</option>
            <option value="24 hours">{t("opt24hours")}</option>
          </select>
        </div>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => toast(t("toastSaved"), "check-circle")}>{t("saveSettings")}</button>
      </div>
    </>
  );
}
