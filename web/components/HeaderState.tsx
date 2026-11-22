"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/* Marks the header once the visitor scrolls, so it turns from part of the background into a
   floating pill (same behaviour as the BTL Studio site). One passive listener, one write per frame. */
export default function HeaderState() {
  const pathname = usePathname();
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!header) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      header.dataset.scrolled = window.scrollY > 24 ? "true" : "false";
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);
  return null;
}
