import Link from "next/link";

export default function NotFound() {
  return (
    <main className="content">
      <h1>העמוד לא נמצא</h1>
      <p><Link href="/">חזרה לדף הבית</Link></p>
    </main>
  );
}
