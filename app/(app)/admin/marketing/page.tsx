"use client";

import { useTranslations } from "next-intl";
import { useCrud } from "@/lib/useCrud";
import Icon from "@/components/Icon";

interface Campaign {
  name: string;
  platform: string;
  reach: string;
  conversions: string;
  status: string;
}

const CAMPAIGNS_DATA: Campaign[] = [];

export default function MarketingPage() {
  const t = useTranslations("Pages.adm_marketing");
  const crud = useCrud(CAMPAIGNS_DATA, t("entityName"));
  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => crud.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          {t("newCampaign")}
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("activeCampaigns")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("totalReach")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("conversions")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("spend")}</div>
          <div className="stat-value">—</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <div className="card-head">
          <h3>{t("activeCampaigns")}</h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("entityName")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colPlatform")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colReach")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("conversions")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {crud.items.map((c, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)", cursor: "pointer" }} onClick={() => crud.openModal("view", c, idx)}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{c.name}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{c.platform}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{c.reach}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{c.conversions}</td>
                <td style={{ padding: "12px 8px" }}><span className={`badge ${c.status === "Active" ? "badge-green" : "badge-amber"}`}>{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {crud.modalNode}
    </>
  );
}
