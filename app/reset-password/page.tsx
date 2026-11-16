"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import LanguageSelect from "@/components/LanguageSelect";
import Icon from "@/components/Icon";

type Stage = "request" | "reset" | "sent" | "done";

/**
 * Password reset flow. Stage "request" emails a recovery link; the link
 * lands back here with a recovery session in the URL hash (Supabase
 * detectSessionInUrl picks it up), which flips the page to "reset" where
 * the user chooses a new password.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const t = useTranslations("ResetPassword");
  const [stage, setStage] = useState<Stage>("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Recovery links arrive as /reset-password#access_token=...&type=recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setStage("reset");
      return;
    }
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStage("reset");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function requestReset(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    setStage("sent");
  }

  async function setNewPassword(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError(t("tooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("mismatch"));
      return;
    }
    setSubmitting(true);
    setError("");
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setSubmitting(false);
      setError(err.message);
      return;
    }
    // End the recovery session — the user signs in fresh with the new password.
    await supabase.auth.signOut();
    setStage("done");
    setTimeout(() => router.push("/login"), 1600);
  }

  return (
    <div className="login-wrap">
      <div className="login-card fade-up">
        <div className="login-visual">
          <span className="login-visual-blob b1" />
          <span className="login-visual-blob b2" />
          <span className="login-visual-blob b3" />
          <div className="login-visual-caption">
            <h3>{t("visualTitle")}</h3>
            <p>{t("visualText")}</p>
          </div>
        </div>
        <div className="login-visual-mobile">
          <h3>{t("visualTitle")}</h3>
          <p>{t("visualText")}</p>
        </div>
        <div className="login-form">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Link href="/" className="login-logo" style={{ marginBottom: 0, textDecoration: "none" }}>
              WellSpend <span style={{ color: "var(--rose-500)" }}>❤</span>
            </Link>
            <LanguageSelect compact />
          </div>

          {stage === "request" && (
            <>
              <h2>{t("requestTitle")}</h2>
              <p style={{ fontSize: 13, color: "var(--ink-500)", margin: "-8px 0 18px" }}>{t("requestSub")}</p>
              <form onSubmit={requestReset}>
                <div className="field">
                  <label htmlFor="reset-email">{t("email")}</label>
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("emailPh")}
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>
                {error && <p style={{ color: "var(--rose-600)", fontSize: 12.5, margin: "-6px 0 12px" }}>{error}</p>}
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ opacity: submitting ? 0.75 : 1 }}>
                  {submitting ? t("sending") : t("sendLink")}
                </button>
              </form>
            </>
          )}

          {stage === "sent" && (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ fontSize: 34, marginBottom: 10 }}><Icon name="check-circle" size={40} /></div>
              <h2>{t("sentTitle")}</h2>
              <p style={{ fontSize: 13.5, color: "var(--ink-500)", lineHeight: 1.6 }}>{t("sentBody")}</p>
              <Link href="/login" className="btn btn-ghost btn-sm" style={{ marginTop: 14, display: "inline-block" }}>{t("backToSignIn")}</Link>
            </div>
          )}

          {stage === "reset" && (
            <>
              <h2>{t("resetTitle")}</h2>
              <p style={{ fontSize: 13, color: "var(--ink-500)", margin: "-8px 0 18px" }}>{t("resetSub")}</p>
              <form onSubmit={setNewPassword}>
                <div className="field">
                  <label htmlFor="new-password">{t("newPassword")}</label>
                  <div className="pw-wrap">
                    <input
                      id="new-password"
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("newPasswordPh")}
                      required
                      minLength={8}
                      autoFocus
                      autoComplete="new-password"
                    />
                    <button type="button" className="pw-toggle" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? t("hidePw") : t("showPw")}>
                      <Icon name={showPw ? "eye-off" : "eye"} size={17} />
                    </button>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="confirm-password">{t("confirmPassword")}</label>
                  <input
                    id="confirm-password"
                    type={showPw ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder={t("confirmPasswordPh")}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                {error && <p style={{ color: "var(--rose-600)", fontSize: 12.5, margin: "-6px 0 12px" }}>{error}</p>}
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ opacity: submitting ? 0.75 : 1 }}>
                  {submitting ? t("saving") : t("savePassword")}
                </button>
              </form>
            </>
          )}

          {stage === "done" && (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ fontSize: 34, marginBottom: 10 }}><Icon name="check-circle" size={40} /></div>
              <h2>{t("doneTitle")}</h2>
              <p style={{ fontSize: 13.5, color: "var(--ink-500)" }}>{t("doneBody")}</p>
            </div>
          )}

          {stage !== "done" && (
            <div className="login-footer">
              <Link href="/login" style={{ color: "var(--rose-600)", fontWeight: 700 }}>{t("backToSignIn")}</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
