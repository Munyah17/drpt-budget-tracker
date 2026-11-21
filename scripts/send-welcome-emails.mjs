/**
 * Bulk welcome/confirmation email for all existing WellSpend users.
 *
 * Sends every Supabase auth user a branded "account confirmed" email with:
 *   - their sign-in email + a "Sign in" button
 *   - a personal, single-use password reset link (Supabase admin generate_link
 *     recovery type, redirecting to /reset-password) so anyone who never got
 *     their credentials can set a password themselves
 *
 * Credentials for self-signup users cannot be recovered (Supabase stores only
 * password hashes), which is why the reset link is the credential path here.
 *
 * Usage:
 *   $env:SUPABASE_SERVICE_ROLE_KEY="..."          # required
 *   node scripts/send-welcome-emails.mjs --dry-run    # list users, send nothing
 *   node scripts/send-welcome-emails.mjs --to=a@b.com # send to one address
 *   node scripts/send-welcome-emails.mjs              # send to everyone
 *
 * SMTP_* and NEXT_PUBLIC_APP_URL are read from .env.local (and the process
 * env). The service-role key must be passed via the environment — it is never
 * read from or written to a file.
 */

import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";

// ---------- env ----------
function loadEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || m[1].startsWith("#")) continue;
    out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const fileEnv = loadEnvFile(path.join(process.cwd(), ".env.local"));
const env = (k) => process.env[k] ?? fileEnv[k] ?? "";

const SUPABASE_URL =
  env("NEXT_PUBLIC_SUPABASE_URL") || "https://lboanbhltmblyyefzvzr.supabase.co";
const SERVICE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");
const APP_URL = env("NEXT_PUBLIC_APP_URL") || env("APP_URL") || "https://wellspend.site";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const onlyArg = args.find((a) => a.startsWith("--to="));
const ONLY = onlyArg ? onlyArg.split("=")[1].trim().toLowerCase() : null;
const skipArg = args.find((a) => a.startsWith("--skip="));
const SKIP = new Set(
  (skipArg ? skipArg.slice("--skip=".length) : "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
);

// ---------- smtp ----------
const transport =
  env("SMTP_HOST") && env("SMTP_USER") && env("SMTP_PASS")
    ? nodemailer.createTransport({
        host: env("SMTP_HOST"),
        port: Number(env("SMTP_PORT") || 465),
        secure: Number(env("SMTP_PORT") || 465) === 465,
        auth: { user: env("SMTP_USER"), pass: env("SMTP_PASS") },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
      })
    : null;
const FROM = env("NOTIFY_FROM") || `WellSpend <${env("SMTP_USER")}>`;

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function emailHtml({ name, email, resetUrl }) {
  const resetBlock = resetUrl
    ? `<p style="margin:16px 0;font-size:14px;line-height:1.6">Never got your password or forgot it?
       <a href="${esc(resetUrl)}" style="color:#c81057;font-weight:700">Set a new password here</a>
       (single-use link, expires shortly after opening).</p>`
    : `<p style="margin:16px 0;font-size:14px;line-height:1.6">Forgot your password? Use
       “Forgot password” on the sign-in page to set a new one.</p>`;
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f2f0;font-family:'Segoe UI',Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2f0;padding:40px 12px">
<tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px">
<tr><td style="border-radius:16px 16px 0 0;background:linear-gradient(135deg,#c81057 0%,#8f0b42 100%);padding:26px 32px">
  <div style="font-size:22px;font-weight:800;color:#fff"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#fff;margin-right:8px"></span>WellSpend</div>
  <div style="font-size:12px;color:rgba(255,255,255,.75);margin-top:6px">Budget smarter. Spend better.</div>
</td></tr>
<tr><td style="background:#fff;border:1px solid #eceae8;padding:36px 32px">
  <h1 style="margin:0 0 18px;font-size:22px;color:#1c1917">✅ Your account is confirmed</h1>
  <p style="font-size:14.5px;line-height:1.7;color:#44403c">Hi${name ? ` ${esc(name)}` : ""}, your WellSpend account
  (<strong>${esc(email)}</strong>) is confirmed and active — you can sign in right away.</p>
  ${resetBlock}
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 6px"><tr>
  <td style="background:#c81057;border-radius:12px">
    <a href="${esc(`${APP_URL}/login`)}" style="display:inline-block;padding:14px 32px;color:#fff;font-size:15px;font-weight:700;text-decoration:none">Sign in to WellSpend&nbsp;&nbsp;→</a>
  </td></tr></table>
</td></tr>
<tr><td style="background:#fff;border:1px solid #eceae8;border-top:none;border-radius:0 0 16px 16px;padding:22px 32px;text-align:center">
  <p style="margin:0;font-size:11px;color:#a8a29e">You're receiving this because a WellSpend account exists for this email.<br>© ${new Date().getFullYear()} WellSpend.</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

function emailText({ name, email, resetUrl }) {
  return [
    `Hi${name ? ` ${name}` : ""},`,
    ``,
    `Your WellSpend account (${email}) is confirmed and active.`,
    `Sign in: ${APP_URL}/login`,
    resetUrl ? `Set a new password: ${resetUrl}` : `Forgot password? Use "Forgot password" on the sign-in page.`,
    ``,
    `— WellSpend`,
  ].join("\n");
}

// ---------- supabase ----------
async function listAllUsers() {
  const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
  const all = [];
  for (let page = 1; ; page++) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=200`, { headers });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(`list users failed (${res.status}): ${JSON.stringify(data).slice(0, 200)}`);
    const users = data?.users ?? data ?? [];
    if (!users.length) break;
    all.push(...users);
    if (users.length < 200) break;
  }
  return all;
}

async function recoveryLink(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "recovery",
      email,
      options: { redirect_to: `${APP_URL}/reset-password` },
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) return null;
  return data?.action_link ?? data?.properties?.action_link ?? null;
}

// ---------- main ----------
async function main() {
  if (!SERVICE_KEY) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY — set it in the environment before running.");
    process.exit(1);
  }
  if (!DRY_RUN && !transport) {
    console.error("SMTP_HOST/SMTP_USER/SMTP_PASS not configured (.env.local) — aborting.");
    process.exit(1);
  }

  const users = await listAllUsers();
  const targets = users
    .filter((u) => u.email)
    .filter((u) => !ONLY || u.email.toLowerCase() === ONLY)
    .filter((u) => !SKIP.has(u.email.trim().toLowerCase()));
  console.log(`${users.length} auth users found; ${targets.length} to email${ONLY ? ` (filtered to ${ONLY})` : ""}${DRY_RUN ? " [DRY RUN]" : ""}`);
  if (DRY_RUN) {
    targets.forEach((u) => console.log("  -", u.email));
    return;
  }

  const from = FROM;
  let sent = 0;
  const failures = [];
  for (const u of targets) {
    const email = u.email.trim();
    const name = u.user_metadata?.name || "";
    try {
      const resetUrl = await recoveryLink(email).catch(() => null);
      await transport.sendMail({
        from,
        to: email,
        subject: "Your WellSpend account is confirmed ✅",
        text: emailText({ name, email, resetUrl }),
        html: emailHtml({ name, email, resetUrl }),
      });
      sent++;
      console.log(`✓ ${email}${resetUrl ? "" : "  (no reset link — forgot-password fallback in email)"}`);
    } catch (err) {
      failures.push(email);
      console.log(`✗ ${email} — ${err?.message ?? err}`);
    }
    await new Promise((r) => setTimeout(r, 300)); // be kind to the SMTP relay
  }
  console.log(`\nDone: ${sent}/${targets.length} sent${failures.length ? `, ${failures.length} failed: ${failures.join(", ")}` : ""}`);
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});
