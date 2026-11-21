import { articles, AUTHOR, type Article } from "@/content/knowledge";
import { INDEXABLE } from "@/lib/indexing";
import { SITE_URL } from "@/lib/site";

/** Lowercase percent-encoding, the same form the rest of the site uses for Hebrew paths. */
export function encodePath(path: string): string {
  return path
    .split("/")
    .map((s) => encodeURIComponent(s).replace(/%[0-9A-F]{2}/g, (m) => m.toLowerCase()))
    .join("/");
}

export const KNOWLEDGE = "/knowledge/";
export const QUESTIONS = "/knowledge/questions/";
export const GLOSSARY = "/knowledge/glossary/";
export const articlePath = (slug: string) => encodePath(`/knowledge/articles/${slug}/`);
export const pagePath = (slug: string) => encodePath(`/${slug}/`);
export const termPath = (id: string) => `${GLOSSARY}#${id}`;

/** Turn a link target from the content file into a real href. */
export function resolveTarget(target: string): string {
  if (target.startsWith("page:")) return pagePath(target.slice(5));
  if (target.startsWith("article:")) return articlePath(target.slice(8));
  if (target.startsWith("term:")) return termPath(target.slice(5));
  return target;
}

export function getArticle(segment: string): Article | undefined {
  let slug = segment;
  try {
    slug = decodeURIComponent(segment);
  } catch {
    // keep as is
  }
  return articles.find((a) => a.slug === slug);
}

/** Absolute URL written with plain Hebrew, as the old site wrote its canonicals. */
export const absolute = (path: string) => SITE_URL + decodeURIComponent(path);

export const robots = INDEXABLE ? "index, follow, max-image-preview:large" : "noindex, nofollow";

export const stripLinks = (text: string) => text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

const ORG = { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "SunPower", url: `${SITE_URL}/` };

export function breadcrumbLd(trail: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "דף הבית", path: "/" }, ...trail].map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: absolute(t.path),
    })),
  };
}

export function articleLd(a: Article) {
  const url = absolute(articlePath(a.slug));
  return {
    "@type": "Article",
    "@id": `${url}#article`,
    headline: a.title,
    description: a.description,
    image: absolute(a.image),
    datePublished: a.published,
    dateModified: a.updated,
    inLanguage: "he-IL",
    author: { ...ORG, name: AUTHOR },
    publisher: ORG,
    mainEntityOfPage: url,
  };
}

export const graph = (...nodes: object[]) => ({ "@context": "https://schema.org", "@graph": nodes });
export { ORG };
