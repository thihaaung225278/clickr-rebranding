/**
 * Home location map — flat world map, country pins, photo popup.
 * Country pins open a photo dialog.
 */

import HomeMapStage from "./HomeMapStage";

export default function HomeMap() {
  return (
    <section
      id="visit"
      aria-labelledby="home-map-title"
      className="bg-[var(--surface)]"
    >
      <div className="mx-auto w-full max-w-[78rem] px-[clamp(1.25rem,5vw,3rem)] pt-[clamp(3.5rem,8vh,5.5rem)]">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="home-map-title"
            className="font-display text-[clamp(1.75rem,4vw,2.75rem)] font-bold tracking-tight text-[var(--ink)]"
          >
            Connecting the Clicks
          </h2>
          <p className="mt-4 font-sans text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">
            Where the work clicks, and so do we.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-[clamp(2rem,5vh,3rem)] w-full max-w-[78rem] px-[clamp(1.25rem,5vw,3rem)] pb-[clamp(2.5rem,6vh,4rem)]">
        <HomeMapStage />
      </div>
    </section>
  );
}
