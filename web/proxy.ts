import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Old addresses that must keep redirecting, written in plain Hebrew (no leading/trailing slash).
// Redirect rules in next.config do not match Hebrew paths reliably, so they live here,
// where the path is decoded first and both %D7 and %d7 spellings behave the same.
const OLD_SLUGS: Record<string, string> = {
  "אודות-החברה": "אודות-החברה-1",
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
