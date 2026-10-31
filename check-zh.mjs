import fs from 'node:fs';
const s = fs.readFileSync(new URL('./messages/zh-Hans.json', import.meta.url), 'utf8');
const i = s.indexOf('visualTitle');
const frag = s.slice(i, i + 60);
console.log(frag);
for (const ch of frag) {
  const cp = ch.codePointAt(0);
  if (cp > 0x2000 && cp < 0x4e00) console.log(JSON.stringify(ch), 'U+' + cp.toString(16).toUpperCase());
}
const j = s.indexOf('signinTitle');
console.log(s.slice(j, j + 80));
