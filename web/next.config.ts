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
  async headers() {
    // Test environments must never reach Google. See lib/indexing.ts.
    if (process.env.SITE_INDEXABLE === "true") return [];
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
  async redirects() {
    return [
      // Same behaviour as the old site (301 there, permanent here).
      { source: "/sitemap.xml", destination: "/sitemap_index.xml", permanent: true },
      { source: "/wp-sitemap.xml", destination: "/sitemap_index.xml", permanent: true },
    ];
  },
};

export default nextConfig;
