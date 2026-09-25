/**
 * Home site footer — soft brand wash · wordmark · socials · section nav · copyright.
 */

import Image from "next/image";
import type { ReactNode } from "react";

const SITE_HREF = "https://www.clickrmedia.com/";
const TALK_HREF = "https://www.clickrmedia.com/growth-engine/#talk-to-us";

const WORDMARK = {
  src: "/brand/clickr-wordmark.webp",
  width: 560,
  height: 156,
} as const;

const NAV = [
  { href: "#home", label: "Home" },
  { href: "#our-services", label: "Our Services" },
  { href: "#play-game", label: "Clickr Run" },
  { href: "#company-timeline", label: "Company Timeline" },
  { href: "#lets-talk", label: "Let's talk" },
  { href: "#visit", label: "Visit us" },
  { href: "#watch", label: "Watch Clickr" },
] as const;

/** FB/IG from Clickr public profiles; YT/TikTok — confirm if handles differ. */
const SOCIAL = [
  {
    href: "https://www.facebook.com/clickrmedia",
    label: "Facebook",
    icon: IconFacebook,
  },
  {
    href: "https://www.instagram.com/clickrsg",
    label: "Instagram",
    icon: IconInstagram,
  },
  {
    href: "https://www.youtube.com/@clickrmedia",
    label: "YouTube",
    icon: IconYouTube,
  },
  {
    href: "https://www.tiktok.com/@clickrmedia",
    label: "TikTok",
    icon: IconTikTok,
  },
] as const;

function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1z"
      />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none">
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="4.5"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

function IconYouTube() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none">
      <rect
        x="2.5"
        y="5.5"
        width="19"
        height="13"
        rx="3.5"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path fill="currentColor" d="M10.5 9.2v5.6L15.8 12 10.5 9.2z" />
    </svg>
  );
}

function IconTikTok() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.6 4.2c.7 1.7 2.1 3 3.9 3.4v2.5c-1.4-.1-2.7-.5-3.9-1.3v5.6c0 3.4-2.7 6.1-6.1 6.1S4.4 17.8 4.4 14.4 7.1 8.3 10.5 8.3c.3 0 .6 0 .9.1v2.6c-.3-.1-.6-.1-.9-.1-1.9 0-3.5 1.6-3.5 3.5s1.6 3.5 3.5 3.5 3.5-1.6 3.5-3.5V4.2h2.6z"
      />
    </svg>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} (opens in a new tab)`}
      className="inline-flex size-10 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--brand)_28%,transparent)] text-[var(--ink-muted)] transition-[color,background-color,border-color,transform] duration-300 hover:border-brand hover:bg-brand hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ink)] active:scale-[0.96]"
    >
      {children}
    </a>
  );
}

export default function HomeFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      id="site-footer"
      className="home-footer relative isolate overflow-hidden text-[var(--ink)]"
      style={{
        background:
          "linear-gradient(165deg, color-mix(in oklab, var(--brand) 14%, #ffffff) 0%, color-mix(in oklab, var(--brand) 7%, #ffffff) 45%, color-mix(in oklab, var(--brand) 4%, var(--surface)) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-brand/40"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-[78rem] px-[clamp(1.25rem,5vw,3rem)] py-[clamp(3rem,8vh,5rem)]">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between sm:gap-12">
          <div className="min-w-0 max-w-sm">
            <p className="m-0 leading-none">
              <Image
                src={WORDMARK.src}
                alt="Clickr"
                width={WORDMARK.width}
                height={WORDMARK.height}
                className="home-footer__wordmark block h-auto w-[clamp(7rem,28vw,9.5rem)]"
              />
            </p>
            <p className="mt-4 font-sans text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
              Media that moves brands forward.
            </p>

            <ul className="mt-6 flex list-none flex-wrap items-center gap-2.5 p-0">
              {SOCIAL.map((item) => (
                <li key={item.href}>
                  <SocialLink href={item.href} label={item.label}>
                    <item.icon />
                  </SocialLink>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Footer" className="min-w-0">
            <ul className="m-0 flex list-none flex-col gap-3 p-0 sm:items-end">
              {NAV.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="font-sans text-sm font-medium tracking-wide text-[var(--ink)] transition-colors duration-300 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ink)]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={TALK_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-sm font-semibold tracking-wide text-brand transition-opacity duration-300 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ink)]"
                >
                  Get a diagnosis
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-[clamp(2.5rem,6vh,3.5rem)] flex flex-col gap-3 border-t border-[color-mix(in_oklab,var(--brand)_22%,transparent)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0 font-sans text-xs tracking-wide text-[var(--ink-muted)]">
            © {year} Clickr Media. All rights reserved.
          </p>
          <a
            href={SITE_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-xs tracking-wide text-[var(--ink-muted)] transition-colors duration-300 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ink)]"
          >
            clickrmedia.com
          </a>
        </div>
      </div>
    </footer>
  );
}
