"use client";

import { useState, FormEvent } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import { useCorpStore, updateCorp, nextId, ALL_PERMS, PERM_LABELS, CorpRoleRec } from "@/lib/corpStore";

function RoleModal({ role, onClose }: { role: CorpRoleRec | null; onClose: () => void }) {
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
      toast(`Role "${name}" updated`, "check-circle");
    } else {
      updateCorp((s) => ({
        ...s,
        roles: [...s.roles, { id: nextId("role"), name, description, members: 0, perms }],
      }));
      toast(`Role "${name}" created`, "check-circle");
    }
    onClose();
  }

  return (
    <Modal title={role ? `Edit — ${role.name}` : "New Role"} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field"><label>Role name</label><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Payroll Officer" /></div>
        <div className="field"><label>Description</label><input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this role can do" /></div>
        <div className="field">
          <label>Permissions</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
            {ALL_PERMS.map((p) => (
              <label key={p} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "8px 10px", borderRadius: 10, border: `1.5px solid ${perms.includes(p) ? "var(--rose-600)" : "var(--card-border)"}`, cursor: "pointer", background: perms.includes(p) ? "var(--pink-100)" : "transparent" }}>
                <input type="checkbox" checked={perms.includes(p)} onChange={() => toggle(p)} />
                {PERM_LABELS[p]}
              </label>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">
          {role ? "Save Role" : "Create Role"}
        </button>
      </form>
    </Modal>
  );
}

export default function RolesPage() {
  const { toast } = useAppData();
  const store = useCorpStore();
  const [editing, setEditing] = useState<CorpRoleRec | null>(null);
  const [creating, setCreating] = useState(false);

  function remove(r: CorpRoleRec) {
    updateCorp((s) => ({ ...s, roles: s.roles.filter((x) => x.id !== r.id) }));
    toast(`Role "${r.name}" removed`, "trash-2");
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Roles & Permissions</h2>
          <p className="section-sub">Who can approve payroll, leave, claims — and who can&apos;t</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />New Role
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
              <span className="badge badge-blue">{r.members} user{r.members === 1 ? "" : "s"}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "10px 0 14px" }}>
              {r.perms.length === 0 && <span style={{ fontSize: 12, color: "var(--ink-500)" }}>No permissions</span>}
              {r.perms.map((p) => (
                <span key={p} className="chip" style={{ fontSize: 11 }}>{PERM_LABELS[p] ?? p}</span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(r)}>
                <Icon name="pencil" size={13} style={{ marginRight: 4 }} />Edit
              </button>
              {r.id !== "r1" && (
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }} onClick={() => remove(r)}>
                  <Icon name="trash-2" size={13} style={{ marginRight: 4 }} />Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card card-pad" style={{ marginTop: 20, fontSize: 13, color: "var(--ink-500)", lineHeight: 1.7 }}>
        <Icon name="settings" size={15} style={{ marginRight: 6, verticalAlign: -2 }} />
        Roles define what each staff member can approve in this portal. The <b>Org Admin</b> role can&apos;t be deleted.
        Member assignment happens when you invite staff — assign their role during onboarding.
      </div>

      {creating && <RoleModal role={null} onClose={() => setCreating(false)} />}
      {editing && <RoleModal role={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
