import { questions } from "@/content/knowledge";
import PageHero from "@/components/PageHero";
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
    <main id="main" className="inner knowledge">
      <JsonLd data={ld} />
      <PageHero
        trail={[{ name: "מרכז הידע", path: KNOWLEDGE }, { name: "שאלות ותשובות" }]}
        title="שאלות ותשובות"
        lead={<p>תשובות קצרות לשאלות שאנחנו שומעים הכי הרבה מבעלי נכסים וממנהלי מערכות.</p>}
      />
      <section className="page-section">
        <div className="container-x qa-list">
          {questions.map((q) => (
            <section key={q.id} id={q.id} className="qa card reveal">
              <h2 className="h3">{q.question}</h2>
              {q.answer.map((p, i) => (
                <p key={i}>
                  <RichText text={p} />
                </p>
              ))}
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
