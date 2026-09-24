/**
 * Home Clickr Run CTA — brand band; copy left, Play Game right.
 * Mounted mid-page and again above the footer. Pass unique `id` / `titleId` when repeated.
 */

const GAME_HREF = "https://clickr-run.netlify.app/";

type HomePlayGameProps = {
  id?: string;
  titleId?: string;
};

export default function HomePlayGame({
  id = "play-game",
  titleId = "home-play-game-title",
}: HomePlayGameProps) {
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className="bg-[var(--brand)]"
    >
      <div className="mx-auto flex w-full max-w-[78rem] flex-col items-stretch gap-5 px-[clamp(1.25rem,5vw,3rem)] py-[clamp(1.75rem,4vh,2.75rem)] sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="min-w-0 text-left">
          <h2
            id={titleId}
            className="font-display text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold tracking-tight text-white"
          >
            Clickr Run
          </h2>
          <p className="mt-2 max-w-xl font-sans text-sm leading-relaxed text-white/90 sm:text-base">
            Ruins await — dodge, jump, and slide through the temple path.
          </p>
        </div>
        <a
          href={GAME_HREF}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Play Clickr Run (opens in a new tab)"
          className="inline-flex shrink-0 items-center justify-center self-start border border-white bg-white px-6 py-3 font-sans text-xs font-semibold uppercase tracking-wide text-[var(--brand)] transition-[transform,background-color,border-color,color] duration-300 hover:border-white/90 hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-[0.98] sm:self-center"
        >
          Play Game
        </a>
      </div>
    </section>
  );
}
