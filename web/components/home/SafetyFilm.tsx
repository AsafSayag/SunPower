"use client";

import { useEffect, useRef, useState } from "react";

/* Backdrop of the safety section: the company's own team at work on a roof, filmed from the air.
   The still paints with the page. The short film (1.8 MB) is fetched only when the section comes
   near the screen, plays only while it is on screen, and never for visitors who asked for less
   motion or data. */
export default function SafetyFilm() {
  const host = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (reduced || saveData) return;
    const near = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setLoad(true);
          near.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    const visible = new IntersectionObserver((entries) => {
      const v = video.current;
      if (!v) return;
      if (entries[0].isIntersecting) v.play().catch(() => {});
      else v.pause();
    });
    near.observe(el);
    visible.observe(el);
    return () => {
      near.disconnect();
      visible.disconnect();
    };
  }, []);

  return (
    <div ref={host} className="safety-media">
      <div className="safety-media-inner" data-parallax="36">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/roof-team-1920.webp"
          srcSet="/media/roof-team-960.webp 960w, /media/roof-team-1920.webp 1920w"
          sizes="100vw"
          alt="צוות סאן פאוור בקסדות ורתמות שוטף פאנלים על גג, צילום אווירי"
          width={1920}
          height={1080}
          loading="lazy"
          decoding="async"
        />
        {load && (
          <video
            ref={video}
            src="/media/safety-team-720.mp4"
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
      </div>
    </div>
  );
}
