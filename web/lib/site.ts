import data from "@/content/site.json";

export const SITE_URL = "https://sun-power.co.il";

export type Page = (typeof data.pages)[number];
export type Img = { src: string; alt: string; width: number; height: number; srcset: string };
export type LinkItem = { href: string; text: string };

export const pages: Page[] = data.pages;
export const home = data.home;
export const logo = data.logo as Img;
export const headerContact = data.headerContact as LinkItem[];
export const footerGroups = data.footerGroups as { title: string; links: LinkItem[] }[];
// The old footer credited the agency that built the WordPress site; that credit does not carry over.
export const footerLegal = (data.footerLegal as LinkItem[]).filter((l) => l.href.startsWith("/"));

/** Top navigation. The services pages are listed flat in the data; group them under their parent. */
export const nav = (() => {
  const services = new Set((footerGroups.find((g) => g.title === "השירותים שלנו")?.links ?? []).map((l) => l.href));
  const out: (LinkItem & { children?: LinkItem[] })[] = [];
  for (const item of data.nav as LinkItem[]) {
    if (services.has(item.href)) out.find((n) => n.href === "#")?.children?.push(item);
    else out.push(item.href === "#" ? { ...item, children: [] } : item);
  }
  return out;
})();

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
