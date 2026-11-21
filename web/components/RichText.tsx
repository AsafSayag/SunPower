import Link from "next/link";
import { Fragment } from "react";
import { resolveTarget } from "@/lib/knowledge";

/** Renders a text string that may contain [label](target) links. */
export default function RichText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (!m) return <Fragment key={i}>{part}</Fragment>;
        return (
          <Link key={i} href={resolveTarget(m[2])}>
            {m[1]}
          </Link>
        );
      })}
    </>
  );
}
