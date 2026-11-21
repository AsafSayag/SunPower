import Link from "next/link";
import Picture from "@/components/Picture";
import { headerContact, logo, nav } from "@/lib/site";

export default function SiteHeader() {
  const phone = headerContact.find((l) => l.href.startsWith("tel:"));
  const contact = nav.find((n) => n.text === "צרו קשר");
  const items = nav.filter((n) => n !== contact);

  return (
    <header className="site-header">
      <div className="container-x header-row">
        <Link href="/" className="header-logo" aria-label="סאן פאוור, לדף הבית">
          <Picture image={{ ...logo, alt: "" }} sizes="140px" eager />
        </Link>
        <input type="checkbox" id="nav-toggle" className="nav-toggle-input" aria-label="פתיחת התפריט" />
        <label htmlFor="nav-toggle" className="nav-toggle" aria-hidden="true">
          <span />
        </label>
        <nav className="main-nav" aria-label="ניווט ראשי">
          <ul>
            {items.map((item) =>
              item.children ? (
                <li key={item.text} className="has-sub">
                  <button type="button" className="nav-link" aria-haspopup="true">
                    {item.text}
                  </button>
                  <ul className="sub-nav">
                    {item.children.map((c) => (
                      <li key={c.href}>
                        <Link href={c.href}>{c.text}</Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={item.href}>
                  <Link href={item.href} className="nav-link">
                    {item.text}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>
        <div className="header-actions">
          {phone && (
            <a href={phone.href} className="header-phone ltr" aria-label={`טלפון ${phone.text}`}>
              {phone.text}
            </a>
          )}
          {contact && (
            <Link href={contact.href} className="btn btn--primary">
              {contact.text}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
