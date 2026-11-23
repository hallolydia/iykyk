// Scores each prompt version against MY hand labels in eval/comments.txt.
// Run: node --env-file=.env eval/score.mjs
// "right underline"  = the AI's quote overlaps one of my_gaps for that comment
// "gap found"        = one of my_gaps overlaps at least one AI quote
// sensitive items are left out of both numbers (they are read by eye for tone).
import fs from "node:fs";

const VERSIONS = ["v1", "v2", "v3"];
const norm = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N} ]+/gu, " ").replace(/\s+/g, " ").trim();
const overlap = (a, b) => { a = norm(a); b = norm(b); return a && b && (a.includes(b) || b.includes(a)); };

// ---- read the labeled items ----
const raw = fs.readFileSync("eval/comments.txt", "utf8");
const items = [];
for (const part of raw.split(/\n=== (c\d+) ===\n/).slice(1).reduce((acc, x, i, arr) => (i % 2 === 0 ? [...acc, [x, arr[i + 1]]] : acc), [])) {
  const [id, body] = part;
  const f = (k) => (body.match(new RegExp(`^${k}: *(.*)$`, "m")) || [, ""])[1].trim();
  const group = f("group");
  if (!group) continue;
  items.push({ id, group, source: f("source"), comment: f("comment"), gaps: f("my_gaps") ? f("my_gaps").split(" | ").map((g) => g.trim()).filter(Boolean) : [] });
}
console.log(`${items.length} labeled items`);

// ---- run the AI (4 at a time) ----
const modules = {};
for (const v of VERSIONS) modules[v] = await import(`./versions/analyze.${v}.mjs`);
const scene = (src) => src.replace(/\(instagram\.com[^)]*\)/i, "").replace(/^SYNTHETIC \([^)]*\)\.?\s*/, "").trim();

async function ask(version, it, withScene) {
  const input = { post: { comments: [{ id: it.id, text: it.comment }], caption: "", scene: withScene ? scene(it.source) : "" }, country: "KR", countries: ["Korea"], known: [], explainIn: "en" };
  for (let attempt = 0; attempt < 3; attempt++) {
    try { const r = await modules[version].analyze(input); return r.items || []; }
    catch (e) { if (attempt === 2) return { error: String(e.message || e) }; await new Promise((r) => setTimeout(r, 2000)); }
  }
}
const jobs = [];
for (const v of VERSIONS) for (const it of items) jobs.push({ v, it, withScene: false });
for (const it of items) jobs.push({ v: "v3", it, withScene: true }); // v3 + scene
const out = {}; let next = 0, done = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (next < jobs.length) {
    const j = jobs[next++];
    const key = `${j.v}${j.withScene ? "+scene" : ""}`;
    (out[key] ||= {})[j.it.id] = await ask(j.v, j.it, j.withScene);
    if (++done % 10 === 0) console.log(`${done}/${jobs.length}`);
  }
}));
fs.writeFileSync("eval/results.json", JSON.stringify(out, null, 1));

// ---- score ----
const pct = (a, b) => (b ? Math.round((100 * a) / b) : null);
const lines = ["# Results", "", `Scored against ${items.length} hand-labeled comments (sensitive ones left out of the numbers).`, "", "| Version | Underlines that were right | My gaps it found | Underlines | Errors |", "|---|---|---|---|---|"];
const detail = [];
for (const key of Object.keys(out)) {
  let right = 0, total = 0, found = 0, gaps = 0, errors = 0;
  for (const it of items) {
    if (it.group === "sensitive") continue;
    const r = out[key][it.id];
    if (!Array.isArray(r)) { errors++; continue; }
    for (const g of it.gaps) { gaps++; if (r.some((x) => overlap(x.quote, g))) found++; }
    for (const x of r) {
      total++;
      const ok = it.gaps.some((g) => overlap(x.quote, g));
      if (ok) right++; else detail.push(`- **${key}** ${it.id} (${it.group}) underlined "${x.quote}" · my gaps: ${it.gaps.join(" | ") || "none"}`);
    }
    for (const g of it.gaps) if (!r.some((x) => overlap(x.quote, g))) detail.push(`- **${key}** ${it.id} (${it.group}) missed my gap "${g}"`);
  }
  lines.push(`| ${key} | ${pct(right, total)}% (${right}/${total}) | ${pct(found, gaps)}% (${found}/${gaps}) | ${total} | ${errors} |`);
}
lines.push("", "## Where it went wrong", "", ...detail, "", "## Sensitive items (read the tone by eye)", "");
for (const it of items.filter((i) => i.group === "sensitive")) lines.push(`- ${it.id}: "${it.comment}"`, ...Object.keys(out).map((k) => `  - ${k}: ${JSON.stringify((out[k][it.id] || []).map?.((x) => x.answer) ?? out[k][it.id])}`));
fs.writeFileSync("eval/results.md", lines.join("\n") + "\n");
console.log(lines.slice(0, 9).join("\n"));
