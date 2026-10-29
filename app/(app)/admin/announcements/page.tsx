"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import RecordModal, { RowRecord } from "@/components/RecordModal";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "urgent";
  target: "all" | "paid" | "free";
  published: string;
  expires: string;
  active: boolean;
}

const INITIAL_ANNOUNCEMENTS: Announcement[] = [];

export default function AnnouncementsPage() {
  const t = useTranslations("Pages.adm_announcements");
  const { toast } = useAppData();
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [showCompose, setShowCompose] = useState(false);
  const [editing, setEditing] = useState<{ record: RowRecord; id: string } | null>(null);

  const [fTitle, setFTitle] = useState("");
  const [fContent, setFContent] = useState("");
  const [fType, setFType] = useState("info");
  const [fTarget, setFTarget] = useState("all");
  const [fExpires, setFExpires] = useState("");

  const publish = () => {
    if (!fTitle.trim()) { toast(t("titleRequired"), "x"); return; }
    setAnnouncements((prev) => [...prev, {
      id: String(Date.now()), title: fTitle, content: fContent,
      type: fType as Announcement["type"], target: fTarget as Announcement["target"],
      published: new Date().toISOString().slice(0, 10), expires: fExpires, active: true,
    }]);
    setFTitle(""); setFContent(""); setFType("info"); setFTarget("all"); setFExpires("");
    toast(t("published"), "check-circle");
    setShowCompose(false);
  };

  const openEdit = (ann: Announcement) =>
    setEditing({ record: { title: ann.title, content: ann.content, type: ann.type, target: ann.target, expires: ann.expires, active: String(ann.active) }, id: ann.id });

  const saveEdit = (values: RowRecord) => {
    if (!editing) return;
    setAnnouncements((prev) => prev.map((a) => a.id === editing.id
      ? { ...a, title: values.title, content: values.content, type: values.type as Announcement["type"], target: values.target as Announcement["target"], expires: values.expires, active: values.active === "true" }
      : a));
    toast(t("updated"));
    setEditing(null);
  };

  const remove = (ann: Announcement) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== ann.id));
    toast(t("deleted"), "trash-2");
  };

  const typeLabels: Record<string, string> = {
    info: t("typeInfo"),
    warning: t("typeWarning"),
    urgent: t("typeUrgent"),
  };

  const targetLabels: Record<string, string> = {
    all: t("targetAllShort"),
    paid: t("targetPaidShort"),
    free: t("targetFreeShort"),
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      info: "badge-blue",
      warning: "badge-amber",
      urgent: "badge-red",
    };
    return <span className={`badge ${colors[type as keyof typeof colors]}`}>{typeLabels[type] ?? type}</span>;
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCompose(true)}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          {t("newAnnouncement")}
        </button>
      </div>

      {showCompose && (
        <div className="glass-card card-pad" style={{ marginBottom: 20, maxWidth: 600 }}>
          <h3 style={{ marginBottom: 16 }}>{t("createHeading")}</h3>
          <div className="field">
            <label>{t("labelTitle")}</label>
            <input type="text" placeholder={t("titlePlaceholder")} value={fTitle} onChange={(e) => setFTitle(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }} />
          </div>
          <div className="field">
            <label>{t("labelContent")}</label>
            <textarea placeholder={t("contentPlaceholder")} rows={4} value={fContent} onChange={(e) => setFContent(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)", resize: "vertical" }} />
          </div>
          <div className="field">
            <label>{t("labelType")}</label>
            <select value={fType} onChange={(e) => setFType(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }}>
              <option value="info">{t("typeInfo")}</option>
              <option value="warning">{t("typeWarning")}</option>
              <option value="urgent">{t("typeUrgent")}</option>
            </select>
          </div>
          <div className="field">
            <label>{t("labelTarget")}</label>
            <select value={fTarget} onChange={(e) => setFTarget(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }}>
              <option value="all">{t("targetAll")}</option>
              <option value="paid">{t("targetPaid")}</option>
              <option value="free">{t("targetFree")}</option>
            </select>
          </div>
          <div className="field">
            <label>{t("labelExpires")}</label>
            <input type="date" value={fExpires} onChange={(e) => setFExpires(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" onClick={publish}>{t("publish")}</button>
            <button className="btn btn-ghost" onClick={() => setShowCompose(false)}>{t("cancel")}</button>
          </div>
        </div>
      )}

      <div className="glass-card card-pad">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colTitle")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colContent")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colType")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colTarget")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colPublished")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colExpires")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {announcements.map((ann) => (
              <tr key={ann.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{ann.title}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{ann.content}</td>
                <td style={{ padding: "12px 8px" }}>{getTypeBadge(ann.type)}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{targetLabels[ann.target] ?? ann.target}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{ann.published}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{ann.expires}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${ann.active ? "badge-green" : "badge-red"}`}>
                    {ann.active ? t("statusActive") : t("statusInactive")}
                  </span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-ghost" style={{ padding: "6px 10px" }} onClick={() => openEdit(ann)}>
                      <Icon name="edit-2" size={16} />
                    </button>
                    <button className="btn btn-ghost" style={{ padding: "6px 10px", color: "var(--red)" }} onClick={() => remove(ann)}>
                      <Icon name="trash-2" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <RecordModal mode="edit" title={t("editTitle")} record={editing.record} onClose={() => setEditing(null)} onSave={saveEdit} />
      )}
    </>
  );
}
