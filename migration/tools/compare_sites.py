"""Page-by-page comparison of the old WordPress site and a deployment of the new one.
Usage: python3 -I compare_sites.py https://sunpower-git-asaf-asafsayags-projects.vercel.app [--old https://sun-power.co.il]
Reports every difference in SEO tags, text, links, images and contact details, so each one
can be confirmed as intentional before launch."""
import collections, html, json, os, re, sys, urllib.error, urllib.parse, urllib.request
NEW = sys.argv[1].rstrip("/")
OLD = sys.argv[sys.argv.index("--old") + 1].rstrip("/") if "--old" in sys.argv else "https://sun-power.co.il"
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UA = {"User-Agent": "Mozilla/5.0 (compatible; site-audit)"}

def get(url):
    p = urllib.parse.urlsplit(url)
    u = urllib.parse.urlunsplit((p.scheme, p.netloc, urllib.parse.quote(urllib.parse.unquote(p.path)), p.query, ""))
    try:
        r = urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=40); return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e: return e.code, ""

def meta(s, attr, key):
    m = re.search(r'<meta\s+%s=["\']%s["\']\s+content=["\']([^"\']*)["\']' % (attr, re.escape(key)), s)
    return html.unescape(m.group(1)).strip() if m else None

def region(s, new):
    if new:
        a = s.find("<main"); return s[a:s.find("</main>", a)]
    return s[s.find('data-elementor-type="wp-page"'):s.find('data-elementor-type="footer"')]

def words(h):
    h = re.sub(r"<(script|style|svg|noscript|select|textarea|button|form|nav)\b.*?</\1>", " ", h, flags=re.S | re.I)
    return collections.Counter(w for w in re.findall(r"[\w֐-׿%₪'\"״׳-]+", html.unescape(re.sub(r"<[^>]+>", " ", h)))
                               if not re.match(r"^(elementor|data-|class|page|div|footer|\d+)$", w) and len(w) > 1)

def ld_types(s):
    out = set()
    for blk in re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', s, re.S):
        try: d = json.loads(blk)
        except Exception: continue
        for n in d.get("@graph", [d]):
            t = n.get("@type"); out |= set(t if isinstance(t, list) else [t])
    return out

def links(h, kind):
    hs = [html.unescape(x) for x in re.findall(r'<a[^>]*href="([^"]*)"', h)]
    if kind == "contact": return {re.sub(r"[?&].*$", "", x) for x in hs if re.match(r"(tel:|mailto:|https://(wa\.me|api\.whatsapp|waze|www\.facebook))", x)}
    return {urllib.parse.unquote(x.replace(OLD, "").split("#")[0]).rstrip("/") or "/" for x in hs if x.startswith("/") or x.startswith(OLD)}

def imgs(h):
    return {urllib.parse.unquote(re.sub(r"\.(png|jpe?g)$", "", x.split("/wp-content/uploads/")[-1].split("?")[0])) for x in re.findall(r'<img[^>]*src="([^"]*wp-content/uploads/[^"]*)"', h)}

site = json.load(open(os.path.join(ROOT, "web", "content", "site.json")))
issues = 0
for p in site["pages"]:
    path = "/" + p["slug"] + ("/" if p["slug"] else "")
    so, o = get(OLD + path); sn, n = get(NEW + path)
    print(f"\n=== {urllib.parse.unquote(path)}  old {so} / new {sn}")
    if so != 200:
        print("   (old page not live: restored page, compared with the archived copy)")
        o = open(next(f for f in (os.path.join(ROOT, "migration/raw/html", x) for x in os.listdir(os.path.join(ROOT, "migration/raw/html"))) if os.path.basename(f).startswith(f"{p['id']}_")), encoding="utf-8").read()
    rows = []
    for label, a, b in [
        ("title", re.search(r"<title>(.*?)</title>", o, re.S), re.search(r"<title>(.*?)</title>", n, re.S)),
    ]:
        a = html.unescape(a.group(1)).strip() if a else None; b = html.unescape(b.group(1)).strip() if b else None
        if a != b: rows.append((label, a, b))
    for label, attr, key in [("description", "name", "description"), ("og:title", "property", "og:title"), ("og:description", "property", "og:description"), ("og:image", "property", "og:image"), ("og:url", "property", "og:url")]:
        a, b = meta(o, attr, key), meta(n, attr, key)
        if a != b: rows.append((label, a, b))
    ca = re.search(r'<link rel="canonical" href="([^"]*)"', o); cb = re.search(r'<link rel="canonical" href="([^"]*)"', n)
    ca = urllib.parse.unquote(ca.group(1)) if ca else None; cb = urllib.parse.unquote(cb.group(1)) if cb else None
    if ca != cb: rows.append(("canonical", ca, cb))
    ta, tb = ld_types(o), ld_types(n)
    if ta - tb: rows.append(("structured data lost", sorted(ta - tb), ""))
    if tb - ta: rows.append(("structured data added", "", sorted(tb - ta)))
    ro, rn = region(o, False), region(n, True)
    miss = [w for w, c in (words(ro) - words(rn)).items()]
    if miss: rows.append(("words missing", " ".join(miss[:12]), ""))
    la, lb = links(ro, "internal"), links(rn, "internal")
    if la - lb: rows.append(("internal links lost", sorted(la - lb), ""))
    ka, kb = links(o, "contact"), links(n, "contact")
    if ka - kb: rows.append(("contact links changed (old)", sorted(ka - kb), sorted(kb - ka)))
    ia, ib = imgs(ro), imgs(rn)
    if ia - ib: rows.append(("images lost", sorted(ia - ib), ""))
    h1a = [re.sub(r"<[^>]+>", "", x).strip() for x in re.findall(r"<h1[^>]*>(.*?)</h1>", ro, re.S)]
    h1b = [re.sub(r"<[^>]+>", "", x).strip() for x in re.findall(r"<h1[^>]*>(.*?)</h1>", rn, re.S)]
    if h1a != h1b: rows.append(("h1", h1a, h1b))
    for r in rows: print(f"   - {r[0]}: {str(r[1])[:150]}  ->  {str(r[2])[:150]}")
    issues += len(rows)
print(f"\n{issues} differences listed")
