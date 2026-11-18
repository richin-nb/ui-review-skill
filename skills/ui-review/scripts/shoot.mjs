// Step 3: one screenshot per finding with the problem circled in red.
// Usage: node shoot.mjs <reviewDir> [shotId,shotId]
// Reads <dir>/shots.json: [{ id, vp: "desk"|"phone", url, steps?, marks: [target...], union?, card?, grow?, top?, anon?, full? }]
// A target is one of:
//   {"text": "54 to explain", "n": 0, "exact": false}   visible text
//   {"css": "main table tbody tr", "n": 3}              CSS selector
//   {"role": ["button", "Save"], "n": 0}               role + accessible name (regex)
//   {"label": "Country"}                               form field by its label
// Options: union draws one box around all marks; card circles the nearest card/section/dialog;
// grow adds pixels to each box's height; top scrolls the first mark to the top; full shoots the whole page.
// Writes <dir>/report/shots/<id>.jpg. A "MISS" line means a mark wasn't found: fix the target.
import fs from "node:fs";
import path from "node:path";
import { launch, readConfig, context, sleep, runStep, signedOut } from "./lib.mjs";

const dir = path.resolve(process.argv[2] ?? ".");
const only = process.argv[3]?.split(",");
const cfg = readConfig(dir);
const shots = JSON.parse(fs.readFileSync(path.join(dir, "shots.json"), "utf8"));
const out = path.join(dir, "report", "shots");
fs.mkdirSync(out, { recursive: true });

const locate = (p, t) => {
  let l;
  if (t.text) l = p.getByText(t.text, { exact: !!t.exact });
  else if (t.css) l = p.locator(t.css);
  else if (t.role) l = p.getByRole(t.role[0], { name: new RegExp(t.role[1]) });
  else if (t.label) l = p.getByLabel(t.label, { exact: true });
  else throw new Error(`Unknown target ${JSON.stringify(t)}`);
  return l.nth(t.n ?? 0);
};

const browser = await launch();
const ctxs = {};
let failed = 0;
for (const s of shots) {
  if (only && !only.includes(s.id)) continue;
  const key = s.vp + (s.anon ? "-anon" : "");
  ctxs[key] ??= await context(browser, cfg, s.vp, { anon: !!s.anon });
  const p = await ctxs[key].newPage();
  try {
    await p.goto(new URL(s.url, cfg.app.baseUrl).href, { waitUntil: "networkidle", timeout: 20000 }).catch(() => {});
    await sleep(s.wait ?? 1200);
    if (signedOut(p, s)) throw new Error(`SIGNED OUT at ${p.url()}: refresh the session in review.json "auth"`);
    for (const st of s.steps ?? []) await runStep(p, st);
    let boxes = [];
    for (const [i, t] of (s.marks ?? []).entries()) {
      const l = locate(p, t);
      if (!(await l.count())) { console.log("MISS", s.id, JSON.stringify(t)); continue; }
      if (i === 0 && !s.full) { await l.evaluate((el, top) => el.scrollIntoView({ block: top ? "start" : "center" }), !!s.top); await sleep(400); }
      const bb = s.card
        ? await l.evaluate((el) => { const c = el.closest('section, article, [role=dialog], [class*="card" i], [class*="Paper"]') ?? el; const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })
        : await l.evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
      if (s.full) { const sy = await p.evaluate(() => scrollY); bb.y += sy; }
      boxes.push(bb);
    }
    if (s.union && boxes.length) {
      const x = Math.min(...boxes.map((b) => b.x)), y = Math.min(...boxes.map((b) => b.y));
      boxes = [{ x, y, width: Math.max(...boxes.map((b) => b.x + b.width)) - x, height: Math.max(...boxes.map((b) => b.y + b.height)) - y }];
    }
    if (s.grow) boxes = boxes.map((b) => ({ ...b, height: b.height + s.grow }));
    await p.evaluate(([bs, abs]) => {
      for (const b of bs) {
        const d = document.createElement("div"); const pad = 5;
        Object.assign(d.style, { position: abs ? "absolute" : "fixed", left: `${b.x - pad}px`, top: `${b.y - pad}px`, width: `${b.width + pad * 2}px`, height: `${b.height + pad * 2}px`,
          border: "3px solid #e11d48", borderRadius: "8px", boxShadow: "0 0 0 4px rgba(225,29,72,.18)", zIndex: 2147483647, pointerEvents: "none", boxSizing: "border-box" });
        document.body.appendChild(d);
      }
    }, [boxes, !!s.full]);
    await p.screenshot({ path: path.join(out, `${s.id}.jpg`), type: "jpeg", quality: 72, fullPage: !!s.full });
    console.log("ok", s.id, `${boxes.length} mark(s)`);
  } catch (e) { failed++; console.log("FAIL", s.id, e.message.split("\n")[0]); }
  await p.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
