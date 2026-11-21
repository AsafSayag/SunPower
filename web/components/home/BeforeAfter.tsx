"use client";

import { useState } from "react";
import Picture from "@/components/Picture";
import type { Img } from "@/lib/site";

/** Comparison slider: the dirty panel underneath, the washed one revealed from the right. */
export default function BeforeAfter({ before, after }: { before: Img; after: Img }) {
  const [pos, setPos] = useState(50);
  const sizes = "(max-width: 48rem) 100vw, 33vw";
  return (
    <div className="ba" style={{ "--pos": `${pos}%` } as React.CSSProperties}>
      <Picture image={before} sizes={sizes} />
      <Picture image={after} sizes={sizes} className="ba-after" />
      <span className="ba-line" aria-hidden="true" />
      <span className="ba-tag ba-tag--before">לפני</span>
      <span className="ba-tag ba-tag--after">אחרי</span>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        dir="ltr"
        aria-label="השוואה בין לפני השטיפה לאחריה"
        onChange={(e) => setPos(Number(e.target.value))}
      />
    </div>
  );
}
