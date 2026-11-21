import Link from "next/link";
import { articles, questions, terms } from "@/content/knowledge";
import Breadcrumbs from "@/components/Breadcrumbs";
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
    <main className="content knowledge" id="main">
      <JsonLd data={ld} />
      <Breadcrumbs trail={[{ name: "מרכז הידע" }]} />
      <h1>מרכז הידע</h1>
      <p className="lead">
        כל מה שבעלי נכסים ומנהלי מערכות צריכים לדעת על שטיפה, תחזוקה וניהול של מערכות סולאריות, בשפה פשוטה ומהניסיון
        שלנו בשטח.
      </p>

      <section aria-labelledby="hub-articles">
        <h2 id="hub-articles">מאמרים</h2>
        <ul className="card-list">
          {articles.map((a) => (
            <li key={a.slug}>
              <h3>
                <Link href={articlePath(a.slug)}>{a.title}</Link>
              </h3>
              <p>{a.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="hub-questions">
        <h2 id="hub-questions">שאלות ותשובות</h2>
        <ul>
          {questions.map((q) => (
            <li key={q.id}>
              <Link href={`${QUESTIONS}#${q.id}`}>{q.question}</Link>
            </li>
          ))}
        </ul>
        <p>
          <Link href={QUESTIONS}>לכל השאלות והתשובות</Link>
        </p>
      </section>

      <section aria-labelledby="hub-glossary">
        <h2 id="hub-glossary">מילון מונחים</h2>
        <p>הסברים קצרים למונחים המקצועיים שחוזרים בכל שיחה על מערכות סולאריות.</p>
        <ul className="term-chips">
          {terms.map((t) => (
            <li key={t.id}>
              <Link href={termPath(t.id)}>{t.term}</Link>
            </li>
          ))}
        </ul>
        <p>
          <Link href={GLOSSARY}>למילון המלא</Link>
        </p>
      </section>

      <div className="coverage-panel cell-grid">
        <CoverageMap />
      </div>
    </main>
  );
}
