import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The old WordPress site serves every page with a trailing slash; keep it identical.
  trailingSlash: true,
  // Put the (small) stylesheet inside the HTML so first paint does not wait for a second request.
  experimental: { inlineCss: true },
  images: {
    formats: ["image/avif", "image/webp"],
    // Uploaded media never changes under the same name, so optimized copies can be kept for a year.
    minimumCacheTTL: 31536000,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  poweredByHeader: false,
  async headers() {
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
      // Limits framing, plugins, base tags and form targets without restricting the scripts the site loads.
      { key: "Content-Security-Policy", value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'" },
    ];
    // Test environments must never reach Google. See lib/indexing.ts.
    const noindex = process.env.SITE_INDEXABLE === "true" ? [] : [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [{ source: "/:path*", headers: [...security, ...noindex] }];
  },
  async redirects() {
    return [
      // Same behaviour as the old site (301 there, permanent here).
      { source: "/sitemap.xml", destination: "/sitemap_index.xml", permanent: true },
      { source: "/wp-sitemap.xml", destination: "/sitemap_index.xml", permanent: true },
      // WordPress feeds of the old site; there is no feed on the new one.
      { source: "/feed", destination: "/", permanent: true },
      { source: "/comments/feed", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
