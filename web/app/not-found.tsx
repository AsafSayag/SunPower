import Link from "next/link";
import HeroField from "@/components/HeroField";
import { KNOWLEDGE } from "@/lib/knowledge";
import { nav } from "@/lib/site";

export const metadata = { title: { absolute: "העמוד לא נמצא - SunPower" }, robots: "noindex, follow" };

export default function NotFound() {
  const services = nav.find((n) => n.children)?.children ?? [];
  const contact = nav.find((n) => n.text === "צרו קשר");
  return (
    <main id="main" className="inner">
      <section className="page-hero notfound">
        <HeroField />
        <div className="container-x">
          <p className="notfound-code" aria-hidden="true">
            404
          </p>
          <h1 className="h2">העמוד לא נמצא</h1>
          <p>ייתכן שהכתובת השתנתה או שהעמוד הוסר. אפשר להמשיך מכאן:</p>
          <div className="notfound-links">
            <Link href="/" className="btn btn--primary">
              לדף הבית
            </Link>
            {services.map((s) => (
              <Link key={s.href} href={s.href} className="btn">
                {s.text}
              </Link>
            ))}
            <Link href={KNOWLEDGE} className="btn">
              מרכז הידע
            </Link>
            {contact && (
              <Link href={contact.href} className="btn">
                {contact.text}
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
