"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp } from "@phosphor-icons/react";
import { scrollToInstant, wipeCover } from "@/lib/wipe";

const RING_RADIUS = 20;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const SHOW_THRESHOLD = 0.2;

/**
 * Floating circular scroll-to-top button with an SVG progress ring. The
 * button appears after scrolling past 20% of the page; clicking it plays the
 * shared curtain wipe (see `WipeCurtain` / `src/lib/wipe.ts`), scrolls to the
 * hero while the viewport is covered, then wipes away to reveal the page.
  * Hidden when the staggered menu is open and inactive at the top of the page.
 */
export function ScrollToTop() {
  const [progress, setProgress] = useState(0);
  const [shouldShow, setShouldShow] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollFrameRef = useRef<number | null>(null);

  // Coalesce Lenis' frequent scroll events into one state update per frame.
  useEffect(() => {
    const update = () => {
      scrollFrameRef.current = null;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) {
        setProgress(0);
      } else {
        setProgress(Math.min(window.scrollY / maxScroll, 1));
      }
    };

    const onScroll = () => {
      // This threshold controls interactivity, so update it synchronously even
      // when reduced-motion browsers defer animation frames.
      setShouldShow(window.scrollY > window.innerHeight * SHOW_THRESHOLD);
      if (scrollFrameRef.current === null) {
        scrollFrameRef.current = window.requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
    };
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
  // ── Scroll to top through the shared curtain wipe ──────────────────
  const handleClick = useCallback(() => {
    wipeCover(() => {
      scrollToInstant(0);
    });
  }, []);

  const shouldHide = menuOpen;

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
