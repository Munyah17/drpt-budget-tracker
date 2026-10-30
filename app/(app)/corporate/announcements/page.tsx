"use client";

import { useEffect, useState, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import { useCorpStore } from "@/lib/corpStore";
import { ukDate } from "@/lib/format";

const AUDIENCES = ["allStaff", "management", "payrollTeam", "hrTeam"] as const;
const CATEGORIES = ["General", "Policy", "Urgent", "Event"] as const;
const catBadge = (c: string) =>
  c === "Urgent" ? "badge-red" : c === "Policy" ? "badge-blue" : c === "Event" ? "badge-amber" : "badge-green";

interface Notice {
  id: string; title: string; body: string; audience: string;
  category: string; pinned: boolean; posted_by: string;
  ack_count: number; created_at: string;
}

function PostModal({ postedBy, onClose, onPosted }: { postedBy: string; onClose: () => void; onPosted: (n: Notice) => void }) {
  const t = useTranslations("Pages.corp_announcements");
  const { toast } = useAppData();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<string>(AUDIENCES[0]);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/hr/notices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, audience, category, pinned, posted_by: postedBy }),
    });
    const row = await res.json().catch(() => null);
    setBusy(false);
    if (!row?.id) { toast(t("toastError"), "x"); return; }
    toast(t("toastPosted"), "check-circle");
    onPosted({ ...row, ack_count: 0 });
  }

  return (
    <Modal title={t("modalTitle")} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field"><label>{t("fieldTitle")}</label><input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("titlePlaceholder")} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="field">
            <label>{t("fieldAudience")}</label>
            <select className="settings-select" style={{ width: "100%" }} value={audience} onChange={(e) => setAudience(e.target.value)}>
              {AUDIENCES.map((a) => <option key={a} value={a}>{t(`audience.${a}`)}</option>)}
            </select>
          </div>
          <div className="field">
            <label>{t("fieldCategory")}</label>
            <select className="settings-select" style={{ width: "100%" }} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label>{t("fieldMessage")}</label>
          <textarea
            required value={body} onChange={(e) => setBody(e.target.value)} rows={4}
            style={{ width: "100%", padding: 12, borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)", background: "var(--card-solid)", color: "var(--ink-900)", fontFamily: "inherit", fontSize: 13.5, resize: "vertical" }}
            placeholder={t("messagePlaceholder")}
          />
        </div>
        <label className="remember" style={{ display: "flex", gap: 8, fontSize: 13, marginBottom: 12 }}>
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} style={{ accentColor: "var(--rose-500)" }} /> {t("fieldPinned")}
        </label>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit" disabled={busy}>
          <Icon name="send" size={14} style={{ marginRight: 6 }} />{busy ? t("posting") : t("publish")}
        </button>
      </form>
    </Modal>
  );
}

export default function AnnouncementsPage() {
  const t = useTranslations("Pages.corp_announcements");
  const { toast, user } = useAppData();
  const store = useCorpStore();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [posting, setPosting] = useState(false);
  const headcount = store.employees.length;

  useEffect(() => {
    fetch("/api/hr/notices").then((r) => r.json()).then((rows) => setNotices(Array.isArray(rows) ? rows : [])).catch(() => {});
  }, []);

  async function togglePin(n: Notice) {
    await fetch("/api/hr/notices", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: n.id, pinned: !n.pinned }) });
    setNotices((p) => [...p.map((x) => (x.id === n.id ? { ...x, pinned: !x.pinned } : x))].sort((a, b) => Number(b.pinned) - Number(a.pinned)));
  }

  async function remove(n: Notice) {
    await fetch(`/api/hr/notices?id=${n.id}`, { method: "DELETE" });
    setNotices((p) => p.filter((x) => x.id !== n.id));
    toast(t("toastRemoved"), "trash-2");
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setPosting(true)}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />{t("newAnnouncement")}
        </button>
      </div>

      {notices.length === 0 ? (
        <div className="glass-card card-pad" style={{ textAlign: "center", padding: 48, color: "var(--ink-500)" }}>
          <Icon name="bell" size={28} style={{ opacity: 0.4, marginBottom: 10 }} />
          <p style={{ margin: 0 }}>{t("emptyState")}</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {notices.map((n) => (
            <div key={n.id} className="glass-card card-pad" style={{ borderLeft: n.pinned ? "3px solid var(--rose-500)" : undefined }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                    {n.pinned && <Icon name="pin" size={13} style={{ color: "var(--rose-600)" }} />}{n.title}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 3 }}>
                    {ukDate(n.created_at.slice(0, 10))} · {t.has(`audience.${n.audience}`) ? t(`audience.${n.audience}`) : n.audience}
                    {n.posted_by ? ` · ${n.posted_by}` : ""}
                  </div>
                </div>
                <span className={`badge ${catBadge(n.category)}`}>{n.category}</span>
              </div>
              <p style={{ fontSize: 13.5, margin: "0 0 12px", lineHeight: 1.6, whiteSpace: "pre-line" }}>{n.body}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="badge badge-blue" style={{ fontSize: 11 }}>
                  <Icon name="check-circle" size={11} style={{ marginRight: 4 }} />
                  {t("acked", { count: n.ack_count, total: headcount })}
                </span>
                <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px", marginLeft: "auto" }} onClick={() => togglePin(n)}>
                  <Icon name="pin" size={13} style={{ marginRight: 4 }} />{n.pinned ? t("unpin") : t("pin")}
                </button>
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--red)", padding: "4px 8px" }} onClick={() => remove(n)}>
                  <Icon name="trash-2" size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {posting && <PostModal postedBy={user?.name ?? ""} onClose={() => setPosting(false)} onPosted={(n) => { setNotices((p) => [n, ...p]); setPosting(false); }} />}
    </>
  );
}
