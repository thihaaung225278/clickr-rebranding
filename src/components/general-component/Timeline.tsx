/**
 * Generic, reusable Timeline component.
 * Not tied to any dataset — pass any `TimelineItem[]` via `items`.
 * Server Component (no client interactivity needed).
 */

export interface TimelineItem {
  /** Stable unique key for the entry (e.g. slug or id). */
  id: string;
  /** Display label for the date/period (already formatted, e.g. "1509–1547"). */
  date: string;
  /** Entry title/heading. */
  title: string;
  /** Short 1-2 sentence description. */
  description: string;
  /** Mark entries whose claim/status is historically disputed. */
  disputed?: boolean;
}

export interface TimelineProps {
  items: TimelineItem[];
  /** Optional heading rendered above the list. */
  title?: string;
  className?: string;
}

export default function Timeline({ items, title, className = "" }: TimelineProps) {
  if (items.length === 0) return null;

  return (
    <section className={className}>
      {title ? (
        <h2 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {title}
        </h2>
      ) : null}

      <ol className="relative ml-3 border-l border-zinc-200 dark:border-zinc-800">
        {items.map((item) => (
          <li key={item.id} className="mb-8 ml-6 last:mb-0">
            <span
              aria-hidden="true"
              className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-zinc-400 dark:border-black dark:bg-zinc-600"
            />
            <time className="mb-1 block text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {item.date}
            </time>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              {item.title}
              {item.disputed ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  disputed
                </span>
              ) : null}
            </h3>
            <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {item.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
