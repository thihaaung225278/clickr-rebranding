"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import "./HomeFullVideo.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const LEAD = {
  src: "/culture/films/lead.mp4",
  poster: "/culture/films/lead.jpg",
  title: "Full video",
} as const;

const FILMS = [
  {
    id: "film-01",
    src: "/culture/life-film.mp4",
    poster: "/culture/life-film-poster.jpg",
    title: "Film 01",
  },
  {
    id: "film-02",
    src: "/culture/films/just-claude-it.mp4",
    poster: "/culture/films/just-claude-it.jpg",
    title: "Film 02",
  },
  {
    id: "film-03",
    src: "/culture/films/vietnam-table.mov",
    poster: "/culture/films/vietnam-table.jpg",
    title: "Film 03",
  },
] as const;

type HomeFullVideoProps = {
  /** Page intro has finished, so scroll positions are stable. */
  armed?: boolean;
};

export default function HomeFullVideo({ armed = false }: HomeFullVideoProps) {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!armed || !root) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const videos = () =>
        [...root.querySelectorAll("video")] as HTMLVideoElement[];

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: root,
          start: "top 75%",
          toggleActions: "play none none reverse",
        },
        onComplete: () => {
          videos().forEach((video) => {
            void video.play();
          });
        },
        onReverseComplete: () => {
          videos().forEach((video) => video.pause());
        },
      });

      tl.from(".life-film__lead", {
        y: 28,
        autoAlpha: 0,
        duration: 0.75,
      }).from(
        ".life-film__col",
        {
          y: 40,
          autoAlpha: 0,
          stagger: 0.12,
          duration: 0.85,
        },
        "-=0.35",
      );
    },
    { scope: rootRef, dependencies: [armed], revertOnUpdate: true },
  );

  return (
    <section
      ref={rootRef}
      id="life-film"
      aria-labelledby="home-life-film-title"
      className="life-film bg-[#101010] text-white"
    >
      <div className="mx-auto w-full max-w-[78rem] px-[clamp(1.25rem,5vw,3rem)] py-[clamp(3.5rem,8vh,5.5rem)]">
        <h2
          id="home-life-film-title"
          className="text-center font-display text-[clamp(1.75rem,4vw,2.75rem)] font-bold tracking-tight"
        >
          Where the work clicks, and so do we.
        </h2>
        <p className="mx-auto mt-3 max-w-3xl text-center font-sans text-base leading-relaxed text-white/70 sm:text-lg">
          Different countries, various ways of thinking, we write everything down, to streamline the way of working.
        </p>

        <FilmFrame
          className="life-film__lead relative mt-[clamp(1.75rem,4vw,2.75rem)] aspect-video overflow-hidden rounded-[1rem] bg-black sm:rounded-[1.35rem]"
          src={LEAD.src}
          poster={LEAD.poster}
          title={LEAD.title}
        />

        <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-5 sm:gap-4 md:gap-5">
          {FILMS.map((film) => (
            <FilmColumn key={film.id} film={film} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FilmColumn({ film }: { film: (typeof FILMS)[number] }) {
  return (
    <article className="life-film__col min-w-0">
      <FilmFrame
        className="relative aspect-[9/16] overflow-hidden rounded-[1rem] bg-black sm:rounded-[1.35rem]"
        src={film.src}
        poster={film.poster}
        title={film.title}
      />
      <p className="mt-3 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-white/55 sm:text-sm">
        {film.title}
      </p>
    </article>
  );
}

function FilmFrame({
  src,
  poster,
  title,
  className,
}: {
  src: string;
  poster: string;
  title: string;
  className: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  function toggleFilm() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  }

  return (
    <div className={className}>
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={src}
        poster={poster}
        playsInline
        muted
        loop
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        className="absolute inset-0 cursor-pointer border-0 bg-transparent focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-white"
        aria-label={playing ? `Pause ${title}` : `Play ${title}`}
        onClick={toggleFilm}
      />
      <span
        className={`pointer-events-none absolute bottom-3 left-3 inline-flex size-9 items-center justify-center rounded-full border border-white/80 bg-black/35 text-white backdrop-blur-sm transition-opacity duration-300 sm:bottom-4 sm:left-4 sm:size-12 ${
          playing ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
          <path fill="currentColor" d="M9 7.5v9l8-4.5-8-4.5z" />
        </svg>
      </span>
    </div>
  );
}
