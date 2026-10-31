// Fills Simplified-Chinese translations for the new keys by translating the
// English source at runtime (Google Translate public endpoint) and writing
// UTF-8 directly — the editor tooling can't emit CJK, but this script can.
// Run: node scripts/i18n-translate-zh.mjs
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";

const DIR = fileURLToPath(new URL("../messages/", import.meta.url));
const en = JSON.parse(readFileSync(`${DIR}en.json`, "utf8"));
const zhPath = `${DIR}zh-Hans.json`;
const zh = JSON.parse(readFileSync(zhPath, "utf8"));

// Paths to translate: whole namespaces plus individual keys.
const TARGETS = [
  ["Pages", "import"],
  ["Pages", "banking"],
  ["Pages", "expenses", "scanBtn"],
  ["Nav", "user", "banking"],
  ["Nav", "employee", "banking"],
  ["Login", "signupTitleFree"],
  ["Login", "createFree"],
  ["Landing", "footer", "privacy"],
  ["Landing", "footer", "terms"],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cache = new Map();

async function translate(text) {
  if (cache.has(text)) return cache.get(text);
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=" +
    encodeURIComponent(text);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const out = data[0].map((seg) => seg[0]).join("");
        if (out && out !== text) {
          cache.set(text, out);
          return out;
        }
      }
    } catch { /* retry once */ }
    await sleep(400);
  }
  cache.set(text, null);
  return null;
}

function get(obj, path) {
  return path.reduce((o, k) => (o ? o[k] : undefined), obj);
}
function set(obj, path, val) {
  let o = obj;
  for (const k of path.slice(0, -1)) o = o[k] ??= {};
  o[path[path.length - 1]] = val;
}
function leaves(node, prefix, out) {
  for (const [k, v] of Object.entries(node ?? {})) {
    if (typeof v === "string") out.push([...prefix, k]);
    else if (v && typeof v === "object") leaves(v, [...prefix, k], out);
  }
  return out;
}

const paths = [];
for (const t of TARGETS) {
  const node = get(en, t);
  if (typeof node === "string") paths.push(t);
  else leaves(node, t, paths);
}

let done = 0, failed = 0;
for (const p of paths) {
  const src = get(en, p);
  const cur = get(zh, p);
  if (typeof src !== "string") continue;
  if (typeof cur === "string" && cur !== src) continue; // already translated
  const zhText = await translate(src);
  if (zhText && /\{[^}]*\}/.test(src) === /\{[^}]*\}/.test(zhText)) {
    set(zh, p, zhText);
    done++;
  } else {
    failed++;
    console.log(`skip ${p.join(".")} (${zhText ? "placeholder mangled" : "no result"})`);
  }
  await sleep(120);
}

writeFileSync(zhPath, JSON.stringify(zh, null, 2) + "\n", "utf8");
console.log(`\n${done} strings translated to zh-CN, ${failed} kept English fallback`);
