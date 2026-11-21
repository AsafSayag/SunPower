import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articles, AUTHOR } from "@/content/knowledge";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import RichText from "@/components/RichText";
import { articleLd, articlePath, breadcrumbLd, getArticle, graph, KNOWLEDGE, pagePath } from "@/lib/knowledge";
import { knowledgeMetadata } from "@/lib/knowledgeMeta";
import { pages } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getArticle((await params).slug);
  if (!article) return {};
  return knowledgeMetadata({
    title: article.title,
    description: article.description,
    path: articlePath(article.slug),
    image: article.image,
    type: "article",
    published: article.published,
    modified: article.updated,
  });
}

const dateFmt = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", year: "numeric" });
const pageName = (slug: string) =>
  pages.find((p) => p.slug === slug)?.title.replace(/ - SunPower$/, "") ?? slug.replace(/-/g, " ");

export default async function ArticlePage({ params }: Props) {
  const article = getArticle((await params).slug);
  if (!article) notFound();
  const others = articles.filter((a) => a.slug !== article.slug).slice(0, 3);
  const wide = article.image.endsWith(".jpg");

  return (
    <main className="content knowledge" id="main">
      <JsonLd
        data={graph(
          articleLd(article),
          breadcrumbLd([
            { name: "מרכז הידע", path: KNOWLEDGE },
            { name: article.title, path: articlePath(article.slug) },
          ]),
        )}
      />
      <Breadcrumbs trail={[{ name: "מרכז הידע", path: KNOWLEDGE }, { name: article.title }]} />
      <article>
        <h1>{article.title}</h1>
        <p className="article-meta">
          {AUTHOR} · עודכן ב־<time dateTime={article.updated}>{dateFmt.format(new Date(article.updated))}</time>
        </p>
        <Image
          src={article.image}
          alt={article.imageAlt}
          width={wide ? 2048 : 1500}
          height={wide ? 1152 : 1000}
          sizes="(max-width: 60rem) 100vw, 60rem"
          priority
        />
        {article.intro.map((p, i) => (
          <p key={i} className="lead">
            <RichText text={p} />
          </p>
        ))}
        {article.sections.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            {s.paragraphs?.map((p, i) => (
              <p key={i}>
                <RichText text={p} />
              </p>
            ))}
            {s.list && (
              <ul>
                {s.list.map((item, i) => (
                  <li key={i}>
                    <RichText text={item} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <section className="takeaway">
          <h2>בשורה התחתונה</h2>
          <p>
            <RichText text={article.takeaway} />
          </p>
        </section>
        {article.sources && (
          <section>
            <h2>מקורות</h2>
            <ul>
              {article.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>

      <aside aria-labelledby="related-services">
        <h2 id="related-services">השירותים שלנו בנושא</h2>
        <ul>
          {article.relatedPages.map((slug) => (
            <li key={slug}>
              <Link href={pagePath(slug)}>{pageName(slug)}</Link>
            </li>
          ))}
          <li>
            <Link href={pagePath("צרו-קשר-1")}>לשיחת ייעוץ ללא תשלום</Link>
          </li>
        </ul>
      </aside>

      <aside aria-labelledby="more-articles">
        <h2 id="more-articles">מאמרים נוספים</h2>
        <ul>
          {others.map((a) => (
            <li key={a.slug}>
              <Link href={articlePath(a.slug)}>{a.title}</Link>
            </li>
          ))}
        </ul>
      </aside>
    </main>
  );
}
