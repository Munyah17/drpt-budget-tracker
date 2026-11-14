"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import LanguageSelect from "@/components/LanguageSelect";
import Icon from "@/components/Icon";

/**
 * Dedicated super-admin sign-in. Only the founder's account (role
 * super_admin) is accepted — everyone else is turned away.
 */
export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { login, logout, toast, isAuthenticated, authReady, user, shifted } = useAppData();
  const t = useTranslations("SuperAdmin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in as super admin (and not shifted into client nature)?
  if (authReady && isAuthenticated && user?.role === "super_admin" && !shifted) {
    router.replace("/super-admin");
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await login(email, password, remember);
    if (result.success && result.role === "super_admin") {
      router.push("/super-admin");
      return;
    }
    setSubmitting(false);
    if (result.success) {
      // Signed in, but not the founder — sign back out.
      toast(t("notSuperAdmin"), "x");
      void logout();
    } else {
      toast(result.error || t("invalid"), "x");
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card fade-up">
        <div className="login-form" style={{ width: "100%", maxWidth: 420 }}>
          <div className="login-logo">
            WellSpend <span style={{ color: "var(--rose-500)" }}>❤</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span className="chip" style={{ fontSize: 11, fontWeight: 700 }}>
              <Icon name="shield" size={12} style={{ marginRight: 4, verticalAlign: -2 }} />
              {t("consoleBadge")}
            </span>
            <LanguageSelect compact />
          </div>
          <h2>{t("signinTitle")}</h2>
          <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 16 }}>{t("signinSub")}</p>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="sa-email">{t("email")}</label>
              <input
                id="sa-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPh")}
                required
                autoComplete="username"
              />
            </div>
            <div className="field">
              <label htmlFor="sa-password">{t("password")}</label>
              <input
                id="sa-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPh")}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="field-row">
              <label className="remember">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ accentColor: "var(--rose-500)" }} /> {t("remember")}
              </label>
            </div>
            <button type="submit" className="btn btn-primary" style={{ opacity: submitting ? 0.75 : 1 }} disabled={submitting}>
              {submitting ? t("signingIn") : t("signIn")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
