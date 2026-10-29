"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import {  fmt, initials , sym } from "@/lib/format";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";

function EditProfileModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Pages.profile");
  const { user, updateUser, toast } = useAppData();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateUser({ name, email });
    toast(t("toastUpdated"));
    onClose();
  }

  return (
    <Modal title={t("editTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>{t("fullName")}</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>{t("email")}</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">{t("saveBtn")}</button>
      </form>
    </Modal>
  );
}

function AddAccountModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Pages.profile");
  const { addAccount, toast } = useAppData();
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    addAccount({ name, balance: parseFloat(balance) || 0, icon: "landmark" });
    toast(t("toastLinked", { name }));
    onClose();
  }

  return (
    <Modal title={t("linkTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>{t("acctName")}</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={t("phAccount")} />
        </div>
        <div className="field">
          <label>{t("balanceLabel", { sym: sym() })}</label>
          <input required type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} />
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">{t("linkTitle")}</button>
      </form>
    </Modal>
  );
}

export default function ProfilePage() {
  const t = useTranslations("Pages.profile");
  const { accounts, user } = useAppData();
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const displayName = user?.name ?? t("defaultUser");
  const displayEmail = user?.email ?? "";

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("sub")}</p>
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
                {t("country")}
              </div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setEditOpen(true)}>
            {t("editTitle")} <Icon name="pencil" size={14} />
          </button>
          <div style={{ marginTop: 24 }}>
            <div className="field">
              <label>{t("profession")}</label>
              <input value={t("professionValue")} disabled style={{ background: "var(--pink-100)" }} />
            </div>
            <div className="field">
              <label>{t("memberSince")}</label>
              <input value={t("memberSinceValue")} disabled style={{ background: "var(--pink-100)" }} />
            </div>
          </div>
        </div>
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("linkedTitle")}</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setAddOpen(true)}>
              <Icon name="plus" size={14} /> {t("addBtn")}
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
