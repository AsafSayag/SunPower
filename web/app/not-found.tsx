import Link from "next/link";

export default function NotFound() {
  return (
    <main className="inner" id="main">
      <div className="page-hero cell-grid"><div className="container-x">
      <h1 className="h1">העמוד לא נמצא</h1>
      <p><Link href="/">חזרה לדף הבית</Link></p>
      </div></div>
    </main>
  );
}
