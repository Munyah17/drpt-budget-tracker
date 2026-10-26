"use client";


export default function SystemHealthPage() {
  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">System Health</h2>
          <p className="section-sub">Monitor system performance and uptime</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">System Uptime</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">API Latency</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Error Rate</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Active Connections</div>
          <div className="stat-value">—</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Services</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { name: "Database", status: "healthy", value: "99.9%" },
              { name: "API Server", status: "healthy", value: "99.8%" },
              { name: "Cache", status: "healthy", value: "99.9%" },
              { name: "Storage", status: "warning", value: "78%" },
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
            <h3>Resource Usage</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { name: "CPU Usage", value: 45, color: "var(--green)" },
              { name: "Memory", value: 62, color: "var(--amber)" },
              { name: "Disk Space", value: 78, color: "var(--amber)" },
              { name: "Network", value: 23, color: "var(--green)" },
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
