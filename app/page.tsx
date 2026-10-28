"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";
import { trackEvent } from "@/lib/analytics";
import { UserRole } from "@/lib/types";
import Icon from "@/components/Icon";

const rolePath = (role?: UserRole) =>
  role === "admin"
    ? "/admin"
    : role === "corporate"
      ? "/corporate/overview"
      : role === "employee"
        ? "/employee"
        : "/dashboard";

const FEATURES = [
  {
    icon: "pie-chart",
    title: "Budget Planner",
    text: "Set monthly budgets per category and watch your spend track against them in real time.",
  },
  {
    icon: "target",
    title: "Savings Goals",
    text: "Define goals with deadlines and see exactly how far along each one is.",
  },
  {
    icon: "receipt",
    title: "Bills & Reminders",
    text: "Never miss a due date — upcoming, paid and overdue bills in one glance.",
  },
  {
    icon: "bar-chart-3",
    title: "Reports & Analytics",
    text: "Income vs expenses, category breakdowns and trends that actually make sense.",
  },
  {
    icon: "sparkles",
    title: "AI Assistant",
    text: "Ask questions about your money in plain language and get instant answers.",
  },
  {
    icon: "banknote",
    title: "Every Currency",
    text: "USD, ZWG, ZAR and every ISO currency — your money, your format.",
  },
];

const CORP_FEATURES = [
  {
    icon: "dollar-sign",
    title: "Pay everyone in minutes",
    text: "Pick a date, check the list, press pay. Bonuses and fixes go in a quick extra run — done.",
  },
  {
    icon: "users",
    title: "Staff help themselves",
    text: "Payslips, leave requests and advances happen in each person's own app. No more WhatsApping HR for a payslip.",
  },
  {
    icon: "calendar",
    title: "See who's off, at a glance",
    text: "Approve leave in one tap and everyone sees the same who's-away calendar. No double-booking, no surprises.",
  },
  {
    icon: "receipt",
    title: "Loans that pay themselves back",
    text: "Staff apply, you approve, and repayments come off their payslip on their own. No chasing, no spreadsheets.",
  },
  {
    icon: "user-circle",
    title: "Everyone sees only their part",
    text: "Give HR, accounts and managers their own access — pay info stays private, approvals stay in order.",
  },
  {
    icon: "banknote",
    title: "One file pays them all",
    text: "Download one file for your bank or EcoCash for Business and the whole team is paid. That's payday, finished.",
  },
];

const CORP_STATS = [
  { v: "4 clicks", k: "to pay your whole team" },
  { v: "0 papers", k: "payslips printed or emailed" },
  { v: "100%", k: "of staff get the app free" },
  { v: "1 day", k: "to get set up" },
];

const STEPS = [
  {
    title: "Create your account",
    text: "Sign up with your name and email — it takes thirty seconds.",
  },
  {
    title: "Pay $1 once",
    text: "One dollar. Once. Paynow, card, Ecocash or bank transfer — your pick.",
  },
  {
    title: "Own your money",
    text: "Full access forever. Every feature, every update, no subscriptions.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { loginDemo, toast, isAuthenticated, authReady, user } = useAppData();

  // Signed-in visitors go straight to their portal
  useEffect(() => {
    if (authReady && isAuthenticated) router.replace(rolePath(user?.role));
  }, [authReady, isAuthenticated, user, router]);

  // Count every landing-page visit for the admin analytics funnel
  useEffect(() => {
    trackEvent("landing_view");
  }, []);

  function handleDemo() {
    trackEvent("demo_start");
    loginDemo();
    toast("Welcome to the demo — explore freely, nothing is saved.", "sparkles");
    router.push("/dashboard");
  }

  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-logo">
          WellSpend <span style={{ color: "var(--rose-500)" }}>❤</span>
        </div>
        <div className="landing-nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how" className="nav-link">How it works</a>
          <a href="#business" className="nav-link">For Business</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link href="/login?signup=1" className="btn btn-primary btn-sm">
            <span className="nav-cta-full">Get Started — $1</span>
            <span className="nav-cta-short">Start — $1</span>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="landing-hero">
        <div className="hero-badge">
          <Icon name="zap" size={13} /> Just $1 — once, forever
        </div>
        <h1>
          Your money,<br />
          <em>finally clear.</em>
        </h1>
        <p className="lead">
          WellSpend Budget Tracker is a calm, beautiful budget tracker for real life. Income, expenses,
          bills, goals and insights — everything in one place, for less than a bottle of water.
        </p>
        <div className="hero-ctas">
          <Link href="/login?signup=1" className="btn btn-primary" style={{ padding: "14px 26px", fontSize: 15 }}>
            Get Started — $1 <Icon name="arrow-up-right" size={16} />
          </Link>
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
            See Demo
          </button>
        </div>
        <div className="hero-note">
          One-time $1 payment · Every feature unlocked forever · Paynow, card, Ecocash or bank.
        </div>

        {/* App preview mock */}
        <div className="hero-mock fade-up">
          <div className="hero-mock-bar"><span /><span /><span /></div>
          <div className="hero-mock-body">
            <div className="hero-mock-card">
              <div className="k">Total balance</div>
              <div className="v">$8,426.50</div>
            </div>
            <div className="hero-mock-card">
              <div className="k">Income this month</div>
              <div className="v green">+$5,650.00</div>
            </div>
            <div className="hero-mock-card">
              <div className="k">Budget used</div>
              <div className="v rose">68%</div>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="landing-section" id="features">
        <h2>Everything you need</h2>
        <p className="sub">
          Six focused tools that cover your whole financial life — no bloat, no learning curve.
        </p>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div className="feature-card glass-card" key={f.title}>
              <div className="fic"><Icon name={f.icon} size={20} /></div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="landing-section" id="how">
        <h2>Up and running in a minute</h2>
        <p className="sub">Three steps between you and a clear picture of your money.</p>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div className="step-card glass-card" key={s.title}>
              <div className="num">{i + 1}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Corporate partnership */}
      <section className="landing-section" id="business">
        <div className="hero-badge" style={{ margin: "0 auto 14px" }}>
          <Icon name="briefcase" size={13} /> WellSpend for Business
        </div>
        <h2 style={{ fontSize: "clamp(38px, 6vw, 60px)", fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1.05 }}>
          Unified HR Solutions
        </h2>
        <p style={{ fontSize: 16, fontWeight: 700, color: "var(--rose-600)", margin: "6px auto 10px", letterSpacing: 0.4 }}>
          Payroll · Leave · Claims · Loans · People — all in one place.
        </p>
        <p className="sub" style={{ maxWidth: 640 }}>
          Shop, clinic, school, NGO or startup — if you pay people, WellSpend works for you.
          Every person on your team gets their own money app, and people who can
          manage their pay, stay.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, maxWidth: 680, margin: "26px auto 34px" }}>
          {CORP_STATS.map((s) => (
            <div key={s.k} className="glass-card" style={{ padding: "14px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--rose-600)" }}>{s.v}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 2 }}>{s.k}</div>
            </div>
          ))}
        </div>
        <div className="feature-grid">
          {CORP_FEATURES.map((f) => (
            <div className="feature-card glass-card" key={f.title}>
              <div className="fic"><Icon name={f.icon} size={20} /></div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
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
            <Icon name="send" size={15} style={{ marginRight: 8 }} /> Book a free walkthrough
          </a>
          <Link href="/login" className="btn" style={{ padding: "14px 28px", fontSize: 15, background: "#fff", color: "#111", border: "1px solid var(--card-border)" }}>
            Corporate sign in
          </Link>
        </div>
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--ink-500)", marginTop: 14, maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
          Any size, any industry — tell us about your business and we&apos;ll have your team
          up and running within a day.
        </p>
      </section>

      {/* Pricing */}
      <section className="landing-section" id="pricing">
        <h2>One dollar. That&rsquo;s it.</h2>
        <p className="sub">No subscriptions, no tiers, no upsells. Pay once, keep it forever.</p>
        <div className="pricing-wrap">
          <div className="pricing-card glass-card" style={{ border: "2px solid var(--rose-400)" }}>
            <span className="chip"><Icon name="zap" size={12} /> Lifetime access</span>
            <div className="price">$1<small> / forever</small></div>
            <ul>
              {[
                "Every feature unlocked, forever",
                "Income, expense & budget tracking",
                "Savings goals, bills & calendar",
                "Reports, analytics & AI assistant",
                "All world currencies",
                "Pay via Paynow, card, Ecocash or bank transfer",
              ].map((item) => (
                <li key={item}>
                  <Icon name="check-circle" size={16} /> {item}
                </li>
              ))}
            </ul>
            <Link href="/login?signup=1" className="btn btn-primary" style={{ width: "100%" }}>
              Create account & pay $1
            </Link>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="cta-band">
        <h2>Ready to see where your money goes?</h2>
        <p>
          Registration completes with a one-time $1 payment — then the whole app is yours.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/login?signup=1" className="btn btn-white" style={{ padding: "13px 26px" }}>
            Get Started — $1
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-logo" style={{ fontSize: 18 }}>
          WellSpend <span style={{ color: "var(--rose-500)" }}>❤</span>
        </div>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          <a href="#features">Features</a>
          <a href="#business">For Business</a>
          <a href="#pricing">Pricing</a>
          <Link href="/login">Sign in</Link>
        </div>
        <div>© {new Date().getFullYear()} WellSpend Budget Tracker. All rights reserved.</div>
        <div>Powered By Global Space Web +263718560128</div>
      </footer>
    </div>
  );
}
