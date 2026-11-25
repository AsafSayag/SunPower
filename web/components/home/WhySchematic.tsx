type Item = { title: string; text: string; image: { alt: string } };

/* Line drawings of the four reasons, on a 48 x 48 grid (pathLength 1, so they can be drawn in). */
const SIGNS: string[][] = [
  // equipment: a panel being washed
  ["M7 9h34v21H7z", "M18.3 9v21M29.7 9v21M7 19.5h34", "M14 41c0-2.2 2.2-4.6 2.2-4.6s2.2 2.4 2.2 4.6a2.2 2.2 0 0 1-4.4 0z", "M21.8 39.5c0-2.2 2.2-4.6 2.2-4.6s2.2 2.4 2.2 4.6a2.2 2.2 0 0 1-4.4 0z", "M29.6 41c0-2.2 2.2-4.6 2.2-4.6s2.2 2.4 2.2 4.6a2.2 2.2 0 0 1-4.4 0z"],
  // service: a place on the map, reaching out to both sides
  ["M24 42S13 31.5 13 22.5a11 11 0 0 1 22 0C35 31.5 24 42 24 42z", "M24 18.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M7.5 13.5a20 20 0 0 0 0 17", "M40.5 13.5a20 20 0 0 1 0 17"],
  // team: a hard hat over shoulders
  ["M10 27a14 14 0 0 1 28 0", "M6.5 27h35v4h-35z", "M24 13V9.5", "M19 14.2V21M29 14.2V21", "M13 42c1.8-4 6-5.5 11-5.5S33.2 38 35 42"],
  // transparency and control: a report on a screen
  ["M7 8.5h34v23H7z", "M24 31.5V40M17 40h14", "M12.5 25.5l7-7 5.5 4 9.5-10", "M34.5 12.5h-5M34.5 12.5v5"],
];
const LAYERS = 5;

/** A reason's sign: its line drawing raised off a small plate, seen from above at an angle. */
function Sign({ paths }: { paths: string[] }) {
  return (
    <div className="sign" aria-hidden="true">
      <div className="chip">
        <span className="chip-shadow" />
        <span className="chip-base" />
        {Array.from({ length: LAYERS }, (_, z) => (
          <svg key={z} viewBox="0 0 48 48" style={{ "--z": z } as React.CSSProperties} data-top={z === LAYERS - 1 || undefined}>
            {paths.map((d) => (
              <path key={d} d={d} pathLength={1} />
            ))}
          </svg>
        ))}
      </div>
    </div>
  );
}

/* The parts of a solar system as an engineer draws them on a single-line diagram, in the order
   the current meets them: the array, the inverter, the protection switch, the meter. */
const PARTS: { tag: string; draw: React.ReactNode }[] = [
  {
    tag: "PV",
    draw: (
      <>
        <rect x="14" y="26" width="52" height="34" />
        <path d="M31.3 26v34M48.7 26v34M14 43h52" />
        <path d="M14 60l12-12M22 14l8 8M30 22v-6M30 22h-6M38 8l8 8M46 16v-6M46 16h-6" />
      </>
    ),
  },
  {
    tag: "INV",
    draw: (
      <>
        <rect x="16" y="16" width="48" height="48" />
        <path d="M16 64L64 16" />
        <path d="M23 27h13M23 33h13" />
        <path d="M43 52c3-7 6-7 9 0s6 7 9 0" transform="translate(-4 2) scale(0.92)" />
      </>
    ),
  },
  {
    tag: "Q",
    draw: (
      <>
        <rect x="12" y="20" width="56" height="40" strokeDasharray="4 4" />
        <path d="M12 40h14M54 40h14" />
        <path d="M26 40l24-13" />
        <circle cx="26" cy="40" r="2.6" />
        <circle cx="54" cy="40" r="2.6" />
        <path d="M40 60v8M33 68h14M36 72h8" />
      </>
    ),
  },
  {
    tag: "kWh",
    draw: (
      <>
        <circle cx="40" cy="40" r="24" />
        <path d="M24 46a16 16 0 0 1 32 0" />
        <path d="M40 46l8-12" />
        <path d="M30 56h20" />
      </>
    ),
  },
];

/* "Why choose us" as a single-line diagram. One wire runs from the sun through the parts of a solar
   system to the grid, drawn the way an engineer draws it. Each of the four reasons is a note
   attached to one part by a leader line. The current is green: it flows along the wire, and each
   part and its note pick up the colour as the pulse passes. All of it is CSS and inline SVG. */
export default function WhySchematic({ title, items }: { title: string; items: Item[] }) {
  return (
    <section className="section sld-section">
      <div className="container-x">
        <div className="section-head reveal">
          <h2 className="h2 heading-accent">{title}</h2>
        </div>
        <div className="sld-sheet reveal">
          <div className="sld">
            <div className="sld-wire" aria-hidden="true">
              <svg className="sld-end sld-end--sun" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="8" />
                <path d="M24 4v7M24 37v7M4 24h7M37 24h7M9.9 9.9l5 5M33.1 33.1l5 5M9.9 38.1l5-5M33.1 14.9l5-5" />
              </svg>
              <i className="sld-pulse" />
              <svg className="sld-end sld-end--grid" viewBox="0 0 48 48">
                <path d="M24 4L14 44M24 4l10 40M17.5 30h13M20 20h8M10 14h28M14 14v4M34 14v4M12 22h24" />
              </svg>
            </div>
            {items.map((item, i) => {
              const part = PARTS[i % PARTS.length];
              return (
                <article key={item.title} className="sld-item" style={{ "--i": i } as React.CSSProperties}>
                  <div className="sld-part" role="img" aria-label={item.image.alt}>
                    <svg viewBox="0 0 80 80" aria-hidden="true">
                      {part.draw}
                    </svg>
                    <span className="sld-tag" aria-hidden="true">
                      {part.tag}
                    </span>
                  </div>
                  <div className="sld-note">
                    <Sign paths={SIGNS[i % SIGNS.length]} />
                    <div>
                      <h3 className="h3">{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="sld-stamp" aria-hidden="true">
            <span>SunPower</span>
            <span>SLD · PV SYSTEM</span>
          </p>
        </div>
      </div>
    </section>
  );
}
