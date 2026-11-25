import Breadcrumbs from "@/components/Breadcrumbs";
import HeroField from "@/components/HeroField";

/** A field photo behind the hero. `name` is a file pair in /public/media: <name>-960.webp and <name>-1920.webp. */
export type HeroImage = { name: string; alt: string; focus?: string };
export type HeroFigure = { value: string; label: string; suffix?: string; unit?: string };

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
  image?: HeroImage;
  /** The company's figures, counted up when the hero opens. */
  figures?: HeroFigure[];
};

/** Opening band of every inner page: breadcrumb, the page's single H1 and an optional lead.
    With `image` the band opens on a photo from the field; without it, on the drawn field of panels. */
export default function PageHero({ trail, title, titleHtml, lead, meta, statementHtml, actions, aside, image, figures }: Props) {
  const cls = ["page-hero", aside && "page-hero--split", image && "page-hero--photo"].filter(Boolean).join(" ");
  return (
    <header className={cls}>
      {image ? (
        <div className="page-hero-media" data-parallax="hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/media/${image.name}-1920.webp`}
            srcSet={`/media/${image.name}-960.webp 960w, /media/${image.name}-1920.webp 1920w`}
            sizes="100vw"
            alt={image.alt}
            width={1920}
            height={1080}
            fetchPriority="high"
            decoding="async"
            style={image.focus ? { objectPosition: image.focus } : undefined}
          />
        </div>
      ) : (
        <HeroField />
      )}
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
        {figures && (
          <ul className="page-hero-figures reveal-immediate">
            {figures.map((f) => (
              <li key={f.label}>
                <span className="fig-value">
                  <span data-countup={f.value}>{f.value}</span>
                  {f.suffix}
                  {f.unit && <small>{f.unit}</small>}
                </span>
                <span className="fig-label">{f.label}</span>
              </li>
            ))}
          </ul>
        )}
        </div>
        {aside && <div className="page-hero-aside reveal-immediate">{aside}</div>}
      </div>
    </header>
  );
}
