import BeforeAfter from "@/components/home/BeforeAfter";
import type { Img } from "@/lib/site";

export type GalleryItem = { after: Img; before: Img; caption: string };

/** Comparison sliders with their captions. `as` keeps the caption's original role in the outline. */
export default function Gallery({ items, as: Caption = "p" }: { items: GalleryItem[]; as?: "h3" | "p" }) {
  return (
    <div className="gallery">
      {items.map((item) => (
        <figure key={item.caption} className="gallery-item reveal">
          <BeforeAfter before={item.before} after={item.after} />
          <figcaption>
            <Caption className="gallery-caption">{item.caption}</Caption>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
