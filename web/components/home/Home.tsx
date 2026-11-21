import Link from "next/link";
import CoverageMap from "@/components/CoverageMap";
import LeadForm from "@/components/LeadForm";
import Picture from "@/components/Picture";
import BeforeAfter from "@/components/home/BeforeAfter";
import type { FormField } from "@/lib/forms";
import { footerGroups, headerContact, home as data, type Img } from "@/lib/site";

const nf = new Intl.NumberFormat("en-US");
const HERO_CELLS = [
  { col: 2, row: 1, delay: "0s" },
  { col: 3, row: 2, delay: "1.4s" },
  { col: 4, row: 3, delay: "2.8s" },
  { col: 1, row: 2, delay: "4.2s" },
  { col: 2, row: 3, delay: "5.6s" },
];

export default function Home({ fields }: { fields: FormField[] }) {
  const home = data!;
  const wa = headerContact.find((l) => l.href.includes("wa.me"));
  const contactLinks = footerGroups[0]?.links.filter((l) => /^(tel:|mailto:)/.test(l.href)) ?? [];
  const heroPhoto = home.gallery[0].after as Img;
  const aboutPhoto = home.gallery[2].after as Img;

  return (
    <main id="main">
      <section className="hero cell-grid">
        <div className="container-x hero-grid">
          <div>
            <h1 className="h1 reveal-immediate">{home.h1}</h1>
            <p className="hero-tagline reveal-immediate">{home.tagline}</p>
            <div className="hero-cta reveal-immediate">
              <a href="#contact" className="btn btn--primary">
                לשיחת ייעוץ ללא תשלום
              </a>
              {wa && (
                <a href={wa.href} className="btn" target="_blank" rel="noopener noreferrer">
                  {wa.text}
                </a>
              )}
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-photo">
              <Picture image={heroPhoto} sizes="(max-width: 62rem) 100vw, 50vw" eager />
              <div className="hero-cells" aria-hidden="true">
                {HERO_CELLS.map((c, i) => (
                  <i key={i} style={{ gridColumn: c.col, gridRow: c.row, animationDelay: c.delay }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-x stats-wrap">
        <dl className="stats">
          {home.stats.map((s) => (
            <div key={s.label} className="stat">
              <dt className="stat-label">{s.label}</dt>
              <dd className="stat-value">
                {"unit" in s && s.unit && <span className="stat-unit">{s.unit}</span>}
                <span>
                  {nf.format(Number(s.value))}
                  {s.suffix}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <section className="section">
        <div className="container-x about-grid">
          <div className="about-text reveal">
            <div className="section-head">
              <h2 className="h2 heading-accent">{home.about.title}</h2>
            </div>
            {home.about.paragraphs.map((p, i) => (
              <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
            ))}
            <Link href={home.about.cta.href} className="link-arrow">
              {home.about.cta.text}
            </Link>
          </div>
          <div className="about-photo reveal">
            <Picture image={aboutPhoto} sizes="(max-width: 62rem) 100vw, 45vw" />
          </div>
        </div>
      </section>

      <section className="section surface-navy cell-grid safety">
        <div className="container-x reveal">
          <h2 className="h2 heading-accent heading-accent--center">{home.safety.title}</h2>
          <p>{home.safety.text}</p>
        </div>
      </section>

      <section className="section surface-ice cell-grid">
        <div className="container-x">
          <div className="section-head section-head--center reveal">
            <h2 className="h2 heading-accent heading-accent--center">{home.why.title}</h2>
          </div>
          <div className="why-grid">
            {home.why.items.map((item) => (
              <article key={item.title} className="card reveal">
                <div className="why-icon">
                  <Picture image={item.image as Img} sizes="88px" />
                </div>
                <h3 className="h3">{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <div className="ba-grid">
            {home.gallery.map((pair, i) => (
              <div key={i} className="reveal">
                <BeforeAfter before={pair.before as Img} after={pair.after as Img} />
              </div>
            ))}
          </div>
          <p className="section-foot">
            <Link href={home.why.cta.href} className="btn">
              {home.why.cta.text}
            </Link>
          </p>
        </div>
      </section>

      <section className="section surface-ice">
        <div className="container-x">
          <div className="section-head section-head--center reveal">
            <h2 className="h2 heading-accent heading-accent--center">{home.clients.title}</h2>
          </div>
          <ul className="logos reveal">
            {home.clients.logos.map((l) => (
              <li key={l.src}>
                <Picture image={l as Img} sizes="160px" />
              </li>
            ))}
          </ul>
          <div className="quotes">
            {home.clients.testimonials.map((t) => (
              <figure key={t.name} className="card quote reveal">
                <blockquote>{t.quote}</blockquote>
                <figcaption>
                  <Picture image={{ ...(t.image as Img), alt: "" }} sizes="52px" />
                  <div>
                    <div className="quote-name">{t.name}</div>
                    <div className="quote-role">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section surface-navy cell-grid">
        <div className="container-x">
          <CoverageMap />
        </div>
      </section>

      <section className="section cell-grid" id="contact">
        <div className="container-x contact-grid">
          <div className="contact-side reveal">
            <h2 className="h2 heading-accent">{home.contact.title}</h2>
            <ul>
              {contactLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href}>
                    <bdi>{l.text}</bdi>
                  </a>
                </li>
              ))}
            </ul>
            <Link href={home.contact.calc.href} className="link-arrow">
              {home.contact.calc.text}
            </Link>
          </div>
          <div className="form-card reveal">
            <LeadForm fields={fields} page="דף הבית" />
          </div>
        </div>
      </section>
    </main>
  );
}
