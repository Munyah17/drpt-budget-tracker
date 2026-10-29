"use client";

import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { useCrud } from "@/lib/useCrud";
import Icon from "@/components/Icon";

interface Version {
  version: string;
  released: string;
  changes: string;
  status: string;
}

const VERSIONS_DATA: Version[] = [];

export default function VersionControlPage() {
  const t = useTranslations("Pages.adm_version_control");
  const crud = useCrud(VERSIONS_DATA, t("entityName"));
  const { toast } = useAppData();

  const deploy = () => {
    const next = `v2.${crud.items.length + 1}.0`;
    crud.setItems((prev) => [{ version: next, released: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }), changes: t("newDeployment"), status: "Live" }, ...prev]);
    toast(t("toastDeployed", { version: next }), "check-circle");
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={deploy}>
          <Icon name="upload" size={16} style={{ marginRight: 8 }} />
          {t("deployNew")}
        </button>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("currentVersion")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("totalDeployments")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("lastDeployed")}</div>
          <div className="stat-value">—</div>
        </div>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <h3>{t("currentVersion")}</h3>
          <span className="badge badge-green">{t("badgeLive")}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "var(--pink-100)", borderRadius: "var(--radius-sm)" }}>
            <div>
              <div style={{ fontWeight: 600 }}>v2.1.0</div>
              <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{t("releasedOn", { date: "May 26, 2025" })}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13 }}>{t("latestChange")}</div>
              <div style={{ fontSize: 11, color: "var(--ink-500)" }}>{t("adminPagesCount", { count: 17 })}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <div className="card-head">
          <h3>{t("historyTitle")}</h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("entityName")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colReleased")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colChanges")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {crud.items.map((v, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{v.version}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{v.released}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{v.changes}</td>
                <td style={{ padding: "12px 8px" }}><span className={`badge ${v.status === "Live" ? "badge-green" : v.status === "Archived" ? "badge-red" : "badge-amber"}`}>{v.status}</span></td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "6px 10px" }} onClick={() => crud.openModal("view", v, idx)}>
                    <Icon name="eye" size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {crud.modalNode}
    </>
  );
}
