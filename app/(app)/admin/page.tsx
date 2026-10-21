"use client";

import { useAppData } from "@/lib/AppDataContext";
import { gbp } from "@/lib/format";
import CountUp from "@/components/CountUp";
import Icon from "@/components/Icon";
import BarChart from "@/components/charts/BarChart";
import DonutChart from "@/components/charts/DonutChart";

export default function AdminDashboardPage() {
  const { user } = useAppData();

  // Mock admin operations data
  const kpiData = {
    totalUsers: 1247,
    activeUsers: 892,
    newSignups: 156,
    mrr: 45850,
    churnRate: 2.3,
    systemUptime: 99.9,
    apiLatency: 45,
    errorRate: 0.12,
  };

  const alerts = [
    { id: 1, type: "warning", message: "3 users with failed payment retries", time: "2m ago" },
    { id: 2, type: "error", message: "API latency spike detected (avg 245ms)", time: "15m ago" },
    { id: 3, type: "info", message: "Database backup completed successfully", time: "1h ago" },
  ];

  const recentActivity = [
    { id: 1, action: "User registered", user: "john.doe@email.com", time: "5m ago" },
    { id: 2, action: "Subscription upgraded", user: "sarah.smith@email.com", time: "12m ago" },
    { id: 3, action: "Account suspended", user: "mike.wilson@email.com", time: "25m ago" },
    { id: 4, action: "Payment failed", user: "emma.jones@email.com", time: "32m ago" },
    { id: 5, action: "User deleted", user: "tom.brown@email.com", time: "45m ago" },
  ];

  const systemHealth = [
    { metric: "Database", status: "healthy", value: "99.9%" },
    { metric: "API Server", status: "healthy", value: "99.8%" },
    { metric: "Cache", status: "healthy", value: "99.9%" },
    { metric: "Storage", status: "warning", value: "78%" },
  ];

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Operations Dashboard</h2>
          <p className="section-sub">Platform-wide metrics and system health</p>
        </div>
        <div className="badge badge-green" style={{ fontSize: 13, fontWeight: 600 }}>
          Admin: {user?.name}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Total Users</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--rose-600)" }}>
              <Icon name="users" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={kpiData.totalUsers} decimals={0} />
          </div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>
            +12% vs last month
          </span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Active Users</span>
            <div className="stat-icon" style={{ background: "rgba(26,156,109,.12)", color: "var(--green)" }}>
              <Icon name="user-circle" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={kpiData.activeUsers} decimals={0} />
          </div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>
            71.5% of total
          </span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">MRR</span>
            <div className="stat-icon" style={{ background: "rgba(26,156,109,.12)", color: "var(--green)" }}>
              <Icon name="trending-up" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={kpiData.mrr} prefix="£" />
          </div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>
            +8.4% vs last month
          </span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Churn Rate</span>
            <div className="stat-icon" style={{ background: "rgba(224,38,75,.12)", color: "var(--red)" }}>
              <Icon name="trending-down" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={kpiData.churnRate} decimals={1} suffix="%" />
          </div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>
            -0.5% vs last month
          </span>
        </div>
      </div>

      {/* Second KPI Row */}
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">New Signups (7d)</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--rose-600)" }}>
              <Icon name="user-plus" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={kpiData.newSignups} decimals={0} />
          </div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>
            +23% vs previous week
          </span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">System Uptime</span>
            <div className="stat-icon" style={{ background: "rgba(26,156,109,.12)", color: "var(--green)" }}>
              <Icon name="shield" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={kpiData.systemUptime} decimals={1} suffix="%" />
          </div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>
            Last 30 days
          </span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Avg API Latency</span>
            <div className="stat-icon" style={{ background: "rgba(217,140,14,.12)", color: "var(--amber)" }}>
              <Icon name="zap" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={kpiData.apiLatency} decimals={0} suffix="ms" />
          </div>
          <span className="stat-delta" style={{ color: "var(--amber)" }}>
            +5ms vs baseline
          </span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Error Rate</span>
            <div className="stat-icon" style={{ background: "rgba(26,156,109,.12)", color: "var(--green)" }}>
              <Icon name="check-circle" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={kpiData.errorRate} decimals={2} suffix="%" />
          </div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>
            Within SLA
          </span>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", marginBottom: 20 }}>
        {/* User Growth Chart */}
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>User Growth (30 days)</h3>
            <span className="chip">Last 30 days</span>
          </div>
          <BarChart
            labels={["Week 1", "Week 2", "Week 3", "Week 4"]}
            series={[
              { name: "New Users", color: "#e91e63", data: [42, 58, 31, 25] },
              { name: "Active Users", color: "#1a9c6d", data: [820, 845, 862, 892] },
            ]}
          />
        </div>

        {/* System Health */}
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>System Health</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {systemHealth.map((item, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: item.status === "healthy" ? "var(--green)" : "var(--amber)",
                    }}
                  />
                  <span style={{ fontWeight: 600 }}>{item.metric}</span>
                </div>
                <span style={{ color: item.status === "healthy" ? "var(--green)" : "var(--amber)", fontWeight: 700 }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Alerts */}
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Needs Attention</h3>
            <span className="badge badge-amber">3 alerts</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {alerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  padding: 12,
                  borderRadius: "var(--radius-sm)",
                  background:
                    alert.type === "error"
                      ? "rgba(224,38,75,.08)"
                      : alert.type === "warning"
                      ? "rgba(217,140,14,.08)"
                      : "rgba(26,156,109,.08)",
                  borderLeft: `3px solid ${
                    alert.type === "error" ? "var(--red)" : alert.type === "warning" ? "var(--amber)" : "var(--green)"
                  }`,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 4 }}>{alert.message}</div>
                <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{alert.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Recent Activity</h3>
            <span className="chip">Live</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid var(--card-border)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{activity.action}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{activity.user}</div>
                </div>
                <span style={{ fontSize: 12, color: "var(--ink-500)" }}>{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
