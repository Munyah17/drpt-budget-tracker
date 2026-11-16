/**
 * Branded HTML email layout for WellSpend — table-based, inline styles,
 * email-client safe (no flexbox/grid/external CSS). Used by both the admin
 * notifications (notify.ts) and client-facing emails.
 */

export const BRAND = {
  rose: "#c81057",
  roseDark: "#8f0b42",
  roseSoft: "#fdeef4",
  ink: "#1c1917",
  inkSoft: "#44403c",
  inkFaint: "#a8a29e",
  bg: "#f4f2f0",
  card: "#ffffff",
  border: "#eceae8",
  green: "#15803d",
  greenSoft: "#ecfdf3",
  amber: "#b45309",
  amberSoft: "#fffbeb",
  red: "#b91c1c",
  redSoft: "#fef2f2",
};

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export interface EmailLayoutOpts {
  /** Small badge text top-right of the header, e.g. "PAYMENT". */
  badge?: string;
  badgeColor?: string;
  /** Main heading inside the card. */
  title: string;
  /** Optional emoji shown before the title. */
  emoji?: string;
  /** HTML body — already escaped where needed by the caller. */
  bodyHtml: string;
  /** Optional call-to-action button. */
  cta?: { label: string; url: string };
  /** Footer note under the card. */
  footerNote?: string;
  /** Hidden preheader text shown in inbox previews. */
  preheader?: string;
}

/** Full HTML document with branded header, content card and footer. */
export function emailLayout(opts: EmailLayoutOpts): string {
  const badge = opts.badge
    ? `<span style="display:inline-block;background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.35);color:#ffffff;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:5px 12px;border-radius:999px">${esc(opts.badge)}</span>`
    : "";

  const cta = opts.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 6px">
         <tr><td style="background:${BRAND.rose};border-radius:12px;box-shadow:0 4px 14px rgba(200,16,87,0.35)">
           <a href="${esc(opts.cta.url)}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.01em">${esc(opts.cta.label)}&nbsp;&nbsp;→</a>
         </td></tr>
       </table>
       <p style="margin:0 0 4px;font-size:12px;color:${BRAND.inkFaint};line-height:1.5">Button not working? Paste this link into your browser:<br><a href="${esc(opts.cta.url)}" style="color:${BRAND.rose};word-break:break-all;text-decoration:none">${esc(opts.cta.url)}</a></p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>WellSpend</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${esc(opts.preheader ?? opts.footerNote ?? "WellSpend")}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:40px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px">

        <!-- Brand header band -->
        <tr><td style="border-radius:16px 16px 0 0;background:linear-gradient(135deg,${BRAND.rose} 0%,${BRAND.roseDark} 100%);padding:26px 32px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;line-height:1">
                  <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ffffff;opacity:0.9;margin-right:8px;vertical-align:middle"></span>WellSpend
                </div>
                <div style="font-size:12px;color:rgba(255,255,255,0.75);margin-top:6px;letter-spacing:0.02em">Budget smarter. Spend better.</div>
              </td>
              <td align="right" valign="middle">${badge}</td>
            </tr>
          </table>
        </td></tr>

        <!-- Accent strip -->
        <tr><td style="height:4px;background:linear-gradient(90deg,${BRAND.rose},${BRAND.roseDark},${BRAND.amber});font-size:0;line-height:0">&nbsp;</td></tr>

        <!-- Content card -->
        <tr><td style="background:${BRAND.card};border-left:1px solid ${BRAND.border};border-right:1px solid ${BRAND.border};padding:36px 32px 32px">
          <h1 style="margin:0 0 18px;font-size:22px;line-height:1.35;color:${BRAND.ink};font-weight:700;letter-spacing:-0.01em">
            ${opts.emoji ? `<span style="font-size:24px">${opts.emoji}</span> ` : ""}${esc(opts.title)}
          </h1>
          <div style="font-size:14.5px;line-height:1.7;color:${BRAND.inkSoft}">${opts.bodyHtml}</div>
          ${cta}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:${BRAND.card};border:1px solid ${BRAND.border};border-top:none;border-radius:0 0 16px 16px;padding:22px 32px 26px;text-align:center">
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:${BRAND.ink}">
            <span style="color:${BRAND.rose}">●</span> WellSpend
          </p>
          <p style="margin:0 0 4px;font-size:12px;color:${BRAND.inkFaint};line-height:1.6">
            ${esc(opts.footerNote ?? "WellSpend Budget Tracker")}
          </p>
          <p style="margin:0;font-size:11px;color:${BRAND.inkFaint};line-height:1.6">
            You're receiving this because of activity on your WellSpend account.<br>
            &copy; ${new Date().getFullYear()} WellSpend. All rights reserved.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Simple key/value detail table used inside email bodies. */
export function detailTable(rows: Array<[string, string]>): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;margin:14px 0 6px;background:${BRAND.card}">
    ${rows
      .map(
        ([k, v], i) =>
          `<tr>
            <td style="padding:11px 16px;font-size:11.5px;font-weight:700;color:${BRAND.inkFaint};text-transform:uppercase;letter-spacing:0.06em;width:40%;border-bottom:${i < rows.length - 1 ? `1px solid ${BRAND.border}` : "none"};background:#fafaf9">${esc(k)}</td>
            <td style="padding:11px 16px;font-size:13.5px;color:${BRAND.ink};font-weight:600;border-bottom:${i < rows.length - 1 ? `1px solid ${BRAND.border}` : "none"}">${esc(v)}</td>
          </tr>`,
      )
      .join("")}
  </table>`;
}

/** Highlight box for important callouts (amounts, references). */
export function highlightBox(innerHtml: string, color: string = BRAND.rose): string {
  const soft = color === BRAND.green ? BRAND.greenSoft : color === BRAND.amber ? BRAND.amberSoft : color === BRAND.red ? BRAND.redSoft : BRAND.roseSoft;
  return `<div style="background:${soft};border-left:3px solid ${color};border-radius:0 12px 12px 0;padding:14px 18px;margin:16px 0;font-size:14px;line-height:1.6;color:${BRAND.ink}">${innerHtml}</div>`;
}
