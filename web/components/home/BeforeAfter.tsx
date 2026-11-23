"use client";

import { useEffect, useRef, useState } from "react";
import Picture from "@/components/Picture";
import type { Img } from "@/lib/site";

/** Comparison slider: the dirty panel underneath, the washed one revealed from the right.
    With `heading` it is the featured comparison: the picture stays in place while the visitor
    scrolls, the scroll washes the panel, and the page moves on once it is fully clean.
    Dragging the line takes over from the scroll. */
export default function BeforeAfter({ before, after, heading }: { before: Img; after: Img; heading?: string }) {
  const featured = Boolean(heading);
  const [pos, setPos] = useState(featured ? 96 : 50);
  const pin = useRef<HTMLDivElement>(null);
  const manual = useRef(false);
  const sizes = featured ? "(max-width: 64rem) 100vw, 960px" : "(max-width: 48rem) 100vw, 50vw";

  useEffect(() => {
    const el = pin.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.dataset.pin = "true";
    let frame = 0;
    const update = () => {
      frame = 0;
      if (manual.current) return;
      const rect = el.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      if (travel <= 0) return;
      // Clean a little before the picture is released, so the finished result holds for a moment.
      const t = Math.min(1, Math.max(0, -rect.top / (travel * 0.88)));
      setPos(Math.round(96 * (1 - t)));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
      delete el.dataset.pin;
    };
  }, []);

  const slider = (
    <div className={featured ? "ba ba--feature" : "ba"} style={{ "--pos": `${pos}%` } as React.CSSProperties}>
      <Picture image={featured ? sharp(before) : before} sizes={sizes} />
      <Picture image={featured ? sharp(after) : after} sizes={sizes} className="ba-after" />
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
        onChange={(e) => {
          manual.current = true;
          setPos(Number(e.target.value));
        }}
      />
    </div>
  );

  if (!featured) return slider;
  return (
    <div ref={pin} className="ba-pin">
      <div className="ba-stage">
        <div className="container-x">
          <div className="section-head section-head--center">
            <h2 className="h2 heading-accent heading-accent--center">{heading}</h2>
          </div>
          {slider}
        </div>
      </div>
    </div>
  );
}

/* The featured picture is shown large, where the recompressed copies look soft. Small screens keep
   the light copies; anything wider gets the original file, untouched. */
function sharp(image: Img): Img {
  if (!image.srcset) return image;
  const small = image.srcset.split(", ").filter((entry) => Number(entry.match(/ (\d+)w$/)?.[1]) <= 640);
  return { ...image, srcset: [...small, `${image.src} ${image.width}w`].join(", ") };
}
