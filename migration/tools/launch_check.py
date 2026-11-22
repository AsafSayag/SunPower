"""Checks a deployment of the SunPower site against everything the move must preserve.

Usage:
  python3 -I launch_check.py https://sunpower-staging.vercel.app          # test environment
  python3 -I launch_check.py https://sun-power.co.il --live               # launch day

--live additionally expects: search engines allowed, Analytics loaded, www and http
redirecting to the bare https domain, and the business's mail records untouched.
Exit code is 0 only when every check passes.
"""
import html, json, os, re, subprocess, sys, urllib.error, urllib.parse, urllib.request

BASE = sys.argv[1].rstrip("/")
LIVE = "--live" in sys.argv
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SITE = "https://sun-power.co.il"
UA = {"User-Agent": "Mozilla/5.0 (compatible; launch-check)"}
failures = []

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None
opener = urllib.request.build_opener(NoRedirect)

def enc(path):
    p = urllib.parse.urlsplit(path)
    return urllib.parse.urlunsplit((p.scheme, p.netloc, urllib.parse.quote(urllib.parse.unquote(p.path)), p.query, ""))

def fetch(url, method="GET", data=None, headers=None):
    req = urllib.request.Request(enc(url), method=method, data=data, headers={**UA, **(headers or {})})
    try:
        r = opener.open(req, timeout=40)
        return r.status, dict(r.headers), r.read()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read()
    except Exception as e:
        return 0, {}, str(e).encode()

def check(name, ok, detail=""):
    print(("  ok   " if ok else "  FAIL ") + name + (f"  ->  {detail}" if detail and not ok else ""))
    if not ok: failures.append(name)

def section(title): print("\n" + title)

site = json.load(open(os.path.join(ROOT, "web", "content", "site.json")))
pages = site["pages"]

section("Pages keep their addresses")
bodies = {}
for p in pages:
    path = "/" + p["slug"] + ("/" if p["slug"] else "")
    st, hd, body = fetch(BASE + path)
    bodies[path] = body.decode("utf-8", "replace")
    check(f"200 {path}", st == 200, str(st))

section("SEO tags on every page")
for p in pages:
    path = "/" + p["slug"] + ("/" if p["slug"] else ""); b = bodies[path]
    title = re.search(r"<title>(.*?)</title>", b, re.S)
    canon = re.search(r'<link rel="canonical" href="([^"]*)"', b)
    robots = re.search(r'<meta name="robots" content="([^"]*)"', b)
    problems = []
    if not title or html.unescape(title.group(1)) != p["title"]: problems.append("title")
    if not canon or urllib.parse.unquote(canon.group(1)) != p["canonical"]: problems.append("canonical")
    if len(re.findall(r"<h1[\s>]", b)) != 1: problems.append("h1 count")
    if p["description"] and 'name="description"' not in b: problems.append("description")
    if "application/ld+json" not in b: problems.append("structured data")
    indexable = bool(robots) and "noindex" not in robots.group(1)
    if LIVE and not indexable: problems.append("still noindex")
    if not LIVE and indexable: problems.append("test environment is indexable")
    check(f"tags {path}", not problems, ", ".join(problems))

section("Old addresses redirect")
proxy = open(os.path.join(ROOT, "web", "proxy.ts"), encoding="utf-8").read()
old_slugs = proxy[proxy.index("const OLD_SLUGS"):]
old_slugs = old_slugs[:old_slugs.index("};")]
for old, new in re.findall(r'^\s*"([^"]+)":\s*"([^"]+)"', old_slugs, re.M):
    st, hd, _ = fetch(f"{BASE}/{old}/")
    loc = urllib.parse.unquote(hd.get("Location", hd.get("location", "")))
    target_ok = loc.rstrip("/").endswith("/" + new)
    st2 = fetch(urllib.parse.urljoin(BASE + "/", hd.get("Location", hd.get("location", ""))))[0] if target_ok else 0
    check(f"301 /{old}/ -> /{new}/", st == 301 and target_ok and st2 == 200, f"{st} {loc} then {st2}")
page_ids = proxy[proxy.index("const PAGE_IDS"):]
page_ids = dict(re.findall(r'^\s*"(\d+)":\s*"([^"]*)"', page_ids[:page_ids.index("};")], re.M))
for pid in ("22", "1950"):
    st, hd, _ = fetch(f"{BASE}/?p={pid}")
    loc = urllib.parse.unquote(hd.get("Location", hd.get("location", "")))
    check(f"301 /?p={pid} -> /{page_ids[pid]}", st == 301 and loc.rstrip("/").endswith(page_ids[pid].rstrip("/")) , f"{st} {loc}")
st, hd, _ = fetch(BASE + "/feed/")
check("old feed redirects", st in (301, 308), str(st))
st, hd, _ = fetch(BASE + "/" + pages[1]["slug"])
check("missing trailing slash redirects", st in (301, 308), str(st))
st, _, _ = fetch(BASE + "/no-such-page-xyz/")
check("unknown address returns 404", st == 404, str(st))

section("Crawling")
st, hd, body = fetch(BASE + "/robots.txt"); robots_txt = body.decode()
check("robots.txt loads", st == 200, str(st))
if LIVE: check("robots.txt points to the sitemap", "sitemap_index.xml" in robots_txt)
xr = (fetch(BASE + "/")[1].get("X-Robots-Tag") or fetch(BASE + "/")[1].get("x-robots-tag") or "")
check("X-Robots-Tag header " + ("absent" if LIVE else "blocks indexing"), ("noindex" not in xr) if LIVE else ("noindex" in xr), xr)
st, _, body = fetch(BASE + "/sitemap_index.xml")
check("sitemap index loads", st == 200, str(st))
locs = []
for sm in re.findall(r"<loc>(.*?)</loc>", body.decode()):
    s2, _, b2 = fetch(sm.replace(SITE, BASE))
    check("sitemap " + sm.rsplit("/", 1)[-1], s2 == 200, str(s2))
    locs += re.findall(r"<loc>(.*?)</loc>", b2.decode())
bad = [u for u in locs if fetch(u.replace(SITE, BASE))[0] != 200]
check(f"all {len(locs)} sitemap addresses load", not bad and len(locs) >= len(pages), str(bad[:3]))
imgs_in_map = [u for u in re.findall(r"<image:loc>(.*?)</image:loc>", "".join(fetch(sm.replace(SITE, BASE))[2].decode() for sm in re.findall(r"<loc>(.*?)</loc>", fetch(BASE + "/sitemap_index.xml")[2].decode())))]
bad = [u for u in imgs_in_map if fetch(html.unescape(u).replace(SITE, BASE))[0] != 200]
check(f"all {len(imgs_in_map)} sitemap images load", imgs_in_map and not bad, str(bad[:3]))

section("Images and links on the home page")
home = bodies["/"]
imgs = set(html.unescape(x) for x in re.findall(r'<img[^>]*src="(/[^"]*)"', home))
bad = [i for i in imgs if fetch(BASE + i)[0] != 200]
check(f"{len(imgs)} images load", not bad, str(bad[:3]))
links = set(html.unescape(x) for x in re.findall(r'<a[^>]*href="(/[^"#]*)', home))
bad = [l for l in links if fetch(BASE + l)[0] != 200]
check(f"{len(links)} internal links load", not bad, str(bad[:3]))

section("Forms")
boundary = "----launchcheck"
def form(fields):
    return ("".join(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n' for k, v in fields) + f"--{boundary}--\r\n").encode()
ct = {"Content-Type": f"multipart/form-data; boundary={boundary}"}
st, _, body = fetch(BASE + "/api/lead/", "POST", form([("page", "launch-check"), ("field:name", "check")]), ct)
check("form endpoint refuses a submission without consent", st == 400 and b"consent_required" in body, f"{st} {body[:80]!r}")
print("       (a real submission is not sent by this script: send one by hand and confirm it arrives)")

section("Security headers")
hd = fetch(BASE + "/")[1]; low = {k.lower(): v for k, v in hd.items()}
for h in ("x-content-type-options", "referrer-policy", "x-frame-options", "content-security-policy", "strict-transport-security"):
    check(f"header {h}", h in low)
check("no x-powered-by header", "x-powered-by" not in low)

section("Tracking and verification")
check("Search Console verification tag present", "google-site-verification" in home)
if LIVE:
    check("Google Analytics loaded", "googletagmanager.com/gtag/js" in home)
    check("accessibility widget loaded", "cdn.enable.co.il" in home)
else:
    check("Google Analytics not loaded on the test environment", "googletagmanager.com/gtag/js" not in home)

if LIVE:
    section("Domain")
    host = urllib.parse.urlsplit(BASE).netloc
    st, hd, _ = fetch(f"http://{host}/")
    check("http redirects to https", st in (301, 308) and (hd.get("Location") or hd.get("location", "")).startswith("https://"), str(st))
    st, hd, _ = fetch(f"https://www.{host}/")
    check("www redirects to the bare domain", st in (301, 308) and f"//{host}" in (hd.get("Location") or hd.get("location", "")), str(st))
    mx = subprocess.run(["dig", "+short", "MX", host], capture_output=True, text=True).stdout
    check("mail records still point to Google", mx.count("google.com") >= 5, mx.replace("\n", " "))
    txt = subprocess.run(["dig", "+short", "TXT", host], capture_output=True, text=True).stdout
    check("SPF record still present", "v=spf1" in txt)

print("\n" + ("ALL CHECKS PASSED" if not failures else f"{len(failures)} CHECK(S) FAILED:\n  - " + "\n  - ".join(failures)))
sys.exit(1 if failures else 0)
