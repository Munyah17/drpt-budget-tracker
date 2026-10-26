import nodemailer from "nodemailer";

/**
 * Admin event notifications — sends to NOTIFY_TO via the SMTP relay on
 * SMTP_HOST. Every signup/payment event is funnelled through notifyAdmin().
 *
 * Env (Vercel + .env.local):
 *   SMTP_HOST   e.g. c3.my-control-panel.com
 *   SMTP_PORT   465 (SSL) default
 *   SMTP_USER   mailbox login, e.g. munya@globalspaceweb.co.zw
 *   SMTP_PASS   mailbox password
 *   NOTIFY_TO   recipient (defaults to SMTP_USER)
 *   NOTIFY_FROM optional From: address (defaults to SMTP_USER)
 */

export type NotifyEvent =
  | "signup_success"
  | "signup_failed"
  | "payment_success"
  | "payment_failed"
  | "transfer_intent";

const EVENT_META: Record<NotifyEvent, { emoji: string; label: string }> = {
  signup_success:  { emoji: "🆕", label: "New signup" },
  signup_failed:   { emoji: "🚫", label: "Signup failed" },
  payment_success: { emoji: "✅", label: "Payment received" },
  payment_failed:  { emoji: "❌", label: "Payment failed" },
  transfer_intent: { emoji: "🏦", label: "Direct transfer started" },
};

const clip = (v: unknown, max = 160): string =>
  String(v ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, max);

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function notifyAdmin(
  event: NotifyEvent,
  details: { email?: string; name?: string; method?: string; detail?: string } = {},
): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.NOTIFY_TO || user;
  if (!host || !user || !pass || !to) {
    console.warn("[notify] SMTP not configured — skipped", event);
    return false;
  }

  const meta = EVENT_META[event];
  const fields: Array<[string, string]> = [
    ["Event", `${meta.emoji} ${meta.label}`],
    ["User", clip(details.name) || "—"],
    ["Email", clip(details.email) || "—"],
    ["Method", clip(details.method) || "—"],
    ["Details", clip(details.detail, 300) || "—"],
    ["Time", new Date().toISOString()],
    ["Host", clip(process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL || "local", 80)],
  ];

  const subject = `[WellSpend] ${meta.emoji} ${meta.label} — ${clip(details.email) || clip(details.detail, 60) || "event"}`;

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;max-width:520px">
      <h2 style="color:#c81057;margin:0 0 12px">${meta.emoji} ${esc(meta.label)}</h2>
      <table style="border-collapse:collapse;width:100%">
        ${fields
          .map(
            ([k, v]) =>
              `<tr><td style="padding:6px 10px;color:#666;width:110px;vertical-align:top">${esc(k)}</td>` +
              `<td style="padding:6px 10px;font-weight:600">${esc(v)}</td></tr>`,
          )
          .join("")}
      </table>
      <p style="color:#999;font-size:12px;margin-top:16px">WellSpend Budget Tracker — automatic notification</p>
    </div>`;

  const text = fields.map(([k, v]) => `${k}: ${v}`).join("\n");

  try {
    const transport = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
    await transport.sendMail({
      from: process.env.NOTIFY_FROM || `WellSpend <${user}>`,
      to,
      subject,
      text,
      html,
    });
    return true;
  } catch (err) {
    console.error("[notify] send failed:", err);
    return false;
  }
}
