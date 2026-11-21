"use client";

import { useState } from "react";

// Settings recovered from the old site's database (Elementor template "מחשבון", id 4559).
// The widget itself was broken on the live site, but the formula and texts were still stored:
//   yearly gain = system size (kW) x 185.4, slider from 1 to 1,000 kW.
export const GAIN_PER_KW = 185.4;
const MIN = 1;
const MAX = 1000;
const STEP = 1;

export function washGain(kw: number) {
  return kw * GAIN_PER_KW;
}

const fmt = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 0 });

export default function WashCalculator() {
  const [kw, setKw] = useState(100);

  return (
    <section className="calc" dir="rtl">
      <h2 id="wash-calc-title">לחישוב הרווח השנתי שלך לפי גודל המערכת בקילוואט (KW)</h2>
      <div className="calc-row">
        <output htmlFor="washRange">{fmt.format(kw)}</output>
        <input
          id="washRange"
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={kw}
          aria-labelledby="wash-calc-title"
          onChange={(e) => setKw(Number(e.target.value))}
        />
      </div>
      <div className="calc-scale" aria-hidden="true">
        <span>{fmt.format(MIN)}</span>
        <span>{fmt.format(MAX)}</span>
      </div>
      <h2>הרווח השנתי שלך:</h2>
      <p className="calc-result" aria-live="polite">{fmt.format(washGain(kw))}₪</p>
      <p>כתוצאה משטיפה ידנית ועלייה בתפוקה של עד כ 30%</p>
      <p className="calc-note">*רווח שנתי ממוצע משוער. מחושב לפי תעריף חח&quot;י של 45 אג&apos; ל KW</p>
    </section>
  );
}
