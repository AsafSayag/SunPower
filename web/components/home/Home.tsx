import Link from "next/link";
import CoverageMap from "@/components/CoverageMap";
import LeadForm from "@/components/LeadForm";
import Picture from "@/components/Picture";
import BeforeAfter from "@/components/home/BeforeAfter";
import HeroVideo from "@/components/home/HeroVideo";
import SafetyFilm from "@/components/home/SafetyFilm";
import SolarPanel3d from "@/components/home/SolarPanel3d";
import WhySchematic from "@/components/home/WhySchematic";
import type { FormField } from "@/lib/forms";
import { footerGroups, headerContact, home as data, type Img } from "@/lib/site";

// The three commitments named in the safety sentence of the old site, each with its sign.
const SAFETY_POINTS = [
  { label: "צוות בטיחות פנימי", icon: "M12 3l7 3v5c0 4.5-2.9 8.3-7 10-4.1-1.7-7-5.5-7-10V6l7-3z M9 11.5l2.2 2.2L15.2 9.7" },
  { label: "תיעוד מתמיד", icon: "M9 4h6l1 2h3v14H5V6h3l1-2z M9 12l2 2 4-4 M9 17h6" },
  { label: "נהלי עבודה בגובה", icon: "M5 15.5a7 7 0 0 1 14 0 M3 15.5h18v2.5H3z M10 8.8V6.5h4v2.3" },
];

export default function Home({ fields }: { fields: FormField[] }) {
  const home = data!;
  const wa = headerContact.find((l) => l.href.includes("wa.me"));
  const contactLinks = footerGroups[0]?.links.filter((l) => /^(tel:|mailto:)/.test(l.href)) ?? [];
  const aboutPhoto = home.gallery[2].after as Img;

  return (
    <main id="main">
      <HeroVideo />
      <section className="hero" id="intro">
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
          <div className="hero-panel">
            <SolarPanel3d stats={home.stats} />
          </div>
        </div>
      </section>

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

      <section className="safety-film" aria-labelledby="safety-title">
        <SafetyFilm />
        <div className="container-x">
          <div className="safety-body">
            <h2 id="safety-title" className="h2 heading-accent reveal">
              {home.safety.title}
            </h2>
            <p className="reveal">{home.safety.text}</p>
            <ul className="safety-points">
              {SAFETY_POINTS.map((p) => (
                <li key={p.label} className="reveal">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d={p.icon} />
                  </svg>
                  {p.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <WhySchematic title={home.why.title} items={home.why.items} />

      <section className="section ba-section">
        <BeforeAfter before={home.gallery[0].before as Img} after={home.gallery[0].after as Img} heading="איך נראית עבודה יסודית" />
        <div className="container-x">
          <div className="ba-grid">
            {home.gallery.slice(1).map((pair, i) => (
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

      <section className="section surface-navy">
        <div className="container-x">
          <CoverageMap />
        </div>
      </section>

      <section className="section" id="contact">
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
