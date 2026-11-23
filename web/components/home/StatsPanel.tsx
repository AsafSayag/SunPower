"use client";

import { useEffect, useRef, useState } from "react";

type Stat = { label: string; value: string; suffix?: string; unit?: string };

const nf = new Intl.NumberFormat("en-US");
const DURATION = 1600;

/* The four figures as one monitoring screen. The server renders the final numbers, so they are
   in the page without JavaScript; once the panel scrolls into view they count up from zero and
   the production curve under them is drawn. */
export default function StatsPanel({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(1);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    let frame = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        setLive(true);
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / DURATION);
          setProgress(1 - Math.pow(1 - t, 3));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className="monitor" data-live={live}>
      <div className="monitor-bar" aria-hidden="true">
        <i />
        <i />
        <i />
        <span className="monitor-led" />
      </div>
      <dl className="stats">
        {stats.map((s) => (
          <div key={s.label} className="stat">
            <dt className="stat-label">{s.label}</dt>
            <dd className="stat-value">
              {s.unit && <span className="stat-unit">{s.unit}</span>}
              <span>
                {nf.format(Math.round(Number(s.value) * progress))}
                {s.suffix}
              </span>
            </dd>
          </div>
        ))}
      </dl>
      <svg className="monitor-curve" viewBox="0 0 1200 80" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="monitor-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="monitor-area" d="M0 76 C220 76 320 70 430 42 C520 18 560 8 600 8 C640 8 680 18 770 42 C880 70 980 76 1200 76 V80 H0 Z" fill="url(#monitor-fill)" />
        <path className="monitor-line" pathLength={1} d="M0 76 C220 76 320 70 430 42 C520 18 560 8 600 8 C640 8 680 18 770 42 C880 70 980 76 1200 76" fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
