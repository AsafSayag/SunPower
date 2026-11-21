import { projectSites, regions } from "@/content/knowledge";

// Simplified outline, clockwise from the north-west corner (lon, lat).
const OUTLINE: [number, number][] = [
  [35.1, 33.09], [35.07, 32.92], [34.98, 32.83], [34.95, 32.7], [34.9, 32.5], [34.85, 32.32], [34.77, 32.08],
  [34.72, 31.93], [34.64, 31.8], [34.55, 31.67], [34.49, 31.59], [34.38, 31.45], [34.27, 31.22], [34.4, 30.86],
  [34.55, 30.4], [34.73, 29.95], [34.9, 29.5], [34.97, 29.55], [35.08, 29.9], [35.15, 30.1], [35.2, 30.6],
  [35.4, 30.95], [35.47, 31.1], [35.55, 31.5], [35.55, 31.76], [35.57, 32.4], [35.57, 32.63], [35.68, 32.7],
  [35.9, 32.75], [35.83, 33.0], [35.8, 33.3], [35.62, 33.27], [35.52, 33.1], [35.1, 33.09],
];

const SCALE = 150;
const LABELS = 170; // room on the sea side for region names
const x = (lon: number) => LABELS + (lon - 34.2) * 0.853 * SCALE;
const y = (lat: number) => 16 + (33.35 - lat) * SCALE;
const W = Math.ceil(x(35.95)) + 12;
const H = Math.ceil(y(29.45)) + 8;

export default function CoverageMap({ headingLevel = 2 }: { headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const path = OUTLINE.map(([lon, lat], i) => `${i ? "L" : "M"}${x(lon).toFixed(1)} ${y(lat).toFixed(1)}`).join(" ") + "Z";

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
        <path d={path} className="coverage-land" />
        {projectSites.map((s) => (
          <circle key={s.name} cx={x(s.lon)} cy={y(s.lat)} r="3" className="coverage-site">
            <title>{s.name}</title>
          </circle>
        ))}
        {regions.map((r) => (
          <g key={r.name}>
            <line x1={LABELS - 14} y1={y(r.lat)} x2={x(r.lon)} y2={y(r.lat)} className="coverage-leader" />
            <circle cx={x(r.lon)} cy={y(r.lat)} r="11" className="coverage-halo" />
            <circle cx={x(r.lon)} cy={y(r.lat)} r="5" className="coverage-dot" />
            <text x={LABELS - 20} y={y(r.lat) + 5} direction="rtl" textAnchor="start" className="coverage-label">
              {r.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
