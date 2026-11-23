"use client";

import { useSyncExternalStore } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { PRIVACY_PATH } from "@/lib/forms";

const KEY = "cookie-choice";
const CHANGED = "cookie-choice-changed";

type Choice = "accepted" | "declined" | "unset" | "unknown";

function read(): Choice {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "accepted" || v === "declined" ? v : "unset";
  } catch {
    // Storage is blocked (private mode): ask again on every visit, measure nothing until answered.
    return "unset";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGED, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener("storage", onChange);
  };
}

let sessionChoice: Choice | null = null;

function choose(choice: "accepted" | "declined") {
  sessionChoice = choice;
  try {
    window.localStorage.setItem(KEY, choice);
  } catch {
    // Kept for this visit only.
  }
  window.dispatchEvent(new Event(CHANGED));
}

/* Cookie notice. Google Analytics is loaded only after the visitor agrees,
   so nothing is measured before a choice is made or after a refusal. */
export default function CookieNotice({ gaId }: { gaId?: string }) {
  const choice = useSyncExternalStore<Choice>(
    subscribe,
    () => sessionChoice ?? read(),
    () => "unknown",
  );

  return (
    <>
      {gaId && choice === "accepted" && <GoogleAnalytics gaId={gaId} />}
      {choice === "unset" && (
        <section className="cookie-notice" aria-label="הודעה על עוגיות">
          <p>
            האתר משתמש בעוגיות של Google Analytics כדי להבין איך גולשים משתמשים בו ולשפר אותו. פרטים נוספים ב
            <a href={PRIVACY_PATH}>מדיניות הפרטיות</a>.
          </p>
          <div className="cookie-actions">
            <button type="button" className="btn btn--primary" onClick={() => choose("accepted")}>
              אישור
            </button>
            <button type="button" className="btn" onClick={() => choose("declined")}>
              בלי עוגיות מדידה
            </button>
          </div>
        </section>
      )}
    </>
  );
}
