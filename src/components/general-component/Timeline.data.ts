import type { CorridorTimelineItem, TimelineEra, TimelineHouse } from "./TimelineCorridor";

/**
 * Clickr company timeline seed — 2009–2026 placeholders (18 cards).
 * Replace title / intro / description / image when real milestones are ready.
 */

const CLICKR_ACCENT = "#FF6900" as const;

const START_YEAR = 2009;
const END_YEAR = 2026;

export const timelineAbout =
  "Clickr company timeline (2009–2026). Milestone copy is placeholder — replace when ready." as const;

export const clickrCompanyEras: TimelineEra[] = [
  { id: "founding", label: "Founding", year: 2009 },
  { id: "growth", label: "Growth", year: 2015 },
  { id: "digital", label: "Digital", year: 2020 },
  { id: "today", label: "Today", year: 2026 },
];

export const clickrCompanyHouses: TimelineHouse[] = [
  { id: "clickr", name: "Clickr", accent: CLICKR_ACCENT },
];

export const clickrCompanyTimeline: CorridorTimelineItem[] = Array.from(
  { length: END_YEAR - START_YEAR + 1 },
  (_, i) => {
    const year = START_YEAR + i;
    return {
      id: `clickr-${year}`,
      year,
      endYear: year,
      house: "Clickr",
      role: "milestone" as const,
      date: String(year),
      title: `${year} — Milestone TBD`,
      description: `Placeholder for what Clickr did in ${year}. Replace with the real milestone.`,
      intro: `Placeholder for what Clickr did in ${year}.`,
      accent: CLICKR_ACCENT,
      image:
        year === 2009 ? "/timeline/2009.jpg" : `/timeline/placeholders/${year}.svg`,
      imageCaption:
        year === 2009
          ? "Clickr Media founding team, 2009"
          : `Placeholder art for ${year}`,
    };
  },
);
