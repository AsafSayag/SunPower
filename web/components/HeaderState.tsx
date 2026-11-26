"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/* Marks the header once the visitor scrolls, so it turns from part of the background into a
   floating pill (same behaviour as the BTL Studio site). One passive listener, one write per frame.
   Also closes the mobile menu (the #nav-toggle checkbox): the header stays mounted across
   client-side navigation, so without this the menu would stay open on the new page. */
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
    const toggle = header.querySelector<HTMLInputElement>("#nav-toggle");
    const closeMenu = () => {
      if (toggle) toggle.checked = false;
    };
    // A tap on any header link closes the menu, including a link to the page already open.
    // On desktop the services dropdown opens on hover and focus, so after a pick it would stay
    // open under the pointer: drop focus and hold it closed until the pointer leaves the item.
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest("a");
      if (!link) return;
      closeMenu();
      const sub = link.closest<HTMLElement>(".has-sub");
      if (sub) {
        link.blur();
        sub.dataset.closed = "";
        sub.addEventListener("mouseleave", () => delete sub.dataset.closed, { once: true });
      }
    };
    closeMenu(); // covers back/forward navigation while the menu was open
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    header.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("scroll", schedule);
      header.removeEventListener("click", onClick);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);
  return null;
}
