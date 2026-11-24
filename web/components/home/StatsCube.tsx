"use client";

import { useEffect, useRef } from "react";
import type { CubeGl } from "@/components/home/cubeGl";

type Stat = { label: string; value: string; suffix?: string; unit?: string };

const nf = new Intl.NumberFormat("en-US");
const SIDE = 4.8; // seconds the cube spends on each side
const EASE = 0.78; // how much it slows while a side faces the visitor (0 = steady turn, 1 = full stop)
const YAW = -28; // resting angle: the side faces the visitor, the next one shows beside it
const TILT = -12; // seen from a little above, so the top and two sides always show
// Light from above, to the left and in front of the cube (unit vector).
const LIGHT = { x: -0.47, y: 0.58, z: 0.66 };

/** Width of a figure in characters, so the longest one still fits its side of the cube. */
function chars(stat: Stat) {
  return (nf.format(Number(stat.value)) + (stat.suffix ?? "")).length + (stat.unit ? 1.4 : 0);
}

/** How much light a side receives when its normal points at `deg` around the vertical axis. */
function lit(deg: number) {
  const r = (deg * Math.PI) / 180;
  return Math.max(0, Math.sin(r) * LIGHT.x + Math.cos(r) * LIGHT.z);
}

/* The company's four figures on the sides of a cube of dark glass. It floats and sways and turns
   without ever stopping: slowly while a side faces the visitor, long enough to read it, faster
   between sides; it leans toward the mouse and can
   be dragged or turned with the arrow keys. The light
   stays where it is while the cube turns, so each side brightens as it comes round. The figures are
   ordinary text in the page. */
export default function StatsCube({ stats }: { stats: Stat[] }) {
  const sides = stats.slice(0, 4);
  const scene = useRef<HTMLDivElement>(null);
  const cube = useRef<HTMLDivElement>(null);
  const state = useRef({ angle: YAW, vel: 0, target: YAW, phase: 0, rate: 1, held: false, drag: false, startX: 0, startAngle: 0, moved: 0, last: 0, px: 0, py: 0, sx: 0, sy: 0, lean: 0 });

  useEffect(() => {
    const el = scene.current;
    const box = cube.current;
    if (!el || !box) return;
    const s = state.current;
    const faces = Array.from(box.querySelectorAll<HTMLElement>(".cube-face[data-side]"));
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const paint = (yaw: number, pitch: number, roll: number) => {
      box.style.transform = `rotateX(${pitch.toFixed(2)}deg) rotateZ(${roll.toFixed(2)}deg) rotateY(${yaw.toFixed(2)}deg)`;
      for (const face of faces) {
        const deg = Number(face.dataset.side) * 90 + yaw;
        face.style.setProperty("--l", lit(deg).toFixed(3));
        face.style.setProperty("--f", Math.cos((deg * Math.PI) / 180).toFixed(3));
      }
    };
    const nearest = (angle: number) => Math.round((angle - YAW) / 90) * 90 + YAW;
    // The turn never stops and never starts: it only slows as a side comes to face the visitor and
    // gathers speed again between sides, along one smooth curve.
    const course = (phase: number) => YAW - ((phase - (EASE / 4) * Math.sin(4 * phase)) * 180) / Math.PI;
    const settle = (angle: number) => {
      s.phase = (-(nearest(angle) - YAW) * Math.PI) / 180; // pick the turn up again from that side
      s.target = course(s.phase);
      if (still) paint((s.angle = s.target), TILT, 0);
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
      s.target = s.startAngle + dx * 0.5; // the cube follows the hand through the same spring
      if (still) paint((s.angle = s.target), TILT, 0);
    };
    const up = () => {
      if (!s.drag) return;
      s.drag = false;
      // A tap turns to the next side; a drag carries on with the speed it had and settles on a side.
      settle(s.moved < 6 ? s.angle - 90 : s.angle + s.vel * 0.22);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      settle(s.angle + (e.key === "ArrowLeft" ? -90 : 90));
    };
    const hold = () => (s.held = true);
    const release = () => (s.held = false);
    // The cube leans a little toward the mouse, wherever it is on the screen.
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

    let frame = 0;
    let visible = true;
    const io = "IntersectionObserver" in window ? new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.15 }) : null;
    io?.observe(el);
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - (s.last || now)) / 1000);
      s.last = now;
      if (!visible || document.hidden) {
        return;
      }
      if (!s.drag) {
        // Under the mouse the turn eases to a halt, and eases back in when the mouse leaves.
        s.rate += ((s.held ? 0 : 1) - s.rate) * Math.min(1, dt * 2.5);
        s.phase += (Math.PI / 2 / SIDE) * s.rate * dt;
        s.target = course(s.phase);
      }
      // The cube follows its course through a soft spring, so nothing it does is abrupt.
      const pull = s.drag ? 120 : 22;
      const drag = s.drag ? 18 : 9.4;
      s.vel += ((s.target - s.angle) * pull - s.vel * drag) * dt;
      s.angle += s.vel * dt;
      s.sx += (s.px - s.sx) * Math.min(1, dt * 3);
      s.sy += (s.py - s.sy) * Math.min(1, dt * 3);
      const spin = Math.max(-260, Math.min(260, s.vel));
      // Low on the screen the cube lifts its face a little toward the reader (it matters most on a
      // phone, where it scrolls up from the bottom edge), without ever losing its top.
      const r = el.getBoundingClientRect();
      const low = Math.max(-1, Math.min(1, ((r.top + r.height / 2) / window.innerHeight - 0.5) * 2));
      s.lean += (Math.max(0, low) * 5 - s.lean) * Math.min(1, dt * 4);
      // It floats: slow sways on every axis at unrelated rhythms, and it banks into each turn.
      const yaw = s.angle + Math.sin(now / 3700) * 2.2 + s.sx * 9;
      const pitch = TILT + s.lean + Math.sin(now / 3100) * 2 + Math.cos(now / 4700) * 1.1 - Math.abs(spin) * 0.03 - s.sy * 6;
      const roll = Math.sin(now / 3900) * 1.8 + spin * 0.03;
      if (gl) gl.render(yaw, pitch, roll, now);
      else paint(yaw, pitch, roll);
    };
    // The real thing: once the page is up, the cube is redrawn in WebGL as a rounded block of glass.
    // If that fails, or the visitor asked for less motion, the CSS cube below simply stays.
    let gl: CubeGl | null = null;
    let gone = false;
    const upgrade = async () => {
      try {
        const { createCubeGl } = await import("@/components/home/cubeGl");
        const text = (face: HTMLElement, sel: string) => face.querySelector(sel)?.textContent?.trim() ?? "";
        const data = faces.map((face) => ({ figure: text(face, ".cube-figure"), unit: text(face, ".cube-unit"), label: text(face, ".cube-label") }));
        const fonts = { figure: getComputedStyle(faces[0].querySelector(".cube-value")!).fontFamily, label: getComputedStyle(faces[0].querySelector(".cube-label")!).fontFamily };
        const made = await createCubeGl(el, data, fonts);
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
      (gl as CubeGl | null)?.dispose();
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
  }, []);

  return (
    <div ref={scene} className="cube-scene" role="group" tabIndex={0} aria-label="סאן פאוור במספרים">
      <div className="cube-float">
        <div ref={cube} className="cube" style={{ transform: `rotateX(${TILT}deg) rotateY(${YAW}deg)` }}>
          {/* A dark core just under the surface closes the rounded edges. */}
          {[0, 1, 2, 3].map((i) => (
            <i key={i} className="cube-core" style={{ "--i": i } as React.CSSProperties} />
          ))}
          <i className="cube-core cube-core--top" />
          <i className="cube-core cube-core--bottom" />
          {sides.map((s, i) => (
            <div
              key={s.label}
              className="cube-face"
              data-side={i}
              style={{ "--i": i, "--l": lit(i * 90 + YAW).toFixed(3), "--f": Math.cos(((i * 90 + YAW) * Math.PI) / 180).toFixed(3) } as React.CSSProperties}
            >
              <p className="cube-text">
                <span className="cube-value" style={{ "--n": chars(s) } as React.CSSProperties}>
                  {s.unit && <span className="cube-unit">{s.unit}</span>}
                  <span className="cube-figure">
                    {nf.format(Number(s.value))}
                    {s.suffix}
                  </span>
                </span>
                <span className="cube-label">{s.label}</span>
              </p>
            </div>
          ))}
          <div className="cube-face cube-face--top" aria-hidden="true" />
          <div className="cube-face cube-face--bottom" aria-hidden="true" />
        </div>
      </div>
      <span className="cube-shadow" aria-hidden="true" />
    </div>
  );
}
