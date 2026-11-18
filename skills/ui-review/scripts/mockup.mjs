// Step 4: render each mock-up of a fix inside a drawing of the app's shell.
// Usage: node mockup.mjs <reviewDir> [id,id]
// Reads <dir>/mockups/<id>.html. The first line says how to frame it:
//   <!-- vp=desk nav=Invoices -->   desktop, with the sidebar item "Invoices" selected
//   <!-- vp=phone -->               phone width, top bar only
//   <!-- vp=desk shell=none -->     no app shell (a dialog or a single component)
// Styles: the kit (assets/kit.css), then <dir>/theme.css if present (the app's colours and font).
// The shell's brand name and sidebar come from review.json "app.name" and "app.nav": [["Group", ["Item", ...]], ...].
// Writes <dir>/report/fixes/<id>.jpg, trimmed to the content's height.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { launch, readConfig } from "./lib.mjs";

const dir = path.resolve(process.argv[2] ?? ".");
const only = process.argv[3]?.split(",");
const cfg = readConfig(dir);
const here = path.dirname(fileURLToPath(import.meta.url));
const theme = path.join(dir, "theme.css");
const css = fs.readFileSync(path.join(here, "..", "assets", "kit.css"), "utf8") + (fs.existsSync(theme) ? fs.readFileSync(theme, "utf8") : "");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const name = esc(cfg.app.name ?? "App");
const NAV = cfg.app.nav ?? [];
const top = (phone) => phone
  ? `<div class="top" style="padding:0 16px"><svg class="ico" style="width:22px;height:22px" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg><div class="logo">${name}</div><div class="who"><span class="av">A</span></div></div>`
  : `<div class="top"><div class="logo">${name}</div><div class="who"><span class="av">A</span>${esc(cfg.app.user ?? "Admin")}</div></div>`;
const side = (on) => `<nav class="side">${NAV.map(([g, items]) => `<div class="g">${esc(g)}</div>${items.map((i) => `<div class="i${i === on ? " on" : ""}">${esc(i)}</div>`).join("")}`).join("")}</nav>`;

const src = path.join(dir, "mockups");
const out = path.join(dir, "report", "fixes");
fs.mkdirSync(out, { recursive: true });
const browser = await launch();
const ctx = {
  desk: await browser.newContext({ viewport: { width: cfg.viewports.desk.width, height: cfg.viewports.desk.height } }),
  phone: await browser.newContext({ viewport: { width: cfg.viewports.phone.width, height: cfg.viewports.phone.height }, deviceScaleFactor: cfg.viewports.phone.scale ?? 2 }),
};
for (const f of fs.readdirSync(src).filter((f) => f.endsWith(".html")).sort()) {
  const id = f.slice(0, -5);
  if (only && !only.includes(id)) continue;
  const html = fs.readFileSync(path.join(src, f), "utf8");
  const m = Object.fromEntries([...(html.match(/^<!--(.*?)-->/)?.[1] ?? "").matchAll(/(\w+)=([^\s]+)/g)].map((x) => [x[1], x[2].replace(/_/g, " ")]));
  const phone = m.vp === "phone";
  const bare = m.shell === "none";
  const body = bare ? `<main>${html}</main>` : phone ? `<div class="phone">${top(true)}<main>${html}</main></div>` : `${top(false)}<div class="desk">${side(m.nav)}<main>${html}</main></div>`;
  const p = await ctx[phone ? "phone" : "desk"].newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body${phone ? ' class="phone"' : ""}>${body}</body></html>`);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(150);
  const h = await p.evaluate(() => Math.ceil(Math.max(...[...document.querySelectorAll("main > *")].map((e) => e.getBoundingClientRect().bottom))) + 24);
  const W = phone ? cfg.viewports.phone.width : cfg.viewports.desk.width;
  const maxH = phone ? 1100 : 900;
  const H = Math.min(Math.max(h, phone ? 500 : 360), maxH);
  await p.setViewportSize({ width: W, height: Math.max(H, phone ? cfg.viewports.phone.height : cfg.viewports.desk.height) });
  await p.screenshot({ path: path.join(out, `${id}.jpg`), type: "jpeg", quality: 78, clip: { x: 0, y: 0, width: W, height: H } });
  const over = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  console.log(errs.length ? "ERR" : "ok", id, `h=${h}`, over ? "OVERFLOW-X" : "", h > maxH ? "CLIPPED: shorten the mock-up" : "", errs.join("; "));
  await p.close();
}
await browser.close();
