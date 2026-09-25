"use client";

/**
 * WebGL FPS corridor timeline + DOM chrome.
 * Port of html-components/timeline (clean Three.js rewrite — not ChronoFlo proprietary JS).
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { TimelineItem } from "./Timeline";
import {
  CARD_TEXTURE_REV,
  createCorridor3D,
  type Corridor3DHandle,
  type Corridor3DItem,
} from "./corridor3d";
import "./TimelineCorridor.css";

export type MonarchRole = "king" | "queen" | "milestone";
type CorridorView = "corridor" | "list";
type ToolsTab = "search" | "zoom";

export interface CorridorTimelineItem extends TimelineItem {
  year: number;
  endYear?: number;
  house: string;
  role: MonarchRole;
  /** Short body copy for cards / panel (falls back to description). */
  intro?: string;
  accent?: string;
  image?: string;
  imageCaption?: string;
}

export interface TimelineEra {
  id: string;
  label: string;
  year: number;
}

export interface TimelineHouse {
  id: string;
  name: string;
  accent: string;
}

export interface TimelineCorridorProps {
  items: CorridorTimelineItem[];
  eras?: TimelineEra[];
  houses?: TimelineHouse[];
  title?: string;
  about?: string;
  className?: string;
}

const VISIBLE_AHEAD = 6;
const VISIBLE_BEHIND = 2;
const DEPTH_STEP = 250;
const Y_STEP = 42;
const LANE_COUNT = 3;
/** CSS px offsets for L / C / R — mirrors WebGL LANE_X. */
const LANE_X_PX = [-168, 0, 168] as const;

const FALLBACK_PALETTE = [
  "#7a1f2b",
  "#c45c26",
  "#2f5f9b",
  "#2f7a4a",
  "#6a4c9a",
  "#c2185b",
  "#1f8a7a",
  "#b71c1c",
] as const;

function houseAccent(house: string, index: number, houses?: TimelineHouse[]): string {
  const named = houses?.find((h) => h.name === house)?.accent;
  if (named) return named;
  return FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

function initials(title: string): string {
  const stop = new Set(["the", "of", "and", "a", "an"]);
  return title
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .filter((w) => w && !stop.has(w.toLowerCase()))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

function Portrait({
  item,
  className,
}: {
  item: CorridorTimelineItem;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!item.image || failed) {
    return (
      <div
        className={`card-media-fallback ${className ?? ""}`}
        style={{ color: item.accent || "rgba(255,255,255,0.35)" }}
      >
        {initials(item.title) || "?"}
      </div>
    );
  }
  const src =
    item.image.includes("wikimedia.org")
      ? `/api/img?url=${encodeURIComponent(item.image)}`
      : item.image;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- proxied Wikimedia for canvas/list parity
    <img
      src={src}
      alt=""
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

function toCorridor3DItem(item: CorridorTimelineItem, accent: string): Corridor3DItem {
  return {
    id: item.id,
    title: item.title,
    year: item.year,
    endYear: item.endYear,
    house: item.house,
    intro: item.intro ?? item.description,
    accent: item.accent ?? accent,
    image: item.image,
  };
}

export default function TimelineCorridor({
  items,
  eras = [],
  houses,
  title,
  about,
  className = "",
}: TimelineCorridorProps) {
  const reducedMotion = usePrefersReducedMotion();
  const webglRef = useRef<HTMLDivElement>(null);
  const corridorRef = useRef<HTMLElement>(null);
  const fpsRef = useRef<Corridor3DHandle | null>(null);
  const listActiveRowRef = useRef<HTMLButtonElement | null>(null);
  const itemsKeyRef = useRef("");
  const wheelLock = useRef(false);
  const activeIndexRef = useRef(0);

  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);
  const [query, setQuery] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [view, setView] = useState<CorridorView>("corridor");
  const [depthZoom, setDepthZoom] = useState(1);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [toolsTab, setToolsTab] = useState<ToolsTab>("search");
  const [panelOpen, setPanelOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [useWebGL, setUseWebGL] = useState(false);
  const [hoverTipId, setHoverTipId] = useState<string | null>(null);

  const houseList = useMemo(() => {
    if (houses?.length) {
      return houses.map((h) => ({ house: h.name, color: h.accent }));
    }
    const seen = new Map<string, string>();
    items.forEach((item, index) => {
      if (!seen.has(item.house)) {
        seen.set(item.house, houseAccent(item.house, index));
      }
    });
    return Array.from(seen.entries()).map(([house, color]) => ({ house, color }));
  }, [items, houses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const intro = item.intro ?? item.description;
      return (
        item.title.toLowerCase().includes(q) ||
        item.house.toLowerCase().includes(q) ||
        intro.toLowerCase().includes(q) ||
        String(item.year).includes(q)
      );
    });
  }, [items, query]);

  const clampIndex = useCallback(
    (next: number) => Math.max(0, Math.min(Math.max(filtered.length - 1, 0), next)),
    [filtered.length],
  );

  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setActiveIndex(0);
    setHoverTipId(null);
  }

  const step = useCallback(
    (delta: 1 | -1) => {
      setActiveIndex((prev) => clampIndex(prev + delta));
    },
    [clampIndex],
  );

  const active = filtered[activeIndex];

  const yearRange = useMemo(() => {
    if (filtered.length === 0) return { min: 0, max: 1 };
    const years = filtered.map((item) => item.year);
    return { min: Math.min(...years), max: Math.max(...years) };
  }, [filtered]);

  const scrubRatio =
    active && yearRange.max > yearRange.min
      ? (active.year - yearRange.min) / (yearRange.max - yearRange.min)
      : 0;

  const isCompanyTimeline = useMemo(
    () =>
      filtered.length > 0 &&
      filtered.every((item) => item.role === "milestone"),
    [filtered],
  );

  const activeAccent = active
    ? (active.accent ??
      houseList.find((entry) => entry.house === active.house)?.color ??
      houseAccent(active.house, activeIndex, houses))
    : "#FF6900";

  const fpsItems = useMemo(
    () =>
      filtered.map((item, index) =>
        toCorridor3DItem(
          item,
          item.accent ?? houseAccent(item.house, index, houses),
        ),
      ),
    [filtered, houses],
  );

  // Mount WebGL corridor once.
  useEffect(() => {
    const el = webglRef.current;
    if (!el) return;

    let handle: Corridor3DHandle | null = null;
    try {
      handle = createCorridor3D(el, {
        reducedMotion,
        onSelect: (index) => {
          setActiveIndex(index);
          setPanelOpen(true);
        },
      });
      fpsRef.current = handle;
      // External WebGL capability — notify React after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- WebGL init result
      setUseWebGL(true);
    } catch (err) {
      console.warn("WebGL corridor unavailable — CSS fallback", err);
      fpsRef.current = null;
      setUseWebGL(false);
    }

    return () => {
      handle?.dispose();
      fpsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, []);

  // Sync FPS scene with filtered items / index / zoom / view.
  useEffect(() => {
    const fps = fpsRef.current;
    if (!fps || !useWebGL) return;
    const key = fpsItems
      .map(
        (item) =>
          `${item.id}:${item.image ?? ""}:${item.accent ?? ""}:${CARD_TEXTURE_REV}`,
      )
      .join(",");
    if (key !== itemsKeyRef.current) {
      itemsKeyRef.current = key;
      fps.setItems(fpsItems);
    }
    fps.setActiveIndex(activeIndex);
    fps.setDepthZoom(depthZoom);
    fps.setPaused(view !== "corridor");
  }, [fpsItems, activeIndex, depthZoom, view, useWebGL]);

  // Wheel + keyboard on corridor / webgl stage.
  // Keep the page still until every card has been stepped. Release only
  // at the last card (scroll down) or the first card (scroll up).
  // Lock ticks and sub-threshold deltas still preventDefault so a trackpad
  // fling cannot advance the document mid-timeline.
  useEffect(() => {
    if (view !== "corridor" || filtered.length === 0) return;

    const lastIndex = filtered.length - 1;

    const onWheel = (event: WheelEvent) => {
      if (event.deltaY === 0) return;

      const direction: 1 | -1 = event.deltaY > 0 ? 1 : -1;
      const index = activeIndexRef.current;
      const releasePage =
        (direction === 1 && index >= lastIndex) ||
        (direction === -1 && index <= 0);
      if (releasePage) return;

      event.preventDefault();
      if (panelOpen) return;
      if (Math.abs(event.deltaY) < 8 || wheelLock.current) return;

      wheelLock.current = true;
      step(direction);
      window.setTimeout(() => {
        wheelLock.current = false;
      }, reducedMotion ? 60 : 200);
    };

    const onKey = (event: KeyboardEvent) => {
      if (panelOpen) return;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      } else if (event.key === "Home") {
        event.preventDefault();
        setActiveIndex(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setActiveIndex(lastIndex);
      } else if (event.key === "Enter") {
        event.preventDefault();
        setPanelOpen(true);
      }
    };

    const corridor = corridorRef.current;
    const webgl = webglRef.current;
    corridor?.addEventListener("wheel", onWheel, { passive: false });
    webgl?.addEventListener("wheel", onWheel, { passive: false });
    corridor?.addEventListener("keydown", onKey);
    return () => {
      corridor?.removeEventListener("wheel", onWheel);
      webgl?.removeEventListener("wheel", onWheel);
      corridor?.removeEventListener("keydown", onKey);
    };
  }, [filtered.length, step, reducedMotion, view, panelOpen]);

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (hoverTipId) setHoverTipId(null);
      else if (panelOpen) setPanelOpen(false);
      else if (aboutOpen) setAboutOpen(false);
      else if (toolsOpen) setToolsOpen(false);
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [hoverTipId, panelOpen, aboutOpen, toolsOpen]);

  // List view: keep the active row in the scrollport when scrubber/era/HUD changes index.
  useEffect(() => {
    if (view !== "list") return;
    const row = listActiveRowRef.current;
    if (!row) return;
    row.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [activeIndex, view, reducedMotion, filtered.length]);

  const jumpToYear = (year: number) => {
    let best = 0;
    let bestDist = Infinity;
    filtered.forEach((item, index) => {
      const dist = Math.abs(item.year - year);
      if (dist < bestDist) {
        bestDist = dist;
        best = index;
      }
    });
    setActiveIndex(best);
  };

  const runSearch = () => {
    setQuery(searchDraft);
  };

  const searchMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return filtered.slice(0, 8);
    return filtered
      .filter((item) => {
        const intro = item.intro ?? item.description;
        return (
          item.title.toLowerCase().includes(q) ||
          item.house.toLowerCase().includes(q) ||
          intro.toLowerCase().includes(q) ||
          String(item.year).includes(q)
        );
      })
      .slice(0, 8);
  }, [filtered, query]);

  const activeEraId = useMemo(() => {
    if (!active || eras.length === 0) return null;
    let best: TimelineEra | null = null;
    for (const era of eras) {
      if (era.year <= active.year) best = era;
    }
    return best?.id ?? null;
  }, [active, eras]);

  const hoverTip = useMemo(
    () =>
      hoverTipId
        ? (filtered.find((item) => item.id === hoverTipId) ?? null)
        : null,
    [filtered, hoverTipId],
  );

  const hoverTipLeftPct = useMemo(() => {
    if (!hoverTip || yearRange.max <= yearRange.min) return 50;
    const ratio =
      ((hoverTip.year - yearRange.min) / (yearRange.max - yearRange.min)) *
      100;
    // Clamp so the card stays inside the track at the ends.
    return Math.min(92, Math.max(8, ratio));
  }, [hoverTip, yearRange]);

  const visibleCssCards = filtered
    .map((item, index) => ({ item, index, distance: index - activeIndex }))
    .filter(
      ({ distance }) =>
        distance >= -VISIBLE_BEHIND && distance <= VISIBLE_AHEAD,
    );

  return (
    <div
      className={`tl-root ${className}`.trim()}
      style={{ ["--accent" as string]: activeAccent } as CSSProperties}
      aria-label={title ?? "Company timeline"}
    >
      <header
        className={`tl-header${title ? "" : " tl-header--actions-only"}`.trim()}
      >
        {title ? (
          <div className="tl-brand">
            <span className="tl-brand-mark">{title}</span>
          </div>
        ) : null}
        <div className="tl-header-actions">
          <button type="button" onClick={() => setAboutOpen(true)}>
            About this timeline
          </button>
          <div className="view-toggle" role="group" aria-label="Timeline view">
            <button
              type="button"
              aria-pressed={view === "corridor"}
              onClick={() => setView("corridor")}
              title="Corridor"
            >
              Corridor
            </button>
            <button
              type="button"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
              title="List"
            >
              List
            </button>
          </div>
        </div>
      </header>

      <main className="tl-main">
        <div className="tl-atmosphere" aria-hidden="true" />

        <div
          ref={webglRef}
          className={`webgl-stage${useWebGL && view === "corridor" ? " is-active" : ""}`}
          aria-hidden="true"
          style={{
            visibility: useWebGL && view === "corridor" ? "visible" : "hidden",
          }}
        />

        <section
          ref={corridorRef}
          className={`corridor${useWebGL ? " has-webgl" : ""}`}
          tabIndex={0}
          aria-label="Corridor timeline. Use arrow keys or scroll to move through monarchs."
          style={{ visibility: view === "corridor" ? "visible" : "hidden" }}
        >
          {!useWebGL && view === "corridor" ? (
            <div className="corridor-stage">
              {visibleCssCards.map(({ item, index, distance }) => {
                const accent =
                  item.accent ??
                  houseList.find((h) => h.house === item.house)?.color ??
                  houseAccent(item.house, index, houses);
                const z = -distance * DEPTH_STEP * depthZoom;
                const y = distance * (Y_STEP + 10);
                const x = LANE_X_PX[((index % LANE_COUNT) + LANE_COUNT) % LANE_COUNT];
                const scale =
                  Math.max(0.42, 1 - Math.abs(distance) * 0.09) * depthZoom;
                const opacity =
                  distance < 0
                    ? Math.max(0.2, 0.45 + distance * 0.08)
                    : Math.max(0.22, 1 - distance * 0.11);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`corridor-card${index === activeIndex ? " is-active" : ""}`}
                    style={
                      {
                        "--card-accent": accent,
                        transform: `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), ${z}px) scale(${scale})`,
                        opacity,
                        zIndex: 100 - Math.abs(distance),
                        filter:
                          distance === 0
                            ? "none"
                            : `blur(${Math.min(3, Math.abs(distance) * 0.4)}px)`,
                      } as CSSProperties
                    }
                    aria-current={index === activeIndex ? "true" : undefined}
                    onClick={() => {
                      setActiveIndex(index);
                      setPanelOpen(true);
                    }}
                  >
                    <div className="corridor-card-inner">
                      <p className="card-house">
                        {item.endYear && item.endYear !== item.year
                          ? `${item.year} - ${item.endYear}`
                          : item.year}
                      </p>
                      <div className="corridor-card-body">
                        <div className="card-media">
                          <Portrait item={item} />
                        </div>
                        <h2 className="card-title">{item.title}</h2>
                        <p className="card-year">
                          {item.endYear && item.endYear !== item.year
                            ? `${item.year} - ${item.endYear}`
                            : item.year}
                        </p>
                        <p className="card-intro">{item.intro ?? item.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </section>

        {view === "corridor" ? (
          <>
            <button
              type="button"
              className="brand-side-fill hud hud-nav hud-nav-prev"
              aria-label={isCompanyTimeline ? "Previous milestone" : "Previous monarch"}
              disabled={activeIndex <= 0}
              onClick={() => step(-1)}
            >
              <svg
                className="hud-nav-icon"
                viewBox="0 0 24 40"
                width="36"
                height="56"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M15 6 L7 20 L15 34"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="brand-side-fill hud hud-nav hud-nav-next"
              aria-label={isCompanyTimeline ? "Next milestone" : "Next monarch"}
              disabled={activeIndex >= filtered.length - 1}
              onClick={() => step(1)}
            >
              <svg
                className="hud-nav-icon"
                viewBox="0 0 24 40"
                width="36"
                height="56"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M9 6 L17 20 L9 34"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <p className="hud hud-hint">
              {useWebGL
                ? "Scroll ← → ··· click a portrait for details"
                : "Scroll ← → ··· click a card for details"}
            </p>
          </>
        ) : null}

        <div
          className={`list-view${view === "list" ? " is-visible" : ""}`}
          hidden={view !== "list"}
        >
          <ul>
            {filtered.map((item, index) => {
              const accent =
                item.accent ??
                houseList.find((h) => h.house === item.house)?.color ??
                houseAccent(item.house, index, houses);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    ref={index === activeIndex ? listActiveRowRef : undefined}
                    className={index === activeIndex ? "is-active" : ""}
                    style={{ ["--card-accent" as string]: accent } as CSSProperties}
                    onClick={() => {
                      setActiveIndex(index);
                      setPanelOpen(true);
                    }}
                  >
                    <div className="list-thumb">
                      <Portrait item={item} />
                    </div>
                    <div className="list-meta">
                      <h3>{item.title}</h3>
                      <p>
                        {item.year} · {item.house}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="tools">
          <button
            type="button"
            className="brand-side-fill tools-launch tools-launch-search"
            aria-expanded={toolsOpen}
            aria-controls="tools-panel"
            title="Search tools"
            onClick={() => {
              setToolsTab("search");
              setToolsOpen((o) => !o);
            }}
          >
            <svg
              className="tools-launch-icon"
              viewBox="0 0 24 24"
              width="22"
              height="22"
              aria-hidden="true"
              focusable="false"
            >
              <circle
                cx="10.5"
                cy="10.5"
                r="6.25"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.35"
              />
              <path
                d="M15.75 15.75 20.25 20.25"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.35"
                strokeLinecap="round"
              />
            </svg>
            <span className="sr-only">Search</span>
          </button>
          <div
            id="tools-panel"
            className={`tools-panel${toolsOpen ? " is-open" : ""}`}
            role="dialog"
            aria-label="Timeline tools"
          >
            <div className="tools-tabs" role="tablist">
              {(
                [
                  ["search", "Search"],
                  ["zoom", "Zoom"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={toolsTab === id}
                  onClick={() => setToolsTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div
              className={`tools-block${toolsTab === "search" ? " is-active" : ""}`}
              role="tabpanel"
              hidden={toolsTab !== "search"}
            >
              <label htmlFor="tl-search-input">Search</label>
              <div className="tools-search">
                <input
                  id="tl-search-input"
                  type="search"
                  placeholder="Name, house, year…"
                  autoComplete="off"
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runSearch();
                  }}
                />
                <button type="button" onClick={runSearch}>
                  Go
                </button>
              </div>
              <div className="tools-result">
                <p>
                  {filtered.length} match{filtered.length === 1 ? "" : "es"}
                </p>
                {searchMatches.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => {
                      const idx = filtered.findIndex((e) => e.id === ev.id);
                      if (idx >= 0) setActiveIndex(idx);
                      setPanelOpen(true);
                    }}
                  >
                    {ev.year} — {ev.title}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`tools-block${toolsTab === "zoom" ? " is-active" : ""}`}
              role="tabpanel"
              hidden={toolsTab !== "zoom"}
            >
              <label htmlFor="tl-zoom-range">Depth zoom</label>
              <input
                className="zoom-slider"
                id="tl-zoom-range"
                type="range"
                min={0.7}
                max={1.35}
                step={0.05}
                value={depthZoom}
                onChange={(e) => setDepthZoom(Number(e.target.value) || 1)}
              />
            </div>
          </div>
        </aside>

        <div
          className={`panel-backdrop${panelOpen ? " is-open" : ""}`}
          hidden={!panelOpen}
          onClick={() => setPanelOpen(false)}
        />
        <article
          className={`detail-panel${panelOpen ? " is-open" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-title"
          hidden={!panelOpen}
          style={{ ["--card-accent" as string]: activeAccent } as CSSProperties}
        >
          {active ? (
            <>
              <div className="detail-top">
                <span>{active.year}</span>
                <button
                  type="button"
                  className="detail-close"
                  aria-label="Close detail"
                  onClick={() => setPanelOpen(false)}
                />
              </div>
              <div className="detail-body">
                <div className="detail-image">
                  <Portrait item={active} />
                </div>
                <div className="detail-copy">
                  <p className="house">{active.house}</p>
                  <h2 id="detail-title">{active.title}</h2>
                  <p className="years">
                    {active.endYear
                      ? `${active.year} – ${active.endYear}`
                      : `From ${active.year}`}
                  </p>
                  <p className="intro">{active.intro ?? active.description}</p>
                  {active.imageCaption ? (
                    <p className="credit">{active.imageCaption}</p>
                  ) : null}
                </div>
              </div>
              <div className="detail-footer">
                <button
                  type="button"
                  disabled={activeIndex <= 0}
                  onClick={() => step(-1)}
                >
                  ‹ Previous
                </button>
                <span>
                  {activeIndex + 1} of {filtered.length}
                </span>
                <button
                  type="button"
                  disabled={activeIndex >= filtered.length - 1}
                  onClick={() => step(1)}
                >
                  Next ›
                </button>
              </div>
            </>
          ) : null}
        </article>

        <div
          className={`about-modal${aboutOpen ? " is-open" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="about-heading"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAboutOpen(false);
          }}
        >
          <div className="about-card">
            <h2 id="about-heading">About this timeline</h2>
            <p>
              {about ??
                "Interactive timeline sandbox recreation inspired by ChronoFlo’s first-person corridor."}
            </p>
            <p>
              WebGL via Three.js — own implementation (no proprietary ChronoFlo
              runtime).
            </p>
            <button
              type="button"
              className="about-close"
              onClick={() => setAboutOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      </main>

      <footer className="tl-scale">
        <div
          className="scale-track"
          role="slider"
          tabIndex={0}
          aria-label="Timeline position"
          aria-valuemin={yearRange.min}
          aria-valuemax={yearRange.max}
          aria-valuenow={active?.year ?? yearRange.min}
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const ratio = Math.min(
              1,
              Math.max(0, (event.clientX - rect.left) / rect.width),
            );
            const year = Math.round(
              yearRange.min + ratio * (yearRange.max - yearRange.min),
            );
            jumpToYear(year);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight" || event.key === "ArrowDown") {
              event.preventDefault();
              step(1);
            } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
              event.preventDefault();
              step(-1);
            }
          }}
        >
          <div className="scale-base" />
          <div
            className="scale-viewport"
            style={{
              left: `${Math.max(0, scrubRatio * 100 - 4)}%`,
              width: "8%",
            }}
            aria-hidden
          />
          <div className="scale-eras" aria-label="Historical eras">
            {eras.map((era) => {
              const ratio =
                yearRange.max > yearRange.min
                  ? (era.year - yearRange.min) / (yearRange.max - yearRange.min)
                  : 0;
              if (ratio < 0 || ratio > 1) return null;
              const isActive = era.id === activeEraId;
              return (
                <button
                  key={era.id}
                  type="button"
                  className={`scale-era${isActive ? " is-active" : ""}`}
                  style={{ left: `${ratio * 100}%` }}
                  title={`${era.label} (${era.year})`}
                  aria-label={`Jump to ${era.label}, ${era.year}`}
                  aria-current={isActive ? "true" : undefined}
                  onClick={(event) => {
                    event.stopPropagation();
                    jumpToYear(era.year);
                  }}
                >
                  <span className="scale-era-year">{era.year}</span>
                  <span className="scale-era-tick" aria-hidden />
                  <span className="scale-era-label">{era.label}</span>
                </button>
              );
            })}
          </div>
          <div className="scale-stars">
            {filtered.map((item, index) => {
              const ratio =
                yearRange.max > yearRange.min
                  ? (item.year - yearRange.min) /
                    (yearRange.max - yearRange.min)
                  : 0;
              const isActive = active && item.id === active.id;
              const yearLabel =
                item.endYear && item.endYear !== item.year
                  ? `${item.year} - ${item.endYear}`
                  : String(item.year);
              return (
                <button
                  key={`star-${item.id}`}
                  type="button"
                  className={`scale-star${isActive ? " is-active" : ""}`}
                  style={{ left: `${ratio * 100}%` }}
                  aria-label={`${item.title}, ${yearLabel}`}
                  aria-describedby={
                    hoverTipId === item.id ? "scale-tip" : undefined
                  }
                  onPointerEnter={() => setHoverTipId(item.id)}
                  onPointerLeave={(event) => {
                    if (event.currentTarget.matches(":focus-visible") ||
                        event.currentTarget === document.activeElement) {
                      return;
                    }
                    setHoverTipId((id) => (id === item.id ? null : id));
                  }}
                  onFocus={() => setHoverTipId(item.id)}
                  onBlur={() =>
                    setHoverTipId((id) => (id === item.id ? null : id))
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    setActiveIndex(index);
                    setHoverTipId(item.id);
                  }}
                />
              );
            })}
          </div>
          {hoverTip ? (
            <div
              id="scale-tip"
              className="scale-tip"
              role="tooltip"
              style={{ left: `${hoverTipLeftPct}%` }}
            >
              <div className="scale-tip-media">
                <Portrait item={hoverTip} />
              </div>
              <p className="scale-tip-year">
                {hoverTip.endYear && hoverTip.endYear !== hoverTip.year
                  ? `${hoverTip.year} - ${hoverTip.endYear}`
                  : hoverTip.year}
              </p>
              <p className="scale-tip-title">{hoverTip.title}</p>
            </div>
          ) : null}
        </div>
      </footer>
    </div>
  );
}
