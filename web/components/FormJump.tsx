"use client";

import { useEffect, useState } from "react";

/** A button that follows the scroll and leads to the page's form. It shows once the hero is out of
    view and steps aside while the form itself is on screen. */
export default function FormJump({ target, label }: { target: string; label: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.querySelector(".page-hero");
    const form = document.getElementById(target);
    if (!hero || !form || !("IntersectionObserver" in window)) return;
    let heroIn = true;
    let formIn = false;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) heroIn = e.isIntersecting;
        else formIn = e.isIntersecting;
      }
      setShow(!heroIn && !formIn);
    });
    io.observe(hero);
    io.observe(form);
    return () => io.disconnect();
  }, [target]);

  return (
    <a href={`#${target}`} className="form-jump" data-show={show} tabIndex={show ? 0 : -1} aria-hidden={!show}>
      {label}
    </a>
  );
}
