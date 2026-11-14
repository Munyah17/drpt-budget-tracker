"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import LanguageSelect from "@/components/LanguageSelect";
import AuthLink from "@/components/AuthLink";
import { trackEvent } from "@/lib/analytics";
import Icon from "@/components/Icon";
import { useIsNative } from "@/lib/native";

const FEATURES = [
  { icon: "pie-chart", key: "budget" },
  { icon: "target", key: "savings" },
  { icon: "receipt", key: "bills" },
  { icon: "bar-chart-3", key: "reports" },
  { icon: "sparkles", key: "ai" },
  { icon: "shield", key: "safe" },
  { icon: "refresh-cw", key: "rollover" },
  { icon: "banknote", key: "currency" },
] as const;

const CORP_FEATURES = [
  { icon: "dollar-sign", key: "pay" },
  { icon: "users", key: "staff" },
  { icon: "calendar", key: "away" },
  { icon: "receipt", key: "loans" },
  { icon: "clipboard-check", key: "claims" },
  { icon: "user-plus", key: "hire" },
  { icon: "user-circle", key: "access" },
  { icon: "banknote", key: "file" },
] as const;

const CORP_STATS = ["clicks", "papers", "staff", "setup"] as const;

const STEPS = ["account", "pay", "currency", "budgets", "accounts", "log", "watch", "own"] as const;

const PRICE_ITEMS = ["features", "tracking", "goals", "reports", "currencies", "pay"] as const;
const BUSINESS_ITEMS = ["payroll", "portal", "leave", "payout", "free", "setup"] as const;

export default function LandingPage() {
  const router = useRouter();
  const t = useTranslations("Landing");
  const { loginDemo, toast, isAuthenticated, authReady } = useAppData();
  const native = useIsNative();

  // Flat yearly price — country selection happens on the registration page.
  const priceLabel = "$1";

  // `/` is always the landing page — even for signed-in visitors. The app
  // portals are reached through the nav/CTAs, never by hijacking the
  // homepage.

  // The iPhone app has no marketing page: it opens straight on sign-in.
  useEffect(() => {
    if (native && authReady && !isAuthenticated) router.replace("/login");
  }, [native, authReady, isAuthenticated, router]);

  // Count every landing-page visit for the admin analytics funnel
  useEffect(() => {
    trackEvent("landing_view");
  }, []);

  function handleDemo() {
    trackEvent("demo_start");
    loginDemo();
    toast(t("demoToast"), "sparkles");
    router.push("/dashboard");
  }

  // Mobile centre button: guests go to sign in/up, signed-in users to the app.
  function handleCenter() {
    if (!authReady) return; // session still restoring — ignore the tap
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }

  return (
    <div className="landing" id="top">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-logo">
          WellSpend <span style={{ color: "var(--rose-500)" }}>❤</span>
        </div>
        <div className="landing-nav-links">
          <a href="#top" className="nav-link nav-link-home">{t("nav.home")}</a>
          <a href="#how" className="nav-link">{t("nav.how")}</a>
          <a href="#business" className="nav-link">{t("nav.business")}</a>
          <a href="#pricing" className="nav-link">{t("nav.pricing")}</a>
          <LanguageSelect compact />
          <AuthLink mode="login" className="btn btn-ghost btn-sm">{t("nav.signIn")}</AuthLink>
          <AuthLink mode="signup" className="btn btn-primary btn-sm">
            <span className="nav-cta-full">{t("nav.getStarted")}</span>
            <span className="nav-cta-short">{t("nav.startShort")}</span>
          </AuthLink>
        </div>
      </nav>

      {/* Hero */}
      <header className="landing-hero">
        <div className="hero-badge">
          <Icon name="zap" size={13} /> {t("hero.badge")}
        </div>
        <h1>
          {t("hero.titleLine1")}<br />
          <em>{t("hero.titleEm")}</em>
        </h1>
        <p className="lead">
          {t("hero.lead")}
        </p>
        <div className="hero-ctas">
          <AuthLink mode="signup" className="btn btn-primary" style={{ padding: "14px 26px", fontSize: 15 }}>
            {t("hero.getStarted")} <Icon name="arrow-up-right" size={16} />
          </AuthLink>
          <button
            className="btn"
            onClick={handleDemo}
            style={{
              padding: "14px 26px",
              fontSize: 15,
              background: "#fff",
              color: "#111",
              border: "1px solid var(--card-border)",
            }}
          >
            {t("hero.seeDemo")}
          </button>
        </div>
        <div className="hero-note">
          {t("hero.note")}
        </div>

        {/* MacBook preview: budget app open on screen */}
        <div className="laptop fade-up" aria-hidden="true">
          <div className="laptop-screen">
            <span className="laptop-cam" />
            <div className="mockapp">
              <div className="mockapp-side">
                <span className="ms-logo" />
                <span className="ms-item on" />
                <span className="ms-item" />
                <span className="ms-item" />
                <span className="ms-item" />
                <span className="ms-item" />
              </div>
              <div className="mockapp-main">
                <span className="mm-title" />
                <div className="mm-kpis">
                  <div className="mm-kpi">
                    <div className="k">{t("hero.balance")}</div>
                    <div className="v">$8,426.50</div>
                  </div>
                  <div className="mm-kpi">
                    <div className="k">{t("hero.income")}</div>
                    <div className="v" style={{ color: "var(--green)" }}>+$5,650.00</div>
                  </div>
                  <div className="mm-kpi">
                    <div className="k">{t("hero.budgetUsed")}</div>
                    <div className="v" style={{ color: "var(--rose-600)" }}>68%</div>
                  </div>
                </div>
                <div className="mm-chart">
                  {[42, 65, 50, 78, 58, 88, 70, 95, 62, 84, 72, 100].map((h, i) => (
                    <i key={i} style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="mm-rows">
                  <div className="mm-row"><b /><i /></div>
                  <div className="mm-row"><b style={{ width: "42%" }} /><i /></div>
                  <div className="mm-row"><b style={{ width: "28%" }} /><i /></div>
                </div>
              </div>
            </div>
          </div>
          <div className="laptop-base" />
        </div>
      </header>

      {/* Features */}
      <section className="landing-section" id="features">
        <h2>{t("features.heading")}</h2>
        <p className="sub">
          {t("features.sub")}
        </p>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div className="feature-card glass-card" key={f.key}>
              <div className="fic"><Icon name={f.icon} size={20} /></div>
              <h3>{t(`features.${f.key}.title`)}</h3>
              <p>{t(`features.${f.key}.text`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="landing-section" id="how">
        <h2>{t("how.heading")}</h2>
        <p className="sub">{t("how.sub")}</p>
        <div className="steps">
          {STEPS.map((key, i) => (
            <div className="step-card glass-card" key={key}>
              <div className="num">{i + 1}</div>
              <h3>{t(`how.${key}.title`)}</h3>
              <p>{t(`how.${key}.text`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Corporate partnership */}
      <section className="landing-section" id="business">
        <div className="hero-badge" style={{ display: "flex", width: "fit-content", margin: "0 auto 14px" }}>
          <Icon name="briefcase" size={13} /> {t("business.badge")}
        </div>
        <h2 style={{ fontSize: "clamp(30px, 4.5vw, 46px)", fontWeight: 800, letterSpacing: "-1.2px", lineHeight: 1.05, textAlign: "center" }}>
          {t("business.heading")}
        </h2>
        <p style={{ fontSize: 16, fontWeight: 700, color: "var(--rose-600)", margin: "6px auto 10px", letterSpacing: 0.4, textAlign: "center" }}>
          {t("business.line")}
        </p>
        <p className="sub" style={{ maxWidth: 640 }}>
          {t("business.sub")}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, maxWidth: 680, margin: "26px auto 34px" }}>
          {CORP_STATS.map((key) => (
            <div key={key} className="glass-card" style={{ padding: "14px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--rose-600)" }}>{t(`business.${key}V`)}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 2 }}>{t(`business.${key}K`)}</div>
            </div>
          ))}
        </div>
        <div className="feature-grid">
          {CORP_FEATURES.map((f) => (
            <div className="feature-card glass-card" key={f.key}>
              <div className="fic"><Icon name={f.icon} size={20} /></div>
              <h3>{t(`business.${f.key}Title`)}</h3>
              <p>{t(`business.${f.key}Text`)}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 30 }}>
          <a
            href="https://wa.me/263718560128?text=Hi%20—%20we%27d%20like%20a%20walkthrough%20of%20WellSpend%20for%20Business%20for%20our%20organisation."
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
            style={{ padding: "14px 28px", fontSize: 15 }}
            onClick={() => trackEvent("corp_interest")}
          >
            <Icon name="send" size={15} style={{ marginInlineEnd: 8 }} /> {t("business.walkthrough")}
          </a>
          <AuthLink mode="login" className="btn" style={{ padding: "14px 28px", fontSize: 15, background: "#fff", color: "#111", border: "1px solid var(--card-border)" }}>
            {t("business.signIn")}
          </AuthLink>
        </div>
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--ink-500)", marginTop: 14, maxWidth: 520, marginInline: "auto" }}>
          {t("business.note")}
        </p>
      </section>

      {/* Pricing */}
      <section className="landing-section" id="pricing">
        <h2>{t("pricing.heading")}</h2>
        <p className="sub">{t("pricing.sub")}</p>
        <div className="pricing-wrap">
          <div className="pricing-card glass-card" style={{ border: "2px solid var(--rose-400)" }}>
            <span className="chip"><Icon name="zap" size={12} /> {t("pricing.lifetime")}</span>
            <div className="price">{priceLabel}<small> {t("pricing.forever")}</small></div>
            <ul>
              {PRICE_ITEMS.map((item) => (
                <li key={item}>
                  <Icon name="check-circle" size={16} /> {t(`pricing.${item}`)}
                </li>
              ))}
            </ul>
            <AuthLink mode="signup" className="btn btn-primary" style={{ width: "100%" }}>
              {t("pricing.createFrom", { price: priceLabel })}
            </AuthLink>
          </div>

          <div className="pricing-card glass-card">
            <span className="chip"><Icon name="briefcase" size={12} /> {t("pricing.businessChip")}</span>
            <div className="price" style={{ fontSize: 40, lineHeight: 1.15 }}>{t("pricing.hrLine1")}<br />{t("pricing.hrLine2")}</div>
            <ul>
              {BUSINESS_ITEMS.map((item) => (
                <li key={item}>
                  <Icon name="check-circle" size={16} /> {t(`pricing.${item}`)}
                </li>
              ))}
            </ul>
            <a
              href="https://wa.me/263718560128?text=Hi%20—%20we%27d%20like%20a%20demo%20of%20WellSpend%20for%20Business%20(Unified%20HR%20Solutions)."
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={() => trackEvent("corp_interest")}
            >
              {t("pricing.arrange")}
            </a>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="cta-band">
        <h2>{t("cta.heading")}</h2>
        <p>
          {t("cta.text")}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <AuthLink mode="signup" className="btn btn-white" style={{ padding: "13px 26px" }}>
            {t("cta.button")}
          </AuthLink>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-logo" style={{ fontSize: 18 }}>
          WellSpend <span style={{ color: "var(--rose-500)" }}>❤</span>
        </div>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          <a href="#features">{t("footer.features")}</a>
          <a href="#business">{t("footer.business")}</a>
          <a href="#pricing">{t("footer.pricing")}</a>
          <Link href="/privacy">{t("footer.privacy")}</Link>
          <Link href="/terms">{t("footer.terms")}</Link>
          <AuthLink mode="login">{t("footer.signIn")}</AuthLink>
        </div>
        <div>{t("footer.rights", { year: String(new Date().getFullYear()) })}</div>
        <div>{t("footer.powered")}</div>
      </footer>
      {!native && (
        <nav className="landing-sticky" aria-label="Sections">
          <a href="#features" className="landing-tab-item">
            <Icon name="sparkles" size={20} />
            <span>{t("nav.features")}</span>
          </a>
          <a href="#how" className="landing-tab-item">
            <Icon name="git-branch" size={20} />
            <span>{t("nav.how")}</span>
          </a>
          <button className="landing-tab-add" aria-label={t("hero.seeDemo")} onClick={handleCenter}>
            <Icon name="layout-dashboard" size={26} />
          </button>
          <a href="#business" className="landing-tab-item">
            <Icon name="briefcase" size={20} />
            <span>{t("nav.business")}</span>
          </a>
          <a href="#pricing" className="landing-tab-item">
            <Icon name="tag" size={20} />
            <span>{t("nav.pricing")}</span>
          </a>
        </nav>
      )}
    </div>
  );
}
