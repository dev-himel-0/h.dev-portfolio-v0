"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowUp } from "@phosphor-icons/react";
import { wipeCover } from "@/lib/wipe";

const RING_RADIUS = 20;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const SHOW_THRESHOLD = 0.2;

/**
 * Floating circular scroll-to-top button with an SVG progress ring. The
 * button appears after scrolling past 20% of the page; clicking it plays the
 * shared curtain wipe (see `WipeCurtain` / `src/lib/wipe.ts`), scrolls to the
 * hero while the viewport is covered, then wipes away to reveal the page.
 * Hidden when the staggered menu is open or while the preloader is active.
 */
export function ScrollToTop() {
  const [progress, setProgress] = useState(0);
  const [shouldShow, setShouldShow] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // ── Scroll progress tracking ──────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) {
        setProgress(0);
        return;
      }
      setProgress(Math.min(window.scrollY / maxScroll, 1));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Visibility: show after 20% scroll, hide when menu is open ─────
  useEffect(() => {
    const threshold = window.innerHeight * SHOW_THRESHOLD;

    const update = () => {
      setShouldShow(window.scrollY > threshold);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  // ── Detect staggered menu open (DOM observation) ──────────────────
  useEffect(() => {
    const check = () => {
      const smg = document.querySelector<HTMLElement>(".smg");
      setMenuOpen(smg?.hasAttribute("data-open") ?? false);
    };

    check();

    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: ["data-open"],
    });

    return () => observer.disconnect();
  }, []);

  const visible = shouldShow && !menuOpen;

  // ── Detect preloader active ───────────────────────────────────────
  const [preloaderActive, setPreloaderActive] = useState(true);

  useEffect(() => {
    const check = () => {
      const panels = document.querySelectorAll("[data-curtain-panel]");
      setPreloaderActive(panels.length > 0);
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // ── Scroll to top through the shared curtain wipe ──────────────────
  const handleClick = useCallback(() => {
    wipeCover(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  }, []);

  const shouldHide = menuOpen || preloaderActive;

  return (
    <>
      {/* Scroll-to-top button */}
      <button
        type="button"
        data-scroll-to-top
        aria-label="Scroll to top"
        onClick={handleClick}
        className="stt-button"
        data-visible={visible && !shouldHide ? "" : undefined}
      >
        <svg
          viewBox="0 0 48 48"
          className="stt-ring"
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx="24"
            cy="24"
            r={RING_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.15"
          />
          {/* Progress */}
          <circle
            cx="24"
            cy="24"
            r={RING_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
            className="stt-progress"
          />
        </svg>
        <ArrowUp weight="bold" className="stt-arrow" aria-hidden="true" />
        <ArrowUp
          weight="bold"
          className="stt-arrow stt-arrow-ghost"
          aria-hidden="true"
        />
      </button>
    </>
  );
}
