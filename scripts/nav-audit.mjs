// Compare sidebar nav trees vs actual route directories — eval real arrays.
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const APP = join(process.cwd(), "app", "(app)");
const src = readFileSync("lib/data.ts", "utf8");

function extract(name) {
  const i = src.indexOf(`export const ${name} = [`);
  const start = src.indexOf("[", i);
  let depth = 0, j = start;
  for (; j < src.length; j++) {
    if (src[j] === "[") depth++;
    if (src[j] === "]" && --depth === 0) break;
  }
  return src.slice(start, j + 1);
}

const NAV_ITEMS = eval(extract("NAV_ITEMS"));
const ADMIN_NAV_ITEMS = eval(extract("ADMIN_NAV_ITEMS"));
const CORPORATE_NAV_ITEMS = eval(extract("CORPORATE_NAV_ITEMS"));
const EMPLOYEE_NAV_ITEMS = eval(extract("EMPLOYEE_NAV_ITEMS"));

const sets = [
  ["NAV_ITEMS", "", NAV_ITEMS],
  ["ADMIN", "admin", ADMIN_NAV_ITEMS],
  ["CORPORATE", "corporate", CORPORATE_NAV_ITEMS],
  ["EMPLOYEE", "employee", EMPLOYEE_NAV_ITEMS],
];

let bad = 0;
for (const [name, prefix, items] of sets) {
  for (const it of items) {
    const base = it.href ?? `/${prefix ? prefix + "/" : ""}${it.id}`;
    const path = base.replace(/^\//, "");
    if (!existsSync(join(APP, path, "page.tsx"))) { console.log(`MISSING ${base}   [${name}] ${it.label}`); bad++; }
    for (const c of it.children ?? []) {
      const cp = `/${prefix ? prefix + "/" : ""}${it.id}/${c.id}`;
      if (!existsSync(join(APP, cp.replace(/^\//, ""), "page.tsx"))) { console.log(`MISSING ${cp}   [${name}] ${it.label} > ${c.label}`); bad++; }
    }
  }
}
console.log(bad ? `\n${bad} broken nav links` : "\nall nav targets exist");
