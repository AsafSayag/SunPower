import { INDEXABLE } from "@/lib/indexing";

export async function GET() {
  const body = INDEXABLE
    ? "User-agent: *\nDisallow:\n\nSitemap: https://sun-power.co.il/sitemap_index.xml\n"
    : // Crawling stays allowed on test environments on purpose: Google must be able to read the
      // noindex header to obey it. A Disallow here would hide that header.
      "User-agent: *\nDisallow:\n";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=UTF-8" } });
}
