import { terms } from "@/content/knowledge";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import { absolute, breadcrumbLd, GLOSSARY, graph, KNOWLEDGE, termPath } from "@/lib/knowledge";
import { knowledgeMetadata } from "@/lib/knowledgeMeta";

const TITLE = "מילון מונחים: מערכות סולאריות בשפה פשוטה";
const DESCRIPTION =
  "מילון מונחים למערכות סולאריות: ממיר, סטרינג, יחס ביצועים, נקודה חמה, תרמוגרפיה, תחזוקה מונעת ועוד, עם הסבר קצר וברור לכל מונח.";

export const metadata = knowledgeMetadata({ title: TITLE, description: DESCRIPTION, path: GLOSSARY });

export default function GlossaryPage() {
  const sorted = [...terms].sort((a, b) => a.term.localeCompare(b.term, "he"));
  const ld = graph(
    {
      "@type": "DefinedTermSet",
      "@id": `${absolute(GLOSSARY)}#terms`,
      name: TITLE,
      inLanguage: "he-IL",
      hasDefinedTerm: sorted.map((t) => ({
        "@type": "DefinedTerm",
        "@id": absolute(termPath(t.id)),
        name: t.term,
        ...(t.alias ? { alternateName: t.alias.split(", ") } : {}),
        description: t.definition,
        inDefinedTermSet: `${absolute(GLOSSARY)}#terms`,
      })),
    },
    breadcrumbLd([
      { name: "מרכז הידע", path: KNOWLEDGE },
      { name: "מילון מונחים", path: GLOSSARY },
    ]),
  );

  return (
    <main id="main" className="inner knowledge">
      <JsonLd data={ld} />
      <PageHero
        trail={[{ name: "מרכז הידע", path: KNOWLEDGE }, { name: "מילון מונחים" }]}
        title="מילון מונחים"
        lead={<p>המונחים המקצועיים שחוזרים בכל שיחה על מערכות סולאריות, עם הסבר קצר לכל אחד.</p>}
      />
      <section className="page-section">
        <div className="container-x">
      <dl className="glossary">
        {sorted.map((t) => (
          <div key={t.id} id={t.id} className="card">
            <dt>
              {t.term}
              {t.alias && <span className="alias"> ({t.alias})</span>}
            </dt>
            <dd>{t.definition}</dd>
          </div>
        ))}
      </dl>
        </div>
      </section>
    </main>
  );
}
