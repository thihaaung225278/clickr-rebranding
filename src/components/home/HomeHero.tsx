"use client";

import dynamic from "next/dynamic";

/**
 * Home first viewport — banner letter slider (client + WebGL).
 * `ssr: false` must live in a Client Component (Next 16).
 */

const BannerLetterSlider = dynamic(() => import("./BannerLetterSlider"), {
  ssr: false,
  loading: () => (
    <section
      aria-labelledby="home-brand"
      className="banner-slider relative isolate flex h-dvh flex-col overflow-hidden"
    >
      <div className="banner-slider__atmosphere" aria-hidden="true" />
      <div className="relative z-10 flex flex-1 items-end px-[5vw] pb-8 pt-10">
        <div className="w-full">
          <h1
            id="home-brand"
            className="font-display text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-none tracking-tight text-[var(--ink)]"
          >
            Clickr
          </h1>
          <p className="mt-4 font-sans text-lg text-[var(--ink-muted)]">
            Loading banner…
          </p>
        </div>
      </div>
    </section>
  ),
});

export default function HomeHero({ armed }: { armed: boolean }) {
  return <BannerLetterSlider armed={armed} />;
}
