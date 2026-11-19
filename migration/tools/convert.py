import re, sys, json, glob, os, html, urllib.parse
from html.parser import HTMLParser
raw, out = sys.argv[1], sys.argv[2]
BLOCK = {"h1","h2","h3","h4","h5","h6","p","ul","ol","li","table","thead","tbody","tr","td","th","blockquote","figure","figcaption"}
INLINE = {"a","strong","b","em","i","u","br","img","sup","sub"}
VOID = {"br","img","input","hr","meta","link","source","area","col","embed","wbr"}
SKIP = {"script","style","svg","noscript","template","iframe","select","textarea","button"}
SITE = "https://sun-power.co.il"
def rel(u):
    u = html.unescape(u)
    if u.startswith(SITE): u = u[len(SITE):] or "/"
    return u
class Conv(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True)
        s.stack=[]; s.region=None; s.regdepth=0; s.skip=0; s.buf={"header":[], "wp-page":[], "footer":[]}; s.blk=0; s.forms=[]; s.inform=0; s.cut=None; s.counter=None
    def emit(s,x):
        if s.region: s.buf[s.region].append(x)
    def handle_starttag(s,tag,attrs):
        a=dict(attrs)
        if tag not in VOID: s.stack.append(tag)
        if s.cut is not None: return
        if s.skip:
            if tag in SKIP and tag not in VOID: s.skip+=1
            return
        if s.region and "roof-calc-wrap" in (a.get("class") or ""):
            s.cut=len(s.stack); s.emit('<div data-calc="roof"></div>'); return
        if a.get("data-to-value"): s.counter=a["data-to-value"]
        if tag in SKIP: s.skip=1; return
        t=a.get("data-elementor-type")
        if t in s.buf and not s.region: s.region=t; s.regdepth=len(s.stack); return
        if not s.region: return
        if tag=="form":
            s.inform=1; s.forms.append({"region":s.region,"name":a.get("name",""),"fields":[]}); s.emit('<div data-form="%d"></div>'%(len(s.forms)-1)); return
        if s.inform:
            if tag=="input" and a.get("type") not in ("hidden",None):
                s.forms[-1]["fields"].append({k:a.get(k) for k in ("type","name","placeholder","required","value") if k in a})
            return
        if tag in BLOCK:
            s.blk+=1; s.emit("<%s>"%tag)
        elif tag=="a":
            h=rel(a.get("href","")); ex=""
            if a.get("target"): ex+=' target="%s"'%a["target"]
            if a.get("rel"): ex+=' rel="%s"'%html.escape(a["rel"])
            if a.get("aria-label"): ex+=' aria-label="%s"'%html.escape(a["aria-label"])
            s.emit('<a href="%s"%s>'%(html.escape(h),ex))
        elif tag=="img":
            src=rel(a.get("src",""))
            if src.startswith("data:"): return
            ex="".join(' %s="%s"'%(k,html.escape(a[k])) for k in ("width","height","title") if a.get(k))
            s.emit('<img src="%s" alt="%s"%s loading="lazy">'%(html.escape(src),html.escape(a.get("alt","")),ex))
        elif tag=="br": s.emit("<br>")
        elif tag in INLINE: s.emit("<%s>"%tag)
    def handle_endtag(s,tag):
        if tag in VOID: return
        while s.stack and s.stack[-1]!=tag: s.stack.pop()
        if s.stack: s.stack.pop()
        if s.cut is not None:
            if len(s.stack)<s.cut: s.cut=None
            return
        if s.skip:
            if tag in SKIP: s.skip-=1
            return
        if not s.region: return
        if len(s.stack)<s.regdepth-0 and len(s.stack)<s.regdepth: s.region=None; return
        if tag=="form": s.inform=0; return
        if s.inform: return
        if tag in BLOCK: s.blk=max(0,s.blk-1); s.emit("</%s>"%tag)
        elif tag in INLINE: s.emit("</%s>"%tag)
    def handle_data(s,d):
        if s.skip or not s.region or s.cut is not None: return
        if s.counter is not None and d.strip()=="0": d=s.counter; s.counter=None
        if s.inform:
            if d.strip(): s.forms[-1]["fields"].append({"text":d.strip()})
            return
        if not d.strip():
            if d: s.emit(" ")
            return
        e=html.escape(d,quote=False)
        if s.blk==0 and "a" not in s.stack[s.regdepth:]: s.emit('<div class="t">%s</div>'%e.strip())
        else: s.emit(e)
def tidy(parts):
    x="".join(parts); x=re.sub(r"[ \t\r\n]+"," ",x)
    for _ in range(3): x=re.sub(r"<(p|h[1-6]|li|ul|ol|a [^>]*|strong|em|b|i|figure)>\s*</(p|h[1-6]|li|ul|ol|a|strong|em|b|i|figure)>","",x)
    return x.strip()
pages=[]; header=footer=None; allforms=[]
meta=json.load(open(f"{raw}/pages.json"))
byid={str(p["id"]):p for p in meta}
for f in sorted(glob.glob(f"{raw}/html/*.html")):
    pid=os.path.basename(f).split("_")[0]; src=open(f,encoding="utf-8").read()
    c=Conv(); c.feed(src)
    link=urllib.parse.unquote(byid[pid]["link"]); slug=link[len(SITE):].strip("/")
    g=lambda p: (lambda r: html.unescape(r.group(1)) if r else "")(re.search(p,src,re.S))
    metas=[]
    for m in re.finditer(r"<meta ([^>]+?)/?>",src):
        at=dict(re.findall(r'([\w:-]+)="([^"]*)"',m.group(1)))
        k=at.get("property") or at.get("name")
        if k and re.match(r"(og:|article:|twitter:)",k): metas.append([("property" if "property" in at else "name"),k,html.unescape(at.get("content",""))])
    pages.append({"id":int(pid),"slug":slug,"title":g(r"<title>(.*?)</title>"),"description":g(r'<meta name="description" content="(.*?)"'),
      "canonical":urllib.parse.unquote(g(r'<link rel="canonical" href="(.*?)"')),"robots":g(r"<meta name='robots' content='(.*?)'"),
      "metas":metas,"jsonld":g(r'<script type="application/ld\+json"[^>]*>(.*?)</script>'),"modified":byid[pid]["modified_gmt"],"html":tidy(c.buf["wp-page"])})
    for i,fm in enumerate(c.forms): allforms.append({"page":slug,**fm})
    if pid=="1950": header=tidy(c.buf["header"]); footer=tidy(c.buf["footer"])
    print(slug or "(home)", len(pages[-1]["html"]), "chars", len(re.sub(r"<[^>]+>"," ",pages[-1]["html"]).split()),"words", len(c.forms),"forms")
os.makedirs(out,exist_ok=True)
json.dump({"header":header,"footer":footer,"pages":pages},open(f"{out}/site.json","w"),ensure_ascii=False,indent=1)
json.dump(allforms,open(f"{raw}/../forms-inventory.json","w"),ensure_ascii=False,indent=1)
