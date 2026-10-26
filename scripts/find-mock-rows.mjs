// Flags hardcoded JSX table rows and list items that contain NO {} expressions
// — these are mock literals the array-strippers couldn't reach.
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(fileURLToPath(new URL("..", import.meta.url)), "app");
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith(".tsx")) files.push(p);
  }
})(ROOT);

const ROW = /<tr[\s>][\s\S]*?<\/tr>/g;
const TD_TEXT = /<td[^>]*>([^<{][^<]*)<\/td>/g;

for (const file of files) {
  const src = readFileSync(file, "utf8");
  let m;
  const hits = [];
  while ((m = ROW.exec(src))) {
    const block = m[0];
    // skip header rows (th) and rows whose cells all contain {} or colSpan empty-state
    if (block.includes("<th")) continue;
    if (block.includes("colSpan")) continue;
    TD_TEXT.lastIndex = 0;
    const texts = [...block.matchAll(TD_TEXT)].map((t) => t[1].trim()).filter(Boolean);
    // a row is suspicious if it has literal td text and NO {} dynamic content
    // (strip style={{...}} attrs first — they're objects, not data expressions)
    const stripped = block.replace(/\{\{[^}]*\}\}/g, "");
    const hasExpr = /\{(?!\s*\})/.test(stripped);
    if (texts.length >= 2 && !hasExpr) hits.push(texts.slice(0, 3).join(" | "));
  }
  if (hits.length) {
    console.log("\n" + file.split("\\").slice(-3).join("\\"));
    hits.forEach((h) => console.log("   " + h.slice(0, 90)));
  }
}
