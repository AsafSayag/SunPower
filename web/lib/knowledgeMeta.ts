import type { Metadata } from "next";
import { absolute, robots } from "@/lib/knowledge";

export function knowledgeMetadata(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  published?: string;
  modified?: string;
}): Metadata {
  const url = absolute(opts.path);
  const image = opts.image ? absolute(opts.image) : "https://sun-power.co.il/share/home.jpg";
  return {
    title: { absolute: `${opts.title} - SunPower` },
    description: opts.description,
    robots,
    alternates: { canonical: url },
    openGraph: {
      type: opts.type ?? "website",
      locale: "he_IL",
      siteName: "SunPower",
      title: opts.title,
      description: opts.description,
      url,
      images: [{ url: image }],
      ...(opts.type === "article" ? { publishedTime: opts.published, modifiedTime: opts.modified } : {}),
    },
    twitter: { card: "summary_large_image", title: opts.title, description: opts.description, images: [image] },
  };
}
