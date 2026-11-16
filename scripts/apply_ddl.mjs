import fs from "node:fs";

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF ?? "lboanbhltmblyyefzvzr";
const files = process.argv.slice(2);

if (!token) {
  console.error("SUPABASE_ACCESS_TOKEN is required");
  process.exit(1);
}
if (!files.length) {
  console.error("Usage: node scripts/apply_ddl.mjs <sql-file> [...]");
  process.exit(1);
}

for (const file of files) {
  const query = fs.readFileSync(file, "utf8");
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  console.log(`${file}: ${res.status} ${text.slice(0, 400)}`);
  if (!res.ok) process.exitCode = 1;
}
