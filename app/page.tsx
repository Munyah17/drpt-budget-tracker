"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";
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

  function handleDemo() {
    loginDemo();
    toast("Welcome to the demo — explore freely, nothing is saved.", "sparkles");
    router.push("/dashboard");
  }

  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-logo">
          Dr PT <span style={{ color: "var(--rose-500)" }}>❤</span>
        </div>
        <div className="landing-nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how" className="nav-link">How it works</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <button className="btn btn-primary btn-sm" onClick={handleDemo}>
            <Icon name="sparkles" size={15} /> See Demo
          </button>
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
          Dr PT is a calm, beautiful budget tracker for real life. Income, expenses,
          bills, goals and insights — everything in one place, for less than a bottle of water.
        </p>
        <div className="hero-ctas">
          <button className="btn btn-primary" onClick={handleDemo} style={{ padding: "14px 26px", fontSize: 15 }}>
            <Icon name="sparkles" size={17} /> See Demo — no signup
          </button>
          <Link href="/login?signup=1" className="btn btn-ghost" style={{ padding: "14px 26px", fontSize: 15 }}>
            Get Started — $1 <Icon name="arrow-up-right" size={16} />
          </Link>
        </div>
        <div className="hero-note">
          The demo is a full working preview — nothing you do is saved.
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
            <button className="btn btn-ghost" style={{ width: "100%", marginTop: 10 }} onClick={handleDemo}>
              <Icon name="sparkles" size={15} /> Try the demo first
            </button>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="cta-band">
        <h2>Ready to see where your money goes?</h2>
        <p>
          Registration completes with a one-time $1 payment — then the whole app is yours.
          Or take the demo for a spin first.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/login?signup=1" className="btn btn-white" style={{ padding: "13px 26px" }}>
            Get Started — $1
          </Link>
          <button className="btn btn-ghost" onClick={handleDemo} style={{ padding: "13px 26px" }}>
            See Demo
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-logo" style={{ fontSize: 18 }}>
          Dr PT <span style={{ color: "var(--rose-500)" }}>❤</span>
        </div>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <Link href="/login">Sign in</Link>
        </div>
        <div>© {new Date().getFullYear()} Dr PT. All rights reserved.</div>
      </footer>
    </div>
  );
}
