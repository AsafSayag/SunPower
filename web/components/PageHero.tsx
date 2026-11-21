import Breadcrumbs from "@/components/Breadcrumbs";

type Props = {
  trail: { name: string; path?: string }[];
  title?: string;
  titleHtml?: string;
  lead?: React.ReactNode;
  meta?: React.ReactNode;
};

/** Opening band of every inner page: breadcrumb, the page's single H1 and an optional lead. */
export default function PageHero({ trail, title, titleHtml, lead, meta }: Props) {
  return (
    <header className="page-hero cell-grid">
      <div className="container-x">
        <Breadcrumbs trail={trail} />
        {titleHtml ? (
          <h1 className="h1 reveal-immediate" dangerouslySetInnerHTML={{ __html: titleHtml }} />
        ) : (
          <h1 className="h1 reveal-immediate">{title}</h1>
        )}
        {meta && <p className="page-hero-meta reveal-immediate">{meta}</p>}
        {lead && <div className="page-hero-lead reveal-immediate">{lead}</div>}
      </div>
    </header>
  );
}
