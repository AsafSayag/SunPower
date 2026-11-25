"use client";

import { useEffect, useRef } from "react";
import type { PanelGl } from "@/components/home/solarPanelGl";

type Stat = { label: string; value: string; suffix?: string; unit?: string };

const nf = new Intl.NumberFormat("en-US");
const SIDE = 4.8; // seconds the panel spends on each figure
const EASE = 0.8; // how much it slows while a face looks at the visitor (0 = steady turn, 1 = full stop)
const YAW = -22; // resting angle: the face looks at the visitor, and the frame's depth shows
const TILT = -9; // seen from a little above

/** Width of a figure in characters, so the longest one still fits the panel. */
function chars(stat: Stat) {
  return (nf.format(Number(stat.value)) + (stat.suffix ?? "")).length + (stat.unit ? 1.4 : 0);
}

function Figures({ sides, hidden }: { sides: Stat[]; hidden?: boolean }) {
  return (
    <>
      {sides.map((s, i) => (
        <p key={s.label} className="sp-text" data-stat={i} data-on={i === (hidden ? 1 : 0)} aria-hidden={hidden}>
          <span className="sp-value" style={{ "--n": chars(s) } as React.CSSProperties}>
            {s.unit && <span className="sp-unit">{s.unit}</span>}
            <span className="sp-figure">
              {nf.format(Number(s.value))}
              {s.suffix}
            </span>
          </span>
          <span className="sp-label">{s.label}</span>
        </p>
      ))}
    </>
  );
}

/* The company's figures on a solar panel that floats and turns in the home hero. It never stops:
   it turns slowly while a face looks at the visitor, long enough to read the figure, and swings
   quickly through the edge. The panel has two glass faces; each shows one figure, and takes the
   next one while it is turned away, so the four figures follow one another. It leans toward the
   mouse and can be dragged or turned with the arrow keys.
   This component draws a simple CSS panel, which is also where the figures live as ordinary text;
   once the page is up it is redrawn in WebGL (solarPanelGl.ts). */
export default function SolarPanel3d({ stats }: { stats: Stat[] }) {
  const sides = stats.slice(0, 4);
  const count = sides.length;
  const scene = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const state = useRef({ angle: YAW, vel: 0, target: YAW, phase: 0, rate: 1, held: false, drag: false, startX: 0, startAngle: 0, moved: 0, last: 0, px: 0, py: 0, sx: 0, sy: 0, lean: 0, front: 0, back: 1 });

  useEffect(() => {
    const el = scene.current;
    const box = body.current;
    if (!el || !box) return;
    const s = state.current;
    const faces = Array.from(box.querySelectorAll<HTMLElement>(".sp-face"));
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wrap = (k: number) => ((k % count) + count) % count;

    /** Which figure each face carries at this angle. A face changes its figure only while it is turned away. */
    const assign = (angle: number) => {
      const turns = (YAW - angle) / 180;
      const front = wrap(2 * Math.round(turns / 2));
      const back = wrap(2 * Math.round((turns - 1) / 2) + 1);
      if (front === s.front && back === s.back) return;
      s.front = front;
      s.back = back;
      [front, back].forEach((stat, i) => faces[i]?.querySelectorAll<HTMLElement>(".sp-text").forEach((t) => (t.dataset.on = String(Number(t.dataset.stat) === stat))));
    };
    const paint = (yaw: number, pitch: number, roll: number) => {
      box.style.transform = `rotateX(${pitch.toFixed(2)}deg) rotateZ(${roll.toFixed(2)}deg) rotateY(${yaw.toFixed(2)}deg)`;
    };
    const nearest = (angle: number) => Math.round((angle - YAW) / 180) * 180 + YAW;
    // One smooth curve: slow where a face looks at the visitor, fast through the edge, never a stop.
    const course = (phase: number) => YAW - ((phase - (EASE / 2) * Math.sin(2 * phase)) * 180) / Math.PI;
    const settle = (angle: number) => {
      s.phase = (-(nearest(angle) - YAW) * Math.PI) / 180; // pick the turn up again from that face
      s.target = course(s.phase);
      if (still) {
        s.angle = s.target;
        assign(s.angle);
        paint(s.angle, TILT, 0);
      }
    };

    const down = (e: PointerEvent) => {
      s.drag = true;
      s.startX = e.clientX;
      s.startAngle = s.angle;
      s.moved = 0;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!s.drag) return;
      const dx = e.clientX - s.startX;
      s.moved = Math.max(s.moved, Math.abs(dx));
      s.target = s.startAngle + dx * 0.6; // the panel follows the hand through the same spring
      if (still) {
        s.angle = s.target;
        assign(s.angle);
        paint(s.angle, TILT, 0);
      }
    };
    const up = () => {
      if (!s.drag) return;
      s.drag = false;
      // A tap turns to the next figure; a drag carries on with the speed it had and settles on a face.
      settle(s.moved < 6 ? s.angle - 180 : s.angle + s.vel * 0.22);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      settle(s.angle + (e.key === "ArrowLeft" ? -180 : 180));
    };
    const hold = () => (s.held = true);
    const release = () => (s.held = false);
    // The panel leans a little toward the mouse, wherever it is on the screen.
    const look = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      s.px = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)));
      s.py = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)));
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("keydown", key);
    el.addEventListener("pointerenter", hold);
    el.addEventListener("pointerleave", release);
    el.addEventListener("focus", hold);
    el.addEventListener("blur", release);
    if (!still) window.addEventListener("pointermove", look, { passive: true });

    let gl: PanelGl | null = null;
    let frame = 0;
    let visible = true;
    const io = "IntersectionObserver" in window ? new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.15 }) : null;
    io?.observe(el);
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - (s.last || now)) / 1000);
      s.last = now;
      if (!visible || document.hidden) return;
      if (!s.drag) {
        // Under the mouse the turn eases to a halt, and eases back in when the mouse leaves.
        s.rate += ((s.held ? 0 : 1) - s.rate) * Math.min(1, dt * 2.5);
        s.phase += (Math.PI / SIDE) * s.rate * dt;
        s.target = course(s.phase);
      }
      // The panel follows its course through a soft spring, so nothing it does is abrupt.
      const pull = s.drag ? 120 : 22;
      const drag = s.drag ? 18 : 9.4;
      s.vel += ((s.target - s.angle) * pull - s.vel * drag) * dt;
      s.angle += s.vel * dt;
      s.sx += (s.px - s.sx) * Math.min(1, dt * 3);
      s.sy += (s.py - s.sy) * Math.min(1, dt * 3);
      const spin = Math.max(-300, Math.min(300, s.vel));
      // Low on the screen the panel lifts its face a little toward the reader (it matters most on a
      // phone, where it scrolls up from the bottom edge).
      const r = el.getBoundingClientRect();
      const low = Math.max(-1, Math.min(1, ((r.top + r.height / 2) / window.innerHeight - 0.5) * 2));
      s.lean += (Math.max(0, low) * 5 - s.lean) * Math.min(1, dt * 4);
      // It floats: slow sways on every axis at unrelated rhythms, and it banks into the turn.
      const yaw = s.angle + Math.sin(now / 3700) * 2.2 + s.sx * 8;
      const pitch = TILT + s.lean + Math.sin(now / 3100) * 2 + Math.cos(now / 4700) * 1.1 - Math.abs(spin) * 0.018 - s.sy * 6;
      const roll = Math.sin(now / 3900) * 1.6 + spin * 0.016;
      assign(yaw);
      if (gl) gl.render(yaw, pitch, roll, now, s.front, s.back);
      else paint(yaw, pitch, roll);
    };

    // The real thing: once the page is up, the panel is redrawn in WebGL. If that fails, or the
    // visitor asked for less motion, the CSS panel below simply stays.
    let gone = false;
    const upgrade = async () => {
      try {
        const { createPanelGl } = await import("@/components/home/solarPanelGl");
        const text = (root: Element, sel: string) => root.querySelector(sel)?.textContent?.trim() ?? "";
        const rows = Array.from(faces[0].querySelectorAll(".sp-text"));
        const data = rows.map((row) => ({ figure: text(row, ".sp-figure"), unit: text(row, ".sp-unit"), label: text(row, ".sp-label") }));
        const fonts = { figure: getComputedStyle(rows[0].querySelector(".sp-value")!).fontFamily, label: getComputedStyle(rows[0].querySelector(".sp-label")!).fontFamily };
        const made = await createPanelGl(el, data, fonts);
        if (gone) return made.dispose();
        gl = made;
        el.classList.add("is-gl");
      } catch {
        gl = null;
      }
    };
    const idle = () => void upgrade();
    if (still) paint(YAW, TILT, 0);
    else {
      if (document.readyState === "complete") idle();
      else window.addEventListener("load", idle, { once: true });
      frame = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(frame);
      gone = true;
      window.removeEventListener("load", idle);
      (gl as PanelGl | null)?.dispose();
      el.classList.remove("is-gl");
      io?.disconnect();
      window.removeEventListener("pointermove", look);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("keydown", key);
      el.removeEventListener("pointerenter", hold);
      el.removeEventListener("pointerleave", release);
      el.removeEventListener("focus", hold);
      el.removeEventListener("blur", release);
    };
  }, [count]);

  return (
    <div ref={scene} className="sp-scene" role="group" tabIndex={0} aria-label="סאן פאוור במספרים">
      <div className="sp-float">
        <div ref={body} className="sp-panel" style={{ transform: `rotateX(${TILT}deg) rotateY(${YAW}deg)` }}>
          <div className="sp-face">
            <Figures sides={sides} />
          </div>
          <div className="sp-face sp-face--back">
            <Figures sides={sides} hidden />
          </div>
        </div>
      </div>
      <span className="sp-shadow" aria-hidden="true" />
    </div>
  );
}
