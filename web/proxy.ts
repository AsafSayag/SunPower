import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Old addresses that must keep redirecting, written in plain Hebrew (no leading/trailing slash).
// Redirect rules in next.config do not match Hebrew paths reliably, so they live here,
// where the path is decoded first and both %D7 and %d7 spellings behave the same.
const OLD_SLUGS: Record<string, string> = {
  // Redirected by the old site as well.
  "אודות-החברה": "אודות-החברה-1",
  "צרו-קשר": "צרו-קשר-1",
  "פרויקטים-נבחרים": "פרויקטים-נבחרים1",
  // Returned 404 on the old site although Search Console still showed searches landing on them
  // (16 months to Nov 2026). Sent to the closest page that exists today.
  "מערכת-שטיפה-אוטומטית": "שטיפת-מערכות-סולאריות",
  "required": "דרושים1",
  "office-manager": "מנהלת-משרד1",
  "team": "צוות-שטיפת-מערכות-סולאריות1", // best guess: the washing-team job page
  "privacy-policy": "מדיניות-פרטיות1",
  "accessibility": "הצהרת-נגישות1",
};

export function proxy(request: NextRequest) {
  let path = request.nextUrl.pathname;
  try {
    path = decodeURIComponent(path);
  } catch {
    return NextResponse.next();
  }
  const target = OLD_SLUGS[path.replace(/^\/|\/$/g, "")];
  if (!target) return NextResponse.next();
  const enc = encodeURIComponent(target).replace(/%[0-9A-F]{2}/g, (m) => m.toLowerCase());
  return NextResponse.redirect(new URL(`/${enc}/`, request.url), 301);
}

export const config = {
  matcher: "/((?!_next/|wp-content/|.*\\.[a-z0-9]+$).*)",
};
