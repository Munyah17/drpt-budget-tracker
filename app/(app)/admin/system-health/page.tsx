"use client";

import { useTranslations } from "next-intl";

export default function SystemHealthPage() {
  const t = useTranslations("Pages.adm_system_health");
  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("systemUptime")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("apiLatency")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("errorRate")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("activeConnections")}</div>
          <div className="stat-value">—</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("servicesTitle")}</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { name: t("svcDatabase"), status: "healthy", value: "99.9%" },
              { name: t("svcApiServer"), status: "healthy", value: "99.8%" },
              { name: t("svcCache"), status: "healthy", value: "99.9%" },
              { name: t("svcStorage"), status: "warning", value: "78%" },
            ].map((service, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: service.status === "healthy" ? "var(--green)" : "var(--amber)",
                    }}
                  />
                  <span style={{ fontWeight: 600 }}>{service.name}</span>
                </div>
                <span style={{ color: service.status === "healthy" ? "var(--green)" : "var(--amber)", fontWeight: 700 }}>
                  {service.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("resourcesTitle")}</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { name: t("resCpu"), value: 45, color: "var(--green)" },
              { name: t("resMemory"), value: 62, color: "var(--amber)" },
              { name: t("resDisk"), value: 78, color: "var(--amber)" },
              { name: t("resNetwork"), value: 23, color: "var(--green)" },
            ].map((resource, idx) => (
              <div key={idx}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontWeight: 600 }}>{resource.name}</span>
                  <span>{resource.value}%</span>
                </div>
                <div style={{ height: 8, background: "var(--card-border)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${resource.value}%`, height: "100%", background: resource.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
