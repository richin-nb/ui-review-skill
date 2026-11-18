// Step 1: full-page screenshots of every screen in review.json, on desktop and phone.
// Usage: node survey.mjs <reviewDir> [screenId,screenId]
// Writes <dir>/raw/<id>-desk.jpg and <id>-phone.jpg, and <dir>/raw/survey.json with
// what the browser measured (horizontal overflow, clipped text, console errors).
import fs from "node:fs";
import path from "node:path";
import { launch, readConfig, context, sleep, runStep, signedOut } from "./lib.mjs";

const dir = path.resolve(process.argv[2] ?? ".");
const only = process.argv[3]?.split(",");
const cfg = readConfig(dir);
const out = path.join(dir, "raw");
fs.mkdirSync(out, { recursive: true });
const browser = await launch();
const ctxs = {};
const report = [];

for (const s of cfg.screens ?? []) {
  if (only && !only.includes(s.id)) continue;
  for (const vp of s.viewports ?? ["desk", "phone"]) {
    const key = vp + (s.anon ? "-anon" : "");
    ctxs[key] ??= await context(browser, cfg, vp, { anon: !!s.anon });
    const p = await ctxs[key].newPage();
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    try {
      await p.goto(new URL(s.url, cfg.app.baseUrl).href, { waitUntil: "networkidle", timeout: 20000 }).catch(() => {});
      await sleep(s.wait ?? 1200);
      if (signedOut(p, s)) throw new Error(`SIGNED OUT at ${p.url()}: refresh the session in review.json "auth"`);
      for (const step of s.steps ?? []) await runStep(p, step);
      const m = await p.evaluate(() => {
        const W = innerWidth;
        const clipped = [];
        for (const el of document.querySelectorAll("body *")) {
          const cs = getComputedStyle(el);
          if (!el.childElementCount && el.textContent.trim() && (cs.textOverflow === "ellipsis" || cs.overflow === "hidden") && el.scrollWidth > el.clientWidth + 1)
            clipped.push(el.textContent.trim().slice(0, 60));
          if (clipped.length > 15) break;
        }
        const wide = [...document.querySelectorAll("body *")].filter((el) => el.getBoundingClientRect().right > W + 1 && getComputedStyle(el).position !== "fixed")
          .slice(0, 8).map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 2).join(".")}`);
        return { scrollWidth: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, overflowX: document.documentElement.scrollWidth > W, clipped, wide };
      });
      const file = `${s.id}-${vp}.jpg`;
      await p.screenshot({ path: path.join(out, file), type: "jpeg", quality: 62, fullPage: true });
      report.push({ id: s.id, vp, url: s.url, file, ...m, errors: errors.slice(0, 5) });
      console.log("ok", s.id, vp, m.overflowX ? "OVERFLOW-X" : "", m.clipped.length ? `clipped:${m.clipped.length}` : "", errors.length ? `errors:${errors.length}` : "");
    } catch (e) {
      report.push({ id: s.id, vp, url: s.url, failed: e.message.split("\n")[0] });
      console.log("FAIL", s.id, vp, e.message.split("\n")[0]);
    }
    await p.close();
  }
}
fs.writeFileSync(path.join(out, "survey.json"), JSON.stringify(report, null, 2));
await browser.close();

