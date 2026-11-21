import { articles } from "@/content/knowledge";
import { pages, SITE_URL } from "@/lib/site";

export async function GET() {
  const last = pages.map((p) => p.modified).sort().at(-1);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${SITE_URL}/page-sitemap.xml</loc><lastmod>${last}+00:00</lastmod></sitemap>
  <sitemap><loc>${SITE_URL}/knowledge-sitemap.xml</loc><lastmod>${articles.map((a) => a.updated).sort().at(-1)}</lastmod></sitemap>
</sitemapindex>`;
  return new Response(xml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
}
