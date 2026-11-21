import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Fragment } from "react";
import { getPage, pages } from "@/lib/site";
import { INDEXABLE } from "@/lib/indexing";
import RoofCalculator from "@/components/RoofCalculator";
import WashCalculator from "@/components/WashCalculator";
import LeadForm from "@/components/LeadForm";
import type { FormField } from "@/lib/forms";
import CoverageMap from "@/components/CoverageMap";
import { articles } from "@/content/knowledge";
import { articlePath, KNOWLEDGE } from "@/lib/knowledge";

type Props = { params: Promise<{ slug?: string[] }> };

// Only the pages listed below exist; anything else is a real 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return pages.map((p) => ({ slug: p.slug ? [p.slug] : [] }));
}

async function resolve(params: Props["params"]) {
  const { slug } = await params;
  if (slug && slug.length > 1) return undefined;
  return getPage(slug?.[0] ?? "");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await resolve(params);
  if (!page) return {};
  return {
    title: { absolute: page.title },
    description: page.description || undefined,
    robots: INDEXABLE ? page.robots : "noindex, nofollow",
  };
}

/** Same trail Yoast already declares in the structured data: home, then this page. */
function breadcrumbName(page: { jsonld: string; title: string }): string {
  try {
    const graph = JSON.parse(page.jsonld)["@graph"] as { "@type": string; itemListElement?: { name: string }[] }[];
    const name = graph.find((n) => n["@type"] === "BreadcrumbList")?.itemListElement?.at(-1)?.name;
    if (name) return name;
  } catch {
    // fall through to the title
  }
  return page.title.replace(/ - SunPower$/, "");
}

const MARKER = /(<div data-(?:calc|form)="[^"]*"><\/div>)/;

export default async function Page({ params }: Props) {
  const page = await resolve(params);
  if (!page) notFound();

  const parts = page.html.split(MARKER);
  // Articles that name this page as a related service.
  const relatedArticles = articles.filter((a) => a.relatedPages.includes(page.slug));

  return (
    <>
      {/* Canonical written exactly as the old site wrote it (unencoded Hebrew). */}
      <link rel="canonical" href={page.canonical} />
      {page.metas.map(([attr, key, content]) =>
        attr === "property" ? (
          <meta key={key} property={key} content={content} />
        ) : (
          <meta key={key} name={key} content={content} />
        ),
      )}
      {page.jsonld && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: page.jsonld }} />
      )}
      <main className="content">
        {page.slug && (
          <nav aria-label="פירורי לחם" className="breadcrumbs">
            <ol>
              <li>
                <Link href="/">דף הבית</Link>
              </li>
              <li aria-current="page">{breadcrumbName(page)}</li>
            </ol>
          </nav>
        )}
        {parts.map((part, i) => {
          if (part.startsWith('<div data-calc="roof"')) return <RoofCalculator key={i} />;
          if (part.startsWith('<div data-calc="wash"')) return <WashCalculator key={i} />;
          const form = part.match(/^<div data-form="(\d+)"/);
          if (form) {
            const fields = (page.forms as FormField[][])[Number(form[1])];
            return fields ? <LeadForm key={i} fields={fields} page={page.slug || "דף הבית"} /> : null;
          }
          return <Fragment key={i}><div dangerouslySetInnerHTML={{ __html: part }} /></Fragment>;
        })}
        {relatedArticles.length > 0 && (
          <aside aria-labelledby="related-articles" className="related">
            <h2 id="related-articles">עוד בנושא במרכז הידע</h2>
            <ul>
              {relatedArticles.map((a) => (
                <li key={a.slug}>
                  <Link href={articlePath(a.slug)}>{a.title}</Link>
                </li>
              ))}
              <li>
                <Link href={KNOWLEDGE}>לכל המאמרים, השאלות והמונחים</Link>
              </li>
            </ul>
          </aside>
        )}
        {!page.slug && <CoverageMap />}
      </main>
    </>
  );
}
