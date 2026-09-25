"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CULTURE_PINS, type CulturePin } from "./culturePins";
import "./HomeCultureMap.css";

const TITLE_CLASS =
  "font-display text-center text-[clamp(1.75rem,4vw,2.75rem)] font-bold tracking-tight text-[var(--ink)]";

/**
 * Connecting the Clicks — static map, one pin per office.
 * A pin opens that city's photo folder as a slider.
 */
export default function HomeCultureMap() {
  const [openId, setOpenId] = useState<CulturePin["id"] | null>(null);
  const openPin = CULTURE_PINS.find((pin) => pin.id === openId) ?? null;
  const returnFocus = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => {
    setOpenId(null);
    window.requestAnimationFrame(() => returnFocus.current?.focus());
  }, []);

  return (
    <section
      id="life-culture"
      aria-labelledby="home-life-culture-title"
      className="bg-white"
    >
      <div className="mx-auto w-full max-w-[78rem] px-[clamp(1.25rem,5vw,3rem)] pt-[clamp(3.5rem,8vh,5.5rem)]">
        <h2 id="home-life-culture-title" className={TITLE_CLASS}>
          Connecting the Clicks
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center font-sans text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">
          Five offices, Four time zones, One team
        </p>
      </div>

      <div className="mx-auto mt-[clamp(1.75rem,4vw,2.75rem)] w-full max-w-[78rem] px-[clamp(1.25rem,5vw,3rem)] pb-[clamp(3.5rem,8vh,5.5rem)]">
        <div className="relative overflow-hidden border border-[#dadce0] bg-[#aadaff] shadow-[0_1px_3px_rgba(60,64,67,0.18)]">
          <img
            src="/culture/region-map.svg"
            alt=""
            className="block h-auto w-full"
          />
          <ul className="absolute inset-0 m-0 list-none p-0">
            {CULTURE_PINS.map((pin) => (
              <li
                key={pin.id}
                className="absolute"
                style={{ top: `${pin.top}%`, left: `${pin.left}%` }}
              >
                <MapPin
                  pin={pin}
                  pressed={pin.id === openId}
                  onOpen={(button) => {
                    returnFocus.current = button;
                    setOpenId(pin.id);
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {openPin ? (
        <CultureFolder key={openPin.id} pin={openPin} onClose={close} />
      ) : null}
    </section>
  );
}

function MapPin({
  pin,
  pressed,
  onOpen,
}: {
  pin: CulturePin;
  pressed: boolean;
  onOpen: (button: HTMLButtonElement) => void;
}) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={pressed}
      aria-label={`${pin.label}, open photo folder`}
      onClick={(event) => onOpen(event.currentTarget)}
      className="group -translate-x-1/2 -translate-y-full cursor-pointer border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ink)]"
    >
      <span
        className={`flex size-11 items-center justify-center rounded-full border-2 bg-white font-display text-[0.7rem] font-bold tracking-wide text-[var(--ink)] shadow-[0_8px_18px_rgba(20,20,20,0.28)] transition-transform duration-300 group-hover:scale-105 ${
          pressed ? "border-[var(--brand)]" : "border-white"
        }`}
      >
        {pin.code}
      </span>
      <span
        className={`mx-auto -mt-1.5 block size-2.5 rotate-45 border-2 border-t-0 border-l-0 bg-white ${
          pressed ? "border-[var(--brand)]" : "border-white"
        }`}
        aria-hidden="true"
      />
    </button>
  );
}

function CultureFolder({
  pin,
  onClose,
}: {
  pin: CulturePin;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [index, setIndex] = useState(0);
  const count = pin.slides.length;
  const slide = pin.slides[index];

  const step = useCallback(
    (direction: -1 | 1) => {
      setIndex((current) => (current + direction + count) % count);
    },
    [count],
  );

  useEffect(() => {
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, step]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer border-0 bg-[color-mix(in_oklab,var(--ink)_46%,transparent)]"
        aria-label="Close photo folder"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="culture-popup relative m-0 flex max-h-full w-full max-w-[56rem] flex-col overflow-hidden bg-white shadow-[0_24px_60px_rgba(20,20,20,0.28)]"
      >
        <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <h3
            id={titleId}
            className="font-display text-xl font-bold tracking-tight text-[var(--ink)]"
          >
            {pin.label}
          </h3>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex size-10 cursor-pointer items-center justify-center border border-[color-mix(in_oklab,var(--ink)_16%,transparent)] bg-white text-[var(--ink)] transition-colors duration-300 hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ink)]"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              />
            </svg>
          </button>
        </div>

        <div className="relative mx-5 bg-[#141414] sm:mx-6">
          {slide ? (
            <img
              src={slide.src}
              alt={slide.alt}
              className="aspect-[16/10] max-h-[min(52dvh,32rem)] w-full bg-[#141414] object-contain"
            />
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <p className="m-0 font-sans text-xs tracking-wide text-[var(--ink-muted)]">
            {index + 1} / {count}
          </p>
          <div className="flex gap-2">
            <SliderButton label="Previous photo" onClick={() => step(-1)}>
              <path
                d="M14 6L8 12l6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              />
            </SliderButton>
            <SliderButton label="Next photo" onClick={() => step(1)}>
              <path
                d="M10 6l6 6-6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              />
            </SliderButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-10 cursor-pointer items-center justify-center border border-[color-mix(in_oklab,var(--ink)_16%,transparent)] bg-white text-[var(--ink)] transition-colors duration-300 hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ink)]"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}
