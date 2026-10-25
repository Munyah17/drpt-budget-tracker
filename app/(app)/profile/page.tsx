"use client";

import { FormEvent, useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import {  fmt, initials , sym } from "@/lib/format";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";

function EditProfileModal({ onClose }: { onClose: () => void }) {
  const { user, updateUser, toast } = useAppData();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateUser({ name, email });
    toast("Profile updated");
    onClose();
  }

  return (
    <Modal title="Edit Profile" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Full name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Email address</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">Save Profile</button>
      </form>
    </Modal>
  );
}

function AddAccountModal({ onClose }: { onClose: () => void }) {
  const { addAccount, toast } = useAppData();
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    addAccount({ name, balance: parseFloat(balance) || 0, icon: "landmark" });
    toast(`${name} account linked`);
    onClose();
  }

  return (
    <Modal title="Link Account" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Account name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Barclays Current" />
        </div>
        <div className="field">
          <label>Current balance ({sym()})</label>
          <input required type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} />
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">Link Account</button>
      </form>
    </Modal>
  );
}

export default function ProfilePage() {
  const { accounts, user } = useAppData();
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const displayName = user?.name ?? "User";
  const displayEmail = user?.email ?? "";

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
            <div className="profile-photo">{initials(displayName)}</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{displayName}</div>
              <div style={{ fontSize: 13, color: "var(--ink-500)" }}>{displayEmail}</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-500)", display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                <Icon name="map-pin" size={12} />
                United Kingdom
              </div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setEditOpen(true)}>
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
            <button className="btn btn-ghost btn-sm" onClick={() => setAddOpen(true)}>
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
              <span style={{ fontWeight: 800 }}>{fmt(a.balance)}</span>
            </div>
          ))}
        </div>
      </div>
      {editOpen && <EditProfileModal onClose={() => setEditOpen(false)} />}
      {addOpen && <AddAccountModal onClose={() => setAddOpen(false)} />}
    </>
  );
}
