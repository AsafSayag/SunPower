import type { Metadata } from "next";
import Script from "next/script";
import { INDEXABLE } from "@/lib/indexing";
import { Assistant, Heebo } from "next/font/google";
import AnalyticsEvents from "@/components/AnalyticsEvents";
import CookieNotice from "@/components/CookieNotice";
import HeaderState from "@/components/HeaderState";
import Motion from "@/components/Motion";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import WhatsAppButton from "@/components/WhatsAppButton";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const display = Heebo({ variable: "--font-display", subsets: ["hebrew", "latin"], weight: ["700", "800"], display: "swap" });
const body = Assistant({ variable: "--font-body", subsets: ["hebrew", "latin"], weight: ["400", "600", "700"], display: "swap" });

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
    <html lang="he-IL" dir="rtl" className={`${display.variable} ${body.variable}`}>
      <body>
        {/* The backdrop of every light section: a pale sky, faint panel lines and slow drifting light. */}
        <div className="page-aura" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <a href="#main" className="skip-link">
          דילוג לתוכן
        </a>
        <SiteHeader />
        <HeaderState />
        <Motion />
        {children}
        <SiteFooter />
        <WhatsAppButton />
        <AnalyticsEvents />
        {/* Set NEXT_PUBLIC_GA_ID only on the live site, so test visits do not reach the business's data.
            Analytics loads only after the visitor agrees in the cookie notice. */}
        <CookieNotice gaId={process.env.NEXT_PUBLIC_GA_ID} />
      </body>
      {/* Accessibility widget the old site loads (Enable). The license is tied to the live domain. */}
      {INDEXABLE && (
        <Script
          src="https://cdn.enable.co.il/licenses/enable-L10876f6qx0ap7z8-0222-27146/init.js"
          strategy="lazyOnload"
        />
      )}
    </html>
  );
}
