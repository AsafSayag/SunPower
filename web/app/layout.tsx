import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { footerHtml, headerHtml, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
      {/* Set NEXT_PUBLIC_GA_ID only on the live site, so test visits do not reach the business's data. */}
      {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
    </html>
  );
}
