"use client";

import { useCallback, useState } from "react";
import BrandCursor from "./BrandCursor";
import HandStrokeIntro from "./HandStrokeIntro";
import HomeHero from "./HomeHero";
import HomeLetsTalk from "./HomeLetsTalk";
import HomeTimeline from "./HomeTimeline";
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
        <HomeTimeline />
        <HomeLetsTalk />
      </main>
    </HandStrokeIntro>
  );
}
