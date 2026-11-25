import Link from "next/link";
import { articles, questions, terms } from "@/content/knowledge";
import PageHero from "@/components/PageHero";
import Picture from "@/components/Picture";
import CoverageMap from "@/components/CoverageMap";
import JsonLd from "@/components/JsonLd";
import { absolute, articlePath, breadcrumbLd, GLOSSARY, graph, KNOWLEDGE, ORG, QUESTIONS, termPath } from "@/lib/knowledge";
import { knowledgeMetadata } from "@/lib/knowledgeMeta";

const TITLE = "מרכז הידע: שטיפה, תחזוקה וניהול של מערכות סולאריות";
const DESCRIPTION =
  "מאמרים, שאלות ותשובות ומילון מונחים על שטיפה, תחזוקה, ניטור והשכרת גגות למערכות סולאריות, מהניסיון של צוות סאן פאוור בשטח.";

export const metadata = knowledgeMetadata({ title: TITLE, description: DESCRIPTION, path: KNOWLEDGE });

export default function KnowledgeHub() {
  const ld = graph(
    {
      "@type": "CollectionPage",
      "@id": `${absolute(KNOWLEDGE)}#page`,
      name: TITLE,
      description: DESCRIPTION,
      url: absolute(KNOWLEDGE),
      inLanguage: "he-IL",
      publisher: ORG,
      hasPart: articles.map((a) => ({ "@type": "Article", headline: a.title, url: absolute(articlePath(a.slug)) })),
    },
    {
      "@type": "Service",
      name: "ניהול, תחזוקה ושטיפה של מערכות סולאריות",
      provider: ORG,
      areaServed: { "@type": "Country", name: "ישראל" },
    },
    breadcrumbLd([{ name: "מרכז הידע", path: KNOWLEDGE }]),
  );

  return (
    <main id="main" className="inner knowledge">
      <JsonLd data={ld} />
      <PageHero
        trail={[{ name: "מרכז הידע" }]}
        title="מרכז הידע"
        lead={
          <p>
            כל מה שבעלי נכסים ומנהלי מערכות צריכים לדעת על שטיפה, תחזוקה וניהול של מערכות סולאריות, בשפה פשוטה
            ומהניסיון שלנו בשטח.
          </p>
        }
      />

      <section className="page-section" aria-labelledby="hub-articles">
        <div className="container-x">
          <h2 id="hub-articles" className="h2 heading-accent">
            מאמרים
          </h2>
          <ul className="card-list card-list--media">
            {articles.map((a) => (
              <li key={a.slug} className="card reveal">
                <div className="card-media">
                  <Picture
                    image={{ src: a.image, alt: "", width: 1500, height: 1000, srcset: [640, 828, 1200].map((w) => `/_next/image/?url=${encodeURIComponent(a.image)}&w=${w}&q=75 ${w}w`).join(", ") }}
                    sizes="(max-width: 48rem) 100vw, 33vw"
                  />
                </div>
                <h3 className="h3">
                  <Link href={articlePath(a.slug)}>{a.title}</Link>
                </h3>
                <p>{a.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="page-section" aria-labelledby="hub-questions">
        <div className="container-x">
        <h2 id="hub-questions" className="h2 heading-accent">
          שאלות ותשובות
        </h2>
        <ul className="question-list">
          {questions.map((q) => (
            <li key={q.id}>
              <Link href={`${QUESTIONS}#${q.id}`}>{q.question}</Link>
            </li>
          ))}
        </ul>
        <p className="section-foot">
          <Link href={QUESTIONS} className="link-arrow">
            לכל השאלות והתשובות
          </Link>
        </p>
        </div>
      </section>

      <section className="page-section" aria-labelledby="hub-glossary">
        <div className="container-x">
        <h2 id="hub-glossary" className="h2 heading-accent">
          מילון מונחים
        </h2>
        <p className="section-intro">הסברים קצרים למונחים המקצועיים שחוזרים בכל שיחה על מערכות סולאריות.</p>
        <ul className="term-chips">
          {terms.map((t) => (
            <li key={t.id}>
              <Link href={termPath(t.id)}>{t.term}</Link>
            </li>
          ))}
        </ul>
        <p className="section-foot">
          <Link href={GLOSSARY} className="link-arrow">
            למילון המלא
          </Link>
        </p>
        </div>
      </section>

      <section className="section surface-navy">
        <div className="container-x">
          <CoverageMap />
        </div>
      </section>
    </main>
  );
}
