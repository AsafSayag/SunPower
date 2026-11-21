import Link from "next/link";
import { Fragment } from "react";
import Gallery, { type GalleryItem } from "@/components/Gallery";
import LeadForm from "@/components/LeadForm";
import PageHero from "@/components/PageHero";
import RoofCalculator from "@/components/RoofCalculator";
import WashCalculator from "@/components/WashCalculator";
import { articles } from "@/content/knowledge";
import type { FormField } from "@/lib/forms";
import { articlePath, KNOWLEDGE } from "@/lib/knowledge";
import type { Page } from "@/lib/site";

const MARKER = /(<div data-(?:calc|form|gallery)="[^"]*"><\/div>)/;
const FORM = /<div data-form="(\d+)"><\/div>/;
// Up to three short blocks right before a form are its introduction.
const FORM_INTRO = /((?:<(p|h3)>(?:(?!<\/\2>)[\s\S])*<\/\2>\s*){1,3})$/;

function Blocks({ html, page }: { html: string; page: Page }) {
  const galleries = (page as Page & { galleries?: GalleryItem[][] }).galleries ?? [];
  return (
    <>
      {html.split(MARKER).map((part, i) => {
        if (part.startsWith('<div data-calc="roof"')) return <RoofCalculator key={i} />;
        if (part.startsWith('<div data-calc="wash"')) return <WashCalculator key={i} />;
        const g = part.match(/^<div data-gallery="(\d+)"/);
        if (g) return <Gallery key={i} items={galleries[Number(g[1])]} as={page.slug.startsWith("פרויקטים") ? "h3" : "p"} />;
        if (!part.trim()) return null;
        return <Fragment key={i}><div className="prose" dangerouslySetInnerHTML={{ __html: part }} /></Fragment>;
      })}
    </>
  );
}

function breadcrumbName(page: Page): string {
  try {
    const graph = JSON.parse(page.jsonld)["@graph"] as { "@type": string; itemListElement?: { name: string }[] }[];
    const name = graph.find((n) => n["@type"] === "BreadcrumbList")?.itemListElement?.at(-1)?.name;
    if (name) return name;
  } catch {
    // fall through to the title
  }
  return page.title.replace(/ - SunPower$/, "");
}

/** Lays out a converted page: hero, one band per H2 block, and a contact band around each form. */
export default function PageSections({ page }: { page: Page }) {
  const h1 = page.html.match(/<h1>([\s\S]*?)<\/h1>/);
  let rest = h1 ? page.html.replace(h1[0], "") : page.html;

  // The paragraph that follows the title opens the page as its lead.
  const leadMatch = rest.match(/^\s*(<p>(?:(?!<\/p>)[\s\S])*<\/p>)/);
  const lead = leadMatch && !/data-|<img/.test(leadMatch[1]) ? leadMatch[1] : "";
  if (lead) rest = rest.replace(leadMatch![0], "");

  const blocks = rest.split(/(?=<h2>)/).filter((b) => b.trim());
  const plain = blocks.length > 6; // long documents (privacy policy) read better as one column
  const related = articles.filter((a) => a.relatedPages.includes(page.slug));
  const forms = page.forms as FormField[][];

  const sections: React.ReactNode[] = [];
  blocks.forEach((block, i) => {
    const form = block.match(FORM);
    if (!form) {
      sections.push(<Blocks key={i} html={block} page={page} />);
      return;
    }
    const before = block.slice(0, form.index);
    const after = block.slice(form.index! + form[0].length);
    const intro = before.match(FORM_INTRO);
    const onlyHeading = /^\s*<h2>[\s\S]*<\/h2>\s*$/.test(before);
    const body = onlyHeading ? "" : intro ? before.slice(0, intro.index) : before;
    const side = onlyHeading ? before : intro ? intro[1] : "";
    if (body.trim()) sections.push(<Blocks key={`${i}-body`} html={body} page={page} />);
    sections.push(
      <div key={`${i}-form`} className="form-band" data-band="form">
        <div className="form-band-side prose" dangerouslySetInnerHTML={{ __html: side }} />
        <div className="form-card">
          <LeadForm fields={forms[Number(form[1])]} page={page.slug} />
        </div>
      </div>,
    );
    if (after.trim()) sections.push(<Blocks key={`${i}-after`} html={after} page={page} />);
  });

  return (
    <main id="main" className={plain ? "inner inner--plain" : "inner"}>
      <PageHero
        trail={[{ name: breadcrumbName(page) }]}
        titleHtml={h1?.[1] ?? breadcrumbName(page)}
        lead={lead ? <div dangerouslySetInnerHTML={{ __html: lead }} /> : undefined}
      />
      {sections.map((s, i) => (
        <section key={i} className="page-section">
          <div className="container-x">{s}</div>
        </section>
      ))}
      {related.length > 0 && (
        <section className="page-section" aria-labelledby="related-articles">
          <div className="container-x">
            <h2 id="related-articles" className="h2 heading-accent">
              עוד בנושא במרכז הידע
            </h2>
            <ul className="card-list">
              {related.map((a) => (
                <li key={a.slug} className="card">
                  <h3 className="h3">
                    <Link href={articlePath(a.slug)}>{a.title}</Link>
                  </h3>
                  <p>{a.description}</p>
                </li>
              ))}
            </ul>
            <p className="section-foot">
              <Link href={KNOWLEDGE} className="link-arrow">
                לכל המאמרים, השאלות והמונחים
              </Link>
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
