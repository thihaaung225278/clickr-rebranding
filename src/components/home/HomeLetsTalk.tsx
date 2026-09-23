/**
 * Home closing CTA — one title, one line, one brand button.
 * Link matches banner “Get a diagnosis” (#talk-to-us).
 */

const TALK_HREF = "https://www.clickrmedia.com/growth-engine/#talk-to-us";

export default function HomeLetsTalk() {
  return (
    <section
      aria-labelledby="home-lets-talk-title"
      className="bg-[var(--surface)]"
    >
      <div className="mx-auto flex w-full max-w-[78rem] flex-col items-center px-[clamp(1.25rem,5vw,3rem)] py-[clamp(4rem,10vh,7rem)] text-center">
        <h2
          id="home-lets-talk-title"
          className="font-display text-[clamp(1.75rem,4vw,2.75rem)] font-bold tracking-tight text-[var(--ink)]"
        >
          Let&apos;s talk
        </h2>
        <p className="mt-4 max-w-xl font-sans text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">
          Stretched thin? Tell us where your marketing is stuck — we&apos;ll map
          a clearer next step.
        </p>
        <a
          href={TALK_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center justify-center border border-brand bg-brand px-6 py-3 font-sans text-xs font-semibold uppercase tracking-wide text-white transition-[transform,background-color,border-color] duration-300 hover:border-[#e85f00] hover:bg-[#e85f00] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ink)] active:scale-[0.98]"
        >
          Let&apos;s talk
        </a>
      </div>
    </section>
  );
}
