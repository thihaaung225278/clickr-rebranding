"use client";

import { useEffect, useRef, useState } from "react";
import {
  createLetter3D,
  type Letter3DHandle,
} from "./letter3d";

const LETTERS = ["C", "l", "i", "c", "k", "r"] as const;
/** Slide + water-fill duration (ms). Fill completes, then advance. */
const AUTO_MS = 2000;

/** Live brand CTAs (clickrmedia.com hero). */
const CTA_HOW_IT_WORKS = "https://www.clickrmedia.com/growth-engine/";
const CTA_DIAGNOSIS = "https://www.clickrmedia.com/growth-engine/#talk-to-us";

type GlyphPhase = "pending" | "filling" | "done";

function glyphPhase(index: number, activeIndex: number): GlyphPhase {
  if (index < activeIndex) return "done";
  if (index === activeIndex) return "filling";
  return "pending";
}

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
 * Home banner: left vertical Clickr auto-active rail + right 3D letter stage.
 */
export default function BannerLetterSlider() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<Letter3DHandle | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [webglOk, setWebglOk] = useState(true);
  const [cursorOn, setCursorOn] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    let handle: Letter3DHandle | null = null;
    try {
      handle = createLetter3D(el, {
        reducedMotion,
        initialLetter: LETTERS[0],
      });
      handleRef.current = handle;
      setWebglOk(true);
    } catch (err) {
      console.warn("Banner Letter3D unavailable — 2D fallback", err);
      handleRef.current = null;
      setWebglOk(false);
    }

    return () => {
      handle?.dispose();
      handleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, []);

  useEffect(() => {
    handleRef.current?.setLetter(LETTERS[activeIndex] ?? "C");
  }, [activeIndex]);

  useEffect(() => {
    handleRef.current?.setPaused(reducedMotion);
  }, [reducedMotion]);

  // Reduced motion: no water animation — advance on a timer only.
  useEffect(() => {
    if (!reducedMotion) return;
    const id = window.setTimeout(() => {
      setActiveIndex((i) => (i + 1) % LETTERS.length);
    }, AUTO_MS);
    return () => window.clearTimeout(id);
  }, [activeIndex, reducedMotion]);

  // Fine-pointer custom cursor: arrow tip + brand "c" (DOM transform, no re-render per move).
  useEffect(() => {
    if (reducedMotion) return;
    const section = sectionRef.current;
    const cursor = cursorRef.current;
    if (!section || !cursor) return;

    const fineMq = window.matchMedia("(pointer: fine)");
    if (!fineMq.matches) return;

    const onMove = (event: PointerEvent) => {
      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
    };
    const onEnter = () => setCursorOn(true);
    const onLeave = () => setCursorOn(false);

    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerenter", onEnter);
    section.addEventListener("pointerleave", onLeave);

    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerenter", onEnter);
      section.removeEventListener("pointerleave", onLeave);
      setCursorOn(false);
    };
  }, [reducedMotion]);

  const advance = () => {
    setActiveIndex((i) => (i + 1) % LETTERS.length);
  };

  const activeChar = LETTERS[activeIndex] ?? "C";

  return (
    <section
      ref={sectionRef}
      aria-labelledby="home-brand"
      className={`banner-slider relative isolate flex h-dvh flex-col overflow-hidden${cursorOn ? " banner-slider--custom-cursor" : ""}`}
      style={{ ["--fill-ms" as string]: `${AUTO_MS}ms` }}
    >
      <div className="banner-slider__atmosphere" aria-hidden="true" />

      <div
        ref={cursorRef}
        className={`banner-slider__cursor${cursorOn ? " banner-slider__cursor--on" : ""}`}
        aria-hidden="true"
      >
        <div className="banner-slider__cursor-inner">
          <span className="banner-slider__cursor-arrow">
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
          <span className="banner-slider__cursor-letter font-display">c</span>
        </div>
      </div>

      <div className="banner-slider__frame relative z-10 flex min-h-0 flex-1">
        <nav
          aria-label="Clickr letter sequence"
          className="banner-slider__rail flex w-1/4 shrink-0 flex-col items-center justify-center gap-[clamp(0.2rem,0.9vh,0.65rem)] overflow-hidden border-r border-[color-mix(in_oklab,var(--ink)_12%,transparent)] py-5"
        >
          {LETTERS.map((letter, index) => {
            const phase = glyphPhase(index, activeIndex);
            const isActive = phase === "filling";
            const phaseClass =
              isActive
                ? reducedMotion
                  ? "banner-slider__glyph--done"
                  : "banner-slider__glyph--filling"
                : phase === "done"
                  ? "banner-slider__glyph--done"
                  : "banner-slider__glyph--pending";

            return (
              <button
                key={`${letter}-${index}`}
                type="button"
                className={`banner-slider__glyph font-display text-[clamp(2.75rem,6.2vw,4.75rem)] font-bold leading-none tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand)] ${phaseClass}`}
                aria-current={isActive ? "true" : undefined}
                aria-label={`Letter ${letter}`}
                onClick={() => setActiveIndex(index)}
              >
                <span className="banner-slider__glyph-outline" aria-hidden="true">
                  {letter}
                </span>
                <span
                  key={
                    isActive && !reducedMotion
                      ? `fill-${activeIndex}`
                      : undefined
                  }
                  className="banner-slider__glyph-liquid"
                  aria-hidden="true"
                  onAnimationEnd={
                    isActive && !reducedMotion
                      ? (e) => {
                          if (e.animationName !== "banner-water-fill") return;
                          advance();
                        }
                      : undefined
                  }
                >
                  {letter}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <div
            ref={stageRef}
            className="banner-slider__stage relative min-h-0 w-full flex-1"
            aria-hidden="true"
          />

          {!webglOk ? (
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              aria-hidden="true"
            >
              <span className="font-display text-[clamp(6rem,28vw,14rem)] font-bold leading-none text-brand">
                {activeChar}
              </span>
            </div>
          ) : null}

          <div className="banner-slider__copy relative z-10 w-full shrink-0 px-[5vw] pb-8 pt-4 text-[var(--ink)]">
            <h1 id="home-brand" className="sr-only">
              Clickr
            </h1>
            <p className="banner-slider__eyebrow font-sans text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-brand sm:text-xs">
              Your team&apos;s stretched thin.
            </p>
            <p
              aria-live="polite"
              className="banner-slider__headline mt-3 font-display text-[clamp(2.25rem,5vw,3.75rem)] font-extrabold leading-snug tracking-tight"
            >
              Your marketing{" "}
              <span className="text-brand">shouldn&apos;t be.</span>
            </p>
            <p className="banner-slider__lede mt-4 font-sans text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">
              We engineer marketing as a system. Every product runs the same
              loop: it cuts the hours and cost of running your marketing first,
              and growth compounds from there. Nothing ships without the
              client&apos;s yes, and every yes is on record.
            </p>
            <div className="banner-slider__cta mt-7 flex flex-wrap gap-3">
              <a
                href={CTA_HOW_IT_WORKS}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center border border-brand bg-brand px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-wide text-white transition-[transform,background-color,border-color] duration-300 hover:border-[#e85f00] hover:bg-[#e85f00] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ink)] active:scale-[0.98]"
              >
                See how it works
              </a>
              <a
                href={CTA_DIAGNOSIS}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center border border-[color-mix(in_oklab,var(--ink)_35%,transparent)] bg-transparent px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-wide text-[var(--ink)] transition-[transform,border-color,background-color] duration-300 hover:border-[var(--ink)] hover:bg-[color-mix(in_oklab,var(--ink)_6%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand)] active:scale-[0.98]"
              >
                Get a diagnosis
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
