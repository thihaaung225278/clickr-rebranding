import HomeHero from "@/components/home/HomeHero";
import "@/components/home/HomeHero.css";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--surface)] text-[var(--ink)]">
      <HomeHero />

      <section
        aria-labelledby="home-story"
        className="mx-auto w-full max-w-3xl px-[6vw] py-16 sm:py-20"
      >
        <h2
          id="home-story"
          className="font-display text-2xl font-bold tracking-tight sm:text-3xl"
        >
          A company story in motion
        </h2>
        <p className="mt-3 max-w-xl font-sans text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">
          Walk the corridor from 2009 to 2026 — milestones, eras, and the work
          that shaped Clickr.
        </p>
      </section>
    </main>
  );
}
