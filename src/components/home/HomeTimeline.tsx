"use client";

import dynamic from "next/dynamic";
import {
  clickrCompanyEras,
  clickrCompanyHouses,
  clickrCompanyTimeline,
  timelineAbout,
} from "@/components/general-component/Timeline.data";

/**
 * Home company timeline — same corridor as `/timeline`.
 * Section title matches Our Services scale; light surface (no black shell).
 * Brand atmosphere lives in the WebGL corridor backdrop (not the title band).
 * `ssr: false` must live in a Client Component (Next 16).
 */

const TITLE_CLASS =
  "font-display text-center text-[clamp(1.75rem,4vw,2.75rem)] font-bold tracking-tight text-[var(--ink)]";

const TimelineCorridor = dynamic(
  () => import("@/components/general-component/TimelineCorridor"),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex min-h-[min(100dvh,40rem)] items-center justify-center bg-[var(--surface)]"
        aria-busy="true"
      >
        <p className="font-sans text-base text-[var(--ink-muted)]">
          Loading corridor…
        </p>
      </div>
    ),
  },
);

export default function HomeTimeline() {
  return (
    <section
      id="company-timeline"
      aria-labelledby="home-timeline-title"
      className="home-timeline bg-white"
    >
      <div className="mx-auto w-full max-w-[78rem] px-[clamp(1.25rem,5vw,3rem)] pt-[clamp(3.5rem,8vh,5.5rem)]">
        <h2
          id="home-timeline-title"
          className={`${TITLE_CLASS} mb-[clamp(1.75rem,4vw,2.75rem)]`}
        >
          Company Timeline
        </h2>
      </div>

      <TimelineCorridor
        about={timelineAbout}
        items={clickrCompanyTimeline}
        eras={clickrCompanyEras}
        houses={clickrCompanyHouses}
        className="min-h-dvh"
      />
    </section>
  );
}
