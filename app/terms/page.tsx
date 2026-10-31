import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service — WellSpend" };

const S = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={{ maxWidth: 760, margin: "0 auto 34px", textAlign: "left" }}>
    <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 10 }}>{title}</h3>
    <div style={{ color: "var(--ink-500)", fontSize: 14.5, lineHeight: 1.75, display: "flex", flexDirection: "column", gap: 10 }}>
      {children}
    </div>
  </section>
);

export default function TermsPage() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <Link href="/" className="landing-logo" style={{ textDecoration: "none" }}>
          WellSpend <span style={{ color: "var(--rose-500)" }}>❤</span>
        </Link>
        <div className="landing-nav-links">
          <Link href="/privacy" className="nav-link">Privacy</Link>
          <Link href="/login" className="btn btn-primary btn-sm">Sign in</Link>
        </div>
      </nav>

      <div style={{ paddingTop: 40 }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, textAlign: "center", marginBottom: 6 }}>Terms of Service</h1>
        <p style={{ textAlign: "center", color: "var(--ink-500)", fontSize: 13.5, marginBottom: 44 }}>
          Last updated: March 2026
        </p>

        <S title="The service">
          <p>WellSpend is a personal and small-business budgeting application. It helps you record expenses and income, set budgets and savings goals, scan receipts and statements with AI assistance, and import transactions from a bank account you choose to connect.</p>
          <p><b>WellSpend is not a financial adviser.</b> Reports, budgets and AI-extracted data are informational tools. Verify extracted entries before relying on them — you always review AI output before it is saved.</p>
        </S>

        <S title="Pricing">
          <p><b>Lifetime activation</b> — a one-off $1 payment (grossed up for payment-channel fees at checkout) unlocks the full web application for your account.</p>
          <p><b>Bank connection unlocks</b> — free-tier users may unlock each bank connection for a one-off fee covering the provider cost plus $1. Paid accounts connect banks at no extra charge. Prices are shown before you pay; payments are processed by Stripe or Paynow and are non-refundable once access is granted.</p>
          <p><b>Corporate plans</b> — employer-organisation features are licensed under a separate business agreement. Corporate users receive full customer access paid for by their employer.</p>
        </S>

        <S title="Bank connections">
          <p>Bank feeds are provided through GoCardless Bank Account Data, a regulated account-information provider, on a read-only basis. You authorise each connection directly with your bank; consent lasts roughly 90 days and can be revoked by you at any time — through our app or your bank. We are not responsible for the accuracy, completeness or timeliness of data your bank provides.</p>
        </S>

        <S title="Your responsibilities">
          <ul style={{ margin: 0, paddingInlineStart: 20 }}>
            <li>Provide accurate account information and keep your credentials safe.</li>
            <li>Upload only documents you have the right to process.</li>
            <li>Review AI-extracted and bank-imported entries before acting on them.</li>
            <li>Don't abuse, probe, or reverse-engineer the service or its APIs.</li>
          </ul>
        </S>

        <S title="Availability & liability">
          <p>The service is provided "as is". We aim for high availability but do not warrant uninterrupted service, and depend on third parties (Supabase, Vercel, payment and banking providers) that may have their own outages. To the maximum extent permitted by law, our liability is limited to the amount you have paid us in the 12 months preceding a claim.</p>
        </S>

        <S title="Termination">
          <p>You may stop using WellSpend and request account deletion at any time. We may suspend accounts that abuse the service, attempt unauthorised access, or breach these terms.</p>
        </S>

        <S title="General">
          <p>These terms are governed by the laws of Zimbabwe. Questions: WhatsApp{" "}
            <a href="https://wa.me/263718560128" target="_blank" rel="noreferrer" style={{ color: "var(--rose-600)", fontWeight: 600 }}>
              +263 71 856 0128
            </a>.</p>
        </S>
      </div>

      <footer className="landing-footer">
        <div className="landing-logo" style={{ fontSize: 18 }}>
          WellSpend <span style={{ color: "var(--rose-500)" }}>❤</span>
        </div>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/login">Sign in</Link>
        </div>
        <div>© {new Date().getFullYear()} WellSpend Budget Tracker. All rights reserved.</div>
      </footer>
    </div>
  );
}
