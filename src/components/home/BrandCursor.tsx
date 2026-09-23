"use client";

import { useEffect, useRef, useState } from "react";

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Site-wide brand cursor (arrow tip + outline "c") — same design as the home banner.
 * Fine pointer only; respects prefers-reduced-motion; gated by `active` (e.g. after intro).
 */
export default function BrandCursor({ active }: { active: boolean }) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!active || reducedMotion) return;

    const fineMq = window.matchMedia("(pointer: fine)");
    if (!fineMq.matches) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    const root = document.documentElement;
    root.classList.add("brand-cursor-active");

    const onMove = (event: PointerEvent) => {
      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      setVisible(true);
    };

    const onLeaveWindow = () => setVisible(false);

    window.addEventListener("pointermove", onMove);
    document.addEventListener("mouseleave", onLeaveWindow);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseleave", onLeaveWindow);
      root.classList.remove("brand-cursor-active");
      setVisible(false);
    };
  }, [active, reducedMotion]);

  if (!active || reducedMotion) return null;

  return (
    <div
      ref={cursorRef}
      className={`brand-cursor${visible ? " brand-cursor--on" : ""}`}
      aria-hidden="true"
    >
      <div className="brand-cursor__inner">
        <span className="brand-cursor__arrow">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            aria-hidden="true"
            focusable="false"
          >
            {/* Classic OS pointer path — tip at top-left, slight natural slant */}
            <path
              fill="currentColor"
              d="M4.5 2.2v17.1c0 .48.58.72.92.38l4.05-4.05c.1-.1.23-.15.36-.15h6.4c.48 0 .72-.58.38-.92L5.35 1.84A.5.5 0 0 0 4.5 2.2Z"
            />
          </svg>
        </span>
        <span className="brand-cursor__letter font-display">c</span>
      </div>
    </div>
  );
}
