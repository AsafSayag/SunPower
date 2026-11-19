"use client";

import { useState } from "react";

// Same model as the calculator on the old site: yearly rent per square metre, 25-year contract.
export const YEARLY_RATE_PER_SQM = 52;
export const CONTRACT_YEARS = 25;
const MIN = 100;
const MAX = 10000;
const STEP = 10;

export function roofIncome(sqm: number) {
  const yearly = sqm * YEARLY_RATE_PER_SQM;
  return { yearly, contract: yearly * CONTRACT_YEARS };
}

const fmt = new Intl.NumberFormat("he-IL");

export default function RoofCalculator() {
  const [sqm, setSqm] = useState(1000);
  const { yearly, contract } = roofIncome(sqm);

  return (
    <section className="calc" dir="rtl">
      <h2 id="roof-calc-title">
        לחישוב הרווח השנתי שלך לפי גודל הגג במטר רבוע - במודל שכירות ללא תלות במערכת
      </h2>
      <div className="calc-row">
        <output htmlFor="roofRange">{fmt.format(sqm)}</output>
        <input
          id="roofRange"
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={sqm}
          aria-labelledby="roof-calc-title"
          onChange={(e) => setSqm(Number(e.target.value))}
        />
      </div>
      <div className="calc-scale" aria-hidden="true">
        <span>{fmt.format(MIN)}</span>
        <span>{fmt.format(MAX)}</span>
      </div>
      <p>הרווח השנתי שלך:</p>
      <p className="calc-result" aria-live="polite">{fmt.format(yearly)}₪</p>
      <p>בשנה</p>
      <p>לכל תקופת החוזה ל 25 שנה:</p>
      <p className="calc-result" aria-live="polite">{fmt.format(contract)}₪</p>
      <p className="calc-note">
        *החישוב הינו אומדן בלבד ויכול להשתנות לפי מיקום הגג תנאי ההסכם נגישות ונתוני הפרויקט
      </p>
    </section>
  );
}
