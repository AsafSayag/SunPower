"use client";

import { useEffect, useRef, useState } from "react";

/* Full-screen opening film. The poster is plain HTML and paints at once; the video is added
   only after the page is interactive, and never for visitors who asked for less motion or data. */
export default function HeroVideo() {
  const [src, setSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (reduced || saveData) return;
    const pick = () => setSrc(window.matchMedia("(max-width: 48rem)").matches ? "/video/hero-720.mp4" : "/video/hero-1080.mp4");
    if (document.readyState === "complete") pick();
    else window.addEventListener("load", pick, { once: true });
    return () => window.removeEventListener("load", pick);
  }, []);

  return (
    <section className="hero-film" aria-label="צילומי אוויר של מערכות סולאריות">
      {/* AVIF for current browsers, JPEG for the rest (this Mac's encoder cannot write WebP). */}
      <picture>
        <source
          type="image/avif"
          srcSet="/video/hero-poster-800.avif 800w, /video/hero-poster-1600.avif 1600w"
          sizes="100vw"
        />
        <img
          src="/video/hero-poster-1600.jpg"
          srcSet="/video/hero-poster-800.jpg 800w, /video/hero-poster-1600.jpg 1600w"
          sizes="100vw"
          alt=""
          width={1600}
          height={900}
          fetchPriority="high"
          decoding="async"
        />
      </picture>
      {src && (
        <video
          ref={ref}
          src={src}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          className={playing ? "is-playing" : undefined}
          onPlaying={() => setPlaying(true)}
        />
      )}
      <a href="#intro" className="hero-film-hint" aria-label="המשך לתוכן">
        <span />
      </a>
    </section>
  );
}
