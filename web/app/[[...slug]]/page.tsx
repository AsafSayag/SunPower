import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import { getPage, pages } from "@/lib/site";
import { INDEXABLE } from "@/lib/indexing";
import RoofCalculator from "@/components/RoofCalculator";
import WashCalculator from "@/components/WashCalculator";
import LeadForm from "@/components/LeadForm";
import type { FormField } from "@/lib/forms";

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

const MARKER = /(<div data-(?:calc|form)="[^"]*"><\/div>)/;

export default async function Page({ params }: Props) {
  const page = await resolve(params);
  if (!page) notFound();

  const parts = page.html.split(MARKER);

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
      </main>
    </>
  );
}
