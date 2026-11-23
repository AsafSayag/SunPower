import Link from "next/link";
import HeroField from "@/components/HeroField";
import Picture from "@/components/Picture";
import { footerGroups, footerLegal, home, logo } from "@/lib/site";

const isInternal = (href: string) => href.startsWith("/");
const isNumber = (text: string) => /^[\d\s-]+/.test(text);

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <HeroField />
      <div className="container-x">
        <div className="footer-grid">
          <div className="footer-brand">
            <Picture image={{ ...logo, alt: "לוגו סאן פאוור" }} sizes="160px" />
            {home && <p>{home.tagline}</p>}
          </div>
          {footerGroups.map((group) => (
            <div key={group.title}>
              <p className="footer-title">{group.title}</p>
              <ul>
                {group.links.map((l) => (
                  <li key={l.href + l.text}>
                    {isInternal(l.href) ? (
                      <Link href={l.href}>{l.text}</Link>
                    ) : (
                      <a href={l.href} {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                        {isNumber(l.text) ? <bdi>{l.text}</bdi> : l.text}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© SunPower</span>
          {footerLegal.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.text}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
