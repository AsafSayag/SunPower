"use client";

import { useState } from "react";

// The old site only had the headings of this calculator, with no formula behind them.
// This model is our own estimate and every number below needs the business's sign-off:
//   extra yearly income = system size (kW) x yearly yield x price per kWh x output recovered by washing
export const YEARLY_YIELD_KWH_PER_KW = 1700; // typical yearly output per installed kW in Israel
export const PRICE_PER_KWH = 0.45; // NIS per kWh, mid-range commercial tariff
export const OUTPUT_RECOVERED = 0.06; // share of yearly output lost to dirt without regular washing
const MIN = 50;
const MAX = 5000;
const STEP = 10;

export function washGain(kw: number) {
  return kw * YEARLY_YIELD_KWH_PER_KW * PRICE_PER_KWH * OUTPUT_RECOVERED;
}

const fmt = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 0 });

export default function WashCalculator() {
  const [kw, setKw] = useState(500);

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
      <p className="calc-note">
        *החישוב הינו אומדן בלבד של תוספת ההכנסה משטיפה סדירה, לפני עלות השטיפה. מבוסס על תפוקה של{" "}
        {fmt.format(YEARLY_YIELD_KWH_PER_KW)} קוט״ש לקילוואט בשנה, תעריף של {PRICE_PER_KWH} ₪ לקוט״ש ושיפור תפוקה של{" "}
        {OUTPUT_RECOVERED * 100}%. התוצאה בפועל תלויה במיקום המערכת, ברמת האבק ובתעריף שלכם.
      </p>
    </section>
  );
}
