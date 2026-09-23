"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  HAND_STROKE,
  INTRO_ICONS,
  INTRO_SEQUENCE,
  type IntroGesture,
} from "./handStrokePaths";

const DRAW_MS = 950;
const HOLD_MS = 320;
const FADE_MS = 420;
const MAX_MS = 5500;

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

type Phase = IntroGesture | "fading" | "done";

function isGesture(phase: Phase): phase is IntroGesture {
  return phase === 1 || phase === 2 || phase === "go";
}

type HandStrokeIntroProps = {
  children: ReactNode;
  /** Fires once when the overlay finishes and the page becomes interactive. */
  onReady?: () => void;
};

/**
 * Full-bleed loading: brand stroke hand 1 → 2 → text "GO", then site.
 */
export default function HandStrokeIntro({
  children,
  onReady,
}: HandStrokeIntroProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>(1);
  const [drawKey, setDrawKey] = useState(0);
  const doneRef = useRef(false);
  const readyNotifiedRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setPhase("fading");
    window.setTimeout(() => setPhase("done"), FADE_MS);
  }, []);

  const advanceFrom = useCallback(
    (gesture: IntroGesture) => {
      if (doneRef.current) return;
      const idx = INTRO_SEQUENCE.indexOf(gesture);
      const next = INTRO_SEQUENCE[idx + 1];
      if (next === undefined) {
        finish();
        return;
      }
      setPhase(next);
      setDrawKey((k) => k + 1);
    },
    [finish],
  );

  useEffect(() => {
    const id = window.setTimeout(finish, MAX_MS);
    return () => window.clearTimeout(id);
  }, [finish]);

  useEffect(() => {
    if (!isGesture(phase)) return;
    const delay = reducedMotion ? 160 : DRAW_MS + HOLD_MS;
    const id = window.setTimeout(() => advanceFrom(phase), delay);
    return () => window.clearTimeout(id);
  }, [phase, reducedMotion, advanceFrom]);

  useEffect(() => {
    if (phase === "done") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "done" || readyNotifiedRef.current) return;
    readyNotifiedRef.current = true;
    onReady?.();
  }, [phase, onReady]);

  const showOverlay = phase !== "done";
  const activeGesture: IntroGesture =
    phase === "fading" || phase === "done" ? "go" : phase;
  const icon = INTRO_ICONS[activeGesture];
  const isDrawing = isGesture(phase);
  const drawClass = reducedMotion
    ? " hand-intro__svg--instant"
    : " hand-intro__svg--draw";
  const stepIndex = INTRO_SEQUENCE.indexOf(activeGesture) + 1;
  const isGoText = Boolean(icon.textMode);

  return (
    <div className="hand-intro relative min-h-dvh">
      <div
        className="hand-intro__page"
        aria-hidden={showOverlay ? true : undefined}
        {...(showOverlay ? { inert: true } : {})}
      >
        {children}
      </div>

      {showOverlay ? (
        <div
          className={`hand-intro__overlay${phase === "fading" ? " hand-intro__overlay--out" : ""}`}
          role="status"
          aria-live="polite"
          aria-busy={isDrawing}
          aria-label={`Loading ${icon.label}, step ${stepIndex} of ${INTRO_SEQUENCE.length}`}
        >
          <div className="hand-intro__stage" aria-hidden="true">
            <svg
              key={`${activeGesture}-${drawKey}`}
              className={`hand-intro__svg${isGoText ? " hand-intro__svg--go" : ""}${drawClass}`}
              viewBox={icon.viewBox}
              focusable="false"
            >
              {isGoText ? (
                <text
                  className="hand-intro__go-text"
                  pathLength={1}
                  x="120"
                  y="78"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="none"
                  stroke={HAND_STROKE}
                  strokeWidth={icon.strokeWidth}
                >
                  GO
                </text>
              ) : (
                icon.strokes.map((d, i) => (
                  <path
                    key={i}
                    className="hand-intro__stroke"
                    pathLength={1}
                    d={d}
                    fill="none"
                    stroke={HAND_STROKE}
                    strokeWidth={icon.strokeWidth}
                  />
                ))
              )}
            </svg>
            {!isGoText ? (
              <span className="hand-intro__count font-display">{icon.label}</span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
