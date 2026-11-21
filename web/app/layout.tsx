import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";
import { INDEXABLE } from "@/lib/indexing";
import { footerHtml, headerHtml, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // The existing Search Console property is verified by this tag on the old site.
  // Dropping it would cancel the owner's verification and everyone's access with it.
  verification: { google: "M6MaX4WN-R5du80VSoes1cGDdGSzcgwyIz73se511Xk" },
  icons: {
    icon: [
      { url: "/wp-content/uploads/2022/03/favicon-150x150.png", sizes: "32x32" },
      { url: "/wp-content/uploads/2022/03/favicon-300x300.png", sizes: "192x192" },
    ],
    apple: "/wp-content/uploads/2022/03/favicon-300x300.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he-IL" dir="rtl">
      <body>
        <header className="site-header" dangerouslySetInnerHTML={{ __html: headerHtml }} />
        {children}
        <footer className="site-footer" dangerouslySetInnerHTML={{ __html: footerHtml }} />
      </body>
      {/* Accessibility widget the old site loads (Enable). The license is tied to the live domain. */}
      {INDEXABLE && (
        <Script
          src="https://cdn.enable.co.il/licenses/enable-L10876f6qx0ap7z8-0222-27146/init.js"
          strategy="lazyOnload"
        />
      )}
      {/* Set NEXT_PUBLIC_GA_ID only on the live site, so test visits do not reach the business's data. */}
      {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
    </html>
  );
}
