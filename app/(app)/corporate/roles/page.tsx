"use client";

import { useState, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import { useCorpStore, updateCorp, nextId, ALL_PERMS, CorpRoleRec } from "@/lib/corpStore";

function RoleModal({ role, onClose }: { role: CorpRoleRec | null; onClose: () => void }) {
  const t = useTranslations("Pages.corp_roles");
  const { toast } = useAppData();
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [perms, setPerms] = useState<string[]>(role?.perms ?? []);

  const toggle = (p: string) =>
    setPerms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  function submit(e: FormEvent) {
    e.preventDefault();
    if (role) {
      updateCorp((s) => ({
        ...s,
        roles: s.roles.map((r) => (r.id === role.id ? { ...r, name, description, perms } : r)),
      }));
      toast(t("toastUpdated", { name }), "check-circle");
    } else {
      updateCorp((s) => ({
        ...s,
        roles: [...s.roles, { id: nextId("role"), name, description, members: 0, perms }],
      }));
      toast(t("toastCreated", { name }), "check-circle");
    }
    onClose();
  }

  return (
    <Modal title={role ? t("editTitle", { name: role.name }) : t("newRole")} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field"><label>{t("fieldName")}</label><input required value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} /></div>
        <div className="field"><label>{t("fieldDescription")}</label><input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("descPlaceholder")} /></div>
        <div className="field">
          <label>{t("fieldPermissions")}</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
            {ALL_PERMS.map((p) => (
              <label key={p} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "8px 10px", borderRadius: 10, border: `1.5px solid ${perms.includes(p) ? "var(--rose-600)" : "var(--card-border)"}`, cursor: "pointer", background: perms.includes(p) ? "var(--pink-100)" : "transparent" }}>
                <input type="checkbox" checked={perms.includes(p)} onChange={() => toggle(p)} />
                {t(`perms.${p}`)}
              </label>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">
          {role ? t("saveRole") : t("createRole")}
        </button>
      </form>
    </Modal>
  );
}

export default function RolesPage() {
  const t = useTranslations("Pages.corp_roles");
  const { toast } = useAppData();
  const store = useCorpStore();
  const [editing, setEditing] = useState<CorpRoleRec | null>(null);
  const [creating, setCreating] = useState(false);

  function remove(r: CorpRoleRec) {
    updateCorp((s) => ({ ...s, roles: s.roles.filter((x) => x.id !== r.id) }));
    toast(t("toastRemoved", { name: r.name }), "trash-2");
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />{t("newRole")}
        </button>
      </div>

      <div className="grid grid-3">
        {store.roles.map((r) => (
          <div key={r.id} className="glass-card card-pad">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>{r.description}</div>
              </div>
              <span className="badge badge-blue">{t("membersBadge", { count: r.members })}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "10px 0 14px" }}>
              {r.perms.length === 0 && <span style={{ fontSize: 12, color: "var(--ink-500)" }}>{t("noPermissions")}</span>}
              {r.perms.map((p) => (
                <span key={p} className="chip" style={{ fontSize: 11 }}>{t.has(`perms.${p}`) ? t(`perms.${p}`) : p}</span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(r)}>
                <Icon name="pencil" size={13} style={{ marginRight: 4 }} />{t("edit")}
              </button>
              {r.id !== "r1" && (
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }} onClick={() => remove(r)}>
                  <Icon name="trash-2" size={13} style={{ marginRight: 4 }} />{t("delete")}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card card-pad" style={{ marginTop: 20, fontSize: 13, color: "var(--ink-500)", lineHeight: 1.7 }}>
        <Icon name="settings" size={15} style={{ marginRight: 6, verticalAlign: -2 }} />
        {t.rich("footerNote", { b: (chunks) => <b>{chunks}</b> })}
      </div>

      {creating && <RoleModal role={null} onClose={() => setCreating(false)} />}
      {editing && <RoleModal role={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
