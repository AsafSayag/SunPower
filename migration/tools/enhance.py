"""Second pass over web/content/site.json: structural SEO and loading-speed fixes.
Text is never changed here. Run after convert.py:  python3 -I enhance.py <raw dir> <web dir>"""
import re, sys, json, glob, os, html, subprocess, urllib.parse
raw, web = sys.argv[1], sys.argv[2]
path = f"{web}/content/site.json"
d = json.load(open(path))
pub = f"{web}/public"
report = {"h1": [], "dropped_images": [], "images": 0, "alts_set": 0, "descriptions_set": []}
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
        if typ == "upload":
            ms = re.search(r'data-maxsize="(\d+)"', g); f["maxMb"] = int(ms.group(1)) if ms else 3
        out.append(f)
    return out

for p in d["pages"]:
    src = open(glob.glob(f"{raw}/html/{p['id']}_*.html")[0], encoding="utf-8").read()
    body = src[src.find('data-elementor-type="wp-page"'):src.find('data-elementor-type="footer"')]
    p["forms"] = [field_groups(f) for f in re.findall(r"<form\b.*?</form>", body, re.S)]
    fix_h1(p); fix_jsonld(p); fix_meta(p)
    p["html"] = p["html"].replace("<h2>לחישוב הרווח השנתי שלך לפי גודל המערכת בקילוואט (KW)</h2> <h2>הרווח השנתי שלך:</h2>", '<div data-calc="wash"></div>')
    p["html"] = fix_images(p["html"], p["slug"], True)

# Header: the mobile menu is a second copy of the same links; keep one.
hd = d["header"]; i = hd.find("<ul>"); depth = 0; j = i
for m in re.finditer(r"</?ul>", hd):
    depth += 1 if m.group(0) == "<ul>" else -1
    if depth == 0: j = m.end(); break
d["header"] = fix_images(hd[:j], "(header)", True)
d["footer"] = fix_images(d["footer"], "(footer)", False)
json.dump(d, open(path, "w"), ensure_ascii=False, indent=1)
json.dump(report, open(f"{raw}/../enhance-report.json", "w"), ensure_ascii=False, indent=1)
print("h1 changes:", len(report["h1"]), "| images kept:", report["images"], "| dropped:", len(report["dropped_images"]))
for p in d["pages"]: print(p["slug"] or "(home)", [[f.get("type") + ":" + f.get("label", "")[:25] for f in fm] for fm in p["forms"]])
