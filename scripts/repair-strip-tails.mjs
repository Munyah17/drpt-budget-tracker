// Repair for strip-mock-data.mjs tail-duplication bug.
// Corrupted form after an emptied decl:  = [];REST;REST   (tail written twice)
// Fix: after each `IDENT = []`, detect tail = A + A and remove the second A.
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

const EMPTY_DECL = /(const\s+\w+\s*(?::\s*[^=;]+)?=\s*\[\];)/g;

let repaired = 0;
for (const file of files) {
  const src = readFileSync(file, "utf8");
  EMPTY_DECL.lastIndex = 0;
  let m;
  let last = null;
  // work on the LAST emptied declaration — everything after it is the tail
  while ((m = EMPTY_DECL.exec(src))) last = m;
  if (!last) continue;
  const tailStart = last.index + last[0].length;
  const tail = src.slice(tailStart);
  // find p where tail = A + A (A may start with ';' or be empty)
  const half = Math.floor(tail.length / 2);
  let fixed = null;
  for (let p = half; p > 0; p--) {
    const a = tail.slice(0, p);
    const b = tail.slice(p, p * 2);
    if (a === b) { fixed = src.slice(0, tailStart) + a; break; }
  }
  // also handle: tail = ";X;X" where the two copies may differ by the leading ';'
  if (fixed === null && tail.startsWith(";")) {
    const inner = tail.slice(1);
    const ih = Math.floor(inner.length / 2);
    for (let p = ih; p > 0; p--) {
      const a = inner.slice(0, p);
      const b = inner.slice(p, p * 2);
      if (a === b) { fixed = src.slice(0, tailStart) + ";" + a; break; }
    }
  }
  if (fixed !== null && fixed !== src) {
    writeFileSync(file, fixed, "utf8");
    repaired++;
    console.log("repaired:", file.split("\\").slice(-3).join("\\"));
  }
}
console.log(`\n${repaired} files repaired`);
