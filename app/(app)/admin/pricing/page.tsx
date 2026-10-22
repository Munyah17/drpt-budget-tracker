"use client";

import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";

export default function PricingPage() {
  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Pricing</h2>
          <p className="section-sub">Manage pricing plans and tiers</p>
        </div>
        <button className="btn btn-primary">
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Add Plan
        </button>
      </div>

      <div className="grid grid-3">
        <div className="glass-card card-pad">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 18 }}>Free</h3>
            <span className="badge badge-amber">Active</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>$0</div>
          <div style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 20 }}>Limited access to basic features</div>
          <ul style={{ listStyle: "none", padding: 0, marginBottom: 20 }}>
            <li style={{ padding: "8px 0", borderBottom: "1px solid var(--card-border)" }}>
              <Icon name="check" size={16} style={{ color: "var(--green)", marginRight: 8 }} />
              Basic dashboard
            </li>
            <li style={{ padding: "8px 0", borderBottom: "1px solid var(--card-border)" }}>
              <Icon name="check" size={16} style={{ color: "var(--green)", marginRight: 8 }} />
              1 account
            </li>
            <li style={{ padding: "8px 0" }}>
              <Icon name="x" size={16} style={{ color: "var(--red)", marginRight: 8 }} />
              Advanced analytics
            </li>
          </ul>
          <button className="btn btn-ghost" style={{ width: "100%" }}>Edit Plan</button>
        </div>

        <div className="glass-card card-pad" style={{ border: "2px solid var(--rose-500)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 18 }}>Premium</h3>
            <span className="badge badge-green">Popular</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>$1</div>
          <div style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 20 }}>One-time payment, full access</div>
          <ul style={{ listStyle: "none", padding: 0, marginBottom: 20 }}>
            <li style={{ padding: "8px 0", borderBottom: "1px solid var(--card-border)" }}>
              <Icon name="check" size={16} style={{ color: "var(--green)", marginRight: 8 }} />
              Full dashboard
            </li>
            <li style={{ padding: "8px 0", borderBottom: "1px solid var(--card-border)" }}>
              <Icon name="check" size={16} style={{ color: "var(--green)", marginRight: 8 }} />
              Unlimited accounts
            </li>
            <li style={{ padding: "8px 0", borderBottom: "1px solid var(--card-border)" }}>
              <Icon name="check" size={16} style={{ color: "var(--green)", marginRight: 8 }} />
              Advanced analytics
            </li>
            <li style={{ padding: "8px 0" }}>
              <Icon name="check" size={16} style={{ color: "var(--green)", marginRight: 8 }} />
              AI Assistant
            </li>
          </ul>
          <button className="btn btn-primary" style={{ width: "100%" }}>Edit Plan</button>
        </div>

        <div className="glass-card card-pad">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 18 }}>Enterprise</h3>
            <span className="badge badge-amber">Coming Soon</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>$9.99</div>
          <div style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 20 }}>Monthly, team features</div>
          <ul style={{ listStyle: "none", padding: 0, marginBottom: 20 }}>
            <li style={{ padding: "8px 0", borderBottom: "1px solid var(--card-border)" }}>
              <Icon name="check" size={16} style={{ color: "var(--green)", marginRight: 8 }} />
              Everything in Premium
            </li>
            <li style={{ padding: "8px 0", borderBottom: "1px solid var(--card-border)" }}>
              <Icon name="check" size={16} style={{ color: "var(--green)", marginRight: 8 }} />
              Team collaboration
            </li>
            <li style={{ padding: "8px 0" }}>
              <Icon name="check" size={16} style={{ color: "var(--green)", marginRight: 8 }} />
              Priority support
            </li>
          </ul>
          <button className="btn btn-ghost" style={{ width: "100%" }}>Edit Plan</button>
        </div>
      </div>
    </>
  );
}
