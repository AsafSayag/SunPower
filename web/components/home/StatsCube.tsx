"use client";

import { useEffect, useRef, useState } from "react";

type Stat = { label: string; value: string; suffix?: string; unit?: string };

const nf = new Intl.NumberFormat("en-US");
const HOLD = 3200;

/** Width of a figure in characters, so the longest one still fits its side of the cube. */
function chars(stat: Stat) {
  return (nf.format(Number(stat.value)) + (stat.suffix ?? "")).length + (stat.unit ? 1.4 : 0);
}

function Figure({ stat }: { stat: Stat }) {
  return (
    <>
      {stat.unit && <span className="cube-unit">{stat.unit}</span>}
      <span>
        {nf.format(Number(stat.value))}
        {stat.suffix}
      </span>
    </>
  );
}

/* The company's four figures on the sides of a slowly turning cube of panel glass. The cube stops on
   each side long enough to read it. The same figures are listed beside it as plain text: that list is
   what screen readers and search engines read, and each item turns the cube to its side. */
export default function StatsCube({ stats }: { stats: Stat[] }) {
  const sides = stats.slice(0, 4);
  const n = sides.length;
  const [turn, setTurn] = useState(0);
  const scene = useRef<HTMLDivElement>(null);
  const held = useRef(false);
  const active = ((turn % n) + n) % n;

  useEffect(() => {
    const el = scene.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let visible = !("IntersectionObserver" in window);
    const io = "IntersectionObserver" in window ? new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.3 }) : null;
    io?.observe(el);
    const timer = window.setInterval(() => {
      if (visible && !held.current && !document.hidden) setTurn((t) => t + 1);
    }, HOLD);
    return () => {
      io?.disconnect();
      window.clearInterval(timer);
    };
  }, []);

  const show = (i: number) => setTurn((t) => t + ((i - (((t % n) + n) % n) + n) % n));
  const hold = () => {
    held.current = true;
  };
  const release = () => {
    held.current = false;
  };

  return (
    <section className="cube-band" aria-label="סאן פאוור במספרים">
      <div className="container-x cube-layout" onPointerEnter={hold} onPointerLeave={release} onFocus={hold} onBlur={release}>
        <div ref={scene} className="cube-scene" aria-hidden="true" onClick={() => setTurn((t) => t + 1)}>
          <div className="cube-float">
            <div className="cube" style={{ "--turn": turn } as React.CSSProperties}>
              {sides.map((s, i) => (
                <div key={s.label} className="cube-face" style={{ "--i": i } as React.CSSProperties}>
                  <span className="cube-value" style={{ "--n": chars(s) } as React.CSSProperties}>
                    <Figure stat={s} />
                  </span>
                  <span className="cube-label">{s.label}</span>
                </div>
              ))}
              <div className="cube-face cube-face--top" />
              <div className="cube-face cube-face--bottom" />
            </div>
          </div>
          <span className="cube-shadow" />
        </div>
        <ul className="cube-stats">
          {sides.map((s, i) => (
            <li key={s.label}>
              <button type="button" className="cube-stat" aria-pressed={i === active} onClick={() => show(i)}>
                <span className="cube-stat-value">
                  <Figure stat={s} />
                </span>
                <span className="cube-stat-label">{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
