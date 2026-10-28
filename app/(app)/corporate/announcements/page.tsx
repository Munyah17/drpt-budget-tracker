"use client";

import { useState, FormEvent } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import { useCorpStore, updateCorp, nextId } from "@/lib/corpStore";

const AUDIENCES = ["All staff", "Management", "Payroll team", "HR team"];

function PostModal({ onClose }: { onClose: () => void }) {
  const { toast } = useAppData();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState(AUDIENCES[0]);

  function submit(e: FormEvent) {
    e.preventDefault();
    updateCorp((s) => ({
      ...s,
      announcements: [
        { id: nextId("ann"), title, body, audience, date: new Date().toISOString().slice(0, 10) },
        ...s.announcements,
      ],
    }));
    toast("Announcement posted to employee portals", "check-circle");
    onClose();
  }

  return (
    <Modal title="Post Announcement" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field"><label>Title</label><input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Payday moved to the 28th" /></div>
        <div className="field">
          <label>Audience</label>
          <select className="settings-select" style={{ width: "100%" }} value={audience} onChange={(e) => setAudience(e.target.value)}>
            {AUDIENCES.map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Message</label>
          <textarea
            required value={body} onChange={(e) => setBody(e.target.value)} rows={4}
            style={{ width: "100%", padding: 12, borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)", background: "var(--card-solid)", color: "var(--ink-900)", fontFamily: "inherit", fontSize: 13.5, resize: "vertical" }}
            placeholder="Write the announcement…"
          />
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit"><Icon name="send" size={14} style={{ marginRight: 6 }} />Publish</button>
      </form>
    </Modal>
  );
}

export default function AnnouncementsPage() {
  const { toast } = useAppData();
  const store = useCorpStore();
  const [posting, setPosting] = useState(false);

  function remove(id: string) {
    updateCorp((s) => ({ ...s, announcements: s.announcements.filter((a) => a.id !== id) }));
    toast("Announcement removed", "trash-2");
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Announcements</h2>
          <p className="section-sub">Posts appear on every employee&apos;s portal home</p>
        </div>
        <button className="btn btn-primary" onClick={() => setPosting(true)}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />New Announcement
        </button>
      </div>

      {store.announcements.length === 0 ? (
        <div className="glass-card card-pad" style={{ textAlign: "center", padding: 48, color: "var(--ink-500)" }}>
          <Icon name="bell" size={28} style={{ opacity: 0.4, marginBottom: 10 }} />
          <p style={{ margin: 0 }}>No announcements yet — post the first one.</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {store.announcements.map((a) => (
            <div key={a.id} className="glass-card card-pad">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{a.date} · {a.audience}</div>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--red)", padding: "4px 8px" }} onClick={() => remove(a.id)}>
                  <Icon name="trash-2" size={13} />
                </button>
              </div>
              <p style={{ fontSize: 13.5, margin: 0, lineHeight: 1.6 }}>{a.body}</p>
            </div>
          ))}
        </div>
      )}

      {posting && <PostModal onClose={() => setPosting(false)} />}
    </>
  );
}
