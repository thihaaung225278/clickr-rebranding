"use client";

import { useCallback, useState } from "react";
import BrandCursor from "./BrandCursor";
import HandStrokeIntro from "./HandStrokeIntro";
import HomeHero from "./HomeHero";
import OurServices from "./OurServices";

/**
 * Client bridge: arm the banner letter slide only after the intro overlay is done.
 */
export default function HomeEntry() {
  const [armed, setArmed] = useState(false);
  const handleReady = useCallback(() => setArmed(true), []);

  return (
    <HandStrokeIntro onReady={handleReady}>
      <BrandCursor active={armed} />
      <main className="flex flex-1 flex-col bg-[var(--surface)] text-[var(--ink)]">
        <HomeHero armed={armed} />
        <OurServices />

        <section
          aria-labelledby="home-story"
          className="mx-auto w-full max-w-3xl px-[6vw] py-16 sm:py-20"
        >
          <h2
            id="home-story"
            className="font-display text-2xl font-bold tracking-tight sm:text-3xl"
          >
            A company story in motion
          </h2>
          <p className="mt-3 max-w-xl font-sans text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">
            Walk the corridor from 2009 to 2026 — milestones, eras, and the work
            that shaped Clickr.
          </p>
        </section>
      </main>
    </HandStrokeIntro>
  );
}
