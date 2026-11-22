import { encodedUrl, pages, SITE_URL } from "@/lib/site";

const xmlEscape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Images that appear on a page, listed the way the old Yoast sitemap listed them. */
function images(html: string): string[] {
  const out = new Set<string>();
  for (const m of html.matchAll(/<img[^>]*\ssrc="(\/wp-content\/[^"]+)"/g)) {
    const path = m[1].replace(/&amp;/g, "&");
    out.add(SITE_URL + path.split("/").map((seg) => encodeURIComponent(decodeURIComponent(seg))).join("/"));
  }
  return [...out];
}

export async function GET() {
  const urls = pages
    .map((p) => {
      const imgs = images(p.html)
        .map((u) => `\n    <image:image><image:loc>${xmlEscape(u)}</image:loc></image:image>`)
        .join("");
      return `  <url><loc>${encodedUrl(p.slug)}</loc><lastmod>${p.modified}+00:00</lastmod>${imgs}\n  </url>`;
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
}
