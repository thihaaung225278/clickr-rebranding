"use client";

import { useCallback, useState } from "react";
import BrandCursor from "./BrandCursor";
import HandStrokeIntro from "./HandStrokeIntro";
import HomeHero from "./HomeHero";
import HomeFooter from "./HomeFooter";
import HomeLetsTalk from "./HomeLetsTalk";
import HomeMenu from "./HomeMenu";
import HomePlayGame from "./HomePlayGame";
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
      <HomeMenu />
      <main className="flex flex-1 flex-col bg-[var(--surface)] text-[var(--ink)]">
        <HomeHero armed={armed} />
        <OurServices />
        <HomePlayGame />
        <HomeTimeline />
        <HomeLetsTalk />
        <HomePlayGame
          id="play-game-footer"
          titleId="home-play-game-title-footer"
        />
      </main>
      <HomeFooter />
    </HandStrokeIntro>
  );
}
