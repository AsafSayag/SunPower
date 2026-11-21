import { articles } from "@/content/knowledge";
import { articlePath, GLOSSARY, KNOWLEDGE, QUESTIONS } from "@/lib/knowledge";
import { SITE_URL } from "@/lib/site";

export async function GET() {
  const latest = articles.map((a) => a.updated).sort().at(-1);
  const rows = [
    [KNOWLEDGE, latest],
    [QUESTIONS, latest],
    [GLOSSARY, latest],
    ...articles.map((a) => [articlePath(a.slug), a.updated]),
  ];
  const urls = rows.map(([p, d]) => `  <url><loc>${SITE_URL}${p}</loc><lastmod>${d}</lastmod></url>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
}
