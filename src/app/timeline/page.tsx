import TimelineCorridor from "@/components/general-component/TimelineCorridor";
import {
  clickrCompanyEras,
  clickrCompanyHouses,
  clickrCompanyTimeline,
  timelineAbout,
} from "@/components/general-component/Timeline.data";

export default function TimelinePage() {
  return (
    <main className="min-h-dvh bg-white text-[var(--ink)]">
      <div className="mx-auto w-full max-w-[78rem] px-[clamp(1.25rem,5vw,3rem)] pt-[clamp(3.5rem,8vh,5.5rem)]">
        <h1 className="mb-[clamp(1.75rem,4vw,2.75rem)] text-center font-display text-[clamp(1.75rem,4vw,2.75rem)] font-bold tracking-tight text-[var(--ink)]">
          Company Timeline
        </h1>
      </div>
      <TimelineCorridor
        about={timelineAbout}
        items={clickrCompanyTimeline}
        eras={clickrCompanyEras}
        houses={clickrCompanyHouses}
        className="min-h-dvh"
      />
    </main>
  );
}
