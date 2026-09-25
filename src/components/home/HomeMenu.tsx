"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import "./HomeMenu.css";

const LINKS = [
  { href: "#home", label: "Home", index: "01" },
  { href: "#our-services", label: "Our Services", index: "02" },
  { href: "#company-timeline", label: "Company Timeline", index: "03" },
  { href: "#play-game", label: "Clickr Run", index: "04" },
  { href: "#life-culture", label: "Life / culture", index: "05" },
  { href: "#lets-talk", label: "Let's talk", index: "06" },
] as const;

/** Same asset as banner rail — 560×156 source. */
const WORDMARK = {
  src: "/brand/clickr-wordmark.webp",
  width: 560,
  height: 156,
} as const;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Home-only floating hamburger + brand overlay panel.
 * Mount under HandStrokeIntro so intro inert/z-index still wins.
 */
export default function HomeMenu() {
  const [open, setOpen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  openRef.current = open;

  const close = useCallback((opts?: { restoreFocus?: boolean }) => {
    setOpen(false);
    if (opts?.restoreFocus === false) return;
    window.requestAnimationFrame(() => toggleRef.current?.focus());
  }, []);

  const openMenu = useCallback(() => {
    setOpen(true);
  }, []);

  const toggle = useCallback(() => {
    if (openRef.current) close();
    else openMenu();
  }, [close, openMenu]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open || !sheetRef.current) return;
    const first = sheetRef.current.querySelector<HTMLElement>("a[href]");
    first?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onTab = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const sheetLinks = sheetRef.current
        ? Array.from(
            sheetRef.current.querySelectorAll<HTMLElement>("a[href]"),
          )
        : [];
      const nodes = [toggleRef.current, ...sheetLinks].filter(
        (node): node is HTMLElement => Boolean(node),
      );
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onTab);
    return () => window.removeEventListener("keydown", onTab);
  }, [open]);

  const goTo = (href: string) => {
    close({ restoreFocus: false });
    const id = href.slice(1);
    const target = document.getElementById(id);
    if (!target) {
      toggleRef.current?.focus();
      return;
    }
    target.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
    if (!target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1");
    }
    target.focus({ preventScroll: true });
  };

  return (
    <div className={`home-menu${open ? " home-menu--open" : ""}`}>
      <button
        ref={toggleRef}
        type="button"
        className="home-menu__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={toggle}
      >
        <span className="home-menu__burger" aria-hidden="true">
          <span className="home-menu__burger-line" />
          <span className="home-menu__burger-line" />
          <span className="home-menu__burger-line" />
        </span>
      </button>

      <div
        id={panelId}
        className="home-menu__panel"
        role="dialog"
        aria-modal={open || undefined}
        aria-label="Site menu"
        aria-hidden={open ? undefined : true}
        inert={!open}
      >
        <button
          type="button"
          className="home-menu__backdrop"
          tabIndex={-1}
          aria-label="Close menu"
          onClick={() => close()}
        />
        <div ref={sheetRef} className="home-menu__sheet">
          <p className="home-menu__brand">
            <Image
              src={WORDMARK.src}
              alt="Clickr"
              width={WORDMARK.width}
              height={WORDMARK.height}
              className="home-menu__brand-img"
            />
          </p>
          <nav className="home-menu__nav" aria-label="Home sections">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="home-menu__link"
                tabIndex={open ? 0 : -1}
                onClick={(event) => {
                  event.preventDefault();
                  goTo(link.href);
                }}
              >
                <span className="home-menu__index">{link.index}</span>
                <span className="home-menu__label">{link.label}</span>
              </a>
            ))}
          </nav>
          <p className="home-menu__foot">
            Media that moves brands forward.
          </p>
        </div>
      </div>
    </div>
  );
}
