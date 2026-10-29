"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import LanguageSelect from "@/components/LanguageSelect";
import { notifyEvent } from "@/lib/notifyClient";
import { trackEvent } from "@/lib/analytics";
import { minPriceLabel } from "@/lib/pricing";
import { UserRole } from "@/lib/types";

const rolePath = (role?: UserRole) =>
  role === "admin"
    ? "/admin"
    : role === "corporate"
      ? "/corporate/overview"
      : role === "employee"
        ? "/employee"
        : "/dashboard";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, toast, isAuthenticated, authReady, user } = useAppData();
  const t = useTranslations("Login");
  const [submitting, setSubmitting] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [isSignup, setIsSignup] = useState(searchParams.get("signup") === "1");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [profession, setProfession] = useState("");
  const [referralCode, setReferralCode] = useState("");

  // Where the user was headed before the auth guard sent them here
  const nextParam = searchParams.get("next");
  const nextPath = nextParam && nextParam.startsWith("/") ? nextParam : null;

  // Already signed in? Go back where they wanted, else to their portal.
  useEffect(() => {
    if (authReady && isAuthenticated) router.replace(nextPath ?? rolePath(user?.role));
  }, [authReady, isAuthenticated, user, router, nextPath]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    if (isSignup) {
      if (password !== confirmPassword) {
        setSubmitting(false);
        toast(t("pwMismatch"), "x");
        return;
      }
      const kyc = {
        name: name || email.split('@')[0],
        phone,
        gender,
        profession,
        referral_code: referralCode || null,
      };
      // Create account — registration completes only after the $1 payment
      const { data, error } = await (await import("@/lib/supabase")).supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : 'https://drpt-budget-tracker.vercel.app',
          data: kyc,
        },
      });

      if (error) {
        setSubmitting(false);
        toast(error.message, "x");
        notifyEvent("signup_failed", { email, name, detail: error.message });
        trackEvent("signup_failed", { detail: error.message }, { email });
        return;
      }

      if (data.user) {
        // Confirm email + create the profile server-side (service role) —
        // works even when Supabase email confirmation is on, so the account
        // is immediately sign-in-able and the profile row exists.
        const displayName = name || email.split('@')[0];
        const confirmRes = await fetch("/api/auth/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: data.user.id, email, ...kyc, name: displayName }),
        }).catch(() => null);

        if (confirmRes?.ok) {
          notifyEvent("signup_success", { email, name });
          trackEvent("signup", {}, { email });
        } else {
          notifyEvent("signup_failed", { email, name, detail: "account confirm failed" });
          trackEvent("signup_failed", { detail: "account confirm failed" }, { email });
        }

        // Carry identity to the payment page even without a live session
        sessionStorage.setItem(
          "drpt-pending-pay",
          JSON.stringify({ userId: data.user.id, email, name: displayName })
        );

        // Best-effort sign-in in the background — either way, the next stop
        // is payment. No options, no freebies.
        void login(email, password, true);

        setFadingOut(true);
        toast(`Account created — one last step: pay from ${minPriceLabel()} to activate.`, "check-circle");
        setTimeout(() => {
          router.push("/payment");
        }, 350);
      }
    } else {
      const result = await login(email, password, remember);

      if (result.success) {
        trackEvent("login", { role: result.role }, { email });
        setFadingOut(true);
        setTimeout(() => {
          router.push(nextPath ?? rolePath(result.role));
        }, 350);
      } else {
        setSubmitting(false);
        toast(result.error || t("invalid"), "x");
      }
    }
  }

  return (
    <div
      className="login-wrap"
      style={{
        transition: "opacity .35s",
        opacity: fadingOut ? 0 : 1,
      }}
    >
      <div className="login-card fade-up">
        <div className="login-visual">
          <div className="login-visual-caption">
            <h3>
              {t("visualTitle")}
            </h3>
            <p>{t("visualText")}</p>
          </div>
        </div>
        <div className="login-form">
          <div className="login-logo">
            WellSpend <span style={{ color: "var(--rose-500)" }}>❤</span>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <LanguageSelect compact />
          </div>
          <h2>{isSignup ? t("signupTitle") : t("signinTitle")}</h2>
          <form onSubmit={handleSubmit}>
            {isSignup && (
              <>
                <div className="field">
                  <label htmlFor="name">{t("fullName")}</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("namePh")}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="phone">{t("phone")}</label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("phonePh")}
                    required
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div className="field">
                    <label htmlFor="gender">{t("gender")}</label>
                    <select
                      id="gender"
                      className="settings-select"
                      style={{ width: "100%" }}
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      required
                    >
                      <option value="" disabled>{t("genderPh")}</option>
                      <option value="male">{t("genderMale")}</option>
                      <option value="female">{t("genderFemale")}</option>
                      <option value="other">{t("genderOther")}</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="profession">{t("profession")}</label>
                    <input
                      id="profession"
                      type="text"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      placeholder={t("professionPh")}
                      required
                    />
                  </div>
                </div>
              </>
            )}
            <div className="field">
              <label htmlFor="email">{t("email")}</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPh")}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">{t("password")}</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPh")}
                required
              />
            </div>
            {isSignup && (
              <>
                <div className="field">
                  <label htmlFor="confirm-password">{t("confirmPassword")}</label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("confirmPasswordPh")}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="referral-code">{t("referralCode")}</label>
                  <input
                    id="referral-code"
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder={t("referralCodePh")}
                  />
                </div>
              </>
            )}
            {!isSignup && (
              <div className="field-row">
                <label className="remember">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ accentColor: "var(--rose-500)" }} /> {t("remember")}
                </label>
                <a href="#">{t("forgot")}</a>
              </div>
            )}
            <button type="submit" className="btn btn-primary" style={{ opacity: submitting ? 0.75 : 1 }} disabled={submitting}>
              {submitting ? (isSignup ? t("creating") : t("signingIn")) : (isSignup ? t("createPay") : t("signIn"))}
            </button>
          </form>

          <div className="login-footer">
            {isSignup ? t("haveAccount") : t("noAccount")}{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); setIsSignup(!isSignup); }}>
              {isSignup ? t("signInLink") : t("signUpLink")}
            </a>
            <div style={{ marginTop: 8 }}>
              <Link href="/" style={{ color: "var(--ink-500)", fontWeight: 600, fontSize: 12 }}>
                <span className="back-arrow" aria-hidden="true">← </span>{t("backHome")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
