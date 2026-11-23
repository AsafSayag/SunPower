/** Decorative backdrop of the inner-page hero and of the footer: a field of panels receding to the horizon, the sun
    rising behind it, a glint crossing the glass and a few cells lighting up. CSS only, no image. */
export default function HeroField() {
  return (
    <div className="hero-field" aria-hidden="true">
      <span className="hero-sun" />
      <div className="hero-ground">
        <div className="hero-plane">
          <i style={{ "--x": -3, "--y": 1, animationDelay: "0.6s" } as React.CSSProperties} />
          <i style={{ "--x": 1, "--y": 2, animationDelay: "3s" } as React.CSSProperties} />
          <i style={{ "--x": -6, "--y": 3, animationDelay: "5.2s" } as React.CSSProperties} />
          <b />
        </div>
      </div>
    </div>
  );
}
