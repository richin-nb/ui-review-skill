// Shared helpers: find Playwright, open a browser, read the review config.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** Loads `playwright` or `playwright-core` from the working directory, then from the global npm root. */
export async function loadPlaywright() {
  const roots = [path.join(process.cwd(), "x.js")];
  try { roots.push(path.join(execFileSync("npm", ["root", "-g"], { encoding: "utf8", shell: process.platform === "win32" }).trim(), "x.js")); } catch {}
  for (const root of roots) {
    const req = createRequire(root);
    for (const name of ["playwright", "playwright-core"]) {
      try { return await import(pathToFileURL(req.resolve(name)).href); } catch {}
    }
  }
  console.error("Playwright not found. Run `npm i -D playwright-core` (with Chrome installed) or `npm i -D playwright && npx playwright install chromium` in the working directory.");
  process.exit(2);
}

const CHROMES = [process.env.CHROME_PATH, "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"].filter(Boolean);

export async function launch() {
  const pw = await loadPlaywright();
  const chromium = pw.chromium ?? pw.default?.chromium;
  const exe = CHROMES.find((p) => fs.existsSync(p));
  try { return await chromium.launch(exe ? { executablePath: exe } : {}); }
  catch (e) { if (exe) return chromium.launch(); throw e; }
}

/** <dir>/review.json, with defaults. */
export function readConfig(dir) {
  const file = path.join(dir, "review.json");
  if (!fs.existsSync(file)) { console.error(`No ${file}. Copy assets/review.example.json there first.`); process.exit(2); }
  const c = JSON.parse(fs.readFileSync(file, "utf8"));
  c.viewports ??= {};
  c.viewports.desk = { width: 1440, height: 900, scale: 1, ...c.viewports.desk };
  c.viewports.phone = { width: 390, height: 844, scale: 2, ...c.viewports.phone };
  c.app ??= {};
  return c;
}

/** A browser context for one viewport, signed in when the config says how. */
export async function context(browser, cfg, vp, { anon = false } = {}) {
  const v = cfg.viewports[vp];
  const opts = { viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.scale ?? 1 };
  const auth = cfg.auth ?? {};
  if (!anon && auth.storageState && fs.existsSync(auth.storageState)) opts.storageState = auth.storageState;
  const ctx = await browser.newContext(opts);
  if (!anon) {
    let cookie = auth.cookie;
    if (auth.cookieFile && fs.existsSync(auth.cookieFile)) cookie = fs.readFileSync(auth.cookieFile, "utf8").trim();
    if (cookie) {
      const url = new URL(cfg.app.baseUrl);
      await ctx.addCookies(cookie.split(/;\s*/).filter(Boolean).map((kv) => {
        const i = kv.indexOf("=");
        return { name: kv.slice(0, i), value: kv.slice(i + 1), domain: url.hostname, path: "/" };
      }));
    }
    for (const [k, v2] of Object.entries(auth.localStorage ?? {})) {
      await ctx.addInitScript(([key, val]) => { try { localStorage.setItem(key, val); } catch {} }, [k, v2]);
    }
  }
  return ctx;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** A step is {click: "text"} | {clickRole: ["tab", "Name"]} | {clickSelector: "css"} | {fill: ["label", "value"]} | {press: "Escape"} | {wait: ms}. */
export async function runStep(p, st) {
  if (st.click) await p.getByText(st.click, { exact: false }).first().click();
  if (st.clickRole) await p.getByRole(st.clickRole[0], { name: new RegExp(st.clickRole[1]) }).first().click();
  if (st.clickSelector) await p.locator(st.clickSelector).first().click();
  if (st.fill) await p.getByLabel(st.fill[0]).first().fill(st.fill[1]);
  if (st.press) await p.keyboard.press(st.press);
  await sleep(st.wait ?? 900);
}

/** True when a signed-in page ended up on a sign-in screen: the session is missing or expired. */
export function signedOut(p, s) {
  return !s.anon && /log-?in|sign-?in|auth/i.test(new URL(p.url()).pathname);
}
