"use client";

import { useEffect } from "react";

type Gtag = (command: "event", name: string, params?: Record<string, string>) => void;

/** Sends an event to Google Analytics when it is loaded; does nothing otherwise. */
export function track(name: string, params?: Record<string, string>) {
  const gtag = (window as Window & { gtag?: Gtag }).gtag;
  if (typeof gtag === "function") gtag("event", name, params);
}

/* Contact clicks anywhere on the site: phone, WhatsApp and email links.
   Only the kind of link and the page are sent, never anything the visitor typed. */
export default function AnalyticsEvents() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute("href") ?? "";
      const page = window.location.pathname;
      if (href.startsWith("tel:")) track("phone_click", { page_path: page });
      else if (/wa\.me|api\.whatsapp\.com/.test(href)) track("whatsapp_click", { page_path: page });
      else if (href.startsWith("mailto:")) track("email_click", { page_path: page });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
