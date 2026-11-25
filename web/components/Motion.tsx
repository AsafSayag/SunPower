"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

/* Motion for the whole site, added on top of pages that are complete without it:
   - blocks rise into place as they scroll into view (anything already on screen is left alone,
     so nothing flashes on load);
   - figures marked data-countup count up once;
   - elements marked data-parallax drift at their own pace;
   - a thin bar under the top edge shows how far a long page has been read;
   - cards get a soft light that follows the pointer;
   - a new page fades in after a click on an internal link.
   Nothing here runs for visitors who asked for less motion. */

// Blocks that rise in without being marked in the markup (the converted pages are plain HTML).
const AUTO = [
  ".reveal",
  ".inner:not(.inner--plain) .page-section .prose > :is(h2, h3, p, ul, ol, a)",
  ".inner:not(.inner--plain) .page-section .container-x > :is(h2, .section-intro, .section-foot)",
  ".feature",
  ".job-card",
  ".media-row > *",
  ".form-band",
  ".calc",
  ".card-list > li",
  ".question-list > *",
  ".glossary > div",
  ".qa",
  ".term-chips",
  ".logos li",
  ".sld-sheet",
  ".coverage > *",
  ".footer-grid > *",
].join(",");
const SPOT = ".card, .feature, .job-card, .quote";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function Motion() {
  const pathname = usePathname();
  const bar = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  // Page change: the new page fades in. Runs before paint, so the page is never seen un-faded.
  useIsoLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const main = document.getElementById("main");
    if (!main || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    main.classList.add("page-enter");
    const done = () => main.classList.remove("page-enter");
    main.addEventListener("animationend", done, { once: true });
    return () => {
      main.removeEventListener("animationend", done);
      done();
    };
  }, [pathname]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const vh = () => window.innerHeight;
    const timers: number[] = [];

    /* ---- Rise into view ---- */
    const settle = (el: HTMLElement) => {
      el.classList.remove("rv", "rv-in");
      el.style.transitionDelay = "";
    };
    const rise = new IntersectionObserver(
      (entries) => {
        const shown = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        shown.forEach((e, i) => {
          const el = e.target as HTMLElement;
          rise.unobserve(el);
          const delay = Math.min(i, 6) * 70;
          el.style.transitionDelay = `${delay}ms`;
          el.classList.add("rv-in");
          // Hand the element back to its own hover transitions once it has arrived.
          timers.push(window.setTimeout(() => settle(el), delay + 950));
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    const waiting: HTMLElement[] = [];
    document.querySelectorAll<HTMLElement>(AUTO).forEach((el) => {
      if (el.closest(".page-hero, .site-header, .hero-film") || el.getBoundingClientRect().top < vh() * 0.92) return;
      el.classList.add("rv");
      waiting.push(el);
      rise.observe(el);
    });

    /* ---- Counting figures ---- */
    const counted = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          counted.unobserve(el);
          const target = Number(el.dataset.countup);
          if (!Number.isFinite(target)) continue;
          const start = performance.now();
          const span = 1500;
          const step = (now: number) => {
            const t = Math.min(1, (now - start) / span);
            el.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 4))));
            if (t < 1) frames.add(requestAnimationFrame(step));
          };
          el.textContent = "0";
          frames.add(requestAnimationFrame(step));
        }
      },
      { threshold: 0.6 },
    );
    const frames = new Set<number>();
    const figures = [...document.querySelectorAll<HTMLElement>("[data-countup]")];
    figures.forEach((el) => counted.observe(el));

    /* ---- Parallax and reading progress: one passive listener, one write per frame ---- */
    const drift = [...document.querySelectorAll<HTMLElement>("[data-parallax], .about-photo img")];
    let frame = 0;
    const update = () => {
      frame = 0;
      const h = vh();
      for (const el of drift) {
        const mode = el.dataset.parallax;
        if (mode === "hero") {
          if (window.scrollY < h * 1.2) el.style.translate = `0 ${Math.round(window.scrollY * 0.28)}px`;
          continue;
        }
        const host = el.parentElement!.getBoundingClientRect();
        if (host.bottom < -100 || host.top > h + 100) continue;
        const p = (host.top + host.height / 2 - h / 2) / h; // -1 above the screen … 1 below it
        el.style.translate = `0 ${(p * Number(mode || 26)).toFixed(1)}px`;
      }
      const el = bar.current;
      if (el) {
        const max = document.documentElement.scrollHeight - h;
        const long = max > h * 1.6;
        el.dataset.on = long ? "true" : "false";
        if (long) el.style.setProperty("--p", Math.min(1, Math.max(0, window.scrollY / max)).toFixed(4));
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    /* ---- A light that follows the pointer over a card ---- */
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const card = (e.target as Element).closest?.<HTMLElement>(SPOT);
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      rise.disconnect();
      counted.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      frames.forEach((f) => cancelAnimationFrame(f));
      if (frame) cancelAnimationFrame(frame);
      waiting.forEach(settle);
      figures.forEach((el) => (el.textContent = el.dataset.countup ?? el.textContent));
      drift.forEach((el) => (el.style.translate = ""));
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("pointermove", onMove);
    };
  }, [pathname]);

  return <div ref={bar} className="scroll-progress" aria-hidden="true" />;
}
