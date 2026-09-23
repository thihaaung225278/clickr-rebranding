"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

/** Collapsed lede line count before See more. */
const LEDE_CLAMP_LINES = 2;

const LEDE_COPY =
  "We engineer marketing as a system. Every product runs the same loop: it cuts the hours and cost of running your marketing first, and growth compounds from there. Nothing ships without the client's yes, and every yes is on record.";

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
 * Banner lede: clamp when overflowing, expand/collapse with max-height animation.
 */
function BannerLede({
  reducedMotion,
  expanded,
  onExpandedChange,
}: {
  reducedMotion: boolean;
  expanded: boolean;
  onExpandedChange: (next: boolean) => void;
}) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [needsMore, setNeedsMore] = useState(false);
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const sync = () => {
      const styles = getComputedStyle(el);
      const parsedLh = parseFloat(styles.lineHeight);
      const fontSize = parseFloat(styles.fontSize) || 16;
      const lineHeight = Number.isFinite(parsedLh) ? parsedLh : fontSize * 1.625;
      const collapsedH = Math.ceil(lineHeight * LEDE_CLAMP_LINES);
      const fullH = el.scrollHeight;
      setNeedsMore(fullH > collapsedH + 1);
      setMaxHeight(expanded ? fullH : Math.min(fullH, collapsedH));
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [expanded]);

  const showToggle = needsMore || expanded;

  return (
    <div className="banner-slider__lede-block mt-4">
      <div
        className={`banner-slider__lede-clip${reducedMotion ? " banner-slider__lede-clip--instant" : ""}`}
        style={maxHeight !== undefined ? { maxHeight } : undefined}
      >
        <p
          ref={textRef}
          id="banner-lede"
          className="banner-slider__lede font-sans text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg"
        >
          {LEDE_COPY}
        </p>
      </div>
      {showToggle ? (
        <button
          type="button"
          className="banner-slider__see-more mt-2 font-sans text-sm font-semibold text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ink)]"
          aria-expanded={expanded}
          aria-controls="banner-lede"
          onClick={() => onExpandedChange(!expanded)}
        >
          {expanded ? "See less" : "See more"}
        </button>
      ) : null}
    </div>
  );
}

/**
 * Home banner: left vertical Clickr auto-active rail + right 3D letter stage.
 * `armed` gates autoplay until the home intro overlay finishes.
 */
export default function BannerLetterSlider({ armed }: { armed: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const stageWrapRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<Letter3DHandle | null>(null);
  const viewportKeyRef = useRef("");
  const pendingStageRelockRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [webglOk, setWebglOk] = useState(true);
  const [stageLockPx, setStageLockPx] = useState<number | null>(null);
  const [ledeExpanded, setLedeExpanded] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  /** Freeze stage height so lede expand grows the banner downward (no WebGL resize flicker). */
  const lockStageHeight = useCallback(() => {
    const wrap = stageWrapRef.current;
    if (!wrap) return;

    setStageLockPx(null);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const h = Math.round(wrap.clientHeight);
        if (h > 0) setStageLockPx(h);
      });
    });
  }, []);

  useEffect(() => {
    if (ledeExpanded) return;
    if (pendingStageRelockRef.current) {
      pendingStageRelockRef.current = false;
    }
    lockStageHeight();
  }, [ledeExpanded, lockStageHeight]);

  useEffect(() => {
    viewportKeyRef.current = `${window.innerWidth}x${window.innerHeight}`;

    const onResize = () => {
      const key = `${window.innerWidth}x${window.innerHeight}`;
      if (key === viewportKeyRef.current) return;
      viewportKeyRef.current = key;
      if (ledeExpanded) {
        pendingStageRelockRef.current = true;
        return;
      }
      lockStageHeight();
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [ledeExpanded, lockStageHeight]);

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
      handle.setPaused(true);
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
    handleRef.current?.setPaused(reducedMotion || !armed);
  }, [reducedMotion, armed]);

  // Reduced motion: no water animation — advance on a timer only (after armed).
  useEffect(() => {
    if (!armed || !reducedMotion) return;
    const id = window.setTimeout(() => {
      setActiveIndex((i) => (i + 1) % LETTERS.length);
    }, AUTO_MS);
    return () => window.clearTimeout(id);
  }, [activeIndex, reducedMotion, armed]);

  const advance = () => {
    if (!armed) return;
    setActiveIndex((i) => (i + 1) % LETTERS.length);
  };

  const go = (delta: number) => {
    if (!armed) return;
    setActiveIndex((i) => {
      const next = (i + delta) % LETTERS.length;
      return next < 0 ? next + LETTERS.length : next;
    });
  };

  const activeChar = LETTERS[activeIndex] ?? "C";

  return (
    <section
      aria-labelledby="home-brand"
      className="banner-slider relative isolate flex min-h-dvh flex-col overflow-x-hidden"
      style={{ ["--fill-ms" as string]: `${AUTO_MS}ms` }}
    >
      <div className="banner-slider__atmosphere" aria-hidden="true" />

      <div className="banner-slider__frame relative z-10 flex min-h-0 flex-1">
        <nav
          aria-label="Clickr letter sequence"
          className="banner-slider__rail flex w-1/4 shrink-0 flex-col items-center justify-center gap-[clamp(0.2rem,0.9vh,0.65rem)] overflow-hidden border-r border-[color-mix(in_oklab,var(--ink)_12%,transparent)] py-5"
        >
          {LETTERS.map((letter, index) => {
            const phase = armed ? glyphPhase(index, activeIndex) : "pending";
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
                onClick={() => {
                  if (!armed) return;
                  setActiveIndex(index);
                }}
              >
                <span className="banner-slider__glyph-outline" aria-hidden="true">
                  {letter}
                </span>
                <span
                  key={
                    isActive && !reducedMotion
                      ? `fill-${activeIndex}-armed`
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
            ref={stageWrapRef}
            className={
              stageLockPx != null
                ? "banner-slider__stage relative w-full shrink-0"
                : "banner-slider__stage relative min-h-0 w-full flex-1"
            }
            style={stageLockPx != null ? { height: stageLockPx } : undefined}
          >
            <div
              ref={stageRef}
              className="banner-slider__stage-canvas absolute inset-0"
              aria-hidden="true"
            />

            <button
              type="button"
              className="banner-slider__nav banner-slider__nav--prev"
              aria-label="Previous letter"
              disabled={!armed}
              onClick={() => go(-1)}
            >
              <svg
                className="banner-slider__nav-icon"
                viewBox="0 0 24 40"
                width="36"
                height="56"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M15 6 L7 20 L15 34"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button
              type="button"
              className="banner-slider__nav banner-slider__nav--next"
              aria-label="Next letter"
              disabled={!armed}
              onClick={() => go(1)}
            >
              <svg
                className="banner-slider__nav-icon"
                viewBox="0 0 24 40"
                width="36"
                height="56"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M9 6 L17 20 L9 34"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

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
            <BannerLede
              reducedMotion={reducedMotion}
              expanded={ledeExpanded}
              onExpandedChange={setLedeExpanded}
            />
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
