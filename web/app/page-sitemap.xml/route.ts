import { encodedUrl, pages } from "@/lib/site";

export async function GET() {
  const urls = pages
    .map((p) => `  <url><loc>${encodedUrl(p.slug)}</loc><lastmod>${p.modified}+00:00</lastmod></url>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
}
