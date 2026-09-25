"use client";

/**
 * Flat map stage: beige world SVG, CSS zoom, country pins, photo dialog.
 */

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const MAP_STATS = {
  title: "Clickr Media",
  rows: [
    { label: "Number of Offices", value: "1" },
    { label: "Number of Properties", value: "0" },
  ],
} as const;

type CountryPhoto = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

type CountryPin = {
  id: string;
  label: string;
  left: string;
  top: string;
  tone: "dark" | "light";
  /**
   * 3–4 office photos. Drop files in `public/map/countries/<id>/`
   * and list them here. Empty → “Photos coming soon”.
   */
  photos: readonly CountryPhoto[];
};

/** Approximate % positions on world-light.svg (viewBox 950×620). */
const PINS: readonly CountryPin[] = [
  {
    id: "japan",
    label: "Japan",
    left: "87.4%",
    top: "33.5%",
    tone: "dark",
    photos: [],
  },
  {
    id: "myanmar",
    label: "Myanmar",
    left: "72.8%",
    top: "42.2%",
    tone: "light",
    photos: [],
  },
  {
    id: "vietnam",
    label: "Vietnam",
    left: "78.6%",
    top: "44.2%",
    tone: "dark",
    photos: [],
  },
  {
    id: "malaysia",
    label: "Malaysia",
    left: "77.1%",
    top: "50.2%",
    tone: "light",
    photos: [],
  },
  {
    id: "singapore",
    label: "Singapore",
    left: "78.2%",
    top: "53.6%",
    tone: "dark",
    photos: [],
  },
];

const ZOOM_MIN = 1.05;
const ZOOM_MAX = 3.6;
const ZOOM_STEP = 0.35;
const ZOOM_DEFAULT = 1.55;

/**
 * Origin on the right edge pulls Japan off the zoom controls
 * while mainland Southeast Asia stays in frame.
 */
const MAP_ORIGIN = "100% 25%";

function TeardropPin({ tone }: { tone: "dark" | "light" }) {
  const body = tone === "dark" ? "#5c5550" : "#c4beb6";
  const dot = tone === "dark" ? "#ffffff" : "#5c5550";
  return (
    <svg
      viewBox="0 0 24 36"
      className="h-[1.85rem] w-[1.25rem] drop-shadow-sm sm:h-[2.1rem] sm:w-[1.4rem]"
      aria-hidden="true"
    >
      <path
        d="M12 0C5.373 0 0 5.373 0 12c0 8.284 12 24 12 24s12-15.716 12-24C24 5.373 18.627 0 12 0z"
        fill={body}
      />
      <circle cx="12" cy="11.5" r="4.25" fill={dot} />
    </svg>
  );
}

function Chevron({ direction }: { direction: "prev" | "next" }) {
  const d = direction === "prev" ? "M15 6 L7 20 L15 34" : "M9 6 L17 20 L9 34";
  return (
    <svg viewBox="0 0 24 40" className="h-5 w-3" aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HomeMapStage() {
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const active = PINS.find((pin) => pin.id === activeId) ?? null;
  const photoCount = active?.photos.length ?? 0;
  const photo = active && photoCount > 0 ? active.photos[slide] : undefined;

  const closePopup = useCallback(() => {
    setActiveId(null);
    setSlide(0);
  }, []);

  const openPin = (pinId: string, opener: HTMLButtonElement) => {
    openerRef.current = opener;
    setSlide(0);
    setActiveId(pinId);
  };

  const stepSlide = useCallback(
    (delta: number) => {
      if (photoCount < 2) return;
      setSlide((current) => Math.min(photoCount - 1, Math.max(0, current + delta)));
    },
    [photoCount],
  );

  useEffect(() => {
    if (!active) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePopup();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        stepSlide(1);
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepSlide(-1);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const nodes = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          "button:not(:disabled), a[href]",
        ),
      );
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const current = document.activeElement;

      if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      openerRef.current?.focus();
    };
  }, [active, closePopup, stepSlide]);

  function zoomIn() {
    setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)));
  }

  function zoomOut() {
    setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)));
  }

  return (
    <div className="relative aspect-[16/10] w-full min-h-[min(22rem,70vh)] overflow-hidden rounded-[clamp(1rem,3vw,1.75rem)] bg-[#eceef0] sm:min-h-[28rem]">
      {/* Soft edge vignette (globe-like mask feel) */}
      <div
        className="pointer-events-none absolute inset-0 z-30 rounded-[inherit] shadow-[inset_0_0_4rem_1.25rem_#eceef0]"
        aria-hidden="true"
      />

      <div
        className="absolute inset-[-8%] flex items-center justify-center transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: MAP_ORIGIN,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative SVG map asset */}
        <img
          src="/map/world-light.svg"
          alt=""
          draggable={false}
          className="h-auto w-full max-w-none select-none"
        />

        {PINS.map((pin) => (
          <button
            key={pin.id}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={activeId === pin.id}
            aria-label={`Open ${pin.label} photos`}
            onClick={(event) => openPin(pin.id, event.currentTarget)}
            className="absolute z-10 -translate-x-1/2 -translate-y-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
            style={{ left: pin.left, top: pin.top }}
          >
            <TeardropPin tone={pin.tone} />
          </button>
        ))}
      </div>

      {/* Stats card */}
      <aside
        aria-label={`${MAP_STATS.title} presence`}
        className="pointer-events-none absolute left-[clamp(0.75rem,3vw,1.5rem)] top-[clamp(0.75rem,3vw,1.5rem)] z-40 w-[min(14.5rem,72%)] rounded-lg bg-white px-[clamp(0.85rem,2.5vw,1.15rem)] py-[clamp(0.75rem,2vw,1rem)] shadow-[0_6px_20px_color-mix(in_oklab,var(--ink)_14%,transparent)] sm:w-[15.5rem]"
      >
        <p className="font-display text-[clamp(0.95rem,2.2vw,1.05rem)] font-bold leading-tight text-[var(--brand)]">
          {MAP_STATS.title}
        </p>
        <div
          className="mt-2.5 border-t border-[color-mix(in_oklab,var(--ink)_12%,transparent)]"
          aria-hidden="true"
        />
        <dl className="mt-3 space-y-3">
          {MAP_STATS.rows.map((row) => (
            <div key={row.label}>
              <dt className="font-sans text-[0.75rem] leading-snug text-[var(--ink-muted)] sm:text-[0.8125rem]">
                {row.label}
              </dt>
              <dd className="mt-0.5 font-display text-[clamp(1.35rem,3vw,1.65rem)] font-bold leading-none tracking-tight text-[var(--ink)]">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </aside>

      {/* Zoom controls */}
      <div
        className="absolute right-[clamp(0.75rem,3vw,1.25rem)] top-[clamp(0.75rem,3vw,1.25rem)] z-40 flex flex-col overflow-hidden rounded-md border border-[color-mix(in_oklab,var(--ink)_14%,transparent)] bg-white shadow-[0_2px_8px_color-mix(in_oklab,var(--ink)_8%,transparent)]"
        role="group"
        aria-label="Map zoom"
      >
        <button
          type="button"
          onClick={zoomIn}
          disabled={zoom >= ZOOM_MAX}
          aria-label="Zoom in"
          className="flex size-9 items-center justify-center font-sans text-lg leading-none text-[var(--ink)] transition-colors hover:bg-[color-mix(in_oklab,var(--ink)_5%,white)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ink)]"
        >
          +
        </button>
        <div
          className="h-px w-full bg-[color-mix(in_oklab,var(--ink)_12%,transparent)]"
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={zoomOut}
          disabled={zoom <= ZOOM_MIN}
          aria-label="Zoom out"
          className="flex size-9 items-center justify-center font-sans text-lg leading-none text-[var(--ink)] transition-colors hover:bg-[color-mix(in_oklab,var(--ink)_5%,white)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ink)]"
        >
          −
        </button>
      </div>

      {active ? (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-[color-mix(in_oklab,var(--ink)_38%,transparent)] p-[clamp(0.75rem,3vw,1.25rem)]"
          role="presentation"
          onClick={closePopup}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="flex max-h-full w-full max-w-[28rem] flex-col overflow-y-auto rounded-lg bg-white px-[clamp(0.9rem,2.5vw,1.25rem)] py-[clamp(0.85rem,2vw,1.15rem)] shadow-[0_12px_32px_color-mix(in_oklab,var(--ink)_22%,transparent)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3
                id={titleId}
                className="font-display text-[clamp(1.15rem,2.5vw,1.4rem)] font-bold leading-tight text-[var(--brand)]"
              >
                {active.label}
              </h3>
              <button
                ref={closeRef}
                type="button"
                onClick={closePopup}
                aria-label={`Close ${active.label} photos`}
                className="shrink-0 rounded-md px-2 py-1 font-sans text-sm text-[var(--ink)] hover:bg-[color-mix(in_oklab,var(--ink)_5%,white)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
              >
                Close
              </button>
            </div>

            {photo ? (
              <div className="mt-3">
                <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-[var(--surface)]">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(max-width: 40rem) 90vw, 28rem"
                    className="object-cover"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => stepSlide(-1)}
                    disabled={slide === 0}
                    aria-label="Previous photo"
                    className="inline-flex size-9 items-center justify-center rounded-full bg-[var(--brand)] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
                  >
                    <Chevron direction="prev" />
                  </button>
                  <p
                    className="font-sans text-sm tabular-nums text-[var(--ink-muted)]"
                    aria-live="polite"
                  >
                    {slide + 1} / {photoCount}
                  </p>
                  <button
                    type="button"
                    onClick={() => stepSlide(1)}
                    disabled={slide >= photoCount - 1}
                    aria-label="Next photo"
                    className="inline-flex size-9 items-center justify-center rounded-full bg-[var(--brand)] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
                  >
                    <Chevron direction="next" />
                  </button>
                </div>
                <div
                  className="mt-3 flex justify-center gap-1.5"
                  role="group"
                  aria-label={`${active.label} photos`}
                >
                  {active.photos.map((item, index) => (
                    <button
                      key={item.src}
                      type="button"
                      aria-label={`Photo ${index + 1} of ${photoCount}`}
                      aria-current={index === slide ? "true" : undefined}
                      onClick={() => setSlide(index)}
                      className={`size-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] ${
                        index === slide
                          ? "bg-[var(--brand)]"
                          : "bg-[color-mix(in_oklab,var(--ink)_22%,transparent)]"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 font-sans text-sm leading-relaxed text-[var(--ink-muted)]">
                Photos coming soon
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
