import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage, home, pages } from "@/lib/site";
import { INDEXABLE } from "@/lib/indexing";
import type { FormField } from "@/lib/forms";
import Home from "@/components/home/Home";
import PageSections from "@/components/PageSections";

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

export default async function Page({ params }: Props) {
  const page = await resolve(params);
  if (!page) notFound();


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
      {!page.slug && home ? (
        <Home fields={(page.forms as FormField[][])[home.contact.form]} />
      ) : (
        <PageSections page={page} />
      )}
    </>
  );
}
