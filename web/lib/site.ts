import data from "@/content/site.json";

export const SITE_URL = "https://sun-power.co.il";

export type Page = (typeof data.pages)[number];

export const pages: Page[] = data.pages;
export const headerHtml: string = data.header;
export const footerHtml: string = data.footer;

/** Find a page by its path segment. Accepts both decoded Hebrew and percent-encoded input. */
export function getPage(segment: string): Page | undefined {
  let slug = segment;
  try {
    slug = decodeURIComponent(segment);
  } catch {
    // keep as is
  }
  return pages.find((p) => p.slug === slug);
}

/** Canonical URL in the same lowercase percent-encoded form WordPress used in its sitemap. */
export function encodedUrl(slug: string): string {
  if (!slug) return `${SITE_URL}/`;
  const enc = encodeURIComponent(slug).replace(/%[0-9A-F]{2}/g, (m) => m.toLowerCase());
  return `${SITE_URL}/${enc}/`;
}
