import { questions } from "@/content/knowledge";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import RichText from "@/components/RichText";
import { breadcrumbLd, graph, KNOWLEDGE, QUESTIONS, stripLinks } from "@/lib/knowledge";
import { knowledgeMetadata } from "@/lib/knowledgeMeta";

const TITLE = "שאלות ותשובות על שטיפה ותחזוקה של מערכות סולאריות";
const DESCRIPTION =
  "תשובות קצרות לשאלות שבעלי מערכות סולאריות שואלים הכי הרבה: תדירות שטיפה, אובדן תפוקה, אחריות יצרן, תחזוקה והשכרת גג.";

export const metadata = knowledgeMetadata({ title: TITLE, description: DESCRIPTION, path: QUESTIONS });

export default function QuestionsPage() {
  const ld = graph(
    {
      "@type": "FAQPage",
      mainEntity: questions.map((q) => ({
        "@type": "Question",
        name: q.question,
        acceptedAnswer: { "@type": "Answer", text: q.answer.map(stripLinks).join(" ") },
      })),
    },
    breadcrumbLd([
      { name: "מרכז הידע", path: KNOWLEDGE },
      { name: "שאלות ותשובות", path: QUESTIONS },
    ]),
  );

  return (
    <main className="content knowledge" id="main">
      <JsonLd data={ld} />
      <Breadcrumbs trail={[{ name: "מרכז הידע", path: KNOWLEDGE }, { name: "שאלות ותשובות" }]} />
      <h1>שאלות ותשובות</h1>
      <p className="lead">תשובות קצרות לשאלות שאנחנו שומעים הכי הרבה מבעלי נכסים וממנהלי מערכות.</p>
      {questions.map((q) => (
        <section key={q.id} id={q.id} className="qa">
          <h2>{q.question}</h2>
          {q.answer.map((p, i) => (
            <p key={i}>
              <RichText text={p} />
            </p>
          ))}
        </section>
      ))}
    </main>
  );
}
