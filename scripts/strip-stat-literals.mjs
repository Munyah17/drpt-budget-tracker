// Replaces hardcoded stat literals in page files with an em-dash placeholder.
// Only touches elements whose child is plain text (no JSX braces or nested tags):
//   <div className="stat-value">$45,850</div>   ->  <div className="stat-value">—</div>
//   <span className="stat-delta">+4.2%</span>   ->  <span className="stat-delta">—</span>
import { readdirSync, readFileSync, writeFileSync, statSync } from "fs";
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

const PATTERN =
  /<(?<tag>div|span)\s+className="stat-(?:value|delta)"[^>]*>(?<body>[^<>{]*)<\/\k<tag>>/g;

let touched = 0;
let hits = 0;
for (const file of files) {
  const src = readFileSync(file, "utf8");
  const next = src.replace(PATTERN, (all, ...args) => {
    const g = args[args.length - 1];
    if (!g.body || !g.body.trim()) return all; // already empty
    hits++;
    return all.replace(`>${g.body}<`, ">—<");
  });
  if (next !== src) {
    writeFileSync(file, next, "utf8");
    touched++;
    console.log(file.split("\\").slice(-3).join("\\"));
  }
}
console.log(`\n${touched} files updated, ${hits} literals blanked`);
