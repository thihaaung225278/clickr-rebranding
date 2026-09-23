import TimelineCorridor from "@/components/general-component/TimelineCorridor";
import {
  clickrCompanyEras,
  clickrCompanyHouses,
  clickrCompanyTimeline,
  timelineAbout,
} from "@/components/general-component/Timeline.data";

export default function TimelinePage() {
  return (
    <main className="min-h-dvh bg-[#212121]">
      <TimelineCorridor
        title="Clickr — Company Timeline"
        about={timelineAbout}
        items={clickrCompanyTimeline}
        eras={clickrCompanyEras}
        houses={clickrCompanyHouses}
        className="min-h-dvh"
      />
    </main>
  );
}
