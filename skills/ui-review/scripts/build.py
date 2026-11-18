#!/usr/bin/env python3
"""Step 5: build the review page from findings.json.

Usage: python3 build.py <reviewDir>
Reads <dir>/findings.json and the images in <dir>/report/shots and <dir>/report/fixes,
writes <dir>/report/index.html. Standard library only.
See references/findings-format.md for the JSON shape.
"""
import html, json, os, struct, sys

H = html.escape
HERE = os.path.dirname(os.path.abspath(__file__))
SEV = {"first": ("Fix first", "Broken, or stops you finishing a task"),
       "soon": ("Fix soon", "Confusing, slow, or easy to get wrong"),
       "polish": ("Polish", "Small on its own, but adds up")}
DEV = {"phone": "Phone", "desktop": "Desktop", "both": "Phone and desktop"}


def image_size(path):
    """Width and height of a JPEG or PNG, without Pillow."""
    with open(path, "rb") as f:
        data = f.read()
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II", data[16:24])
    i = 2
    while i < len(data):
        if data[i] != 0xFF:
            i += 1
            continue
        marker = data[i + 1]
        if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
            h, w = struct.unpack(">HH", data[i + 5:i + 9])
            return w, h
        if marker in (0xD8, 0x01) or 0xD0 <= marker <= 0xD7:
            i += 2
            continue
        i += 2 + struct.unpack(">H", data[i + 2:i + 4])[0]
    raise ValueError(f"Can't read the size of {path}")


def main(d):
    spec = json.load(open(os.path.join(d, "findings.json"), encoding="utf-8"))
    meta, areas = spec.get("meta", {}), spec["areas"]
    rep = os.path.join(d, "report")
    first_sev = meta.get("firstSeverity", "first")
    n, counts, first, nav, sections, missing = 0, {k: 0 for k in SEV}, [], [], [], []

    def shot(rel, alt):
        w, h = image_size(os.path.join(rep, rel))
        return (f'<button class="shot" type="button" data-full="{rel}" aria-label="Enlarge: {H(alt)}">'
                f'<img src="{rel}" alt="{H(alt)}" loading="lazy" width="{w}" height="{h}"></button>')

    for area in areas:
        items = area["items"]
        nav.append(f'<a href="#{H(area["key"])}">{H(area["name"])}<span>{len(items)}</span></a>')
        body = []
        for it in items:
            n += 1
            fid, title, sev, dev = it["id"], it["title"], it["sev"], it.get("device", "both")
            counts[sev] += 1
            if sev == first_sev:
                first.append((n, title, fid))
            shots = it.get("shots") or [fid]
            for s in shots:
                if not os.path.exists(os.path.join(rep, "shots", f"{s}.jpg")):
                    missing.append(f"shots/{s}.jpg")
            shots = [s for s in shots if os.path.exists(os.path.join(rep, "shots", f"{s}.jpg"))]
            before = "".join(shot(f"shots/{s}.jpg", f"{title}, now: the problem is circled in red") for s in shots) \
                or '<p class="nofix">No screenshot.</p>'
            fix_img = it.get("mockup", fid)
            if os.path.exists(os.path.join(rep, "fixes", f"{fix_img}.jpg")):
                after = shot(f"fixes/{fix_img}.jpg", f"{title}, after the fix: the change is outlined in green")
            else:
                missing.append(f"fixes/{fix_img}.jpg")
                after = '<p class="nofix">Mock-up not drawn yet.</p>'
            sizes = [image_size(os.path.join(rep, "shots", f"{s}.jpg")) for s in shots]
            tall = bool(sizes) and all(h > w for w, h in sizes)
            alt = it.get("alt", "")
            alt_btn = ('<button class="opt" type="button" data-choice="alt" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true">'
                       '<path d="m16 3 4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16"/></svg>Use alternative</button>') if alt else ""
            alt_dl = f'<dt class="alt">Alternative</dt><dd class="alt">{H(alt)}</dd>' if alt else ""
            body.append(f'''<article class="finding {'is-tall' if tall else 'is-wide'}" id="f-{H(fid)}" data-fid="{H(fid)}" data-sev="{sev}" data-dev="{dev}" data-title="{H(title)}" data-n="{n}">
  <div class="media">
    <figure class="ba"><figcaption><span class="tag t-now">Now</span></figcaption><div class="shots">{before}</div></figure>
    <figure class="ba"><figcaption><span class="tag t-after">After the fix</span><span class="mock">mock-up</span></figcaption><div class="shots">{after}</div></figure>
  </div>
  <div class="text">
    <div class="meta"><span class="num">{n}</span><span class="sev sev-{sev}">{SEV[sev][0]}</span><span class="dev">{DEV[dev]}</span><span class="pill" hidden></span></div>
    <h3>{H(title)}</h3>
    <dl>
      <dt>What's wrong</dt><dd>{H(it["wrong"])}</dd>
      <dt>Why it matters</dt><dd>{H(it["why"])}</dd>
      <dt class="fix">Planned fix</dt><dd class="fix">{H(it["fix"])}</dd>
      {alt_dl}
    </dl>
    <div class="decide">
      <div class="opts" role="group" aria-label="Your decision on finding {n}">
        <button class="opt" type="button" data-choice="accept" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>Accept fix</button>
        {alt_btn}
        <button class="opt" type="button" data-choice="custom" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>Something else</button>
      </div>
      <div class="custom" hidden>
        <label for="c-{H(fid)}">What should change instead?</label>
        <textarea id="c-{H(fid)}" rows="3" maxlength="2000" placeholder="For example: keep the table, but hide the Account column on a phone"></textarea>
        <div class="custom-row"><button class="save" type="button">Save</button><button class="cancel" type="button">Cancel</button></div>
      </div>
      <p class="status" aria-live="polite"></p>
    </div>
  </div>
</article>''')
        intro = f"<p>{H(area['intro'])}</p>" if area.get("intro") else ""
        sections.append(f'<section class="area" id="{H(area["key"])}"><header class="area-head"><h2>{H(area["name"])}</h2>{intro}</header>{"".join(body)}</section>')

    first_list = "".join(f'<li><a href="#f-{H(fid)}"><span class="num">{k}</span>{H(t)}</a></li>' for k, t, fid in first) \
        or "<li>Nothing at this level.</li>"
    scope = "".join(f"<span><b>{H(str(v))}</b> {H(label)}</span>" for v, label in meta.get("scope", []))
    strengths = meta.get("strengths", [])
    title = meta.get("title", "UI review")
    subs = {
        "TITLE": H(title), "EYEBROW": H(meta.get("eyebrow", "Design review")), "H1": H(meta.get("h1", title)),
        "INTRO": meta.get("intro", ""),  # may hold <b>; written by the reviewer
        "SCOPE": scope, "TOTAL": str(n), "C1": str(counts["first"]), "C2": str(counts["soon"]), "C3": str(counts["polish"]),
        "FIRST_HEAD": H(meta.get("firstHead", "Fix these first")), "FIRST": first_list,
        "STRENGTHS_HEAD": H(meta.get("strengthsHead", "What already works well")),
        "STRENGTHS": "".join(f"<li>{H(s)}</li>" for s in strengths), "STRENGTHS_HIDDEN": "" if strengths else " hidden",
        "FOOT": H(meta.get("foot", "The “after” pictures are hand-drawn mock-ups in the app's colours: names and figures in them may be made up to show the idea.")),
        "STORAGE_KEY": H(meta.get("storageKey", "ui-review-decisions")),
        "NAV": "".join(nav), "CARDS": "\n".join(sections),
    }
    out = open(os.path.join(HERE, "..", "assets", "template.html"), encoding="utf-8").read()
    for k, v in subs.items():
        out = out.replace("{{" + k + "}}", v)
    os.makedirs(rep, exist_ok=True)
    open(os.path.join(rep, "index.html"), "w", encoding="utf-8").write(out)
    print(f"{n} findings: {counts['first']} fix first, {counts['soon']} fix soon, {counts['polish']} polish -> {os.path.join(rep, 'index.html')}")
    for m in missing:
        print("MISSING", m)
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "."))
