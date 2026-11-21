import nodemailer from "nodemailer";
import { emailLayout, detailTable, highlightBox, BRAND } from "./emailTemplate";
import { APP_URL } from "./appUrl";

/**
 * Email notifications — admin event alerts (notifyAdmin) and client-facing
 * mail (sendUserEmail), both through the SMTP relay on SMTP_HOST.
 *
 * Env (Vercel + .env.local):
 *   SMTP_HOST   e.g. c3.my-control-panel.com
 *   SMTP_PORT   465 (SSL) default
 *   SMTP_USER   mailbox login, e.g. munya@globalspaceweb.co.zw
 *   SMTP_PASS   mailbox password
 *   NOTIFY_TO   admin recipient (defaults to SMTP_USER)
 *   NOTIFY_FROM optional From: address (defaults to SMTP_USER)
 *   APP_URL     public site URL used in email buttons (defaults to https://wellspend.site)
 */

export type NotifyEvent =
  | "signup_success"
  | "signup_failed"
  | "payment_success"
  | "payment_failed"
  | "transfer_intent"
  | "support_message"
  | "feedback";

const EVENT_META: Record<NotifyEvent, { emoji: string; label: string; badge: string; color: string }> = {
  signup_success:  { emoji: "🆕", label: "New signup",              badge: "Signup",   color: BRAND.green },
  signup_failed:   { emoji: "🚫", label: "Signup failed",           badge: "Failed",   color: BRAND.red },
  payment_success: { emoji: "✅", label: "Payment received",        badge: "Payment",  color: BRAND.green },
  payment_failed:  { emoji: "❌", label: "Payment failed",          badge: "Failed",   color: BRAND.red },
  transfer_intent: { emoji: "🏦", label: "Direct transfer started", badge: "Transfer", color: BRAND.amber },
  support_message: { emoji: "💬", label: "Support message",         badge: "Support",  color: BRAND.rose },
  feedback:        { emoji: "💡", label: "Customer feedback",       badge: "Feedback", color: BRAND.amber },
};


/** Shared SMTP transport — null when SMTP_* env is not configured. */
function mailTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

function fromAddress(): string {
  const user = process.env.SMTP_USER ?? "";
  return process.env.NOTIFY_FROM || `WellSpend <${user}>`;
}

/**
 * Send an email to an arbitrary recipient through the same SMTP relay.
 * Used by bill reminders; notifyAdmin() below is the fixed admin-address flow.
 */
export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<boolean> {
  const transport = mailTransport();
  const user = process.env.SMTP_USER;
  if (!transport || !user) {
    console.warn("[notify] SMTP not configured — sendMail skipped");
    return false;
  }
  try {
    await transport.sendMail({
      from: fromAddress(),
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    return true;
  } catch (err) {
    console.error("[notify] sendMail failed:", err);
    return false;
  }
}

const clip = (v: unknown, max = 160): string =>
  String(v ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, max);

export async function notifyAdmin(
  event: NotifyEvent,
  details: { email?: string; name?: string; method?: string; detail?: string } = {},
): Promise<boolean> {
  const user = process.env.SMTP_USER;
  const to = process.env.NOTIFY_TO || user;
  const transport = mailTransport();
  if (!transport || !user || !to) {
    console.warn("[notify] SMTP not configured — skipped", event);
    return false;
  }

  const meta = EVENT_META[event];
  const fields: Array<[string, string]> = [
    ["User", clip(details.name) || "—"],
    ["Email", clip(details.email) || "—"],
    ["Method", clip(details.method) || "—"],
    ["Details", clip(details.detail, 300) || "—"],
    ["Time", new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })],
    ["Host", clip(process.env.VERCEL_URL || APP_URL, 80)],
  ];

  const subject = `[WellSpend] ${meta.emoji} ${meta.label} — ${clip(details.email) || clip(details.detail, 60) || "event"}`;

  const html = emailLayout({
    badge: meta.badge,
    badgeColor: meta.color,
    emoji: meta.emoji,
    title: meta.label,
    bodyHtml: detailTable(fields),
    cta: { label: "Open admin console", url: `${APP_URL}/admin` },
    footerNote: "WellSpend Budget Tracker — automatic admin notification",
  });

  const text = fields.map(([k, v]) => `${k}: ${v}`).join("\n");

  try {
    await transport.sendMail({ from: fromAddress(), to, subject, text, html });
    return true;
  } catch (err) {
    console.error("[notify] send failed:", err);
    return false;
  }
}

const PORTAL_LABELS: Record<string, string> = {
  admin: "Admin console",
  super_admin: "Admin console",
  corporate: "Corporate portal",
  employee: "Employee portal",
  user: "Dashboard",
};

/**
 * Onboarding/credentials email for accounts provisioned by an admin or API
 * consumer (the person never chose the password themselves). Sends the
 * sign-in email, the password that was set for them, and a sign-in button.
 * Returns true when SMTP accepted the message — callers should surface a
 * false result so a silent delivery failure is visible.
 */
export async function sendAccountCredentials(opts: {
  to: string;
  name?: string;
  password?: string;
  role?: string;
}): Promise<boolean> {
  const loginUrl = `${APP_URL}/login`;
  const portal = PORTAL_LABELS[opts.role ?? "user"] ?? "Dashboard";
  const rows: Array<[string, string]> = [
    ["Sign-in email", opts.to],
    ["Portal", portal],
  ];
  if (opts.password) rows.splice(1, 0, ["Password", opts.password]);
  return sendUserEmail({
    to: opts.to,
    subject: "Your WellSpend account is ready — sign-in details",
    heading: "Your account is ready",
    emoji: "🎉",
    badge: "Welcome",
    badgeColor: BRAND.green,
    bodyHtml:
      `<p>Hi${opts.name ? ` ${opts.name.replace(/[<>&]/g, "")}` : ""}, an account has been ` +
      `created for you on <strong>WellSpend</strong>. Your email is already confirmed — ` +
      `you can sign in right away with the details below.</p>` +
      detailTable(rows) +
      (opts.password
        ? highlightBox("Keep these details safe. To change your password later, use “Forgot password” on the sign-in page.")
        : highlightBox("Forgot your password? Use “Forgot password” on the sign-in page to set a new one.")),
    cta: { label: "Sign in to WellSpend", url: loginUrl },
  });
}

/**
 * Client-facing branded email. `bodyHtml` is trusted markup built by the
 * caller (use detailTable/highlightBox helpers or plain <p> tags).
 */
export async function sendUserEmail(opts: {
  to: string;
  subject: string;
  /** Card heading. */
  heading: string;
  emoji?: string;
  bodyHtml: string;
  /** Plain-text fallback — auto-derived from bodyHtml if omitted. */
  text?: string;
  cta?: { label: string; url: string };
  badge?: string;
  badgeColor?: string;
}): Promise<boolean> {
  if (!opts.to) return false;
  const html = emailLayout({
    badge: opts.badge,
    badgeColor: opts.badgeColor,
    emoji: opts.emoji,
    title: opts.heading,
    bodyHtml: opts.bodyHtml,
    cta: opts.cta,
    footerNote: "WellSpend Budget Tracker",
  });
  const text =
    opts.text ??
    `${opts.heading}\n\n${opts.bodyHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}`;
  return sendMail({ to: opts.to, subject: opts.subject, text, html });
}
