"""Second pass over web/content/site.json: structural SEO and loading-speed fixes.
Text is never changed here. Run after convert.py:  python3 -I enhance.py <raw dir> <web dir>"""
import re, sys, json, glob, os, html, subprocess, urllib.parse
raw, web = sys.argv[1], sys.argv[2]
path = f"{web}/content/site.json"
d = json.load(open(path))
pub = f"{web}/public"
report = {"h1": [], "headings": [], "links_added": [], "links_missing": [], "dropped_images": [], "images": 0, "alts_set": 0, "descriptions_set": []}
OV = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "overrides.json")))

def dims(f):
    try:
        o = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", f], capture_output=True, text=True).stdout
        return int(re.search(r"pixelWidth: (\d+)", o).group(1)), int(re.search(r"pixelHeight: (\d+)", o).group(1))
    except Exception:
        return None

WIDTHS = [384, 640, 828, 1200, 1920]
def fix_images(h, slug, first_eager):
    state = {"n": 0}
    def one(m):
        tag = m.group(0); src = html.unescape(re.search(r'src="([^"]*)"', tag).group(1))
        if not src.startswith("/wp-content/"): return tag
        f = pub + urllib.parse.unquote(src)
        if not os.path.isfile(f) and os.path.isfile(os.path.splitext(f)[0] + ".webp"):
            # Original was deleted from the server; the WebP copy was recovered from the hosting backup.
            f = os.path.splitext(f)[0] + ".webp"; src = os.path.splitext(src)[0] + ".webp"
            report.setdefault("recovered_images", []).append(urllib.parse.unquote(src))
        if not os.path.isfile(f):
            report["dropped_images"].append({"page": slug, "src": urllib.parse.unquote(src)}); return ""
        wh = dims(f)
        alt = re.search(r'alt="([^"]*)"', tag).group(1)
        key = urllib.parse.unquote(src)
        if key in OV["alts"]: alt = html.escape(OV["alts"][key]); report["alts_set"] += 1
        elif any(re.search(x, html.unescape(alt)) for x in OV["decorative_alt_patterns"]): alt = ""  # icon next to a heading
        out = f'<img src="{html.escape(src)}" alt="{alt}"'
        if wh:
            out += f' width="{wh[0]}" height="{wh[1]}"'
            if not src.lower().endswith((".svg", ".gif")):
                ws = [w for w in WIDTHS if w < wh[0]] + [next((w for w in WIDTHS if w >= wh[0]), WIDTHS[-1])]
                q = urllib.parse.quote(src, safe="")
                out += ' srcset="' + ", ".join(f"/_next/image/?url={q}&amp;w={w}&amp;q=75 {w}w" for w in ws) + '"'
                out += ' sizes="(max-width: 60rem) 100vw, 60rem"'
        state["n"] += 1; report["images"] += 1
        if first_eager and state["n"] == 1: out += ' fetchpriority="high" decoding="async">'
        else: out += ' loading="lazy" decoding="async">'
        return out
    return re.sub(r"<img\b[^>]*>", one, h)

def fix_h1(p):
    h = p["html"]; n = len(re.findall(r"<h1>", h))
    if n == 0:
        m = re.search(r"<(h[2-6])>(.*?)</\1>", h, re.S)
        if m:
            h = h[:m.start()] + f"<h1>{m.group(2)}</h1>" + h[m.end():]
            report["h1"].append({"page": p["slug"], "change": f"{m.group(1)} -> h1", "text": re.sub(r"<[^>]+>", "", m.group(2)).strip()})
    elif n > 1:
        first = h.find("</h1>") + 5
        rest = h[first:]
        for m in re.finditer(r"<h1>(.*?)</h1>", rest, re.S):
            report["h1"].append({"page": p["slug"], "change": "extra h1 -> h2", "text": re.sub(r"<[^>]+>", "", m.group(1)).strip()})
        h = h[:first] + rest.replace("<h1>", "<h2>").replace("</h1>", "</h2>")
    p["html"] = h

def fix_headings(p):
    """Close gaps in the outline (h1 followed by h3, and so on) without touching the words."""
    h = p["html"]
    if p["slug"] in OV.get("project_heading_pages", []):
        # Project names were plain paragraphs; make each one a heading under the examples title.
        h = re.sub(r"<p>((?:שטיפת מערכת|מערכת קרקעי)[^<]{0,80}?[KM]W\.?)</p>", r"<h5>\1</h5>", h)
    stack = []; before = "".join(re.findall(r"<h([1-6])>", h))
    def one(m):
        lvl = int(m.group(1))
        while stack and stack[-1][0] >= lvl: stack.pop()
        new = stack[-1][1] + 1 if stack else 1
        stack.append((lvl, new)); return f"<h{new}>{m.group(2)}</h{new}>"
    h = re.sub(r"<h([1-6])>(.*?)</h\1>", one, h, flags=re.S)
    after = "".join(re.findall(r"<h([1-6])>", h))
    if before != after: report["headings"].append({"page": p["slug"], "before": before, "after": after})
    p["html"] = h

def add_links(p):
    """Wrap the first plain-text occurrence of each phrase in a link. Never inside a heading or an existing link."""
    for phrase, target in OV.get("internal_links", {}).get(p["slug"], []):
        href = "/" + re.sub(r"%[0-9A-F]{2}", lambda m: m.group(0).lower(), urllib.parse.quote(target)) + "/"
        parts = re.split(r"(<[^>]+>)", p["html"]); block = 0; done = False
        for i, t in enumerate(parts):
            if t.startswith("<"):
                if re.match(r"<(a|h[1-6])\b", t): block += 1
                elif re.match(r"</(a|h[1-6])>", t): block -= 1
            elif not block and html.escape(phrase, quote=False) in t:
                e = html.escape(phrase, quote=False)
                parts[i] = t.replace(e, f'<a href="{href}">{e}</a>', 1); done = True; break
        p["html"] = "".join(parts)
        report["links_added" if done else "links_missing"].append(f"{p['slug'] or 'home'}: {phrase} -> {target}")

def fix_jsonld(p):
    if not p["jsonld"]: return
    g = json.loads(p["jsonld"])
    for node in g.get("@graph", []):
        # The new site has no ?s= search page, so the SearchAction would describe something that does not exist.
        if node.get("@type") == "WebSite": node.pop("potentialAction", None)
    p["jsonld"] = json.dumps(g, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")

def fix_meta(p):
    desc = OV["descriptions"].get(p["slug"])
    metas = p["metas"]
    if desc:
        p["description"] = desc; report["descriptions_set"].append(p["slug"])
        metas = [m for m in metas if m[1] not in ("og:description", "twitter:description")]
        i = next((k for k, m in enumerate(metas) if m[1] == "og:title"), len(metas) - 1) + 1
        metas.insert(i, ["property", "og:description", desc]); metas.append(["name", "twitter:description", desc])
    key = p["slug"] if p["slug"] in OV["share_images"] else "_default"
    name = "home" if key == "_default" else str(p["id"])
    url = f"https://sun-power.co.il/share/{name}.jpg"
    metas = [m for m in metas if not m[1].startswith(("og:image", "twitter:image"))]
    metas += [["property", "og:image", url], ["property", "og:image:width", "1200"], ["property", "og:image:height", "630"],
              ["property", "og:image:type", "image/jpeg"], ["name", "twitter:image", url]]
    if not any(m[1] == "twitter:card" for m in metas): metas.append(["name", "twitter:card", "summary_large_image"])
    p["metas"] = metas

def field_groups(form):
    out = []
    for g in re.split(r'(?=<div class="[^"]*elementor-field-type-)', form)[1:]:
        typ = re.match(r'<div class="[^"]*elementor-field-type-(\w+)', g).group(1)
        lab = re.search(r"<label[^>]*>(.*?)</label>", g, re.S)
        label = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", lab.group(1)))).strip() if lab else ""
        req = "elementor-field-required" in g.split(">")[0] or 'required="required"' in g
        if typ == "submit":
            b = re.search(r'elementor-button-text">(.*?)<', g, re.S)
            out.append({"type": "submit", "label": html.unescape(b.group(1)).strip() if b else "שליחה"}); continue
        if typ in ("hidden", "recaptcha", "recaptcha_v3", "honeypot"): continue
        f = {"type": typ, "label": label, "required": req}
        ph = re.search(r'placeholder="([^"]*)"', g)
        if ph: f["placeholder"] = html.unescape(ph.group(1))
        if typ == "select":
            ph = re.search(r'<option value="">([^<]*)', g)
            if ph: f["placeholder"] = html.unescape(ph.group(1)).strip()
        if typ in ("radio", "select", "checkbox"):
            f["options"] = [html.unescape(x) for x in re.findall(r'<(?:input|option)[^>]*value="([^"]*)"', g) if x]
        if typ == "select" and f.get("placeholder") and label[:8] not in f["placeholder"]:
            # The old form gave a real answer an empty value, so choosing it failed validation. Make it a normal option.
            f["options"] = [f["placeholder"]] + f["options"]; f["placeholder"] = label
        if typ == "upload":
            ms = re.search(r'data-maxsize="(\d+)"', g); f["maxMb"] = int(ms.group(1)) if ms else 3
        out.append(f)
    return out

for p in d["pages"]:
    src = open(glob.glob(f"{raw}/html/{p['id']}_*.html")[0], encoding="utf-8").read()
    body = src[src.find('data-elementor-type="wp-page"'):src.find('data-elementor-type="footer"')]
    p["forms"] = [field_groups(f) for f in re.findall(r"<form\b.*?</form>", body, re.S)]
    for a, b, _why in OV.get("text_fixes", {}).get(p["slug"], []):
        if a not in p["html"]: print("TEXT FIX NOT FOUND:", p["slug"], a[:40])
        p["html"] = p["html"].replace(a, b)
    fix_h1(p); fix_headings(p); add_links(p); fix_jsonld(p); fix_meta(p)
    p["html"] = p["html"].replace("<h2>לחישוב הרווח השנתי שלך לפי גודל המערכת בקילוואט (KW)</h2> <h2>הרווח השנתי שלך:</h2>", '<div data-calc="wash"></div>')
    p["html"] = fix_images(p["html"], p["slug"], True)

# Header: the mobile menu is a second copy of the same links; keep one.
hd = d["header"]; i = hd.find("<ul>"); depth = 0; j = i
for m in re.finditer(r"</?ul>", hd):
    depth += 1 if m.group(0) == "<ul>" else -1
    if depth == 0: j = m.end(); break
d["header"] = fix_images(hd[:j], "(header)", True)
# The old header also had WhatsApp and phone links that were icons with no text, so the text
# conversion dropped them. Bring them back from the saved home page, with readable labels.
home_src = open(glob.glob(f"{raw}/html/1950_*.html")[0], encoding="utf-8").read()
hdr_src = home_src[home_src.find('data-elementor-type="header"'):home_src.find('data-elementor-type="wp-page"')]
contact = []
for href in dict.fromkeys(re.findall(r'<a[^>]*href="((?:tel:|https://wa\.me/)[^"]*)"', hdr_src)):
    if href.startswith("tel:"):
        n = href[4:].replace("+972", "0"); label = f"{n[:3]}-{n[3:]}"
        contact.append(f'<li><a href="{href}" aria-label="טלפון {label}">{label}</a></li>')
    else:
        contact.append(f'<li><a href="{href}" target="_blank" rel="noopener" aria-label="וואטסאפ">וואטסאפ</a></li>')
if contact: d["header"] += ' <ul class="header-contact">' + "".join(contact) + "</ul>"
report["header_contact"] = len(contact)
d["footer"] = fix_images(d["footer"], "(footer)", False)

# Pages recovered from the archive are linked from nowhere. Add each one to the services lists
# in the header and footer, right after the page named in overrides.json, so it is not an orphan.
def enc(slug): return "/" + re.sub(r"%[0-9A-F]{2}", lambda m: m.group(0).lower(), urllib.parse.quote(slug)) + "/"
for link in OV.get("menu_links", []):
    for part in ("header", "footer"):
        m = re.search(r'<li>\s*<a href="%s"[^>]*>.*?</a>\s*</li>' % re.escape(enc(link["after"])), d[part], re.S)
        if m and enc(link["slug"]) not in d[part]:
            d[part] = d[part][:m.end()] + ' <li><a href="%s">%s</a></li>' % (enc(link["slug"]), html.escape(link["text"])) + d[part][m.end():]
            report.setdefault("menu_links", []).append(part + ": " + link["text"])
def img_obj(tag):
    a = dict(re.findall(r'(\w+)="([^"]*)"', tag))
    return {"src": html.unescape(a.get("src", "")), "alt": html.unescape(a.get("alt", "")), "width": int(a.get("width", 0)),
            "height": int(a.get("height", 0)), "srcset": html.unescape(a.get("srcset", ""))}
def text(x): return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", x))).strip()
# ---- Inner pages: group repeating patterns so the design can lay them out. Words are untouched.
def structure(p):
    if not p["slug"]: return
    h = p["html"]; p["galleries"] = []
    def gallery(items):
        p["galleries"].append(items); return f'<div data-gallery="{len(p["galleries"]) - 1}"></div>'
    # Comparison pairs followed by their caption (projects page): first image clean, second dirty.
    def pairs_with_caption(m):
        return gallery([{"after": img_obj(a), "before": img_obj(b), "caption": text(c)} for a, b, c in
                        re.findall(r"(<img[^>]*>)\s*(<img[^>]*>)\s*<h3>(.*?)</h3>", m.group(0), re.S)])
    h = re.sub(r"(?:<img[^>]*>\s*<img[^>]*>\s*<h3>(?:(?!</h3>).)*</h3>\s*){2,}", pairs_with_caption, h, flags=re.S)
    # Six images then three captions (washing page).
    def pairs_then_captions(m):
        imgs = re.findall(r"<img[^>]*>", m.group(1)); caps = re.findall(r"<p>(.*?)</p>", m.group(2), re.S)
        return gallery([{"after": img_obj(imgs[2 * k]), "before": img_obj(imgs[2 * k + 1]), "caption": text(caps[k])} for k in range(3)])
    h = re.sub(r"((?:<img[^>]*>\s*){6})((?:<p>[^<]*</p>\s*){3})", pairs_then_captions, h)
    # Icon + heading (+ paragraph), repeated: a grid of features.
    def feature_title(b): return re.sub(r"^<h([23])>", lambda k: '<h%s class="feature-title">' % k.group(1), b)
    def features(m):
        items = re.findall(r"(<img[^>]*>)\s*(<h([23])>.*?</h\3>)((?:\s*<p>(?:(?!</p>).)*</p>)?)", m.group(0), re.S)
        return '<div class="feature-grid">' + "".join(f'<article class="feature"><div class="feature-icon">{a}</div>{feature_title(b)}{d.strip()}</article>' for a, b, _, d in items) + "</div> "
    h = re.sub(r"(?:<img[^>]*>\s*<h([23])>(?:(?!</h\1>).)*</h\1>(?:\s*<p>(?:(?!</p>).)*</p>)?\s*){2,}", features, h, flags=re.S)
    # Job cards on the careers page.
    def jobs(m):
        items = re.findall(r"<p>(מס' משרה \d+)</p>\s*<p>(.*?)</p>\s*<p>(.*?)</p>\s*<p>(.*?)</p>\s*<a href=\"([^\"]*)\"[^>]*>(.*?)</a>", m.group(0), re.S)
        return '<div class="job-grid">' + "".join(f'<article class="job-card"><p class="job-num">{n}</p><h2 class="job-title">{t}</h2><p>{d_}</p><p class="job-tags">{g}</p><a class="btn btn--primary" href="{u}">{x.strip()}</a></article>' for n, t, d_, g, u, x in items) + "</div>"
    h = re.sub(r"(?:<p>מס' משרה \d+</p>\s*(?:<p>(?:(?!</p>).)*</p>\s*){3}<a href=\"[^\"]*\"[^>]*>(?:(?!</a>).)*</a>\s*){2,}", jobs, h, flags=re.S)
    # Remaining loose images: rows of photos.
    h = re.sub(r"(?<!feature-icon\">)((?:<img[^>]*>\s*)+)", lambda m: f'<div class="media-row" data-count="{len(re.findall("<img", m.group(1)))}">{m.group(1).strip()}</div> ', h)
    h = re.sub(r"<figure>\s*<div class=\"media-row\"[^>]*>(<img[^>]*>)</div>\s*</figure>", r"<figure>\1</figure>", h)
    h = re.sub(r"((?:<figure>\s*<img[^>]*>\s*</figure>\s*)+)", lambda m: '<div class="media-row" data-count="%d">%s</div> ' % (len(re.findall("<img", m.group(1))), m.group(1).strip()), h)
    p["html"] = h
    counts = (p["slug"], [len(g) for g in p["galleries"]], h.count('class="feature"'), h.count("job-card"), h.count("media-row"))
    report.setdefault("structure", []).append("%s: galleries %s, features %d, jobs %d, media rows %d" % counts)
for p in d["pages"]: structure(p)
for line in report.get("structure", []): print("  ", line)

# ---- Home page as structured data, so the designed layout can place each piece.
# Every string is taken from the converted HTML; nothing is rewritten here.
def parse_home(h):
    cut = lambda a, b: h[h.index(a) + len(a):h.index(b, h.index(a) + len(a))]
    home = {"h1": text(cut("<h1>", "</h1>")), "tagline": text(cut("</h1>", "<h2>"))}
    about = cut("<h2>אודותינו</h2>", '<div class="t">')
    m = re.search(r"<p>(.*)</p>\s*<a href=\"([^\"]+)\"[^>]*>(.*?)</a>", about, re.S)
    home["about"] = {"title": "אודותינו", "paragraphs": [x.strip() for x in m.group(1).split("<br>") if x.strip()],
                     "cta": {"href": m.group(2), "text": text(m.group(3))}}
    toks = [text(x) for x in re.findall(r'<div class="t">(.*?)</div>', cut("</a>", "<h2><strong>"))]
    stats = []; i = 0
    while i < len(toks):
        st = {"label": toks[i]}; i += 1
        if not toks[i].isdigit(): st["unit"] = toks[i]; i += 1
        st["value"] = toks[i]; i += 1
        if i < len(toks) and toks[i] == "+": st["suffix"] = "+"; i += 1
        stats.append(st)
    home["stats"] = stats
    sf = re.search(r"<h2><strong>(.*?)</strong></h2><p><b>(.*?)</b></p>", h, re.S)
    home["safety"] = {"title": text(sf.group(1)), "text": text(sf.group(2))}
    why = cut("<h2>מדוע בוחרים אותנו?</h2>", "<h3>בין לקוחותינו</h3>")
    home["why"] = {"title": "מדוע בוחרים אותנו?",
                   "items": [{"image": img_obj(a), "title": text(b), "text": text(c)} for a, b, c in re.findall(r"(<img[^>]*>)\s*<h2>(.*?)</h2>\s*<p>(.*?)</p>", why, re.S)]}
    m = re.search(r'<a href="([^"]+)"[^>]*>(.*?)</a>\s*$', why.strip(), re.S)
    home["why"]["cta"] = {"href": m.group(1), "text": text(m.group(2))}
    cl = cut("<h3>בין לקוחותינו</h3>", "<h2>לקבלת")
    home["clients"] = {"title": "בין לקוחותינו", "logos": [img_obj(x) for x in re.findall(r"<figure>(<img[^>]*>)</figure>", cl)],
                       "testimonials": [{"quote": text(q), "image": img_obj(i_), "name": text(n), "role": text(r)} for q, i_, n, r in
                                        re.findall(r'<div class="t">(.*?)</div>\s*(<img[^>]*>)\s*<div class="t">(.*?)</div><div class="t">(.*?)</div>', cl, re.S)]}
    tail = cl[cl.rindex('</div>'):]
    g = [img_obj(x) for x in re.findall(r"<img[^>]*>", tail)]
    # The old site showed these as comparison sliders: first image clean, second dirty.
    home["gallery"] = [{"after": g[k], "before": g[k + 1]} for k in range(0, len(g) - 1, 2)]
    ct = h[h.index("<h2>לקבלת"):]
    m = re.search(r"<h2>(.*?)</h2>.*?<a href=\"([^\"]+)\"[^>]*>(.*?)</a>", ct, re.S)
    home["contact"] = {"title": text(m.group(1)), "form": 0, "calc": {"href": m.group(2), "text": text(m.group(3))}}
    assert len(home["stats"]) == 4 and len(home["why"]["items"]) == 4 and len(home["clients"]["testimonials"]) == 4 and len(home["gallery"]) == 3 and len(home["clients"]["logos"]) == 8, "home structure changed"
    return home
try:
    d["home"] = parse_home([p for p in d["pages"] if p["slug"] == ""][0]["html"])
    print("home parsed:", {k: (len(v) if isinstance(v, list) else "ok") for k, v in d["home"].items()})
except Exception as e:
    print("HOME PARSE FAILED:", repr(e)); d["home"] = None

# Navigation as data for the designed header and footer.
def links(block): return [{"href": html.unescape(a), "text": text(b)} for a, b in re.findall(r'<a href="([^"]*)"[^>]*>(.*?)</a>', block, re.S)]
hdr = d["header"]; top = hdr[hdr.index("<ul>"):hdr.index('<ul class="header-contact">')]
nav = []
for li in re.split(r"(?=<li><a href=)", top):
    ls = links(li)
    if not ls: continue
    if "<ul>" in li: nav.append({**ls[0], "children": ls[1:]})
    elif not any(ls[0] in n.get("children", []) for n in nav): nav.append(ls[0])
kids = [c for n in nav for c in n.get("children", [])]
d["nav"] = [n for n in nav if n not in kids]
d["headerContact"] = links(hdr[hdr.index('<ul class="header-contact">'):])
d["logo"] = img_obj(re.search(r"<img[^>]*>", hdr).group(0))
ft = d["footer"]
d["footerGroups"] = [{"title": text(t), "links": links(b)} for t, b in re.findall(r"<h6>(.*?)</h6>\s*<ul>(.*?)</ul>", ft, re.S)]
d["footerLegal"] = links(ft[ft.rindex("<ul>"):])
print("nav:", [(n["text"], len(n.get("children", []))) for n in d["nav"]], "| footer:", [(g["title"], len(g["links"])) for g in d["footerGroups"]], len(d["footerLegal"]))
json.dump(d, open(path, "w"), ensure_ascii=False, indent=1)
json.dump(report, open(f"{raw}/../enhance-report.json", "w"), ensure_ascii=False, indent=1)
print("links added:", len(report["links_added"]), "missing:", report["links_missing"], "| outlines fixed:", len(report["headings"]))
print("h1 changes:", len(report["h1"]), "| images kept:", report["images"], "| dropped:", len(report["dropped_images"]))
for p in d["pages"]: print(p["slug"] or "(home)", [[f.get("type") + ":" + f.get("label", "")[:25] for f in fm] for fm in p["forms"]])
