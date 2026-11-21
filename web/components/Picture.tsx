import type { Img } from "@/lib/site";

/* Plain <img> on purpose: the source sets were prepared at conversion time and the
   original upload path stays in `src`, so image URLs match the old site. */
export default function Picture({ image, sizes, eager = false, className }: { image: Img; sizes: string; eager?: boolean; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.src}
      srcSet={image.srcset || undefined}
      sizes={image.srcset ? sizes : undefined}
      alt={image.alt}
      width={image.width}
      height={image.height}
      className={className}
      decoding="async"
      {...(eager ? { fetchPriority: "high" as const } : { loading: "lazy" as const })}
    />
  );
}
