import { projectSites, regions } from "@/content/knowledge";

// The country's outline, clockwise from the north-west corner (lon, lat): the coast down to the
// Gaza border, the Egyptian border to Eilat, up the Arava, the Dead Sea and the Jordan, round the
// Golan and back along the northern border.
const OUTLINE: [number, number][] = [
  [35.1, 33.09], [35.09, 33.0], [35.07, 32.92], [35.08, 32.86], [35.02, 32.82], [34.96, 32.83], [34.95, 32.72],
  [34.92, 32.62], [34.89, 32.5], [34.86, 32.33], [34.8, 32.17], [34.76, 32.06], [34.72, 31.97], [34.66, 31.85],
  [34.6, 31.75], [34.55, 31.67], [34.49, 31.59], [34.4, 31.47], [34.33, 31.35], [34.27, 31.22], [34.33, 31.05],
  [34.39, 30.88], [34.47, 30.65], [34.55, 30.4], [34.64, 30.18], [34.74, 29.95], [34.82, 29.72], [34.9, 29.49],
  [34.96, 29.55], [35.02, 29.75], [35.07, 30.0], [35.15, 30.3], [35.18, 30.55], [35.3, 30.8], [35.4, 30.95],
  [35.42, 31.1], [35.45, 31.25], [35.48, 31.5], [35.52, 31.76], [35.55, 32.0], [35.56, 32.2], [35.57, 32.4],
  [35.58, 32.55], [35.62, 32.68], [35.78, 32.74], [35.9, 32.85], [35.87, 32.98], [35.84, 33.12], [35.82, 33.28],
  [35.74, 33.33], [35.63, 33.25], [35.58, 33.28], [35.54, 33.24], [35.52, 33.1], [35.42, 33.09], [35.3, 33.1],
];
// The Dead Sea, drawn whole and then clipped to the land, so only the near shore shows.
const DEAD_SEA: [number, number][] = [
  [35.5, 31.77], [35.58, 31.62], [35.57, 31.45], [35.52, 31.33], [35.49, 31.2], [35.44, 31.06], [35.39, 31.1],
  [35.41, 31.3], [35.43, 31.5], [35.45, 31.68],
];
const KINNERET = { lon: 35.59, lat: 32.82 };
const OFFICE = { lon: 34.79, lat: 31.96 }; // Rishon LeZion: the routes on the map start here

const SCALE = 150;
const LABELS = 176; // room on the sea side for region names
const x = (lon: number) => LABELS + (lon - 34.2) * 0.853 * SCALE;
const y = (lat: number) => 18 + (33.35 - lat) * SCALE;
const W = Math.ceil(x(35.95)) + 14;
const H = Math.ceil(y(29.45)) + 22;

/** A closed, softly rounded path through the given points. */
function smooth(points: [number, number][]) {
  const p = points.map(([lon, lat]) => [x(lon), y(lat)]);
  const mid = (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const f = (n: number) => n.toFixed(1);
  const start = mid(p[p.length - 1], p[0]);
  let d = `M${f(start[0])} ${f(start[1])}`;
  p.forEach((pt, i) => {
    const m = mid(pt, p[(i + 1) % p.length]);
    d += `Q${f(pt[0])} ${f(pt[1])} ${f(m[0])} ${f(m[1])}`;
  });
  return d + "Z";
}

/** A bowed line from the office to a region, like a route drawn on a map. */
function route(lon: number, lat: number) {
  const [x1, y1, x2, y2] = [x(OFFICE.lon), y(OFFICE.lat), x(lon), y(lat)];
  const bow = Math.hypot(x2 - x1, y2 - y1) * 0.22;
  const nx = -(y2 - y1);
  const ny = x2 - x1;
  const len = Math.hypot(nx, ny) || 1;
  const side = y2 < y1 ? -1 : 1; // bow toward the sea on the way north, inland on the way south
  return `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${((x1 + x2) / 2 + (nx / len) * bow * side).toFixed(1)} ${((y1 + y2) / 2 + (ny / len) * bow * side).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

export default function CoverageMap({ headingLevel = 2 }: { headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const land = smooth(OUTLINE);

  return (
    <div className="coverage">
      <div className="coverage-text">
        <Heading id="coverage-title" className="h2 heading-accent">פריסה ארצית: מהגליל ועד אילת</Heading>
        <p>
          צוותי סאן פאוור פועלים בכל הארץ. אנחנו מנהלים, מתחזקים ושוטפים מערכות סולאריות על גגות, על הקרקע, על
          מאגרי מים ועל דפנות מאגרים, בכל אזור שבו הלקוחות שלנו מחזיקים מערכות.
        </p>
        <ul className="coverage-regions">
          {regions.map((r) => (
            <li key={r.name}>{r.name}</li>
          ))}
        </ul>
        <p className="coverage-sites">
          בין האתרים שבהם עבדנו: {projectSites.map((s) => s.name).join(", ")}.
        </p>
      </div>
      <svg
        className="coverage-map"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="מפת ישראל עם אזורי השירות של סאן פאוור, מהגליל והגולן בצפון ועד הערבה ואילת בדרום"
      >
        <defs>
          <linearGradient id="coverage-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4a6f9c" />
            <stop offset="0.55" stopColor="#30486c" />
            <stop offset="1" stopColor="#22385a" />
          </linearGradient>
          <radialGradient id="coverage-light" cx="0.35" cy="0.3" r="0.75">
            <stop offset="0" stopColor="#9ad58f" stopOpacity="0.22" />
            <stop offset="1" stopColor="#9ad58f" stopOpacity="0" />
          </radialGradient>
          <filter id="coverage-glow" x="-30%" y="-10%" width="160%" height="120%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <clipPath id="coverage-clip">
            <path d={land} />
          </clipPath>
        </defs>

        {/* The land as a raised slab: a glow, a shadow under it, the surface, then its lit edge. */}
        <path d={land} className="coverage-aura" filter="url(#coverage-glow)" />
        <path d={land} className="coverage-slab" transform="translate(6 11)" />
        <path d={land} className="coverage-land" />
        <path d={land} className="coverage-shine" />
        <g clipPath="url(#coverage-clip)" className="coverage-water">
          <path d={smooth(DEAD_SEA)} />
          <ellipse cx={x(KINNERET.lon)} cy={y(KINNERET.lat)} rx="8.5" ry="15.5" />
        </g>
        <path d={land} className="coverage-outline" pathLength={1} />

        {/* Routes from the office to every region, with a current running along them. */}
        <g className="coverage-routes">
          {regions.map((r) => (
            <path key={r.name} d={route(r.lon, r.lat)} pathLength={1} />
          ))}
        </g>

        {projectSites.map((s) => (
          <circle key={s.name} cx={x(s.lon)} cy={y(s.lat)} r="2.6" className="coverage-site">
            <title>{s.name}</title>
          </circle>
        ))}

        <g className="coverage-pins">
          {regions.map((r, i) => (
            <g key={r.name} className="coverage-pin" style={{ "--i": i } as React.CSSProperties}>
              <line x1={LABELS - 12} y1={y(r.lat)} x2={x(r.lon) - 9} y2={y(r.lat)} className="coverage-leader" />
              <circle cx={LABELS - 12} cy={y(r.lat)} r="2" className="coverage-leader-end" />
              <circle cx={x(r.lon)} cy={y(r.lat)} r="7" className="coverage-ring" />
              <circle cx={x(r.lon)} cy={y(r.lat)} r="7" className="coverage-ring coverage-ring--late" />
              <circle cx={x(r.lon)} cy={y(r.lat)} r="6.5" className="coverage-dot" />
              <circle cx={x(r.lon)} cy={y(r.lat)} r="2.4" className="coverage-core" />
              <text x={LABELS - 20} y={y(r.lat) + 5} direction="rtl" textAnchor="start" className="coverage-label">
                {r.name}
              </text>
            </g>
          ))}
        </g>

        {/* The office: where the routes start */}
        <g className="coverage-office" aria-hidden="true">
          <circle cx={x(OFFICE.lon)} cy={y(OFFICE.lat)} r="9" className="coverage-office-ring" />
          <rect x={x(OFFICE.lon) - 4} y={y(OFFICE.lat) - 4} width="8" height="8" rx="1.5" transform={`rotate(45 ${x(OFFICE.lon).toFixed(1)} ${y(OFFICE.lat).toFixed(1)})`} />
        </g>
      </svg>
    </div>
  );
}
