import Breadcrumbs from "@/components/Breadcrumbs";
import HeroField from "@/components/HeroField";

type Props = {
  trail: { name: string; path?: string }[];
  title?: string;
  titleHtml?: string;
  lead?: React.ReactNode;
  meta?: React.ReactNode;
  /** The page's opening H2, shown under the title (service pages). */
  statementHtml?: string;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
};

/** Opening band of every inner page: breadcrumb, the page's single H1 and an optional lead. */
export default function PageHero({ trail, title, titleHtml, lead, meta, statementHtml, actions, aside }: Props) {
  return (
    <header className={aside ? "page-hero page-hero--split" : "page-hero"}>
      <HeroField />
      <div className="container-x">
        <div className="page-hero-main">
        <Breadcrumbs trail={trail} />
        {titleHtml ? (
          <h1 className="h1 reveal-immediate" dangerouslySetInnerHTML={{ __html: titleHtml }} />
        ) : (
          <h1 className="h1 reveal-immediate">{title}</h1>
        )}
        {meta && <p className="page-hero-meta reveal-immediate">{meta}</p>}
        {lead && <div className="page-hero-lead reveal-immediate">{lead}</div>}
        {statementHtml && <h2 className="page-hero-statement reveal-immediate" dangerouslySetInnerHTML={{ __html: statementHtml }} />}
        {actions && <div className="page-hero-actions reveal-immediate">{actions}</div>}
        </div>
        {aside && <div className="page-hero-aside reveal-immediate">{aside}</div>}
      </div>
    </header>
  );
}
