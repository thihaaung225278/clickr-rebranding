/**
 * Home full-bleed video — YouTube nocookie embed when an id is set,
 * otherwise a local `<video>` when FILE_SRC is set, otherwise channel CTA.
 *
 * Set YOUTUBE_ID (preferred) or FILE_SRC (e.g. `/video/clickr-reel.mp4`) when ready.
 */

const YOUTUBE_ID = "";
/** Local file under `public/` — leave empty until the file exists. */
const FILE_SRC = "";
const YOUTUBE_CHANNEL = "https://www.youtube.com/@clickrmedia";

function youtubeEmbedSrc(id: string) {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

export default function HomeVideo() {
  const youtubeId = YOUTUBE_ID.trim();
  const fileSrc = FILE_SRC.trim();
  const hasYoutube = youtubeId.length > 0;
  const hasFile = !hasYoutube && fileSrc.length > 0;

  return (
    <section
      id="watch"
      aria-labelledby="home-video-title"
      className="bg-[var(--ink)] text-white"
    >
      <div className="mx-auto w-full max-w-[78rem] px-[clamp(1.25rem,5vw,3rem)] pt-[clamp(3.5rem,8vh,5.5rem)]">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="home-video-title"
            className="font-display text-[clamp(1.75rem,4vw,2.75rem)] font-bold tracking-tight"
          >
            Watch Clickr
          </h2>
          <p className="mt-4 font-sans text-base leading-relaxed text-white/75 sm:text-lg">
            A fuller look at how we move brands forward.
          </p>
        </div>
      </div>

      <div className="relative mt-[clamp(2rem,5vh,3rem)] aspect-video w-full overflow-hidden bg-black">
        {hasYoutube ? (
          <iframe
            title="Clickr video"
            src={youtubeEmbedSrc(youtubeId)}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : hasFile ? (
          <video
            controls
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src={fileSrc} type="video/mp4" />
            <a href={YOUTUBE_CHANNEL} target="_blank" rel="noopener noreferrer">
              Watch on YouTube
            </a>
          </video>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[linear-gradient(165deg,color-mix(in_oklab,var(--brand)_55%,#111)_0%,#111_70%)] px-6 text-center">
            <p className="m-0 max-w-md font-sans text-sm leading-relaxed text-white/85 sm:text-base">
              Full reel coming soon — watch more from Clickr on YouTube in the
              meantime.
            </p>
            <a
              href={YOUTUBE_CHANNEL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center border border-white bg-white px-6 py-3 font-sans text-xs font-semibold uppercase tracking-wide text-[var(--brand)] transition-[transform,background-color,border-color,color] duration-300 hover:border-white/90 hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-[0.98]"
            >
              Watch on YouTube
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
