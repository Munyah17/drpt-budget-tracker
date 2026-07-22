"use client";

import { useAppData } from "@/lib/AppDataContext";
import { USER } from "@/lib/data";
import { gbp, initials } from "@/lib/format";
import Icon from "@/components/Icon";

export default function ProfilePage() {
  const { accounts, toast } = useAppData();

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Profile</h2>
          <p className="section-sub">Your account details and linked accounts</p>
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="glass-card card-pad">
          <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 20 }}>
            <div className="profile-photo">{initials(USER.name)}</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{USER.name}</div>
              <div style={{ fontSize: 13, color: "var(--ink-500)" }}>{USER.email}</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-500)", display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                <Icon name="map-pin" size={12} />
                {USER.location}
              </div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => toast("Profile edit form would open here", "pencil")}>
            Edit Profile <Icon name="pencil" size={14} />
          </button>
          <div style={{ marginTop: 24 }}>
            <div className="field">
              <label>Profession</label>
              <input value="NHS Doctor / Private Practice" disabled style={{ background: "var(--pink-100)" }} />
            </div>
            <div className="field">
              <label>Member since</label>
              <input value="January 2023" disabled style={{ background: "var(--pink-100)" }} />
            </div>
          </div>
        </div>
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Linked Accounts</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => toast("Connect a new bank account", "landmark")}>
              <Icon name="plus" size={14} /> Add Account
            </button>
          </div>
          {accounts.map((a) => (
            <div className="account-row" key={a.name}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="merchant-ic">
                  <Icon name={a.icon} size={16} />
                </div>
                <span style={{ fontWeight: 600 }}>{a.name}</span>
              </div>
              <span style={{ fontWeight: 800 }}>{gbp(a.balance)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
