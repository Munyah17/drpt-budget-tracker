/** Client-side file download helpers */

export function downloadCsv(filename: string, rows: Record<string, string>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [
    headers.map(escape).join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(",")),
  ].join("\n");
  downloadBlob(filename, csv, "text/csv");
}

/** HTML-table .xls — Excel opens it directly, no dependency needed */
export function downloadXls(filename: string, title: string, headers: string[], rows: string[][]) {
  const cell = (v: string, head = false) =>
    `<t${head ? "h" : "d"} style="border:1px solid #ccc;padding:4px 8px;${head ? "background:#eee;font-weight:bold;" : ""}">${String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;")}</t${head ? "h" : "d"}>`;
  const html =
    `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"/></head><body>` +
    `<table><caption style="font-size:16px;font-weight:bold;padding:8px;">${title}</caption>` +
    `<thead><tr>${headers.map((h) => cell(h, true)).join("")}</tr></thead>` +
    `<tbody>${rows.map((r) => `<tr>${r.map((c) => cell(c)).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  downloadBlob(filename, html, "application/vnd.ms-excel");
}

export function downloadBlob(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
