"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { supabase } from "@/lib/supabase";
import Icon from "@/components/Icon";

const SUBJECTS = ["account", "payment", "bank", "bug", "feature", "other"] as const;
const FEEDBACK_KINDS = ["suggestion", "feedback", "bug"] as const;
type FeedbackKind = (typeof FEEDBACK_KINDS)[number];

export default function SupportPage() {
  const t = useTranslations("Pages.support");
  const { user, toast } = useAppData();
  const router = useRouter();
  const [subject, setSubject] = useState<(typeof SUBJECTS)[number]>("other");
  const [message, setMessage] = useState("");
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [fbKind, setFbKind] = useState<FeedbackKind>("suggestion");
  const [fbMessage, setFbMessage] = useState("");
  const [fbSending, setFbSending] = useState(false);
  const [fbSent, setFbSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": user?.email ?? "",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          subject: t(`subjects.${subject}`),
          message: message.trim(),
          name: name.trim(),
          email: email.trim(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        setSent(true);
        toast(t("toastSent"), "check-circle");
      } else {
        toast(data?.error || t("toastError"), "x");
      }
    } catch {
      toast(t("toastError"), "x");
    }
    setSending(false);
  }

  async function handleFeedbackSubmit(e: FormEvent) {
    e.preventDefault();
    if (fbSending) return;
    setFbSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": user?.email ?? "",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          kind: fbKind,
          message: fbMessage.trim(),
          page: typeof window !== "undefined" ? window.location.pathname : "",
          appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? "web",
          name: name.trim(),
          email: email.trim(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        setFbSent(true);
        toast(t("feedbackToastSent"), "check-circle");
      } else {
        toast(data?.error || t("feedbackToastError"), "x");
      }
    } catch {
      toast(t("feedbackToastError"), "x");
    }
    setFbSending(false);
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
      </div>

      <div className="glass-card card-pad" style={{ maxWidth: 640 }}>
        {sent ? (
          <div style={{ textAlign: "center", padding: "32px 12px" }}>
            <Icon name="check-circle" size={40} style={{ color: "var(--rose-500)" }} />
            <h3 style={{ margin: "14px 0 6px" }}>{t("sentTitle")}</h3>
            <p style={{ color: "var(--ink-500)", fontSize: 13.5, marginBottom: 20 }}>
              {t("sentBody")}
            </p>
            <button className="btn btn-primary" onClick={() => router.push("/dashboard")}>
              {t("backHome")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {!user && (
              <div className="grid grid-2" style={{ gap: 12 }}>
                <div className="field">
                  <label>{t("fName")}</label>
                  <input required value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
                </div>
                <div className="field">
                  <label>{t("fEmail")}</label>
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={160} />
                </div>
              </div>
            )}
            <div className="field">
              <label>{t("fSubject")}</label>
              <select
                className="settings-select"
                style={{ width: "100%" }}
                value={subject}
                onChange={(e) => setSubject(e.target.value as (typeof SUBJECTS)[number])}
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{t(`subjects.${s}`)}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t("fMessage")}</label>
              <textarea
                required
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={4000}
                placeholder={t("fMessagePh")}
              />
            </div>
            <button className="btn btn-primary btn-block" disabled={sending} type="submit">
              <Icon name="send" size={14} style={{ marginRight: 6 }} />
              {sending ? t("sending") : t("send")}
            </button>
            <p style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 12, textAlign: "center" }}>
              {t("replyNote")}
            </p>
          </form>
        )}
      </div>

      <div className="glass-card card-pad" style={{ maxWidth: 640, marginTop: 20 }}>
        <div className="card-head" style={{ marginBottom: 12 }}>
          <div>
            <h3>{t("feedbackTitle")}</h3>
            <p className="section-sub" style={{ marginTop: 4 }}>{t("feedbackSubtitle")}</p>
          </div>
        </div>
        {fbSent ? (
          <div style={{ textAlign: "center", padding: "24px 12px" }}>
            <Icon name="check-circle" size={36} style={{ color: "var(--rose-500)" }} />
            <h3 style={{ margin: "12px 0 6px" }}>{t("feedbackSentTitle")}</h3>
            <p style={{ color: "var(--ink-500)", fontSize: 13.5, marginBottom: 16 }}>
              {t("feedbackSentBody")}
            </p>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setFbSent(false);
                setFbMessage("");
                setFbKind("suggestion");
              }}
            >
              {t("feedbackAnother")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleFeedbackSubmit}>
            <div className="field">
              <label>{t("fKind")}</label>
              <select
                className="settings-select"
                style={{ width: "100%" }}
                value={fbKind}
                onChange={(e) => setFbKind(e.target.value as FeedbackKind)}
              >
                {FEEDBACK_KINDS.map((k) => (
                  <option key={k} value={k}>{t(`feedbackKinds.${k}`)}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t("fMessage")}</label>
              <textarea
                required
                rows={5}
                value={fbMessage}
                onChange={(e) => setFbMessage(e.target.value)}
                maxLength={4000}
                placeholder={t("feedbackMessagePh")}
              />
            </div>
            <button className="btn btn-primary btn-block" disabled={fbSending} type="submit">
              <Icon name="send" size={14} style={{ marginRight: 6 }} />
              {fbSending ? t("sending") : t("feedbackSend")}
            </button>
            <p style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 12, textAlign: "center" }}>
              {t("feedbackNote")}
            </p>
          </form>
        )}
      </div>
    </>
  );
}
