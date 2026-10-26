// Empties mock data arrays in page files: const X_DATA / INITIAL_X / mockX = [ ... ]
// Keeps the declaration (type annotations preserved) but removes all elements.
import { readdirSync, readFileSync, writeFileSync, statSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(fileURLToPath(new URL("..", import.meta.url)), "app");
const ARRAY_DECL = /const\s+(\w*DATA\w*|INITIAL_\w+|mock\w+|MOCK_\w+)\s*(:\s*[^=;]+)?=\s*\[/g;
const files = [];

(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith(".tsx")) files.push(p);
  }
})(ROOT);

let touched = 0;
for (const file of files) {
  let src = readFileSync(file, "utf8");
  let changed = false;
  ARRAY_DECL.lastIndex = 0;
  let out = "";
  let pos = 0;
  let m;
  while ((m = ARRAY_DECL.exec(src))) {
    const open = m.index + m[0].length - 1; // index of "["
    // balanced-bracket scan to the closing ]
    let depth = 0;
    let i = open;
    let inStr = null;
    for (; i < src.length; i++) {
      const c = src[i];
      if (inStr) {
        if (c === "\\") i++;
        else if (c === inStr) inStr = null;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
      if (c === "[") depth++;
      else if (c === "]") { depth--; if (depth === 0) break; }
    }
    if (i >= src.length) break; // unbalanced — skip file
    out += src.slice(pos, open + 1); // keep the "[", resume at "]"
    pos = i;
    changed = true;
    console.log(`${file.split("\\").pop()}  <-  ${m[1].trim()}`);
  }
  if (changed) {
    out += src.slice(pos);
    writeFileSync(file, out, "utf8");
    touched++;
  }
}
console.log(`\n${touched} files updated`);
