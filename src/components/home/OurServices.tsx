"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

/** Diamond point-to-point size in SVG viewBox units (larger 2+3 lattice). */
const S = 100;
const HALF = S / 2;
/**
 * Each lattice edge is a diamond half-diagonal × √2.
 * 1.01 keeps square caps joined so the outline does not stop short.
 */
const STROKE_LEN = HALF * Math.SQRT2 * 1.01;
/** 3 diamonds across bottom → width 3S; two rows → height 1.5S. */
const VB_W = S * 3;
const VB_H = S * 1.5;

type ServiceItem = {
  id: string;
  label: string;
  /** Shorter lines for diamond face (optional). */
  faceLines: string[];
  blurb: string;
  items: string[];
  cx: number;
  cy: number;
};

/**
 * Staggered 2 (top) + 3 (bottom) — fewer cells so each diamond reads larger.
 */
const SERVICES: ServiceItem[] = [
  {
    id: "digital-consulting",
    label: "Digital Consulting",
    faceLines: ["Digital", "Consulting"],
    blurb:
      "We provide insights into your digital landscape and leverage big data and analytics to transform your operating model.",
    items: [
      "Digital Marketing Strategy",
      "Digital Transformation",
      "Website Design and Development",
      "MarTech Enablement",
    ],
    cx: S,
    cy: HALF,
  },
  {
    id: "creative-production",
    label: "Creative Production",
    faceLines: ["Creative", "Production"],
    blurb:
      "From big ideas and campaign concepts to engaging social media content and impactful web design, we craft engaging solutions for your brand and drive conversions.",
    items: [
      "Creative Strategy",
      "Content Creation",
      "Website Design (UX & UI)",
    ],
    cx: S * 2,
    cy: HALF,
  },
  {
    id: "martech-services",
    label: "MarTech Services",
    faceLines: ["MarTech", "Services"],
    blurb:
      "Empowering you to build a robust MarTech stack, integrating advanced SEO, CRM, automation, and data management tools for seamless, personalised experiences across both offline and online channels.",
    items: [
      "Marketing Automation (MA)",
      "Customer Data Platform (CDP)",
      "BI and Analytics",
      "Consent Management Platform (CMP)",
      "CRM",
    ],
    cx: HALF,
    cy: S,
  },
  {
    id: "performance-marketing",
    label: "Performance Marketing",
    faceLines: ["Performance", "Marketing"],
    blurb:
      "Our expertise lets us harness data-driven insights to plan, manage, and optimise media across search, social, video, display, and programmatic—maximising your brand’s impact.",
    items: [
      "Social Media Marketing",
      "Content Marketing",
      "Performance Marketing",
      "SEO",
      "SEM",
      "Conversational Marketing",
      "Account Based Marketing (ABM)",
    ],
    cx: S + HALF,
    cy: S,
  },
  {
    id: "technology-services",
    label: "Technology Services",
    faceLines: ["Technology", "Services"],
    blurb:
      "Our tech team offers an ecosystem of solutions, including front-end and back-end development, UI/UX considerations, and digital transformation to streamline operations and elevate your online presence.",
    items: [
      "CMS",
      "Digital Commerce",
      "Custom Applications",
      "Talent Management",
      "Business Solutions",
    ],
    cx: S * 2 + HALF,
    cy: S,
  },
];

type Pt = readonly [number, number];

function edgeKey(a: Pt, b: Pt): string {
  const [p, q] =
    a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1]) ? [a, b] : [b, a];
  return `${p[0]},${p[1]}|${q[0]},${q[1]}`;
}

/** Unique diamond outline segments for the lattice stroke draw. */
function buildLatticePaths(items: ServiceItem[]): string[] {
  const seen = new Set<string>();
  const paths: string[] = [];

  for (const { cx, cy } of items) {
    const top: Pt = [cx, cy - HALF];
    const right: Pt = [cx + HALF, cy];
    const bottom: Pt = [cx, cy + HALF];
    const left: Pt = [cx - HALF, cy];
    const segs: [Pt, Pt][] = [
      [top, right],
      [right, bottom],
      [bottom, left],
      [left, top],
    ];

    for (const [a, b] of segs) {
      const key = edgeKey(a, b);
      if (seen.has(key)) continue;
      seen.add(key);
      paths.push(`M${a[0]} ${a[1]} L${b[0]} ${b[1]}`);
    }
  }

  return paths;
}

const LATTICE_PATHS = buildLatticePaths(SERVICES);

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

const FILLING_CLASS = "our-services__hit--filling";

/** Arm water-fill; always restarts animation (fixes flaky A→B / re-hover). */
function armFill(hit: HTMLButtonElement) {
  hit.classList.remove(FILLING_CLASS);
  void hit.offsetWidth;
  hit.classList.add(FILLING_CLASS);
}

function disarmFill(hit: HTMLButtonElement) {
  hit.classList.remove(FILLING_CLASS);
}

/**
 * Home "Our Services" — 5 large white diamonds, brand SVG strokes, click → popup.
 * Water-fill is armed via pointer/focus class (restarts reliably on A→B hover).
 */
export default function OurServices() {
  const sectionRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const [inView, setInView] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const active = SERVICES.find((s) => s.id === activeId) ?? null;

  const closePopup = useCallback(() => {
    setActiveId(null);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    if (reducedMotion) {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setInView(true);
        io.disconnect();
      },
      { threshold: 0.28, rootMargin: "0px 0px -8% 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    if (!active) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePopup();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      openerRef.current?.focus();
    };
  }, [active, closePopup]);

  const drawClass = reducedMotion
    ? " our-services__lattice--instant"
    : inView
      ? " our-services__lattice--draw"
      : "";

  return (
    <section
      ref={sectionRef}
      aria-labelledby="our-services-title"
      className={`our-services${inView ? " our-services--in-view" : ""}`}
    >
      <div className="our-services__inner">
        <h2
          id="our-services-title"
          className="our-services__title font-display text-[clamp(1.75rem,4vw,2.75rem)] font-bold tracking-tight text-[var(--ink)]"
        >
          Our Services
        </h2>

        <div className="our-services__stage">
          <ul className="our-services__cells">
            {SERVICES.map((item, index) => (
              <li
                key={item.id}
                className={`our-services__cell${item.cy === HALF ? " our-services__cell--top" : ""}`}
                style={{
                  left: `${((item.cx - HALF) / VB_W) * 100}%`,
                  top: `${((item.cy - HALF) / VB_H) * 100}%`,
                  width: `${(S / VB_W) * 100}%`,
                  height: `${(S / VB_H) * 100}%`,
                }}
              >
                <button
                  type="button"
                  className="our-services__hit"
                  aria-haspopup="dialog"
                  aria-expanded={activeId === item.id}
                  onPointerEnter={(e) => armFill(e.currentTarget)}
                  onPointerLeave={(e) => {
                    const hit = e.currentTarget;
                    // Keep fill while keyboard-focused
                    if (hit.matches(":focus-visible")) return;
                    disarmFill(hit);
                  }}
                  onFocus={(e) => armFill(e.currentTarget)}
                  onBlur={(e) => disarmFill(e.currentTarget)}
                  onClick={(e) => {
                    openerRef.current = e.currentTarget;
                    setActiveId(item.id);
                  }}
                >
                  <span className="our-services__media" aria-hidden="true">
                    <span className="our-services__fill" />
                    <span className="our-services__media-index font-display font-extrabold">
                      {index + 1}
                    </span>
                    <span className="our-services__media-label font-sans">
                      {item.faceLines.map((line) => (
                        <span key={line} className="our-services__media-line">
                          {line}
                        </span>
                      ))}
                    </span>
                  </span>
                  <span className="sr-only">{item.label} — open details</span>
                </button>
              </li>
            ))}
          </ul>

          <svg
            className={`our-services__lattice${drawClass}`}
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
            focusable="false"
            style={{ ["--stroke-len" as string]: STROKE_LEN }}
          >
            {LATTICE_PATHS.map((d, i) => (
              <path
                key={i}
                className="our-services__stroke"
                d={d}
                fill="none"
                stroke="var(--brand)"
                style={{ ["--stroke-i" as string]: i }}
              />
            ))}
          </svg>
        </div>
      </div>

      {active ? (
        <div
          className="our-services__backdrop"
          role="presentation"
          onClick={closePopup}
        >
          <div
            className="our-services__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="our-services__dialog-top">
              <h3
                id={titleId}
                className="our-services__dialog-title font-display"
              >
                {active.label}
              </h3>
              <button
                ref={closeRef}
                type="button"
                className="our-services__dialog-close font-sans"
                aria-label={`Close ${active.label} details`}
                onClick={closePopup}
              >
                Close
              </button>
            </div>
            <div className="our-services__dialog-scroll">
              <p className="our-services__dialog-body font-sans">{active.blurb}</p>
              <ul className="our-services__dialog-list font-sans">
                {active.items.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
