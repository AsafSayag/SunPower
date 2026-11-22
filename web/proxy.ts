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
  "required": "דרושים1",
  "office-manager": "מנהלת-משרד1",
  "team": "צוות-שטיפת-מערכות-סולאריות1", // best guess: the washing-team job page
  "privacy-policy": "מדיניות-פרטיות1",
  "accessibility": "הצהרת-נגישות1",
  // Empty WordPress archive of the old site; articles now live in the knowledge center.
  "category/מאמרים": "knowledge",
};

// WordPress page ids, for old links of the form /?p=22 or /?page_id=22.
const PAGE_IDS: Record<string, string> = {
  "22": "שטיפת-מערכות-סולאריות",
  "26": "מערכת-שטיפה-אוטומטית",
  "1950": "",
  "2548": "אודות-החברה-1",
  "2751": "צרו-קשר-1",
  "3250": "תחזוקה-כוללת1",
  "3265": "דרושים1",
  "3330": "פרויקטים-נבחרים1",
  "3552": "הצהרת-נגישות1",
  "3554": "מדיניות-פרטיות1",
  "3556": "מנהלת-משרד1",
  "3562": "יזמות-משותפת1",
  "3781": "צוות-שטיפת-מערכות-סולאריות1",
  "4389": "מנטר-מערכות-סולאריות",
};

function pagePath(slug: string) {
  return slug ? `/${encodeURIComponent(slug).replace(/%[0-9A-F]{2}/g, (m) => m.toLowerCase())}/` : "/";
}

export function proxy(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("p") ?? request.nextUrl.searchParams.get("page_id");
  if (id && request.nextUrl.pathname === "/" && id in PAGE_IDS) {
    return NextResponse.redirect(new URL(pagePath(PAGE_IDS[id]), request.url), 301);
  }
  let path = request.nextUrl.pathname;
  try {
    path = decodeURIComponent(path);
  } catch {
    return NextResponse.next();
  }
  const target = OLD_SLUGS[path.replace(/^\/|\/$/g, "")];
  if (!target) return NextResponse.next();
  return NextResponse.redirect(new URL(pagePath(target), request.url), 301);
}

export const config = {
  matcher: "/((?!_next/|wp-content/|video/|share/|.*\\.[a-z0-9]+$).*)",
};
