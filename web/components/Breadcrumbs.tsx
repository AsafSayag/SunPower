import Link from "next/link";

export default function Breadcrumbs({ trail }: { trail: { name: string; path?: string }[] }) {
  return (
    <nav aria-label="פירורי לחם" className="breadcrumbs">
      <ol>
        <li>
          <Link href="/">דף הבית</Link>
        </li>
        {trail.map((t, i) =>
          t.path ? (
            <li key={i}>
              <Link href={t.path}>{t.name}</Link>
            </li>
          ) : (
            <li key={i} aria-current="page">
              {t.name}
            </li>
          ),
        )}
      </ol>
    </nav>
  );
}
