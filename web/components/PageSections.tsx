import Link from "next/link";
import { Fragment } from "react";
import FormJump from "@/components/FormJump";
import Gallery, { type GalleryItem } from "@/components/Gallery";
import LeadForm from "@/components/LeadForm";
import PageHero, { type HeroFigure, type HeroImage } from "@/components/PageHero";
import RoofCalculator from "@/components/RoofCalculator";
import WashCalculator from "@/components/WashCalculator";
import BeforeAfter from "@/components/home/BeforeAfter";
import { articles } from "@/content/knowledge";
import type { FormField } from "@/lib/forms";
import { articlePath, KNOWLEDGE } from "@/lib/knowledge";
import { home, type Img, type Page } from "@/lib/site";

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

// Service pages laid out with the richer modules: opening statement and a comparison in the hero,
// text beside its calculator, key statements as a dark band, and a button that follows to the form.
const SERVICE = new Set(["שטיפת-מערכות-סולאריות"]);
// The photo that opens each page, from the company's own drone footage. Pages not listed here
// (the washing page with its comparison, and the legal documents) keep the drawn field of panels.
const HERO: Record<string, HeroImage> = {
  "אודות-החברה-1": { name: "reservoir-horizon", alt: "מערכת סולארית צפה על מאגר מים, צילום אווירי", focus: "50% 60%" },
  "תחזוקה-כוללת1": { name: "roof-team", alt: "צוות סאן פאוור בקסדות ורתמות עובד על גג סולארי", focus: "40% 35%" },
  "מערכת-שטיפה-אוטומטית": { name: "panels-close", alt: "שורות של פאנלים סולאריים, צילום אווירי מקרוב" },
  "פרויקטים-נבחרים1": { name: "reservoir-wide", alt: "מערכת סולארית צפה על מאגר מים בין שדות, צילום אווירי" },
  "יזמות-משותפת1": { name: "reservoir-grid", alt: "מערכת סולארית צפה רחבת היקף, צילום אווירי" },
  "צרו-קשר-1": { name: "roof-wide", alt: "גג סולארי רחב עם צוות סאן פאוור בעבודה, צילום אווירי", focus: "12% 45%" },
  "דרושים1": { name: "roof-wide", alt: "צוות סאן פאוור בעבודה על גג סולארי, צילום אווירי", focus: "12% 45%" },
  "צוות-שטיפת-מערכות-סולאריות1": { name: "roof-team", alt: "צוות שטיפה של סאן פאוור על גג סולארי", focus: "40% 35%" },
  "מנטר-מערכות-סולאריות": { name: "panels-close", alt: "שורות של פאנלים סולאריים, צילום אווירי מקרוב" },
  "מנהלת-משרד1": { name: "reservoir-horizon", alt: "מערכת סולארית צפה על מאגר מים, צילום אווירי", focus: "50% 60%" },
};
// The about page opens with the company's four figures (the same ones the home page shows).
const FIGURES = new Set(["אודות-החברה-1"]);
const FORM_ID = "lead-form";
const FORM_CTA = "לשיחת ייעוץ ללא תשלום";
const STATEMENT = /^\s*(<h3>[\s\S]*?<\/h3>\s*<p>[\s\S]*?<\/p>)([\s\S]*)$/;

type Band = { node: React.ReactNode; className?: string };

/** Splits one block of a service page into bands. The text and its order stay as converted. */
function serviceBands(html: string, page: Page): Band[] {
  const parts = html.split(MARKER).filter((p) => p.trim());
  const bands: Band[] = [];
  let buffer = "";
  const flush = () => {
    if (buffer.trim()) bands.push({ node: <Blocks html={buffer} page={page} /> });
    buffer = "";
  };
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const next = parts[i + 1] ?? "";
    const marker = part.startsWith("<div data-");
    const statement = marker ? null : part.match(STATEMENT);
    if (!marker && !statement && next.startsWith("<div data-calc=")) {
      flush();
      bands.push({
        node: (
          <div className="split">
            <div className="prose split-text reveal" dangerouslySetInnerHTML={{ __html: part }} />
            <div className="split-side reveal">{next.startsWith('<div data-calc="roof"') ? <RoofCalculator /> : <WashCalculator />}</div>
          </div>
        ),
      });
      i++;
    } else if (statement) {
      flush();
      bands.push({ className: "statement surface-navy", node: <div className="prose reveal" dangerouslySetInnerHTML={{ __html: statement[1] }} /> });
      buffer = statement[2];
    } else {
      buffer += part;
    }
  }
  flush();
  return bands;
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

  // On a service page that opens with a statement (an H2 right after the title), the statement joins the hero.
  const service = SERVICE.has(page.slug);
  const opening = service && !lead ? rest.match(/^\s*<h2>([\s\S]*?)<\/h2>/) : null;
  if (opening) rest = rest.replace(opening[0], "");
  const compare = service ? home?.gallery[1] : undefined;

  const blocks = rest.split(/(?=<h2>)/).filter((b) => b.trim());
  const plain = blocks.length > 6; // long documents (privacy policy) read better as one column
  const related = articles.filter((a) => a.relatedPages.includes(page.slug));
  const forms = page.forms as FormField[][];

  const sections: Band[] = [];
  const add = (key: string, html: string) => {
    if (service) sections.push(...serviceBands(html, page));
    else sections.push({ node: <Blocks key={key} html={html} page={page} /> });
  };
  blocks.forEach((block, i) => {
    const form = block.match(FORM);
    if (!form) {
      add(`${i}`, block);
      return;
    }
    const before = block.slice(0, form.index);
    const after = block.slice(form.index! + form[0].length);
    const intro = before.match(FORM_INTRO);
    const onlyHeading = /^\s*<h2>[\s\S]*<\/h2>\s*$/.test(before);
    const body = onlyHeading ? "" : intro ? before.slice(0, intro.index) : before;
    const side = onlyHeading ? before : intro ? intro[1] : "";
    if (body.trim()) add(`${i}-body`, body);
    sections.push({ node: (
      <div key={`${i}-form`} className="form-band" data-band="form" id={form[1] === "0" ? FORM_ID : undefined}>
        <div className="form-band-side prose" dangerouslySetInnerHTML={{ __html: side }} />
        <div className="form-card">
          <LeadForm fields={forms[Number(form[1])]} page={page.slug} />
        </div>
      </div>
    ) });
    if (after.trim()) add(`${i}-after`, after);
  });

  return (
    <main id="main" className={plain ? "inner inner--plain" : service ? "inner inner--service" : "inner"}>
      <PageHero
        trail={[{ name: breadcrumbName(page) }]}
        titleHtml={h1?.[1] ?? breadcrumbName(page)}
        lead={lead ? <div dangerouslySetInnerHTML={{ __html: lead }} /> : undefined}
        statementHtml={opening?.[1]}
        actions={
          service && forms.length > 0 ? (
            <a href={`#${FORM_ID}`} className="btn btn--primary">
              {FORM_CTA}
            </a>
          ) : undefined
        }
        image={HERO[page.slug]}
        figures={FIGURES.has(page.slug) ? (home?.stats as HeroFigure[] | undefined) : undefined}
        aside={compare ? <BeforeAfter before={compare.before as Img} after={compare.after as Img} /> : undefined}
      />
      {sections.map((s, i) => (
        <section key={i} className={s.className ? `page-section ${s.className}` : "page-section"}>
          <div className="container-x">{s.node}</div>
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
      {service && forms.length > 0 && <FormJump target={FORM_ID} label={FORM_CTA} />}
    </main>
  );
}
