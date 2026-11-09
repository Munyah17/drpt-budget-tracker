import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy — WellSpend" };

const S = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={{ maxWidth: 760, margin: "0 auto 34px", textAlign: "left" }}>
    <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 10 }}>{title}</h3>
    <div style={{ color: "var(--ink-500)", fontSize: 14.5, lineHeight: 1.75, display: "flex", flexDirection: "column", gap: 10 }}>
      {children}
    </div>
  </section>
);

export default function PrivacyPage() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <Link href="/" className="landing-logo" style={{ textDecoration: "none" }}>
          WellSpend <span style={{ color: "var(--rose-500)" }}>❤</span>
        </Link>
        <div className="landing-nav-links">
          <Link href="/terms" className="nav-link">Terms</Link>
          <Link href="/login" className="btn btn-primary btn-sm">Sign in</Link>
        </div>
      </nav>

      <div style={{ paddingTop: 40 }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, textAlign: "center", marginBottom: 6 }}>Privacy Policy</h1>
        <p style={{ textAlign: "center", color: "var(--ink-500)", fontSize: 13.5, marginBottom: 44 }}>
          Last updated: March 2026
        </p>

        <S title="What we collect">
          <p><b>Account details</b> — name, email, phone number, gender and profession provided at sign-up.</p>
          <p><b>Financial data you enter</b> — expenses, income, budgets, savings goals, and transactions you record yourself.</p>
          <p><b>Documents you upload</b> — receipt photos, statements, proofs of payment and spreadsheets you send for extraction. Originals are stored in a private, per-user storage bucket.</p>
          <p><b>Bank data</b> — if you connect a bank, account identifiers, balances and transactions are fetched read-only via GoCardless Bank Account Data, an FCA-regulated account-information provider. We never see or store your bank login credentials.</p>
          <p><b>Usage data</b> — anonymised product analytics (page views, feature usage) tied to a random visitor id, plus error/operational logs.</p>
          <p><b>Cookies</b> — a language-preference cookie and the authentication session. No advertising or cross-site tracking cookies.</p>
        </S>

        <S title="How we use it">
          <p>To provide the service: syncing your budget across devices, sending the reminders you configure, extracting transactions from documents you upload, and importing transactions from a bank you connect.</p>
          <p>Extracted items from scanned documents are always shown to you for review before anything is saved — no AI output is committed to your ledger automatically.</p>
          <p>To process payments: the yearly subscription and per-bank-connection unlocks are handled by Stripe and Paynow. We do not store card numbers.</p>
          <p>To run anonymous product analytics that tell us which features are used, so we know what to improve. Analytics are not sold and are not shared with advertisers.</p>
        </S>

        <S title="Who processes your data">
          <ul style={{ margin: 0, paddingInlineStart: 20 }}>
            <li><b>Supabase</b> — database, authentication and file storage</li>
            <li><b>Vercel</b> — hosting and scheduled jobs (daily reminders, bank sync)</li>
            <li><b>Stripe / Paynow</b> — payment processing</li>
            <li><b>GoCardless</b> — regulated bank account information (UK/EU)</li>
            <li><b>Google Gemini / Groq</b> — AI extraction of uploaded documents and messages; documents are sent for extraction only when you request it</li>
          </ul>
          <p>We do not sell your personal data to anyone.</p>
        </S>

        <S title="Bank connections">
          <p>Connecting a bank is optional and consent-based. Access is read-only: we can view balances and transactions but can never move money. Bank consent typically lasts ~90 days under UK/EU open-banking rules, after which you may reconnect or let it lapse — we show a countdown and warn before expiry. Disconnecting in the app stops future syncs immediately.</p>
        </S>

        <S title="Retention & deletion">
          <p>Your data is kept while your account is active. Uploaded receipts and documents are retained as your proof-of-purchase records until you delete them or close your account. To delete your account and associated data, contact us — we remove profile data, stored documents, imported records and bank connection records.</p>
        </S>

        <S title="Security">
          <p>All traffic is encrypted in transit. Database tables holding imports and bank data are service-role-only — no direct client access is possible. AI providers receive only the document you submit for extraction, not your ledger history.</p>
        </S>

        <S title="Contact">
          <p>
            Questions about this policy or your data: WhatsApp{" "}
            <a href="https://wa.me/263718560128" target="_blank" rel="noreferrer" style={{ color: "var(--rose-600)", fontWeight: 600 }}>
              +263 71 856 0128
            </a>{" "}
            — WellSpend by Global Space Web.
          </p>
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
